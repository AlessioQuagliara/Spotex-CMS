/**
 * Orders Processing Page - Kanban Board
 * Dashboard kanban per gestione workflow ordini
 */

'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Package,
  Search,
  Filter,
  MoreVertical,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  User,
  MapPin,
} from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  orderNumber: string
  customer: {
    name: string
    email: string
  }
  status: string
  total: number
  itemCount: number
  createdAt: Date
  priority: 'low' | 'normal' | 'high'
  shippingCity: string
}

type OrderStatus = 'pending' | 'processing' | 'ready_to_ship' | 'shipped'

export default function OrdersProcessingPage() {
  // Mock orders data
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: '#ORD-001',
      customer: { name: 'Mario Rossi', email: 'mario@example.com' },
      status: 'pending',
      total: 150.0,
      itemCount: 3,
      createdAt: new Date('2026-01-11T09:30:00'),
      priority: 'high',
      shippingCity: 'Milano',
    },
    {
      id: '2',
      orderNumber: '#ORD-002',
      customer: { name: 'Laura Bianchi', email: 'laura@example.com' },
      status: 'pending',
      total: 89.99,
      itemCount: 2,
      createdAt: new Date('2026-01-11T10:15:00'),
      priority: 'normal',
      shippingCity: 'Roma',
    },
    {
      id: '3',
      orderNumber: '#ORD-003',
      customer: { name: 'Giuseppe Verdi', email: 'giuseppe@example.com' },
      status: 'processing',
      total: 320.5,
      itemCount: 5,
      createdAt: new Date('2026-01-11T08:45:00'),
      priority: 'high',
      shippingCity: 'Torino',
    },
    {
      id: '4',
      orderNumber: '#ORD-004',
      customer: { name: 'Anna Ferrari', email: 'anna@example.com' },
      status: 'processing',
      total: 199.99,
      itemCount: 4,
      createdAt: new Date('2026-01-11T07:20:00'),
      priority: 'normal',
      shippingCity: 'Napoli',
    },
    {
      id: '5',
      orderNumber: '#ORD-005',
      customer: { name: 'Marco Russo', email: 'marco@example.com' },
      status: 'ready_to_ship',
      total: 75.0,
      itemCount: 1,
      createdAt: new Date('2026-01-10T16:00:00'),
      priority: 'low',
      shippingCity: 'Bologna',
    },
    {
      id: '6',
      orderNumber: '#ORD-006',
      customer: { name: 'Elena Costa', email: 'elena@example.com' },
      status: 'shipped',
      total: 450.0,
      itemCount: 6,
      createdAt: new Date('2026-01-10T14:30:00'),
      priority: 'normal',
      shippingCity: 'Firenze',
    },
  ])

  const [searchQuery, setSearchQuery] = useState('')
  const [draggedOrder, setDraggedOrder] = useState<Order | null>(null)

  const columns: Array<{
    id: OrderStatus
    title: string
    icon: any
    color: string
  }> = [
    {
      id: 'pending',
      title: 'New Orders',
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      id: 'processing',
      title: 'Processing',
      icon: Package,
      color: 'bg-blue-500',
    },
    {
      id: 'ready_to_ship',
      title: 'Ready to Ship',
      icon: Truck,
      color: 'bg-purple-500',
    },
    {
      id: 'shipped',
      title: 'Shipped',
      icon: CheckCircle,
      color: 'bg-green-500',
    },
  ]

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders
      .filter((order) => order.status === status)
      .filter(
        (order) =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        // Sort by priority first
        const priorityOrder = { high: 0, normal: 1, low: 2 }
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
        if (priorityDiff !== 0) return priorityDiff
        // Then by date
        return b.createdAt.getTime() - a.createdAt.getTime()
      })
  }

  const handleDragStart = (order: Order) => {
    setDraggedOrder(order)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (newStatus: OrderStatus) => {
    if (!draggedOrder) return

    setOrders(
      orders.map((order) =>
        order.id === draggedOrder.id ? { ...order, status: newStatus } : order
      )
    )
    setDraggedOrder(null)
  }

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-700',
      normal: 'bg-blue-100 text-blue-700',
      low: 'bg-gray-100 text-gray-700',
    }
    return colors[priority as keyof typeof colors] || colors.normal
  }

  const getPriorityIcon = (priority: string) => {
    return priority === 'high' ? '🔴' : priority === 'low' ? '⚪' : '🔵'
  }

  const handleBulkFulfill = (status: OrderStatus) => {
    const ordersToFulfill = getOrdersByStatus(status)
    console.log('Bulk fulfill:', ordersToFulfill)
    // TODO: Implement bulk fulfillment
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b bg-background p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Order Processing</h1>
            <p className="text-muted-foreground">Manage order workflow with drag & drop</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders or customers..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6">
        <div className="grid grid-cols-4 gap-6 min-w-max">
          {columns.map((column) => {
            const columnOrders = getOrdersByStatus(column.id)
            const Icon = column.icon

            return (
              <div key={column.id} className="flex flex-col w-80">
                {/* Column Header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full ${column.color} bg-opacity-10 flex items-center justify-center`}
                      >
                        <Icon
                          className={`h-4 w-4 ${column.color.replace('bg-', 'text-')}`}
                        />
                      </div>
                      <h3 className="font-semibold">{column.title}</h3>
                    </div>
                    <Badge variant="secondary">{columnOrders.length}</Badge>
                  </div>
                  {columnOrders.length > 0 && column.id !== 'shipped' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => handleBulkFulfill(column.id)}
                    >
                      Process All
                    </Button>
                  )}
                </div>

                {/* Drop Zone */}
                <div
                  className="flex-1 space-y-3 min-h-[500px]"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(column.id)}
                >
                  {columnOrders.length === 0 ? (
                    <div className="flex items-center justify-center h-32 border-2 border-dashed rounded-lg text-muted-foreground">
                      Drop orders here
                    </div>
                  ) : (
                    columnOrders.map((order) => (
                      <Card
                        key={order.id}
                        className="cursor-move hover:shadow-lg transition-shadow"
                        draggable
                        onDragStart={() => handleDragStart(order)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <Link
                                href={`/dashboard/orders/${order.id}`}
                                className="font-semibold hover:underline"
                              >
                                {order.orderNumber}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge
                                  variant="secondary"
                                  className={getPriorityColor(order.priority)}
                                >
                                  {getPriorityIcon(order.priority)} {order.priority}
                                </Badge>
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem asChild>
                                  <Link href={`/dashboard/orders/${order.id}`}>
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem>Fulfill Order</DropdownMenuItem>
                                <DropdownMenuItem>Print Label</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive">
                                  Cancel Order
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              <span className="truncate">{order.customer.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{order.shippingCity}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Package className="h-4 w-4" />
                              <span>{order.itemCount} items</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-xs text-muted-foreground">
                                {order.createdAt.toLocaleTimeString('it-IT', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="font-bold">€{order.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="border-t bg-muted/30 p-4">
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          {columns.map((column) => {
            const count = getOrdersByStatus(column.id).length
            const total = getOrdersByStatus(column.id).reduce(
              (sum, order) => sum + order.total,
              0
            )
            return (
              <div key={column.id}>
                <div className="font-semibold">{count} orders</div>
                <div className="text-muted-foreground">€{total.toFixed(2)}</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
