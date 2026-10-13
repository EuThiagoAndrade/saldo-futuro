import { describe, expect, it } from "vitest";
import { backendConfig, parseEnv, passwordLoginEnabled } from "./env";

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

describe("backendConfig", () => {
  it("é nulo sem URL e chave: preview sem backend", () => {
    expect(backendConfig(parseEnv({}))).toBeNull();
  });

  it("é nulo com só um dos dois valores", () => {
    expect(backendConfig(parseEnv({ NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321" }))).toBeNull();
    expect(backendConfig(parseEnv({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "chave-ficticia" }))).toBeNull();
  });

  it("devolve URL e chave quando ambos existem", () => {
    const env = parseEnv({
      NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "chave-ficticia",
    });
    expect(backendConfig(env)).toEqual({ url: "http://127.0.0.1:54321", publishableKey: "chave-ficticia" });
  });
});

describe("passwordLoginEnabled", () => {
  it("é falso por padrão e com qualquer valor diferente de true", () => {
    expect(passwordLoginEnabled(parseEnv({}))).toBe(false);
    expect(passwordLoginEnabled(parseEnv({ NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN: "false" }))).toBe(false);
    expect(passwordLoginEnabled(parseEnv({ NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN: "" }))).toBe(false);
  });

  it("é verdadeiro só com true", () => {
    expect(passwordLoginEnabled(parseEnv({ NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN: "true" }))).toBe(true);
  });

  it("recusa valor desconhecido", () => {
    expect(() => parseEnv({ NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN: "sim" })).toThrow();
  });
});
