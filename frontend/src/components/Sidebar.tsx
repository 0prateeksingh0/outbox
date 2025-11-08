'use client'

import { useQuery } from '@tanstack/react-query'
import { accountsApi } from '@/lib/api'
import { Mail, Inbox, Star, Archive, Tag } from 'lucide-react'
import clsx from 'clsx'

interface SidebarProps {
  selectedAccount: string | null
  selectedCategory: string | null
  onAccountSelect: (accountId: string | null) => void
  onCategorySelect: (category: string | null) => void
}

const categories = [
  { id: null, name: 'All Emails', icon: Inbox, color: 'text-gray-600' },
  { id: 'INTERESTED', name: 'Interested', icon: Star, color: 'text-green-600' },
  { id: 'MEETING_BOOKED', name: 'Meeting Booked', icon: Archive, color: 'text-blue-600' },
  { id: 'NOT_INTERESTED', name: 'Not Interested', icon: Tag, color: 'text-red-600' },
  { id: 'SPAM', name: 'Spam', icon: Mail, color: 'text-gray-400' },
  { id: 'OUT_OF_OFFICE', name: 'Out of Office', icon: Mail, color: 'text-yellow-600' },
]

export function Sidebar({
  selectedAccount,
  selectedCategory,
  onAccountSelect,
  onCategorySelect,
}: SidebarProps) {
  const { data: accounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await accountsApi.list()
      return response.data.data
    },
  })

  return (
    <div className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        {/* Accounts Section */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Accounts
          </h2>
          <div className="space-y-1">
            <button
              onClick={() => onAccountSelect(null)}
              className={clsx(
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                selectedAccount === null
                  ? 'bg-primary-50 text-primary-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              )}
            >
              All Accounts
            </button>
            {accounts?.map((account: any) => (
              <button
                key={account.id}
                onClick={() => onAccountSelect(account.id)}
                className={clsx(
                  'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                  selectedAccount === account.id
                    ? 'bg-primary-50 text-primary-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate">{account.email}</span>
                  <span className="text-xs text-gray-400">
                    {account._count?.emails || 0}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Categories Section */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Categories
          </h2>
          <div className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon
              return (
                <button
                  key={category.id}
                  onClick={() => onCategorySelect(category.id)}
                  className={clsx(
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2',
                    selectedCategory === category.id
                      ? 'bg-primary-50 text-primary-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <Icon className={clsx('w-4 h-4', category.color)} />
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
