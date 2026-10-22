"use client";

import { useState } from "react";
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
import CategorySelector from "@/components/ui/category-selector";
import LabelSelector from "@/components/ui/label-selector";
import { toUtcMidnight } from "@/lib/utils";
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
          placeholder="Enter title"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write description here..."
          className="h-28"
        />
      </div>

      <div className="space-y-2">
        <Label>Due date</Label>
        <DatePickerField value={dueDate} onChange={setDueDate} />
      </div>

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
        <>
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
        </>
      )}

      {isPro && (
        <>
          <div className="space-y-2">
            <Label>Reminder date</Label>
            <DatePickerField
              value={reminderDate}
              onChange={setReminderDate}
            />
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

      <div className="flex justify-end gap-2">
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