export type Locale = "ar" | "en";
export type Grade = "g1" | "g2" | "g3";
export type Lang = "ar" | "en";
export type Subject = "bio" | "phy" | "chem";
export type AdminRole = "SUPER_ADMIN" | "ADMIN" | "EDITOR";
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface Book {
  id: string;
  title: string;
  grade: Grade;
  language: Lang;
  subject: Subject;
  price: number;
  description: string;
  image: string;
  featured?: boolean;
  stock?: number;
}

export interface BookFilters {
  grade?: Grade;
  lang?: Lang;
  subject?: Subject;
  q?: string;
  featured?: boolean;
}

export interface ApiResult<T> {
  data: T;
  meta?: {
    total?: number;
    timeline?: Array<Exclude<OrderStatus, "CANCELLED">>;
  };
}

export interface CreateOrderPayload {
  customer: {
    name: string;
    phone: string;
    city: string;
    address: string;
    notes?: string;
  };
  items: Array<{
    bookId: string;
    qty: number;
  }>;
}

export interface CreateOrderResponse {
  orderId: string;
  status: OrderStatus;
}

export interface PublicOrderItem {
  bookId: string;
  qty: number;
  unitPrice: number;
  titleSnapshot: string;
  imageSnapshot?: string | null;
}

export interface PublicOrderDetails {
  orderId: string;
  status: OrderStatus;
  channel: string;
  createdAt: string;
  timeline: {
    createdAt: string;
    confirmedAt?: string | null;
    shippedAt?: string | null;
    deliveredAt?: string | null;
    cancelledAt?: string | null;
  };
  subtotal: number;
  shipping: number;
  total: number;
  customer: {
    name: string;
    phoneMasked: string;
    city: string;
    address: string;
    notes?: string | null;
  };
  items: PublicOrderItem[];
}

export const gradeValues: Grade[] = ["g1", "g2", "g3"];
export const langValues: Lang[] = ["ar", "en"];
export const subjectValues: Subject[] = ["bio", "phy", "chem"];
export const orderStatusValues: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

export const adminRoleValues: AdminRole[] = ["SUPER_ADMIN", "ADMIN", "EDITOR"];

export const isGrade = (value: string | null | undefined): value is Grade =>
  value !== null && value !== undefined && gradeValues.includes(value as Grade);

export const isLang = (value: string | null | undefined): value is Lang =>
  value !== null && value !== undefined && langValues.includes(value as Lang);

export const isSubject = (value: string | null | undefined): value is Subject =>
  value !== null && value !== undefined && subjectValues.includes(value as Subject);
