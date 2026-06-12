import api from './api';

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getOutstandingByCustomer: () => api.get('/dashboard/outstanding-by-customer'),
  getOverdueTrend: () => api.get('/dashboard/overdue-trend'),
  getCollectionStatus: () => api.get('/dashboard/collection-status'),
  getRecentActivities: () => api.get('/dashboard/recent-activities'),
  getNotifications: () => api.get('/dashboard/notifications'),
};

export const billService = {
  getBills: (params) => api.get('/bills', { params }),
  getBill: (id) => api.get(`/bills/${id}`),
  createBill: (data) => api.post('/bills', data),
  updateBill: (id, data) => api.patch(`/bills/${id}`, data),
  recordPayment: (id, data) => api.patch(`/bills/${id}/payment`, data),
  exportCSV: (params) => api.get('/bills/export/csv', { params, responseType: 'blob' }),
  bulkDeleteBills: (ids) => api.post('/bills/bulk-delete', { ids }),
};

export const partyService = {
  getParties: (params) => api.get('/parties', { params }),
  addParty: (data) => api.post('/parties', data),
  updateParty: (id, data) => api.put(`/parties/${id}`, data),
  deleteParty: (id) => api.delete(`/parties/${id}`),
  getMissingPhone: () => api.get('/parties/missing-phone'),
  getCities: () => api.get('/parties/cities'),
  bulkDeleteParties: (ids) => api.post('/parties/bulk-delete', { ids }),
};

export const uploadService = {
  uploadPdfExtract: (formData) => api.post('/upload/extract', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  uploadPdfConfirm: (data) => api.post('/upload/confirm', data),
  uploadManual: (data) => api.post('/upload/manual', data),
};

export const uploadHistoryService = {
  getHistories: (params) => api.get('/upload-history', { params }),
  getHistory: (id) => api.get(`/upload-history/${id}`),
};

export const reminderService = {
  getDueBills: () => api.get('/reminders/due'),
  previewReminder: (billId) => api.get(`/reminders/preview/${billId}`),
  sendReminder: (data) => api.post('/reminders/send', data),
  sendBulkReminders: (data) => api.post('/reminders/send-bulk', data),
  getHistory: (params) => api.get('/reminders/history', { params }),
};

export const reportService = {
  getReport: (type, params) => api.get(`/reports/${type}`, { params }),
  exportReport: (type, params) => api.get(`/reports/export/${type}`, { params, responseType: 'blob' }),
};

export const settingsService = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
};

export const searchService = {
  globalSearch: (q) => api.get('/search', { params: { q } }),
};
