import { useState, useEffect } from 'react';
import EmojiPickerReact, { EmojiClickData, Theme } from 'emoji-picker-react';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { Smile } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
}

export function EmojiPicker({ value, onChange, label = 'Icon' }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();
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

  // Get responsive dimensions
  const pickerWidth = isMobile ? Math.min(window.innerWidth - 32, 350) : 350;
  const pickerHeight = isMobile ? 400 : 450;

  const triggerButton = (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-start text-left font-normal"
    >
      <span className="text-2xl mr-2 flex-shrink-0">{value || '😀'}</span>
      <span className="text-muted-foreground truncate">Click to change icon</span>
      <Smile className="ml-auto h-4 w-4 opacity-50 flex-shrink-0" />
    </Button>
  );

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {triggerButton}
        </DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <div className="flex justify-center py-4 overflow-hidden">
            <EmojiPickerReact
              onEmojiClick={handleEmojiClick}
              theme={theme}
              width={pickerWidth}
              height={pickerHeight}
              searchPlaceHolder="Search emoji..."
              previewConfig={{
                showPreview: false,
              }}
              skinTonesDisabled
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
