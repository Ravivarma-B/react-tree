"use client";

import { cn } from "@/lib/utils";
import React from "react";
import { z } from "zod";

const NameSchema = z.string().min(1, "Name cannot be empty").max(100);

interface InlineEditableProps {
  text: string;
  onSave?: (newText: string) => void;
  multiline?: boolean;
  className?: string;
  noOutline?: boolean;
  elementClassName?: string;
  placeholder?: string;
  viewOnly?: boolean;
  children?: React.ReactNode;
}

const InlineEditable: React.FC<InlineEditableProps> = React.memo(
  ({
    text,
    onSave,
    multiline = false,
    className = "",
    elementClassName = "",
    placeholder = "Click to edit",
    noOutline,
    children,
    viewOnly = false,
  }) => {
    const [isEditing, setIsEditing] = React.useState(false);
    const [value, setValue] = React.useState(text);
    const [error, setError] = React.useState<string | null>(null);
    const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    React.useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    React.useEffect(() => {
      setValue(text);
    }, [text]);

    const handleBlur = () => {
      setIsEditing(false);
      try {
        const valid = NameSchema.parse(value);
        setError(null);
        if (valid !== text) onSave?.(valid);
      } catch (err) {
        if (err instanceof z.ZodError) setError(err.issues[0].message);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !multiline) inputRef.current?.blur();
      if (e.key === "Escape") {
        setValue(text);
        setIsEditing(false);
      }
    };

    const display = React.useMemo(() => children || text, [children, text]);

    return (
      <div className={`inline-editable ${className}`}>
        {isEditing ? (
          multiline ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="border px-2 py-1 rounded w-full"
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                "border-none px-2 py-1 rounded w-full",
                elementClassName,
                noOutline ? "outline-none" : ""
              )}
            />
          )
        ) : (
          <span
            onClick={() => (!viewOnly ? setIsEditing(true) : null)}
            className={`cursor-text truncate block ${
              !text ? "text-gray-400" : ""
            }`}
            title={text}
          >
            {display}
          </span>
        )}
      </div>
    );
  }
);

// ✅ Fix for ESLint warning
InlineEditable.displayName = "InlineEditable";

export default InlineEditable;
