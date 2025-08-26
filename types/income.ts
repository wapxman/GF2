export interface Income {
  id: string
  property_id: string
  year: number
  month: number
  amount_usd: number
  property?: {
    id: string
    name: string
    address: string
  }
}

export interface CreateIncomeRequest {
  property_id: string
  year: number
  month: number
  amount_usd: number
}

export interface UpdateIncomeRequest {
  property_id?: string
  year?: number
  month?: number
  amount_usd?: number
}

export interface BulkUpdateIncomeRequest {
  updates: Array<{
    property_id: string
    month: number
    year: number
    amount_usd: number
  }>
}

export interface IncomeStats {
  yearlyTotal: number
  monthlyTotal: number
  averageMonthly: number
  propertiesWithIncome: number
}

export interface IncomeResponse {
  income: Income[]
  stats: IncomeStats
}
