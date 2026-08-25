/**
 * Página única do "Dashboard de Execução Orçamentária - Contratos SMDHC".
 *
 * Organização (equivalente a um app Streamlit):
 *  - Barra lateral: upload dos dois CSVs + filtros globais
 *  - Área principal em abas: Visão Geral, Tabela de Contratos, Previsões de Realocação
 *
 * Todo o processamento acontece no navegador do usuário; os arquivos não
 * são enviados para nenhum servidor.
 */

import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Download, FileText, Filter, RotateCcw, TrendingDown, TrendingUp } from "lucide-react";

import { Graficos } from "@/components/dashboard/Graficos";
import { KpiCards } from "@/components/dashboard/KpiCards";
import { MultiSelectFiltro } from "@/components/dashboard/MultiSelectFiltro";
import { TabelaDados, type ColunaTabela } from "@/components/dashboard/TabelaDados";
import { UploadArquivos } from "@/components/dashboard/UploadArquivos";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatBRL, getNumber, getText, readCsv, type Row } from "@/lib/csv";
import {
  calcularKpis,
  calcularRealocacao,
  filtrarContratos,
  filtrarOrcamento,
  FILTROS_VAZIOS,
  HINTS_CONTRATOS,
  HINTS_ORCAMENTO,
  mapearColunasContratos,
  mapearColunasOrcamento,
  MESES_CURTOS,
  opcoesFiltros,
  type Filtros,
  type LinhaRealocacao,
} from "@/lib/dashboard";
import { exportarCsv, exportarPdf } from "@/lib/exportacao";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard de Execução Orçamentária — Contratos SMDHC" },
      {
        name: "description",
        content:
          "Painel gerencial da execução orçamentária de contratos da SMDHC: KPIs, gráficos interativos, tabela de contratos e previsões de realocação a partir de planilhas CSV.",
      },
      { property: "og:title", content: "Dashboard de Execução Orçamentária — Contratos SMDHC" },
      {
        property: "og:description",
        content:
          "Analise empenho, pagamento, saldo disponível e realocações orçamentárias dos contratos da SMDHC.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  // ---------------------------------------------------------------------
  // 1) Estado dos dados carregados (um "dataframe" por arquivo)
  // ---------------------------------------------------------------------
  const [contratos, setContratos] = useState<Row[]>([]);
  const [orcamento, setOrcamento] = useState<Row[]>([]);
  const [nomeContratos, setNomeContratos] = useState<string | null>(null);
  const [nomeOrcamento, setNomeOrcamento] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Seleções dos filtros globais.
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_VAZIOS);

  // ---------------------------------------------------------------------
  // 2) Mapeamento de colunas (tolerante a espaços e variações de grafia)
  // ---------------------------------------------------------------------
  const colsContratos = useMemo(() => mapearColunasContratos(contratos), [contratos]);
  const colsOrcamento = useMemo(() => mapearColunasOrcamento(orcamento), [orcamento]);

  // ---------------------------------------------------------------------
  // 3) Opções de filtro (união dos dois arquivos) e dados filtrados
  // ---------------------------------------------------------------------
  const opcoes = useMemo(
    () => opcoesFiltros(contratos, colsContratos, orcamento, colsOrcamento),
    [contratos, colsContratos, orcamento, colsOrcamento],
  );

  const contratosFiltrados = useMemo(
    () => filtrarContratos(contratos, colsContratos, filtros),
    [contratos, colsContratos, filtros],
  );
  const orcamentoFiltrado = useMemo(
    () => filtrarOrcamento(orcamento, colsOrcamento, filtros),
    [orcamento, colsOrcamento, filtros],
  );

  const kpis = useMemo(() => calcularKpis(orcamentoFiltrado, colsOrcamento), [
    orcamentoFiltrado,
    colsOrcamento,
  ]);
  const realocacao = useMemo(
    () => calcularRealocacao(orcamentoFiltrado, colsOrcamento),
    [orcamentoFiltrado, colsOrcamento],
  );

  const temDados = contratos.length > 0 || orcamento.length > 0;

  // ---------------------------------------------------------------------
  // 4) Leitura dos arquivos escolhidos na barra lateral
  // ---------------------------------------------------------------------
  async function carregar(file: File, tipo: "contratos" | "orcamento") {
    setErro(null);
    try {
      const hints = tipo === "contratos" ? HINTS_CONTRATOS : HINTS_ORCAMENTO;
      const rows = await readCsv(file, hints);
      if (rows.length === 0) {
        setErro(`O arquivo ${file.name} não retornou linhas. Verifique o delimitador (;).`);
        return;
      }
      if (tipo === "contratos") {
        setContratos(rows);
        setNomeContratos(file.name);
      } else {
        setOrcamento(rows);
        setNomeOrcamento(file.name);
      }
      // Sempre que uma base nova entra, os filtros antigos deixam de valer.
      setFiltros(FILTROS_VAZIOS);
    } catch (e) {
      setErro(`Falha ao ler ${file.name}: ${(e as Error).message}`);
    }
  }

  // ---------------------------------------------------------------------
  // 5) Definição das colunas exibidas na aba "Tabela de Contratos"
  // ---------------------------------------------------------------------
  const colunasTabelaContratos: ColunaTabela<Row>[] = useMemo(() => {
    const base: ColunaTabela<Row>[] = [
      { chave: "coord", titulo: "Coordenação", texto: (r) => getText(r, colsContratos.coordenacao), largura: "110px" },
      { chave: "tipo", titulo: "Tipo", texto: (r) => getText(r, colsContratos.tipo), largura: "140px" },
      { chave: "fornecedor", titulo: "Fornecedor", texto: (r) => getText(r, colsContratos.fornecedor), largura: "220px" },
      { chave: "contrato", titulo: "Contrato", texto: (r) => getText(r, colsContratos.contrato), largura: "130px" },
      { chave: "processo", titulo: "Processo", texto: (r) => getText(r, colsContratos.processo), largura: "160px" },
      {
        chave: "prazo",
        titulo: "Prazo (meses)",
        texto: (r) => getText(r, colsContratos.prazo),
        ordenar: (r) => getNumber(r, colsContratos.prazo),
        alinharDireita: true,
      },
      {
        chave: "valor",
        titulo: "Valor assinado",
        texto: (r) => formatBRL(getNumber(r, colsContratos.valorAssinado)),
        ordenar: (r) => getNumber(r, colsContratos.valorAssinado),
        alinharDireita: true,
        largura: "130px",
      },
      { chave: "vigencia", titulo: "Data vigência", texto: (r) => getText(r, colsContratos.dataVigencia), largura: "110px" },
    ];

    // Colunas mensais JAN..DEZ (valores de reajuste/desembolso previstos).
    const mensais: ColunaTabela<Row>[] = MESES_CURTOS.map((mes, indice) => ({
      chave: `mes-${mes}`,
      titulo: mes,
      texto: (r) => {
        const valor = getNumber(r, colsContratos.meses[indice] ?? null);
        return valor === 0 ? "—" : formatBRL(valor);
      },
      ordenar: (r) => getNumber(r, colsContratos.meses[indice] ?? null),
      alinharDireita: true,
      largura: "110px",
    }));

    return [...base, ...mensais];
  }, [colsContratos]);

  /** Colunas das tabelas de realocação (sobras e faltas). */
  const colunasRealocacao = (rotuloDiferenca: string): ColunaTabela<LinhaRealocacao>[] => [
    { chave: "unidade", titulo: "Unidade / Coordenação", texto: (l) => l.unidade, largura: "120px" },
    { chave: "credor", titulo: "Credor", texto: (l) => l.credor, largura: "200px" },
    { chave: "processo", titulo: "Processo", texto: (l) => l.processo, largura: "160px" },
    { chave: "objeto", titulo: "Objeto da Despesa", texto: (l) => l.objeto, largura: "300px" },
    {
      chave: "atualizado",
      titulo: "Valor Atualizado",
      texto: (l) => formatBRL(l.atualizado),
      ordenar: (l) => l.atualizado,
      alinharDireita: true,
      largura: "130px",
    },
    {
      chave: "necessario",
      titulo: "Total Necessário",
      texto: (l) => formatBRL(l.necessario),
      ordenar: (l) => l.necessario,
      alinharDireita: true,
      largura: "130px",
    },
    {
      chave: "diferenca",
      titulo: rotuloDiferenca,
      texto: (l) => formatBRL(l.diferenca),
      ordenar: (l) => l.diferenca,
      alinharDireita: true,
      largura: "130px",
    },
  ];

  // ---------------------------------------------------------------------
  // 6) Exportações (CSV das bases filtradas e PDF de resumo)
  // ---------------------------------------------------------------------
  function baixarCsvContratos() {
    if (contratosFiltrados.length === 0) return;
    exportarCsv(contratosFiltrados, Object.keys(contratosFiltrados[0]!), "contratos_filtrados.csv");
  }

  function baixarCsvOrcamento() {
    if (orcamentoFiltrado.length === 0) return;
    exportarCsv(orcamentoFiltrado, Object.keys(orcamentoFiltrado[0]!), "orcamento_filtrado.csv");
  }

  function baixarPdf() {
    const usaOrcamento = orcamentoFiltrado.length > 0;
    exportarPdf({
      titulo: "Execução Orçamentária — Contratos SMDHC",
      kpis,
      nomeArquivo: "resumo_execucao_orcamentaria.pdf",
      rows: usaOrcamento ? orcamentoFiltrado : contratosFiltrados,
      colunas: usaOrcamento
        ? [
            { titulo: "Unidade", valor: (r) => getText(r, colsOrcamento.unidade) },
            { titulo: "Credor", valor: (r) => getText(r, colsOrcamento.credor) },
            { titulo: "Processo", valor: (r) => getText(r, colsOrcamento.processo) },
            { titulo: "Atualizado", valor: (r) => formatBRL(getNumber(r, colsOrcamento.valorAtualizado)) },
            { titulo: "Empenhado", valor: (r) => formatBRL(getNumber(r, colsOrcamento.valorEmpenhado)) },
            { titulo: "Pago", valor: (r) => formatBRL(getNumber(r, colsOrcamento.valorPago)) },
            { titulo: "Necessário", valor: (r) => formatBRL(getNumber(r, colsOrcamento.totalNecessario)) },
          ]
        : [
            { titulo: "Coordenação", valor: (r) => getText(r, colsContratos.coordenacao) },
            { titulo: "Fornecedor", valor: (r) => getText(r, colsContratos.fornecedor) },
            { titulo: "Contrato", valor: (r) => getText(r, colsContratos.contrato) },
            { titulo: "Processo", valor: (r) => getText(r, colsContratos.processo) },
            { titulo: "Valor assinado", valor: (r) => formatBRL(getNumber(r, colsContratos.valorAssinado)) },
          ],
    });
  }

  return (
    <div className="bg-background flex min-h-screen flex-col lg:flex-row">
      {/* ================= BARRA LATERAL ================= */}
      <aside className="bg-sidebar text-sidebar-foreground border-sidebar-border w-full shrink-0 border-b p-4 lg:h-screen lg:w-[320px] lg:overflow-y-auto lg:border-r lg:border-b-0">
        <div className="mb-5">
          <p className="text-sidebar-primary text-[10px] font-semibold tracking-[0.18em] uppercase">
            SMDHC · Contratos
          </p>
          <h1 className="font-display text-sidebar-foreground mt-1 text-lg leading-tight font-semibold">
            Execução Orçamentária
          </h1>
          <p className="text-sidebar-foreground/60 mt-1 text-[11px] leading-snug">
            Carregue as planilhas CSV (delimitador “;”). O processamento ocorre apenas neste
            navegador.
          </p>
        </div>

        <div className="space-y-2.5">
          <UploadArquivos
            titulo="1. Controle Geral de Contratos"
            descricao="Coordenação, Fornecedor, Contrato, Valor assinado, JAN a DEZ."
            nomeArquivo={nomeContratos}
            quantidadeLinhas={contratos.length}
            onSelecionar={(file) => carregar(file, "contratos")}
          />
          <UploadArquivos
            titulo="2. Orçamento Detalhado"
            descricao="Órgão/Unidade, Credor, Valor Atualizado, Empenhado, Pago, Total necessário."
            nomeArquivo={nomeOrcamento}
            quantidadeLinhas={orcamento.length}
            onSelecionar={(file) => carregar(file, "orcamento")}
          />
        </div>

        {erro && (
          <p className="bg-destructive/15 text-destructive-foreground mt-3 rounded-md p-2 text-[11px]">
            <AlertTriangle className="mr-1 inline size-3" />
            {erro}
          </p>
        )}

        <div className="border-sidebar-border mt-6 border-t pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sidebar-foreground flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
              <Filter className="size-3.5" /> Filtros globais
            </h2>
            <button
              type="button"
              onClick={() => setFiltros(FILTROS_VAZIOS)}
              className="text-sidebar-foreground/60 hover:text-sidebar-foreground inline-flex items-center gap-1 text-[11px]"
            >
              <RotateCcw className="size-3" /> redefinir
            </button>
          </div>

          <div className="space-y-4">
            <MultiSelectFiltro
              rotulo="Coordenação / Unidade Gestora"
              opcoes={opcoes.coordenacoes}
              selecionados={filtros.coordenacoes}
              onChange={(v) => setFiltros((f) => ({ ...f, coordenacoes: v }))}
            />
            <MultiSelectFiltro
              rotulo="Fornecedor / Credor"
              opcoes={opcoes.fornecedores}
              selecionados={filtros.fornecedores}
              onChange={(v) => setFiltros((f) => ({ ...f, fornecedores: v }))}
            />
            <MultiSelectFiltro
              rotulo="Processo"
              opcoes={opcoes.processos}
              selecionados={filtros.processos}
              onChange={(v) => setFiltros((f) => ({ ...f, processos: v }))}
            />
            <MultiSelectFiltro
              rotulo="Tipo de Contratação"
              opcoes={opcoes.tipos}
              selecionados={filtros.tipos}
              onChange={(v) => setFiltros((f) => ({ ...f, tipos: v }))}
            />
          </div>
        </div>
      </aside>

      {/* ================= ÁREA PRINCIPAL ================= */}
      <main className="min-w-0 flex-1 p-4 lg:h-screen lg:overflow-y-auto lg:p-6">
        {!temDados ? (
          <EstadoVazio />
        ) : (
          <>
            <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-semibold">
                  Painel de execução e realocação
                </h2>
                <p className="text-muted-foreground text-xs">
                  {orcamentoFiltrado.length} linhas de orçamento · {contratosFiltrados.length}{" "}
                  contratos após filtros
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={baixarCsvOrcamento} disabled={!orcamentoFiltrado.length}>
                  <Download className="size-3.5" /> CSV orçamento
                </Button>
                <Button variant="outline" size="sm" onClick={baixarCsvContratos} disabled={!contratosFiltrados.length}>
                  <Download className="size-3.5" /> CSV contratos
                </Button>
                <Button variant="acento" size="sm" onClick={baixarPdf}>
                  <FileText className="size-3.5" /> Relatório PDF
                </Button>
              </div>
            </header>

            <Tabs defaultValue="visao">
              <TabsList>
                <TabsTrigger value="visao">Visão Geral</TabsTrigger>
                <TabsTrigger value="tabela">Tabela de Contratos</TabsTrigger>
                <TabsTrigger value="realocacao">Previsões de Realocação</TabsTrigger>
              </TabsList>

              {/* ---------- ABA 1: VISÃO GERAL ---------- */}
              <TabsContent value="visao" className="mt-4 space-y-4">
                {orcamento.length === 0 ? (
                  <Aviso texto="Carregue o arquivo de Orçamento Detalhado para ver KPIs e gráficos." />
                ) : (
                  <>
                    <KpiCards kpis={kpis} />
                    <Graficos orcamento={orcamentoFiltrado} cols={colsOrcamento} />
                  </>
                )}
              </TabsContent>

              {/* ---------- ABA 2: TABELA DE CONTRATOS ---------- */}
              <TabsContent value="tabela" className="mt-4">
                {contratos.length === 0 ? (
                  <Aviso texto="Carregue o arquivo de Controle Geral de Contratos para consultar a tabela." />
                ) : (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle>Contratos (dados filtrados)</CardTitle>
                      <p className="text-muted-foreground text-xs">
                        Clique no cabeçalho para ordenar e use a busca para localizar registros.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <TabelaDados dados={contratosFiltrados} colunas={colunasTabelaContratos} />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* ---------- ABA 3: PREVISÕES DE REALOCAÇÃO ---------- */}
              <TabsContent value="realocacao" className="mt-4 space-y-4">
                {orcamento.length === 0 ? (
                  <Aviso texto="Carregue o arquivo de Orçamento Detalhado para calcular sobras e faltas." />
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Card className="border-success/40 p-4">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="text-success size-4" />
                          <span className="text-muted-foreground text-[11px] font-semibold uppercase">
                            Total de sobras (liberável)
                          </span>
                        </div>
                        <p className="font-display mt-2 text-xl font-semibold tabular-nums">
                          {formatBRL(realocacao.totalSobras)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {realocacao.sobras.length} dotações com Valor Atualizado acima do
                          necessário
                        </p>
                      </Card>
                      <Card className="border-destructive/40 p-4">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="text-destructive size-4" />
                          <span className="text-muted-foreground text-[11px] font-semibold uppercase">
                            Total de faltas (pressão)
                          </span>
                        </div>
                        <p className="font-display mt-2 text-xl font-semibold tabular-nums">
                          {formatBRL(realocacao.totalFaltas)}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {realocacao.faltas.length} dotações com necessidade acima do orçamento
                        </p>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-success">
                          Sobras — Valor Atualizado &gt; Total Necessário
                        </CardTitle>
                        <p className="text-muted-foreground text-xs">
                          Recursos candidatos a remanejamento (origem).
                        </p>
                      </CardHeader>
                      <CardContent>
                        <TabelaDados
                          dados={realocacao.sobras}
                          colunas={colunasRealocacao("Sobra")}
                          altura="h-[340px]"
                          vazio="Nenhuma sobra identificada nos filtros atuais."
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-destructive">
                          Faltas — Total Necessário &gt; Valor Atualizado
                        </CardTitle>
                        <p className="text-muted-foreground text-xs">
                          Dotações que precisam de reforço orçamentário (destino).
                        </p>
                      </CardHeader>
                      <CardContent>
                        <TabelaDados
                          dados={realocacao.faltas}
                          colunas={colunasRealocacao("Falta")}
                          altura="h-[340px]"
                          vazio="Nenhuma pressão orçamentária identificada nos filtros atuais."
                        />
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}

/** Mensagem exibida quando falta uma das bases para a aba escolhida. */
function Aviso({ texto }: { texto: string }) {
  return (
    <div className="border-border bg-muted/40 text-muted-foreground rounded-lg border border-dashed p-6 text-center text-sm">
      {texto}
    </div>
  );
}

/** Tela inicial: instrução de uso enquanto nenhum arquivo foi carregado. */
function EstadoVazio() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="bg-secondary text-primary mb-4 flex size-14 items-center justify-center rounded-xl">
        <FileText className="size-7" />
      </div>
      <h2 className="font-display max-w-lg text-2xl font-semibold">
        Dashboard de Execução Orçamentária — Contratos SMDHC
      </h2>
      <p className="text-muted-foreground mt-2 max-w-xl text-sm">
        Envie na barra lateral os dois arquivos CSV (delimitador “;”): o Controle Geral de
        Contratos e o Orçamento Detalhado. Em seguida, use os filtros globais para analisar
        KPIs, gráficos, a tabela de contratos e as previsões de realocação.
      </p>
      <ul className="text-muted-foreground mt-5 grid gap-2 text-left text-xs sm:grid-cols-3">
        <li className="border-border bg-card rounded-lg border p-3">
          <strong className="text-foreground block">Visão Geral</strong>
          KPIs, execução mensal, Top 10 e distribuição por tipo.
        </li>
        <li className="border-border bg-card rounded-lg border p-3">
          <strong className="text-foreground block">Tabela de Contratos</strong>
          Busca livre e ordenação por qualquer coluna.
        </li>
        <li className="border-border bg-card rounded-lg border p-3">
          <strong className="text-foreground block">Realocação</strong>
          Sobras e faltas calculadas linha a linha.
        </li>
      </ul>
    </div>
  );
}
