"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Link2,
  Unlink,
  Image as ImageIcon,
  Table2,
  Video,
  Undo2,
  Redo2,
  Eraser,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";

import Button from "@/components/ui/button/Button";
import { cn } from "@/lib/utils";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Youtube from "@tiptap/extension-youtube";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

import { ResizableImage } from "./extensions/resizable-image";
import RichTextEditorTableTools from "./extensions/RichTextEditorTableTools";

type Props = {
  label: string;
  value: string;
  onChange: (nextHtml: string) => void;
  placeholder?: string;
  heightClassName?: string;
  helperText?: string;
};

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function getYouTubeId(url: string): string | null {
  const clean = url.trim();
  if (!clean) return null;

  const yt = clean.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i,
  );
  return yt?.[1] ?? null;
}

function toolbarBtnClass(active?: boolean, disabled?: boolean) {
  return cn(
    "inline-flex h-9 w-9 items-center justify-center rounded-lg border shadow-theme-xs transition-colors",
    disabled
      ? "cursor-not-allowed opacity-50"
      : "hover:bg-gray-50 dark:hover:bg-white/[0.03]",
    active
      ? "border-primary-300 bg-primary-50 text-primary-700 dark:border-primary-500/40 dark:bg-primary-500/10 dark:text-primary-200"
      : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300",
  );
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  placeholder,
  heightClassName = "min-h-[180px]",
  helperText,
}: Props) {
  const [isFocused, setIsFocused] = useState(false);
  const syncingRef = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        orderedList: {
          HTMLAttributes: { class: "list-decimal pl-6" },
        },
        bulletList: {
          HTMLAttributes: { class: "list-disc pl-6" },
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "",
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class:
            "text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300",
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
      }),
      ResizableImage.configure({
        inline: false,
        allowBase64: true,
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || "",
    onUpdate: ({ editor: ed }) => {
      if (syncingRef.current) return;
      onChange(ed.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "ProseMirror",
          "px-4 py-3",
          "text-sm text-gray-800 dark:text-white/90",
          "focus:outline-none",
          heightClassName,
        ),
      },
    },
  });

  // ✅ Fix: Type error "SetContentOptions" + avoid cursor jump
  useEffect(() => {
    if (!editor) return;

    const incoming = value ?? "";
    const current = editor.getHTML();

    if (incoming !== current) {
      syncingRef.current = true;
      editor.commands.setContent(incoming);
      // release on next tick
      queueMicrotask(() => {
        syncingRef.current = false;
      });
    }
  }, [value, editor]);

  const canUndo = !!editor?.can().undo();
  const canRedo = !!editor?.can().redo();

  const insertOrEditLink = () => {
    if (!editor) return;

    const prev =
      (editor.getAttributes("link")?.href as string | undefined) ?? "";
    const next = normalizeUrl(window.prompt("Enter link URL", prev) ?? "");
    if (!next) return;

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: next })
      .run();
  };

  const removeLink = () => {
    if (!editor) return;
    editor.chain().focus().unsetLink().run();
  };

  const insertImage = () => {
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ""));
        reader.onerror = () => reject(new Error("Failed to read image"));
        reader.readAsDataURL(file);
      });

      editor.chain().focus().setImage({ src: url }).run();
    };

    input.click();
  };

  const insertTable = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  const insertYoutube = () => {
    if (!editor) return;

    const url = window.prompt("YouTube URL") ?? "";
    const id = getYouTubeId(url);
    if (!id) return;

    editor
      .chain()
      .focus()
      .setYoutubeVideo({
        src: `https://www.youtube.com/watch?v=${id}`,
        width: 1280,
        height: 720,
      })
      .run();
  };

  const clearAll = () => {
    if (!editor) return;
    editor.chain().focus().clearContent(true).run();
    onChange("");
  };

  const toolbar = useMemo(() => {
    if (!editor) return [];

    const items: Array<
      | { key: string; sep: true }
      | {
          key: string;
          title: string;
          icon: React.ReactNode;
          active?: boolean;
          disabled?: boolean;
          onClick: () => void;
        }
    > = [
      {
        key: "h1",
        title: "Heading 1",
        icon: <Heading1 size={16} />,
        active: editor.isActive("heading", { level: 1 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        key: "h2",
        title: "Heading 2",
        icon: <Heading2 size={16} />,
        active: editor.isActive("heading", { level: 2 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        key: "h3",
        title: "Heading 3",
        icon: <Heading3 size={16} />,
        active: editor.isActive("heading", { level: 3 }),
        onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      { key: "sep-1", sep: true },

      {
        key: "bold",
        title: "Bold",
        icon: <Bold size={16} />,
        active: editor.isActive("bold"),
        onClick: () => editor.chain().focus().toggleBold().run(),
      },
      {
        key: "italic",
        title: "Italic",
        icon: <Italic size={16} />,
        active: editor.isActive("italic"),
        onClick: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        key: "underline",
        title: "Underline",
        icon: <UnderlineIcon size={16} />,
        active: editor.isActive("underline"),
        onClick: () => editor.chain().focus().toggleUnderline().run(),
      },

      { key: "sep-2", sep: true },

      {
        key: "ul",
        title: "Bullet list",
        icon: <List size={16} />,
        active: editor.isActive("bulletList"),
        onClick: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        key: "ol",
        title: "Numbered list (1,2,3...)",
        icon: <ListOrdered size={16} />,
        active: editor.isActive("orderedList"),
        onClick: () => editor.chain().focus().toggleOrderedList().run(),
      },

      { key: "sep-3", sep: true },

      {
        key: "link",
        title: "Insert/Edit link",
        icon: <Link2 size={16} />,
        active: editor.isActive("link"),
        onClick: insertOrEditLink,
      },
      {
        key: "unlink",
        title: "Remove link",
        icon: <Unlink size={16} />,
        onClick: removeLink,
      },

      { key: "sep-4", sep: true },

      {
        key: "image",
        title: "Upload image (resizable)",
        icon: <ImageIcon size={16} />,
        onClick: insertImage,
      },
      {
        key: "table",
        title: "Insert table",
        icon: <Table2 size={16} />,
        active: editor.isActive("table"),
        onClick: insertTable,
      },
      {
        key: "video",
        title: "Insert YouTube video",
        icon: <Video size={16} />,
        active: editor.isActive("youtube"),
        onClick: insertYoutube,
      },

      { key: "sep-5", sep: true },

      {
        key: "undo",
        title: "Undo",
        icon: <Undo2 size={16} />,
        disabled: !canUndo,
        onClick: () => editor.chain().focus().undo().run(),
      },
      {
        key: "redo",
        title: "Redo",
        icon: <Redo2 size={16} />,
        disabled: !canRedo,
        onClick: () => editor.chain().focus().redo().run(),
      },
    ];

    return items;
  }, [editor, canUndo, canRedo]);

  if (!editor) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
        </p>
        <div className="h-12 w-full animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </p>

      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-white dark:bg-gray-900",
          isFocused
            ? "border-primary-400 ring-2 ring-primary-400/15 dark:border-primary-500/60 dark:ring-primary-500/15"
            : "border-gray-200 dark:border-gray-800",
        )}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-800">
          {toolbar.map((item) => {
            if ("sep" in item) {
              return (
                <span
                  key={item.key}
                  className="mx-1 h-6 w-px bg-gray-200 dark:bg-gray-700"
                />
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                title={item.title}
                disabled={item.disabled}
                className={toolbarBtnClass(item.active, item.disabled)}
                onClick={item.onClick}
              >
                {item.icon}
              </button>
            );
          })}

          <div className="ml-auto">
            {/* ✅ Button without leftIcon to match your ButtonProps */}
            <Button size="sm" variant="outline" onClick={clearAll}>
              <span className="inline-flex items-center gap-2">
                <Eraser size={16} />
                Clear
              </span>
            </Button>
          </div>
        </div>

        {/* ✅ Advanced table tools */}
        <RichTextEditorTableTools editor={editor} />

        <div
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {helperText ? (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helperText}</p>
      ) : null}

      {/* ✅ Pro styles to ensure lists & headings show correctly */}
      <style>
        {`
          .ProseMirror {
            word-break: break-word;
          }

          .ProseMirror p {
            margin: 0.35rem 0;
          }

          .ProseMirror h1 {
            font-size: 1.5rem;
            font-weight: 800;
            margin: 0.6rem 0;
          }

          .ProseMirror h2 {
            font-size: 1.25rem;
            font-weight: 800;
            margin: 0.55rem 0;
          }

          .ProseMirror h3 {
            font-size: 1.1rem;
            font-weight: 800;
            margin: 0.5rem 0;
          }

          .ProseMirror ul {
            list-style: disc;
            padding-left: 1.5rem;
            margin: 0.5rem 0;
          }

          .ProseMirror ol {
            list-style: decimal;
            padding-left: 1.5rem;
            margin: 0.5rem 0;
          }

          .ProseMirror li {
            margin: 0.15rem 0;
          }

          /* Tables */
          .ProseMirror table {
            width: 100%;
            border-collapse: collapse;
            overflow: hidden;
            border-radius: 12px;
            border: 1px solid rgba(229, 231, 235, 1);
          }
          .dark .ProseMirror table {
            border-color: rgba(55, 65, 81, 1);
          }
          .ProseMirror th, .ProseMirror td {
            border: 1px solid rgba(229, 231, 235, 1);
            padding: 10px;
            vertical-align: top;
          }
          .dark .ProseMirror th, .dark .ProseMirror td {
            border-color: rgba(55, 65, 81, 1);
          }
          .ProseMirror th {
            background: rgba(249, 250, 251, 1);
            font-weight: 700;
            text-align: left;
          }
          .dark .ProseMirror th {
            background: rgba(17, 24, 39, 1);
          }

          /* Placeholder */
          .ProseMirror p.is-editor-empty:first-child::before {
            content: attr(data-placeholder);
            float: left;
            color: #9CA3AF;
            pointer-events: none;
            height: 0;
          }

          /* YouTube */
          .ProseMirror .youtube {
            border-radius: 12px;
            overflow: hidden;
          }
        `}
      </style>
    </div>
  );
}
