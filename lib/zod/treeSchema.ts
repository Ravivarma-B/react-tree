import { z } from "zod";

// Node schema
export const TreeNodeSchema: z.ZodType<{
  id: string;
  name: string;
  status?: string;
  children?: TreeNode[];
}> = z.lazy(() =>
  z.object({
    id: z.string().min(1, "ID is required"),
    name: z.string().min(1, "Name is required").max(100, "Name too long"),
    status: z.string().optional(), // optional badge/status
    children: z.array(TreeNodeSchema).optional(),
  })
);

export type TreeNode = z.infer<typeof TreeNodeSchema>;
export const TreeSchema = z.array(TreeNodeSchema);
