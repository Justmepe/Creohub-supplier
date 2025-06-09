import { useCurrency } from "@/contexts/CurrencyContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Globe, CheckCircle } from "lucide-react";

export function CurrencyStatus() {
  const { currentCurrency, supportedCurrencies, isLoading } = useCurrency();
  
  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="flex items-center gap-3 p-4">
          <Globe className="h-5 w-5 text-blue-500 animate-pulse" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-900">Detecting your currency...</p>
            <p className="text-xs text-blue-600">Based on your location</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currencyInfo = supportedCurrencies[currentCurrency];
  
  return (
    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-green-600" />
          <CheckCircle className="h-4 w-4 text-green-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-green-900">
            Prices shown in {currencyInfo?.name} ({currencyInfo?.symbol})
          </p>
          <p className="text-xs text-green-600">
            Auto-detected • Change anytime using the currency selector
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          {currentCurrency}
        </Badge>
      </CardContent>
    </Card>
  );
}