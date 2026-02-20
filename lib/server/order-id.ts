const getDateStamp = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
};

const randomCode = (length = 4): string => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let output = "";

  for (let index = 0; index < length; index += 1) {
    output += characters[Math.floor(Math.random() * characters.length)];
  }

  return output;
};

export const generateOrderId = (): string =>
  `ORD-${getDateStamp(new Date())}-${randomCode(4)}`;
