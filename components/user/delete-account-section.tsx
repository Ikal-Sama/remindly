"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth/auth-client";
import { deleteAccount } from "@/app/action/user";

const CONFIRM_WORD = "DELETE";

/**
 * Irreversible account deletion.
 *
 * Requires typing DELETE before the destructive action enables, so a stray
 * click cannot destroy an account. The typed confirmation is deliberately only
 * a client-side speed bump: the real check is the server action re-deriving
 * the session from the request headers.
 */
export function DeleteAccountSection() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = confirmation.trim().toUpperCase() === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!canDelete) return;

    setIsDeleting(true);

    try {
      const result = await deleteAccount();

      if (!result?.success) {
        toast.error(result?.error || "Failed to delete your account.");
        setIsDeleting(false);
        return;
      }

      // The user row and its sessions are gone, so clear the now-dead cookie
      // before redirecting.
      await authClient.signOut().catch(() => {});

      toast.success("Your account has been deleted.");
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("deleteAccount error:", error);
      toast.error("Failed to delete your account. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      setConfirmation("");
      setIsDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardContent className="p-4 md:p-6 space-y-4">
        <div>
          <h2 className="text-lg md:text-xl font-semibold">Danger zone</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Permanently delete your account and all of its data.
          </p>
        </div>

        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete account</Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription className="space-y-3">
                <span className="block">
                  Your account will close and your access to Remindly will end
                  straight away.
                </span>
                <span className="block">
                  From our database we permanently delete your account and all
                  of its data &mdash; your tasks, categories, labels and
                  subscription history. This cannot be undone and we cannot
                  restore it for you.
                </span>
                <span className="block text-xs">
                  If you have an active paid subscription it is cancelled at
                  the same time. Note that our payment processor may still
                  retain a minimal transaction record where tax or accounting
                  law requires it, even though your account is gone.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="space-y-2">
              <Label htmlFor="delete-confirmation">
                Type <span className="font-mono font-semibold">DELETE</span> to
                confirm
              </Label>
              <Input
                id="delete-confirmation"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                disabled={isDeleting}
              />
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(event) => {
                  // Keep the dialog open unless the deletion actually runs.
                  event.preventDefault();
                  void handleDelete();
                }}
                disabled={!canDelete || isDeleting}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting…" : "Delete permanently"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
