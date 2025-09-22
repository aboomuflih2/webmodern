export interface BoardMember {
  id: string;
  name: string;
  designation: string;
  board_type: 'governing_board' | 'board_of_directors';
  photo_url?: string;
  bio?: string;
  address?: string;
  email?: string;
  mobile?: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  social_links?: SocialLink[];
}

export interface SocialLink {
  id: string;
  member_id: string;
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram';
  url: string;
  display_order: number;
  created_at: string;
}

export interface CreateBoardMemberRequest {
  name: string;
  designation: string;
  board_type: 'governing_board' | 'board_of_directors';
  photo?: File;
  photo_url?: string;
  bio?: string;
  address?: string;
  email?: string;
  mobile?: string;
  social_links?: CreateSocialLinkRequest[];
}

export interface UpdateBoardMemberRequest extends Partial<CreateBoardMemberRequest> {
  id: string;
  photo_url?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface CreateSocialLinkRequest {
  platform: 'linkedin' | 'twitter' | 'facebook' | 'instagram';
  url: string;
  display_order?: number;
}

export interface UpdateSocialLinkRequest extends Partial<CreateSocialLinkRequest> {
  id: string;
}

export interface BoardMembersResponse {
  data: BoardMember[];
  error?: string;
}

export interface BoardMemberResponse {
  data: BoardMember | null;
  error?: string;
}

export type BoardType = 'governing_board' | 'board_of_directors';
export type SocialPlatform = 'linkedin' | 'twitter' | 'facebook' | 'instagram';

export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  governing_board: 'Governing Board',
  board_of_directors: 'Board of Directors'
};

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  facebook: 'Facebook',
  instagram: 'Instagram'
};