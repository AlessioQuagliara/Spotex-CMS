"use client";

import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { productsColumns } from "./columns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { api } from "@/lib/api";

export default function ProductsPage() {
  const {
    data,
    pageIndex,
    pageSize,
    pageCount,
    total,
    isLoading,
    handlePaginationChange,
    handleSortingChange,
    handleFilterChange,
    refresh,
  } = useDataTable({
    initialPageSize: 20,
    onFetch: async ({ page, perPage, sortBy, sortOrder, filters }) => {
      // Build query params
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (sortBy) {
        params.append("sort_by", sortBy);
        params.append("sort_order", sortOrder || "asc");
      }

      // Add filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/admin/products/advanced-filter?${params}`);
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prodotti</h1>
          <p className="text-muted-foreground">
            Gestisci i prodotti del tuo store
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuovo Prodotto
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tutti i prodotti</CardTitle>
          <CardDescription>
            Visualizza e gestisci tutti i prodotti del catalogo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={productsColumns}
            data={data}
            pageCount={pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPaginationChange={handlePaginationChange}
            onSortingChange={handleSortingChange}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
            searchKey="name"
            searchPlaceholder="Cerca prodotto..."
            total={total}
          />
        </CardContent>
      </Card>
    </div>
  );
}
