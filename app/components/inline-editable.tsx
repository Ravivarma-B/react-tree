import React, { useState, useRef, useEffect } from "react";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  textClassName?: string;
  onEditingChange?: (editing: boolean) => void; // NEW
}

const InlineEditable: React.FC<InlineEditableProps> = ({
  text,
  onSave,
  multiline = false,
  className = "",
  elementClassName = "",
  placeholder = "Click to edit",
  noOutline,
  children,
  viewOnly = false,
  textClassName = "",
  onEditingChange,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Sync external text only when not editing
  useEffect(() => {
    if (!isEditing && text !== value) {
      setValue(text);
    }
  }, [text, isEditing, value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    onEditingChange?.(isEditing); // notify parent
  }, [isEditing, onEditingChange]);

  const handleBlur = () => {
    try {
      const valid = NameSchema.parse(value);
      setError(null);
      if (valid !== text) onSave?.(valid);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
        inputRef.current?.focus(); // stay focused to fix error
        return;
      }
    } finally {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation(); // 🚀 prevent Arborist stealing keys

    if (e.key === "Enter") {
      if (!multiline) {
        e.preventDefault();
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setValue(text);
      setIsEditing(false);
    }
  };

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
            className={cn("border px-2 py-1 rounded w-full", elementClassName)}
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn(
              "border-none px-2 py-1 rounded",
              elementClassName,
              noOutline ? "outline-none" : ""
            )}
          />
        )
      ) : (
        <span
          onClick={() => (!viewOnly ? setIsEditing(true) : undefined)}
          className={cn(
            `${!text ? "text-gray-400" : ""}`,
            textClassName,
            viewOnly ? "" : "cursor-text"
          )}
        >
          {children || text}
        </span>
      )}
      {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
};

export default InlineEditable;
