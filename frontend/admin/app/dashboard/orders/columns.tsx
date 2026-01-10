"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, Eye, Truck, XCircle } from "lucide-react";
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

export type Order = {
  id: number;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: string;
  payment_status: string;
  total_amount: number;
  items_count: number;
  created_at: string;
  has_tracking: boolean;
};

const orderStatusMap: Record<string, { label: string; variant: any }> = {
  pending: { label: "In attesa", variant: "secondary" },
  paid: { label: "Pagato", variant: "default" },
  processing: { label: "In elaborazione", variant: "default" },
  shipped: { label: "Spedito", variant: "default" },
  delivered: { label: "Consegnato", variant: "default" },
  cancelled: { label: "Annullato", variant: "destructive" },
  refunded: { label: "Rimborsato", variant: "outline" },
};

const paymentStatusMap: Record<string, { label: string; variant: any }> = {
  pending: { label: "In attesa", variant: "secondary" },
  completed: { label: "Completato", variant: "default" },
  failed: { label: "Fallito", variant: "destructive" },
  refunded: { label: "Rimborsato", variant: "outline" },
};

export const ordersColumns: ColumnDef<Order>[] = [
  {
    accessorKey: "order_number",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Numero Ordine" />
    ),
    cell: ({ row }) => (
      <code className="text-sm font-medium">
        {row.getValue("order_number")}
      </code>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "customer_name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cliente" />
    ),
    cell: ({ row }) => {
      const order = row.original;
      return (
        <div>
          <div className="font-medium">{order.customer_name || "Guest"}</div>
          <div className="text-sm text-muted-foreground">
            {order.customer_email}
          </div>
        </div>
      );
    },
    enableSorting: true,
  },
  {
    accessorKey: "status",
    header: "Status Ordine",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const config = orderStatusMap[status] || orderStatusMap.pending;
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: "payment_status",
    header: "Pagamento",
    cell: ({ row }) => {
      const status = row.getValue("payment_status") as string;
      const config = paymentStatusMap[status] || paymentStatusMap.pending;
      return <Badge variant={config.variant}>{config.label}</Badge>;
    },
  },
  {
    accessorKey: "total_amount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Totale" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">
        {formatCurrency(row.getValue("total_amount"))}
      </span>
    ),
    enableSorting: true,
  },
  {
    accessorKey: "items_count",
    header: "Articoli",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.getValue("items_count")} articoli
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Data" />
    ),
    cell: ({ row }) => formatDate(row.getValue("created_at")),
    enableSorting: true,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const order = row.original;

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
            <DropdownMenuItem>
              <Eye className="mr-2 h-4 w-4" />
              Visualizza dettagli
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Truck className="mr-2 h-4 w-4" />
              Tracking spedizione
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <XCircle className="mr-2 h-4 w-4" />
              Annulla ordine
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
