import { api } from '../lib/api';

export async function getProfile() {
  const res = await api.get('/profile');
  return res.data.data.user;
}

export async function updateProfile(updates) {
  const res = await api.patch('/profile', updates);
  return res.data.data.user;
}

export async function changePassword(passwords) {
  await api.patch('/profile/password', passwords);
}
