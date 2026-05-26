import api from '../api/api';

export const apiService = {
  // Profile endpoints
  profile: {
    get: async () => {
      const response = await api.get('/profile/')
      return response.data
    },

    update: async (formData) => {
      const response = await api.put('/profile/', formData)
      return response.data
    }
  },

  // Authentication endpoints
  auth: {
    login: async (credentials) => {
      const response = await api.post('/auth/login/', credentials)
      return response.data
    },

    logout: async () => {
      await api.post('/auth/logout/')
      return { success: true }
    },
    
    refreshToken: async () => {
      try {
        const response = await api.post('/auth/refresh/')
        return response.data
      } catch (error) {
        throw new Error(`Failed to refresh token: ${error.message || 'Unknown error'}`)
      }
    }
  },

  // Student endpoints
  students: {
    getLogs: async (studentId) => {
      const response = await api.get(`/students/${studentId}/logs/`)
      return response.data
    },
    
    createLog: async (studentId, logData) => {
      try {
        const response = await api.post(`/students/${studentId}/logs/`, logData);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to create student log: ${error.message || 'Unknown error'}`);
      }
    }
  },

  // Supervisor endpoints
  supervisors: {
    getStudents: async (supervisorId) => {
      try {
        const response = await api.get(`/supervisors/${supervisorId}/students/`);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to fetch students: ${error.message || 'Unknown error'}`);
      }
    },
    
    createEvaluation: async (evaluationData) => {
      try {
        const response = await api.post('/evaluations/', evaluationData);
        return response.data;
      } catch (error) {
        throw new Error(`Failed to create evaluation: ${error.message || 'Unknown error'}`);
      }
    }
  }
};

export default apiService;
