import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface DynamicFontSizeTextProps {
  text: string;
  initialFontSizeClass?: string; 
  minFontSizePx?: number; 
  className?: string;
  containerRef?: React.RefObject<HTMLElement>; 
}

const DynamicFontSizeText: React.FC<DynamicFontSizeTextProps> = ({
  text,
  initialFontSizeClass = 'text-xl',
  minFontSizePx = 14, // Default minimum
  className,
  containerRef: propContainerRef,
}) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const internalContainerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState<string | undefined>(undefined);

  const containerElement = propContainerRef?.current || internalContainerRef.current;

  const adjustFontSize = useCallback(() => {
    if (!textRef.current || !containerElement) {
      return;
    }

    // Reset font size to measure original width
    textRef.current.style.fontSize = '';
    const initialFontSize = getComputedStyle(textRef.current).fontSize; // Get actual pixel value
    let currentFontSizePx = parseFloat(initialFontSize);

    // If the text overflows, reduce font size until it fits or reaches minFontSizePx
    while (textRef.current.offsetWidth > containerElement.offsetWidth && currentFontSizePx > minFontSizePx) {
      currentFontSizePx -= 1; // Decrease by 1px
      textRef.current.style.fontSize = `${currentFontSizePx}px`;
    }

    if (currentFontSizePx !== parseFloat(initialFontSize)) {
      setFontSize(`${currentFontSizePx}px`);
    } else {
      setFontSize(undefined); // Use default class if no adjustment needed
    }
  }, [minFontSizePx, containerElement]);

  useEffect(() => {
    // Initial adjustment
    adjustFontSize();

    // Adjust on window resize
    window.addEventListener('resize', adjustFontSize);
    return () => window.removeEventListener('resize', adjustFontSize);
  }, [adjustFontSize]);

  // Adjust on text change
  useEffect(() => {
    adjustFontSize();
  }, [text, adjustFontSize]);

  return (
    <div ref={internalContainerRef} className={cn('w-full min-w-0 overflow-hidden whitespace-nowrap', className)}>
      <span
        ref={textRef}
        className={cn(initialFontSizeClass)} // Apply initial size class
        style={{ fontSize: fontSize }} // Override with dynamic size if adjusted
      >
        {text}
      </span>
    </div>
  );
};

export default DynamicFontSizeText;
