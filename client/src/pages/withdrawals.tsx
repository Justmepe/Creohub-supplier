import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Wallet, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Plus, 
  Smartphone, 
  CreditCard, 
  Banknote,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
  History
} from "lucide-react";
import { formatDate } from "date-fns";

const payoutMethodSchema = z.object({
  type: z.string().min(1, "Payment method is required"),
  accountName: z.string().min(1, "Account name is required"),
  phoneNumber: z.string().optional(),
  accountNumber: z.string().optional(),
  bankName: z.string().optional(),
  paypalEmail: z.string().email().optional(),
  isDefault: z.boolean().default(false),
});

const withdrawalSchema = z.object({
  amount: z.string().min(1, "Amount is required"),
  payoutMethodId: z.string().min(1, "Payout method is required"),
  notes: z.string().optional(),
});

type PayoutMethodForm = z.infer<typeof payoutMethodSchema>;
type WithdrawalForm = z.infer<typeof withdrawalSchema>;

export default function WithdrawalsPage() {
  const { creator } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);

  // Forms
  const payoutForm = useForm<PayoutMethodForm>({
    resolver: zodResolver(payoutMethodSchema),
    defaultValues: {
      type: "",
      accountName: "",
      isDefault: false,
    },
  });

  const withdrawalForm = useForm<WithdrawalForm>({
    resolver: zodResolver(withdrawalSchema),
    defaultValues: {
      amount: "",
      payoutMethodId: "",
      notes: "",
    },
  });

  // Queries
  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ["earnings", creator?.id],
    queryFn: async () => {
      const response = await fetch(`/api/creators/${creator?.id}/earnings`);
      return response.json();
    },
    enabled: !!creator?.id,
  });

  const { data: payoutMethods, isLoading: methodsLoading } = useQuery({
    queryKey: ["payout-methods", creator?.id],
    queryFn: async () => {
      const response = await fetch(`/api/creators/${creator?.id}/payout-methods`);
      return response.json();
    },
    enabled: !!creator?.id,
  });

  const { data: withdrawals, isLoading: withdrawalsLoading } = useQuery({
    queryKey: ["withdrawals", creator?.id],
    queryFn: async () => {
      const response = await fetch(`/api/creators/${creator?.id}/withdrawals`);
      return response.json();
    },
    enabled: !!creator?.id,
  });

  // Mutations
  const addPayoutMethodMutation = useMutation({
    mutationFn: async (data: PayoutMethodForm) => {
      const accountDetails = {
        phoneNumber: data.phoneNumber,
        accountNumber: data.accountNumber,
        bankName: data.bankName,
        paypalEmail: data.paypalEmail,
      };

      const response = await fetch(`/api/creators/${creator?.id}/payout-methods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.type,
          accountName: data.accountName,
          accountDetails,
          isDefault: data.isDefault,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payout-methods"] });
      setShowAddMethod(false);
      payoutForm.reset();
      toast({
        title: "Success",
        description: "Payout method added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add payout method",
        variant: "destructive",
      });
    },
  });

  const createWithdrawalMutation = useMutation({
    mutationFn: async (data: WithdrawalForm) => {
      const response = await fetch(`/api/creators/${creator?.id}/withdrawals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: data.amount,
          payoutMethodId: parseInt(data.payoutMethodId),
          notes: data.notes,
        }),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["withdrawals"] });
      queryClient.invalidateQueries({ queryKey: ["earnings"] });
      setShowWithdrawDialog(false);
      withdrawalForm.reset();
      toast({
        title: "Success",
        description: "Withdrawal request submitted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit withdrawal request",
        variant: "destructive",
      });
    },
  });

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'mpesa':
        return <Smartphone className="h-4 w-4" />;
      case 'bank_transfer':
        return <Banknote className="h-4 w-4" />;
      case 'paypal':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Wallet className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'processing':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Processing</Badge>;
      case 'completed':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'cancelled':
        return <Badge variant="outline"><X className="h-3 w-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const earnings = earningsData?.earnings || {
    totalEarnings: "0.00",
    availableBalance: "0.00",
    pendingBalance: "0.00",
    totalWithdrawn: "0.00",
    currency: "KES"
  };

  const transactions = earningsData?.recentTransactions || [];

  if (earningsLoading || methodsLoading || withdrawalsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Earnings & Withdrawals</h1>
          <p className="text-muted-foreground">Manage your earnings and request withdrawals</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showAddMethod} onOpenChange={setShowAddMethod}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
            <DialogTrigger asChild>
              <Button disabled={parseFloat(earnings.availableBalance) <= 0}>
                <Wallet className="h-4 w-4 mr-2" />
                Request Withdrawal
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.currency} {parseFloat(earnings.totalEarnings).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{earnings.currency} {parseFloat(earnings.availableBalance).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Balance</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{earnings.currency} {parseFloat(earnings.pendingBalance).toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawn</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{earnings.currency} {parseFloat(earnings.totalWithdrawn).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Manage how you receive your earnings</CardDescription>
          </CardHeader>
          <CardContent>
            {payoutMethods?.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No payment methods added yet</p>
                <Button onClick={() => setShowAddMethod(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Payment Method
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {payoutMethods?.map((method: any) => (
                  <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getPaymentMethodIcon(method.type)}
                      <div>
                        <p className="font-medium">{method.accountName}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {method.type.replace('_', ' ')}
                          {method.isDefault && <Badge variant="secondary" className="ml-2">Default</Badge>}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Recent Transactions
            </CardTitle>
            <CardDescription>Your latest earning activities</CardDescription>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction: any, index: number) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div className={`text-right ${parseFloat(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      <p className="font-medium">
                        {parseFloat(transaction.amount) >= 0 ? '+' : ''}{transaction.currency} {Math.abs(parseFloat(transaction.amount)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal History */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
          <CardDescription>Track your withdrawal requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals?.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No withdrawal requests yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals?.map((withdrawal: any) => (
                <div key={withdrawal.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium">{withdrawal.currency} {parseFloat(withdrawal.amount).toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">
                          Requested on {formatDate(new Date(withdrawal.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(withdrawal.status)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Processing fee: {withdrawal.currency} {parseFloat(withdrawal.processingFee).toFixed(2)}</p>
                    <p>Net amount: {withdrawal.currency} {parseFloat(withdrawal.netAmount).toFixed(2)}</p>
                  </div>
                  {withdrawal.notes && (
                    <p className="text-sm text-muted-foreground mt-2">Note: {withdrawal.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Payment Method Dialog */}
      <Dialog open={showAddMethod} onOpenChange={setShowAddMethod}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>
              Add a new way to receive your earnings
            </DialogDescription>
          </DialogHeader>
          <Form {...payoutForm}>
            <form onSubmit={payoutForm.handleSubmit((data) => addPayoutMethodMutation.mutate(data))} className="space-y-4">
              <FormField
                control={payoutForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={payoutForm.control}
                name="accountName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter account name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {payoutForm.watch("type") === "mpesa" && (
                <FormField
                  control={payoutForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>M-Pesa Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="254XXXXXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {payoutForm.watch("type") === "bank_transfer" && (
                <>
                  <FormField
                    control={payoutForm.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter bank name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={payoutForm.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter account number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {payoutForm.watch("type") === "paypal" && (
                <FormField
                  control={payoutForm.control}
                  name="paypalEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PayPal Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter PayPal email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddMethod(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addPayoutMethodMutation.isPending}>
                  {addPayoutMethodMutation.isPending ? "Adding..." : "Add Method"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Withdrawal Request Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request Withdrawal</DialogTitle>
            <DialogDescription>
              Withdraw your available earnings to your payment method
            </DialogDescription>
          </DialogHeader>
          <Form {...withdrawalForm}>
            <form onSubmit={withdrawalForm.handleSubmit((data) => createWithdrawalMutation.mutate(data))} className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Available Balance: <strong>{earnings.currency} {parseFloat(earnings.availableBalance).toLocaleString()}</strong>
                </p>
              </div>

              <FormField
                control={withdrawalForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Withdrawal Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="Enter amount"
                        max={earnings.availableBalance}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={withdrawalForm.control}
                name="payoutMethodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {payoutMethods?.map((method: any) => (
                          <SelectItem key={method.id} value={method.id.toString()}>
                            {method.accountName} ({method.type.replace('_', ' ')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={withdrawalForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any additional notes"
                        className="resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Processing fee: 2% for M-Pesa, 3% for other methods</p>
                <p>• Withdrawals are processed within 1-3 business days</p>
                <p>• Minimum withdrawal amount: {earnings.currency} 100</p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowWithdrawDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createWithdrawalMutation.isPending || !payoutMethods?.length}>
                  {createWithdrawalMutation.isPending ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}