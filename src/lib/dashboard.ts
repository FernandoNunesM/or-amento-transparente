/**
 * Regras de negócio do Dashboard de Execução Orçamentária (SMDHC).
 *
 * Aqui ficam as "transformações de dados" — o equivalente ao trecho de um
 * script Python onde o pandas cria colunas derivadas, agrupa (groupby) e
 * soma valores. Nenhum componente visual entra neste arquivo, o que facilita
 * a manutenção: quem for ajustar cálculos mexe SOMENTE aqui.
 */

import { findColumn, getNumber, getText, uniqueValues, type Row } from "./csv";

/** Nomes dos meses usados nos dois arquivos. */
export const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export const MESES_CURTOS = [
  "JAN",
  "FEV",
  "MAR",
  "ABR",
  "MAI",
  "JUN",
  "JUL",
  "AGO",
  "SET",
  "OUT",
  "NOV",
  "DEZ",
] as const;

/** Dicas de cabeçalho para reconhecer cada arquivo na leitura. */
export const HINTS_CONTRATOS = ["Coordenação", "Fornecedor", "Contrato"];
export const HINTS_ORCAMENTO = ["Credor", "Valor Atualizado", "Processo"];

/** Mapa de colunas do Arquivo 1 — Controle Geral de Contratos. */
export interface ColunasContratos {
  coordenacao: string | null;
  tipo: string | null;
  categoria: string | null;
  fornecedor: string | null;
  contrato: string | null;
  processo: string | null;
  prazo: string | null;
  objeto: string | null;
  valorAssinado: string | null;
  dataVigencia: string | null;
  meses: (string | null)[];
}

/** Mapa de colunas do Arquivo 2 — Orçamento Detalhado. */
export interface ColunasOrcamento {
  orgao: string | null;
  unidade: string | null;
  tipoContratacao: string | null;
  objeto: string | null;
  credor: string | null;
  processo: string | null;
  valorInicial: string | null;
  valorAtualizado: string | null;
  valorReservado: string | null;
  valorEmpenhado: string | null;
  valorPago: string | null;
  totalNecessario: string | null;
  projMeses: (string | null)[];
  pagoMeses: (string | null)[];
  necessarioMeses: (string | null)[];
}

export function mapearColunasContratos(rows: Row[]): ColunasContratos {
  return {
    coordenacao: findColumn(rows, ["Coordenação"]),
    tipo: findColumn(rows, ["Tipo"]),
    categoria: findColumn(rows, ["Categoria"]),
    fornecedor: findColumn(rows, ["Fornecedor"]),
    contrato: findColumn(rows, ["Contrato"]),
    processo: findColumn(rows, ["Processo"]),
    prazo: findColumn(rows, ["Prazo meses"]),
    objeto: findColumn(rows, ["Objeto"]),
    valorAssinado: findColumn(rows, ["Valor assinado"]),
    dataVigencia: findColumn(rows, ["Data vigência"]),
    meses: MESES_CURTOS.map((m) => findColumn(rows, [m])),
  };
}

export function mapearColunasOrcamento(rows: Row[]): ColunasOrcamento {
  return {
    orgao: findColumn(rows, ["Órgão / Unidade"]),
    unidade: findColumn(rows, ["Unidade Gestora / Coordenação"]),
    tipoContratacao: findColumn(rows, ["Tipo de Contratação"]),
    objeto: findColumn(rows, ["Objeto da Despesa"]),
    credor: findColumn(rows, ["Credor"]),
    processo: findColumn(rows, ["Processo"]),
    valorInicial: findColumn(rows, ["Valor Inicial"]),
    valorAtualizado: findColumn(rows, ["Valor Atualizado"]),
    valorReservado: findColumn(rows, ["Valor Reservado"]),
    valorEmpenhado: findColumn(rows, ["Valor Empenhado"]),
    valorPago: findColumn(rows, ["Valor Pago"]),
    totalNecessario: findColumn(rows, ["Total_necessário", "Necessário_Total"]),
    projMeses: MESES.map((m) => findColumn(rows, [`Proj_${m}`])),
    pagoMeses: MESES.map((m) => findColumn(rows, [`Pago_${m}`])),
    necessarioMeses: MESES.map((m) => findColumn(rows, [`Necessário_${m}`])),
  };
}

/** Seleções ativas nos filtros globais da barra lateral. */
export interface Filtros {
  coordenacoes: string[];
  fornecedores: string[];
  processos: string[];
  tipos: string[];
}

export const FILTROS_VAZIOS: Filtros = {
  coordenacoes: [],
  fornecedores: [],
  processos: [],
  tipos: [],
};

/**
 * Regra de filtragem: um multiselect vazio significa "não filtrar".
 * Equivale, no pandas, a `df[df[col].isin(selecao)] if selecao else df`.
 */
function passa(valor: string, selecao: string[]): boolean {
  if (selecao.length === 0) return true;
  return selecao.includes(valor);
}

export function filtrarContratos(
  rows: Row[],
  cols: ColunasContratos,
  filtros: Filtros,
): Row[] {
  return rows.filter(
    (row) =>
      passa(getText(row, cols.coordenacao), filtros.coordenacoes) &&
      passa(getText(row, cols.fornecedor), filtros.fornecedores) &&
      passa(getText(row, cols.processo), filtros.processos) &&
      passa(getText(row, cols.tipo), filtros.tipos),
  );
}

export function filtrarOrcamento(
  rows: Row[],
  cols: ColunasOrcamento,
  filtros: Filtros,
): Row[] {
  return rows.filter(
    (row) =>
      passa(getText(row, cols.unidade), filtros.coordenacoes) &&
      passa(getText(row, cols.credor), filtros.fornecedores) &&
      passa(getText(row, cols.processo), filtros.processos) &&
      passa(getText(row, cols.tipoContratacao), filtros.tipos),
  );
}

/** Opções disponíveis nos filtros — união dos dois arquivos carregados. */
export function opcoesFiltros(
  contratos: Row[],
  colsContratos: ColunasContratos,
  orcamento: Row[],
  colsOrcamento: ColunasOrcamento,
) {
  const juntar = (a: string[], b: string[]) =>
    Array.from(new Set([...a, ...b])).sort((x, y) => x.localeCompare(y, "pt-BR"));

  return {
    coordenacoes: juntar(
      uniqueValues(contratos, colsContratos.coordenacao),
      uniqueValues(orcamento, colsOrcamento.unidade),
    ),
    fornecedores: juntar(
      uniqueValues(contratos, colsContratos.fornecedor),
      uniqueValues(orcamento, colsOrcamento.credor),
    ),
    processos: juntar(
      uniqueValues(contratos, colsContratos.processo),
      uniqueValues(orcamento, colsOrcamento.processo),
    ),
    tipos: juntar(
      uniqueValues(contratos, colsContratos.tipo),
      uniqueValues(orcamento, colsOrcamento.tipoContratacao),
    ),
  };
}

/** Indicadores principais (KPIs) calculados sobre o orçamento filtrado. */
export interface Kpis {
  atualizado: number;
  empenhado: number;
  pago: number;
  saldo: number;
  reservado: number;
  necessario: number;
  linhas: number;
}

export function calcularKpis(rows: Row[], cols: ColunasOrcamento): Kpis {
  const soma = (coluna: string | null) =>
    rows.reduce((acc, row) => acc + getNumber(row, coluna), 0);

  const atualizado = soma(cols.valorAtualizado);
  const empenhado = soma(cols.valorEmpenhado);
  const pago = soma(cols.valorPago);

  return {
    atualizado,
    empenhado,
    pago,
    // Saldo disponível = orçamento atualizado menos o que já foi empenhado.
    saldo: atualizado - empenhado,
    reservado: soma(cols.valorReservado),
    necessario: soma(cols.totalNecessario),
    linhas: rows.length,
  };
}

/** Série mensal: programado (a empenhar/pagar) x efetivamente pago. */
export function serieMensal(rows: Row[], cols: ColunasOrcamento) {
  return MESES.map((mes, indice) => {
    const programado = rows.reduce(
      (acc, row) =>
        acc +
        Math.max(
          getNumber(row, cols.projMeses[indice] ?? null),
          getNumber(row, cols.necessarioMeses[indice] ?? null),
        ),
      0,
    );
    const pago = rows.reduce(
      (acc, row) => acc + getNumber(row, cols.pagoMeses[indice] ?? null),
      0,
    );
    return {
      mes: MESES_CURTOS[indice],
      mesCompleto: mes,
      pago,
      // A parte ainda não paga do que estava programado no mês.
      aPagar: Math.max(programado - pago, 0),
      programado,
    };
  });
}

/**
 * Ranking (Top N) de maior consumo orçamentário.
 * Equivale a `df.groupby(coluna)["Valor Empenhado"].sum().nlargest(10)`.
 */
export function ranking(
  rows: Row[],
  colunaGrupo: string | null,
  colunaValor: string | null,
  limite = 10,
) {
  const mapa = new Map<string, number>();
  rows.forEach((row) => {
    const chave = getText(row, colunaGrupo) || "Não informado";
    mapa.set(chave, (mapa.get(chave) ?? 0) + getNumber(row, colunaValor));
  });
  return Array.from(mapa.entries())
    .map(([nome, valor]) => ({ nome, valor }))
    .filter((item) => item.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, limite);
}

/** Distribuição do orçamento por Tipo de Contratação (gráfico de rosca). */
export function distribuicaoPorTipo(rows: Row[], cols: ColunasOrcamento) {
  return ranking(rows, cols.tipoContratacao, cols.valorAtualizado, 8);
}

/** Uma linha das tabelas de realocação. */
export interface LinhaRealocacao {
  unidade: string;
  credor: string;
  processo: string;
  objeto: string;
  atualizado: number;
  necessario: number;
  diferenca: number;
}

/**
 * Previsões de realocação orçamentária.
 *
 * - Sobras:  Valor Atualizado > Total_necessário  (recurso liberável)
 * - Faltas:  Total_necessário > Valor Atualizado  (pressão orçamentária)
 *
 * A diferença é sempre apresentada em módulo para facilitar a leitura
 * gerencial de quanto pode sair de uma dotação e quanto falta na outra.
 */
export function calcularRealocacao(rows: Row[], cols: ColunasOrcamento) {
  const linhas: LinhaRealocacao[] = rows.map((row) => {
    const atualizado = getNumber(row, cols.valorAtualizado);
    const necessario = getNumber(row, cols.totalNecessario);
    return {
      unidade: getText(row, cols.unidade),
      credor: getText(row, cols.credor),
      processo: getText(row, cols.processo),
      objeto: getText(row, cols.objeto),
      atualizado,
      necessario,
      diferenca: atualizado - necessario,
    };
  });

  const sobras = linhas
    .filter((l) => l.diferenca > 0.01)
    .sort((a, b) => b.diferenca - a.diferenca);

  const faltas = linhas
    .filter((l) => l.diferenca < -0.01)
    .map((l) => ({ ...l, diferenca: Math.abs(l.diferenca) }))
    .sort((a, b) => b.diferenca - a.diferenca);

  const totalSobras = sobras.reduce((acc, l) => acc + l.diferenca, 0);
  const totalFaltas = faltas.reduce((acc, l) => acc + l.diferenca, 0);

  return { sobras, faltas, totalSobras, totalFaltas };
}
