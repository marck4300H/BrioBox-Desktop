import { http } from './client';

export interface Supplier {
  id: number | string;
  name: string;
  nit: string;
  phone: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateSupplierPayload {
  name: string;
  nit: string;
  phone: string;
  email: string;
}

export interface UpdateSupplierPayload {
  name?: string;
  nit?: string;
  phone?: string;
  email?: string;
}

export interface SupplierListResponse {
  success: boolean;
  data: Supplier[];
}

export interface SupplierDetailResponse {
  success: boolean;
  data: Supplier;
}

export const supplierApi = {
  getAll: () =>
    http.get<SupplierListResponse>('/suppliers'),

  getById: (id: number | string) =>
    http.get<SupplierDetailResponse>(`/suppliers/${id}`),

  create: (payload: CreateSupplierPayload) =>
    http.post<{
      success: boolean;
      message: string;
      data: Supplier;
    }>('/suppliers', payload),

  update: (id: number | string, payload: UpdateSupplierPayload) =>
    http.put<{
      success: boolean;
      message: string;
      data: Supplier;
    }>(`/suppliers/${id}`, payload),

  delete: (id: number | string) =>
    http.delete<{
      success: boolean;
      message: string;
    }>(`/suppliers/${id}`),
};