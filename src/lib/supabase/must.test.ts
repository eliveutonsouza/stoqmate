import { describe, it, expect } from "vitest";
import type { PostgrestError } from "@supabase/supabase-js";
import { must } from "./must";

describe("must", () => {
  it("devolve data quando não há erro", () => {
    expect(must({ data: [1, 2], error: null }, "x")).toEqual([1, 2]);
    expect(must({ data: null, error: null }, "x")).toBeNull();
  });

  it("lança com contexto quando a query falha", () => {
    const error = { message: "permission denied for table products" } as PostgrestError;
    expect(() => must({ data: null, error }, "products.list")).toThrow("[products.list] permission denied for table products");
  });
});
