import React, { useState, useRef, useEffect } from "react";
import { cn } from "../utils/FormUtils";
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
  children?: React.ReactNode;
}

export const InlineEditable: React.FC<InlineEditableProps> = ({
  text,
  onSave,
  multiline = false,
  className = "",
  elementClassName = "",
  placeholder = "Click to edit",
  noOutline,
  children,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(text);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    try {
      const valid = NameSchema.parse(value);
      setError(null);
      if (valid !== text) onSave?.(valid);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0].message);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !multiline) {
      inputRef.current?.blur();
    }

    if (e.key === "Escape") {
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
              "border-none px-2 py-1 rounded",
              elementClassName,
              noOutline ? "outline-none" : ""
            )}
          />
        )
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`cursor-text ${!text ? "text-gray-400" : ""}`}
        >
          {children || text}
        </span>
      )}
    </div>
  );
};

export default InlineEditable;
