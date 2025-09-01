import { z } from "zod";

// forward declaration with type
export type TreeNode = z.infer<typeof TreeNodeSchema>;

// explicitly tell TS the type of TreeNodeSchema
export const TreeNodeSchema: z.ZodType<{
  id: string;
  name: string;
  children?: TreeNode[];
}> = z.lazy(() =>
  z.object({
    id: z.string().min(1, "ID is required"),
    name: z.string().min(1, "Name is required").max(100, "Name too long"),
    children: z.array(TreeNodeSchema).optional(),
  })
);

// Array of nodes (whole tree)
export const TreeSchema = z.array(TreeNodeSchema);
