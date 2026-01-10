'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Filter,
} from 'lucide-react'

interface Post {
  id: number
  title: string
  slug: string
  excerpt?: string
  is_published: boolean
  published_at?: string
  views: number
  created_at: string
  author: {
    username: string
  }
  category?: {
    name: string
  }
}

export default function PostsPage() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', page, search],
    queryFn: async () => {
      const response = await api.get<Post[]>('/posts', {
        params: { skip: (page - 1) * 10, limit: 10, search },
      })
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/posts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const togglePublishMutation = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      api.patch(`/posts/${id}`, { is_published: published }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Post</h1>
          <p className="text-muted-foreground">
            Gestisci tutti i post del tuo sito
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Post
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tutti i Post</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cerca post..."
                  className="w-[200px] pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titolo</TableHead>
                <TableHead>Autore</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Stato</TableHead>
                <TableHead>Visualizzazioni</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Caricamento...
                  </TableCell>
                </TableRow>
              ) : posts?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Nessun post trovato
                  </TableCell>
                </TableRow>
              ) : (
                posts?.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{post.title}</span>
                        <span className="text-xs text-muted-foreground">
                          /{post.slug}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{post.author.username}</TableCell>
                    <TableCell>
                      {post.category?.name || (
                        <span className="text-muted-foreground">Nessuna</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={post.is_published ? 'default' : 'secondary'}
                        className="capitalize"
                      >
                        {post.is_published ? 'Pubblicato' : 'Bozza'}
                      </Badge>
                    </TableCell>
                    <TableCell>{post.views}</TableCell>
                    <TableCell>{formatDate(post.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Azioni</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Visualizza
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              togglePublishMutation.mutate({
                                id: post.id,
                                published: !post.is_published,
                              })
                            }
                          >
                            {post.is_published ? 'Metti in bozza' : 'Pubblica'}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => deleteMutation.mutate(post.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}