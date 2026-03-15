export type UserRole = "platform_admin" | "provider_owner" | "professional" | "client";

export interface User {
  id: number;
  email: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_id: number;
  role: UserRole;
}

export interface Provider {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  logo_url?: string;
  category?: string;
  worker_payment_amount: number;
  deposit_percentage: number;
  latitude?: number;
  longitude?: number;
  is_active: boolean;
  created_at: string;
  settings?: Record<string, unknown>;
}

// Backward-compat alias
export type Salon = Provider;

export interface ProfessionalPhoto {
  id: number;
  professional_id: number;
  image_url: string;
  caption?: string;
  order: number;
  created_at: string;
}

// Backward-compat alias
export type MasterPhoto = ProfessionalPhoto;

export interface Professional {
  id: number;
  user_id: number;
  name: string;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  social_links?: Record<string, string>;
  nationality?: string;
  experience_years?: number;
  description?: string;
  photos?: ProfessionalPhoto[];
  created_at: string;
  professional_providers?: ProfessionalProvider[];
}

// Backward-compat alias
export type Master = Professional;

export type ProfessionalStatus = "pending" | "active" | "inactive" | "rejected";

// Backward-compat alias
export type MasterStatus = ProfessionalStatus;

export interface ProfessionalProvider {
  id: number;
  professional_id: number;
  provider_id: number;
  status: ProfessionalStatus;
  payment_amount?: number;
  joined_at?: string;
}

// Backward-compat alias
export type MasterSalon = ProfessionalProvider;

export interface Service {
  id: number;
  provider_id: number;
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_active: boolean;
  created_at: string;
}

export type SessionStatus =
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

export interface Session {
  id: number;
  provider_id: number;
  professional_id?: number;
  service_id?: number;
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_notes?: string;
  starts_at: string;
  ends_at: string;
  duration_minutes: number;
  status: SessionStatus;
  price?: number;
  deposit_paid: number;
  total_paid: number;
  earnings_amount?: number;
  earnings_recorded_at?: string;
  created_at: string;
}

export interface WorkSlot {
  id: number;
  professional_id: number;
  provider_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface AvailableSlot {
  professional_id: number;
  professional_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  work_slot_id: number;
}

export interface BookingConfirmation {
  session_id: number;
  client_name: string;
  client_phone: string;
  provider_name: string;
  service_name?: string;
  professional_name?: string;
  starts_at: string;
  ends_at: string;
  price?: number;
  confirmation_code: string;
}

export interface Payment {
  id: number;
  session_id: number;
  amount: number;
  currency: string;
  payment_type: "deposit" | "full";
  status: "pending" | "processing" | "succeeded" | "failed" | "refunded";
  stripe_receipt_url?: string;
  created_at: string;
}

export interface Invite {
  id: number;
  provider_id: number;
  invited_email: string;
  token: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  expires_at: string;
  created_at: string;
}

// ── Reviews ──────────────────────────────────────────

export interface Review {
  id: number;
  session_id?: number;
  professional_id: number;
  provider_id: number;
  client_name: string;
  client_phone?: string;
  rating: number;
  comment?: string;
  is_published: boolean;
  created_at: string;
}

export interface ReviewStats {
  professional_id: number;
  total_reviews: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
}

// ── Loyalty ──────────────────────────────────────────

export type DiscountType = "percentage" | "fixed";

export interface DiscountRule {
  id: number;
  program_id: number;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  conditions?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

export interface LoyaltyProgram {
  id: number;
  provider_id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  discount_rules: DiscountRule[];
}

// ── Invoices / Earnings ───────────────────────────────

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue";

export interface Invoice {
  id: number;
  provider_id: number;
  professional_id: number;
  period_start: string;
  period_end: string;
  total_sessions: number;
  total_revenue: number;
  professional_earnings: number;
  provider_earnings: number;
  professional_percentage: number;
  status: InvoiceStatus;
  notes?: string;
  created_at: string;
}

export interface EarningsSplit {
  id: number;
  provider_id: number;
  professional_id: number;
  professional_percentage: number;
  effective_from: string;
  created_at: string;
}

// ── Analytics ──────────────────────────────────────────

export interface WorkerAnalytics {
  professional_id: number;
  professional_name: string;
  avatar_url?: string;
  status: ProfessionalStatus;
  total_sessions: number;
  completed_sessions: number;
  total_hours: number;
  total_revenue: number;
  professional_earnings: number;
  provider_earnings: number;
  professional_percentage: number;
}

export interface ProfessionalAnalytics {
  professional_id: number;
  professional_name: string;
  period_from: string;
  period_to: string;
  total_sessions: number;
  completed_sessions: number;
  total_hours: number;
  total_revenue: number;
  unique_clients: number;
  provider_breakdown: Array<{
    provider_id: number;
    sessions: number;
    revenue: number;
    hours: number;
  }>;
  monthly_breakdown: Array<{
    month: string;
    sessions: number;
    revenue: number;
  }>;
}

// Backward-compat alias
export type MasterAnalytics = ProfessionalAnalytics;

// ── Reports ────────────────────────────────────────────

export interface ProviderReport {
  summary: {
    provider_id: number;
    provider_name: string;
    period_start: string;
    period_end: string;
    total_sessions: number;
    completed_sessions: number;
    cancelled_sessions: number;
    total_revenue: number;
    total_deposits: number;
  };
  service_popularity: Array<{
    service_id: number;
    service_name: string;
    booking_count: number;
    total_revenue: number;
  }>;
  professional_performance: Array<{
    professional_id: number;
    professional_name: string;
    sessions_completed: number;
    sessions_cancelled: number;
    completion_rate: number;
    total_earnings: number;
  }>;
  daily_revenue: Array<{
    date: string;
    revenue: number;
    session_count: number;
  }>;
}

// Backward-compat alias
export type SalonReport = ProviderReport;

export interface ProfessionalReport {
  summary: {
    professional_id: number;
    professional_name: string;
    sessions_completed: number;
    total_earnings: number;
    period_start: string;
    period_end: string;
  };
  daily_earnings: Array<{
    date: string;
    revenue: number;
    session_count: number;
  }>;
}

// Backward-compat alias
export type MasterReport = ProfessionalReport;

export interface PaginationParams {
  skip?: number;
  limit?: number;
}
