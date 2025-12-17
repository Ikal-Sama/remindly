"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import CategorySelector from "@/components/ui/category-selector";
import LabelSelector from "@/components/ui/label-selector";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateTask } from "@/app/action/task";
import { authClient } from "@/lib/auth/auth-client";
import { useAnalyticsUpdates } from "@/hooks/use-analytics-updates";

interface EditTaskProps {
  task: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditTask({ task, onSuccess, onCancel }: EditTaskProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { onTaskUpdated } = useAnalyticsUpdates();

  const [title, setTitle] = useState(task.title || "");
  const [description, setDescription] = useState(task.description || "");
  const [dueDate, setDueDate] = useState<Date | undefined>(
    task.dueDate ? new Date(task.dueDate) : undefined
  );
  const [reminderDate, setReminderDate] = useState<Date | undefined>(
    task.reminderDate ? new Date(task.reminderDate) : undefined
  );
  const [categoryId, setCategoryId] = useState<string | undefined>(
    task.categoryId || undefined
  );
  const [labelIds, setLabelIds] = useState<string[]>(
    task.labels ? task.labels.map((taskLabel: any) => taskLabel.label.id) : []
  );
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const response = await fetch("/api/subscription/create", {
          method: "GET",
        });

        if (!response.ok) {
          return;
        }

        const data = await response.json();
        const currentPlan: string | undefined =
          data?.currentSubscription?.plan?.name;

        setIsPro(currentPlan === "PRO");
      } catch (error) {
        console.error("Error fetching subscription in EditTask:", error);
      }
    };

    fetchSubscription();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    // Validate reminder date logic
    if (reminderDate && dueDate) {
      const reminderTime = reminderDate.getTime();
      const dueTime = dueDate.getTime();

      if (reminderTime === dueTime) {
        toast.error("Reminder date cannot be equivalent to due date");
        return;
      }

      if (reminderTime >= dueTime) {
        toast.error("Reminder date must be before due date");
        return;
      }
    }

    setIsLoading(true);
    try {
      // Convert dates to UTC midnight to avoid timezone issues
      const normalizedDueDate = dueDate
        ? new Date(
            Date.UTC(
              dueDate.getFullYear(),
              dueDate.getMonth(),
              dueDate.getDate(),
              0,
              0,
              0,
              0
            )
          )
        : undefined;

      const normalizedReminderDate = reminderDate
        ? new Date(
            Date.UTC(
              reminderDate.getFullYear(),
              reminderDate.getMonth(),
              reminderDate.getDate(),
              0,
              0,
              0,
              0
            )
          )
        : undefined;

      const result = await updateTask(task.id, {
        title,
        description,
        dueDate: normalizedDueDate,
        reminderDate: normalizedReminderDate,
        categoryId,
        labelIds,
      });

      if (result.success) {
        toast.success("Task updated successfully!");
        onTaskUpdated();
        onSuccess();
      } else {
        toast.error(result.error || "Failed to update task");
      }
    } catch (error) {
      console.error("Update task error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter task title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter task description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={setDueDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {isPro && (
          <>
            <div className="space-y-2">
              <Label>Reminder Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !reminderDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reminderDate ? format(reminderDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={reminderDate}
                    onSelect={setReminderDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <CategorySelector
                selectedCategory={categoryId}
                onCategoryChange={setCategoryId}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <LabelSelector
                selectedLabels={labelIds}
                onLabelsChange={setLabelIds}
                disabled={isLoading}
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          Update Task
        </Button>
      </div>
    </form>
  );
}
