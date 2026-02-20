import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  CreateOrderPayload,
  CreateOrderResponse,
  OrderStatus,
  PublicOrderDetails,
  PublicOrderItem,
} from "@/lib/types";
import { orderTimeline } from "@/lib/orders";
import { retryWithBackoff } from "./db-retry";
import { generateOrderId } from "./order-id";
import { maskPhone } from "./phone";

const statusFlow: Array<Exclude<OrderStatus, "CANCELLED">> = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
];

export class OrderServiceError extends Error {
  status: number;
  code: string;
  bookId?: string;

  constructor(options: {
    message: string;
    status: number;
    code: string;
    bookId?: string;
  }) {
    super(options.message);
    this.status = options.status;
    this.code = options.code;
    this.bookId = options.bookId;
  }
}

const normalizeOrderItems = (items: CreateOrderPayload["items"]) => {
  const byBookId = new Map<string, number>();

  for (const item of items) {
    const currentQty = byBookId.get(item.bookId) ?? 0;
    byBookId.set(item.bookId, currentQty + item.qty);
  }

  return [...byBookId.entries()].map(([bookId, qty]) => ({ bookId, qty }));
};

const normalizeCustomer = (customer: CreateOrderPayload["customer"]) => ({
  name: customer.name.trim(),
  phone: customer.phone.trim(),
  city: customer.city.trim(),
  address: customer.address.trim(),
  notes: customer.notes?.trim() || null,
});

interface PreparedOrderLine {
  bookId: string;
  qty: number;
  unitPrice: number;
  titleSnapshot: string;
  imageSnapshot: string | null;
}

interface PreparedOrderPayload {
  items: Array<{
    bookId: string;
    qty: number;
  }>;
  customer: ReturnType<typeof normalizeCustomer>;
  pricing: {
    subtotal: number;
    shipping: number;
    total: number;
    lines: PreparedOrderLine[];
  };
}

const toIsoOrNull = (value: Date | null): string | null =>
  value ? value.toISOString() : null;

const getOrderPublicPayload = async (
  orderId: string,
): Promise<PublicOrderDetails | null> => {
  const order = await prisma.order.findUnique({
    where: { orderId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) {
    return null;
  }

  const items: PublicOrderItem[] = order.items.map((item) => ({
    bookId: item.bookId,
    qty: item.qty,
    unitPrice: item.unitPrice,
    titleSnapshot: item.titleSnapshot,
    imageSnapshot: item.imageSnapshot,
  }));

  return {
    orderId: order.orderId,
    status: order.status as OrderStatus,
    channel: order.channel,
    createdAt: order.createdAt.toISOString(),
    timeline: {
      createdAt: order.createdAt.toISOString(),
      confirmedAt: toIsoOrNull(order.confirmedAt),
      shippedAt: toIsoOrNull(order.shippedAt),
      deliveredAt: toIsoOrNull(order.deliveredAt),
      cancelledAt: toIsoOrNull(order.cancelledAt),
    },
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    customer: {
      name: order.customerName,
      phoneMasked: maskPhone(order.phone),
      city: order.city,
      address: order.address,
      notes: order.notes,
    },
    items,
  };
};

const isOrderIdCollisionError = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === "P2002";

const isStatusTransitionAllowed = (current: OrderStatus, next: OrderStatus): boolean => {
  if (current === next) {
    return true;
  }

  if (current === "DELIVERED" || current === "CANCELLED") {
    return false;
  }

  if (next === "CANCELLED") {
    return current === "PENDING" || current === "CONFIRMED" || current === "SHIPPED";
  }

  const currentIndex = statusFlow.findIndex((status) => status === current);
  const nextIndex = statusFlow.findIndex((status) => status === next);

  if (currentIndex < 0 || nextIndex < 0) {
    return false;
  }

  return nextIndex === currentIndex + 1;
};

const buildStatusUpdateData = (
  current: {
    status: OrderStatus;
    confirmedAt: Date | null;
    shippedAt: Date | null;
    deliveredAt: Date | null;
    cancelledAt: Date | null;
  },
  next: OrderStatus,
): Prisma.OrderUpdateInput => {
  if (current.status === next) {
    return {};
  }

  const now = new Date();
  const data: Prisma.OrderUpdateInput = {
    status: next,
  };

  if (next === "CONFIRMED") {
    if (!current.confirmedAt) {
      data.confirmedAt = now;
    }

    return data;
  }

  if (next === "SHIPPED") {
    if (!current.shippedAt) {
      data.shippedAt = now;
    }

    return data;
  }

  if (next === "DELIVERED") {
    if (!current.deliveredAt) {
      data.deliveredAt = now;
    }

    return data;
  }

  if (next === "CANCELLED" && !current.cancelledAt) {
    data.cancelledAt = now;
  }

  return data;
};

const buildPreparedOrderPayload = async (
  payload: CreateOrderPayload,
): Promise<PreparedOrderPayload> => {
  const items = normalizeOrderItems(payload.items);
  const customer = normalizeCustomer(payload.customer);
  const books = await prisma.book.findMany({
    where: {
      id: {
        in: items.map((item) => item.bookId),
      },
    },
    select: {
      id: true,
      title: true,
      price: true,
      image: true,
    },
  });
  const booksById = new Map(books.map((book) => [book.id, book]));

  const lines = items.map((item) => {
    const book = booksById.get(item.bookId);

    if (!book) {
      throw new OrderServiceError({
        message: "Book was not found.",
        status: 404,
        code: "BOOK_NOT_FOUND",
        bookId: item.bookId,
      });
    }

    return {
      bookId: item.bookId,
      qty: item.qty,
      unitPrice: book.price,
      titleSnapshot: book.title,
      imageSnapshot: book.image ?? null,
    };
  });

  const subtotal = lines.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
  const shipping = 0;
  const total = subtotal + shipping;

  return {
    items,
    customer,
    pricing: {
      subtotal,
      shipping,
      total,
      lines,
    },
  };
};

const createOrderWithUniqueId = async (
  preparedPayload: PreparedOrderPayload,
): Promise<CreateOrderResponse> => {
  const maxAttempts = 5;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const orderId = generateOrderId();

    try {
      const created = await prisma.$transaction(
        async (tx) => {
          const existingBooks = await tx.book.findMany({
            where: {
              id: {
                in: preparedPayload.items.map((item) => item.bookId),
              },
            },
            select: {
              id: true,
            },
          });

          const existingBookIds = new Set(existingBooks.map((book) => book.id));

          for (const item of preparedPayload.items) {
            if (!existingBookIds.has(item.bookId)) {
              throw new OrderServiceError({
                message: "Book was not found.",
                status: 404,
                code: "BOOK_NOT_FOUND",
                bookId: item.bookId,
              });
            }
          }

          for (const item of preparedPayload.items) {
            const stockUpdate = await tx.book.updateMany({
              where: {
                id: item.bookId,
                stock: {
                  gte: item.qty,
                },
              },
              data: {
                stock: {
                  decrement: item.qty,
                },
              },
            });

            if (stockUpdate.count !== 1) {
              throw new OrderServiceError({
                message: "Requested quantity is out of stock.",
                status: 409,
                code: "OUT_OF_STOCK",
                bookId: item.bookId,
              });
            }
          }

          const order = await tx.order.create({
            data: {
              orderId,
              status: "PENDING",
              channel: "WHATSAPP",
              subtotal: preparedPayload.pricing.subtotal,
              shipping: preparedPayload.pricing.shipping,
              total: preparedPayload.pricing.total,
              customerName: preparedPayload.customer.name,
              phone: preparedPayload.customer.phone,
              city: preparedPayload.customer.city,
              address: preparedPayload.customer.address,
              notes: preparedPayload.customer.notes,
              items: {
                create: preparedPayload.pricing.lines.map((item) => ({
                  bookId: item.bookId,
                  qty: item.qty,
                  unitPrice: item.unitPrice,
                  titleSnapshot: item.titleSnapshot,
                  imageSnapshot: item.imageSnapshot,
                })),
              },
            },
          });

          return {
            orderId: order.orderId,
            status: order.status as OrderStatus,
          };
        },
        {
          maxWait: 10000,
          timeout: 20000,
        },
      );

      return created;
    } catch (error) {
      if (error instanceof OrderServiceError) {
        throw error;
      }

      if (isOrderIdCollisionError(error) && attempt < maxAttempts - 1) {
        continue;
      }

      throw error;
    }
  }

  throw new OrderServiceError({
    message: "Failed to generate a unique order ID.",
    status: 500,
    code: "ORDER_ID_GENERATION_FAILED",
  });
};

export const createOrder = async (
  payload: CreateOrderPayload,
): Promise<CreateOrderResponse> => {
  const startedAt = Date.now();

  const result = await retryWithBackoff(
    async () => {
      const preparedPayload = await buildPreparedOrderPayload(payload);
      return createOrderWithUniqueId(preparedPayload);
    },
    {
      retries: 3,
      baseDelayMs: 150,
      maxDelayMs: 1200,
    },
  );

  if (process.env.NODE_ENV === "development") {
    console.info("[db]", {
      route: "POST /api/orders",
      orderId: result.orderId,
      durationMs: Date.now() - startedAt,
    });
  }

  return result;
};

export const getOrderForTracking = async (
  orderId: string,
): Promise<{ data: PublicOrderDetails; timeline: typeof orderTimeline } | null> => {
  const order = await getOrderPublicPayload(orderId);

  if (!order) {
    return null;
  }

  return {
    data: order,
    timeline: orderTimeline,
  };
};

export const updateOrderStatus = async (
  orderId: string,
  status: OrderStatus,
): Promise<{ data: PublicOrderDetails; timeline: typeof orderTimeline }> => {
  const currentOrder = await prisma.order.findUnique({
    where: { orderId },
    select: {
      status: true,
      confirmedAt: true,
      shippedAt: true,
      deliveredAt: true,
      cancelledAt: true,
    },
  });

  if (!currentOrder) {
    throw new OrderServiceError({
      message: "Order was not found.",
      status: 404,
      code: "ORDER_NOT_FOUND",
    });
  }

  const currentStatus = currentOrder.status as OrderStatus;

  if (!isStatusTransitionAllowed(currentStatus, status)) {
    throw new OrderServiceError({
      message: "Invalid order status transition.",
      status: 409,
      code: "INVALID_STATUS_TRANSITION",
    });
  }

  const updateData = buildStatusUpdateData(
    {
      status: currentStatus,
      confirmedAt: currentOrder.confirmedAt,
      shippedAt: currentOrder.shippedAt,
      deliveredAt: currentOrder.deliveredAt,
      cancelledAt: currentOrder.cancelledAt,
    },
    status,
  );

  if (Object.keys(updateData).length > 0) {
    await prisma.order.update({
      where: { orderId },
      data: updateData,
    });
  }

  const order = await getOrderForTracking(orderId);

  if (!order) {
    throw new OrderServiceError({
      message: "Order was not found.",
      status: 404,
      code: "ORDER_NOT_FOUND",
    });
  }

  return order;
};
