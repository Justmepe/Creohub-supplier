import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap } from 'lucide-react';
import { PRICING_PLANS, type PricingPlan } from '@/../../shared/pricing';
import { detectCurrencyFromBrowser, formatCurrency, convertCurrency } from '@/../../shared/currency';
import { useAuth } from '@/App';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';

interface PricingPlansProps {
  onPlanSelect?: (planId: string) => void;
  showCurrentPlan?: boolean;
}

export default function PricingPlans({ onPlanSelect, showCurrentPlan = true }: PricingPlansProps) {
  const { creator } = useAuth();
  const { toast } = useToast();
  const [detectedCurrency, setDetectedCurrency] = useState('USD');

  useEffect(() => {
    const currency = detectCurrencyFromBrowser();
    setDetectedCurrency(currency);
  }, []);

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest('POST', '/api/subscription/upgrade', { planId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plan Updated",
        description: "Your subscription has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upgrade Failed",
        description: error.message || "Failed to upgrade plan. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatPlanPrice = (plan: PricingPlan) => {
    if (plan.price === 0) return 'Free';
    
    const convertedPrice = convertCurrency(plan.price, plan.currency, detectedCurrency);
    const formatted = formatCurrency(convertedPrice, detectedCurrency);
    
    if (plan.interval === 'month') {
      return `${formatted}/month`;
    }
    return formatted;
  };

  const handlePlanSelect = (planId: string) => {
    if (onPlanSelect) {
      onPlanSelect(planId);
    } else {
      upgradeMutation.mutate(planId);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <Zap className="w-5 h-5" />;
      case 'pro':
        return <Crown className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const isCurrentPlan = (planId: string) => {
    return showCurrentPlan && creator?.planType === planId;
  };

  const isTrialExpiring = () => {
    if (!creator?.trialEndsAt) return false;
    const daysLeft = Math.ceil((new Date(creator.trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {Object.values(PRICING_PLANS).map((plan) => (
        <Card 
          key={plan.id} 
          className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''} ${
            isCurrentPlan(plan.id) ? 'ring-2 ring-primary' : ''
          }`}
        >
          {plan.popular && (
            <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
              Most Popular
            </Badge>
          )}
          
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              {getPlanIcon(plan.id)}
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
            </div>
            <CardDescription className="text-3xl font-bold">
              {formatPlanPrice(plan)}
            </CardDescription>
            {plan.transactionFee > 0 && (
              <p className="text-sm text-muted-foreground">
                + {(plan.transactionFee * 100).toFixed(0)}% transaction fee
              </p>
            )}
            {plan.trialDays && (
              <p className="text-sm text-primary">
                {plan.trialDays}-day free trial
              </p>
            )}
          </CardHeader>

          <CardContent>
            <ul className="space-y-3">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            
            {plan.productLimit && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Product Limit</p>
                <p className="text-xs text-muted-foreground">
                  {plan.productLimit === null ? 'Unlimited' : `Up to ${plan.productLimit} products`}
                </p>
              </div>
            )}
          </CardContent>

          <CardFooter>
            {isCurrentPlan(plan.id) ? (
              <Button variant="outline" className="w-full" disabled>
                Current Plan
              </Button>
            ) : (
              <Button 
                className="w-full" 
                onClick={() => handlePlanSelect(plan.id)}
                disabled={upgradeMutation.isPending}
                variant={plan.popular ? "default" : "outline"}
              >
                {upgradeMutation.isPending ? 'Processing...' : 
                 plan.id === 'free' ? 'Start Free Trial' : `Upgrade to ${plan.name}`}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
      
      {creator?.planType === 'free' && isTrialExpiring() && (
        <div className="col-span-full">
          <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <Zap className="w-5 h-5" />
                <p className="font-medium">
                  Your free trial expires soon! Upgrade to continue using all features.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}