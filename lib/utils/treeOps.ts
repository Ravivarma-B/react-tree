import { TreeNode, TreeSchema } from "../zod/treeSchema";
import { cloneDeep, findNodeAndParent, nextId, removeIds } from "./treeUtils";

/**
 * Assign new IDs recursively to a node and its children.
 */
function assignIdsRecursive(node: Omit<TreeNode, "id">): TreeNode {
  const newNode: TreeNode = {
    ...node,
    id: nextId("node"),
    children: node.children?.map(assignIdsRecursive),
  };
  return newNode;
}

/**
 * Generate a tree with fresh IDs for all nodes.
 * @param treeData Array of tree nodes without IDs
 */
export function generateTreeWithIds(
  treeData: Omit<TreeNode, "id">[]
): TreeNode[] {
  const newTree = treeData.map(assignIdsRecursive);
  return TreeSchema.parse(newTree); // validates the new tree
}

export function assignNewIds(node: TreeNode): TreeNode {
  const newNode: TreeNode = {
    ...node,
    id: nextId("node"),
    children: node.children?.map(assignNewIds),
  };
  TreeSchema.parse([newNode]); // validate
  return newNode;
}

export function addSiblingNode(
  nodes: TreeNode[],
  nodeId: string,
  name = "New Sibling",
  isLeafNode = false
): TreeNode[] {
  const copy = cloneDeep(nodes);
  const { parent, index } = findNodeAndParent(copy, nodeId);
  const newNode: TreeNode = assignNewIds({
    id: "",
    name,
    ...(!isLeafNode && { children: [] }),
  });
  if (parent) {
    parent.children = parent.children ? [...parent.children] : [];
    parent.children.splice(index + 1, 0, newNode);
  } else {
    copy.splice(index + 1, 0, newNode);
  }
  return TreeSchema.parse(copy);
}

export function addChildNode(
  nodes: TreeNode[],
  parentId: string,
  name: string
) {
  const copy = cloneDeep(nodes);
  const { node: parent } = findNodeAndParent(copy, parentId);
  if (!parent) return copy;
  const newNode: TreeNode = assignNewIds({ id: "", name });
  parent.children = parent.children ? [...parent.children, newNode] : [newNode];
  return TreeSchema.parse(copy);
}

export function duplicateNode(nodes: TreeNode[], nodeId: string): TreeNode[] {
  const copy = cloneDeep(nodes);
  const { node, parent, index } = findNodeAndParent(copy, nodeId);
  if (!node) return copy;
  const duplicate = assignNewIds(node);
  if (parent) {
    parent.children = parent.children ? [...parent.children] : [];
    parent.children.splice(index + 1, 0, duplicate);
  } else {
    copy.splice(index + 1, 0, duplicate);
  }
  return TreeSchema.parse(copy);
}

export function deleteNode(nodes: TreeNode[], nodeId: string) {
  return TreeSchema.parse(removeIds(nodes, new Set([nodeId])));
}

export function updateNodeName(
  nodes: TreeNode[],
  nodeId: string,
  newName: string
) {
  const copy = cloneDeep(nodes);
  const { node } = findNodeAndParent(copy, nodeId);
  if (node) node.name = newName;
  return TreeSchema.parse(copy);
}

export function updateNodeIcon(
  nodes: TreeNode[],
  nodeId: string,
  icon: string
) {
  const copy = cloneDeep(nodes);
  const { node } = findNodeAndParent(copy, nodeId);
  if (node) node.icon = icon;
  return TreeSchema.parse(copy);
}

/**
 * Force update all parent nodes' icons in the tree to a given icon.
 */
export function updateAllParentIcons(
  nodes: TreeNode[],
  icon: string
): TreeNode[] {
  const copy = cloneDeep(nodes);

  function dfs(node: TreeNode) {
    // If it has children, set parent icon
    if (node.children) {
      node.icon = icon;
      node.children.forEach(dfs);
    }
  }

  copy.forEach(dfs);

  return TreeSchema.parse(copy);
}

// Toggle node selection with parent-child propagation
export function toggleNodeSelection(
  nodes: TreeNode[],
  nodeId: string,
  selectedIds: Set<string>,
  multiple = true
): Set<string> {
  const newSet = new Set(selectedIds);

  const updateChildren = (node: TreeNode, checked: boolean) => {
    if (checked) newSet.add(node.id);
    else newSet.delete(node.id);
    node.children?.forEach((c) => updateChildren(c, checked));
  };

  const traverse = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        const checked = multiple ? !newSet.has(node.id) : true;
        if (!multiple) newSet.clear();
        updateChildren(node, checked);
        break;
      }
      node.children && traverse(node.children);
    }
  };
  traverse(nodes);
  return newSet;
}

// Determine indeterminate state for parent checkboxes
export function isIndeterminate(
  node: TreeNode,
  selectedIds: Set<string>
): boolean {
  if (!node.children || node.children.length === 0) return false;
  const allSelected = node.children.every((c) => selectedIds.has(c.id));
  const someSelected = node.children.some(
    (c) => selectedIds.has(c.id) || isIndeterminate(c, selectedIds)
  );
  return someSelected && !allSelected;
}

export function filterTree(nodes: TreeNode[], term: string): TreeNode[] {
  if (!term.trim()) return nodes;

  const lower = term.toLowerCase();
  return nodes
    .map((node) => {
      const children = filterTree(node.children ?? [], term);
      // include node if it matches or has matching children
      if (node.name.toLowerCase().includes(lower) || children.length > 0) {
        return { ...node, ...(children.length > 0 && { children }) };
      }
      return null;
    })
    .filter(Boolean) as TreeNode[];
}

export function moveNodes(
  tree: TreeNode[],
  dragIds: string[],
  parentId: string | null,
  index: number
): TreeNode[] {
  // Deep clone tree
  let newTree = structuredClone(tree) as TreeNode[];

  // Helper to remove nodes
  function remove(nodes: TreeNode[]): [TreeNode[], TreeNode[]] {
    const removed: TreeNode[] = [];
    const kept: TreeNode[] = [];

    for (const n of nodes) {
      if (dragIds.includes(n.id)) {
        removed.push(n);
      } else if (n.children) {
        const [childRemoved, childKept] = remove(n.children);
        if (childRemoved.length) {
          n.children = childKept;
          removed.push(...childRemoved);
        }
        kept.push(n);
      } else {
        kept.push(n);
      }
    }
    return [removed, kept];
  }

  // Remove dragged nodes
  const [removed, cleaned] = remove(newTree);
  newTree = cleaned;

  // Insert into new parent
  function insert(nodes: TreeNode[]): boolean {
    for (const n of nodes) {
      if (n.id === parentId) {
        n.children = n.children || [];
        n.children.splice(index, 0, ...removed);
        return true;
      }
      if (n.children && insert(n.children)) return true;
    }
    return false;
  }

  if (parentId) {
    insert(newTree);
  } else {
    newTree.splice(index, 0, ...removed);
  }

  return newTree;
}

/**
 * Returns an array of booleans representing whether each ancestor of the node
 * is the last child in its parent. The array is ordered from root -> parent.
 */
export function buildAncestorLastMap(
  nodeId: string,
  treeData: TreeNode[]
): boolean[] {
  const path: boolean[] = [];
  let currentId = nodeId;

  while (true) {
    const { node, parent } = findNodeAndParent(treeData, currentId);
    if (!node) break;

    if (parent) {
      const siblings = parent.children ?? [];
      const lastChildId =
        siblings.length > 0 ? siblings[siblings.length - 1].id : null;

      const isLast = node.id === lastChildId;
      path.unshift(isLast);

      currentId = parent.id;
    } else {
      // reached root
      break;
    }
  }

  return path;
}
