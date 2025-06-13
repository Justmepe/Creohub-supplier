import { useState, useRef } from "react";
import { Upload, X, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  currentImageUrl?: string;
  onUpload: (file: File) => Promise<void>;
  uploading: boolean;
  type: "logo" | "banner";
  aspectRatio?: string;
  maxSizeMB?: number;
}

export default function ImageUpload({
  currentImageUrl,
  onUpload,
  uploading,
  type,
  aspectRatio = "auto",
  maxSizeMB = 5
}: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, JPEG, GIF)",
        variant: "destructive",
      });
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Please upload an image smaller than ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    try {
      await onUpload(file);
      toast({
        title: "Upload successful",
        description: `${type === 'logo' ? 'Logo' : 'Banner'} uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const getPlaceholderDimensions = () => {
    if (type === 'logo') {
      return 'h-32 w-32';
    }
    return 'h-32 w-full';
  };

  const getImageDimensions = () => {
    if (type === 'logo') {
      return 'h-32 w-32 object-cover rounded-lg';
    }
    return 'h-32 w-full object-cover rounded-lg';
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">
              {type === 'logo' ? 'Store Logo' : 'Store Banner'}
            </h3>
            {currentImageUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={openFileDialog}
                disabled={uploading}
              >
                Change
              </Button>
            )}
          </div>

          {currentImageUrl ? (
            <div className="relative">
              <img
                src={currentImageUrl}
                alt={type === 'logo' ? 'Store logo' : 'Store banner'}
                className={getImageDimensions()}
              />
            </div>
          ) : (
            <div
              className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg transition-colors ${
                dragActive ? 'border-primary bg-primary/10' : ''
              } ${getPlaceholderDimensions()}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center justify-center h-full p-4 text-center cursor-pointer" onClick={openFileDialog}>
                {uploading ? (
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Image className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {type === 'logo' ? 'Upload logo' : 'Upload banner'}
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG up to {maxSizeMB}MB
                    </p>
                    {type === 'logo' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended: 200x200px
                      </p>
                    )}
                    {type === 'banner' && (
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended: 1200x300px
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {!currentImageUrl && (
            <Button
              onClick={openFileDialog}
              disabled={uploading}
              className="w-full"
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Uploading...' : `Upload ${type === 'logo' ? 'Logo' : 'Banner'}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}