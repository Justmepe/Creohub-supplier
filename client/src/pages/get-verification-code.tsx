import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { Shield, Mail, Copy, CheckCircle } from "lucide-react";

export default function GetVerificationCode() {
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [verificationData, setVerificationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const [location] = useLocation();

  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const userIdFromUrl = urlParams.get('userId');
  const emailFromUrl = urlParams.get('email');

  const handleGetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/get-verification-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: parseInt(userId || userIdFromUrl || ""),
          email: email || emailFromUrl || ""
        }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.verified) {
          toast({
            title: "Already Verified",
            description: "Your email is already verified. You can log in now.",
          });
          return;
        }

        if (data.hasCode) {
          setVerificationData(data);
          toast({
            title: "Code Retrieved",
            description: "Your verification code has been found.",
          });
        } else {
          toast({
            title: "No Code Found",
            description: data.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to retrieve verification code",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (verificationData?.code) {
      navigator.clipboard.writeText(verificationData.code);
      setCopied(true);
      toast({
        title: "Copied",
        description: "Verification code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 p-3 bg-orange-100 dark:bg-orange-900 rounded-full w-fit">
            <Shield className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Get Verification Code</CardTitle>
          <CardDescription>
            Retrieve your email verification code using your User ID and email
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {!verificationData ? (
            <form onSubmit={handleGetCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  type="number"
                  placeholder="Enter your User ID"
                  value={userId || userIdFromUrl || ""}
                  onChange={(e) => setUserId(e.target.value)}
                  required
                />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You received this ID when you registered
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email || emailFromUrl || ""}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Retrieving..." : "Get Verification Code"}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your verification code has been found:
                </AlertDescription>
              </Alert>

              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-mono font-bold text-orange-600 dark:text-orange-400 tracking-widest">
                    {verificationData.code}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyCode}
                    className="ml-2"
                  >
                    {copied ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p>Code expires: {new Date(verificationData.expiresAt).toLocaleString()}</p>
                <p>{verificationData.message}</p>
              </div>

              <Link href={`/verify-email?userId=${userId || userIdFromUrl}&email=${encodeURIComponent(email || emailFromUrl || '')}`}>
                <Button className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  Verify Email Now
                </Button>
              </Link>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => setVerificationData(null)}
              >
                Get Another Code
              </Button>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Need help?
              </p>
              <div className="flex gap-2 justify-center">
                <Link href="/verification-help">
                  <Button variant="link" size="sm">Verification Help</Button>
                </Link>
                <Link href="/auth">
                  <Button variant="link" size="sm">Back to Login</Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}