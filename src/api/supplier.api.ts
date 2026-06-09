import { http } from './client';

export interface Supplier {
  id: number;
  name: string;
  email: string;
  nit: string;
  phone: string | null;
  address: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupplierListResponse {
  success: boolean;
  suppliers: Supplier[];
  count: number;
  page: number;
  limit: number;
}

export interface SupplierResponse {
  success: boolean;
  supplier: Supplier;
}

export interface SupplierCreateInput {
  name: string;
  email: string;
  nit: string;
  address: string;
}

export interface SupplierUpdateInput {
  name?: string;
  email?: string;
  nit?: string;
  phone?: string;
  address?: string;
  is_active?: boolean;
}

export const supplierApi = {
  list: (page = 1, limit = 10) =>
    http.get<SupplierListResponse>(`/suppliers?page=${page}&limit=${limit}`),

  getById: (id: number) =>
    http.get<SupplierResponse>(`/suppliers/${id}`),

  create: (body: SupplierCreateInput) =>
    http.post<SupplierResponse>('/suppliers', body),

  update: (id: number, body: SupplierUpdateInput) =>
    http.put<SupplierResponse>(`/suppliers/${id}`, body),

  remove: (id: number) =>
    http.delete<{ success: boolean; message: string }>(`/suppliers/${id}`),
};