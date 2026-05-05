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

  getRFPs: async () => {
    const response = await api.get('/rfps');
    return response.data;
  },

  updateRFPStatus: async (id, status) => {
    const response = await api.put(`/rfps/${id}`, { status });
    return response.data;
  }
};
