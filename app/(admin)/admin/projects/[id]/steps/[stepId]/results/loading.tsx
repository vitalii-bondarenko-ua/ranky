export default function ResultsLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-2.5 w-16 bg-[#1e1e1e] animate-pulse" />
        <div className="h-2.5 w-1 bg-[#1e1e1e]" />
        <div className="h-2.5 w-28 bg-[#1e1e1e] animate-pulse" />
        <div className="h-2.5 w-1 bg-[#1e1e1e]" />
        <div className="h-2.5 w-14 bg-[#1e1e1e] animate-pulse" />
      </div>

      <div className="flex items-center justify-between">
        <div className="h-2.5 w-40 bg-[#1e1e1e] animate-pulse" />
        <div className="h-7 w-36 bg-[#1e1e1e] animate-pulse" />
      </div>

      <div className="space-y-2">
        {[90, 72, 55, 38, 20].map((w, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-9 bg-[#1e1e1e] animate-pulse shrink-0" />
            <div
              className="h-9 bg-[#1a1a1a] animate-pulse"
              style={{ width: `${w}%` }}
            />
            <div className="w-10 h-9 bg-[#1e1e1e] animate-pulse shrink-0" />
          </div>
        ))}
      </div>

      <div className="h-12 bg-[#0e0e0e] border border-[#1e1e1e] animate-pulse" />
    </main>
  );
}
