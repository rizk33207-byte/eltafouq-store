import type { Prisma } from "@prisma/client";
import type { BookFilters } from "@/lib/types";
import { prisma } from "@/lib/prisma";

const mapBookRecord = (book: {
  id: string;
  title: string;
  grade: string;
  language: string;
  subject: string;
  price: number;
  description: string;
  image: string | null;
  featured: boolean;
  stock: number;
}) => ({
  id: book.id,
  title: book.title,
  grade: book.grade as "g1" | "g2" | "g3",
  language: book.language as "ar" | "en",
  subject: book.subject as "bio" | "phy" | "chem",
  price: book.price,
  description: book.description,
  image: book.image ?? "/images/book-placeholder.svg",
  featured: book.featured,
  stock: book.stock,
});

const buildBookWhereInput = (filters: BookFilters): Prisma.BookWhereInput => {
  const where: Prisma.BookWhereInput = {};

  if (filters.grade) {
    where.grade = filters.grade;
  }

  if (filters.lang) {
    where.language = filters.lang;
  }

  if (filters.subject) {
    where.subject = filters.subject;
  }

  if (filters.q && filters.q.trim()) {
    const query = filters.q.trim();
    where.OR = [
      { title: { contains: query, mode: "insensitive" } },
      { description: { contains: query, mode: "insensitive" } },
    ];
  }

  if (filters.featured !== undefined) {
    where.featured = filters.featured;
  }

  return where;
};

export const listBooks = async (filters: BookFilters) => {
  const where = buildBookWhereInput(filters);
  const [data, total] = await Promise.all([
    prisma.book.findMany({
      where,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    }),
    prisma.book.count({ where }),
  ]);

  return {
    data: data.map(mapBookRecord),
    total,
  };
};

export const getBook = async (id: string) => {
  const book = await prisma.book.findUnique({
    where: { id },
  });

  if (!book) {
    return null;
  }

  return mapBookRecord(book);
};
