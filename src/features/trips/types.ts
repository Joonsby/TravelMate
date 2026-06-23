// trips 테이블 행 타입 및 생성 입력 타입 (schema.sql 기준)
export interface Trip {
  id: string
  couple_id: string
  title: string
  destination: string | null
  start_date: string | null
  end_date: string | null
  cover_image_url?: string | null
  created_at: string
}

export interface CreateTripInput {
  couple_id: string
  title: string
  start_date: string
  end_date: string
}

export interface UpdateTripInput {
  id: string
  title: string
  start_date: string
  end_date: string
}
