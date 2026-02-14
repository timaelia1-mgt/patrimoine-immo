import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          const cookies = document.cookie.split(';')
          const cookie = cookies.find(c => c.trim().startsWith(name + '='))
          return cookie ? cookie.split('=')[1] : null
        },
        set(name, value, options) {
          let cookie = `${name}=${value}`
          if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
          if (options?.path) cookie += `; path=${options.path}`
          if (options?.domain) cookie += `; domain=${options.domain}`
          cookie += '; SameSite=Lax; Secure'
          document.cookie = cookie
        },
        remove(name, options) {
          document.cookie = `${name}=; path=${options?.path || '/'}; max-age=0`
        }
      }
    }
  )
}
