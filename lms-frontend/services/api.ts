

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Helper to get token
const getToken = () => localStorage.getItem('access_token');

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

async function request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  // If sending FormData, let browser set Content-Type
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
       localStorage.removeItem('access_token');
    }
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.detail || 'API request failed');
  }

  return response.json();
}

export const api = {
  auth: {
    login: async (formData: URLSearchParams) => {
        // Login expects x-www-form-urlencoded
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });
        if (!response.ok) throw new Error('Login failed');
        return response.json();
    },
    register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<import('../types').User>('/auth/me'),
  },
  users: {
    update: (id: number, data: import('../types').UserUpdate) => 
      request<import('../types').User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  courses: {
    list: (params?: string) => request<import('../types').Course[]>(`/courses/${params ? `?${params}` : ''}`),
    myCourses: () => request<import('../types').Course[]>('/courses/my-courses'),
    get: (id: number) => request<import('../types').Course>(`/courses/${id}`),
    create: (data: import('../types').CourseCreate) => 
      request<import('../types').Course>('/courses/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<import('../types').CourseCreate>) => 
      request<import('../types').Course>(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/courses/${id}`, { method: 'DELETE' }),
    uploadThumbnail: (id: number, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return request(`/courses/${id}/upload-thumbnail`, { method: 'POST', body: formData });
    }
  },
  lessons: {
    getByCourse: (courseId: number) => request<import('../types').Lesson[]>(`/lessons/course/${courseId}`),
    create: (data: import('../types').LessonCreate) => 
      request<import('../types').Lesson>('/lessons/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<import('../types').LessonCreate>) => 
      request<import('../types').Lesson>(`/lessons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/lessons/${id}`, { method: 'DELETE' }),
  },
  tests: {
    getByLesson: (lessonId: number) => request<import('../types').Test>(`/tests/lesson/${lessonId}`),
    create: (data: import('../types').TestCreate) => 
      request<import('../types').Test>('/tests/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: import('../types').TestCreate) => 
      request<import('../types').Test>(`/tests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    submit: (testId: number, answers: Record<number, number | number[]>) => 
      request<import('../types').TestResult>(`/tests/${testId}/submit`, { method: 'POST', body: JSON.stringify({ answers }) }),
  },
  scorm: {
    import: (courseId: number, file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return request(`/scorm/import/${courseId}`, { method: 'POST', body: formData });
    }
  }
};
