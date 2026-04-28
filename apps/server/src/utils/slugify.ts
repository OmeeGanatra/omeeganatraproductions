import crypto from "crypto";

export function slugify(text: string): string {
  const base = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  const suffix = crypto.randomBytes(4).toString("hex");

  return `${base}-${suffix}`;
}
