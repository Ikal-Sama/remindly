import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn, startOfTomorrow } from "@/lib/utils";

export function DatePickerField({
  value,
  onChange,
}: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        {/*
          Uses the shared Button (inline-flex items-center) rather than a raw
          <button>, so the calendar icon and the date text are vertically
          centred and the trigger matches the other form inputs. `justify-start`
          overrides the Button's default `justify-center`.
        */}
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {value ? format(value, "PPP") : "Pick a date"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          disabled={{ before: startOfTomorrow() }}
        />
      </PopoverContent>
    </Popover>
  );
}
