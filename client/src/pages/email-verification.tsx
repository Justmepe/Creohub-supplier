import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Mail, Send, CheckCircle } from "lucide-react";

export default function EmailVerification() {
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [step, setStep] = useState<"email" | "code">("email");
  const { toast } = useToast();

  // Send verification code
  const sendCodeMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest("POST", "/api/auth/resend-verification", { email });
      return response.json();
    },
    onSuccess: (data) => {
      setUserId(data.userId);
      setStep("code");
      toast({
        title: "Code Sent",
        description: "Verification code sent to your email"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive"
      });
    }
  });

  // Verify code
  const verifyCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/auth/verify-email", {
        userId,
        code: verificationCode
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email verified successfully! You can now log in."
      });
      // Redirect to login page after a delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Invalid verification code",
        variant: "destructive"
      });
    }
  });

  const handleSendCode = () => {
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    sendCodeMutation.mutate(email);
  };

  const handleVerifyCode = () => {
    if (!verificationCode) {
      toast({
        title: "Error",
        description: "Please enter the verification code",
        variant: "destructive"
      });
      return;
    }
    verifyCodeMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Email Verification
            </CardTitle>
            <CardDescription className="text-gray-600">
              {step === "email" 
                ? "Enter your email to receive a verification code"
                : "Enter the 6-digit code sent to your email"
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === "email" ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full"
                  />
                </div>

                <Button
                  onClick={handleSendCode}
                  disabled={sendCodeMutation.isPending}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sendCodeMutation.isPending ? "Sending..." : "Send Verification Code"}
                </Button>
              </>
            ) : (
              <>
                <Alert>
                  <Mail className="h-4 w-4" />
                  <AlertDescription>
                    Verification code sent to <strong>{email}</strong>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Verification Code
                  </label>
                  <Input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full text-center text-lg tracking-widest"
                  />
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleVerifyCode}
                    disabled={verifyCodeMutation.isPending}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {verifyCodeMutation.isPending ? "Verifying..." : "Verify Email"}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={sendCodeMutation.isPending}
                    className="w-full"
                  >
                    {sendCodeMutation.isPending ? "Sending..." : "Resend Code"}
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    onClick={() => setStep("email")}
                    className="text-sm text-gray-600"
                  >
                    Use different email
                  </Button>
                </div>
              </>
            )}

            <div className="text-center text-sm text-gray-500">
              Already verified?{" "}
              <a href="/login" className="text-blue-600 hover:underline">
                Login here
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}