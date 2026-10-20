import { Calendar } from "./calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

export function DatePickerField({
  value,
  onChange,
}: {
  value: Date | undefined;
  onChange: (date: Date) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="w-full justify-start text-left font-normal">
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : "Pick a date"}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
        />
      </PopoverContent>
    </Popover>
  );
}