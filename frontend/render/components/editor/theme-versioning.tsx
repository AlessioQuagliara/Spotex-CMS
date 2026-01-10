"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  MoreVertical,
  Eye,
  RotateCcw,
  Download,
  Trash2,
  Save,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export interface ThemeVersion {
  id: string;
  version: string;
  name: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  status: "draft" | "published" | "archived";
  changes?: string[];
}

interface ThemeVersioningProps {
  versions: ThemeVersion[];
  currentVersionId?: string;
  onRestore: (versionId: string) => void;
  onPreview: (versionId: string) => void;
  onDelete: (versionId: string) => void;
  onPublish: (versionId: string) => void;
  onSaveNew: () => void;
  onDownload: (versionId: string) => void;
}

export function ThemeVersioning({
  versions,
  currentVersionId,
  onRestore,
  onPreview,
  onDelete,
  onPublish,
  onSaveNew,
  onDownload,
}: ThemeVersioningProps) {
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  const getStatusBadge = (status: ThemeVersion["status"]) => {
    const variants = {
      draft: "secondary",
      published: "default",
      archived: "outline",
    };
    const labels = {
      draft: "Bozza",
      published: "Pubblicato",
      archived: "Archiviato",
    };
    return (
      <Badge variant={variants[status] as any}>{labels[status]}</Badge>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 bg-background">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Versioni Tema</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Gestisci e ripristina versioni precedenti del tuo tema
            </p>
          </div>
          <Button onClick={onSaveNew}>
            <Save className="h-4 w-4 mr-2" />
            Salva Nuova Versione
          </Button>
        </div>
      </div>

      {/* Versions Table */}
      <div className="flex-1 overflow-auto p-4">
        {versions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nessuna versione salvata</p>
            <p className="text-sm mt-2">
              Salva la tua prima versione per iniziare il tracking
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Versione</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Descrizione</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Autore</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versions.map((version) => (
                <TableRow
                  key={version.id}
                  className={
                    version.id === currentVersionId ? "bg-primary/5" : ""
                  }
                >
                  <TableCell className="font-mono font-semibold">
                    {version.version}
                    {version.id === currentVersionId && (
                      <Badge variant="outline" className="ml-2">
                        Corrente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{version.name}</TableCell>
                  <TableCell className="max-w-md truncate text-muted-foreground text-sm">
                    {version.description || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(version.createdAt, "long")}
                  </TableCell>
                  <TableCell className="text-sm">
                    {version.createdBy}
                  </TableCell>
                  <TableCell>{getStatusBadge(version.status)}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => onPreview(version.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Anteprima
                        </DropdownMenuItem>
                        
                        {version.id !== currentVersionId && (
                          <DropdownMenuItem
                            onClick={() => onRestore(version.id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Ripristina
                          </DropdownMenuItem>
                        )}

                        {version.status === "draft" && (
                          <DropdownMenuItem
                            onClick={() => onPublish(version.id)}
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Pubblica
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuItem
                          onClick={() => onDownload(version.id)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Scarica
                        </DropdownMenuItem>

                        {version.status !== "published" && (
                          <DropdownMenuItem
                            onClick={() => onDelete(version.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
