'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pagesApi } from '@/lib/api'
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
import { Plus, Search, Edit, Trash2, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

export default function PagesListPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data: pages, isLoading } = useQuery({
    queryKey: ['pages', { page, search }],
    queryFn: async () => {
      const response = await pagesApi.list({ page, per_page: 20, search })
      return response.data
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => pagesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pagine</h1>
          <p className="text-muted-foreground">
            Gestisci le pagine statiche del sito
          </p>
        </div>
        <Button onClick={() => router.push('/dashboard/pages/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Nuova Pagina
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca pagine..."
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
              <TableHead>Slug</TableHead>
              <TableHead>Stato</TableHead>
              <TableHead>Template</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Azioni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Caricamento...
                </TableCell>
              </TableRow>
            ) : pages?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  Nessuna pagina trovata
                </TableCell>
              </TableRow>
            ) : (
              pages?.data?.map((pageItem: any) => (
                <TableRow key={pageItem.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                      {pageItem.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{pageItem.slug}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={pageItem.is_published ? 'default' : 'secondary'}
                    >
                      {pageItem.is_published ? 'Pubblicata' : 'Bozza'}
                    </Badge>
                  </TableCell>
                  <TableCell>{pageItem.template || 'default'}</TableCell>
                  <TableCell>{formatDate(pageItem.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          router.push(`/dashboard/pages/${pageItem.id}`)
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (
                            confirm(
                              'Sei sicuro di voler eliminare questa pagina?'
                            )
                          ) {
                            deleteMutation.mutate(pageItem.id)
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

      {pages?.total_pages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Precedente
          </Button>
          <span className="text-sm">
            Pagina {page} di {pages.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= pages.total_pages}
          >
            Successiva
          </Button>
        </div>
      )}
    </div>
  )
}
