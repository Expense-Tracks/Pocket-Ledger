import { useState } from 'react';
import { format, subDays, startOfWeek, startOfMonth, addMonths, subMonths } from 'date-fns';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { Button, buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  showShortcuts?: boolean;
}

export function DatePicker({ 
  date, 
  onDateChange, 
  label = 'Date', 
  placeholder = 'Pick a date',
  showShortcuts = true 
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<Date>(date || new Date());

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(selectedDate);
      setOpen(false);
    }
  };

  const handleShortcut = (shortcutDate: Date) => {
    onDateChange(shortcutDate);
    setMonth(shortcutDate);
    setOpen(false);
  };

  const shortcuts = [
    { label: 'Today', date: new Date() },
    { label: 'Yesterday', date: subDays(new Date(), 1) },
    { label: '2 Days Ago', date: subDays(new Date(), 2) },
    { label: '3 Days Ago', date: subDays(new Date(), 3) },
    { label: 'Start of Week', date: startOfWeek(new Date(), { weekStartsOn: 1 }) },
    { label: 'Start of Month', date: startOfMonth(new Date()) },
  ];

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  // Check if we're viewing the current month/year
  const isCurrentMonth = month.getMonth() === currentMonth && month.getFullYear() === currentYear;
  const isFutureMonth = month > new Date();

  const handleMonthChange = (monthIndex: string) => {
    const newMonth = new Date(month);
    newMonth.setMonth(parseInt(monthIndex));
    // Don't allow future months
    if (newMonth <= new Date()) {
      setMonth(newMonth);
    }
  };

  const handleYearChange = (year: string) => {
    const newMonth = new Date(month);
    newMonth.setFullYear(parseInt(year));
    // Don't allow future dates
    if (newMonth <= new Date()) {
      setMonth(newMonth);
    }
  };

  const handleNextMonth = () => {
    const nextMonth = addMonths(month, 1);
    // Only allow if not going into future
    if (nextMonth <= new Date()) {
      setMonth(nextMonth);
    }
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 flex-shrink-0" />
            <span className="truncate">
              {date ? format(date, 'EEEE, MMMM d, yyyy') : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 max-w-[calc(100vw-2rem)]" 
          align="center"
          sideOffset={8}
        >
          <div className="flex flex-col sm:flex-row">
            {/* Shortcuts - Horizontal on mobile, vertical on desktop */}
            {showShortcuts && (
              <div className="border-b sm:border-b-0 sm:border-r border-border p-3">
                <p className="text-xs font-semibold text-muted-foreground mb-2 px-1">Quick Select</p>
                <div className="grid grid-cols-3 sm:grid-cols-1 gap-1">
                  {shortcuts.map((shortcut) => (
                    <Button
                      key={shortcut.label}
                      variant="ghost"
                      size="sm"
                      className="justify-start text-xs sm:text-sm h-8 px-2 whitespace-nowrap"
                      onClick={() => handleShortcut(shortcut.date)}
                    >
                      {shortcut.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Calendar Section */}
            <div className="p-3 w-full sm:w-auto">
              {/* Month/Year Selectors - Stacked on mobile */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center justify-between sm:justify-start gap-2 order-2 sm:order-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => setMonth(subMonths(month, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0 sm:hidden"
                    onClick={handleNextMonth}
                    disabled={isCurrentMonth || isFutureMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2 order-1 sm:order-2">
                  <Select value={month.getMonth().toString()} onValueChange={handleMonthChange}>
                    <SelectTrigger className="h-8 flex-1 sm:w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((m, i) => {
                        // Disable future months in current year
                        const isDisabled = month.getFullYear() === currentYear && i > currentMonth;
                        return (
                          <SelectItem key={i} value={i.toString()} disabled={isDisabled}>
                            {m}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  
                  <Select value={month.getFullYear().toString()} onValueChange={handleYearChange}>
                    <SelectTrigger className="h-8 w-[90px] sm:w-[80px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0 hidden sm:flex order-3"
                  onClick={handleNextMonth}
                  disabled={isCurrentMonth || isFutureMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Calendar */}
              <DayPicker
                mode="single"
                selected={date}
                onSelect={handleSelect}
                month={month}
                onMonthChange={setMonth}
                disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                showOutsideDays={true}
                className="p-0"
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "hidden",
                  caption_label: "text-sm font-medium",
                  nav: "hidden",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-muted-foreground rounded-md w-8 sm:w-9 font-normal text-[0.7rem] sm:text-[0.8rem]",
                  row: "flex w-full mt-2",
                  cell: "h-8 w-8 sm:h-9 sm:w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: cn(
                    buttonVariants({ variant: "ghost" }),
                    "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100 text-sm"
                  ),
                  day_range_end: "day-range-end",
                  day_selected:
                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-semibold ring-2 ring-primary ring-offset-2",
                  day_outside:
                    "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
