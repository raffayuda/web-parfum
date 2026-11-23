import type { APIRoute } from 'astro';
import { app } from '../../../server/src/app';

export const prerender = false;

export const ALL: APIRoute = async ({ request }) => {
  return await app.handle(request);
};
