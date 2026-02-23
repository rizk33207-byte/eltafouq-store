import "server-only";

/**
 * lib/api.ts — public data-access API for server components and pages.
 *
 * DATA_SOURCE controls whether data comes from:
 *   - "mock"   → static in-memory data (lib/data.ts)   — default, no DB needed
 *   - "remote" → Neon/Prisma via lib/server/books-service.ts — NO internal fetch
 *
 * IMPORTANT: The "remote" path calls the service layer (Prisma) directly.
 * It must NEVER issue a self-referential fetch() to /api/books because there
 * is no localhost server running during Next.js server-side rendering on Vercel.
 * If you need an HTTP round-trip (e.g. from a true edge client), use the
 * /api/books route handler instead and pass an absolute NEXT_PUBLIC_SITE_URL.
 */

import {
  books as mockBooks,
  filterBooks as filterMockBooks,
  parseBookFilters as parseMockBookFilters,
} from "./data";
import {
  listBooks,
  getBook,
} from "@/lib/server/books-service";
import {
  isLang,
  isGrade,
  isSubject,
  type ApiResult,
  type Book,
  type BookFilters,
} from "./types";

const DATA_SOURCE: "mock" | "remote" =
  process.env.DATA_SOURCE === "remote" ? "remote" : "mock";

// ---------------------------------------------------------------------------
// Filter helpers (shared between mock and remote paths)
// ---------------------------------------------------------------------------

const normalizeParam = (
  value: string | string[] | undefined,
): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return undefined;
};

export const parseBookFilters = (
  searchParams: Record<string, string | string[] | undefined>,
): BookFilters => {
  const hierarchical = parseMockBookFilters(searchParams);

  const qRaw = normalizeParam(searchParams.q);
  const featuredRaw = normalizeParam(searchParams.featured);

  const featured =
    featuredRaw === "true" || featuredRaw === "1"
      ? true
      : featuredRaw === "false" || featuredRaw === "0"
        ? false
        : undefined;

  return {
    ...hierarchical,
    ...(qRaw ? { q: qRaw } : {}),
    ...(featured !== undefined ? { featured } : {}),
  };
};

export const parseBookFiltersFromSearchParams = (
  searchParams: URLSearchParams,
): BookFilters => {
  const gradeRaw = searchParams.get("grade");
  const langRaw = searchParams.get("lang");
  const subjectRaw = searchParams.get("subject");
  const qRaw = searchParams.get("q");
  const featuredRaw = searchParams.get("featured");

  const grade = isGrade(gradeRaw) ? gradeRaw : undefined;
  const lang = grade && isLang(langRaw) ? langRaw : undefined;
  const subject = grade && lang && isSubject(subjectRaw) ? subjectRaw : undefined;
  const featured =
    featuredRaw === "true" || featuredRaw === "1"
      ? true
      : featuredRaw === "false" || featuredRaw === "0"
        ? false
        : undefined;

  return {
    ...(grade ? { grade } : {}),
    ...(lang ? { lang } : {}),
    ...(subject ? { subject } : {}),
    ...(qRaw ? { q: qRaw } : {}),
    ...(featured !== undefined ? { featured } : {}),
  };
};

// ---------------------------------------------------------------------------
// Mock-path helpers
// ---------------------------------------------------------------------------

const applyAdditionalMockFilters = (items: Book[], filters: BookFilters): Book[] =>
  items.filter((book) => {
    if (filters.featured !== undefined && Boolean(book.featured) !== filters.featured) {
      return false;
    }

    if (filters.q) {
      const query = filters.q.trim().toLowerCase();
      if (query.length > 0) {
        const haystack = `${book.title} ${book.description}`.toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }
    }

    return true;
  });

// ---------------------------------------------------------------------------
// Public API — called directly by server components and pages
// ---------------------------------------------------------------------------

/**
 * Fetch a filtered list of books.
 *
 * "mock"   → filters in-memory data   (no DB, no network)
 * "remote" → calls listBooks() via Prisma  (no HTTP round-trip)
 */
export const getBooks = async (
  filters: BookFilters = {},
): Promise<ApiResult<Book[]>> => {
  if (DATA_SOURCE === "remote") {
    const result = await listBooks(filters);
    return {
      data: result.data as Book[],
      meta: { total: result.total },
    };
  }

  // mock path
  const baseResults = filterMockBooks(filters as Parameters<typeof filterMockBooks>[0]);
  const filtered = applyAdditionalMockFilters(baseResults as Book[], filters);

  return {
    data: filtered,
    meta: { total: filtered.length },
  };
};

/**
 * Fetch a single book by its ID.
 *
 * "mock"   → looks up in-memory array  (no DB, no network)
 * "remote" → calls getBook() via Prisma  (no HTTP round-trip)
 */
export const getBookById = async (id: string): Promise<Book | null> => {
  if (DATA_SOURCE === "remote") {
    const book = await getBook(id);
    return book as Book | null;
  }

  // mock path
  const book = (mockBooks as Book[]).find((item) => item.id === id);
  return book ?? null;
};

/** Returns mock book IDs — used by the sitemap generator */
export const getMockBookIds = (): string[] => (mockBooks as Book[]).map((book) => book.id);
