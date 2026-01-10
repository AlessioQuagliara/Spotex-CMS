"use client";

import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { ordersColumns } from "./columns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Filter } from "lucide-react";
import { api } from "@/lib/api";

export default function OrdersPage() {
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
      const params = new URLSearchParams({
        store_id: "1", // TODO: Get from context
        page: page.toString(),
        per_page: perPage.toString(),
      });

      if (sortBy) {
        params.append("sort_by", sortBy);
        params.append("sort_order", sortOrder || "desc");
      }

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/admin/orders/?${params}`);
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ordini</h1>
          <p className="text-muted-foreground">
            Gestisci gli ordini del tuo store
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtri
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Esporta
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ordine Manuale
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tutti gli ordini</CardTitle>
          <CardDescription>
            Visualizza e gestisci tutti gli ordini ricevuti
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={ordersColumns}
            data={data}
            pageCount={pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPaginationChange={handlePaginationChange}
            onSortingChange={handleSortingChange}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
            searchKey="order_number"
            searchPlaceholder="Cerca per numero ordine..."
            total={total}
          />
        </CardContent>
      </Card>
    </div>
  );
}
