import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";
import { toPublicUrl } from "@/utils/toPublicUrl";

type Props = {
 src?: string | null;
 alt: string;
 size?: "sm" | "md" | "lg";
 className?: string;
};

const sizeMap = {
 sm: "h-7 w-7 rounded-lg",
 md: "h-9 w-9 rounded-lg",
 lg: "h-12 w-12 rounded-xl",
};

const iconSizeMap = { sm: 12, md: 14, lg: 18 };

/**
 * Image thumbnail with placeholder icon fallback.
 *
 * ```tsx
 * <ImageThumb src={category.img_path} alt={category.name} />
 * <ImageThumb src={null} alt="No image" size="lg" />
 * ```
 */
export default function ImageThumb({ src, alt, size = "md", className }: Props) {
 const full = src ? toPublicUrl(src) : "";
 const containerCls = cn(
  "overflow-hidden border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900",
  sizeMap[size],
  className,
 );

 if (!full) {
  return (
   <div className={cn(containerCls, "flex items-center justify-center")}>
    <Layers size={iconSizeMap[size]} className="text-gray-400" />
   </div>
  );
 }

 return (
  <div className={containerCls}>
   {/* eslint-disable-next-line @next/next/no-img-element */}
   <img src={full} alt={alt} className="h-full w-full object-cover" />
  </div>
 );
}
