// src/middleware.ts — protect all routes except /login
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/login' },
})

export const config = {
  matcher: ['/((?!login|api/auth|_next|favicon).*)'],
}
