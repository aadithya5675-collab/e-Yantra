// ARC Mission Control domain types — mirror the Laravel /api/v1 resources.

export type UserRole = 'admin' | 'mentor' | 'member';
export type ProfileStatus = 'pending_approval' | 'approved' | 'rejected' | 'suspended';
export type TeamStatus = 'forming' | 'pending_lock' | 'locked' | 'archived';
export type MembershipRole = 'leader' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'expired';

export interface ArcProfile {
  id: number;
  full_name: string;
  email: string;
  roll_number: string;
  year: string | null;
  branch: string | null;
  role: UserRole;
  status: ProfileStatus;
  must_change_password: boolean;
}

export interface ThemeMetric {
  id: number;
  key: string;
  label: string;
  unit: string | null;
  target_value: string | null;
  requires_evidence: boolean;
  display_order: number;
}

export interface Theme {
  id: number;
  slug: string;
  name: string;
  tagline: string | null;
  summary: string | null;
  accent_color: string | null;
  official_url: string | null;
  display_order: number;
  metrics?: ThemeMetric[];
}

export interface DirectoryProfile {
  id: number;
  full_name: string;
  roll_number: string;
  year: string | null;
  branch: string | null;
}

export interface TeamMembership {
  id: number;
  role: MembershipRole;
  joined_at: string | null;
  profile?: DirectoryProfile;
}

export interface Team {
  id: number;
  name: string;
  arc_code: string;
  official_eyantra_id: string | null;
  official_id_verified: boolean;
  description: string | null;
  status: TeamStatus;
  is_locked: boolean;
  locked_at: string | null;
  theme?: Theme;
  leader?: DirectoryProfile;
  members?: TeamMembership[];
  official_score?: number;
  arc_points?: number;
  created_at: string | null;
}

export interface Invitation {
  id: number;
  status: InvitationStatus;
  message: string | null;
  expires_at: string | null;
  responded_at: string | null;
  team?: Team;
  invitee?: DirectoryProfile;
  created_at: string | null;
}
