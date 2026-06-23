// profiles 테이블 행 타입 (schema.sql 기준)
export interface Profile {
  id: string
  couple_id: string
  display_name: string
  avatar_url: string | null
  created_at: string
}
