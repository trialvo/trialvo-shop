"use client";

import { format } from "date-fns";
import * as React from "react";
import { MdOutlineWatchLater } from "react-icons/md";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  value?: Date;
  onChange: (date?: Date) => void;

  placeholder?: string;
  disabled?: boolean;
  fromYear?: number;
  toYear?: number;

  className?: string;
};

const DatePicker: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled,
  fromYear = 1950,
  toYear = new Date().getFullYear() + 10,
  className,
}) => {
  const [open, setOpen] = React.useState<boolean>(false);

  const handleDateSelect = (date?: Date) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between rounded-[4px] border border-border bg-background px-3 text-[14px] font-normal text-foreground shadow-none",
            "hover:bg-background focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-foreground/20",
            !value && "text-[#999999]",
            className
          )}
        >
          <span className="truncate">
            {value ? format(value, "PPP") : placeholder}
          </span>
          <MdOutlineWatchLater className="h-4 w-4 text-[#8A8A8A]" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          captionLayout="dropdown"
          fromYear={fromYear}
          toYear={toYear}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};

export default DatePicker;
