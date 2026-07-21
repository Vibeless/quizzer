export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 animate-fade-in space-y-6">
      {/* Hero skeleton */}
      <div className="glass-panel p-8 rounded-2xl border border-white/10 space-y-4">
        <div className="h-4 w-36 skeleton" />
        <div className="h-8 w-64 skeleton" />
        <div className="h-4 w-96 skeleton" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl skeleton" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-28 skeleton" />
                <div className="h-3 w-16 skeleton" />
              </div>
            </div>
            <div className="h-3 w-full skeleton" />
            <div className="h-8 w-full skeleton pt-4" />
          </div>
        ))}
      </div>
    </div>
  );
}
