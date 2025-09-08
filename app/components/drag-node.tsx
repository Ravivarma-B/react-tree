import { NodeApi, NodeRendererProps } from "react-arborist";
import InlineEditable from "./inline-editable";
import { TreeNode } from "@/lib/zod/treeSchema";
import { buildAncestorLastMap } from "@/lib/utils/treeLine";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, ChevronRightIcon, MoreHorizontal } from "lucide-react";
import { toggleNodeSelection, updateNodeName } from "@/lib/utils/treeOps";
import {
  addChildNode,
  addSiblingNode,
  deleteNode,
  duplicateNode,
} from "@/lib/utils/treeOps";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

interface DefaultNodeProps extends NodeRendererProps<TreeNode> {
  node: NodeApi<TreeNode>;
  treeData: TreeNode[];
  setTreeData: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  search: string;
  multiple: boolean;
  selectedIds: Set<string>;
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  viewOnly?: boolean;
  useChevron?: boolean;
}

export default function DefaultNode({
  node,
  treeData,
  setTreeData,
  search,
  multiple,
  selectedIds,
  setSelectedIds,
  viewOnly = false,
  useChevron = false,
  dragHandle,
}: DefaultNodeProps) {
  const data = node.data;
  const isLeaf = node.isLeaf;
  const ancestorMap = buildAncestorLastMap(node.id, treeData);

  const handleToggle = () => {
    setSelectedIds((prev) =>
      toggleNodeSelection(treeData, node.id, prev, multiple)
    );
  };

  return (
    <div
      className="relative flex items-center group/inner gap-2 p-2 rounded cursor-pointer select-none"
      ref={dragHandle}
    >
      {/* Vertical lines */}
      <div
        className="absolute top-0 left-0 flex h-full"
        style={{ width: node.level * 20 }}
      >
        {ancestorMap.slice(0, -1).map((isLast, i) => (
          <div
            key={i}
            className="absolute border-l border-gray-300"
            style={{
              left: i * 20 + 10,
              height: "100%",
              top: 0,
            }}
          />
        ))}
      </div>

      {/* Horizontal connector */}
      {node.level > 0 && (
        <div
          className="absolute border-t border-gray-300"
          style={{
            top: "50%",
            left: (node.level - 1) * 20 + 10,
            width: 20,
          }}
        />
      )}

      {/* Node content */}
      <div
        className="flex items-center flex-1"
        style={{ marginLeft: useChevron ? node.level * 20 : node.level * 20 }}
      >
        {!isLeaf && useChevron && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              node.toggle();
            }}
            className="mr-2 cursor-pointer"
          >
            {node.isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        )}

        {!node.isLeaf ? (
          <button
            onClick={(e) => {
              e.stopPropagation(); // prevent selecting while toggling
              node.toggle();
            }}
            className="flex-shrink-0 mr-2"
          >
            {node.isOpen ? (
              <ChevronDown className="w-4 h-4 mr-2 self-center" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 mr-2 self-center" />
            )}
          </button>
        ) : multiple ? (
          <Checkbox
            checked={selectedIds.has(node.id)}
            onCheckedChange={handleToggle}
            className="mr-2 self-center"
          />
        ) : (
          <input
            type="radio"
            checked={selectedIds.has(node.id)}
            onChange={handleToggle}
            className="mr-2 self-center"
          />
        )}

        <InlineEditable
          text={data.name}
          onSave={(newName) =>
            setTreeData((prev) => updateNodeName(prev, node.id, newName))
          }
          className="text-sm truncate flex-1"
        >
          <span className="truncate">{data.name}</span>
        </InlineEditable>

        {!viewOnly && (
          <div className="ml-auto opacity-0 group-hover/inner:opacity-100 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <MoreHorizontal className="w-4 h-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel
                  onClick={() =>
                    setTreeData((prev) =>
                      addSiblingNode(prev, node.id, "New Sibling")
                    )
                  }
                >
                  Add Sibling
                </DropdownMenuLabel>
                <DropdownMenuLabel
                  onClick={() =>
                    setTreeData((prev) =>
                      addChildNode(prev, node.id, "New Child")
                    )
                  }
                >
                  Add Child
                </DropdownMenuLabel>
                {!isLeaf && (
                  <DropdownMenuLabel
                    onClick={() =>
                      setTreeData((prev) => duplicateNode(prev, node.id))
                    }
                  >
                    Duplicate
                  </DropdownMenuLabel>
                )}
                <DropdownMenuLabel
                  onClick={() =>
                    setTreeData((prev) => deleteNode(prev, node.id))
                  }
                >
                  Delete
                </DropdownMenuLabel>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </div>
  );
}
