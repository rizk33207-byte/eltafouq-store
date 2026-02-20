import { redirect } from "next/navigation";

interface LegacyBooksPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const toQueryString = (params: Record<string, string | string[] | undefined>): string => {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      query.set(key, value);
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => query.append(key, entry));
    }
  }

  return query.toString();
};

export default async function LegacyBooksPage({ searchParams }: LegacyBooksPageProps) {
  const query = toQueryString(await searchParams);
  redirect(query ? `/ar/books?${query}` : "/ar/books");
}
