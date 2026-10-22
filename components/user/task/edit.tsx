"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import CategorySelector from "@/components/ui/category-selector";
import LabelSelector from "@/components/ui/label-selector";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn, toUtcMidnight } from "@/lib/utils";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { useAnalyticsUpdates } from "@/hooks/use-analytics-updates";
import { toast } from "sonner";
import { updateTask } from "@/app/action/task";
import { useSubscription } from "@/hooks/use-subscription";
import { RECURRENCE_OPTIONS } from "@/lib/recurrence";

/**
 * The subset of a task this form reads.
 * Declared structurally rather than reusing `Task` from `@/lib/types`: the
 * task page parses the API's ISO date strings into `Date` objects before
 * storing them, so the fields this component needs differ from the raw
 * network shape.
 */
interface EditTaskProps {
  task: {
    id: string;
    title: string;
    description?: string;
    dueDate?: Date | null;
    reminderDate?: Date | null;
    categoryId?: string | null;
    labels?: Array<{ label?: { id: string } | null }>;
    recurrenceFrequency?: string | null;
    recurrenceInterval?: number;
    recurrenceEndDate?: Date | null;
  };
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
    task.labels ? task.labels.flatMap((taskLabel) => (taskLabel.label ? [taskLabel.label.id] : [])) : []
  );
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<string | null>(
    task.recurrenceFrequency ?? null
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState<number>(
    task.recurrenceInterval ?? 1
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<
    Date | undefined
  >(task.recurrenceEndDate ? new Date(task.recurrenceEndDate) : undefined);
  const { isPro } = useSubscription();

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
      const normalizedDueDate = dueDate ? toUtcMidnight(dueDate) : undefined;

      const normalizedReminderDate = reminderDate ? toUtcMidnight(reminderDate) : undefined;

      const normalizedRecurrenceEndDate = recurrenceEndDate
        ? toUtcMidnight(recurrenceEndDate)
        : undefined;

      const result = await updateTask(task.id, {
        title,
        description,
        dueDate: normalizedDueDate,
        reminderDate: normalizedReminderDate,
        categoryId,
        labelIds,
        recurrenceFrequency,
        recurrenceInterval: recurrenceFrequency ? recurrenceInterval : undefined,
        recurrenceEndDate: recurrenceFrequency
          ? normalizedRecurrenceEndDate
          : undefined,
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
          className="h-28"
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
                )}>
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
                    )}>
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

        <div className="space-y-2">
          <Label>Repeat</Label>
          <Select
            value={recurrenceFrequency ?? ""}
            onValueChange={(value) =>
              setRecurrenceFrequency(
                value === ""
                  ? null
                  : (value as "DAILY" | "WEEKLY" | "MONTHLY")
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Does not repeat" />
            </SelectTrigger>
            <SelectContent>
              {RECURRENCE_OPTIONS.filter((option) => option.value !== "").map(
                (option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        {recurrenceFrequency && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Every</Label>
              <Input
                type="number"
                min={1}
                max={52}
                value={recurrenceInterval}
                onChange={(e) =>
                  setRecurrenceInterval(
                    e.target.value === "" ? 1 : Number(e.target.value)
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <Label>End on (optional)</Label>
              <DatePickerField
                value={recurrenceEndDate}
                onChange={setRecurrenceEndDate}
              />
            </div>
          </div>
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