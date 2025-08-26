export interface ExpenseType {
  id: string
  name: string
  description?: string
  is_system: boolean
}

export interface Expense {
  id: string
  property_id: string
  type_id: string
  date: string
  amount_usd: number
  comment?: string
  created_by: string
  created_at: string
  property?: {
    id: string
    name: string
    address: string
  }
  expense_type?: {
    id: string
    name: string
  }
  created_by_user?: {
    id: string
    first_name: string
    last_name: string
  }
}

export interface CreateExpenseRequest {
  property_id: string
  type_id: string
  date: string
  amount_usd: number
  comment?: string
}

export interface UpdateExpenseRequest {
  property_id?: string
  type_id?: string
  date?: string
  amount_usd?: number
  comment?: string
}

export interface ExpenseStats {
  totalAmount: number
  currentMonthAmount: number
  currentYearAmount: number
  periodAmount: number
}

export interface ExpensesResponse {
  expenses: Expense[]
  total: number
  page: number
  limit: number
}
