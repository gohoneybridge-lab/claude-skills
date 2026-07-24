// web.owasp_asvs / core.security_basics — server-side Supabase client.
//
// Auth and data access are enforced on the SERVER, never trusting the client.
// Use this in Server Components, Route Handlers, and Server Actions. Do NOT
// expose the service-role key to the browser — only the anon key is public,
// and Row Level Security is the real access-control boundary.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function getServerSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component render — safe to ignore; the
            // middleware refresh path handles cookie writes.
          }
        },
      },
    },
  );
}

/** Authz gate: resolve the current user server-side, or null. Never trust a
 * client-supplied user id — always derive identity here. */
export async function getCurrentUser() {
  const supabase = await getServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
