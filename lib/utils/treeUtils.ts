import { TreeNode, TreeNodeSchema } from "../zod/treeSchema";

// Example: safe insert
export function safeInsertNodeAt(
  nodes: TreeNode[],
  parentId: string | null,
  index: number,
  nodeToInsert: TreeNode
): TreeNode[] {
  TreeNodeSchema.parse(nodeToInsert); // ✅ validate node shape
  return insertNodeAt(nodes, parentId, index, nodeToInsert);
}

export function cloneDeep<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function findNodeAndParent(
  nodes: TreeNode[],
  id: string,
  parent: TreeNode | null = null
): { node: TreeNode | null; parent: TreeNode | null; index: number } {
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n.id === id) return { node: n, parent, index: i };
    if (n.children) {
      const found = findNodeAndParent(n.children, id, n);
      if (found.node) return found;
    }
  }
  return { node: null, parent: null, index: -1 };
}
export function removeIds(
  nodes: TreeNode[],
  idsToRemove: Set<string>
): TreeNode[] {
  const out: TreeNode[] = [];
  for (const n of nodes) {
    if (idsToRemove.has(n.id)) continue;
    const copy: TreeNode = { ...n };
    if (n.children) copy.children = removeIds(n.children, idsToRemove);
    out.push(copy);
  }
  return out;
}
export function insertNodeAt(
  nodes: TreeNode[],
  parentId: string | null,
  index: number,
  nodeToInsert: TreeNode
): TreeNode[] {
  const copy = cloneDeep(nodes);
  if (parentId === null) {
    copy.splice(index, 0, nodeToInsert);
    return copy;
  }
  const { node: parent } = findNodeAndParent(copy, parentId, null);
  if (!parent) {
    // fallback - append to root
    copy.splice(index, 0, nodeToInsert);
    return copy;
  }
  parent.children = parent.children ? parent.children.slice() : [];
  parent.children.splice(index, 0, nodeToInsert);
  return copy;
}
export function nextId(prefix = "node") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}
export function sampleData(): TreeNode[] {
  const root: TreeNode[] = [];
  for (let i = 0; i < 5000; i++) {
    const node: TreeNode = { id: `n-${i}`, name: `Item ${i}`, children: [] };
    for (let j = 0; j < 10; j++) {
      node.children!.push({ id: ` n-${i}-${j}`, name: `Item ${i}.${j}` });
    }
    root.push(node);
  }
  return root;
}
