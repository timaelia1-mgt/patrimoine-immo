import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie.split('; ').map(cookie => {
            const [name, ...value] = cookie.split('=')
            return { name, value: value.join('=') }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            let cookie = `${name}=${value}`
            if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
            if (options?.path) cookie += `; path=${options.path}`
            if (options?.domain) cookie += `; domain=${options.domain}`
            if (options?.sameSite) cookie += `; SameSite=${options.sameSite}`
            if (options?.secure) cookie += '; Secure'
            document.cookie = cookie
          })
        },
      },
    }
  )
}
