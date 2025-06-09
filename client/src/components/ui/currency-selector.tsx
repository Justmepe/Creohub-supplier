import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from "@/contexts/CurrencyContext";

export function CurrencySelector() {
  const { currentCurrency, setCurrency, supportedCurrencies, isLoading } = useCurrency();

  if (isLoading) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Globe className="h-4 w-4 mr-2" />
        Loading...
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          {supportedCurrencies[currentCurrency]?.symbol} {currentCurrency}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(supportedCurrencies).map(([code, info]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setCurrency(code)}
            className="flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg">{info.symbol}</span>
              <span>{info.name}</span>
            </span>
            <span className="text-xs text-muted-foreground">{code}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}