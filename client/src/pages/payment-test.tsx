import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock,
  DollarSign,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PaymentTestResult {
  method: string;
  status: 'success' | 'error' | 'pending';
  message: string;
  data?: any;
  timestamp: Date;
}

export default function PaymentTest() {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<PaymentTestResult[]>([]);
  const [testData, setTestData] = useState({
    amount: 100,
    currency: 'KES',
    phoneNumber: '254712345678',
    email: 'test@example.com',
    orderReference: 'TEST001'
  });

  const addTestResult = (result: PaymentTestResult) => {
    setTestResults(prev => [result, ...prev.slice(0, 9)]);
  };

  // Test Pesapal payment
  const testPesapal = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/payments/customer/pesapal", {
        amount: testData.amount,
        currency: testData.currency,
        email: testData.email,
        phone: testData.phoneNumber,
        firstName: "Test",
        lastName: "User",
        productId: "TEST001",
        productName: "Test Product Payment"
      });
    },
    onSuccess: (data) => {
      addTestResult({
        method: 'Pesapal',
        status: 'success',
        message: 'Payment request created successfully',
        data,
        timestamp: new Date()
      });
      toast({
        title: "Pesapal Test Successful",
        description: "Payment request created successfully"
      });
    },
    onError: (error: any) => {
      addTestResult({
        method: 'Pesapal',
        status: 'error',
        message: error.message || 'Failed to create payment request',
        timestamp: new Date()
      });
      toast({
        title: "Pesapal Test Failed",
        description: error.message || 'Failed to create payment request',
        variant: "destructive"
      });
    }
  });

  // Test PayPal payment
  const testPayPal = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/paypal/order", {
        amount: testData.amount.toString(),
        currency: "USD",
        intent: "CAPTURE"
      });
    },
    onSuccess: (data) => {
      addTestResult({
        method: 'PayPal',
        status: 'success',
        message: 'PayPal order created successfully',
        data,
        timestamp: new Date()
      });
      toast({
        title: "PayPal Test Successful",
        description: "Order created successfully"
      });
    },
    onError: (error: any) => {
      addTestResult({
        method: 'PayPal',
        status: 'error',
        message: error.message || 'PayPal test failed',
        timestamp: new Date()
      });
    }
  });

  // Test bank transfer
  const testBankTransfer = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/payments/bank-transfer", {
        amount: testData.amount,
        currency: testData.currency,
        reference: testData.orderReference,
        customerEmail: testData.email
      });
    },
    onSuccess: (data) => {
      addTestResult({
        method: 'Bank Transfer',
        status: 'success',
        message: 'Bank transfer initiated successfully',
        data,
        timestamp: new Date()
      });
      toast({
        title: "Bank Transfer Test Successful",
        description: "Transfer initiated successfully"
      });
    },
    onError: (error: any) => {
      addTestResult({
        method: 'Bank Transfer',
        status: 'error',
        message: error.message || 'Bank transfer test failed',
        timestamp: new Date()
      });
    }
  });

  // Get payment configuration status
  const { data: paymentConfig } = useQuery({
    queryKey: ['/api/payments/config'],
    queryFn: async () => {
      try {
        const response = await fetch("/api/payments/config");
        const data = await response.json();
        return data as { configured: string[], missing: string[] };
      } catch (error) {
        return { configured: [], missing: [] };
      }
    }
  });

  const getStatusIcon = (status: PaymentTestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: PaymentTestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Payment System Testing</h1>
          <p className="text-muted-foreground mt-2">
            Test and verify all payment methods for your creator commerce platform
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Test Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Test Configuration
              </CardTitle>
              <CardDescription>
                Configure test parameters for payment method verification
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={testData.amount}
                    onChange={(e) => setTestData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    value={testData.currency}
                    onChange={(e) => setTestData(prev => ({ ...prev, currency: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={testData.phoneNumber}
                  onChange={(e) => setTestData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={testData.email}
                  onChange={(e) => setTestData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="orderReference">Order Reference</Label>
                <Input
                  id="orderReference"
                  value={testData.orderReference}
                  onChange={(e) => setTestData(prev => ({ ...prev, orderReference: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Payment Methods
              </CardTitle>
              <CardDescription>
                Test individual payment integration methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => testPesapal.mutate()}
                disabled={testPesapal.isPending}
                className="w-full justify-start"
                variant="outline"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Test Pesapal
                {testPesapal.isPending && <Clock className="w-4 h-4 ml-auto animate-spin" />}
              </Button>

              <Button
                onClick={() => testMpesa.mutate()}
                disabled={testMpesa.isPending}
                className="w-full justify-start"
                variant="outline"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Test M-Pesa
                {testMpesa.isPending && <Clock className="w-4 h-4 ml-auto animate-spin" />}
              </Button>

              <Button
                onClick={() => testBankTransfer.mutate()}
                disabled={testBankTransfer.isPending}
                className="w-full justify-start"
                variant="outline"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Test Bank Transfer
                {testBankTransfer.isPending && <Clock className="w-4 h-4 ml-auto animate-spin" />}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Payment Configuration Status */}
        {paymentConfig && (
          <Card>
            <CardHeader>
              <CardTitle>Payment Configuration Status</CardTitle>
              <CardDescription>
                Current status of payment method configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2 text-green-600 dark:text-green-400">Configured Methods</h4>
                  <div className="space-y-1">
                    {paymentConfig?.configured?.map((method: string) => (
                      <Badge key={method} variant="secondary" className="mr-2">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {method}
                      </Badge>
                    )) || <Badge variant="outline">Pesapal</Badge>}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-yellow-600 dark:text-yellow-400">Missing Configuration</h4>
                  <div className="space-y-1">
                    {paymentConfig?.missing?.map((method: string) => (
                      <Badge key={method} variant="outline" className="mr-2">
                        <XCircle className="w-3 h-3 mr-1" />
                        {method}
                      </Badge>
                    )) || (
                      <>
                        <Badge variant="outline">
                          <XCircle className="w-3 h-3 mr-1" />
                          M-Pesa
                        </Badge>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Recent payment method test results and responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            {testResults.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No test results yet. Run payment method tests to see results here.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{result.method}</span>
                        <Badge className={getStatusColor(result.status)}>
                          {result.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                    {result.data && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-muted-foreground">
                          View response data
                        </summary>
                        <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}