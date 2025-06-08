import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Globe, CreditCard, TrendingUp } from 'lucide-react';
import PricingPlans from '@/components/pricing/pricing-plans';
import { detectCurrencyFromBrowser, SUPPORTED_CURRENCIES } from '@/../../shared/currency';
import { useAuth } from '@/App';
import { Link } from 'wouter';

export default function Pricing() {
  const { creator } = useAuth();
  const [detectedCurrency, setDetectedCurrency] = useState('USD');

  useEffect(() => {
    const currency = detectCurrencyFromBrowser();
    setDetectedCurrency(currency);
  }, []);

  const features = [
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Multi-Currency Support",
      description: "Accept payments in your local currency automatically detected based on your location"
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: "Multiple Payment Methods",
      description: "M-Pesa, PayPal, Stripe, and more payment options for your customers"
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Transparent Pricing",
      description: "No hidden fees. Clear transaction costs that decrease as you grow"
    },
    {
      icon: <CheckCircle className="w-6 h-6" />,
      title: "30-Day Free Trial",
      description: "Test all features risk-free for 30 days with up to 3 products"
    }
  ];

  const currencyInfo = SUPPORTED_CURRENCIES[detectedCurrency];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            Pricing Plans
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Start with our free 30-day trial and scale your creator business with transparent pricing that grows with you.
          </p>
          
          {currencyInfo && (
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-sm border">
              <Globe className="w-4 h-4 text-blue-500" />
              <span className="text-sm">
                Prices shown in <strong>{currencyInfo.name} ({currencyInfo.symbol})</strong> - Auto-detected from your location
              </span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4">
                  {feature.icon}
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{feature.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pricing Plans */}
        <div className="mb-16">
          <PricingPlans showCurrentPlan={!!creator} />
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>What currencies do you support?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We support major currencies including USD, KES (Kenyan Shilling), NGN (Nigerian Naira), 
                  ZAR (South African Rand), GHS (Ghanaian Cedi), EGP (Egyptian Pound), EUR, GBP, CAD, and AUD. 
                  Your default currency is automatically detected based on your location.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>How do transaction fees work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Transaction fees are calculated on each sale: Free plan (10%), Starter plan (5%), Pro plan (0%). 
                  These fees are automatically deducted from your earnings, so you always know exactly what you'll receive.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Can I upgrade or downgrade my plan anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade your plan at any time. Downgrades take effect at the end of your current billing cycle. 
                  Your data and products are always preserved during plan changes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>What happens after my free trial ends?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  After your 30-day free trial, you'll need to choose a paid plan to continue adding new products. 
                  Your existing products and storefront remain active, but you'll be prompted to upgrade for full access.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <CardContent className="pt-8">
              <h3 className="text-2xl font-bold mb-4">Ready to start selling?</h3>
              <p className="mb-6 opacity-90">
                Join thousands of African creators building their businesses with Creohub
              </p>
              {!creator ? (
                <Link href="/">
                  <Button size="lg" variant="secondary" className="font-semibold">
                    Start Your Free Trial
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard">
                  <Button size="lg" variant="secondary" className="font-semibold">
                    Go to Dashboard
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}