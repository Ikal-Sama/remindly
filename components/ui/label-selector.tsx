"use client";

import { useState, useEffect } from "react";
import { Check, Plus, Hash, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelSelectorProps {
  selectedLabels: string[];
  onLabelsChange: (labelIds: string[]) => void;
  disabled?: boolean;
}

export default function LabelSelector({
  selectedLabels,
  onLabelsChange,
  disabled = false,
}: LabelSelectorProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newLabelName, setNewLabelName] = useState("");
  const [newLabelColor, setNewLabelColor] = useState("#10B981");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchLabels();
  }, []);

  const fetchLabels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/labels");
      if (response.ok) {
        const data = await response.json();
        setLabels(data.labels || []);
      }
    } catch (error) {
      console.error("Error fetching labels:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      toast.error("Label name is required");
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/labels", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newLabelName.trim(),
          color: newLabelColor,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setLabels([...labels, data.label]);
        setNewLabelName("");
        setNewLabelColor("#10B981");
        setIsCreateDialogOpen(false);
        toast.success("Label created successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create label");
      }
    } catch (error) {
      console.error("Error creating label:", error);
      toast.error("Failed to create label");
    } finally {
      setIsCreating(false);
    }
  };

  const handleLabelToggle = (labelId: string) => {
    if (selectedLabels.includes(labelId)) {
      onLabelsChange(selectedLabels.filter((id) => id !== labelId));
    } else {
      onLabelsChange([...selectedLabels, labelId]);
    }
  };

  const removeLabel = (labelId: string) => {
    onLabelsChange(selectedLabels.filter((id) => id !== labelId));
  };

  const selectedLabelObjects = labels.filter((label) =>
    selectedLabels.includes(label.id)
  );

  return (
    <div className="space-y-2">
      <Label>Labels</Label>

      {/* Selected labels display */}
      {selectedLabelObjects.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedLabelObjects.map((label) => (
            <div
              key={label.id}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: `${label.color}20`,
                color: label.color,
                border: `1px solid ${label.color}40`,
              }}
            >
              <span>{label.name}</span>
              <button
                onClick={() => removeLabel(label.id)}
                className="ml-1 hover:opacity-70"
                disabled={disabled}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start"
            disabled={disabled || isLoading}
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="w-4 h-4" />
              <span>Add labels</span>
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
          {labels.map((label) => (
            <DropdownMenuItem
              key={label.id}
              onClick={() => handleLabelToggle(label.id)}
            >
              <div className="flex items-center gap-2 flex-1">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: label.color }}
                />
                <span>{label.name}</span>
                {selectedLabels.includes(label.id) && (
                  <Check className="w-4 h-4 ml-auto" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Plus className="w-4 h-4 mr-2" />
                Create new label
              </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Label</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="labelName">Name</Label>
                  <Input
                    id="labelName"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Enter label name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="labelColor">Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="labelColor"
                      type="color"
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      className="w-16 h-10"
                    />
                    <Input
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    disabled={isCreating}
                    onClick={handleCreateLabel}
                  >
                    {isCreating ? "Creating..." : "Create"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
