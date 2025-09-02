This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

CustomTree (Parent Component)
│
├─ State:
│   ├─ treeData: TreeNode[]           // main tree structure
│   ├─ selectedIds: Set<string>       // for multi/single selection
│   ├─ editingId: string | null       // currently editing node
│   ├─ searchTerm: string             // search input
│
├─ Hooks:
│   ├─ useTreeSelection               // toggle, select all, indeterminate logic
│   ├─ useTreeSearch                  // filter / highlight matches
│   ├─ useTreeOperations              // addChild, addSibling, remove, duplicate
│
├─ Components:
│   ├─ SearchBox                      // controlled input for searchTerm
│   ├─ TreeToolbar                    // buttons: delete, duplicate, export, etc.
│   ├─ Tree (react-arborist)          // virtualized, renders nodes
│   │   └─ DefaultNode                // represents a single node
│   │       ├─ Checkbox / Radio       // selection input
│   │       ├─ InlineEditable         // node name editing
│   │       └─ NodeActionsMenu        // dropdown menu: add/remove/duplicate
│
├─ Utils:
│   ├─ treeOps.ts                     // add/remove/update/clone/ID generation
│   ├─ treeSelection.ts               // hierarchical selection, indeterminate state
│   ├─ treeFilter.ts                  // filter tree by search term
│   └─ treeHighlight.ts               // highlight search matches
│
└─ Optional Features:
    ├─ Undo/Redo Stack                 // track node operations
    ├─ Server Sync / API               // save tree state remotely
    ├─ Drag & Drop Validation          // prevent illegal drops
    ├─ Export / Import JSON            // persist or restore tree
    └─ Theming                         // light/dark mode, custom styles

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/11e44ab3-aac0-4988-a5aa-51789f6956b1" />

