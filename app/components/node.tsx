"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/iconButton";
import { IconContextMenu } from "@/components/ui/iconPickerContextMenu";
import { cn } from "@/lib/utils";
import {
  addChildNode,
  addSiblingNode,
  buildAncestorLastMap,
  deleteNode,
  duplicateNode,
  toggleNodeSelection,
  updateAllParentIcons,
  updateNodeIcon,
  updateNodeName,
} from "@/lib/utils/treeOps";
import { TreeNode } from "@/lib/zod/treeSchema";
import {
  ChevronDown,
  ChevronRightIcon,
  MoreHorizontal,
  Pen,
} from "lucide-react";
import { useState } from "react";
import { NodeApi } from "react-arborist";
import InlineEditable from "./inline-editable";
import { ConfirmTreeUpdate } from "./treeConfirmDialog";

interface DefaultNodeProps {
  treeData: TreeNode[];
  node: NodeApi<TreeNode>;
  setTreeData: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  multiple: boolean;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  search: string;
  viewOnly?: boolean;
  showConnectedLines?: boolean;
  openIcons?: React.ReactNode;
  collapseIcons?: React.ReactNode;
  onNodeClick?: (node: NodeApi<TreeNode>) => void;
  disableSelection?: boolean;
  builtMode?: boolean;
}

const INDENT = 20;
const HALF = INDENT / 3;
const CHEVRON = 16;
const CHEVRON_CENTER = CHEVRON / 2;

function highlightText(text: string, search: string) {
  if (!search) return text;
  const regex = new RegExp(`(${search})`, "gi");
  return text.split(regex).map((part, i) =>
    part.toLowerCase() === search.toLowerCase() ? (
      <span key={i} className="bg-yellow-200">
        {part}
      </span>
    ) : (
      part
    )
  );
}

function NodeLines({
  node,
  ancestorLastMap,
  showConnectedLines,
}: {
  node: NodeApi<TreeNode>;
  ancestorLastMap: boolean[];
  showConnectedLines: boolean;
}) {
  if (!showConnectedLines || node.level === 0) return null;

  const selfCenter = node.level * INDENT + CHEVRON_CENTER;
  const parentCenter = (node.level - 1) * INDENT + HALF + CHEVRON_CENTER;

  return (
    <>
      {/* Vertical lines */}
      <div
        className="absolute top-0 left-0 h-full flex"
        style={{ width: node.level * INDENT }}
      >
        {ancestorLastMap.map((isLast, i) => (
          <div key={i} className="w-5 relative">
            <div
              className="absolute top-0 bottom-0 border-l border-gray-300"
              style={{ left: CHEVRON_CENTER + HALF }}
            />
          </div>
        ))}
      </div>

      {/* Horizontal connector */}
      <div
        className="-translate-y-1/2 absolute"
        style={{
          top: "50%",
          left: parentCenter,
          width: selfCenter - parentCenter,
        }}
      >
        <div className="w-full border-t border-gray-300 h-0" />
      </div>
    </>
  );
}

function NodeContent({
  node,
  data,
  isLeafNode,
  isSelected,
  multiple,
  disableSelection,
  setTreeData,
  setSelectedIds,
  treeData,
  search,
  viewOnly,
  onNodeClick,
  builtMode = true,
}: {
  node: NodeApi<TreeNode>;
  data: TreeNode;
  isLeafNode: boolean;
  isSelected: boolean;
  multiple: boolean;
  disableSelection: boolean;
  setTreeData: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  treeData: TreeNode[];
  search: string;
  viewOnly: boolean;
  openIcons?: React.ReactNode;
  collapseIcons?: React.ReactNode;
  onNodeClick?: (node: NodeApi<TreeNode>) => void;
  builtMode?: boolean;
}) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState("");
  const handleToggle = () => {
    setSelectedIds((prev) =>
      toggleNodeSelection(treeData, node.id, prev, multiple)
    );
  };

  return (
    <div
      className="flex items-center flex-1"
      style={{ marginLeft: node.level * INDENT }}
    >
      {/* Selection or toggle button */}
      {isLeafNode ? (
        !disableSelection &&
        (multiple ? (
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleToggle}
            className="mr-2 self-center"
          />
        ) : (
          <input
            type="radio"
            checked={isSelected}
            onChange={handleToggle}
            className="mr-2 self-center"
          />
        ))
      ) : (
        <IconContextMenu
          onChangeIcon={(icon: string) => {
            console.log(icon);
            setSelectedIcon(icon);
            setShowConfirmDialog(true);
            // setTreeData((prev) => updateAllParentIcons(treeData, icon));
            // updateNodeIcon(treeData, node.id, icon);
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              node.toggle();
              onNodeClick?.(node);
            }}
            className="flex items-center justify-center cursor-pointer"
          >
            {data.icon && data.icon.length > 0 ? (
              <IconButton icon={data.icon} size={16} className="mr-2" />
            ) : node.isOpen ? (
              <ChevronDown className="w-4 h-4 mr-2 self-center" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 mr-2 self-center" />
            )}
          </button>
        </IconContextMenu>
      )}

      {/* Icon */}
      {data.icon && node.isLeaf && (
        <IconButton icon={data.icon} size={16} className="mr-2" />
      )}

      {builtMode && (data.icon ?? "")?.length === 0 && node.isLeaf && (
        <IconContextMenu
          onChangeIcon={(icon: string) => {
            console.log(icon);
            setTreeData((prev) => updateNodeIcon(treeData, node.id, icon));
            // updateNodeIcon(treeData, node.id, icon);
          }}
        >
          <Pen className="w-4 h-4 mr-2 opacity-75" />
        </IconContextMenu>
      )}

      <ConfirmTreeUpdate
        open={showConfirmDialog}
        onConfirm={(confirmed) => {
          if (confirmed) {
            setTreeData((prev) => updateAllParentIcons(treeData, selectedIcon));
          } else {
            setTreeData((prev) =>
              updateNodeIcon(treeData, node.id, selectedIcon)
            );
          }
          setSelectedIcon("");
          setShowConfirmDialog(false);
        }}
      />

      {/* Text */}
      {!viewOnly ? (
        <InlineEditable
          text={data.name}
          noOutline
          elementClassName="h-5"
          className="text-sm"
          onSave={(newName) =>
            setTreeData((prev) => updateNodeName(prev, node.id, newName))
          }
          viewOnly={viewOnly}
          textClassName="overflow-hidden text-ellipsis"
        >
          {highlightText(data.name, search)}
        </InlineEditable>
      ) : (
        <div className="text-sm">
          <span className="overflow-hidden text-ellipsis">
            {highlightText(data.name, search)}
          </span>
        </div>
      )}
    </div>
  );
}

function NodeActions({
  node,
  setTreeData,
  isLeafNode,
}: {
  node: NodeApi<TreeNode>;
  setTreeData: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  isLeafNode: boolean;
}) {
  return (
    <div className="flex opacity-0 group-hover/inner:opacity-100 ml-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild className="p-0 self-center">
          <DropdownMenuLabel>
            <MoreHorizontal className="w-4 h-4" />
          </DropdownMenuLabel>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel
            className="hover:bg-gray-100"
            onClick={(e: { preventDefault: () => void }) => {
              e.preventDefault();
              setTreeData((prev) =>
                addSiblingNode(prev, node.id, "New Sibling", isLeafNode)
              );
            }}
          >
            Add Sibling
          </DropdownMenuLabel>
          <DropdownMenuLabel
            className="hover:bg-gray-100"
            onClick={(e: { preventDefault: () => void }) => {
              e.preventDefault();
              setTreeData((prev) => addChildNode(prev, node.id, "New Child"));
              node.open();
            }}
          >
            Add Child
          </DropdownMenuLabel>
          {!isLeafNode && (
            <DropdownMenuLabel
              className="hover:bg-gray-100"
              onClick={(e: { preventDefault: () => void }) => {
                e.preventDefault();
                setTreeData((prev) => duplicateNode(prev, node.id));
              }}
            >
              Duplicate
            </DropdownMenuLabel>
          )}
          <DropdownMenuLabel
            className="hover:bg-gray-100"
            onClick={(e: { preventDefault: () => void }) => {
              e.preventDefault();
              setTreeData((prev) => deleteNode(prev, node.id));
            }}
          >
            Delete
          </DropdownMenuLabel>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function DefaultNode({
  treeData,
  node,
  setTreeData,
  search,
  multiple,
  selectedIds,
  setSelectedIds,
  viewOnly = false,
  showConnectedLines = true,
  openIcons,
  collapseIcons = openIcons,
  onNodeClick,
  disableSelection = false,
}: DefaultNodeProps) {
  const data = node.data;
  const isSelected = selectedIds.has(node.id);
  const isLeafNode = node.isLeaf;
  const ancestorLastMap = buildAncestorLastMap(node.id, treeData);

  return (
    <span
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (viewOnly) node.toggle();
        onNodeClick?.(node);
      }}
    >
      <div
        className={cn(
          "relative flex items-center group/inner gap-2 p-2 rounded cursor-pointer select-none",
          `${node.isSelected && !node.isLeaf ? "bg-[#f1f5f9e6]" : ""}`,
          `${!node.isLeaf && "hover:bg-[#f1f5f9e6] hover:no-underline"}`
        )}
      >
        <NodeLines
          node={node}
          ancestorLastMap={ancestorLastMap}
          showConnectedLines={showConnectedLines}
        />

        <NodeContent
          node={node}
          data={data}
          isLeafNode={isLeafNode}
          isSelected={isSelected}
          multiple={multiple}
          disableSelection={disableSelection}
          setTreeData={setTreeData}
          setSelectedIds={setSelectedIds}
          treeData={treeData}
          search={search}
          viewOnly={viewOnly}
          openIcons={openIcons}
          collapseIcons={collapseIcons}
          onNodeClick={onNodeClick}
        />

        {!viewOnly && (
          <NodeActions
            node={node}
            setTreeData={setTreeData}
            isLeafNode={isLeafNode}
          />
        )}
      </div>
    </span>
  );
}
