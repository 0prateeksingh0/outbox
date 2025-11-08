'use client'

import { useState } from 'react'
import { EmailList } from '@/components/EmailList'
import { EmailDetail } from '@/components/EmailDetail'
import { Sidebar } from '@/components/Sidebar'
import { SearchBar } from '@/components/SearchBar'
import { Stats } from '@/components/Stats'

export default function Home() {
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        selectedAccount={selectedAccount}
        selectedCategory={selectedCategory}
        onAccountSelect={setSelectedAccount}
        onCategorySelect={setSelectedCategory}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            📧 ReachInbox Onebox
          </h1>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <Stats accountId={selectedAccount} />
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div className="w-96 border-r border-gray-200 overflow-y-auto bg-white">
            <EmailList
              accountId={selectedAccount}
              category={selectedCategory}
              searchQuery={searchQuery}
              selectedEmailId={selectedEmailId}
              onEmailSelect={setSelectedEmailId}
            />
          </div>

          {/* Email Detail */}
          <div className="flex-1 overflow-y-auto">
            {selectedEmailId ? (
              <EmailDetail emailId={selectedEmailId} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-4 text-lg font-medium">Select an email</p>
                  <p className="mt-1 text-sm">Choose an email from the list to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
