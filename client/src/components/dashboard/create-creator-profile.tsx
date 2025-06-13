import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";

const creatorSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  storeHandle: z.string().min(3, "Handle must be at least 3 characters").regex(/^[a-zA-Z0-9_-]+$/, "Handle can only contain letters, numbers, hyphens, and underscores"),
  bio: z.string().optional(),
  contactEmail: z.string().email("Invalid email address"),
});

type CreatorFormData = z.infer<typeof creatorSchema>;

interface CreateCreatorProfileProps {
  userId: number;
}

export default function CreateCreatorProfile({ userId }: CreateCreatorProfileProps) {
  const { toast } = useToast();
  const { setCreator } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<CreatorFormData>({
    resolver: zodResolver(creatorSchema),
    defaultValues: {
      storeName: "",
      storeHandle: "",
      bio: "",
      contactEmail: "",
    },
  });

  const createCreatorMutation = useMutation({
    mutationFn: async (data: CreatorFormData) => {
      const response = await apiRequest("POST", "/api/creators", {
        ...data,
        userId,
        planType: "free", // Start with free plan
        subscriptionStatus: "trial", // Start with trial
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        productCount: 0,
      });
      return response.json();
    },
    onSuccess: (creator) => {
      setCreator(creator);
      toast({
        title: "Creator Profile Created",
        description: "Welcome to Creohub! Your creator profile has been set up.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/creators"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create creator profile",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreatorFormData) => {
    createCreatorMutation.mutate(data);
  };

  return (
    <div className="w-full max-w-md space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="storeName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your Store Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="storeHandle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Store Handle</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="your-store-handle" 
                    {...field} 
                    onChange={(e) => {
                      // Convert to lowercase and replace spaces with hyphens
                      const value = e.target.value.toLowerCase().replace(/\s+/g, '-');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Your store will be available at: creohub.com/storefront/{field.value || 'your-handle'}
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contact@yourstore.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell your customers about yourself and your products..."
                    className="h-20"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={createCreatorMutation.isPending}
          >
            {createCreatorMutation.isPending ? "Creating Profile..." : "Create Creator Profile"}
          </Button>
        </form>
      </Form>
    </div>
  );
}