import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Palette, Plus, Trash2, Eye, Check } from "lucide-react";
import type { ColorTheme } from "@shared/schema";

// Color theme form schema
const colorThemeSchema = z.object({
  name: z.string().min(1, "Theme name is required"),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
    secondary: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
    accent: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
    background: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
    foreground: z.string().regex(/^#[0-9A-F]{6}$/i, "Invalid hex color"),
  }),
});

type ColorThemeForm = z.infer<typeof colorThemeSchema>;

// Predefined theme presets
const THEME_PRESETS = [
  {
    name: "Ocean Blue",
    colors: {
      primary: "#0066CC",
      secondary: "#4A90E2",
      accent: "#00A8E8",
      background: "#F8FBFF",
      foreground: "#1A1A1A",
    },
  },
  {
    name: "Forest Green",
    colors: {
      primary: "#2E7D32",
      secondary: "#66BB6A",
      accent: "#4CAF50",
      background: "#F1F8E9",
      foreground: "#1B5E20",
    },
  },
  {
    name: "Sunset Orange",
    colors: {
      primary: "#FF6B35",
      secondary: "#FF8E53",
      accent: "#FFA726",
      background: "#FFF8F5",
      foreground: "#BF360C",
    },
  },
  {
    name: "Purple Royal",
    colors: {
      primary: "#7B1FA2",
      secondary: "#AB47BC",
      accent: "#BA68C8",
      background: "#F3E5F5",
      foreground: "#4A148C",
    },
  },
];

export default function ThemesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Fetch user's color themes
  const { data: themes = [], isLoading } = useQuery<ColorTheme[]>({
    queryKey: ["/api/themes"],
  });

  // Fetch active theme
  const { data: activeTheme } = useQuery<ColorTheme>({
    queryKey: ["/api/themes/active"],
  });

  // Create theme mutation
  const createThemeMutation = useMutation({
    mutationFn: (data: ColorThemeForm) =>
      apiRequest("POST", "/api/themes", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      toast({
        title: "Theme Created",
        description: "Your custom theme has been saved successfully.",
      });
      form.reset();
      setSelectedPreset(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create theme",
        variant: "destructive",
      });
    },
  });

  // Delete theme mutation
  const deleteThemeMutation = useMutation({
    mutationFn: (themeId: number) =>
      apiRequest("DELETE", `/api/themes/${themeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      toast({
        title: "Theme Deleted",
        description: "Theme has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete theme",
        variant: "destructive",
      });
    },
  });

  // Activate theme mutation
  const activateThemeMutation = useMutation({
    mutationFn: (themeId: number) =>
      apiRequest("POST", `/api/themes/${themeId}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/themes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/themes/active"] });
      toast({
        title: "Theme Activated",
        description: "Your theme has been applied successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to activate theme",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ColorThemeForm>({
    resolver: zodResolver(colorThemeSchema),
    defaultValues: {
      name: "",
      colors: {
        primary: "#0066CC",
        secondary: "#4A90E2",
        accent: "#00A8E8",
        background: "#F8FBFF",
        foreground: "#1A1A1A",
      },
    },
  });

  const onSubmit = (data: ColorThemeForm) => {
    createThemeMutation.mutate(data);
  };

  const handlePresetSelect = (preset: typeof THEME_PRESETS[0]) => {
    setSelectedPreset(preset.name);
    form.setValue("name", preset.name);
    form.setValue("colors", preset.colors);
  };

  const handleDeleteTheme = (themeId: number) => {
    if (confirm("Are you sure you want to delete this theme?")) {
      deleteThemeMutation.mutate(themeId);
    }
  };

  const handleActivateTheme = (themeId: number) => {
    activateThemeMutation.mutate(themeId);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Palette className="h-8 w-8" />
          Color Themes
        </h1>
        <p className="text-muted-foreground">
          Customize your platform experience with personalized color schemes
        </p>
      </div>

      {/* Theme Presets */}
      <Card>
        <CardHeader>
          <CardTitle>Theme Presets</CardTitle>
          <CardDescription>
            Choose from our curated color schemes or create your own
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {THEME_PRESETS.map((preset) => (
              <div
                key={preset.name}
                className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedPreset === preset.name
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
                onClick={() => handlePresetSelect(preset)}
              >
                <div className="space-y-3">
                  <h3 className="font-medium">{preset.name}</h3>
                  <div className="flex gap-2">
                    {Object.values(preset.colors).map((color, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Create Custom Theme */}
      <Card>
        <CardHeader>
          <CardTitle>Create Custom Theme</CardTitle>
          <CardDescription>
            Design your own color scheme to match your brand
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Custom Theme" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: "primary", label: "Primary Color", description: "Main brand color" },
                  { key: "secondary", label: "Secondary Color", description: "Supporting color" },
                  { key: "accent", label: "Accent Color", description: "Highlight color" },
                  { key: "background", label: "Background Color", description: "Page background" },
                  { key: "foreground", label: "Foreground Color", description: "Text color" },
                ].map((colorField) => (
                  <FormField
                    key={colorField.key}
                    control={form.control}
                    name={`colors.${colorField.key as keyof ColorThemeForm["colors"]}`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{colorField.label}</FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input type="color" className="w-16 p-1 h-10" {...field} />
                            <Input
                              placeholder="#000000"
                              className="flex-1"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormDescription>{colorField.description}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>

              <Button
                type="submit"
                disabled={createThemeMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {createThemeMutation.isPending ? "Creating..." : "Create Theme"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Your Themes */}
      <Card>
        <CardHeader>
          <CardTitle>Your Themes</CardTitle>
          <CardDescription>
            Manage your saved color themes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {themes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No custom themes created yet</p>
              <p className="text-sm">Create your first theme above to get started</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{theme.name}</h3>
                    {theme.isActive && (
                      <Badge variant="default" className="text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {Object.values(theme.colors as any).map((color: string, index: number) => (
                      <div
                        key={index}
                        className="w-6 h-6 rounded-full border"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    {!theme.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleActivateTheme(theme.id)}
                        disabled={activateThemeMutation.isPending}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTheme(theme.id)}
                      disabled={deleteThemeMutation.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}