export function BookCardSkeleton() {
  return (
    <article className="glass-panel overflow-hidden rounded-2xl">
      <div className="skeleton aspect-4/5 w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-5 w-4/5 rounded-lg" />
        <div className="skeleton h-4 w-2/3 rounded-lg" />
        <div className="skeleton h-10 w-full rounded-xl" />
      </div>
    </article>
  );
}

interface BooksGridSkeletonProps {
  count?: number;
}

export function BooksGridSkeleton({ count = 8 }: BooksGridSkeletonProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <BookCardSkeleton key={index} />
      ))}
    </div>
  );
}

