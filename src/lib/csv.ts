/**
 * Utilitários de leitura e tratamento dos CSVs do painel orçamentário.
 *
 * Este módulo cumpre o papel que, em um script Python, seria feito com
 * `pandas.read_csv(..., sep=";")` + limpeza de colunas monetárias.
 * Aqui a leitura acontece no NAVEGADOR (nada é enviado para servidor),
 * usando a biblioteca papaparse.
 *
 * Convenções dos arquivos da SMDHC:
 *  - Delimitador: ponto e vírgula (;)
 *  - Codificação: normalmente ANSI/Windows-1252 (acentos quebram em UTF-8)
 *  - O arquivo de Orçamento Detalhado tem linhas de "título" acima do
 *    cabeçalho real, por isso procuramos a linha de cabeçalho.
 */

import Papa from "papaparse";

/** Linha genérica: dicionário coluna -> texto original do CSV. */
export type Row = Record<string, string>;

/**
 * Decodifica o arquivo tentando UTF-8 e, se houver caracteres inválidos,
 * cai para Windows-1252 (padrão do Excel em português).
 */
async function decodeFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1252").decode(buffer);
  }
}

/**
 * Converte texto monetário brasileiro em número.
 * Exemplos aceitos: " R$ 1.234,56 ", "R$ -   ", "32.400,00", "4,50%", "".
 */
export function parseValor(raw: string | undefined | null): number {
  if (!raw) return 0;
  let text = String(raw).trim();
  if (!text) return 0;

  const isNegative = /^\(.*\)$/.test(text) || text.startsWith("-R$");
  text = text
    .replace(/R\$/gi, "")
    .replace(/%/g, "")
    .replace(/[()]/g, "")
    .replace(/\s/g, "");

  // "-" isolado significa zero nas planilhas do Excel.
  if (text === "" || text === "-" || text === "--") return 0;

  // Remove separador de milhar (.) e troca a vírgula decimal por ponto.
  text = text.replace(/\./g, "").replace(",", ".");
  const value = Number(text.replace(/[^0-9.-]/g, ""));
  if (Number.isNaN(value)) return 0;
  return isNegative ? -Math.abs(value) : value;
}

/** Formata número como moeda brasileira (R$ 1.234,56). */
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  });
}

/** Formata número de forma compacta para eixos de gráfico (R$ 1,2 mi). */
export function formatCompact(value: number): string {
  return `R$ ${value.toLocaleString("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  })}`;
}

/**
 * Lê um CSV e devolve as linhas já com o cabeçalho correto.
 *
 * @param file            arquivo escolhido pelo usuário
 * @param headerHints     nomes de colunas que identificam o cabeçalho real
 *                        (usado para pular linhas de título do Excel)
 */
export async function readCsv(file: File, headerHints: string[]): Promise<Row[]> {
  const text = await decodeFile(file);

  // 1ª passada: lê tudo como matriz, sem assumir onde está o cabeçalho.
  const matrix = Papa.parse<string[]>(text, {
    delimiter: ";",
    skipEmptyLines: false,
  }).data;

  // Procura, nas primeiras linhas, aquela que contém as colunas esperadas.
  const normalize = (s: string) => s.trim().toLowerCase();
  let headerIndex = 0;
  for (let i = 0; i < Math.min(matrix.length, 15); i++) {
    const cells = (matrix[i] ?? []).map(normalize);
    const found = headerHints.every((hint) =>
      cells.some((cell) => cell.includes(normalize(hint))),
    );
    if (found) {
      headerIndex = i;
      break;
    }
  }

  const headerRow = (matrix[headerIndex] ?? []).map((c, idx) => {
    const name = (c ?? "").trim();
    // Colunas sem nome recebem um rótulo técnico para não colidirem.
    return name || `coluna_${idx}`;
  });

  const rows: Row[] = [];
  for (let i = headerIndex + 1; i < matrix.length; i++) {
    const cells = matrix[i];
    if (!cells) continue;
    // Ignora linhas totalmente vazias (comuns no fim de planilhas).
    const hasContent = cells.some((c) => (c ?? "").trim() !== "");
    if (!hasContent) continue;

    const row: Row = {};
    headerRow.forEach((col, idx) => {
      row[col] = (cells[idx] ?? "").trim();
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Encontra o nome real de uma coluna a partir de possíveis variações.
 * Necessário porque a planilha pode vir com espaços extras
 * (ex.: " Valor assinado ") ou pequenas mudanças de grafia.
 */
export function findColumn(rows: Row[], candidates: string[]): string | null {
  if (rows.length === 0) return null;
  const keys = Object.keys(rows[0]!);
  const normalize = (s: string) => s.trim().toLowerCase();
  for (const candidate of candidates) {
    const hit = keys.find((k) => normalize(k) === normalize(candidate));
    if (hit) return hit;
  }
  for (const candidate of candidates) {
    const hit = keys.find((k) => normalize(k).includes(normalize(candidate)));
    if (hit) return hit;
  }
  return null;
}

/** Lê um campo pelo nome (tolerando espaços) e devolve texto limpo. */
export function getText(row: Row, column: string | null): string {
  if (!column) return "";
  return (row[column] ?? "").trim();
}

/** Lê um campo pelo nome e devolve número monetário. */
export function getNumber(row: Row, column: string | null): number {
  if (!column) return 0;
  return parseValor(row[column]);
}

/** Lista de valores distintos e ordenados de uma coluna (para os filtros). */
export function uniqueValues(rows: Row[], column: string | null): string[] {
  if (!column) return [];
  const set = new Set<string>();
  rows.forEach((row) => {
    const value = (row[column] ?? "").trim();
    if (value && value !== "-") set.add(value);
  });
  return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
}
