import { http } from './client';

export interface Membership {
  id: string;
  customer_id: string;
  plan_id: string;
  status: 'activa' | 'cancelada' | 'pendiente';
  start_date: string;
  end_date: string;
}

export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  is_active: boolean;
}

export interface CreateMembershipPayload {
  customerId: string;
  planId: string;
}

export const membershipApi = {
  // Membresías
  create: (payload: CreateMembershipPayload) =>
    http.post<{ success: boolean; membership: Membership }>('/memberships/customers', payload),

  getAll: () =>
    http.get<{ success: boolean; memberships: Membership[] }>('/memberships/customers'),

  getActive: () =>
    http.get<{ success: boolean; memberships: Membership[] }>('/memberships/customers/active'),

  getPending: () =>
    http.get<{ success: boolean; memberships: Membership[] }>('/memberships/customers/pending'),

  getById: (id: string) =>
    http.get<{ success: boolean; membership: Membership }>(`/memberships/customers/${id}`),

  cancel: (id: string) =>
    http.put<{ success: boolean; membership: Membership }>(`/memberships/customers/${id}`, { status: 'cancelada' }),

  // Planes
  getActivePlans: () =>
    http.get<{ success: boolean; plans: MembershipPlan[] }>('/memberships/plans/active'),

  getDisabledPlans: () =>
    http.get<{ success: boolean; plans: MembershipPlan[] }>('/memberships/plans/disabled'),

  getPlanById: (id: string) =>
    http.get<{ success: boolean; plan: MembershipPlan }>(`/memberships/plans/${id}`),

  createPlan: (payload: { name: string; price: number; duration_days: number }) =>
    http.post<{ success: boolean; plan: MembershipPlan }>('/memberships/plans', payload),
};