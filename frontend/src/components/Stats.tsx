'use client'

import { useQuery } from '@tanstack/react-query'
import { emailsApi } from '@/lib/api'
import { Mail, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

interface StatsProps {
  accountId: string | null
}

export function Stats({ accountId }: StatsProps) {
  const { data: stats } = useQuery({
    queryKey: ['stats', accountId],
    queryFn: async () => {
      const response = await emailsApi.getStats(accountId || undefined)
      return response.data.data
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  if (!stats) return null

  const metrics = [
    {
      label: 'Total Emails',
      value: stats.total,
      icon: Mail,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Unread',
      value: stats.unread,
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Interested',
      value: stats.byCategory?.INTERESTED || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Not Interested',
      value: stats.byCategory?.NOT_INTERESTED || 0,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        return (
          <div
            key={metric.label}
            className="bg-white border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`${metric.bgColor} p-2 rounded-lg`}>
                <Icon className={`w-5 h-5 ${metric.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{metric.label}</p>
                <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
