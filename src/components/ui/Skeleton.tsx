export function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: "var(--background-2)", border: "1px solid var(--border)" }}
    >
      <div className="skeleton h-9 w-9 rounded-xl" />
      <div className="skeleton h-8 w-24 rounded-lg" />
      <div className="skeleton h-3 w-32 rounded" />
    </div>
  );
}

export function SkeletonLeadItem() {
  return (
    <div className="p-3 rounded-lg space-y-2" style={{ background: "var(--background-3)" }}>
      <div className="flex justify-between">
        <div className="skeleton h-4 w-36 rounded" />
        <div className="skeleton h-5 w-8 rounded-lg" />
      </div>
      <div className="skeleton h-3 w-24 rounded" />
      <div className="skeleton h-7 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonStatRow() {
  return (
    <div className="grid grid-cols-3 gap-4">
      {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
    </div>
  );
}
