import { EMAIL_PATTERN } from "@/constants/patterns";

export type LoginFields = {
  email: string;
  password: string;
};

export type RegisterFields = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  agree: boolean;
};

type Translate = (key: string) => string;

export function validateLogin(fields: LoginFields, t: Translate): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!EMAIL_PATTERN.test(fields.email)) errors.email = t("auth.errors.invalidEmail");

  if (fields.password.length < 6) errors.password = t("auth.errors.passwordMin");

  return errors;
}

export function validateRegister(fields: RegisterFields, t: Translate): Record<string, string> {
  const errors: Record<string, string> = {};

  const username = fields.username.trim();

  if (username.length < 2 || username.length > 30) {
    errors.username = t("auth.errors.usernameLength");
  }

  if (!EMAIL_PATTERN.test(fields.email)) errors.email = t("auth.errors.invalidEmail");

  if (fields.password.length < 6) errors.password = t("auth.errors.passwordMin");

  if (fields.password !== fields.confirmPassword)
    errors.confirm = t("auth.errors.passwordMismatch");

  if (!fields.agree) errors.agree = t("auth.errors.agreeRequired");

  return errors;
}
