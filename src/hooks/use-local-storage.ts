import { useState, useEffect, useCallback } from 'react'

interface Document {
  id: string
  title: string
  content: string
  lastModified: number
  created: number
}

interface RecentFile {
  id: string
  title: string
  lastOpened: number
}

const DOCUMENTS_KEY = 'markdown-mermaid-documents'
const RECENT_FILES_KEY = 'markdown-mermaid-recent-files'
const CURRENT_DOCUMENT_KEY = 'markdown-mermaid-current-document'

export function useLocalStorage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Get current document from documents array
  const currentDocument = documents.find(doc => doc.id === currentDocumentId) || null

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedDocuments = localStorage.getItem(DOCUMENTS_KEY)
      const storedRecentFiles = localStorage.getItem(RECENT_FILES_KEY)
      const storedCurrentDocument = localStorage.getItem(CURRENT_DOCUMENT_KEY)

      if (storedDocuments) {
        setDocuments(JSON.parse(storedDocuments))
      }

      if (storedRecentFiles) {
        setRecentFiles(JSON.parse(storedRecentFiles))
      }

      if (storedCurrentDocument) {
        setCurrentDocumentId(JSON.parse(storedCurrentDocument))
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Save documents to localStorage
  const saveDocuments = useCallback((docs: Document[]) => {
    try {
      localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(docs))
      setDocuments(docs)
    } catch (error) {
      console.error('Error saving documents:', error)
    }
  }, [])

  // Save recent files to localStorage
  const saveRecentFiles = useCallback((files: RecentFile[]) => {
    try {
      localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(files))
      setRecentFiles(files)
    } catch (error) {
      console.error('Error saving recent files:', error)
    }
  }, [])

  // Save current document to localStorage
  const saveCurrentDocument = useCallback((doc: Document | null) => {
    try {
      if (doc) {
        localStorage.setItem(CURRENT_DOCUMENT_KEY, JSON.stringify(doc.id))
      } else {
        localStorage.removeItem(CURRENT_DOCUMENT_KEY)
      }
      setCurrentDocumentId(doc?.id || null)
    } catch (error) {
      console.error('Error saving current document:', error)
    }
  }, [])

  // Create a new document
  const createDocument = useCallback((title: string = 'Untitled', content: string = '') => {
    const now = Date.now()
    const newDoc: Document = {
      id: `doc-${now}`,
      title,
      content,
      lastModified: now,
      created: now,
    }

    const updatedDocs = [...documents, newDoc]
    saveDocuments(updatedDocs)
    saveCurrentDocument(newDoc)

    return newDoc
  }, [documents, saveDocuments, saveCurrentDocument])

  // Update a document
  const updateDocument = useCallback((id: string, updates: Partial<Document>) => {
    const updatedDocs = documents.map(doc =>
      doc.id === id
        ? { ...doc, ...updates, lastModified: Date.now() }
        : doc
    )
    saveDocuments(updatedDocs)

    if (currentDocument?.id === id) {
      saveCurrentDocument({ ...currentDocument, ...updates, lastModified: Date.now() })
    }
  }, [documents, currentDocument, saveDocuments, saveCurrentDocument])

  // Delete a document
  const deleteDocument = useCallback((id: string) => {
    const updatedDocs = documents.filter(doc => doc.id !== id)
    saveDocuments(updatedDocs)

    if (currentDocument?.id === id) {
      saveCurrentDocument(null)
    }
  }, [documents, currentDocument, saveDocuments, saveCurrentDocument])

  // Load a document
  const loadDocument = useCallback((id: string) => {
    const doc = documents.find(d => d.id === id)
    if (doc) {
      saveCurrentDocument(doc)

      // Update recent files
      const updatedRecentFiles = [
        { id: doc.id, title: doc.title, lastOpened: Date.now() },
        ...recentFiles.filter(f => f.id !== id).slice(0, 9) // Keep last 10
      ]
      saveRecentFiles(updatedRecentFiles)
    }
  }, [documents, recentFiles, saveCurrentDocument, saveRecentFiles])

  // Switch to a document
  const switchDocument = useCallback((id: string) => {
    setCurrentDocumentId(id)
    localStorage.setItem(CURRENT_DOCUMENT_KEY, JSON.stringify(id))
  }, [])

  // Close a document
  const closeDocument = useCallback((id: string) => {
    const updatedDocs = documents.filter(doc => doc.id !== id)
    saveDocuments(updatedDocs)

    // If closing current document, switch to another or set to null
    if (currentDocumentId === id) {
      const nextDoc = updatedDocs[0] || null
      if (nextDoc) {
        switchDocument(nextDoc.id)
      } else {
        setCurrentDocumentId(null)
        localStorage.removeItem(CURRENT_DOCUMENT_KEY)
      }
    }
  }, [documents, currentDocumentId, saveDocuments, switchDocument])

  // Autosave current document
  const autosaveDocument = useCallback((content: string) => {
    if (currentDocument) {
      updateDocument(currentDocument.id, { content })
    }
  }, [currentDocument, updateDocument])

  return {
    documents,
    recentFiles,
    currentDocument,
    currentDocumentId,
    isLoading,
    createDocument,
    updateDocument,
    deleteDocument,
    loadDocument,
    switchDocument,
    closeDocument,
    autosaveDocument,
  }
}