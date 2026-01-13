# Page Template - Guida Agente AI

## Linee Guida Generali

Quando crei pagine Next.js:
- **Layout:** Responsive e mobile-first
- **Performance:** Code splitting, lazy loading
- **SEO:** Meta tags, Open Graph
- **Accessibility:** WCAG AA compliant
- **UX:** Loading states, error boundaries
- **State:** React Query per data fetching

## Template Base Page

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Loader2, AlertCircle } from 'lucide-react'

import { api } from '@/lib/api'
import { useAuth } from '@/hooks/use-auth'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface PageData {
  id: number
  title: string
  // Add your data fields
}

export default function MyPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  // Fetch data
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<PageData>({
    queryKey: ['my-page-data'],
    queryFn: async () => {
      const response = await api.get('/my-endpoint')
      return response.data
    },
    enabled: isAuthenticated && !authLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Loading state
  if (authLoading || (isAuthenticated && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load data. {error instanceof Error && error.message}
          </AlertDescription>
        </Alert>
        <Button onClick={() => refetch()} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{data?.title}</h1>
        <p className="text-muted-foreground">Page description</p>
      </div>

      {/* Main content */}
      <div className="grid gap-6">
        {/* Add your content here */}
      </div>
    </div>
  )
}
```

## Template Page with Layout

```tsx
// app/dashboard/my-section/layout.tsx
'use client'

import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'

export default function SectionLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <aside className="lg:col-span-1">
        <Sidebar />
      </aside>
      <main className="lg:col-span-3">
        {children}
      </main>
    </div>
  )
}
```

## Template Page with Form

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'

import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'

// Validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  email: z.string().email('Invalid email'),
  age: z.number().min(18).max(120),
})

type FormData = z.infer<typeof formSchema>

export default function FormPage() {
  const { toast } = useToast()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  })

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/my-endpoint', data)
      return response.data
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Data saved successfully',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: FormData) => {
    mutation.mutate(data)
  }

  return (
    <div className="container max-w-md py-8">
      <Card>
        <CardHeader>
          <CardTitle>Form Title</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter name"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter email"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || mutation.isPending}
            >
              {isSubmitting || mutation.isPending ? 'Saving...' : 'Submit'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

## Template Page with Table

```tsx
'use client'

import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { api } from '@/lib/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Item {
  id: number
  name: string
  email: string
  createdAt: string
}

export default function TablePage() {
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['items', page],
    queryFn: async () => {
      const response = await api.get('/items', {
        params: {
          skip: (page - 1) * pageSize,
          limit: pageSize,
        },
      })
      return response.data
    },
  })

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : (
                  data?.map((item: Item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.id}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.email}</TableCell>
                      <TableCell>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-muted-foreground">
              Page {page}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

## SEO Metadata

```tsx
// app/my-page/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Page Title | Site Name',
  description: 'Page description for SEO',
  keywords: ['keyword1', 'keyword2'],
  openGraph: {
    title: 'My Page Title',
    description: 'Page description',
    url: 'https://example.com/my-page',
    type: 'website',
  },
}

export default function MyPage() {
  return (
    // Page content
  )
}
```

## Error Boundary

```tsx
// components/error-boundary.tsx
'use client'

import { ReactNode } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, retry: () => void) => ReactNode
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, { error: Error | null }> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught:', error, errorInfo)
  }

  retry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback?.(this.state.error, this.retry) || (
          <Alert variant="destructive">
            <AlertDescription>{this.state.error.message}</AlertDescription>
            <Button onClick={this.retry} variant="outline" size="sm" className="mt-4">
              Try Again
            </Button>
          </Alert>
        )
      )
    }

    return this.props.children
  }
}
```

## Performance Tips

### 1. Code Splitting
```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('./heavy-component'),
  { loading: () => <div>Loading...</div> }
)
```

### 2. Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/image.jpg"
  alt="Description"
  width={400}
  height={300}
  priority
/>
```

### 3. Lazy Loading
```tsx
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  enabled: shouldFetch, // Only fetch when needed
})
```

## Checklist Pagina

- [ ] Layout responsive
- [ ] Loading states
- [ ] Error handling
- [ ] Data fetching optimized
- [ ] SEO meta tags
- [ ] Accessibility (a11y)
- [ ] Performance checked
- [ ] Tests written
- [ ] No console errors
- [ ] Mobile tested

---

**Last Updated:** 2026-01-14
**For:** Agente AI - Page Creation
