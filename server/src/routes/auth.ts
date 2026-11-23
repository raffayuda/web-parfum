import { Elysia } from 'elysia';
import { auth } from '../auth';
import { prisma } from '../db';

export const authRoute = new Elysia({ prefix: '/auth' })
  // Current user helper (MUST be defined before /* wildcard handler)
  .get('/me', async ({ request, set }) => {
    try {
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        return { success: false, user: null, session: null };
      }

      // Enrich with latest database data
      const freshUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          memberStatus: true,
          memberTier: true,
          memberSince: true,
        },
      });

      return {
        success: true,
        user: freshUser,
        session: session.session,
      };
    } catch (e: any) {
      set.status = 500;
      return { success: false, message: e.message };
    }
  })
  // Forward all Better Auth standard requests (/api/auth/sign-in, sign-up, session, etc.)
  .all('/*', async ({ request }) => {
    return auth.handler(request);
  });
