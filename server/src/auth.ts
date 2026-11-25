import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './db';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'omoo-dev-secret-key-at-least-32-characters-long-2026',
  // Dynamic baseURL resolves from incoming request host/proxy headers (Vercel, custom domain, or localhost)
  baseURL: {
    allowedHosts: [
      'omoo.web.id',
      'www.omoo.web.id',
      '*.vercel.app',
      'localhost:*',
      '127.0.0.1:*',
    ],
    fallback: process.env.PUBLIC_SITE_URL || 'https://omoo.web.id',
  },
  trustedOrigins: (request) => {
    const origins = [
      'http://localhost:4321',
      'http://127.0.0.1:4321',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://omoo.web.id',
      'https://www.omoo.web.id',
      'https://*.vercel.app',
      process.env.PUBLIC_SITE_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
      process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : undefined,
    ].filter(Boolean) as string[];

    if (request) {
      const origin = request.headers.get('origin');
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          if (
            originHost === host ||
            originHost === 'omoo.web.id' ||
            originHost.endsWith('.omoo.web.id') ||
            originHost.endsWith('.vercel.app')
          ) {
            origins.push(origin);
          }
        } catch {}
      }
    }

    return origins;
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // auto-extend session every 24h on activity
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'CUSTOMER',
      },
      phone: {
        type: 'string',
        required: false,
      },
      memberStatus: {
        type: 'string',
        required: false,
        defaultValue: 'NONE',
      },
      memberTier: {
        type: 'string',
        required: false,
      },
    },
  },
  advanced: {
    trustedProxyHeaders: true,
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});
