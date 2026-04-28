export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

function toInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const n = parseInt(value, 10);
    if (!Number.isNaN(n) && Number.isFinite(n)) return n;
  }
  return fallback;
}

// Accepts express's `req.query` (typed loosely as Record<string, any>) or any
// object with `page`/`limit` keys. Bounds-clamps to [1, 10_000] for page and
// [1, 100] for limit so massive or negative values can't reach the database.
export function parsePagination(query: unknown): PaginationParams {
  const raw = (query ?? {}) as Record<string, unknown>;
  const page = Math.max(1, Math.min(10_000, toInt(raw.page, 1)));
  const limit = Math.max(1, Math.min(100, toInt(raw.limit, 20)));
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
