import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Package, TrendingUp, Users, CheckCircle, Clock, FileText, Shield } from "lucide-react";

interface PartnerApplicationForm {
  companyName: string;
  businessLicense: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  businessType: string;
  description: string;
  website: string;
  paymentAccountDetails: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
}

export default function PartnerApplication() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PartnerApplicationForm>({
    companyName: "",
    businessLicense: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    businessType: "wholesaler",
    description: "",
    website: "",
    paymentAccountDetails: {
      bankName: "",
      accountNumber: "",
      accountName: "",
    },
  });

  const submitApplication = useMutation({
    mutationFn: async (data: PartnerApplicationForm) => {
      const response = await apiRequest("POST", "/api/dropshipping/partners/apply", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your partner application has been submitted successfully. We'll review it within 3-5 business days.",
      });
      setStep(4); // Success step
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateFormData = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof PartnerApplicationForm],
          [child]: value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const benefits = [
    {
      icon: TrendingUp,
      title: "Expand Your Reach",
      description: "Access thousands of creators across Africa who can sell your products"
    },
    {
      icon: Users,
      title: "No Marketing Costs",
      description: "Creators handle marketing and customer acquisition for you"
    },
    {
      icon: Package,
      title: "Inventory Management",
      description: "You control stock levels and product information"
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Guaranteed payments through our platform with dispute protection"
    }
  ];

  const requirements = [
    "Valid business license or registration",
    "Minimum 6 months in business",
    "Quality products with reliable supply chain",
    "Ability to handle order fulfillment",
    "Professional customer service standards"
  ];

  if (step === 4) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="text-center">
          <CardContent className="p-8">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
            <p className="text-gray-600 mb-6">
              Thank you for applying to become a Creohub dropshipping partner. We'll review your application and get back to you within 3-5 business days.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• We'll verify your business information</li>
                <li>• Review your product quality standards</li>
                <li>• Set up your partner account and payment details</li>
                <li>• Provide access to add your products</li>
              </ul>
            </div>
            <Button onClick={() => window.location.href = '/'}>
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Become a Dropshipping Partner</h1>
        <p className="text-gray-600">
          Join our network of verified suppliers and reach thousands of creators across Africa.
        </p>
      </div>

      {step === 1 && (
        <div className="space-y-8">
          {/* Benefits Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Partner with Creohub?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start">
                      <benefit.icon className="h-8 w-8 text-blue-600 mr-4 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                        <p className="text-gray-600 text-sm">{benefit.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Requirements Section */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Partner Requirements</h2>
            <Card>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-3 mt-0.5" />
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Button onClick={() => setStep(2)} size="lg">
              Start Application
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-6 w-6 mr-2" />
                Business Information
              </CardTitle>
              <CardDescription>
                Tell us about your business and products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => updateFormData('companyName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="businessLicense">Business License Number *</Label>
                  <Input
                    id="businessLicense"
                    value={formData.businessLicense}
                    onChange={(e) => updateFormData('businessLicense', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contactEmail">Business Email *</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => updateFormData('contactEmail', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contactPhone">Business Phone *</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => updateFormData('contactPhone', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Business Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="businessType">Business Type *</Label>
                <select
                  id="businessType"
                  value={formData.businessType}
                  onChange={(e) => updateFormData('businessType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manufacturer">Manufacturer</option>
                  <option value="wholesaler">Wholesaler</option>
                  <option value="distributor">Distributor</option>
                </select>
              </div>

              <div>
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => updateFormData('website', e.target.value)}
                  placeholder="https://your-website.com"
                />
              </div>

              <div>
                <Label htmlFor="description">Business Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Describe your business, products, and experience..."
                  rows={4}
                  required
                />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 3 && (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-6 w-6 mr-2" />
                Payment Information
              </CardTitle>
              <CardDescription>
                Provide your bank details for receiving payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bankName">Bank Name *</Label>
                <Input
                  id="bankName"
                  value={formData.paymentAccountDetails.bankName}
                  onChange={(e) => updateFormData('paymentAccountDetails.bankName', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="accountNumber">Account Number *</Label>
                <Input
                  id="accountNumber"
                  value={formData.paymentAccountDetails.accountNumber}
                  onChange={(e) => updateFormData('paymentAccountDetails.accountNumber', e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="accountName">Account Name *</Label>
                <Input
                  id="accountName"
                  value={formData.paymentAccountDetails.accountName}
                  onChange={(e) => updateFormData('paymentAccountDetails.accountName', e.target.value)}
                  required
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Payment Terms</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Payments are processed monthly</li>
                  <li>• 2.5% platform fee on all transactions</li>
                  <li>• Payments sent within 5 business days</li>
                  <li>• All amounts in your local currency</li>
                </ul>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button 
                  onClick={() => submitApplication.mutate(formData)}
                  disabled={submitApplication.isPending}
                >
                  {submitApplication.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}