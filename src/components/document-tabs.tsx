import React from 'react'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'

interface Document {
  id: string
  title: string
  content: string
  lastModified: number
  created: number
}

interface DocumentTabsProps {
  documents: Document[]
  currentDocumentId: string | null
  onSwitchDocument: (id: string) => void
  onCloseDocument: (id: string) => void
  onNewDocument: () => void
}

export function DocumentTabs({
  documents,
  currentDocumentId,
  onSwitchDocument,
  onCloseDocument,
  onNewDocument,
}: DocumentTabsProps) {

  return (
    <div className="flex items-center border-b bg-background px-2">
      <div className="flex items-center gap-1 overflow-x-auto">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className={`flex items-center gap-1 px-3 py-2 border-r border-border cursor-pointer group min-w-0 ${
              currentDocumentId === doc.id
                ? 'bg-muted border-b-2 border-b-primary'
                : 'hover:bg-muted/50'
            }`}
            onClick={() => onSwitchDocument(doc.id)}
          >
            <span className="text-sm font-medium truncate max-w-32">
              {doc.title}
            </span>
            {documents.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation()
                  onCloseDocument(doc.id)
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="ml-2 h-8 w-8 p-0"
        onClick={onNewDocument}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}