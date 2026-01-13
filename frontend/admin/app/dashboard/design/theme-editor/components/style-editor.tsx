/**
 * Style Editor Component
 * Editor per personalizzare colori, font, spacing
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface StyleEditorProps {
  onChange?: () => void
}

export function StyleEditor({ onChange }: StyleEditorProps) {
  return (
    <Tabs defaultValue="colors" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="colors">Colors</TabsTrigger>
        <TabsTrigger value="typography">Typography</TabsTrigger>
        <TabsTrigger value="layout">Layout</TabsTrigger>
      </TabsList>

      <TabsContent value="colors" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  defaultValue="#667eea"
                  className="h-10 w-16"
                  onChange={onChange}
                />
                <Input
                  type="text"
                  defaultValue="#667eea"
                  className="flex-1"
                  onChange={onChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  defaultValue="#764ba2"
                  className="h-10 w-16"
                  onChange={onChange}
                />
                <Input
                  type="text"
                  defaultValue="#764ba2"
                  className="flex-1"
                  onChange={onChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="accent-color">Accent Color</Label>
              <div className="flex gap-2">
                <Input
                  id="accent-color"
                  type="color"
                  defaultValue="#f093fb"
                  className="h-10 w-16"
                  onChange={onChange}
                />
                <Input
                  type="text"
                  defaultValue="#f093fb"
                  className="flex-1"
                  onChange={onChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Background Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="bg-color">Background</Label>
              <div className="flex gap-2">
                <Input
                  id="bg-color"
                  type="color"
                  defaultValue="#ffffff"
                  className="h-10 w-16"
                  onChange={onChange}
                />
                <Input
                  type="text"
                  defaultValue="#ffffff"
                  className="flex-1"
                  onChange={onChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fg-color">Foreground</Label>
              <div className="flex gap-2">
                <Input
                  id="fg-color"
                  type="color"
                  defaultValue="#000000"
                  className="h-10 w-16"
                  onChange={onChange}
                />
                <Input
                  type="text"
                  defaultValue="#000000"
                  className="flex-1"
                  onChange={onChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="typography" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Fonts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="heading-font">Heading Font</Label>
              <Select onValueChange={onChange}>
                <SelectTrigger id="heading-font">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="poppins">Poppins</SelectItem>
                  <SelectItem value="montserrat">Montserrat</SelectItem>
                  <SelectItem value="playfair">Playfair Display</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body-font">Body Font</Label>
              <Select onValueChange={onChange}>
                <SelectTrigger id="body-font">
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inter">Inter</SelectItem>
                  <SelectItem value="roboto">Roboto</SelectItem>
                  <SelectItem value="open-sans">Open Sans</SelectItem>
                  <SelectItem value="lato">Lato</SelectItem>
                  <SelectItem value="nunito">Nunito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Font Sizes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="base-size">Base Size</Label>
                <span className="text-sm text-muted-foreground">16px</span>
              </div>
              <Slider
                id="base-size"
                min={12}
                max={20}
                step={1}
                defaultValue={[16]}
                onValueChange={onChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="heading-scale">Heading Scale</Label>
                <span className="text-sm text-muted-foreground">1.5</span>
              </div>
              <Slider
                id="heading-scale"
                min={1.2}
                max={2}
                step={0.1}
                defaultValue={[1.5]}
                onValueChange={onChange}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="layout" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Container</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="container-width">Max Width</Label>
              <Select onValueChange={onChange}>
                <SelectTrigger id="container-width">
                  <SelectValue placeholder="Select width" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1280">1280px</SelectItem>
                  <SelectItem value="1440">1440px</SelectItem>
                  <SelectItem value="1600">1600px</SelectItem>
                  <SelectItem value="full">Full Width</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Spacing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="section-spacing">Section Spacing</Label>
                <span className="text-sm text-muted-foreground">48px</span>
              </div>
              <Slider
                id="section-spacing"
                min={24}
                max={96}
                step={8}
                defaultValue={[48]}
                onValueChange={onChange}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="element-spacing">Element Spacing</Label>
                <span className="text-sm text-muted-foreground">16px</span>
              </div>
              <Slider
                id="element-spacing"
                min={8}
                max={32}
                step={4}
                defaultValue={[16]}
                onValueChange={onChange}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Border Radius</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="border-radius">Radius</Label>
                <span className="text-sm text-muted-foreground">8px</span>
              </div>
              <Slider
                id="border-radius"
                min={0}
                max={24}
                step={2}
                defaultValue={[8]}
                onValueChange={onChange}
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
