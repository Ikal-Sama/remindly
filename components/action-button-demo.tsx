"use client";

import { ActionButton } from "./action-button";
import { Trash2, Download, Share2, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";

export function ActionButtonDemo() {
  const handleDownload = async () => {
    toast.success("Download started!");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast.success("Download completed!");
  };

  const handleShare = async () => {
    toast.success("Shared successfully!");
  };

  const handleLogout = async () => {
    toast.success("Logged out!");
  };

  const handleDelete = async () => {
    toast.success("Item deleted!");
  };

  const handleGoogleSignIn = async () => {
    toast.success("Signing in with Google...");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    toast.success("Signed in with Google!");
  };

  return (
    <div className="space-y-6 p-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold mb-4">Basic Actions</h2>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            onClick={handleDownload}
            icon={<Download />}
            loading={false}
          >
            Download
          </ActionButton>

          <ActionButton
            onClick={handleShare}
            variant="outline"
            icon={<Share2 />}
            iconPosition="right"
          >
            Share
          </ActionButton>

          <ActionButton
            onClick={handleLogout}
            variant="secondary"
            icon={<LogOut />}
          >
            Logout
          </ActionButton>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Social Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            socialButton={{
              provider: "google",
              onClick: handleGoogleSignIn,
            }}
          />

          <ActionButton
            socialButton={{
              provider: "github",
              onClick: () => {
                toast.success("Signing in with GitHub!");
              },
            }}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Different Sizes</h2>
        <div className="flex items-center gap-3">
          <ActionButton size="sm" icon={<Settings />}>
            Small
          </ActionButton>

          <ActionButton size="default" icon={<Settings />}>
            Default
          </ActionButton>

          <ActionButton size="lg" icon={<Settings />}>
            Large
          </ActionButton>

          <ActionButton size="icon" icon={<Settings />} />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Loading States</h2>
        <div className="flex flex-wrap gap-3">
          <ActionButton loading>Loading...</ActionButton>

          <ActionButton
            socialButton={{
              provider: "google",
              onClick: () => {},
              loading: true,
            }}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Full Width</h2>
        <div className="space-y-3">
          <ActionButton fullWidth onClick={handleDownload} icon={<Download />}>
            Full Width Button
          </ActionButton>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">
          Alert Dialog (requires @radix-ui/react-alert-dialog)
        </h2>
        <div className="flex flex-wrap gap-3">
          <ActionButton
            onClick={handleDelete}
            variant="destructive"
            icon={<Trash2 />}
            alertDialog={{
              title: "Are you sure?",
              description:
                "This action cannot be undone. This will permanently delete your item.",
              confirmText: "Delete",
              cancelText: "Cancel",
              onConfirm: handleDelete,
              destructive: true,
            }}
          >
            Delete Item
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
