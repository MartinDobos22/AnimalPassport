export type ReviewStatus = 'pending' | 'approved' | 'rejected';

// Verejná recenzia zobrazená na landing page (len schválené).
export interface PublicReview {
  id: string;
  rating: number;
  body?: string;
  authorName?: string;
  petName?: string;
  locale: string;
  createdAt: string;
}

// Vlastná recenzia prihláseného používateľa (vrátane stavu moderácie).
export interface MyReview {
  id: string;
  rating: number;
  body?: string;
  authorName?: string;
  petName?: string;
  locale: string;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

// Recenzia v admin moderácii (všetky stavy + e-mail autora).
export interface AdminReview extends MyReview {
  authorEmail?: string;
  moderatedAt?: string;
  moderatedBy?: string;
}

export interface ReviewStats {
  count: number;
  average: number;
}

export interface ReviewInput {
  rating: number;
  body?: string;
  authorName?: string;
  petName?: string;
  locale?: string;
}
