// trip_checklist_items 테이블 타입 및 입출력 타입
export interface TripChecklistItem {
  id: string
  trip_id: string
  content: string
  is_completed: boolean
  created_at: string
  updated_at: string
}

export interface CreateChecklistItemInput {
  trip_id: string
  content: string
}

export interface UpdateChecklistItemInput {
  id: string
  trip_id: string
  content?: string
  is_completed?: boolean
}

export interface DeleteChecklistItemInput {
  id: string
  trip_id: string
}
