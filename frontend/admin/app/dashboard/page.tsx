'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { 
  BarChart3, 
  FileText, 
  Users, 
  Image,
  ArrowUpRight,
  Eye,
  Calendar
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Stats {
  posts: number
  users: number
  media: number
  categories: number
}

interface RecentPost {
  id: number
  title: string
  created_at: string
  views: number
  author: {
    username: string
  }
}

export default function DashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get<Stats>('/stats')
      return response.data
    },
  })

  const { data: recentPosts } = useQuery({
    queryKey: ['recent-posts'],
    queryFn: async () => {
      const response = await api.get<RecentPost[]>('/posts/recent')
      return response.data
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Panoramica del tuo contenuto e statistiche
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Post</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.posts || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% dallo scorso mese
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utenti</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users || 0}</div>
            <p className="text-xs text-muted-foreground">
              +5% dallo scorso mese
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Media</CardTitle>
            <Image className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.media || 0}</div>
            <p className="text-xs text-muted-foreground">
              +23% dallo scorso mese
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorie</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.categories || 0}</div>
            <p className="text-xs text-muted-foreground">
              +2% dallo scorso mese
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Post Recenti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentPosts?.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <h3 className="font-medium">{post.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.created_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {post.views} visualizzazioni
                      </span>
                      <span>di {post.author.username}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Azioni Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Nuovo Post
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Image className="mr-2 h-4 w-4" />
              Carica Media
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Nuovo Utente
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              Visualizza Statistiche
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}