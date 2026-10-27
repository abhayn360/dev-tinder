import { api } from '../lib/api';

export async function getFeed({ page = 1, limit = 10 } = {}) {
  const res = await api.get('/user/feed', { params: { page, limit } });
  return res.data.data; // { users, pagination }
}

export async function getReceivedRequests() {
  const res = await api.get('/user/requests/received');
  return res.data.data.requests;
}

export async function getConnections() {
  const res = await api.get('/user/connections');
  return res.data.data.connections;
}
