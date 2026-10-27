import { api } from '../lib/api';

// status: 'interested' | 'ignored'
export async function sendRequest(status, toUserId) {
  const res = await api.post(`/requests/send/${status}/${toUserId}`);
  return res.data.data.request;
}

// status: 'accepted' | 'rejected'
export async function reviewRequest(status, requestId) {
  const res = await api.post(`/requests/review/${status}/${requestId}`);
  return res.data.data.request;
}
