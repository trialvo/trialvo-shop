"use client";

import { useEffect } from "react";

export default function GlobalError({
 error,
 reset,
}: {
 error: Error & { digest?: string };
 reset: () => void;
}) {
 useEffect(() => {
  console.error("Unhandled error:", error);
 }, [error]);

 return (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
   <div className="rounded-full bg-red-50 p-4 dark:bg-red-950/30">
    <svg
     xmlns="http://www.w3.org/2000/svg"
     className="h-10 w-10 text-red-500"
     fill="none"
     viewBox="0 0 24 24"
     stroke="currentColor"
     strokeWidth={1.5}
    >
     <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
     />
    </svg>
   </div>
   <h2 className="text-xl font-semibold text-foreground">
    Something went wrong
   </h2>
   <p className="max-w-md text-sm text-muted-foreground">
    An unexpected error occurred. Please try again or contact support if the
    issue persists.
   </p>
   <button
    onClick={reset}
    className="mt-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
   >
    Try again
   </button>
  </div>
 );
}
