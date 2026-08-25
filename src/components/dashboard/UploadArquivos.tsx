/**
 * Área de upload dos dois CSVs (equivalente ao `st.file_uploader`).
 * O arquivo é lido no navegador; nada é enviado para servidores.
 */

import { CheckCircle2, FileSpreadsheet, Upload } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  titulo: string;
  descricao: string;
  nomeArquivo: string | null;
  quantidadeLinhas: number;
  onSelecionar: (file: File) => void;
}

export function UploadArquivos({
  titulo,
  descricao,
  nomeArquivo,
  quantidadeLinhas,
  onSelecionar,
}: Props) {
  const carregado = Boolean(nomeArquivo);

  return (
    <label
      className={cn(
        "border-sidebar-border hover:border-accent block cursor-pointer rounded-lg border border-dashed p-3 transition-colors",
        carregado && "border-accent/70 bg-sidebar-accent/40",
      )}
    >
      <input
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelecionar(file);
          // Limpa o valor para permitir reenviar o mesmo arquivo depois.
          event.target.value = "";
        }}
      />
      <div className="flex items-start gap-2.5">
        {carregado ? (
          <CheckCircle2 className="text-accent mt-0.5 size-4 shrink-0" />
        ) : (
          <Upload className="text-sidebar-foreground/60 mt-0.5 size-4 shrink-0" />
        )}
        <div className="min-w-0">
          <p className="text-sidebar-foreground text-xs font-semibold">{titulo}</p>
          {carregado ? (
            <p className="text-sidebar-foreground/70 mt-0.5 truncate text-[11px]">
              <FileSpreadsheet className="mr-1 inline size-3" />
              {nomeArquivo} · {quantidadeLinhas} linhas
            </p>
          ) : (
            <p className="text-sidebar-foreground/60 mt-0.5 text-[11px] leading-snug">
              {descricao}
            </p>
          )}
        </div>
      </div>
    </label>
  );
}
