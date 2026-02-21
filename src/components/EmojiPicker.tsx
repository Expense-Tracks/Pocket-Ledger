import { useState, useEffect } from 'react';
import EmojiPickerReact, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
}

export function EmojiPicker({ value, onChange, label = 'Icon' }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(
    document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT
  );

  // Watch for theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? Theme.DARK : Theme.LIGHT);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange(emojiData.emoji);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start text-left font-normal"
          >
            <span className="text-2xl mr-2">{value || '😀'}</span>
            <span className="text-muted-foreground">Click to change icon</span>
            <Smile className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 border-0" align="start">
          <EmojiPickerReact
            onEmojiClick={handleEmojiClick}
            theme={theme}
            width="100%"
            height={400}
            searchPlaceHolder="Search emoji..."
            previewConfig={{
              showPreview: false,
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
