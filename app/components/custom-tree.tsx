"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRightIcon, MoreHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NodeApi, Tree } from "react-arborist";
import InlineEditable from "./inline-editable";
import { cn } from "../utils/FormUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TreeNode, TreeSchema } from "@/lib/zod/treeSchema";
import {
  addChildNode,
  addSiblingNode,
  deleteNode,
  duplicateNode,
  filterTree,
  toggleNodeSelection,
  updateNodeName,
} from "@/lib/utils/treeOps";
import { ClientOnly } from "@/components/ui/clientOnly";

interface DefaultNodeProps {
  treeData: TreeNode[];
  node: NodeApi<TreeNode>;
  setTreeData: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  multiple: boolean; // true -> checkboxes, false -> radio
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  search: string;
}

function DefaultNode({
  treeData,
  node,
  setTreeData,
  search,
  multiple,
  selectedIds,
  setSelectedIds,
}: DefaultNodeProps) {
  const data = node.data;
  const isOpened = node.isOpen;
  const isSelected = selectedIds.has(node.id);
  const isLeafNode = node.isLeaf;

  const handleToggle = () => {
    setSelectedIds((prev) =>
      toggleNodeSelection(treeData, node.id, prev, multiple)
    );
  };

  // console.log(node);

  const highlight = (text: string, search: string) => {
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
  };

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded cursor-pointer select-none ${
        isSelected ? "bg-blue-100" : "hover:bg-gray-100"
      }`}
      onClick={(e) => {
        console.log(node);
        node.tree.toggle(node.id);
        // node.select() // if (e.metaKey || e.ctrlKey) { // node.select("toggle"); // ✅ toggle selection // } else { // node.select("replace"); // ✅ replace current selection // }
      }}
      onSelect={(e) => {
        console.log(e);
      }}
    >
      <div style={{ flex: 1, marginLeft: node.level * 15 }}>
        <div className="flex justify-between group/inner">
          <div className="flex self-center">
            {!isLeafNode ? (
              isOpened ? (
                <ChevronDown className="w-4 h-4 mr-2 self-center" />
              ) : (
                <ChevronRightIcon className="w-4 h-4 mr-2 self-center" />
              )
            ) : multiple ? (
              <Checkbox
                checked={isSelected}
                onCheckedChange={handleToggle}
                className={cn(
                  "self-center mr-2",
                  isSelected ? "border-blue-400" : ""
                )}
              />
            ) : (
              <input
                type="radio"
                checked={isSelected}
                onChange={handleToggle}
                className={cn(
                  "self-center mr-2",
                  isSelected ? "border-blue-400" : ""
                )}
              />
            )}
            <InlineEditable
              text={data.name}
              noOutline
              elementClassName="h-5"
              className="text-sm"
              onSave={(newName) =>
                setTreeData((prev) => updateNodeName(prev, node.id, newName))
              }
            >
              {highlight(data.name, search)}
            </InlineEditable>
          </div>
          <div
            className={cn(
              "flex opacity-0 group-hover/inner:opacity-100",
              isSelected ? "opacity-100" : ""
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger asChild className="p-0 self-center">
                <DropdownMenuLabel>
                  <MoreHorizontal className={cn("w-4 h-4")} />
                </DropdownMenuLabel>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel
                  className="hover:bg-gray-100"
                  onClick={(e) => {
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
                  onClick={(e) => {
                    e.preventDefault();
                    setTreeData((prev) =>
                      addChildNode(prev, node.id, "New Child")
                    );
                  }}
                >
                  Add Child
                </DropdownMenuLabel>
                {!isLeafNode && (
                  <DropdownMenuLabel
                    className="hover:bg-gray-100"
                    onClick={(e) => {
                      e.preventDefault();
                      setTreeData((prev) => duplicateNode(prev, node.id));
                    }}
                  >
                    Duplicate
                  </DropdownMenuLabel>
                )}
                <DropdownMenuLabel
                  className="hover:bg-gray-100"
                  onClick={(e) => {
                    e.preventDefault();
                    setTreeData((prev) => deleteNode(prev, node.id));
                  }}
                >
                  Delete
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CustomTreeProps {
  data: TreeNode[];
  multiple?: boolean;
}

export const CustomTree = ({ data, multiple = false }: CustomTreeProps) => {
  const [treeData, setTreeData] = useState(() => TreeSchema.parse(data));
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  const filteredData = useMemo(
    () => filterTree(treeData, debouncedSearch),
    [treeData, debouncedSearch]
  );

  const treeProps = useMemo(
    () => ({
      data: treeData,
      width: "100%",
      height: 600,
      rowHeight: 36,
      indent: 20,
      overscanCount: 5,
      selectionFollowsFocus: false,
      multiple: true,
    }),
    [treeData]
  );

  const getSelectedItems = () => {
    const result: TreeNode[] = [];
    const traverse = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (selectedIds.has(node.id)) result.push(node);
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        node.children && traverse(node.children);
      }
    };
    traverse(treeData);
    return result;
  };

  return (
    <ClientOnly>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        />
        <Tree {...treeProps} data={filteredData}>
          {(props) => (
            <DefaultNode
              {...props}
              treeData={data}
              setTreeData={setTreeData}
              search={search}
              multiple={multiple}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
            />
          )}
        </Tree>

        <button
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
          onClick={() => console.log("Selected items:", getSelectedItems())}
        >
          Get Selected Items
        </button>
      </div>
    </ClientOnly>
  );
};
