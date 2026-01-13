/**
 * Analytics Dashboard Page
 * Grafici e metriche dettagliate
 */
'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { OverviewChart } from '@/components/dashboard/overview-chart'
import { StatCard } from '@/components/dashboard/stat-card'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ArrowDown, ArrowUp, DollarSign, Package, ShoppingCart, TrendingUp, Users } from 'lucide-react'

// Mock data
const salesData = [
  { name: 'Gen', sales: 4500, orders: 240, revenue: 4500 },
  { name: 'Feb', sales: 5200, orders: 310, revenue: 5200 },
  { name: 'Mar', sales: 4800, orders: 280, revenue: 4800 },
  { name: 'Apr', sales: 6100, orders: 350, revenue: 6100 },
  { name: 'Mag', sales: 5900, orders: 340, revenue: 5900 },
  { name: 'Giu', sales: 7200, orders: 420, revenue: 7200 },
]

const categoryData = [
  { name: 'Electronics', value: 4500, color: 'hsl(var(--chart-1))' },
  { name: 'Clothing', value: 3200, color: 'hsl(var(--chart-2))' },
  { name: 'Food', value: 2100, color: 'hsl(var(--chart-3))' },
  { name: 'Books', value: 1800, color: 'hsl(var(--chart-4))' },
  { name: 'Other', value: 1200, color: 'hsl(var(--chart-5))' },
]

const topProducts = [
  { name: 'Product A', sales: 890, revenue: 8900 },
  { name: 'Product B', sales: 756, revenue: 7560 },
  { name: 'Product C', sales: 623, revenue: 6230 },
  { name: 'Product D', sales: 512, revenue: 5120 },
  { name: 'Product E', sales: 445, revenue: 4450 },
]

export default function AnalyticsPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Entrate Totali"
          value="€87,543.21"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          description="rispetto al mese scorso"
        />
        <StatCard
          title="Ordini"
          value="1,234"
          icon={ShoppingCart}
          trend={{ value: 8.2, isPositive: true }}
          description="rispetto al mese scorso"
        />
        <StatCard
          title="Tasso di Conversione"
          value="3.24%"
          icon={TrendingUp}
          trend={{ value: -2.1, isPositive: false }}
          description="rispetto al mese scorso"
        />
        <StatCard
          title="Valore Medio Ordine"
          value="€70.89"
          icon={Package}
          trend={{ value: 5.3, isPositive: true }}
          description="rispetto al mese scorso"
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Entrate mensili</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Distribuzione vendite</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sales Trends</CardTitle>
              <CardDescription>Andamento vendite e ordini</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Prodotti più venduti</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Customer Growth</CardTitle>
                <CardDescription>Nuovi clienti nel tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Customer Metrics</CardTitle>
                <CardDescription>Metriche chiave clienti</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Lifetime Value</p>
                    <p className="text-2xl font-bold">€342.50</p>
                  </div>
                  <ArrowUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Retention Rate</p>
                    <p className="text-2xl font-bold">68%</p>
                  </div>
                  <ArrowUp className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Churn Rate</p>
                    <p className="text-2xl font-bold">12%</p>
                  </div>
                  <ArrowDown className="h-4 w-4 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
