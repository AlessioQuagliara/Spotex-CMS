'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatFileSize, formatDate } from '@/lib/utils'
import {
  Upload,
  Search,
  Image as ImageIcon,
  File,
  Video,
  Music,
  Trash2,
  Download,
  Eye,
} from 'lucide-react'

interface MediaItem {
  id: number
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  media_type: 'image' | 'video' | 'document' | 'audio'
  alt_text?: string
  created_at: string
}

export default function MediaPage() {
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const queryClient = useQueryClient()

  const { data: media, isLoading } = useQuery({
    queryKey: ['media', search],
    queryFn: async () => {
      const response = await api.get<MediaItem[]>('/media', {
        params: { search },
      })
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/media/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] })
    },
  })

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const formData = new FormData()
    
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    try {
      await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      queryClient.invalidateQueries({ queryKey: ['media'] })
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-8 w-8" />
      case 'video':
        return <Video className="h-8 w-8" />
      case 'audio':
        return <Music className="h-8 w-8" />
      default:
        return <File className="h-8 w-8" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Media</h1>
          <p className="text-muted-foreground">
            Gestisci immagini, video e documenti
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cerca media..."
              className="w-[200px] pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button asChild>
            <label className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Uploading...' : 'Carica'}
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleUpload}
                disabled={uploading}
              />
            </label>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-40 bg-muted rounded-lg" />
              </CardContent>
            </Card>
          ))
        ) : media?.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-8 text-center">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 font-semibold">Nessun media</h3>
              <p className="text-sm text-muted-foreground">
                Carica il tuo primo file
              </p>
            </CardContent>
          </Card>
        ) : (
          media?.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="relative group">
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center mb-3 overflow-hidden">
                    {item.media_type === 'image' ? (
                      <img
                        src={`http://localhost:8000/uploads/${item.file_path}`}
                        alt={item.alt_text || item.original_filename}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="p-4">
                        {getMediaIcon(item.media_type)}
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1">
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="secondary" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        className="h-8 w-8"
                        onClick={() => deleteMutation.mutate(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-medium text-sm truncate">
                    {item.original_filename}
                  </h4>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <Badge variant="outline" className="capitalize">
                      {item.media_type}
                    </Badge>
                    <span>{formatFileSize(item.file_size)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {formatDate(item.created_at)}
                  </p>
                  {item.alt_text && (
                    <p className="text-xs text-muted-foreground truncate">
                      {item.alt_text}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}