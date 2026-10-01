import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";

/** Parse a JSON body against a Zod schema, returning a fieldful of errors on failure. */
export async function parseBody<T>(req: NextRequest, schema: ZodType<T>) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { ok: false as const, response: NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }) };
  }
  try {
    return { ok: true as const, data: schema.parse(raw) };
  } catch (err) {
    if (err instanceof ZodError) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of err.issues) {
        const key = issue.path.join(".") || "form";
        if (!fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      return { ok: false as const, response: NextResponse.json({ error: "Validation failed.", fieldErrors }, { status: 400 }) };
    }
    return { ok: false as const, response: NextResponse.json({ error: "Validation failed." }, { status: 400 }) };
  }
}

export function fail(message: string, status = 400, fieldErrors?: Record<string, string>) {
  return NextResponse.json({ error: message, fieldErrors }, { status });
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data as object, { status });
}
