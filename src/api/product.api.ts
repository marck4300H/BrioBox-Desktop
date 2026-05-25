import { http } from './client';

export interface Product {
  id: string;
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
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  is_active?: boolean;
}

export const productApi = {
  getAll: () =>
    http.get<{ success: boolean; products: Product[] }>('/products'),

  getById: (id: string) =>
    http.get<{ success: boolean; product: Product }>(`/products/${id}`),

  getActive: () =>
    http.get<{ success: boolean; products: Product[] }>('/products/active'),

  create: (payload: CreateProductPayload) =>
    http.post<{ success: boolean; product: Product }>('/products', payload),

  update: (id: string, payload: UpdateProductPayload) =>
    http.put<{ success: boolean; product: Product }>(`/products/${id}`, payload),

  delete: (id: string) =>
    http.delete<{ success: boolean }>(`/products/${id}`),

  toggleStatus: (id: string, is_active: boolean) =>
    http.put<{ success: boolean; product: Product }>(`/products/${id}`, { is_active }),
};