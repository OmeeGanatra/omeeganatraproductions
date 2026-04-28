import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

type Source = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: Source = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const input = req[source];
    const result = schema.safeParse(input);

    if (!result.success) {
      const errors = result.error.flatten();
      res.status(400).json({
        error: "Validation failed",
        fieldErrors: errors.fieldErrors,
        formErrors: errors.formErrors,
      });
      return;
    }

    // Replace the parsed source with the coerced/normalized value so
    // controllers see clean, typed input.
    if (source === "body") {
      req.body = result.data;
    } else if (source === "query") {
      // Express's req.query is typed loosely; cast through unknown to assign.
      (req as unknown as { query: unknown }).query = result.data;
    } else {
      (req as unknown as { params: unknown }).params = result.data;
    }
    next();
  };
}
