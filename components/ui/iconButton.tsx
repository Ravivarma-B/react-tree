// components/icon-button.tsx
"use client";

import { DynamicIcon, iconNames } from "lucide-react/dynamic";
import Image from "next/image";
import { useMemo } from "react";

export interface UserIcon {
  key: string;
  name: string;
  url: string;
}

interface IconButtonProps {
  icon: string; // just the icon name
  userIcons?: Record<string, UserIcon>; // optional: for uploaded icons
  isSelected?: boolean;
  onClick?: (name: string) => void;
  size?: number;
  className?: string;
}

export function IconButton({
  icon,
  userIcons = {},
  isSelected = false,
  onClick,
  size = 20,
  className = "",
}: IconButtonProps) {
  // Decide source: lucide or user
  const source = useMemo(() => {
    if ((iconNames as string[]).includes(icon)) return "lucide";
    if (userIcons[icon]) return "user";
    return null;
  }, [icon, userIcons]);

  return (
    <>
      <span className={className}>
        {source === "lucide" && (
          <DynamicIcon
            name={icon as never}
            style={{ width: size, height: size }}
          />
        )}
        {source === "user" && (
          <Image
            src={userIcons[icon].url}
            alt={icon}
            width={size}
            height={size}
          />
        )}
      </span>
    </>
  );
}
