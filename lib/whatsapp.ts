import type { CartItem } from "./cart-types";
import { WHATSAPP_NUMBER } from "./config";
import type { Book, Locale } from "./types";
import { formatPriceEGP, getGradeLabel, getLanguageLabel } from "./utils";

export { WHATSAPP_NUMBER };
export const WHATSAPP_BASE_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

export const buildWhatsAppLink = (message?: string): string => {
  if (!message) {
    return WHATSAPP_BASE_LINK;
  }

  return `${WHATSAPP_BASE_LINK}?text=${encodeURIComponent(message)}`;
};

export const buildBookOrderMessage = (book: Book, locale: Locale = "ar"): string => {
  if (locale === "ar") {
    return [
      "مرحباً،",
      "أرغب في طلب:",
      book.title,
      getGradeLabel(book.grade, locale),
      getLanguageLabel(book.language, locale),
      `السعر: ${book.price} EGP`,
    ].join("\n");
  }

  return [
    "Hello,",
    "I would like to order:",
    book.title,
    getGradeLabel(book.grade, locale),
    getLanguageLabel(book.language, locale),
    `Price: ${book.price} EGP`,
  ].join("\n");
};

export const getBookWhatsAppLink = (
  book: Book,
  locale: Locale = "ar",
): string => buildWhatsAppLink(buildBookOrderMessage(book, locale));

export const buildCartMessage = (
  items: CartItem[],
  total: number,
  locale: Locale = "ar",
): string => {
  if (locale === "ar") {
    const lines = items.map(
      (item, index) =>
        `${index + 1}) ${item.title} x ${item.qty} - ${formatPriceEGP(item.price * item.qty, locale)}`,
    );

    return [
      "مرحباً،",
      "أرغب في إتمام الطلب التالي:",
      ...lines,
      `الإجمالي: ${formatPriceEGP(total, locale)}`,
    ].join("\n");
  }

  const lines = items.map(
    (item, index) =>
      `${index + 1}) ${item.title} x ${item.qty} - ${formatPriceEGP(item.price * item.qty, locale)}`,
  );

  return [
    "Hello,",
    "I would like to checkout the following order:",
    ...lines,
    `Total: ${formatPriceEGP(total, locale)}`,
  ].join("\n");
};

export const getCartWhatsAppLink = (
  items: CartItem[],
  total: number,
  locale: Locale = "ar",
): string => buildWhatsAppLink(buildCartMessage(items, total, locale));

export interface CheckoutCustomerInfo {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes?: string;
}

export interface CheckoutOrderSummaryItem {
  title: string;
  qty: number;
  unitPrice: number;
}

export const buildCartOrderMessage = (
  items: CartItem[],
  total: number,
  customer: CheckoutCustomerInfo,
  locale: Locale = "ar",
): string => {
  if (locale === "ar") {
    const itemLines = items.map(
      (item, index) =>
        `${index + 1}) ${item.title} x ${item.qty} - ${formatPriceEGP(item.price * item.qty, locale)}`,
    );

    return [
      "مرحباً،",
      "أرغب في إتمام الطلب التالي:",
      "",
      ...itemLines,
      "",
      `الإجمالي: ${formatPriceEGP(total, locale)}`,
      "",
      "بيانات العميل:",
      `الاسم: ${customer.name}`,
      `الهاتف: ${customer.phone}`,
      `المحافظة/المدينة: ${customer.city}`,
      `العنوان التفصيلي: ${customer.address}`,
      `ملاحظات: ${customer.notes?.trim() ? customer.notes : "لا يوجد"}`,
    ].join("\n");
  }

  const itemLines = items.map(
    (item, index) =>
      `${index + 1}) ${item.title} x ${item.qty} - ${formatPriceEGP(item.price * item.qty, locale)}`,
  );

  return [
    "Hello,",
    "I would like to place the following order:",
    "",
    ...itemLines,
    "",
    `Total: ${formatPriceEGP(total, locale)}`,
    "",
    "Customer details:",
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Governorate/City: ${customer.city}`,
    `Detailed address: ${customer.address}`,
    `Notes: ${customer.notes?.trim() ? customer.notes : "None"}`,
  ].join("\n");
};

export const buildCartOrderLink = (
  items: CartItem[],
  total: number,
  customer: CheckoutCustomerInfo,
  locale: Locale = "ar",
): string => buildWhatsAppLink(buildCartOrderMessage(items, total, customer, locale));

export const buildPlacedOrderMessage = (
  orderId: string,
  items: CheckoutOrderSummaryItem[],
  total: number,
  customer: CheckoutCustomerInfo,
  locale: Locale = "ar",
): string => {
  const lines = items.map((item, index) => {
    const lineTotal = item.unitPrice * item.qty;
    return `${index + 1}) ${item.title} x ${item.qty} - ${formatPriceEGP(lineTotal, locale)}`;
  });

  if (locale === "ar") {
    return [
      "مرحباً،",
      `رقم الطلب: ${orderId}`,
      "تم إنشاء الطلب عبر الموقع، برجاء تأكيد التوفر وموعد التوصيل:",
      "",
      ...lines,
      "",
      `الإجمالي: ${formatPriceEGP(total, locale)}`,
      "",
      "بيانات العميل:",
      `الاسم: ${customer.name}`,
      `الهاتف: ${customer.phone}`,
      `المحافظة/المدينة: ${customer.city}`,
      `العنوان التفصيلي: ${customer.address}`,
      `ملاحظات: ${customer.notes?.trim() ? customer.notes : "لا يوجد"}`,
    ].join("\n");
  }

  return [
    "Hello,",
    `Order ID: ${orderId}`,
    "The order was created on the website. Please confirm availability and delivery:",
    "",
    ...lines,
    "",
    `Total: ${formatPriceEGP(total, locale)}`,
    "",
    "Customer details:",
    `Name: ${customer.name}`,
    `Phone: ${customer.phone}`,
    `Governorate/City: ${customer.city}`,
    `Detailed address: ${customer.address}`,
    `Notes: ${customer.notes?.trim() ? customer.notes : "None"}`,
  ].join("\n");
};

export const buildPlacedOrderLink = (
  orderId: string,
  items: CheckoutOrderSummaryItem[],
  total: number,
  customer: CheckoutCustomerInfo,
  locale: Locale = "ar",
): string => buildWhatsAppLink(buildPlacedOrderMessage(orderId, items, total, customer, locale));
