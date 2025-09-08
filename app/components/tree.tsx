"use client";

import { ClientOnly } from "@/components/ui/clientOnly";
import { useMemo, useState } from "react";
import { Tree } from "react-arborist";
import { TreeNode, TreeSchema } from "@/lib/zod/treeSchema";
import { filterTree, generateTreeWithIds } from "@/lib/utils/treeOps";
import Node from "./node";

interface CustomTreeProps {
  data?: TreeNode[];
  multiple?: boolean;
  viewOnly?: boolean;
  showConnectedLines?: boolean;
  openIcons?: React.ReactNode;
  collapseIcons?: React.ReactNode;
  disableSelection?: boolean;
  treeHeight?: number;
}

export const CustomTree = ({
  data = [],
  multiple = true,
  viewOnly = false,
  showConnectedLines = true,
  openIcons,
  collapseIcons,
  disableSelection = false,
  treeHeight = 400,
}: CustomTreeProps) => {
  const [treeData, setTreeData] = useState<TreeNode[]>(() =>
    data.length
      ? TreeSchema.parse(data)
      : generateTreeWithIds([{ name: "Root Node", children: [] }])
  );

  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredData = useMemo(
    () => filterTree(treeData, search),
    [treeData, search]
  );

  const treeProps = useMemo(
    () => ({
      data: filteredData,
      width: "100%",
      height: treeHeight,
      rowHeight: 36,
      indent: 20,
      overscanCount: 5,
      multiple,
    }),
    [filteredData, treeHeight, multiple]
  );

  return (
    <ClientOnly>
      <div className="space-y-2 w-full p-2">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        />

        {/* <input
          id="file-input"
          type="file"
          accept=".svg"
          // className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) console.log("Selected:", file.name);
          }}
        /> */}

        <Tree {...treeProps} className="!scrollbar-hide" openByDefault={false}>
          {(props) => (
            <Node
              {...props}
              treeData={treeData}
              setTreeData={setTreeData}
              search={search}
              multiple={multiple}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              viewOnly={viewOnly}
              showConnectedLines={showConnectedLines}
              openIcons={openIcons}
              collapseIcons={collapseIcons}
            />
          )}
        </Tree>
      </div>
    </ClientOnly>
  );
};
