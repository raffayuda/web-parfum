import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './db';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  secret: process.env.BETTER_AUTH_SECRET || 'omoo-dev-secret-key-at-least-32-characters-long-2026',
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  trustedOrigins: [
    'http://localhost:4321',
    'http://127.0.0.1:4321',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
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
    useSecureCookies: process.env.NODE_ENV === 'production',
  },
});
