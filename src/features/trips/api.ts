// trips 테이블 Supabase 조회/생성/수정/삭제 함수
import { supabase } from '../../lib/supabase'
import type { Trip, CreateTripInput, UpdateTripInput } from './types'

export async function fetchTrips(): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('id, couple_id, title, destination, start_date, end_date, cover_image_url, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data;
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert(input)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateTrip({ id, ...input }: UpdateTripInput): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .update(input)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteTrip(id: string): Promise<void> {
  const { error } = await supabase.from('trips').delete().eq('id', id)
  if (error) throw error
}
