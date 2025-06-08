import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Globe } from 'lucide-react';
import { SUPPORTED_CURRENCIES, detectCurrencyFromBrowser, formatCurrency } from '@/../../shared/currency';

interface CurrencySelectorProps {
  value?: string;
  onValueChange: (currency: string) => void;
  showDetected?: boolean;
}

export default function CurrencySelector({ value, onValueChange, showDetected = true }: CurrencySelectorProps) {
  const [detectedCurrency, setDetectedCurrency] = useState('USD');

  useEffect(() => {
    const detected = detectCurrencyFromBrowser();
    setDetectedCurrency(detected);
    
    // Auto-select detected currency if no value is set
    if (!value && detected) {
      onValueChange(detected);
    }
  }, [value, onValueChange]);

  return (
    <div className="space-y-2">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select currency" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(SUPPORTED_CURRENCIES).map((currency) => (
            <SelectItem key={currency.code} value={currency.code}>
              <div className="flex items-center justify-between w-full">
                <span>{currency.symbol} {currency.code}</span>
                <span className="text-sm text-muted-foreground ml-2">{currency.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {showDetected && detectedCurrency && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Globe className="w-4 h-4" />
          <span>
            Auto-detected: <strong>{SUPPORTED_CURRENCIES[detectedCurrency]?.name}</strong>
          </span>
          {detectedCurrency !== value && (
            <Badge 
              variant="outline" 
              className="cursor-pointer"
              onClick={() => onValueChange(detectedCurrency)}
            >
              Use detected
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}