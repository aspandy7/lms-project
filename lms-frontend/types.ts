
export type UserRole = 'admin' | 'author' | 'student';

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserUpdate {
  email?: string;
  username?: string;
  full_name?: string;
  password?: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface Course {
  id: number;
  title: string;
  description?: string;
  short_description?: string;
  thumbnail_url?: string;
  is_published: boolean;
  is_free: boolean;
  price: number;
  author_id: number;
  author_name?: string;
  lesson_count: number;
  created_at: string;
  updated_at: string;
}

export interface CourseCreate {
  title: string;
  description?: string;
  short_description?: string;
  thumbnail_url?: string;
  is_published?: boolean;
  is_free?: boolean;
  price?: number;
}

export interface Lesson {
  id: number;
  title: string;
  content?: string;
  order: number;
  is_published: boolean;
  course_id: number;
  created_at: string;
  updated_at: string;
  scorm_data?: any;
  attachments: LessonAttachment[];
}

export interface LessonAttachment {
  id: number;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  is_video: boolean;
  lesson_id: number;
  created_at: string;
}

export interface LessonCreate {
  title: string;
  content?: string;
  order?: number;
  is_published?: boolean;
  course_id: number;
}

export interface TestOption {
  id?: number;
  text: string;
  is_correct: boolean;
}

export interface TestQuestion {
  id?: number;
  title: string;
  type: 'single' | 'multiple';
  order: number;
  options: TestOption[];
}

export interface Test {
  id: number;
  title: string;
  lesson_id: number;
  questions: TestQuestion[];
}

export interface TestCreate {
  title: string;
  lesson_id: number;
  questions: TestQuestion[];
}

export interface TestResult {
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
