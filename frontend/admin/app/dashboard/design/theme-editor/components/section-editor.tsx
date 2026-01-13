/**
 * Section Editor Component
 * Gestione sezioni con drag & drop
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Plus, GripVertical, Trash2, Settings2 } from 'lucide-react'

interface Section {
  id: string
  type: string
  name: string
  settings: Record<string, any>
}

interface SectionEditorProps {
  onChange?: () => void
}

export function SectionEditor({ onChange }: SectionEditorProps) {
  const [sections, setSections] = useState<Section[]>([
    { id: '1', type: 'hero', name: 'Hero Banner', settings: {} },
    { id: '2', type: 'featured-products', name: 'Featured Products', settings: {} },
    { id: '3', type: 'newsletter', name: 'Newsletter', settings: {} },
  ])

  const [selectedSection, setSelectedSection] = useState<string | null>(null)

  const availableSections = [
    { type: 'hero', name: 'Hero Banner', icon: '🎯' },
    { type: 'featured-products', name: 'Featured Products', icon: '⭐' },
    { type: 'image-with-text', name: 'Image with Text', icon: '🖼️' },
    { type: 'collection-list', name: 'Collection List', icon: '📚' },
    { type: 'testimonials', name: 'Testimonials', icon: '💬' },
    { type: 'newsletter', name: 'Newsletter', icon: '📧' },
  ]

  const handleAddSection = (type: string, name: string) => {
    const newSection: Section = {
      id: Date.now().toString(),
      type,
      name,
      settings: {},
    }
    setSections([...sections, newSection])
    onChange?.()
  }

  const handleRemoveSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id))
    if (selectedSection === id) {
      setSelectedSection(null)
    }
    onChange?.()
  }

  const handleMoveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex((s) => s.id === id)
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return
    }

    const newSections = [...sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newSections[index], newSections[targetIndex]] = [
      newSections[targetIndex],
      newSections[index],
    ]

    setSections(newSections)
    onChange?.()
  }

  return (
    <div className="space-y-4">
      {/* Current Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Page Sections</CardTitle>
          <CardDescription className="text-xs">
            Drag to reorder, click to edit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSection === section.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedSection(section.id)}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{section.name}</p>
                    <p className="text-xs text-muted-foreground">{section.type}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMoveSection(section.id, 'up')
                      }}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMoveSection(section.id, 'down')
                      }}
                      disabled={index === sections.length - 1}
                    >
                      ↓
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveSection(section.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}

              {sections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sections added yet
                </p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Section Settings */}
      {selectedSection && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Section Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="section-heading">Heading</Label>
              <Input
                id="section-heading"
                placeholder="Enter heading"
                onChange={onChange}
              />
            </div>
            <div>
              <Label htmlFor="section-subheading">Subheading</Label>
              <Input
                id="section-subheading"
                placeholder="Enter subheading"
                onChange={onChange}
              />
            </div>
            <Button variant="outline" size="sm" className="w-full">
              <Settings2 className="h-4 w-4 mr-2" />
              Advanced Settings
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Available Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Add Section</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {availableSections.map((section) => (
              <Button
                key={section.type}
                variant="outline"
                size="sm"
                className="h-auto flex flex-col items-start p-3"
                onClick={() => handleAddSection(section.type, section.name)}
              >
                <span className="text-2xl mb-1">{section.icon}</span>
                <span className="text-xs">{section.name}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
