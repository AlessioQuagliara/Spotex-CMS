/**
 * Code Editor Component
 * Editor per CSS e JS personalizzati
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface CodeEditorProps {
  onChange?: () => void
}

export function CodeEditor({ onChange }: CodeEditorProps) {
  const [customCSS, setCustomCSS] = useState('')
  const [customJS, setCustomJS] = useState('')

  const handleCSSChange = (value: string) => {
    setCustomCSS(value)
    onChange?.()
  }

  const handleJSChange = (value: string) => {
    setCustomJS(value)
    onChange?.()
  }

  return (
    <div className="space-y-4">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Advanced users only. Custom code may affect theme functionality.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="css" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="css">Custom CSS</TabsTrigger>
          <TabsTrigger value="js">Custom JS</TabsTrigger>
        </TabsList>

        <TabsContent value="css" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Custom CSS</CardTitle>
              <CardDescription className="text-xs">
                Add your own CSS styles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-64 p-3 font-mono text-xs border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="/* Add your custom CSS here */&#10;&#10;.custom-class {&#10;  color: #667eea;&#10;  font-weight: bold;&#10;}"
                value={customCSS}
                onChange={(e) => handleCSSChange(e.target.value)}
              />
              <div className="mt-4 space-y-2">
                <p className="text-xs text-muted-foreground">
                  Use CSS variables from theme:
                </p>
                <code className="block text-xs bg-muted p-2 rounded">
                  var(--color-primary)
                  <br />
                  var(--font-heading)
                  <br />
                  var(--spacing-md)
                  <br />
                  var(--radius-lg)
                </code>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="js" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Custom JavaScript</CardTitle>
              <CardDescription className="text-xs">
                Add custom functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="w-full h-64 p-3 font-mono text-xs border rounded-md bg-muted/30 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="// Add your custom JavaScript here&#10;&#10;document.addEventListener('DOMContentLoaded', function() {&#10;  console.log('Custom JS loaded');&#10;});"
                value={customJS}
                onChange={(e) => handleJSChange(e.target.value)}
              />
              <div className="mt-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Be careful with custom JavaScript. It may break your store if not properly tested.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Code Snippets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            Sticky Header
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            Smooth Scroll
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            Custom Animations
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start text-xs">
            Cookie Banner
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
