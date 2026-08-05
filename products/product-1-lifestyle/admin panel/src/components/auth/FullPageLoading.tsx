export default function FullPageLoading() {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="h-10 w-10 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
    </div>
  );
}
