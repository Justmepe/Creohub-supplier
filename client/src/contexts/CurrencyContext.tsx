import { createContext, useContext, useState, useEffect } from "react";
import { SUPPORTED_CURRENCIES, detectCurrencyFromBrowser, formatCurrency, convertCurrency } from "@shared/currency";

interface CurrencyContextType {
  currentCurrency: string;
  currency: string; // Alias for currentCurrency
  setCurrency: (currency: string) => void;
  formatPrice: (amount: number, currency?: string) => string;
  convertPrice: (amount: number, fromCurrency: string, toCurrency?: string) => number;
  supportedCurrencies: typeof SUPPORTED_CURRENCIES;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

interface CurrencyProviderProps {
  children: React.ReactNode;
}

export function CurrencyProvider({ children }: CurrencyProviderProps) {
  const [currentCurrency, setCurrentCurrency] = useState<string>('USD');
  const [isLoading, setIsLoading] = useState(true);

  // Auto-detect currency on component mount
  useEffect(() => {
    const detectUserCurrency = async () => {
      try {
        // Try to get user's location-based currency
        const detectedCurrency = await detectCurrencyFromLocation();
        
        // Fallback to browser/timezone detection
        const fallbackCurrency = detectedCurrency || detectCurrencyFromBrowser();
        
        // Check if detected currency is supported
        if (SUPPORTED_CURRENCIES[fallbackCurrency]) {
          setCurrentCurrency(fallbackCurrency);
        }
        
        // Load saved preference from localStorage
        const savedCurrency = localStorage.getItem('preferred_currency');
        if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
          setCurrentCurrency(savedCurrency);
        }
      } catch (error) {
        console.error('Currency detection failed:', error);
        // Default to USD if detection fails
        setCurrentCurrency('USD');
      } finally {
        setIsLoading(false);
      }
    };

    detectUserCurrency();
  }, []);

  // Detect currency from user's IP location
  const detectCurrencyFromLocation = async (): Promise<string | null> => {
    try {
      // Use a free IP geolocation service
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      
      if (data.country_code) {
        // Find currency by country code
        for (const [currencyCode, info] of Object.entries(SUPPORTED_CURRENCIES)) {
          if (info.countries.includes(data.country_code)) {
            return currencyCode;
          }
        }
      }
    } catch (error) {
      console.error('IP-based currency detection failed:', error);
    }
    return null;
  };

  const setCurrency = (currency: string) => {
    if (SUPPORTED_CURRENCIES[currency]) {
      setCurrentCurrency(currency);
      localStorage.setItem('preferred_currency', currency);
    }
  };

  const formatPrice = (amount: number, currency?: string): string => {
    const currencyToUse = currency || currentCurrency;
    return formatCurrency(amount, currencyToUse);
  };

  const convertPrice = (amount: number, fromCurrency: string, toCurrency?: string): number => {
    const targetCurrency = toCurrency || currentCurrency;
    return convertCurrency(amount, fromCurrency, targetCurrency);
  };

  const value: CurrencyContextType = {
    currentCurrency,
    currency: currentCurrency, // Alias for compatibility
    setCurrency,
    formatPrice,
    convertPrice,
    supportedCurrencies: SUPPORTED_CURRENCIES,
    isLoading,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}