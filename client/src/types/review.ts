export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface PublicReview {
  id: string;
  rating: number;
  body?: string;
  authorName?: string;
  petName?: string;
  locale: string;
  createdAt: string;
}

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
