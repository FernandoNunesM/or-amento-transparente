/**
 * Tabela de consulta genérica com busca e ordenação por coluna.
 * Cumpre o papel do `st.dataframe` / AgGrid: o usuário pode pesquisar
 * qualquer texto e clicar no cabeçalho para ordenar.
 */

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronsUpDown, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/** Definição de uma coluna exibida na tabela. */
export interface ColunaTabela<T> {
  chave: string;
  titulo: string;
  /** Texto exibido na célula. */
  texto: (item: T) => string;
  /** Valor usado na ordenação (número para colunas monetárias). */
  ordenar?: (item: T) => number | string;
  alinharDireita?: boolean;
  largura?: string;
}

interface Props<T> {
  dados: T[];
  colunas: ColunaTabela<T>[];
  vazio?: string;
  altura?: string;
}

export function TabelaDados<T>({
  dados,
  colunas,
  vazio = "Nenhum registro para os filtros selecionados.",
  altura = "h-[560px]",
}: Props<T>) {
  const [busca, setBusca] = useState("");
  const [ordem, setOrdem] = useState<{ chave: string; asc: boolean } | null>(null);

  // 1) Busca livre: concatena o texto de todas as colunas da linha.
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return dados;
    return dados.filter((item) =>
      colunas.some((col) => col.texto(item).toLowerCase().includes(termo)),
    );
  }, [busca, colunas, dados]);

  // 2) Ordenação: numérica quando a coluna informa `ordenar`.
  const ordenados = useMemo(() => {
    if (!ordem) return filtrados;
    const coluna = colunas.find((c) => c.chave === ordem.chave);
    if (!coluna) return filtrados;
    const valor = coluna.ordenar ?? ((item: T) => coluna.texto(item));
    return [...filtrados].sort((a, b) => {
      const va = valor(a);
      const vb = valor(b);
      const comparacao =
        typeof va === "number" && typeof vb === "number"
          ? va - vb
          : String(va).localeCompare(String(vb), "pt-BR");
      return ordem.asc ? comparacao : -comparacao;
    });
  }, [colunas, filtrados, ordem]);

  const alternarOrdem = (chave: string) =>
    setOrdem((atual) =>
      atual?.chave === chave ? { chave, asc: !atual.asc } : { chave, asc: true },
    );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="relative w-full max-w-sm">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar em todas as colunas..."
            className="pl-8"
          />
        </div>
        <span className="text-muted-foreground text-xs tabular-nums">
          {ordenados.length} de {dados.length} registros
        </span>
      </div>

      <ScrollArea className={cn("border-border rounded-lg border", altura)}>
        <table className="w-full border-collapse text-xs">
          <thead className="bg-secondary sticky top-0 z-10">
            <tr>
              {colunas.map((col) => {
                const ativo = ordem?.chave === col.chave;
                return (
                  <th
                    key={col.chave}
                    style={{ minWidth: col.largura }}
                    className={cn(
                      "border-border text-secondary-foreground border-b px-3 py-2 text-left font-semibold whitespace-nowrap",
                      col.alinharDireita && "text-right",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => alternarOrdem(col.chave)}
                      className={cn(
                        "inline-flex items-center gap-1 hover:underline",
                        col.alinharDireita && "flex-row-reverse",
                      )}
                    >
                      {col.titulo}
                      {ativo ? (
                        ordem!.asc ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ordenados.length === 0 && (
              <tr>
                <td
                  colSpan={colunas.length}
                  className="text-muted-foreground px-3 py-8 text-center"
                >
                  {vazio}
                </td>
              </tr>
            )}
            {ordenados.map((item, indice) => (
              <tr key={indice} className="hover:bg-accent/40 even:bg-muted/40">
                {colunas.map((col) => (
                  <td
                    key={col.chave}
                    className={cn(
                      "border-border/60 border-b px-3 py-2 align-top",
                      col.alinharDireita && "text-right tabular-nums",
                    )}
                  >
                    {col.texto(item) || "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
}
