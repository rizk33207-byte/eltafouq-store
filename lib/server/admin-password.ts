import bcrypt from "bcryptjs";

const BCRYPT_ROUNDS = 10;

export const hashAdminPassword = async (password: string): Promise<string> =>
  bcrypt.hash(password, BCRYPT_ROUNDS);

export const verifyAdminPassword = async (
  password: string,
  passwordHash: string,
): Promise<boolean> => bcrypt.compare(password, passwordHash);
