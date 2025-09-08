"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Tree, NodeApi } from "react-arborist";
import { TreeNode, TreeSchema } from "@/lib/zod/treeSchema";
import DefaultNode from "./drag-node";
import { filterTree, moveNodes } from "@/lib/utils/treeOps";
import { insertNodeAt, cloneDeep } from "@/lib/utils/treeUtils";
import { ClientOnly } from "@/components/ui/clientOnly";

interface CustomTreeProps {
  data: TreeNode[];
  multiple?: boolean;
  useChevron?: boolean;
}

export const DragabbleTree = ({
  data,
  multiple = true,
  useChevron = false,
}: CustomTreeProps) => {
  const [treeData, setTreeData] = useState<TreeNode[]>(TreeSchema.parse(data));
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [cutIds, setCutIds] = useState<Set<string>>(new Set());
  const lastClickedRef = useRef<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtered tree
  const filteredData = useMemo(
    () => filterTree(treeData, debouncedSearch),
    [treeData, debouncedSearch]
  );

  // Flatten tree for range selection
  const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
    let out: TreeNode[] = [];
    for (const n of nodes) {
      out.push(n);
      if (n.children) out = [...out, ...flattenTree(n.children)];
    }
    return out;
  };

  // Advanced selection: Ctrl + Shift
  //   const handleSelect = (node: NodeApi<TreeNode>, e: React.MouseEvent) => {
  //     const id = node.id;
  //     if (e.shiftKey && lastClickedRef.current) {
  //       const flatten = flattenTree(treeData);
  //       const start = flatten.findIndex((n) => n.id === lastClickedRef.current);
  //       const end = flatten.findIndex((n) => n.id === id);
  //       if (start >= 0 && end >= 0) {
  //         const rangeIds = flatten
  //           .slice(Math.min(start, end), Math.max(start, end) + 1)
  //           .map((n) => n.id);
  //         setSelectedIds((prev) => new Set([...prev, ...rangeIds]));
  //       }
  //     } else if (e.ctrlKey || e.metaKey) {
  //       setSelectedIds((prev) => {
  //         const newSet = new Set(prev);
  //         if (newSet.has(id)) newSet.delete(id);
  //         else newSet.add(id);
  //         return newSet;
  //       });
  //       lastClickedRef.current = id;
  //     } else {
  //       setSelectedIds(new Set([id]));
  //       lastClickedRef.current = id;
  //     }
  //   };

  // Cut & Paste
  const handleCut = () => {
    setCutIds(new Set(selectedIds));
    setSelectedIds(new Set());
  };
  const handlePaste = (targetId: string | null) => {
    if (!cutIds.size) return;
    setTreeData((prev) => {
      let newTree = cloneDeep(prev);
      const nodesToMove: TreeNode[] = [];
      const traverseRemove = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.filter((n) => {
          if (cutIds.has(n.id)) {
            nodesToMove.push(n);
            return false;
          }
          if (n.children) n.children = traverseRemove(n.children);
          return true;
        });
      };
      newTree = traverseRemove(newTree);
      if (!targetId) {
        newTree = [...newTree, ...nodesToMove];
      } else {
        newTree = insertNodeAt(newTree, targetId, 0, nodesToMove[0]);
      }
      setCutIds(new Set());
      return newTree;
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSelect = (nodes: NodeApi<any>[], e: React.MouseEvent) => {
    if (!nodes.length) return;
    const node = nodes[nodes.length - 1]; // last clicked node
    const id = node.id;

    if (e.shiftKey && lastClickedRef.current) {
      const flatten = flattenTree(treeData);
      const start = flatten.findIndex((n) => n.id === lastClickedRef.current);
      const end = flatten.findIndex((n) => n.id === id);
      if (start >= 0 && end >= 0) {
        const rangeIds = flatten
          .slice(Math.min(start, end), Math.max(start, end) + 1)
          .map((n) => n.id);
        setSelectedIds((prev) => new Set([...prev, ...rangeIds]));
      }
    } else if (e.ctrlKey || e.metaKey) {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
      });
      lastClickedRef.current = id;
    } else {
      setSelectedIds(new Set([id]));
      lastClickedRef.current = id;
    }
  };

  const treeProps = useMemo(
    () => ({
      data: filteredData,
      width: "100%",
      height: 600,
      rowHeight: 36,
      indent: 20,
      overscanCount: 10,
      selectionFollowsFocus: false,
      multiple: true,
    }),
    [filteredData]
  );

  const getSelectedNodes = () => {
    const result: TreeNode[] = [];
    const traverse = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (selectedIds.has(node.id)) result.push(node);
        node.children && traverse(node.children);
      }
    };
    traverse(treeData);
    return result;
  };

  const handleMove = ({
    dragNodes,
    parentId,
    index,
  }: {
    dragNodes: NodeApi<TreeNode>[];
    parentId: string | null;
    index: number;
  }) => {
    const dragIds = dragNodes.map((n) => n.data.id);
    const updated = moveNodes(data, dragIds, parentId, index);
    setTreeData(updated);
  };

  return (
    <ClientOnly>
      <div className="space-y-2 w-full p-2">
        {/* Search */}
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500"
        />

        {/* Cut/Paste */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleCut}
            className="px-2 py-1 bg-yellow-400 rounded text-white"
          >
            Cut
          </button>
          <button
            onClick={() => handlePaste(null)}
            className="px-2 py-1 bg-green-500 rounded text-white"
          >
            Paste at Root
          </button>
        </div>

        {/* Tree */}
        <Tree {...treeProps} onMove={handleMove}>
          {(props) => (
            <DefaultNode
              {...props}
              treeData={treeData}
              setTreeData={setTreeData}
              search={search}
              multiple={multiple}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              useChevron={useChevron}
            />
          )}
        </Tree>

        {/* Selected nodes */}
        <button
          className="mt-2 px-3 py-1 bg-blue-500 text-white rounded"
          onClick={() => console.log("Selected nodes:", getSelectedNodes())}
        >
          Get Selected Nodes
        </button>
      </div>
    </ClientOnly>
  );
};
