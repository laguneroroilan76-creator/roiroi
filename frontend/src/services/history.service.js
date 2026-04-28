import api from './api';

export const historyService = {
  getTripTickets: async () => {
    const response = await api.get('/trip-tickets');
    return response.data;
  },

  getPRFs: async () => {
    const response = await api.get('/prfs');
    return response.data;
  },

  getActivityLogs: async () => {
    const response = await api.get('/activity/logs');
    return response.data;
  },

  updateTicketStatus: async (id, status) => {
    const response = await api.put(`/trip-tickets/${id}`, { status });
    return response.data;
  },

  updatePRFStatus: async (id, status) => {
    const response = await api.put(`/prfs/${id}`, { status });
    return response.data;
  },

  getRRFs: async () => {
    const response = await api.get('/rrfs');
    return response.data;
  },

  updateRRFStatus: async (id, status) => {
    const response = await api.put(`/rrfs/${id}`, { status });
    return response.data;
  }
};
