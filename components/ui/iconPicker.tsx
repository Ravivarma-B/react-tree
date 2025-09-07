"use client";

import { DynamicIcon, iconNames } from "lucide-react/dynamic";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CellComponentProps, Grid } from "react-window";
// Import default
import FlexSearch from "flexsearch";

// OR, if using named imports (for older versions or specific builds)

import { UserRoundPlus } from "lucide-react";
import Image from "next/image";
import { Button } from "./button";
import { Input } from "./input";

const ICONS_PER_ROW = 9;
const ICON_SIZE = 40;
const ROW_HEIGHT = 50;

interface UserIcon {
  key: string;
  name: string;
  url: string;
  hash?: string; // added from API
  duplicate?: boolean; // added for upload response
}

type CellData = {
  icons: (string | UserIcon)[];
  value?: string;
  onChange: (icon: string) => void;
  search?: string;
};

const Cell = React.memo(
  ({
    columnIndex,
    rowIndex,
    style,
    data,
  }: CellComponentProps<{ data: CellData }>) => {
    const { icons, value, onChange } = data;
    const iconIndex = rowIndex * ICONS_PER_ROW + columnIndex;
    if (iconIndex >= icons.length) return null;

    const icon = icons[iconIndex];
    const iconName = typeof icon === "string" ? icon : icon.name;

    return (
      <div style={style} className="flex items-center justify-center">
        <Button
          variant="ghost"
          className={`flex flex-col items-center justify-center w-16 h-16 p-1 ${
            value === iconName
              ? "bg-primary text-primary-foreground rounded-md"
              : ""
          }`}
          onClick={() => onChange(iconName)}
          title={
            typeof icon === "object" && Object.hasOwn(icon, "name")
              ? icon.name
              : iconName
          }
        >
          {typeof icon === "string" ? (
            <DynamicIcon name={iconName as never} className="w-5 h-5 mb-1" />
          ) : (
            <Image
              src={icon.url}
              className="w-5 h-5"
              alt={icon.name}
              width={20}
              height={20}
            />
          )}
        </Button>
      </div>
    );
  }
);

Cell.displayName = "IconPickerCell";

export function IconPicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (icon: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [userIcons, setUserIcons] = useState<Record<string, UserIcon>>({});

  // Store FlexSearch index in ref to avoid rebuilding
  const indexRef = useRef<FlexSearch.Document<{
    id: string;
    name: string;
  }> | null>(null);

  const fetchUserIcons = useCallback(async () => {
    try {
      const res = await fetch("/api/upload-icon");
      if (!res.ok) throw new Error("Failed to fetch user icons");
      const data = await res.json();
      setUserIcons(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchUserIcons();
  }, [fetchUserIcons]);

  // Map of iconName -> icon (string or CustomIcon)
  const iconMap = useMemo(() => {
    const map = new Map<string, string | UserIcon>();
    iconNames.forEach((name) => map.set(name, name));
    Object.values(userIcons).forEach((ui) => map.set(ui.name, ui));
    return map;
  }, [userIcons]);

  // Build index only once
  useMemo(() => {
    const idx = new FlexSearch.Document<{ id: string; name: string }>({
      document: { id: "id", index: ["name"] },
      tokenize: "forward",
      resolution: 1,
    });

    iconNames.forEach((name) => idx.add({ id: name, name }));

    Object.values(userIcons).forEach((c) =>
      idx.add({ id: c.name, name: c.name })
    );

    indexRef.current = idx;
  }, [userIcons]);

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
  }, []);

  // Get filtered icons
  const filteredIcons = useMemo(() => {
    if (!search.trim()) return [...iconMap.values()];

    const results = indexRef.current?.search(search) ?? [];
    const names = results.flatMap((r: { result: never }) => r.result);

    return names.map((name: string) => iconMap.get(name)!);
  }, [search, iconMap]);

  const rowCount = Math.ceil(filteredIcons.length / ICONS_PER_ROW);

  const cellData = useMemo(
    () => ({ icons: filteredIcons, value, onChange, search }),
    [filteredIcons, value, onChange, search]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload-icon", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data: UserIcon = await res.json();

      if (data.duplicate) {
        alert(`Duplicate detected: using existing "${data.name}"`);
      }

      // ✅ Update state
      setUserIcons((prev) => ({ ...prev, [data.key]: data }));

      // Select the new/duplicate icon automatically
      // onChange(data.name);
      handleSearchChange(data.name);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  return (
    <div className="space-y-2">
      <p>Pick your icon of your choice..</p>
      {/* File Upload */}
      <div className="flex justify-center mb-2 gap-2">
        <Input
          name="search"
          placeholder="Search icons..."
          value={search}
          onChange={(e) => {
            e.stopPropagation();
            handleSearchChange(e.target.value);
          }}
          onKeyDown={(e) => e.stopPropagation()}
        />
        <div>
          <input
            id="file-upload"
            type="file"
            accept=".svg"
            className="hidden"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              handleFileUpload(e);
            }}
          />
          <label
            htmlFor="file-upload"
            className="inline-flex p-[7px] items-center rounded-md cursor-pointer transition-colors border"
            onClick={(e) => e.stopPropagation()}
            title="Add New Icon"
          >
            <UserRoundPlus className="w-5 h-5" />
          </label>
        </div>
      </div>

      {/* Search Input */}

      {/* Icon Grid */}
      <div className="border rounded-md !scrollbar-hide h-[250px]">
        <Grid
          columnCount={ICONS_PER_ROW}
          columnWidth={ICON_SIZE}
          rowCount={rowCount}
          rowHeight={ROW_HEIGHT}
          className="!scrollbar-hide"
          cellComponent={Cell}
          cellProps={{ data: cellData }}
        />
      </div>
    </div>
  );
}
