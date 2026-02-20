import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { books } from "../lib/data";

const prisma = new PrismaClient();

const toSeedStock = (stock: unknown): number => {
  if (typeof stock === "number" && Number.isInteger(stock) && stock >= 0) {
    return stock;
  }

  return 100;
};

async function seedBooks() {
  const seededBooks = await prisma.$transaction(
    books.map((book) =>
      prisma.book.upsert({
        where: { id: book.id },
        update: {
          title: book.title,
          grade: book.grade,
          language: book.language,
          subject: book.subject,
          price: book.price,
          description: book.description,
          image: book.image,
          featured: Boolean(book.featured),
          ...(
            typeof (book as { stock?: unknown }).stock === "number"
              ? { stock: toSeedStock((book as { stock?: unknown }).stock) }
              : {}
          ),
        },
        create: {
          id: book.id,
          title: book.title,
          grade: book.grade,
          language: book.language,
          subject: book.subject,
          price: book.price,
          description: book.description,
          image: book.image,
          featured: Boolean(book.featured),
          stock: toSeedStock((book as { stock?: unknown }).stock),
        },
      }),
    ),
  );

  return seededBooks.length;
}

async function seedSuperAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD?.trim();

  if (!email || !password) {
    console.warn("Skipping admin seed: ADMIN_EMAIL or ADMIN_PASSWORD is missing.");
    return false;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.admin.upsert({
    where: { email },
    update: {
      password: passwordHash,
      role: "SUPER_ADMIN",
    },
    create: {
      email,
      password: passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  return true;
}

async function main() {
  console.log("🌱 Seeding database...");
  const bookCount = await seedBooks();
  console.log(`✔ Seeded ${bookCount} books`);

  const adminSeeded = await seedSuperAdmin();
  if (adminSeeded) {
    console.log("✔ Seeded SUPER_ADMIN account");
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
