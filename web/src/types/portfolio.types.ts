export interface WorkExperience {
  id: string;
  user_id: string;
  company: string | null;
  title: string | null;
  start_date: string | null;
  end_date: string | null;
  current_role: boolean;
  description: string | null;
  display_order: number;
}

export interface Skill {
  id: string;
  user_id: string;
  name: string;
  category: string;
  display_order: number;
}

export interface ProjectMedia {
  id: string;
  project_id: string;
  type: 'image' | 'video';
  url: string;
  caption: string | null;
  display_order: number;
}

export interface Project {
  id: string;
  user_id: string;
  title: string | null;
  description: string | null;
  url: string | null;
  repo_url: string | null;
  display_order: number;
  media: ProjectMedia[];
}

export interface PublicProfile {
  displayName: string | null;
  avatarUrl: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  linkedinUrl: string | null;
  twitter: string | null;
  workExperience: WorkExperience[];
  skills: Skill[];
  projects: Project[];
}
