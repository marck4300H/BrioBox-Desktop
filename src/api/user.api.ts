import { http } from './client';
import type { User, UpdateUserPayload, ApiResponse, Employee } from '../types';

export interface ClientPayload {
  first_name: string;
  middle_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  age: number;
  email: string;
  phone: string;
  address: string;
}

export interface Client {
  id: string;
  first_name: string;
  middle_name: string;
  paternal_last_name: string;
  maternal_last_name: string;
  age: number;
  email: string;
  phone: string;
  address: string;
}

export const userApi = {
  getProfile: () =>
    http.get<{ success: boolean; user: User }>('/users/user'),

  updateProfile: (payload: UpdateUserPayload) =>
    http.put<User>('/users/user', payload),

  deleteAccount: () =>
    http.delete<ApiResponse>('/users/user'),

  createClient: (payload: ClientPayload) =>
    http.post<{ userId: string }>('/users/customer', payload),

  getAllClients: (page = 1, limit = 10) =>
    http.get<{ success: boolean; users: Client[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(`/users/customers?page=${page}&limit=${limit}`),

  getClient: (id: string) =>
    http.get<{ success: boolean; user: Client }>(`/users/customer/${id}`),

  updateClient: (id: string, payload: Partial<ClientPayload>) =>
    http.put<{ success: boolean; user: Client }>(`/users/customer/${id}`, payload),

  deleteClient: (id: string) =>
    http.delete<ApiResponse>(`/users/customer/${id}`),

  getEmployees: () =>
    http.get<{ success: boolean; users: Employee[] }>('/users/employees'),

  saveClientFingerprint: (clientId: string, fingerprintTemplate: string) =>
    http.patch<{ success: boolean; message: string }>(`/users/customer/${clientId}/fingerprint`, {
      fingerprint_template: fingerprintTemplate,
    }),

  getAllFingerprints: () =>
    http.get<{ success: boolean; fingerprints: Array<{ id: number; fingerprint_template: string }> }>('/users/customers/fingerprints'),
};