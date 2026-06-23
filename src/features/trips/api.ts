// trips 테이블 Supabase 조회/생성 함수
import { supabase } from '../../lib/supabase'
import type { Trip, CreateTripInput } from './types'

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
