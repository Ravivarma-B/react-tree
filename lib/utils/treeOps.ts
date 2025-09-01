import { TreeNode, TreeNodeSchema, TreeSchema } from "../zod/treeSchema";
import { cloneDeep, findNodeAndParent, nextId, removeIds } from "./treeUtils";

// Validate whole tree after mutation
function validateTree(nodes: TreeNode[]): TreeNode[] {
  return TreeSchema.parse(nodes); // throws if invalid
}

export function addSiblingNode(
  nodes: TreeNode[],
  nodeId: string,
  name: string = "New Sibling",
  isLeafNode: boolean = false
): TreeNode[] {
  const copy = cloneDeep(nodes);
  const { parent, index } = findNodeAndParent(copy, nodeId);

  const newNode: TreeNode = {
    id: nextId("sibling"),
    name,
    ...(!isLeafNode && { children: [] }),
  };
  TreeNodeSchema.parse(newNode);

  if (parent) {
    parent.children = parent.children ? [...parent.children] : [];
    parent.children.splice(index + 1, 0, newNode);
  } else {
    // root-level sibling
    copy.splice(index + 1, 0, newNode);
  }

  return TreeSchema.parse(copy);
}

// ✅ Add Child
export function addChildNode(
  nodes: TreeNode[],
  parentId: string,
  name: string
): TreeNode[] {
  const newNode: TreeNode = {
    id: nextId("child"),
    name,
  };
  TreeNodeSchema.parse(newNode);

  const copy = cloneDeep(nodes);
  const { node: parent } = findNodeAndParent(copy, parentId);
  if (parent) {
    parent.children = parent.children
      ? [...parent.children, newNode]
      : [newNode];
  }
  return validateTree(copy);
}

// ✅ Duplicate Node
export function duplicateNode(nodes: TreeNode[], id: string): TreeNode[] {
  const { node, parent, index } = findNodeAndParent(nodes, id);
  if (!node) return nodes;

  const copy = cloneDeep(nodes);
  const duplicate: TreeNode = { ...cloneDeep(node), id: nextId("dup") };
  TreeNodeSchema.parse(duplicate);

  if (parent) {
    parent.children!.splice(index + 1, 0, duplicate);
  } else {
    copy.splice(index + 1, 0, duplicate);
  }
  return validateTree(copy);
}

// ✅ Delete Node
export function deleteNode(nodes: TreeNode[], id: string): TreeNode[] {
  const updated = removeIds(nodes, new Set([id]));
  return validateTree(updated);
}

export function updateNodeName(
  nodes: TreeNode[],
  id: string,
  newName: string
): TreeNode[] {
  const copy = cloneDeep(nodes);
  const { node } = findNodeAndParent(copy, id);
  if (node) {
    node.name = newName;
  }
  return TreeSchema.parse(copy); // validate with Zod
}

export function filterTree(nodes: TreeNode[], term: string): TreeNode[] {
  if (!term.trim()) return nodes;

  const lower = term.toLowerCase();

  return nodes
    .map((node) => {
      const children = filterTree(node.children ?? [], term);
      if (node.name.toLowerCase().includes(lower) || children.length > 0) {
        return { ...node, ...(children.length > 0 && { children }) };
      }
      return null;
    })
    .filter(Boolean) as TreeNode[];
}

export function toggleNodeSelection(
  nodes: TreeNode[],
  nodeId: string,
  selectedIds: Set<string>,
  multiple: boolean
): Set<string> {
  const newSet = new Set(selectedIds);

  const updateChildren = (node: TreeNode, checked: boolean) => {
    if (checked) newSet.add(node.id);
    else newSet.delete(node.id);
    node.children?.forEach((child) => updateChildren(child, checked));
  };

  const traverse = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        const isChecked = newSet.has(node.id);
        const checked = multiple ? !isChecked : true;
        if (!multiple) newSet.clear(); // single select clears previous
        updateChildren(node, checked);
        break;
      }
      if (node.children) traverse(node.children);
    }
  };

  traverse(nodes);
  return newSet;
}

// Compute if a node should be indeterminate
export function isIndeterminate(
  node: TreeNode,
  selectedIds: Set<string>
): boolean {
  if (!node.children || node.children.length === 0) return false;
  const allChildrenSelected = node.children.every((child) =>
    selectedIds.has(child.id)
  );
  const someChildrenSelected = node.children.some(
    (child) => selectedIds.has(child.id) || isIndeterminate(child, selectedIds)
  );
  return someChildrenSelected && !allChildrenSelected;
}
