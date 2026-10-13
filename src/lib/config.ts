import { backendConfig, parseEnv, passwordLoginEnabled } from "./env";

// Referências literais: o Next.js só substitui NEXT_PUBLIC_* escritas assim, também no navegador.
const env = parseEnv({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN: process.env.NEXT_PUBLIC_ENABLE_PASSWORD_LOGIN,
});

export const backend = backendConfig(env);
export const passwordLogin = passwordLoginEnabled(env);
