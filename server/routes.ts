import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getSocialProofData } from "./services/socialProof";
import multer from "multer";
import path from "path";
import fs from "fs";
import express from "express";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Payment configuration (African focus)
  app.get("/api/payments/config", async (req: Request, res: Response) => {
    try {
      res.json({
        availablePaymentMethods: [
          'pesapal',
          'mpesa',
          'bank_transfer'
        ],
        defaultCurrency: 'KES',
        supportedCountries: ['KE', 'UG', 'TZ', 'RW', 'NG', 'GH', 'ZA']
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch payment config" });
    }
  });

  // Social proof system
  app.get("/api/social-proof", async (req: Request, res: Response) => {
    try {
      const socialProofData = await getSocialProofData();
      res.json({ data: socialProofData });
    } catch (error: any) {
      console.error("Social proof error:", error);
      res.status(500).json({ message: "Failed to fetch social proof data" });
    }
  });

  // Serve uploaded files
  app.use("/uploads", express.static(uploadDir));
  
  // Handle client-side routing
  app.get("*", (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), "server/public/index.html"));
  });

  const httpServer = createServer(app);
  return httpServer;
}