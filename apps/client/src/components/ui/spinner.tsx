/** The one loading indicator: centered in whatever space its parent gives it. */
export function Spinner({ className = "flex-1" }: { className?: string }) {
  return (
    <div role="status" aria-label="Loading" className={`flex items-center justify-center ${className}`}>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-raised border-t-white" />
    </div>
  );
}
