'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import DashboardLayout from '@/components/DashboardLayout'

export default function Dashboard() {
  return (
    <DashboardLayout activeSection="dashboard">
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Добро пожаловать!</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                Добро пожаловать в систему управления недвижимостью Grand Floor.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900">Ваша роль</h3>
                  <p className="text-blue-700 capitalize">Активная роль в системе</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900">Статус</h3>
                  <p className="text-green-700">Активен</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Система управления недвижимостью</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Используйте меню слева для навигации по разделам системы.</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
