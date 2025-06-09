import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PriceDisplay } from "@/components/ui/price-display";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  CreditCard
} from "lucide-react";

interface CartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  type: string;
  currency?: string;
}

interface CartDrawerProps {
  creatorId: number;
  trigger?: React.ReactNode;
}

export default function CartDrawer({ creatorId, trigger }: CartDrawerProps) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      const cartKey = `cart_${creatorId}`;
      const savedCart = localStorage.getItem(cartKey);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    };

    loadCart();
    
    // Listen for cart updates
    window.addEventListener('cart-updated', loadCart);
    return () => window.removeEventListener('cart-updated', loadCart);
  }, [creatorId]);

  const updateQuantity = (productId: number, newQuantity: number) => {
    const cartKey = `cart_${creatorId}`;
    let updatedCart: CartItem[];

    if (newQuantity <= 0) {
      updatedCart = cartItems.filter(item => item.productId !== productId);
    } else {
      updatedCart = cartItems.map(item =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
    }

    setCartItems(updatedCart);
    localStorage.setItem(cartKey, JSON.stringify(updatedCart));
    
    // Dispatch custom event for cart updates
    window.dispatchEvent(new CustomEvent('cart-updated'));
    
    toast({
      title: "Cart updated",
      description: newQuantity === 0 ? "Item removed from cart" : "Quantity updated",
    });
  };

  const removeItem = (productId: number) => {
    updateQuantity(productId, 0);
  };

  const clearCart = () => {
    const cartKey = `cart_${creatorId}`;
    setCartItems([]);
    localStorage.removeItem(cartKey);
    window.dispatchEvent(new CustomEvent('cart-updated'));
    toast({
      title: "Cart cleared",
      description: "All items removed from cart",
    });
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add some items to your cart before checkout",
        variant: "destructive",
      });
      return;
    }
    setIsOpen(false);
    setLocation(`/checkout/${creatorId}`);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const defaultTrigger = (
    <Button variant="outline" size="sm" className="relative">
      <ShoppingCart className="h-4 w-4" />
      {totalItems > 0 && (
        <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
          {totalItems}
        </Badge>
      )}
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping Cart ({totalItems} items)
          </SheetTitle>
          <SheetDescription>
            Review your items before checkout
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {cartItems.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <Package className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-600 mb-4">Add some products to get started</p>
              <Button onClick={() => setIsOpen(false)}>
                Continue Shopping
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto py-4">
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                          <PriceDisplay
                            originalPrice={item.price}
                            originalCurrency={item.currency || "KES"}
                            size="sm"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <PriceDisplay
                    originalPrice={totalAmount}
                    originalCurrency="KES"
                    size="lg"
                    className="font-bold"
                  />
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Button 
                    onClick={proceedToCheckout}
                    className="w-full"
                    size="lg"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={clearCart}
                    className="w-full"
                    size="sm"
                  >
                    Clear Cart
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}