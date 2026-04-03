export type UserRole = 'user' | 'journalist' | 'admin';
export type UserStatus = 'active' | 'suspended';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  status?: UserStatus;
  created_at?: string;
}

export interface POI {
  id: number;
  name: string;
  description: string | null;
  location: string | null;
  status: 'ongoing' | 'completed';
  profile_image: string | null;
  is_deleted: boolean;
  created_at: string;
}

export interface Claim {
  id: number;
  poi_id: number;
  description: string;
  status: 'fulfilled' | 'partial' | 'unfulfilled' | 'ongoing';
  confidence: number;
  ai_insight?: string;
  date_reported?: string;
  created_at: string;
  poi?: POI;
  sources?: Source[];
  media?: Media[];
}

export interface Source {
  id: number;
  claim_id: number;
  type: 'manifesto' | 'interview' | 'osint' | 'media' | 'manual';
  title: string;
  content: string | null;
  link: string | null;
  date: string | null;
  credibility_score: number;
  tags: string[];
}

export interface Media {
  id: number;
  claim_id: number | null;
  file_url: string;
  type: 'image' | 'pdf' | 'video' | 'audio';
  transcription_text?: string;
  transcription_status?: string;
}
