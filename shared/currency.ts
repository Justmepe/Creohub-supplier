export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  countries: string[];
  exchangeRate?: number; // USD base rate
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyInfo> = {
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    countries: ['US', 'PR', 'VG', 'VI'],
    exchangeRate: 1
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    countries: ['KE'],
    exchangeRate: 150 // Approximate rate
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    countries: ['NG'],
    exchangeRate: 800
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    countries: ['ZA'],
    exchangeRate: 18
  },
  GHS: {
    code: 'GHS',
    symbol: '₵',
    name: 'Ghanaian Cedi',
    countries: ['GH'],
    exchangeRate: 12
  },
  EGP: {
    code: 'EGP',
    symbol: '£',
    name: 'Egyptian Pound',
    countries: ['EG'],
    exchangeRate: 31
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    countries: ['DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'IE', 'PT', 'FI', 'GR'],
    exchangeRate: 0.92
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    countries: ['GB'],
    exchangeRate: 0.79
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    name: 'Canadian Dollar',
    countries: ['CA'],
    exchangeRate: 1.35
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    name: 'Australian Dollar',
    countries: ['AU'],
    exchangeRate: 1.52
  },
  XOF: {
    code: 'XOF',
    symbol: 'CFA',
    name: 'West African CFA Franc',
    countries: ['SN', 'CI', 'BF', 'ML', 'NE', 'TG', 'BJ', 'GW'],
    exchangeRate: 600
  },
  XAF: {
    code: 'XAF',
    symbol: 'FCFA',
    name: 'Central African CFA Franc',
    countries: ['CM', 'CF', 'TD', 'CG', 'GQ', 'GA'],
    exchangeRate: 600
  },
  MAD: {
    code: 'MAD',
    symbol: 'DH',
    name: 'Moroccan Dirham',
    countries: ['MA'],
    exchangeRate: 10
  },
  TND: {
    code: 'TND',
    symbol: 'د.ت',
    name: 'Tunisian Dinar',
    countries: ['TN'],
    exchangeRate: 3.1
  },
  ETB: {
    code: 'ETB',
    symbol: 'Br',
    name: 'Ethiopian Birr',
    countries: ['ET'],
    exchangeRate: 55
  },
  UGX: {
    code: 'UGX',
    symbol: 'USh',
    name: 'Ugandan Shilling',
    countries: ['UG'],
    exchangeRate: 3700
  },
  TZS: {
    code: 'TZS',
    symbol: 'TSh',
    name: 'Tanzanian Shilling',
    countries: ['TZ'],
    exchangeRate: 2500
  },
  RWF: {
    code: 'RWF',
    symbol: 'RF',
    name: 'Rwandan Franc',
    countries: ['RW'],
    exchangeRate: 1300
  }
};

// Country to currency mapping for auto-detection
const COUNTRY_CURRENCY_MAP: Record<string, string> = {
  // Africa
  'KE': 'KES', // Kenya
  'NG': 'NGN', // Nigeria
  'ZA': 'ZAR', // South Africa
  'GH': 'GHS', // Ghana
  'EG': 'EGP', // Egypt
  'TZ': 'TZS', // Tanzania
  'UG': 'UGX', // Uganda
  'RW': 'RWF', // Rwanda
  'ET': 'ETB', // Ethiopia
  'MA': 'MAD', // Morocco
  'TN': 'TND', // Tunisia
  'SN': 'XOF', // Senegal
  'CI': 'XOF', // Côte d'Ivoire
  'BF': 'XOF', // Burkina Faso
  'ML': 'XOF', // Mali
  'NE': 'XOF', // Niger
  'TG': 'XOF', // Togo
  'BJ': 'XOF', // Benin
  'GW': 'XOF', // Guinea-Bissau
  'CM': 'XAF', // Cameroon
  'CF': 'XAF', // Central African Republic
  'TD': 'XAF', // Chad
  'CG': 'XAF', // Republic of the Congo
  'GQ': 'XAF', // Equatorial Guinea
  'GA': 'XAF', // Gabon
  
  // North America
  'US': 'USD',
  'CA': 'CAD',
  
  // Europe
  'GB': 'GBP',
  'DE': 'EUR',
  'FR': 'EUR',
  'IT': 'EUR',
  'ES': 'EUR',
  'NL': 'EUR',
  'BE': 'EUR',
  'AT': 'EUR',
  'IE': 'EUR',
  'PT': 'EUR',
  'FI': 'EUR',
  'GR': 'EUR',
  
  // Others
  'AU': 'AUD',
};

export function detectCurrencyFromLocation(countryCode?: string): string {
  if (!countryCode) return 'USD';
  return COUNTRY_CURRENCY_MAP[countryCode.toUpperCase()] || 'USD';
}

export function detectCurrencyFromTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Common timezone to country mapping
    const timezoneCountryMap: Record<string, string> = {
      'Africa/Nairobi': 'KE',
      'Africa/Lagos': 'NG',
      'Africa/Johannesburg': 'ZA',
      'Africa/Accra': 'GH',
      'Africa/Cairo': 'EG',
      'America/New_York': 'US',
      'America/Los_Angeles': 'US',
      'America/Chicago': 'US',
      'America/Toronto': 'CA',
      'Europe/London': 'GB',
      'Europe/Berlin': 'DE',
      'Europe/Paris': 'FR',
      'Australia/Sydney': 'AU',
    };
    
    const countryCode = timezoneCountryMap[timezone];
    return detectCurrencyFromLocation(countryCode);
  } catch {
    return 'USD';
  }
}

export function detectCurrencyFromBrowser(): string {
  try {
    // Try to get locale from browser
    const locale = navigator.language || 'en-US';
    const region = locale.split('-')[1];
    
    if (region) {
      return detectCurrencyFromLocation(region);
    }
    
    // Fallback to timezone detection
    return detectCurrencyFromTimezone();
  } catch {
    return 'USD';
  }
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES[currencyCode];
  if (!currency) return `${amount} ${currencyCode}`;
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount);
  } catch {
    return `${currency.symbol}${amount.toFixed(2)}`;
  }
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  
  const fromRate = SUPPORTED_CURRENCIES[fromCurrency]?.exchangeRate || 1;
  const toRate = SUPPORTED_CURRENCIES[toCurrency]?.exchangeRate || 1;
  
  // Convert to USD first, then to target currency
  const usdAmount = amount / fromRate;
  return usdAmount * toRate;
}

export function getCurrencySymbol(currencyCode: string): string {
  return SUPPORTED_CURRENCIES[currencyCode]?.symbol || currencyCode;
}