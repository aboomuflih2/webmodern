import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { BoardMember, BoardType, CreateBoardMemberRequest, UpdateBoardMemberRequest } from '../../shared/types/board-members';

export const useBoardMembers = (boardType?: BoardType) => {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('board_members')
        .select(`
          *,
          social_links (*)
        `)
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (boardType) {
        query = query.eq('board_type', boardType);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setMembers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch board members');
    } finally {
      setLoading(false);
    }
  }, [boardType]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    refetch: fetchMembers
  };
};

export const useBoardMemberAdmin = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMember = useCallback(async (memberData: CreateBoardMemberRequest): Promise<BoardMember | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: createError } = await supabase
        .from('board_members')
        .insert({
          name: memberData.name,
          designation: memberData.designation,
          board_type: memberData.board_type,
          bio: memberData.bio,
          address: memberData.address,
          email: memberData.email,
          mobile: memberData.mobile,
          photo_url: memberData.photo_url
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Add social links if provided
      if (memberData.social_links && memberData.social_links.length > 0) {
        const socialLinksData = memberData.social_links.map((link, index) => ({
          member_id: data.id,
          platform: link.platform,
          url: link.url,
          display_order: link.display_order || index
        }));

        await supabase
          .from('social_links')
          .insert(socialLinksData);
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create board member');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateMember = useCallback(async (memberData: UpdateBoardMemberRequest): Promise<BoardMember | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: updateError } = await supabase
        .from('board_members')
        .update({
          name: memberData.name,
          designation: memberData.designation,
          board_type: memberData.board_type,
          bio: memberData.bio,
          address: memberData.address,
          email: memberData.email,
          mobile: memberData.mobile,
          photo_url: memberData.photo_url,
          is_active: memberData.is_active,
          display_order: memberData.display_order
        })
        .eq('id', memberData.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update board member');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteMember = useCallback(async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('board_members')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete board member');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllMembers = useCallback(async (): Promise<BoardMember[]> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('board_members')
        .select(`
          *,
          social_links (*)
        `)
        .order('board_type', { ascending: true })
        .order('display_order', { ascending: true });

      if (fetchError) {
        throw fetchError;
      }

      return data || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch all board members');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createMember,
    updateMember,
    deleteMember,
    getAllMembers
  };
};