/**
 * Cartões de indicadores (equivalente ao `st.metric` do Streamlit).
 * Recebe os KPIs já calculados em src/lib/dashboard.ts — este componente
 * apenas apresenta os números.
 */

import { ArrowDownRight, ArrowUpRight, Landmark, Receipt, Wallet } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatBRL } from "@/lib/csv";
import type { Kpis } from "@/lib/dashboard";

interface Props {
  kpis: Kpis;
}

export function KpiCards({ kpis }: Props) {
  // Percentuais de execução ajudam a leitura gerencial dos valores absolutos.
  const percentual = (valor: number) =>
    kpis.atualizado > 0 ? `${((valor / kpis.atualizado) * 100).toFixed(1)}% do atualizado` : "—";

  const cartoes = [
    {
      titulo: "Valor Atualizado",
      valor: kpis.atualizado,
      apoio: `${kpis.linhas} registros filtrados`,
      Icone: Landmark,
      tom: "text-primary",
    },
    {
      titulo: "Valor Empenhado",
      valor: kpis.empenhado,
      apoio: percentual(kpis.empenhado),
      Icone: Receipt,
      tom: "text-chart-2",
    },
    {
      titulo: "Valor Pago",
      valor: kpis.pago,
      apoio: percentual(kpis.pago),
      Icone: ArrowUpRight,
      tom: "text-chart-3",
    },
    {
      titulo: "Saldo Disponível",
      valor: kpis.saldo,
      apoio: kpis.saldo < 0 ? "Pressão orçamentária" : percentual(kpis.saldo),
      Icone: kpis.saldo < 0 ? ArrowDownRight : Wallet,
      tom: kpis.saldo < 0 ? "text-destructive" : "text-chart-4",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cartoes.map(({ titulo, valor, apoio, Icone, tom }) => (
        <Card key={titulo} className="border-border/70 p-4">
          <div className="flex items-start justify-between gap-2">
            <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
              {titulo}
            </span>
            <Icone className={`size-4 ${tom}`} />
          </div>
          <p className="font-display mt-2 text-xl font-semibold tabular-nums lg:text-2xl">
            {formatBRL(valor)}
          </p>
          <p className="text-muted-foreground mt-1 text-xs">{apoio}</p>
        </Card>
      ))}
    </div>
  );
}
