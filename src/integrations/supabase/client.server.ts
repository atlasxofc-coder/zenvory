
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

type Environment = Record<string, string | undefined>;

function getEnvironment(): Environment {
  const runtime = globalThis as typeof globalThis & {
    process?: {
      env?: Environment;
    };
  };

  return runtime.process?.env ?? {};
}

function isNewSupabaseApiKey(value: string): boolean {
  return (
    value.startsWith("sb_publishable_") ||
    value.startsWith("sb_secret_")
  );
}

function createSupabaseFetch(supabaseKey: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request
        ? input.headers
        : undefined
    );

    if (init?.headers) {
      new Headers(init.headers).forEach((value, key) => {
        headers.set(key, value);
      });
    }

    if (
      isNewSupabaseApiKey(supabaseKey) &&
      headers.get("Authorization") === `Bearer ${supabaseKey}`
    ) {
      headers.delete("Authorization");
    }

    headers.set("apikey", supabaseKey);

    return fetch(input, {
      ...init,
      headers,
    });
  };
}

function createSupabaseAdminClient() {
  const env = getEnvironment();

  const supabaseUrl = env["SUPABASE_URL"] ?? "";
  const serviceRoleKey = env["SUPABASE_SERVICE_ROLE_KEY"] ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    const missing: string[] = [];

    if (!supabaseUrl) {
      missing.push("SUPABASE_URL");
    }

    if (!serviceRoleKey) {
      missing.push("SUPABASE_SERVICE_ROLE_KEY");
    }

    throw new Error(
      `Missing Supabase environment variable(s): ${missing.join(", ")}`
    );
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    global: {
      fetch: createSupabaseFetch(serviceRoleKey),
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

let supabaseAdminInstance:
  | ReturnType<typeof createSupabaseAdminClient>
  | undefined;

export const supabaseAdmin = new Proxy(
  {} as ReturnType<typeof createSupabaseAdminClient>,
  {
    get(_target, property) {
      if (!supabaseAdminInstance) {
        supabaseAdminInstance = createSupabaseAdminClient();
      }

      return Reflect.get(supabaseAdminInstance, property);
    },
  }
);
