import { BooksGridSkeleton } from "@/components/Skeletons";

export default function LoadingBooksPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 space-y-3">
        <div className="skeleton h-6 w-40 rounded-full" />
        <div className="skeleton h-10 w-72 rounded-xl" />
        <div className="skeleton h-5 w-full max-w-xl rounded-xl" />
      </div>
      <BooksGridSkeleton count={8} />
    </main>
  );
}
