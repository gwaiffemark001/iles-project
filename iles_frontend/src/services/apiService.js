import api from '../api/api';

export const apiService = {
  // Profile endpoints
  profile: {
    get: async () => {
      try {
        const response = await api.get('/profile/');
        return response.data;
      } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
    },
    
    update: async (formData) => {
      try {
        const response = await api.put('/profile/', formData);
        return response.data;
      } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
    }
  },

  // Authentication endpoints
  auth: {
    login: async (credentials) => {
      try {
        const response = await api.post('/auth/login/', credentials);
        return response.data;
      } catch (error) {
        console.error('Error logging in:', error);
        throw error;
      }
    },
    
    logout: async () => {
      try {
        await api.post('/auth/logout/');
        return { success: true };
      } catch (error) {
        console.error('Error logging out:', error);
        throw error;
      }
    },
    
    refreshToken: async () => {
      try {
        const response = await api.post('/auth/refresh/');
        return response.data;
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw new Error(`Failed to refresh token: ${error.message || 'Unknown error'}`);
      }
    }
  },

  // Student endpoints
  students: {
    getLogs: async (studentId) => {
      try {
        const response = await api.get(`/students/${studentId}/logs/`);
        return response.data;
      } catch (error) {
        console.error('Error fetching student logs:', error);
        throw error;
      }
    },
    
    createLog: async (studentId, logData) => {
      try {
        const response = await api.post(`/students/${studentId}/logs/`, logData);
        return response.data;
      } catch (error) {
        console.error('Error creating student log:', error);
        throw error;
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
        console.error('Error fetching students:', error);
        throw error;
      }
    },
    
    createEvaluation: async (evaluationData) => {
      try {
        const response = await api.post('/evaluations/', evaluationData);
        return response.data;
      } catch (error) {
        console.error('Error creating evaluation:', error);
        throw error;
      }
    }
  }
};

export default apiService;
