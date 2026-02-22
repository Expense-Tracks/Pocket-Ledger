import { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, addMonths } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRange, DayPicker } from 'react-day-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface DateRangeValue {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  value: DateRangeValue;
  onChange: (range: DateRangeValue) => void;
}

const PRESETS = [
  { label: 'This Month', range: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Last Month', range: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'Last 3 Months', range: () => ({ from: startOfMonth(subMonths(new Date(), 2)), to: endOfMonth(new Date()) }) },
  { label: 'Last 6 Months', range: () => ({ from: startOfMonth(subMonths(new Date(), 5)), to: endOfMonth(new Date()) }) },
  { label: 'This Year', range: () => ({ from: startOfYear(new Date()), to: endOfMonth(new Date()) }) },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(value.from);
  const [draft, setDraft] = useState<DateRange | undefined>({ from: value.from, to: value.to });

  const now = new Date();
  const isCurrentMonth = month.getMonth() === now.getMonth() && month.getFullYear() === now.getFullYear();

  const handlePrevMonth = () => setMonth(subMonths(month, 1));
  const handleNextMonth = () => {
    const next = addMonths(month, 1);
    if (next <= now) setMonth(next);
  };

  const handleRangeSelect = (range: DateRange | undefined) => {
    setDraft(range);
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
      setOpen(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      // Reset draft to current committed value when opening
      setDraft({ from: value.from, to: value.to });
      setMonth(value.from);
    }
  };

  const handlePreset = (preset: typeof PRESETS[number]) => {
    const r = preset.range();
    onChange(r);
    setDraft({ from: r.from, to: r.to });
    setMonth(r.from);
    setOpen(false);
  };

  const label = `${format(value.from, 'MMM d, yyyy')} – ${format(value.to, 'MMM d, yyyy')}`;

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-normal">
          <CalendarIcon className="h-3.5 w-3.5" />
          <span className="truncate max-w-[180px]">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 max-w-[calc(100vw-2rem)]" align="end" sideOffset={8}>
        <div className="flex flex-col sm:flex-row">
          {/* Presets */}
          <div className="border-b sm:border-b-0 sm:border-r border-border p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">Presets</p>
            <div className="grid grid-cols-3 sm:grid-cols-1 gap-1">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs sm:text-sm h-8 px-2 whitespace-nowrap"
                  onClick={() => handlePreset(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Calendar */}
          <div className="p-3">
            <div className="flex items-center justify-between mb-3">
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{format(month, 'MMMM yyyy')}</span>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={handleNextMonth} disabled={isCurrentMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <DayPicker
              mode="range"
              selected={draft}
              onSelect={handleRangeSelect}
              month={month}
              onMonthChange={setMonth}
              numberOfMonths={1}
              disabled={(date) => date > new Date()}
              showOutsideDays
              className="p-0"
              classNames={{
                months: "flex flex-col space-y-4",
                month: "space-y-4",
                caption: "hidden",
                nav: "hidden",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                row: "flex w-full mt-2",
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
                day_range_end: "day-range-end",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside: "day-outside text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
