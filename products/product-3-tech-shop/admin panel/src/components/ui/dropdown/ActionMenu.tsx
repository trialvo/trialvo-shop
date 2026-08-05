import { cn } from "@/lib/utils";
import { Pencil, Trash2 } from "lucide-react";

type Props = {
 onEdit?: () => void;
 onDelete?: () => void;
 editLabel?: string;
 deleteLabel?: string;
 className?: string;
};

/**
 * Edit + Delete icon buttons used in table rows.
 *
 * ```tsx
 * <ActionMenu onEdit={() => openEdit(id)} onDelete={() => openDelete(id)} />
 * ```
 */
export default function ActionMenu({
 onEdit,
 onDelete,
 editLabel = "Edit",
 deleteLabel = "Delete",
 className,
}: Props) {
 return (
  <div className={cn("flex items-center justify-end gap-1.5", className)}>
   {onEdit && (
    <button
     type="button"
     onClick={onEdit}
     title={editLabel}
     aria-label={editLabel}
     className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-500 dark:hover:text-brand-400"
    >
     <Pencil size={14} />
    </button>
   )}
   {onDelete && (
    <button
     type="button"
     onClick={onDelete}
     title={deleteLabel}
     aria-label={deleteLabel}
     className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:border-red-300 hover:text-red-500 dark:border-gray-700 dark:bg-gray-900 dark:hover:border-red-700 dark:hover:text-red-400"
    >
     <Trash2 size={14} />
    </button>
   )}
  </div>
 );
}
