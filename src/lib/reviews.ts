/**
 * Approved reviews. Source of truth is D1 (moderated in /admin); the admin "Rebuild site" action
 * exports approved reviews into src/data/reviews.json via the deploy hook pipeline (see README).
 * This file is intentionally empty until real, verified reviews exist. Never seed fake reviews.
 */
import raw from '../data/reviews.json';
export interface Review {
  id: number;
  rating: number;
  title?: string;
  body: string;
  displayName: string;
  city?: string;
  date: string;
  verified: boolean;
  rugId?: string;
  photo?: string;
}
export const reviews: Review[] = raw as Review[];
export const approvedCount = reviews.length;
export const aggregateRating = approvedCount
  ? +(reviews.reduce((s, r) => s + r.rating, 0) / approvedCount).toFixed(1)
  : 0;
export const showReviews = approvedCount >= 3;
