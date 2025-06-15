import { storage } from "./storage";

export interface ProductSyncResult {
  success: boolean;
  totalProducts: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  newProducts: number;
  updatedProducts: number;
  errors: string[];
}

export interface ExternalProduct {
  id: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  images?: string[];
  stock?: number;
  sku?: string;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  tags?: string[];
}

export class ProductSyncService {
  async syncProducts(partnerId: number, triggeredBy: number): Promise<ProductSyncResult> {
    const partner = await storage.getDropshippingPartner(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    if (partner.productImportMethod === "manual") {
      throw new Error("Partner uses manual product entry");
    }

    const syncLog = await storage.createProductSyncLog({
      partnerId,
      syncType: partner.productImportMethod,
      status: "started",
      dataSource: partner.apiEndpoint || "unknown",
      triggeredBy,
    });

    const result: ProductSyncResult = {
      success: false,
      totalProducts: 0,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      newProducts: 0,
      updatedProducts: 0,
      errors: [],
    };

    try {
      let products: ExternalProduct[] = [];

      if (partner.productImportMethod === "api") {
        products = await this.fetchProductsFromAPI(partner);
      } else if (partner.productImportMethod === "csv") {
        // CSV import would be handled separately via file upload
        throw new Error("CSV import should be handled via file upload endpoint");
      }

      result.totalProducts = products.length;

      for (const externalProduct of products) {
        try {
          const existingProduct = await storage.getDropshippingProductByExternalId(
            partnerId,
            externalProduct.id
          );

          const productData = {
            partnerId,
            externalId: externalProduct.id,
            importSource: partner.productImportMethod,
            name: externalProduct.name,
            description: externalProduct.description || "",
            category: externalProduct.category || "General",
            wholesalePrice: externalProduct.price.toString(),
            retailPrice: (externalProduct.price * 1.5).toString(), // 50% markup default
            stock: externalProduct.stock || 0,
            sku: externalProduct.sku || "",
            images: externalProduct.images || [],
            weight: externalProduct.weight?.toString() || "0",
            dimensions: externalProduct.dimensions || null,
            processingTime: "2-5 business days",
            commissionRate: partner.defaultCommissionRate?.toString() || "10.00",
            tags: externalProduct.tags || [],
          };

          if (existingProduct) {
            await storage.updateDropshippingProduct(existingProduct.id, productData);
            result.updatedProducts++;
          } else {
            await storage.createDropshippingProduct(productData);
            result.newProducts++;
          }

          result.successCount++;
        } catch (error) {
          result.errorCount++;
          result.errors.push(`Product ${externalProduct.id}: ${error.message}`);
        }
      }

      result.success = result.errorCount === 0 || result.successCount > 0;

      await storage.updateProductSyncLog(syncLog.id, {
        status: result.success ? "success" : "error",
        totalProducts: result.totalProducts,
        successCount: result.successCount,
        errorCount: result.errorCount,
        skippedCount: result.skippedCount,
        newProducts: result.newProducts,
        updatedProducts: result.updatedProducts,
        errorDetails: result.errors,
        completedAt: new Date(),
      });

      // Update partner sync status
      await storage.updateDropshippingPartner(partnerId, {
        lastSyncAt: new Date(),
        syncStatus: result.success ? "success" : "error",
        syncErrorMessage: result.errors.length > 0 ? result.errors[0] : null,
      });

    } catch (error) {
      result.success = false;
      result.errors.push(error.message);

      await storage.updateProductSyncLog(syncLog.id, {
        status: "error",
        errorDetails: result.errors,
        completedAt: new Date(),
      });

      await storage.updateDropshippingPartner(partnerId, {
        syncStatus: "error",
        syncErrorMessage: error.message,
      });
    }

    return result;
  }

  private async fetchProductsFromAPI(partner: any): Promise<ExternalProduct[]> {
    if (!partner.apiEndpoint) {
      throw new Error("API endpoint not configured");
    }

    const headers: any = {
      "Content-Type": "application/json",
      "User-Agent": "Creohub-Sync/1.0",
    };

    if (partner.apiKey) {
      headers["Authorization"] = `Bearer ${partner.apiKey}`;
      // Also try common API key header formats
      headers["X-API-Key"] = partner.apiKey;
      headers["API-Key"] = partner.apiKey;
    }

    const response = await fetch(partner.apiEndpoint, {
      method: "GET",
      headers,
      timeout: 30000, // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Handle different API response formats
    let products: any[] = [];
    if (Array.isArray(data)) {
      products = data;
    } else if (data.products && Array.isArray(data.products)) {
      products = data.products;
    } else if (data.data && Array.isArray(data.data)) {
      products = data.data;
    } else if (data.items && Array.isArray(data.items)) {
      products = data.items;
    } else {
      throw new Error("Invalid API response format - expected array of products");
    }

    return products.map(this.normalizeProduct);
  }

  private normalizeProduct(product: any): ExternalProduct {
    // Normalize different product data formats to our standard format
    return {
      id: product.id || product.product_id || product.sku || product.external_id,
      name: product.name || product.title || product.product_name,
      description: product.description || product.desc || product.product_description,
      category: product.category || product.product_category || product.type,
      price: parseFloat(product.price || product.wholesale_price || product.cost || "0"),
      images: this.normalizeImages(product.images || product.photos || product.image_urls || []),
      stock: parseInt(product.stock || product.inventory || product.quantity || "0"),
      sku: product.sku || product.product_code || product.item_code,
      weight: parseFloat(product.weight || "0"),
      dimensions: this.normalizeDimensions(product.dimensions || product.size),
      tags: Array.isArray(product.tags) ? product.tags : [],
    };
  }

  private normalizeImages(images: any): string[] {
    if (!images) return [];
    if (typeof images === "string") return [images];
    if (Array.isArray(images)) {
      return images.map(img => typeof img === "string" ? img : img.url || img.src || "").filter(Boolean);
    }
    return [];
  }

  private normalizeDimensions(dimensions: any): { length: number; width: number; height: number } | null {
    if (!dimensions) return null;
    
    const length = parseFloat(dimensions.length || dimensions.l || "0");
    const width = parseFloat(dimensions.width || dimensions.w || "0");
    const height = parseFloat(dimensions.height || dimensions.h || "0");
    
    if (length > 0 || width > 0 || height > 0) {
      return { length, width, height };
    }
    
    return null;
  }

  async processCsvImport(partnerId: number, csvData: string, triggeredBy: number): Promise<ProductSyncResult> {
    const partner = await storage.getDropshippingPartner(partnerId);
    if (!partner) {
      throw new Error("Partner not found");
    }

    const syncLog = await storage.createProductSyncLog({
      partnerId,
      syncType: "csv",
      status: "started",
      dataSource: "CSV Upload",
      triggeredBy,
    });

    const result: ProductSyncResult = {
      success: false,
      totalProducts: 0,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      newProducts: 0,
      updatedProducts: 0,
      errors: [],
    };

    try {
      const products = this.parseCsvData(csvData);
      result.totalProducts = products.length;

      for (const product of products) {
        try {
          const existingProduct = await storage.getDropshippingProductByExternalId(
            partnerId,
            product.id
          );

          const productData = {
            partnerId,
            externalId: product.id,
            importSource: "csv",
            name: product.name,
            description: product.description || "",
            category: product.category || "General",
            wholesalePrice: product.price.toString(),
            retailPrice: (product.price * 1.5).toString(),
            stock: product.stock || 0,
            sku: product.sku || "",
            images: product.images || [],
            weight: product.weight?.toString() || "0",
            dimensions: product.dimensions || null,
            processingTime: "2-5 business days",
            commissionRate: partner.defaultCommissionRate?.toString() || "10.00",
            tags: product.tags || [],
          };

          if (existingProduct) {
            await storage.updateDropshippingProduct(existingProduct.id, productData);
            result.updatedProducts++;
          } else {
            await storage.createDropshippingProduct(productData);
            result.newProducts++;
          }

          result.successCount++;
        } catch (error) {
          result.errorCount++;
          result.errors.push(`Row ${result.successCount + result.errorCount}: ${error.message}`);
        }
      }

      result.success = result.errorCount === 0 || result.successCount > 0;

      await storage.updateProductSyncLog(syncLog.id, {
        status: result.success ? "success" : "error",
        totalProducts: result.totalProducts,
        successCount: result.successCount,
        errorCount: result.errorCount,
        newProducts: result.newProducts,
        updatedProducts: result.updatedProducts,
        errorDetails: result.errors,
        completedAt: new Date(),
      });

    } catch (error) {
      result.success = false;
      result.errors.push(error.message);

      await storage.updateProductSyncLog(syncLog.id, {
        status: "error",
        errorDetails: result.errors,
        completedAt: new Date(),
      });
    }

    return result;
  }

  private parseCsvData(csvData: string): ExternalProduct[] {
    const lines = csvData.trim().split('\n');
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const products: ExternalProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const product: any = {};

      headers.forEach((header, index) => {
        if (values[index]) {
          product[header] = values[index];
        }
      });

      products.push(this.normalizeProduct(product));
    }

    return products;
  }
}

export const productSyncService = new ProductSyncService();