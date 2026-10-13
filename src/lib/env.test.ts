import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("aceita ambiente sem variáveis do Supabase", () => {
    expect(parseEnv({})).toEqual({});
  });

  it("trata variável vazia como ausente", () => {
    expect(
      parseEnv({ NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "" }),
    ).toEqual({});
  });

  it("aceita URL e chave presentes", () => {
    const env = parseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "chave-ficticia",
    });
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("http://127.0.0.1:54321");
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe("chave-ficticia");
  });

  it("recusa URL inválida", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_SUPABASE_URL: "não é uma url" })).toThrow();
  });
});
