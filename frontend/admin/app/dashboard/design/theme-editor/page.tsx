/**
 * Theme Editor Page
 * Editor visuale per personalizzare il tema dello store
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ThemePreview } from './components/theme-preview'
import { SectionEditor } from './components/section-editor'
import { StyleEditor } from './components/style-editor'
import { CodeEditor } from './components/code-editor'
import { Save, Eye, Undo, Redo, Download, Upload } from 'lucide-react'

export default function ThemeEditorPage() {
  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // TODO: Save theme changes via API
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving theme:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    // TODO: Publish theme
    console.log('Publishing theme...')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-2xl font-bold">Theme Editor</h1>
            <p className="text-sm text-muted-foreground">
              Customize your store's appearance
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Undo className="h-4 w-4 mr-2" />
              Undo
            </Button>
            <Button variant="outline" size="sm">
              <Redo className="h-4 w-4 mr-2" />
              Redo
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || isSaving}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={handlePublish} size="sm">
              <Eye className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Controls */}
        <div className="w-80 border-r bg-muted/20 overflow-y-auto">
          <Tabs defaultValue="sections" className="h-full">
            <TabsList className="w-full grid grid-cols-3 rounded-none border-b">
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="styles">Styles</TabsTrigger>
              <TabsTrigger value="code">Code</TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="p-4 space-y-4">
              <SectionEditor onChange={() => setHasChanges(true)} />
            </TabsContent>

            <TabsContent value="styles" className="p-4 space-y-4">
              <StyleEditor onChange={() => setHasChanges(true)} />
            </TabsContent>

            <TabsContent value="code" className="p-4">
              <CodeEditor onChange={() => setHasChanges(true)} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Center - Preview */}
        <div className="flex-1 flex flex-col bg-muted/10">
          {/* Preview Controls */}
          <div className="border-b bg-background p-3 flex items-center justify-center gap-2">
            <Button
              variant={previewMode === 'desktop' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('desktop')}
            >
              Desktop
            </Button>
            <Button
              variant={previewMode === 'tablet' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('tablet')}
            >
              Tablet
            </Button>
            <Button
              variant={previewMode === 'mobile' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPreviewMode('mobile')}
            >
              Mobile
            </Button>
          </div>

          {/* Preview Frame */}
          <div className="flex-1 overflow-auto p-8">
            <ThemePreview mode={previewMode} />
          </div>
        </div>

        {/* Right Sidebar - Settings (Optional) */}
        <div className="w-64 border-l bg-muted/20 p-4 overflow-y-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Theme Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div>
                <span className="text-muted-foreground">Name:</span>
                <p className="font-medium">Default Theme</p>
              </div>
              <div>
                <span className="text-muted-foreground">Version:</span>
                <p className="font-medium">1.0.0</p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Modified:</span>
                <p className="font-medium">2 hours ago</p>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                Reset to Default
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Duplicate Theme
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Theme History
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
