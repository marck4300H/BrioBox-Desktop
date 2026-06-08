import { http } from './client';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  supplier_id: number;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  is_active?: boolean;
}

export interface GetProductsResponse {
  success: boolean;
  products: Product[];
  count: number;
  page: number;
  limit: number;
}

export const productApi = {
  getAll: (page = 1, limit = 50) =>
    http.get<GetProductsResponse>(`/products?page=${page}&limit=${limit}`),

  getById: (id: number) =>
    http.get<{ success: boolean; product: Product }>(`/products/${id}`),

  create: (payload: CreateProductPayload) =>
    http.post<{ success: boolean; product: Product; message?: string }>('/products', payload),

  update: (id: number, payload: UpdateProductPayload) =>
    http.put<{ success: boolean; product: Product; message?: string }>(`/products/${id}`, payload),

  delete: (id: number) =>
    http.delete<{ success: boolean; message?: string }>(`/products/${id}`),

  toggleStatus: (id: number, is_active: boolean) =>
    http.put<{ success: boolean; product: Product; message?: string }>(`/products/${id}`, { is_active }),
};