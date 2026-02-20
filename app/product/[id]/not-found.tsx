import Link from "next/link";

export default function ProductNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6">
      <span className="inline-flex rounded-full border border-sky-300/25 bg-sky-400/12 px-3 py-1 text-xs font-semibold text-sky-300">
        خطأ 404
      </span>
      <h1 className="mt-4 text-3xl font-extrabold text-ink">الكتاب غير موجود</h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        لم نتمكن من العثور على هذا المنتج. قد يكون الرابط غير صحيح أو تم حذف
        الكتاب.
      </p>
      <Link
        href="/books"
        className="focus-visible-ring mt-6 rounded-xl bg-linear-to-l from-brand to-brand-strong px-5 py-3 text-sm font-semibold text-white transition-transform duration-200 hover:scale-[1.02]"
      >
        العودة إلى قائمة الكتب
      </Link>
    </main>
  );
}
