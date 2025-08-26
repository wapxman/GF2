export interface Property {
  id: string
  name: string
  address: string
  area_sqm: number
  rent_rate_usd: number
  created_at: string
  updated_at: string
}

export interface Ownership {
  property_id: string
  user_id: string
  share_pct: number
  created_at: string
}

export interface ExpenseType {
  id: string
  name: string
  description?: string
  is_system: boolean
  created_at: string
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
}

export interface Income {
  id: string
  property_id: string
  year: number
  month: number
  amount_usd: number
  created_at: string
  updated_at: string
}

export interface PropertyWithOwners extends Property {
  owners: Array<{
    user_id: string
    first_name: string
    last_name: string
    share_pct: number
  }>
}

export interface ExpenseWithDetails extends Expense {
  property_name: string
  type_name: string
  created_by_name: string
}

export interface IncomeWithProperty extends Income {
  property_name: string
}

export interface CreatePropertyRequest {
  name: string
  address: string
  area_sqm: number
  rent_rate_usd: number
  owners: Array<{
    user_id: string
    share_pct: number
  }>
}

export interface UpdatePropertyRequest {
  name?: string
  address?: string
  area_sqm?: number
  rent_rate_usd?: number
  owners?: Array<{
    user_id: string
    share_pct: number
  }>
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

export interface CreateIncomeRequest {
  property_id: string
  year: number
  month: number
  amount_usd: number
}

export interface UpdateIncomeRequest {
  amount_usd: number
}

export interface PropertyFilters {
  owners?: string[]
  properties?: string[]
}

export interface ExpenseFilters {
  owners?: string[]
  properties?: string[]
  types?: string[]
  date_from?: string
  date_to?: string
}

export interface IncomeFilters {
  owners?: string[]
  properties?: string[]
  year: number
  months?: number[]
}

export interface PropertyStats {
  total_properties: number
  total_area: number
  expected_monthly_income: number
  average_rate_per_sqm: number
  multi_owner_properties: number
}

export interface ExpenseStats {
  total_amount: number
  current_month_amount: number
  current_year_amount: number
  period_amount?: number
}

export interface IncomeStats {
  yearly_total: number
  monthly_average: number
  properties_with_income: number
  selected_month_total?: number
}

export interface FinancialSummary {
  property_id: string
  property_name: string
  expected_income: number
  actual_income: number
  actual_expenses: number
  delta: number
  plan_percentage: number
}

export interface FinanceStats {
  total_expected: number
  total_actual_income: number
  total_expenses: number
  total_delta: number
  overall_plan_percentage: number
}

export interface FinanceFilters {
  year: number
  months?: number[]
  owners?: string[]
  properties?: string[]
}
