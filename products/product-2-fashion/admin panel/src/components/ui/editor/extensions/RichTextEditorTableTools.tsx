"use client";

import React from "react";
import Button from "@/components/ui/button/Button";
import type { Editor } from "@tiptap/react";

type Props = {
  editor: Editor;
};

export default function RichTextEditorTableTools({ editor }: Props) {
  const isInTable = editor.isActive("table");
  if (!isInTable) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-white px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
      <Button
        size="sm"
        variant="outline"
        onClick={() => editor.chain().focus().addRowBefore().run()}
      >
        + Row (Before)
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        + Row (After)
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
      >
        + Col (Before)
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        + Col (After)
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => editor.chain().focus().deleteRow().run()}
      >
        - Row
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => editor.chain().focus().deleteColumn().run()}
      >
        - Col
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
      >
        Toggle Header Row
      </Button>

      <Button
        size="sm"
        variant="outline"
        onClick={() => editor.chain().focus().mergeCells().run()}
      >
        Merge Cells
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => editor.chain().focus().splitCell().run()}
      >
        Split Cell
      </Button>

      <div className="ml-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={() => editor.chain().focus().deleteTable().run()}
        >
          Delete Table
        </Button>
      </div>
    </div>
  );
}
