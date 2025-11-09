'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { emailsApi } from '@/lib/api'
import { format } from 'date-fns'
import { 
  Star, 
  Mail, 
  MailOpen, 
  Sparkles, 
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react'
import clsx from 'clsx'

interface EmailDetailProps {
  emailId: string
}

export function EmailDetail({ emailId }: EmailDetailProps) {
  const queryClient = useQueryClient()
  const [showReplySuggestion, setShowReplySuggestion] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const { data: email, isLoading } = useQuery({
    queryKey: ['email', emailId],
    queryFn: async () => {
      const response = await emailsApi.get(emailId)
      return response.data.data
    },
    enabled: !!emailId,
  })

  const updateEmailMutation = useMutation({
    mutationFn: (data: any) => emailsApi.update(emailId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      queryClient.invalidateQueries({ queryKey: ['email', emailId] })
    },
  })

  const generateSuggestionMutation = useMutation({
    mutationFn: () => emailsApi.generateReplySuggestion(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email', emailId] })
      setShowReplySuggestion(true)
    },
  })

  const recategorizeMutation = useMutation({
    mutationFn: () => emailsApi.recategorize(emailId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      queryClient.invalidateQueries({ queryKey: ['email', emailId] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const updateCategoryMutation = useMutation({
    mutationFn: (category: string) => emailsApi.updateCategory(emailId, category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emails'] })
      queryClient.invalidateQueries({ queryKey: ['email', emailId] })
      queryClient.invalidateQueries({ queryKey: ['stats'] })
    },
  })

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!email) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <p>Email not found</p>
      </div>
    )
  }

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

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {email.subject}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-medium">{email.from}</span>
              <span>→</span>
              <span>{email.to}</span>
              <span>•</span>
              <span>{format(new Date(email.date), 'PPp')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => updateEmailMutation.mutate({ isFlagged: !email.isFlagged })}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                email.isFlagged
                  ? 'bg-yellow-50 text-yellow-600'
                  : 'hover:bg-gray-100 text-gray-600'
              )}
            >
              <Star className="w-5 h-5" />
            </button>

            <button
              onClick={() => updateEmailMutation.mutate({ isRead: !email.isRead })}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
            >
              {email.isRead ? <MailOpen className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="category-select" className="text-sm font-medium text-gray-700">
              Category:
            </label>
            <select
              id="category-select"
              value={email.category || 'UNCATEGORIZED'}
              onChange={(e) => updateCategoryMutation.mutate(e.target.value)}
              disabled={updateCategoryMutation.isPending}
              className={clsx(
                'px-3 py-1 rounded-lg text-sm font-medium border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500',
                getCategoryColor(email.category),
                updateCategoryMutation.isPending && 'opacity-50 cursor-not-allowed'
              )}
            >
              <option value="UNCATEGORIZED">Uncategorized</option>
              <option value="INTERESTED">Interested</option>
              <option value="MEETING_BOOKED">Meeting Booked</option>
              <option value="NOT_INTERESTED">Not Interested</option>
              <option value="SPAM">Spam</option>
              <option value="OUT_OF_OFFICE">Out of Office</option>
            </select>
            {email.categoryConfidence && (
              <span className="text-xs text-gray-500">
                ({Math.round(email.categoryConfidence * 100)}%)
              </span>
            )}
          </div>

          <button
            onClick={() => recategorizeMutation.mutate()}
            disabled={recategorizeMutation.isPending}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            title="Re-categorize with AI"
          >
            <RefreshCw className={clsx('w-3 h-3', recategorizeMutation.isPending && 'animate-spin')} />
            AI Re-categorize
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose max-w-none">
          {email.htmlBody ? (
            <div dangerouslySetInnerHTML={{ __html: email.htmlBody }} />
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-gray-700">
              {email.body}
            </pre>
          )}
        </div>
      </div>

      {/* AI Reply Suggestions */}
      <div className="border-t border-gray-200 p-6 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-600" />
            AI Reply Suggestions
          </h3>

          <button
            onClick={() => generateSuggestionMutation.mutate()}
            disabled={generateSuggestionMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {generateSuggestionMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Reply
              </>
            )}
          </button>
        </div>

        {email.suggestedReplies && email.suggestedReplies.length > 0 ? (
          <div className="space-y-3">
            {email.suggestedReplies.map((suggestion: any) => (
              <div
                key={suggestion.id}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="text-xs text-gray-500">
                    Generated {format(new Date(suggestion.createdAt), 'PPp')}
                    {suggestion.confidence && (
                      <span className="ml-2">
                        • Confidence: {Math.round(suggestion.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopy(suggestion.suggestion, suggestion.id)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-100"
                  >
                    {copiedId === suggestion.id ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-sans text-gray-700 text-sm">
                  {suggestion.suggestion}
                </pre>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              No suggestions yet. Click "Generate Reply" to create one!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
