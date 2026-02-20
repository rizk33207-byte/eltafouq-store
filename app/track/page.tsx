import { redirect } from "next/navigation";

interface LegacyTrackPageProps {
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

export default async function LegacyTrackPage({ searchParams }: LegacyTrackPageProps) {
  const query = toQueryString(await searchParams);
  redirect(query ? `/ar/track?${query}` : "/ar/track");
}

