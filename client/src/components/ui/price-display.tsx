import { useCurrency } from "@/contexts/CurrencyContext";
import { Badge } from "@/components/ui/badge";
import { ArrowRightLeft } from "lucide-react";

interface PriceDisplayProps {
  originalPrice: number;
  originalCurrency: string;
  className?: string;
  showConversionIndicator?: boolean;
  size?: "sm" | "md" | "lg";
}

export function PriceDisplay({ 
  originalPrice, 
  originalCurrency, 
  className = "", 
  showConversionIndicator = true,
  size = "md"
}: PriceDisplayProps) {
  const { formatPrice, convertPrice, currentCurrency } = useCurrency();
  
  const convertedPrice = convertPrice(originalPrice, originalCurrency);
  const isConverted = originalCurrency !== currentCurrency;
  
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg font-bold",
    lg: "text-xl font-bold"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className={`text-gray-900 ${sizeClasses[size]}`}>
        {formatPrice(convertedPrice)}
      </span>
      
      {isConverted && showConversionIndicator && (
        <Badge variant="secondary" className="text-xs gap-1">
          <ArrowRightLeft className="h-3 w-3" />
          from {originalCurrency}
        </Badge>
      )}
    </div>
  );
}