"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Validation schema
const orderStatusFormSchema = z.object({
  status: z.enum(["pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded"]),
  note: z.string().optional(),
  send_notification: z.boolean().default(true),
});

type OrderStatusFormValues = z.infer<typeof orderStatusFormSchema>;

interface OrderStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: number;
  currentStatus: string;
  onSubmit: (data: OrderStatusFormValues) => Promise<void>;
}

export function OrderStatusDialog({
  open,
  onOpenChange,
  orderId,
  currentStatus,
  onSubmit,
}: OrderStatusDialogProps) {
  const form = useForm<OrderStatusFormValues>({
    resolver: zodResolver(orderStatusFormSchema),
    defaultValues: {
      status: currentStatus as any,
      note: "",
      send_notification: true,
    },
  });

  const isLoading = form.formState.isSubmitting;

  const handleSubmit = async (data: OrderStatusFormValues) => {
    try {
      await onSubmit(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Aggiorna Status Ordine</DialogTitle>
          <DialogDescription>
            Modifica lo status dell'ordine #{orderId}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nuovo Status *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleziona nuovo status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">In attesa</SelectItem>
                      <SelectItem value="paid">Pagato</SelectItem>
                      <SelectItem value="processing">In elaborazione</SelectItem>
                      <SelectItem value="shipped">Spedito</SelectItem>
                      <SelectItem value="delivered">Consegnato</SelectItem>
                      <SelectItem value="cancelled">Annullato</SelectItem>
                      <SelectItem value="refunded">Rimborsato</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nota (opzionale)</FormLabel>
                  <FormControl>
                    <Input placeholder="Aggiungi una nota..." {...field} />
                  </FormControl>
                  <FormDescription>
                    Verrà registrata nello storico dell'ordine
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Aggiorna Status
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
