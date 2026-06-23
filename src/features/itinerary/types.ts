// itinerary_items 테이블 행 타입 및 생성 입력 타입 (schema.sql 기준)
export interface ItineraryItem {
  id: string
  trip_id: string
  day_date: string
  start_time: string | null
  title: string
  location: string | null
  memo: string | null
  sort_order: number
  created_at: string
}

export interface CreateItineraryItemInput {
  trip_id: string
  day_date: string
  start_time?: string
  title: string
  location?: string
  memo?: string
}

export interface UpdateItineraryItemInput {
  id: string
  trip_id: string  // cache invalidation용, DB update 제외
  title: string
  day_date: string
  start_time: string | null
  location: string | null
  memo: string | null
}

export interface DeleteItineraryItemInput {
  id: string
  trip_id: string  // cache invalidation용
}
