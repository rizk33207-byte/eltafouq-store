import type {
  ApiResult,
  CreateOrderPayload,
  CreateOrderResponse,
  OrderStatus,
  PublicOrderDetails,
} from "./types";

export const orderTimeline: Array<Exclude<OrderStatus, "CANCELLED">> = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
];

export class OrderApiError extends Error {
  status: number;
  code?: string;
  bookId?: string;

  constructor(options: { message: string; status: number; code?: string; bookId?: string }) {
    super(options.message);
    this.status = options.status;
    this.code = options.code;
    this.bookId = options.bookId;
  }
}

const parseOrderApiError = async (response: Response): Promise<OrderApiError> => {
  try {
    const payload = (await response.json()) as {
      error?: string;
      code?: string;
      message?: string;
      bookId?: string;
    };
    const message = payload.message || payload.error || "Order API request failed.";

    return new OrderApiError({
      message,
      status: response.status,
      code: payload.code ?? payload.error,
      bookId: payload.bookId,
    });
  } catch {
    return new OrderApiError({
      message: "Order API request failed.",
      status: response.status,
    });
  }
};

export const createOrderRequest = async (
  payload: CreateOrderPayload,
): Promise<CreateOrderResponse> => {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw await parseOrderApiError(response);
  }

  return (await response.json()) as CreateOrderResponse;
};

export const getOrderRequest = async (
  orderId: string,
): Promise<ApiResult<PublicOrderDetails>> => {
  const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw await parseOrderApiError(response);
  }

  return (await response.json()) as ApiResult<PublicOrderDetails>;
};

export const patchOrderStatusRequest = async (
  orderId: string,
  status: OrderStatus,
): Promise<ApiResult<PublicOrderDetails>> => {
  const response = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw await parseOrderApiError(response);
  }

  return (await response.json()) as ApiResult<PublicOrderDetails>;
};
