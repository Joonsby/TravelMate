// itinerary_items 테이블 Supabase 조회/생성/수정/삭제 함수
import { supabase } from '../../lib/supabase'
import type { ItineraryItem, CreateItineraryItemInput, UpdateItineraryItemInput, DeleteItineraryItemInput } from './types'

export async function fetchItineraryItems(tripId: string): Promise<ItineraryItem[]> {
  const { data, error } = await supabase
    .from('itinerary_items')
    .select('id, trip_id, day_date, start_time, title, location, memo, sort_order, created_at')
    .eq('trip_id', tripId)
    .order('day_date', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}

export async function createItineraryItem(input: CreateItineraryItemInput): Promise<ItineraryItem> {
  const { data, error } = await supabase
    .from('itinerary_items')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateItineraryItem(input: UpdateItineraryItemInput): Promise<ItineraryItem> {
  const { id, trip_id: _tripId, ...fields } = input
  const { data, error } = await supabase
    .from('itinerary_items')
    .update(fields)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteItineraryItem({ id }: DeleteItineraryItemInput): Promise<void> {
  const { error } = await supabase
    .from('itinerary_items')
    .delete()
    .eq('id', id)

  if (error) throw error
}
