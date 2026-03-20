import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 60000,
});

export async function fetchDatabases() {
  const { data } = await api.get('/databases');
  return data;
}

export async function fetchBranches(params) {
  const { data } = await api.get('/branches', { params });
  return data;
}

export async function fetchCenterCost(params) {
  const { data } = await api.get('/center-cost', { params });
  return data;
}

export async function sendToAutomate(rows) {
  const { data } = await api.post('/center-cost/automate', { rows });
  return data;
}

export async function fetchCenterCostQueue(params) {
  const { data } = await api.get('/center-cost/queue', { params });
  return data;
}

export async function completeCenterCostQueueItem(id) {
  const { data } = await api.put(`/center-cost/${id}/complete`);
  return data;
}

export async function updateCenterCostBpFields(id, payload) {
  const { data } = await api.put(`/center-cost/${id}/bp-fields`, payload);
  return data;
}

export async function submitCenterCostBpRow(id, payload) {
  const { data } = await api.put(`/center-cost/${id}/bp-submit`, payload);
  return data;
}

export async function fetchSettlementCandidates(params) {
  const { data } = await api.get('/center-cost/settlement-candidates', { params });
  return data;
}

export async function createSettlement(payload) {
  const { data } = await api.post('/center-cost/settlements', payload);
  return data;
}

/** Settlement headers (default: automate_status = กำลัง automate) */
export async function fetchProcessingSettlements(params = {}) {
  const { data } = await api.get('/center-cost/settlements', {
    params: { status: 'processing', ...params },
  });
  return data;
}

export async function fetchSettlementItems(settlementId) {
  const { data } = await api.get(`/center-cost/settlements/${settlementId}/items`);
  return data;
}

export default api;

