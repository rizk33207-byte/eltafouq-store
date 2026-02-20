import {
  books as mockBooks,
  filterBooks as filterMockBooks,
  parseBookFilters as parseMockBookFilters,
} from "./data";
import { isLang, isGrade, isSubject, type ApiResult, type Book, type BookFilters } from "./types";

const DATA_SOURCE: "mock" | "remote" =
  (process.env.NEXT_PUBLIC_DATA_SOURCE ?? process.env.DATA_SOURCE) === "remote"
    ? "remote"
    : "mock";

const resolveApiUrl = (path: string): string => {
  if (typeof window !== "undefined") {
    return path;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return `${baseUrl}${path}`;
};

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

const buildQueryString = (filters: BookFilters): string => {
  const params = new URLSearchParams();

  if (filters.grade) {
    params.set("grade", filters.grade);
  }

  if (filters.lang) {
    params.set("lang", filters.lang);
  }

  if (filters.subject) {
    params.set("subject", filters.subject);
  }

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.featured !== undefined) {
    params.set("featured", String(filters.featured));
  }

  return params.toString();
};

const applyAdditionalMockFilters = (items: Book[], filters: BookFilters): Book[] => {
  return items.filter((book) => {
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

export const getBooks = async (
  filters: BookFilters = {},
): Promise<ApiResult<Book[]>> => {
  if (DATA_SOURCE === "remote") {
    const query = buildQueryString(filters);
    const response = await fetch(resolveApiUrl(`/api/books${query ? `?${query}` : ""}`), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch books");
    }

    return (await response.json()) as ApiResult<Book[]>;
  }

  const baseResults = filterMockBooks(filters as Parameters<typeof filterMockBooks>[0]);
  const filtered = applyAdditionalMockFilters(baseResults as Book[], filters);

  return {
    data: filtered,
    meta: {
      total: filtered.length,
    },
  };
};

export const getBookById = async (id: string): Promise<Book | null> => {
  if (DATA_SOURCE === "remote") {
    const response = await fetch(resolveApiUrl(`/api/books/${id}`), { cache: "no-store" });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Failed to fetch book");
    }

    const result = (await response.json()) as ApiResult<Book>;
    return result.data;
  }

  const book = (mockBooks as Book[]).find((item) => item.id === id);
  return book ?? null;
};

export const getMockBookIds = (): string[] => (mockBooks as Book[]).map((book) => book.id);
