'use client'

import { useQuery } from '@tanstack/react-query'
import { emailsApi, searchApi } from '@/lib/api'
import { format } from 'date-fns'
import clsx from 'clsx'
import { Star, Tag } from 'lucide-react'

interface EmailListProps {
  accountId: string | null
  category: string | null
  searchQuery: string
  selectedEmailId: string | null
  onEmailSelect: (emailId: string) => void
}

export function EmailList({
  accountId,
  category,
  searchQuery,
  selectedEmailId,
  onEmailSelect,
}: EmailListProps) {

  const { data, isLoading } = useQuery({
    queryKey: ['emails', accountId, category, searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        const response = await searchApi.search({
          q: searchQuery,
          accountId,
          category,
        })
        return response.data
      } else {
        const response = await emailsApi.list({
          accountId,
          category,
        })
        return response.data
      }
    },
    refetchInterval: 10000, // Refresh every 10 seconds for real-time updates
  })

  const emails = data?.data || []

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'INTERESTED':
        return 'bg-green-100 text-green-800'
      case 'MEETING_BOOKED':
        return 'bg-blue-100 text-blue-800'
      case 'NOT_INTERESTED':
        return 'bg-red-100 text-red-800'
      case 'SPAM':
        return 'bg-gray-100 text-gray-800'
      case 'OUT_OF_OFFICE':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (emails.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No emails found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {emails.map((email: any) => (
        <button
          key={email.id}
          onClick={() => onEmailSelect(email.id)}
          className={clsx(
            'w-full text-left p-4 hover:bg-gray-50 transition-colors',
            selectedEmailId === email.id && 'bg-primary-50',
            !email.isRead && 'bg-blue-50/50'
          )}
        >
          <div className="flex items-start justify-between mb-1">
            <span
              className={clsx(
                'font-medium text-sm truncate flex-1',
                !email.isRead ? 'text-gray-900 font-semibold' : 'text-gray-700'
              )}
            >
              {email.from}
            </span>
            <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
              {format(new Date(email.date), 'MMM d')}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <h3
              className={clsx(
                'text-sm truncate flex-1',
                !email.isRead ? 'font-semibold text-gray-900' : 'text-gray-700'
              )}
            >
              {email.subject}
            </h3>
            {email.isFlagged && <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />}
          </div>

          <p className="text-xs text-gray-500 truncate mb-2">
            {email.body?.substring(0, 100)}
          </p>

          {email.category && email.category !== 'UNCATEGORIZED' && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
                getCategoryColor(email.category)
              )}
            >
              <Tag className="w-3 h-3" />
              {email.category.replace('_', ' ')}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
