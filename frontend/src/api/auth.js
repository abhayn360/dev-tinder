// API functions: one per backend endpoint. Components never call axios directly.
import { api } from '../lib/api';

export async function signup(data) {
  const res = await api.post('/auth/signup', data);
  return res.data.data.user;
}

export async function login(credentials) {
  const res = await api.post('/auth/login', credentials);
  return res.data.data.user;
}

export async function logout() {
  await api.post('/auth/logout');
}
