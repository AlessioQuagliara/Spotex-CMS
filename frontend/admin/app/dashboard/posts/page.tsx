'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { postsApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export default function PostsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', { page, search }],
    queryFn: async () => {
      const response = await postsApi.list({ page, per_page: 20, search })
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => postsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Posts</h1>
          <p className="text-muted-foreground">
            Gestisci i contenuti del blog
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/posts/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuovo Post
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca posts..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border">
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
            ) : posts?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  Nessun post trovato
                </TableCell>
              </TableRow>
            ) : (
              posts?.data?.map((post: any) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{post.author?.username || 'N/A'}</TableCell>
                  <TableCell>{post.category?.name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={post.is_published ? 'default' : 'secondary'}>
                      {post.is_published ? 'Pubblicato' : 'Bozza'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Eye className="mr-1 h-3 w-3" />
                      {post.views || 0}
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(post.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/dashboard/posts/${post.id}`)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm('Sei sicuro di voler eliminare questo post?')) {
                            deleteMutation.mutate(post.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {posts?.total_pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Precedente
          </Button>
          <span className="text-sm">
            Pagina {page} di {posts.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => p + 1)}
            disabled={page >= posts.total_pages}
          >
            Successiva
          </Button>
        </div>
      )}
    </div>
  )
}
