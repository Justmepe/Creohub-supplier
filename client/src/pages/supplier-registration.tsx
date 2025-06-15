import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Package, Truck, Globe, ArrowLeft } from "lucide-react";

const supplierFormSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  businessLicense: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid email"),
  contactPhone: z.string().min(10, "Please enter a valid phone number"),
  address: z.string().min(10, "Please enter your full address"),
  businessType: z.enum(["manufacturer", "wholesaler", "distributor"]),
  description: z.string().min(50, "Please provide a detailed description (min 50 characters)"),
  website: z.string().url("Please enter a valid website URL").optional().or(z.literal("")),
  defaultCommissionRate: z.string().min(1, "Commission rate is required"),
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

export default function SupplierRegistration() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);

  const form = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      companyName: "",
      businessLicense: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      businessType: "wholesaler",
      description: "",
      website: "",
      defaultCommissionRate: "15",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      const response = await apiRequest("POST", "/api/dropshipping/partners/apply", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted",
        description: "Your supplier application has been submitted for review. We'll contact you within 2-3 business days.",
      });
      setStep(3);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupplierFormData) => {
    registerMutation.mutate(data);
  };

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h3>
            <p className="text-gray-600 mb-4">
              Thank you for your interest in becoming a Creohub supplier partner. 
              Our team will review your application and contact you within 2-3 business days.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p><strong>Next Steps:</strong></p>
              <p>• Document verification</p>
              <p>• Product catalog review</p>
              <p>• Partnership agreement</p>
              <p>• Account activation</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Navigation */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="text-gray-600 hover:text-gray-900">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Become a Creohub Supplier Partner
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Join our marketplace and reach thousands of African creators ready to sell your products.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <div className="text-primary text-3xl mb-2">📈</div>
              <CardTitle>Expand Your Reach</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Access thousands of creators across Africa who will market and sell your products.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-primary text-3xl mb-2">💰</div>
              <CardTitle>No Upfront Costs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Only pay commission when sales are made. No monthly fees or setup costs.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="text-primary text-3xl mb-2">🚀</div>
              <CardTitle>Easy Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Simple product feed integration or manual upload. We handle the technical details.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Application Form */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Supplier Application
            </CardTitle>
            <CardDescription>
              Tell us about your business and products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Company Information
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Company Ltd" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your business type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="manufacturer">Manufacturer</SelectItem>
                            <SelectItem value="wholesaler">Wholesaler</SelectItem>
                            <SelectItem value="distributor">Distributor</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessLicense"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business License Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional - if applicable" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@yourcompany.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+254 700 000 000" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Address *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Full business address including city and country"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Business Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Business Details
                  </h3>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your business, products you sell, target market, etc. (minimum 50 characters)"
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://yourwebsite.com (optional)"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="defaultCommissionRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proposed Commission Rate (%) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="5" 
                            max="50" 
                            placeholder="15"
                            {...field} 
                          />
                        </FormControl>
                        <p className="text-sm text-gray-500">
                          Recommended: 10-20%. This is what creators earn when they sell your products.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? "Submitting..." : "Submit Application"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}