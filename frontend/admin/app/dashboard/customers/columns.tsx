"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, User, Mail, ShoppingBag } from "lucide-react";
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

export type Customer = {
  id: number;
  email: string;
  name: string;
  phone: string;
  status: string;
  orders_count: number;
  total_spent: number;
  average_order_value: number;
  last_order_at: string | null;
  created_at: string;
  tags: string[];
};

const statusMap: Record<string, { label: string; variant: any }> = {
  active: { label: "Attivo", variant: "default" },
  inactive: { label: "Inattivo", variant: "secondary" },
  blocked: { label: "Bloccato", variant: "destructive" },
};

export const customersColumns: ColumnDef<Customer>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cliente" />
    ),
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="font-medium">{customer.name || "Guest"}</div>
            <div className="text-sm text-muted-foreground flex items-center">
              <Mail className="mr-1 h-3 w-3" />
              {customer.email}
            </div>
          </div>
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
      const config = statusMap[status] || statusMap.active;
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: "orders_count",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ordini" />
    ),
    cell: ({ row }) => (
      <div className="flex items-center">
        <ShoppingBag className="mr-2 h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{row.getValue("orders_count")}</span>
      </div>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "total_spent",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Totale speso" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {formatCurrency(row.getValue("total_spent"))}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "average_order_value",
    header: "AOV",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {formatCurrency(row.getValue("average_order_value"))}
      </span>
    ),
  },
  {
    accessorKey: "last_order_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Ultimo ordine" />
    ),
    cell: ({ row }) => {
      const date = row.getValue("last_order_at");
      return date ? formatDate(date as string) : "-";
    },
    enableSorting: true,
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Registrato" />
    ),
    cell: ({ row }) => formatDate(row.getValue("created_at")),
    enableSorting: true,
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string[];
      if (!tags || tags.length === 0) return null;
      return (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {tags.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{tags.length - 2}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const customer = row.original;

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
            <DropdownMenuItem>Visualizza profilo</DropdownMenuItem>
            <DropdownMenuItem>Storico ordini</DropdownMenuItem>
            <DropdownMenuItem>Invia email</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Blocca cliente
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
