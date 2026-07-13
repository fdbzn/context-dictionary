export interface Phrase {
  id: string;
  user_id: string;
  content: string;
  meaning: string;
  tag_to_learn: string;
  tag_to_learn_meaning: string | null;
  tags: PhraseTag[];
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PhraseTag {
  id: string;
  word: string;
  meaning: string | null;
  start: number;
  end: number;
}

export interface StudySession {
  id: string;
  user_id: string;
  phrase_id: string;
  is_correct: boolean;
  user_example: string | null;
  created_at: string;
}

export interface UserStats {
  total_phrases: number;
  total_study_sessions: number;
  correct_answers: number;
  incorrect_answers: number;
  studied_today: boolean;
  current_streak: number;
}

export interface StudyConfig {
  phrases_per_session: number;
}

export interface PixabayImage {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  previewWidth: number;
  previewHeight: number;
  webformatURL: string;
  webformatWidth: number;
  webformatHeight: number;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  collections: number;
  likes: number;
  comments: number;
  user_id: number;
  user: string;
  userImageURL: string;
}

export interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayImage[];
}
