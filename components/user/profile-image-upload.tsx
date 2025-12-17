"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Camera } from "lucide-react";
import { useUserStore } from "@/stores/user-store";

interface ProfileImageUploadProps {
  currentImage?: string;
  userName?: string;
  onImageUpdate: (imageUrl: string) => void;
  className?: string;
}

export function ProfileImageUpload({
  currentImage,
  userName,
  onImageUpdate,
  className = "",
}: ProfileImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { updateUserProfile } = useUserStore();

  // Generate unique upload folder and public ID
  const generateUploadParams = useCallback(() => {
    const timestamp = Math.floor(Date.now() / 1000); // Use Unix timestamp in seconds
    const userId = userName?.replace(/[^a-zA-Z0-9]/g, "_") || "user";
    return {
      folder: `profile-images/${userId}`,
      publicId: `avatar_${timestamp}`,
      resourceType: "image",
      maxFileSize: 5000000, // 5MB
      allowedFormats: ["jpg", "jpeg", "png", "webp"],
      clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
      maxImageWidth: 1200,
      maxImageHeight: 1200,
      crop: "limit",
      quality: "auto:good",
      fetch_format: "auto",
      timestamp, // Include timestamp for signature
    };
  }, [userName]);

  const handleUploadSuccess = useCallback(
    async (result: any, { widget }: any) => {
      setIsUploading(false);
      setUploadProgress(100);

      if (result.event === "success") {
        const imageUrl = result.info.secure_url;

        // Update user profile in database via the same endpoint
        try {
          const response = await fetch("/api/cloudinary/sign-upload", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ imageUrl }),
          });

          if (response.ok) {
            const data = await response.json();
            // Profile image updated in database

            // Update the Zustand store state
            updateUserProfile({ image: imageUrl });

            // Zustand store updated with new image
          }
        } catch (error) {
          // Failed to update profile in database
          toast.error("Failed to save image to database");
        }

        onImageUpdate(imageUrl);
        toast.success("Profile image updated successfully!");
        widget.close();
      }
    },
    [onImageUpdate, updateUserProfile]
  );

  const handleUploadError = useCallback((error: any) => {
    setIsUploading(false);
    setUploadProgress(0);
    // Upload error handled
    toast.error("Failed to upload image. Please try again.");
  }, []);

  const handleUploadOpen = useCallback(() => {
    setIsUploading(true);
    setUploadProgress(0);
  }, []);

  const handleUploadClose = useCallback(() => {
    setIsUploading(false);
    setUploadProgress(0);
  }, []);

  return (
    <div className={`relative group ${className}`}>
      <div className="relative w-[150px] h-[150px] overflow-hidden rounded-full border-2 border-border transition-all duration-200 hover:border-primary">
        <Image
          src={currentImage || "/profile-picture.png"}
          alt={userName || "Profile"}
          fill
          className=" object-cover"
          priority
        />

        {/* Upload overlay */}
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <CldUploadWidget
            signatureEndpoint="/api/cloudinary/sign-upload"
            uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET}
            onSuccess={handleUploadSuccess}
            onError={handleUploadError}
            onOpen={handleUploadOpen}
            onClose={handleUploadClose}
            options={{
              ...generateUploadParams(),
              multiple: false,
              showAdvancedOptions: false,
              cropping: true,
              croppingAspectRatio: 1,
              croppingShowDimensions: true,
              showSkipCropButton: false,
              sources: ["local", "camera", "url"],
              theme: "minimal",
            }}
          >
            {({ open }) => (
              <Button
                onClick={(e) => {
                  e.preventDefault();
                  open();
                }}
                disabled={isUploading}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </Button>
            )}
          </CldUploadWidget>
        </div>

        {/* Upload progress indicator */}
        {isUploading && (
          <div className="absolute bottom-0 left-0 right-0 p-1">
            <Progress value={uploadProgress} className="h-1" />
          </div>
        )}
      </div>
    </div>
  );
}
