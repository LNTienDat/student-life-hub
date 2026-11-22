import api from './api';

export const plannerService = {
  generateStudyPlan: (payload) => api.post('/planner/generate', payload, { timeout: 25000 }),
  applyPlanToDeadlines: (sessions) => api.post('/planner/apply-deadlines', { sessions }),
};

export default plannerService;
