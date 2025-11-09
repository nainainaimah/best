export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="card text-center animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-20 mx-auto"></div>
    </div>
  );
}

export function SkeletonCalendar() {
  return (
    <div className="card animate-pulse">
      <div className="grid grid-cols-7 gap-2">
        {Array(35).fill(null).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="card animate-pulse">
      <div className="grid grid-cols-3 gap-2">
        {Array(9).fill(null).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonPost() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-16 h-16 bg-gray-200 rounded"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-4/5"></div>
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="card animate-pulse">
      <div className="space-y-3">
        {Array(5).fill(null).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
            <div className="h-8 w-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}
