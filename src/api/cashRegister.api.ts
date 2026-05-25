import { http } from './client';

export interface CashSession {
  id: number;
  opened_by: number;
  opening_balance: number;
  closing_balance: number | null;
  opened_at: string;
  closed_at: string | null;
  notes?: string | null;
}

export interface CashMovement {
  id: number;
  session_id: number;
  created_by: number;
  movement_type: 'ingreso' | 'egreso';
  amount: number;
  description: string;
  reference_type: string | null;
  reference_id: number | null;
  created_at: string;
}

export interface CashSummary {
  openingBalance: number;
  totalIncome: number;
  totalExpense: number;
  expectedBalance: number;
  closingBalance: number | null;
  difference: number | null;
}

export interface CurrentCashSessionResponse {
  success: boolean;
  data: {
    session: CashSession;
    movements?: CashMovement[];
    summary?: CashSummary;
  };
}

export interface CashSessionDetailResponse {
  success: boolean;
  data: {
    session: CashSession;
    movements: CashMovement[];
    summary: CashSummary;
  };
}

export interface CashSessionListItem {
  session: CashSession;
  summary: CashSummary;
}

export interface CashSessionsResponse {
  success: boolean;
  data: CashSessionListItem[];
}

export interface OpenCashRegisterPayload {
  openingBalance: number;
  notes?: string;
}

export interface RegisterMovementPayload {
  sessionId: number;
  movementType: 'ingreso' | 'egreso';
  amount: number;
  description: string;
  referenceType?: string;
  referenceId?: number;
}

export interface CloseCashRegisterPayload {
  sessionId: number;
  closingBalance: number;
  notes?: string;
}

export const cashRegisterApi = {
  open: (payload: OpenCashRegisterPayload) =>
    http.post<{
      success: boolean;
      message: string;
      data: CashSession;
    }>('/cash-register/open', payload),

  getCurrent: () =>
    http.get<CurrentCashSessionResponse>('/cash-register/current'),

  createMovement: (payload: RegisterMovementPayload) =>
    http.post<{
      success: boolean;
      message: string;
      data: CashMovement;
    }>('/cash-register/movements', payload),

  close: (payload: CloseCashRegisterPayload) =>
    http.post<{
      success: boolean;
      message: string;
      data: {
        session: CashSession;
        summary: CashSummary;
      };
    }>('/cash-register/close', payload),

  getSessions: (from?: string, to?: string) => {
    const params = new URLSearchParams();

    if (from) params.append('from', from);
    if (to) params.append('to', to);

    const query = params.toString();
    return http.get<CashSessionsResponse>(
      `/cash-register/sessions${query ? `?${query}` : ''}`
    );
  },

  getSessionById: (id: number) =>
    http.get<CashSessionDetailResponse>(`/cash-register/sessions/${id}`),
};