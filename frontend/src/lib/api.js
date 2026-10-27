import axios from 'axios';
import { queryClient } from './queryClient';
import { queryKeys } from './queryKeys';

// One configured axios instance for the whole app.
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true, // send the httpOnly auth cookie with every request
});

// Interceptor: runs on every response. If the session expired (401) anywhere
// in the app, mark the user as logged out. ProtectedRoute then redirects to /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = error.config?.url?.startsWith('/auth/');
    if (error.response?.status === 401 && !isAuthCall) {
      queryClient.setQueryData(queryKeys.me, null);
    }
    return Promise.reject(error);
  },
);
