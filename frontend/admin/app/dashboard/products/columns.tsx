"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Pencil, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "@/components/ui/data-table";
import { formatCurrency, formatDate } from "@/lib/utils";

export type Product = {
  id: number;
  name: string;
  sku: string;
  price: number;
  stock: number;
  status: "active" | "draft" | "archived";
  featured: boolean;
  created_at: string;
};

export const productsColumns: ColumnDef<Product>[] = [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => <div className="w-[50px]">{row.getValue("id")}</div>,
    enableSorting: true,
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nome" />
    ),
    cell: ({ row }) => {
      return (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{row.getValue("name")}</span>
          {row.original.featured && (
            <Badge variant="secondary" className="text-xs">
              Featured
            </Badge>
          )}
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => (
      <code className="text-sm bg-muted px-2 py-1 rounded">
        {row.getValue("sku")}
      </code>
    ),
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prezzo" />
    ),
    cell: ({ row }) => formatCurrency(row.getValue("price")),
    enableSorting: true,
  },
  {
    accessorKey: "stock",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stock" />
    ),
    cell: ({ row }) => {
      const stock = row.getValue("stock") as number;
      return (
        <div className="flex items-center">
          <span
            className={stock < 10 ? "text-red-600 font-medium" : ""}
          >
            {stock}
          </span>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const variants: Record<string, any> = {
        active: { label: "Attivo", variant: "default" },
        draft: { label: "Bozza", variant: "secondary" },
        archived: { label: "Archiviato", variant: "outline" },
      };
      const config = variants[status] || variants.draft;
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data creazione" />
    ),
    cell: ({ row }) => formatDate(row.getValue("created_at")),
    enableSorting: true,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Apri menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Azioni</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(product.id.toString())}
            >
              Copia ID
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              Visualizza
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Pencil className="mr-2 h-4 w-4" />
              Modifica
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Elimina
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
