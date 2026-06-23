// profiles 테이블 Supabase 조회 함수
import { supabase } from '../../lib/supabase'
import type { Profile } from './types'

export async function fetchMyProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, couple_id, display_name, avatar_url, created_at')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}
