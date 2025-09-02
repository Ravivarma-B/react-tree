// utils/treeLine.ts
import { TreeNode } from "../zod/treeSchema";
import { findNodeAndParent } from "./treeUtils";

// build map of which ancestors are last child
export function buildAncestorLastMap(
  nodeId: string,
  nodes: TreeNode[],
  ancestors: boolean[] = []
): boolean[] {
  const { node, parent } = findNodeAndParent(nodes, nodeId);
  if (!node) return ancestors;

  if (!parent) {
    const isLast = nodes[nodes.length - 1].id === nodeId;
    return [...ancestors, isLast];
  } else {
    const siblings = parent.children || [];
    const isLast = siblings[siblings.length - 1].id === nodeId;
    return buildAncestorLastMap(parent.id, nodes, [...ancestors, isLast]);
  }
}
