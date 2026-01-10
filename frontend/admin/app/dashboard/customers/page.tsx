"use client";

import { DataTable } from "@/components/ui/data-table";
import { useDataTable } from "@/hooks/use-data-table";
import { customersColumns } from "./columns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Filter, Users } from "lucide-react";
import { api } from "@/lib/api";

export default function CustomersPage() {
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

      const response = await api.get(`/admin/customers/?${params}`);
      return response.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clienti</h1>
          <p className="text-muted-foreground">
            Gestisci i clienti del tuo store
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
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clienti Totali
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tutti i clienti</CardTitle>
          <CardDescription>
            Visualizza e gestisci tutti i clienti registrati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={customersColumns}
            data={data}
            pageCount={pageCount}
            pageIndex={pageIndex}
            pageSize={pageSize}
            onPaginationChange={handlePaginationChange}
            onSortingChange={handleSortingChange}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
            searchKey="email"
            searchPlaceholder="Cerca cliente..."
            total={total}
          />
        </CardContent>
      </Card>
    </div>
  );
}
