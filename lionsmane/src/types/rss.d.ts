export interface Enclosure {
  id: number;
  entry_id: number;
  url: string;
  size: number | null;
  mime_type: string | null;
  media_progression: number;
}
