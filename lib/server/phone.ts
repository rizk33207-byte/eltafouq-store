const EGYPT_CANONICAL_PHONE_PATTERN = /^201[0125]\d{8}$/;

export const normalizeEgyptPhone = (input: string): string => {
  let value = input.trim().replace(/[\s-]/g, "");

  if (value.startsWith("+20")) {
    value = value.slice(1);
  }

  if (value.startsWith("0020")) {
    value = `20${value.slice(4)}`;
  }

  if (value.startsWith("01")) {
    value = `20${value}`;
  }

  return value;
};

export const isCanonicalEgyptPhone = (value: string): boolean =>
  EGYPT_CANONICAL_PHONE_PATTERN.test(value);

export const maskPhone = (phone: string): string => {
  const value = phone.trim();

  if (value.length <= 3) {
    return "*".repeat(value.length);
  }

  return `${"*".repeat(value.length - 3)}${value.slice(-3)}`;
};
