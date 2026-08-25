/**
 * Filtro de seleção múltipla (equivalente ao `st.multiselect` do Streamlit).
 *
 * Mostra um botão com a contagem de itens escolhidos e, ao abrir, uma lista
 * pesquisável com caixas de seleção. Nada é filtrado aqui: o componente
 * apenas devolve a nova seleção para a página, que refiltra os dados.
 */

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Props {
  rotulo: string;
  opcoes: string[];
  selecionados: string[];
  onChange: (valores: string[]) => void;
}

export function MultiSelectFiltro({ rotulo, opcoes, selecionados, onChange }: Props) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");

  // Filtra as opções conforme o texto digitado na busca interna.
  const opcoesVisiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return opcoes;
    return opcoes.filter((o) => o.toLowerCase().includes(termo));
  }, [busca, opcoes]);

  const alternar = (valor: string) => {
    onChange(
      selecionados.includes(valor)
        ? selecionados.filter((v) => v !== valor)
        : [...selecionados, valor],
    );
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-wide text-sidebar-foreground/70 uppercase">
          {rotulo}
        </span>
        {selecionados.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground inline-flex items-center gap-1 text-[11px]"
          >
            <X className="size-3" /> limpar
          </button>
        )}
      </div>

      <Popover open={aberto} onOpenChange={setAberto}>
        <PopoverTrigger asChild>
          <Button variant="filtro" role="combobox" aria-expanded={aberto}>
            <span className="truncate">
              {selecionados.length === 0
                ? `Todos (${opcoes.length})`
                : `${selecionados.length} selecionado(s)`}
            </span>
            <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[320px] p-0">
          <div className="border-border/60 border-b p-2">
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar..."
              className="h-8"
            />
          </div>
          <ScrollArea className="h-64">
            <div className="p-1">
              {opcoesVisiveis.length === 0 && (
                <p className="text-muted-foreground p-3 text-sm">Nenhuma opção.</p>
              )}
              {opcoesVisiveis.map((opcao) => {
                const ativo = selecionados.includes(opcao);
                return (
                  <button
                    key={opcao}
                    type="button"
                    onClick={() => alternar(opcao)}
                    className={cn(
                      "hover:bg-accent flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm",
                      ativo && "bg-accent/60",
                    )}
                  >
                    <span
                      className={cn(
                        "border-border mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border",
                        ativo && "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {ativo && <Check className="size-3" />}
                    </span>
                    <span className="leading-snug">{opcao}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {selecionados.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {selecionados.slice(0, 3).map((valor) => (
            <Badge key={valor} variant="secondary" className="max-w-full truncate text-[10px]">
              {valor}
            </Badge>
          ))}
          {selecionados.length > 3 && (
            <Badge variant="outline" className="text-[10px]">
              +{selecionados.length - 3}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
