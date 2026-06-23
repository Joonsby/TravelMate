// trip_checklist_items 테이블 Supabase 조회/생성/수정/삭제 함수
import { supabase } from '../../lib/supabase'
import type {
  TripChecklistItem,
  CreateChecklistItemInput,
  UpdateChecklistItemInput,
  DeleteChecklistItemInput,
} from './types'

export async function fetchChecklistItems(tripId: string): Promise<TripChecklistItem[]> {
  const { data, error } = await supabase
    .from('trip_checklist_items')
    .select('id, trip_id, content, is_completed, created_at, updated_at')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function createChecklistItem(input: CreateChecklistItemInput): Promise<TripChecklistItem> {
  const { data, error } = await supabase
    .from('trip_checklist_items')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateChecklistItem({
  id,
  trip_id: _tripId,
  ...fields
}: UpdateChecklistItemInput): Promise<TripChecklistItem> {
  const { data, error } = await supabase
    .from('trip_checklist_items')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteChecklistItem({ id }: DeleteChecklistItemInput): Promise<void> {
  const { error } = await supabase
    .from('trip_checklist_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}
