import { Skeleton } from "@/components/ui/skeleton";

const ProductInfoPanelSkeleton: React.FC = () => {
  return (
    <div className="relative col-span-6" aria-busy="true" aria-label="Loading product info">
      <div className="absolute right-0 top-0">
        <Skeleton className="h-9 w-9 rounded-none" />
      </div>

      <div className="space-y-3 sm:space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-130" />

          <div className="flex items-baseline gap-3">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-28" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-12 rounded-none" />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-16 rounded-none" />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-18" />
            <Skeleton className="h-4 w-8" />
          </div>

          <div className="flex items-center gap-2">
            <Skeleton className="h-11 w-11 rounded-none" />
            <Skeleton className="h-11 w-20 rounded-none" />
            <Skeleton className="h-11 w-11 rounded-none" />
          </div>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Skeleton className="h-9 w-9 rounded-none" />
          <Skeleton className="h-9 flex-1 rounded-none" />
          <Skeleton className="h-9 flex-1 rounded-none" />
        </div>
      </div>
    </div>
  );
};

export default ProductInfoPanelSkeleton;