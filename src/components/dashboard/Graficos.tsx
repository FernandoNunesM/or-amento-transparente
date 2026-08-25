/**
 * Representações gráficas da aba "Visão Geral".
 *
 * Usamos a biblioteca Recharts (equivalente ao plotly.express no Streamlit):
 *  1) Barras empilhadas: Pago x A pagar (programado) por mês
 *  2) Barras horizontais: Top 10 de maior consumo orçamentário
 *  3) Rosca (donut): distribuição por Tipo de Contratação
 */

import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL, formatCompact, type Row } from "@/lib/csv";
import {
  distribuicaoPorTipo,
  ranking,
  serieMensal,
  type ColunasOrcamento,
} from "@/lib/dashboard";

interface Props {
  orcamento: Row[];
  cols: ColunasOrcamento;
}

/** Cores vindas do design system (tokens --chart-1..5). */
const CORES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

/** Caixa de dica (tooltip) padronizada para todos os gráficos. */
function DicaValor({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border-border bg-popover text-popover-foreground rounded-md border p-2.5 text-xs shadow-lg">
      {label && <p className="mb-1 font-semibold">{label}</p>}
      {payload.map((item: any) => (
        <p key={item.name} className="tabular-nums">
          <span className="text-muted-foreground">{item.name}: </span>
          {formatBRL(Number(item.value))}
        </p>
      ))}
    </div>
  );
}

export function Graficos({ orcamento, cols }: Props) {
  // Permite alternar o ranking entre Coordenação (unidade gestora) e Credor.
  const [dimensaoRanking, setDimensaoRanking] = useState<"unidade" | "credor">("unidade");

  const mensal = serieMensal(orcamento, cols);
  const top10 = ranking(
    orcamento,
    dimensaoRanking === "unidade" ? cols.unidade : cols.credor,
    cols.valorEmpenhado,
    10,
  );
  const porTipo = distribuicaoPorTipo(orcamento, cols);
  const totalTipo = porTipo.reduce((acc, item) => acc + item.valor, 0);

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <Card className="xl:col-span-3">
        <CardHeader className="pb-2">
          <CardTitle>Execução mensal — Pago x Programado</CardTitle>
          <p className="text-muted-foreground text-xs">
            Barras empilhadas: parcela já paga e parcela ainda a pagar do valor programado
            para cada mês.
          </p>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mensal} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis
                tickFormatter={(v) => formatCompact(Number(v))}
                tick={{ fontSize: 10 }}
                stroke="var(--muted-foreground)"
                width={78}
              />
              <Tooltip content={<DicaValor />} cursor={{ fill: "var(--accent)", opacity: 0.25 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="pago" stackId="exec" name="Pago" fill="var(--chart-1)" radius={[0, 0, 3, 3]} />
              <Bar
                dataKey="aPagar"
                stackId="exec"
                name="A pagar (programado)"
                fill="var(--chart-4)"
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="xl:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle>Distribuição por Tipo de Contratação</CardTitle>
          <p className="text-muted-foreground text-xs">Soma do Valor Atualizado por tipo.</p>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={porTipo}
                dataKey="valor"
                nameKey="nome"
                innerRadius="52%"
                outerRadius="80%"
                paddingAngle={2}
                stroke="var(--card)"
              >
                {porTipo.map((item, i) => (
                  <Cell key={item.nome} fill={CORES[i % CORES.length]} />
                ))}
              </Pie>
              <Tooltip content={<DicaValor />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <p className="text-muted-foreground -mt-4 text-center text-xs tabular-nums">
            Total: {formatBRL(totalTipo)}
          </p>
        </CardContent>
      </Card>

      <Card className="xl:col-span-5">
        <CardHeader className="flex-row items-start justify-between gap-3 pb-2">
          <div>
            <CardTitle>
              Top 10 — maior consumo do orçamento (Valor Empenhado)
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Agrupamento por {dimensaoRanking === "unidade" ? "coordenação" : "credor"}.
            </p>
          </div>
          <div className="flex gap-1">
            <Button
              size="sm"
              variant={dimensaoRanking === "unidade" ? "default" : "outline"}
              onClick={() => setDimensaoRanking("unidade")}
            >
              Coordenação
            </Button>
            <Button
              size="sm"
              variant={dimensaoRanking === "credor" ? "default" : "outline"}
              onClick={() => setDimensaoRanking("credor")}
            >
              Credor
            </Button>
          </div>
        </CardHeader>
        <CardContent className="h-[380px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={top10}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v) => formatCompact(Number(v))}
                tick={{ fontSize: 10 }}
                stroke="var(--muted-foreground)"
              />
              <YAxis
                type="category"
                dataKey="nome"
                width={240}
                tick={{ fontSize: 10 }}
                stroke="var(--muted-foreground)"
              />
              <Tooltip content={<DicaValor />} cursor={{ fill: "var(--accent)", opacity: 0.25 }} />
              <Bar dataKey="valor" name="Empenhado" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
