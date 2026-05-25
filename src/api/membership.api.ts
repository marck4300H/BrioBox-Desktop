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

export interface MembershipFreeze {
  id: string;
  membership_id: string;
  start_date: string;
  end_date: string;
  is_indefinite: boolean;
  is_active: boolean;
  created_by: string;
}

export interface CreateMembershipPayload {
  customerId: string;
  planId: string;
}

export interface CreatePlanPayload {
  name: string;
  price: number;
  duration_days: number;
}

export interface CreateFreezePayload {
  start_date: string;
  end_date?: string;
  is_indefinite?: boolean;
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
    http.put<{ success: boolean; membership: Membership }>(`/memberships/customers/cancel/${id}`, {}),

  // Planes
  getActivePlans: () =>
    http.get<{ success: boolean; plans: MembershipPlan[] }>('/memberships/plans/active'),
  getDisabledPlans: () =>
    http.get<{ success: boolean; plans: MembershipPlan[] }>('/memberships/plans/disabled'),
  getPlanById: (id: string) =>
    http.get<{ success: boolean; plan: MembershipPlan }>(`/memberships/plans/${id}`),
  createPlan: (payload: CreatePlanPayload) =>
    http.post<{ success: boolean; plan: MembershipPlan }>('/memberships/plans', payload),
  updatePlan: (id: string, payload: Partial<CreatePlanPayload>) =>
    http.put<{ success: boolean; plan: MembershipPlan }>(`/memberships/plans/${id}`, payload),
  activatePlan: (id: string) =>
    http.put<{ success: boolean; plan: MembershipPlan }>(`/memberships/plans/activate/${id}`, {}),
  deactivatePlan: (id: string) =>
    http.put<{ success: boolean; plan: MembershipPlan }>(`/memberships/plans/deactivate/${id}`, {}),

  // Congelamientos
  createFreeze: (membershipId: string, payload: CreateFreezePayload) =>
    http.post<{ success: boolean; freeze: MembershipFreeze }>(`/memberships/freezes/${membershipId}`, payload),
  getFreezes: (membershipId: string) =>
    http.get<{ success: boolean; freezes: MembershipFreeze[] }>(`/memberships/freezes/${membershipId}`),
  cancelFreeze: (freezeId: string) =>
    http.put<{ success: boolean; freeze: MembershipFreeze }>(`/memberships/freeze/cancel/${freezeId}`, {}),
  activateFreeze: (freezeId: string) =>
    http.put<{ success: boolean; freeze: MembershipFreeze }>(`/memberships/freeze/activate/${freezeId}`, {}),
};