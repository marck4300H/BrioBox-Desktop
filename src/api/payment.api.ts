import { http } from './client';

export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';

export interface PaymentSplit {
  id?: number;
  payment_id?: number;
  payment_method: PaymentMethod;
  amount: number;
}

export interface Payment {
  id: number;
  created_by: number;
  customer_id: string;
  total_amount: number;
  reference_type: string;
  reference_id: number;
  notes: string | null;
  created_at: string;
}

export interface PaymentReceipt {
  paymentId: number;
  customerId: string;
  membershipId: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  isPaidInFull: boolean;
  createdAt: string;
  splits: Pick<PaymentSplit, 'payment_method' | 'amount'>[];
}

export interface RegisterPaymentPayload {
  membershipId: number;
  splits: Pick<PaymentSplit, 'payment_method' | 'amount'>[];
  notes?: string;
}

export interface RegisterPaymentResponse {
  success: boolean;
  message: string;
  payment: Payment;
  splits: PaymentSplit[];
  receipt: PaymentReceipt;
}

export interface PaymentWithSplits {
  payment: Payment;
  splits: PaymentSplit[];
}

export const paymentApi = {
  register: (payload: RegisterPaymentPayload) =>
    http.post<RegisterPaymentResponse>('/payments', payload),

  getByMembership: (membershipId: number) =>
    http.get<{ success: boolean; data: PaymentWithSplits[] }>(
      `/payments/membership/${membershipId}`
    ),

  getById: (paymentId: number) =>
    http.get<{ success: boolean; data: PaymentWithSplits }>(`/payments/${paymentId}`),
};