import { createAuthClient } from 'better-auth/react';
import { getApiUrl } from './api';

export const authClient = createAuthClient({
  baseURL: getApiUrl(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
