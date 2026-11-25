import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { staticPlugin } from '@elysiajs/static';
import { swagger } from '@elysiajs/swagger';
import { perfumesRoute } from './routes/perfumes';
import { pagesRoute } from './routes/pages';
import { ordersRoute } from './routes/orders';
import { membersRoute } from './routes/members';
import { certificatesRoute } from './routes/certificates';
import { uploadRoute } from './routes/upload';
import { authRoute } from './routes/auth';
import { usersRoute } from './routes/users';
import { settingsRoute } from './routes/settings';
import { galleryRoute } from './routes/gallery';
import { join } from 'path';
import { mkdir } from 'fs/promises';

const uploadsDir = join(process.cwd(), 'uploads');
try {
  await mkdir(uploadsDir, { recursive: true });
} catch {}

export const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: 'OMOO Haute Parfumerie API',
          version: '1.0.0',
          description: 'Elysia JS Backend API for OMOO dynamic storefront, admin CMS, QRIS orders, and legality verification.',
        },
      },
    })
  )
  .use(
    staticPlugin({
      assets: uploadsDir,
      prefix: '/uploads',
    })
  )
  .group('/api', (app) =>
    app
      .use(authRoute)
      .use(perfumesRoute)
      .use(pagesRoute)
      .use(ordersRoute)
      .use(membersRoute)
      .use(certificatesRoute)
      .use(uploadRoute)
      .use(usersRoute)
      .use(settingsRoute)
      .use(galleryRoute)
  )
  .get('/health', () => ({
    status: 'ok',
    app: 'OMOO Studio API',
    runtime: 'Bun + Elysia',
    timestamp: new Date().toISOString(),
  }));
