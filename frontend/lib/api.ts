/**
 * API Service for PDF to Podcast Backend
 * Centralized API calls to backend at http://localhost:8000
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// ========== Types ==========

export interface Project {
  project_id: string;
  name: string;
  description: string;
  created_at: string;
  pdf_filename?: string;
  podcast_count: number;
}

export interface ProjectDetail extends Project {
  pdf_path?: string;
  pdf_text?: string;
  chunks: Array<{ text: string; page: number }>;
  faiss_index_path?: string;
  podcasts: Podcast[];
}

export interface Podcast {
  podcast_id: string;
  created_at: string;
  topic?: string;
  duration: string;
  script: string;
  audio_path: string;
  audio_filename: string;
  segments_count: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  references?: Array<{
    page: number;
    text_preview: string;
    relevance: number;
  }>;
}

// ========== API Functions ==========

/**
 * Check backend status
 */
export async function checkStatus() {
  const response = await fetch(`${API_BASE_URL}/status`);
  if (!response.ok) throw new Error('Backend is not responding');
  return response.json();
}

/**
 * Create a new project
 */
export async function createProject(name: string, description: string = ''): Promise<{ status: string; project_id: string; name: string }> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to create project');
  }
  
  return response.json();
}

/**
 * Get all projects
 */
export async function getProjects(): Promise<Project[]> {
  const response = await fetch(`${API_BASE_URL}/projects`);
  
  if (!response.ok) {
    throw new Error('Failed to fetch projects');
  }
  
  const data = await response.json();
  return data.projects;
}

/**
 * Get project details by ID
 */
export async function getProject(projectId: string): Promise<ProjectDetail> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch project');
  }
  
  return response.json();
}

/**
 * Delete a project
 */
export async function deleteProject(projectId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to delete project');
  }
}

/**
 * Upload PDF to a project
 */
export async function uploadPDF(projectId: string, file: File): Promise<{
  status: string;
  filename: string;
  total_chunks: number;
  total_pages: number;
  word_count: number;
}> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/upload_pdf`, {
    method: 'POST',
    body: formData,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to upload PDF');
  }
  
  return response.json();
}

/**
 * Chat with PDF
 */
export async function chatWithPDF(
  projectId: string,
  query: string,
  topK: number = 3
): Promise<{
  answer: string;
  references: Array<{
    page: number;
    text_preview: string;
    relevance: number;
  }>;
}> {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      query,
      top_k: topK,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to get response');
  }
  
  return response.json();
}

/**
 * Generate podcast from PDF
 */
export async function generatePodcast(
  projectId: string,
  topic?: string,
  duration: 'short' | 'medium' | 'long' = 'medium'
): Promise<{
  status: string;
  podcast_id: string;
  podcast_url: string;
  script: string;
  segments_count: number;
}> {
  const response = await fetch(`${API_BASE_URL}/generate_podcast`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      topic,
      duration,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to generate podcast');
  }
  
  return response.json();
}

/**
 * Get all podcasts for a project
 */
export async function getProjectPodcasts(projectId: string): Promise<Podcast[]> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}/podcasts`);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch podcasts');
  }
  
  const data = await response.json();
  return data.podcasts;
}

/**
 * Get audio URL for a podcast
 */
export function getAudioUrl(filename: string): string {
  return `${API_BASE_URL}/audio/${filename}`;
}

/**
 * Get PDF URL for viewing
 */
export function getPDFUrl(filename: string): string {
  return `${API_BASE_URL}/pdf/${filename}`;
}
