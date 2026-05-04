import type { User } from "../db/schema.js";

export interface MeDto {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  locale: string;
  timeZone: string;
  hasPassword: boolean;
  createdAt: string;
}

export function toMeDto(user: User): MeDto {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    locale: user.locale,
    timeZone: user.timeZone,
    hasPassword: Boolean(user.passwordHash),
    createdAt: user.createdAt,
  };
}
