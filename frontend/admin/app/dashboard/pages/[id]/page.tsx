'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pagesApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Save } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function PageEditPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const pageId = params.id === 'new' ? null : Number(params.id)

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    template: 'default',
    is_published: false,
  })

  const { data: page, isLoading } = useQuery({
    queryKey: ['page', pageId],
    queryFn: async () => {
      if (!pageId) return null
      const response = await pagesApi.get(pageId)
      return response.data
    },
    enabled: !!pageId,
  })

  useEffect(() => {
    if (page) {
      setFormData({
        title: page.title || '',
        slug: page.slug || '',
        content: page.content || '',
        meta_description: page.meta_description || '',
        template: page.template || 'default',
        is_published: page.is_published || false,
      })
    }
  }, [page])

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      if (pageId) {
        return pagesApi.update(pageId, data)
      } else {
        return pagesApi.create(data)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      router.push('/dashboard/pages')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    saveMutation.mutate(formData)
  }

  if (isLoading) {
    return <div className="p-6">Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {pageId ? 'Modifica Pagina' : 'Nuova Pagina'}
          </h1>
          <p className="text-muted-foreground">
            {pageId ? 'Modifica i dettagli della pagina' : 'Crea una nuova pagina'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="title">Titolo *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meta_description">Meta Descrizione</Label>
          <Textarea
            id="meta_description"
            value={formData.meta_description}
            onChange={(e) =>
              setFormData({ ...formData, meta_description: e.target.value })
            }
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Contenuto *</Label>
          <Textarea
            id="content"
            value={formData.content}
            onChange={(e) =>
              setFormData({ ...formData, content: e.target.value })
            }
            rows={15}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="template">Template</Label>
          <Select
            value={formData.template}
            onValueChange={(value) =>
              setFormData({ ...formData, template: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="landing">Landing Page</SelectItem>
              <SelectItem value="full-width">Full Width</SelectItem>
              <SelectItem value="sidebar">Con Sidebar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="is_published"
            checked={formData.is_published}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_published: checked })
            }
          />
          <Label htmlFor="is_published">Pubblica</Label>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annulla
          </Button>
          <Button type="submit" disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? 'Salvataggio...' : 'Salva'}
          </Button>
        </div>
      </form>
    </div>
  )
}
