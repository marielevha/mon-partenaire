import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (err) {
            // Cookies can only be modified in Server Actions or Route Handlers
            // This is expected in Server Components during reads
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch (err) {
            // Cookies can only be modified in Server Actions or Route Handlers
            // This is expected in Server Components during reads
          }
        },
      },
    }
  );
};
