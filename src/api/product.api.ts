import { http } from './client';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';

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

export interface SellProductPayload {
  quantity: number;
  payment_method: PaymentMethod;
}

export interface SellProductResponse {
  success: boolean;
  message: string;
  product: Pick<Product, 'id' | 'name' | 'price' | 'stock' | 'is_active'>;
  payment: {
    id: number;
    total_amount: number;
    reference_type: string;
    reference_id: number;
  };
  splits: { id: number; payment_method: PaymentMethod; amount: number }[];
  movement: {
    id: number;
    session_id: number;
    movement_type: string;
    amount: number;
    description: string;
  };
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

  sell: (id: number, payload: SellProductPayload) =>
    http.post<SellProductResponse>(`/products/${id}/sell`, payload),
};