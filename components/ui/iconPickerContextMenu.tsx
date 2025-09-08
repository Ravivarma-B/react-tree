"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { IconPicker } from "@/components/ui/iconPicker";
import { Pen } from "lucide-react";

interface TreeContextMenuProps {
  children: React.ReactNode;
  onChangeIcon: (icon: string) => void;
  isGrouped?: boolean;
  isDisabled?: boolean;
  isVisible?: boolean;
  isRequired?: boolean;
}

export const IconContextMenu: React.FC<TreeContextMenuProps> = ({
  children,
  onChangeIcon,
}) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-100">
        <ContextMenuItem>
          <Pen className="w-4 h-4 mr-2" />
          Change Icon
        </ContextMenuItem>

        <ContextMenuSeparator />

        <IconPicker
          value=""
          onChange={function (icon: string): void {
            // console.log(icon);
            onChangeIcon(icon);
          }}
        />
      </ContextMenuContent>
    </ContextMenu>
  );
};
