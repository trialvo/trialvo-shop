import React from 'react';

const SkeletonPulse: React.FC<{ className?: string }> = ({ className }) => (
 <div className={`animate-pulse bg-muted rounded-lg ${className || ''}`} />
);

export const ProductCardSkeleton: React.FC = () => (
 <div className="bg-card rounded-2xl border border-border overflow-hidden">
  <SkeletonPulse className="aspect-[4/3] rounded-none" />
  <div className="p-5 space-y-3">
   <SkeletonPulse className="h-5 w-3/4" />
   <SkeletonPulse className="h-4 w-full" />
   <SkeletonPulse className="h-4 w-1/2" />
   <div className="flex items-center gap-2 pt-2">
    <SkeletonPulse className="h-7 w-24" />
    <SkeletonPulse className="h-5 w-12" />
   </div>
   <div className="flex gap-2 pt-2">
    <SkeletonPulse className="h-10 flex-1 rounded-xl" />
    <SkeletonPulse className="h-10 w-10 rounded-xl" />
   </div>
  </div>
 </div>
);

export const TestimonialSkeleton: React.FC = () => (
 <div className="bg-card border border-border rounded-2xl p-8 space-y-4">
  <SkeletonPulse className="w-10 h-10 rounded-xl" />
  <div className="flex gap-1">
   {[1, 2, 3, 4, 5].map(i => (
    <SkeletonPulse key={i} className="w-4 h-4 rounded-sm" />
   ))}
  </div>
  <SkeletonPulse className="h-4 w-full" />
  <SkeletonPulse className="h-4 w-5/6" />
  <SkeletonPulse className="h-4 w-2/3" />
  <div className="flex items-center gap-3 pt-4 border-t border-border">
   <SkeletonPulse className="w-11 h-11 rounded-full" />
   <div className="space-y-2 flex-1">
    <SkeletonPulse className="h-4 w-24" />
    <SkeletonPulse className="h-3 w-16" />
   </div>
  </div>
 </div>
);

export const CategorySkeleton: React.FC = () => (
 <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
  <SkeletonPulse className="w-16 h-16 mx-auto rounded-2xl" />
  <SkeletonPulse className="h-5 w-2/3 mx-auto" />
  <SkeletonPulse className="h-4 w-full" />
  <SkeletonPulse className="h-6 w-24 mx-auto rounded-full" />
 </div>
);

export const ProductDetailSkeleton: React.FC = () => (
 <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
  <div className="space-y-4">
   <SkeletonPulse className="h-10 w-full rounded-lg" />
   <SkeletonPulse className="aspect-[4/3] rounded-2xl" />
  </div>
  <div className="space-y-4">
   <SkeletonPulse className="h-6 w-20 rounded-full" />
   <SkeletonPulse className="h-10 w-3/4" />
   <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(i => (
     <SkeletonPulse key={i} className="w-5 h-5 rounded-sm" />
    ))}
   </div>
   <SkeletonPulse className="h-4 w-full" />
   <SkeletonPulse className="h-4 w-2/3" />
   <SkeletonPulse className="h-32 rounded-xl" />
   <div className="flex gap-4">
    <SkeletonPulse className="h-14 flex-1 rounded-xl" />
    <SkeletonPulse className="h-14 flex-1 rounded-xl" />
   </div>
   <div className="grid grid-cols-2 gap-4">
    {[1, 2, 3, 4].map(i => (
     <SkeletonPulse key={i} className="h-16 rounded-lg" />
    ))}
   </div>
  </div>
 </div>
);

export default SkeletonPulse;
