/**
 * CSV Importer Component
 * Importazione massiva prodotti da CSV
 */

'use client'

import { useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Upload, Download, AlertCircle, CheckCircle2, FileText } from 'lucide-react'

interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; message: string }>
}

interface CSVImporterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (data: any[]) => Promise<ImportResult>
}

export function CSVImporter({ open, onOpenChange, onImport }: CSVImporterProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<ImportResult | null>(null)

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setResult(null)
    }
  }, [])

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n')
    const headers = lines[0].split(',').map((h) => h.trim())
    
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map((v) => v.trim())
      const row: any = { _row: index + 2 }
      
      headers.forEach((header, i) => {
        row[header] = values[i]
      })
      
      return row
    }).filter(row => Object.keys(row).length > 1) // Filter empty rows

    return data
  }

  const handleImport = async () => {
    if (!file) return

    setIsImporting(true)
    setProgress(0)

    try {
      const text = await file.text()
      const data = parseCSV(text)

      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90))
      }, 100)

      const result = await onImport(data)

      clearInterval(interval)
      setProgress(100)
      setResult(result)
    } catch (error) {
      console.error('Import error:', error)
      setResult({
        success: 0,
        failed: 1,
        errors: [{ row: 0, message: 'Failed to parse CSV file' }],
      })
    } finally {
      setIsImporting(false)
    }
  }

  const handleDownloadTemplate = () => {
    const template = `name,sku,price,compareAtPrice,quantity,status,category,description
Sample Product,PROD-001,29.99,39.99,100,active,electronics,Sample product description
Another Product,PROD-002,49.99,,50,draft,clothing,Another product description`

    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'product-import-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setProgress(0)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Products from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import products
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Download */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Download the template file to see required format</span>
              <Button variant="link" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          {!result && (
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                id="csv-upload"
                className="hidden"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={isImporting}
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                {file ? (
                  <div className="space-y-2">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">Click to upload CSV file</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or drag and drop
                    </p>
                  </div>
                )}
              </label>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing products...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Import Result */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    <div className="flex justify-between items-center">
                      <span>Successful</span>
                      <Badge variant="secondary" className="bg-green-100">
                        {result.success}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex justify-between items-center">
                      <span>Failed</span>
                      <Badge variant="secondary">{result.failed}</Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Errors:</h4>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {result.errors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertDescription className="text-sm">
                          Row {error.row}: {error.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CSV Format Guide */}
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">Required CSV Format:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>First row must contain column headers</li>
              <li>Required fields: name, sku, price</li>
              <li>Optional fields: compareAtPrice, quantity, status, category, description</li>
              <li>Status values: active, draft, archived</li>
              <li>Prices should be numbers without currency symbols</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button onClick={handleImport} disabled={!file || isImporting}>
              {isImporting ? 'Importing...' : 'Import Products'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
