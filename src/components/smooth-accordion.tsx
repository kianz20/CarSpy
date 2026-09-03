"use client";

import { ReactNode, useState, useRef, useEffect } from "react";

type SmoothAccordionProps = {
  id: string;
  title: ReactNode;
  rightContent?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function SmoothAccordion({
  id,
  title,
  rightContent,
  children,
  defaultOpen = false,
  isOpen: controlledOpen,
  onOpenChange,
}: SmoothAccordionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(isOpen ? contentRef.current.scrollHeight : 0);
    }
  }, [isOpen]);

  const handleToggle = () => {
    const newOpen = !isOpen;
    setInternalOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <div className="card overflow-hidden">
      <button
        onClick={handleToggle}
        className="flex w-full cursor-pointer list-none select-none items-baseline justify-between gap-4 px-4 py-3.5 text-left hover:bg-surface-2/30 transition-colors"
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className={`h-4 w-4 shrink-0 text-accent transition-transform duration-500 ${
              isOpen ? "rotate-90" : ""
            }`}
            aria-hidden="true"
          >
            <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
          </svg>
          {title}
        </span>
        {rightContent}
      </button>

      <div
        id={`${id}-content`}
        ref={contentRef}
        style={{
          maxHeight: `${height}px`,
        }}
        className="overflow-hidden border-t border-border transition-all duration-500 ease-in-out"
      >
        <div className="px-4 pb-4 pt-4">{children}</div>
      </div>
    </div>
  );
}
