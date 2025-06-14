import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, AlertCircle, Copy, RefreshCw } from "lucide-react";
import { Link } from "wouter";

export default function VerificationHelp() {
  const [userId, setUserId] = useState("");
  const [showStatus, setShowStatus] = useState(false);
  const { toast } = useToast();

  const { data: verificationStatus, isLoading, refetch } = useQuery({
    queryKey: ['/api/auth/verification-status', userId],
    queryFn: async () => {
      if (!userId) return null;
      const response = await apiRequest("GET", `/api/auth/verification-status/${userId}`);
      return response.json();
    },
    enabled: showStatus && !!userId
  });

  const handleCheckStatus = () => {
    if (!userId.trim()) {
      toast({
        title: "Error",
        description: "Please enter your user ID",
        variant: "destructive",
      });
      return;
    }
    setShowStatus(true);
    refetch();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Content copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Email Verification Help</CardTitle>
          <CardDescription>
            Having trouble receiving your verification email? We can help you check your verification status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If you're not receiving verification emails, this is likely due to temporary email delivery issues. 
              Your verification code has been generated and can be retrieved below.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <label htmlFor="userId" className="block text-sm font-medium mb-2">
                Your User ID
              </label>
              <div className="flex gap-2">
                <Input
                  id="userId"
                  type="number"
                  placeholder="Enter your user ID (e.g., 18)"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleCheckStatus}
                  disabled={isLoading}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
                  Check Status
                </Button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                You received your User ID when you registered (check the registration response)
              </p>
            </div>

            {showStatus && verificationStatus && (
              <div className="space-y-4">
                {verificationStatus.verified ? (
                  <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      ✓ Your email is already verified! You can now <Link href="/login" className="underline font-medium">log in</Link>.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                      <AlertDescription className="text-orange-800 dark:text-orange-200">
                        Your email verification is pending. {verificationStatus.message}
                      </AlertDescription>
                    </Alert>

                    {verificationStatus.hasActiveCode && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                        <h3 className="font-medium mb-2">Verification Details:</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span>Email:</span>
                            <div className="flex items-center gap-2">
                              <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                                {verificationStatus.email}
                              </code>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(verificationStatus.email)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <span>Expires:</span>
                            <span className="ml-2 text-gray-600 dark:text-gray-400">
                              {new Date(verificationStatus.expiresAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>How to get your verification code:</strong><br />
                        1. Contact support with your User ID: {userId}<br />
                        2. Or check with the platform administrator<br />
                        3. The verification code is a 6-digit number that expires in 10 minutes
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-2">
                      <Link href={`/verify-email?userId=${userId}`} className="flex-1">
                        <Button className="w-full bg-orange-600 hover:bg-orange-700">
                          Enter Verification Code
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        onClick={() => refetch()}
                        disabled={isLoading}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Need Help?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              If you're still having trouble, you can:
            </p>
            <div className="space-y-2 text-sm">
              <div>• <Link href="/register" className="text-orange-600 hover:underline">Try registering again</Link> with a different email</div>
              <div>• Contact support with your User ID and email address</div>
              <div>• Check your spam/junk folder for the verification email</div>
            </div>
          </div>

          <div className="text-center pt-4 border-t">
            <Link href="/login" className="text-orange-600 hover:underline">
              Already verified? Log in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}