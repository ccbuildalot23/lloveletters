/** Zod schemas for every public form (11.1). Messages are user-facing. */
import { z } from 'zod';

const email = z
  .string({ message: 'Email is required.' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email like you@example.com.')
  .max(254);
const text = (max = 200) => z.string().trim().max(max, `Keep it under ${max} characters.`);
const optText = (max = 200) =>
  z.preprocess((v) => (v === '' ? undefined : v), text(max).optional());
const list = z.preprocess(
  (v) => (v === undefined || v === '' ? [] : Array.isArray(v) ? v : [v]),
  z.array(z.string().max(60)).max(20),
);
const rugId = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^TR-\d{4}$/, 'Rug ID looks like TR-0042.');

export const WaitlistSchema = z.object({
  email,
  first_name: optText(80),
  interests: list,
  source: optText(2000),
});

export const TradeSchema = z.object({
  name: text(120).min(2, 'Your name, please.'),
  firm: text(120).min(2, 'Firm or studio name.'),
  website: z.string().trim().min(3, 'Website or Instagram is required.').max(200),
  email,
  phone: text(40).min(7, 'A phone number we can reach you at.'),
  city_state: text(120).min(2, 'City and state.'),
  project_types: list,
  resale_cert: optText(60),
  heard_from: optText(200),
  source: optText(2000),
});

export const RequestSchema = z.object({
  email,
  size: optText(20),
  style: optText(40),
  colors: list,
  budget: optText(20),
  notes: optText(1000),
  criteria: optText(4000),
  rug_id: z.preprocess((v) => (v === '' ? undefined : v), rugId.optional()),
  source: optText(2000),
});

export const NotifySchema = z.object({ email, rug_id: rugId, source: optText(2000) });

export const RoomSchema = z.object({
  email,
  rug_id: rugId,
  room_dimensions: optText(80),
  notes: optText(1000),
  source: optText(2000),
});

export const ContactSchema = z.object({
  name: text(120).min(2, 'Your name, please.'),
  email,
  subject: optText(150),
  message: text(4000).min(10, 'A little more detail helps me help you.'),
  rug_id: z.preprocess((v) => (v === '' ? undefined : v), rugId.optional()),
  source: optText(2000),
});

export const ReturnSchema = z.object({
  order_email: email,
  order_number: text(60).min(4, 'Your order number is in the Stripe receipt.'),
  rug_id: rugId,
  reason: optText(1000),
  source: optText(2000),
});

export const ReviewSchema = z.object({
  token: text(200).min(8, 'This review link is missing its token.'),
  rating: z.coerce.number().int().min(1, 'Pick a star rating.').max(5),
  title: optText(120),
  text: text(3000).min(20, 'Tell us a little more (20+ characters).'),
  display_name: text(80).min(2, 'How should we show your name?'),
  city: optText(80),
});
