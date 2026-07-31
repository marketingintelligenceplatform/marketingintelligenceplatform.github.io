import { ValidationError } from "./errors";

export function requiredText(value: unknown, field: string, maxLength = 255): string {
  if (typeof value !== "string") throw new ValidationError(`${field} is required.`);
  const normalized = value.trim();
  if (!normalized) throw new ValidationError(`${field} is required.`);
  if (normalized.length > maxLength) throw new ValidationError(`${field} must be ${maxLength} characters or fewer.`);
  return normalized;
}

export function optionalText(value: unknown, field: string, maxLength = 255): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requiredText(value, field, maxLength);
}

export function email(value: unknown): string {
  const normalized = requiredText(value, "Email", 255).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) throw new ValidationError("Enter a valid email address.");
  return normalized;
}

export function password(value: unknown): string {
  if (typeof value !== "string" || value.length < 12) {
    throw new ValidationError("Password must be at least 12 characters.");
  }
  if (value.length > 256) throw new ValidationError("Password must be 256 characters or fewer.");
  return value;
}

export function optionalBoolean(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

export function workspaceSlug(name: string): string {
  const slug = name.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  if (slug.length < 2) throw new ValidationError("Workspace name must contain at least two letters or numbers.");
  return slug;
}
