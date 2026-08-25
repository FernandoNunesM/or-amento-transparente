/**
 * Exportação de relatórios (CSV e PDF).
 *
 * Substitui o `st.download_button` do Streamlit: aqui o arquivo é gerado
 * no próprio navegador e baixado pelo usuário.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { formatBRL, type Row } from "./csv";
import type { Kpis } from "./dashboard";

/** Dispara o download de um Blob com o nome informado. */
function baixar(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * Exporta as linhas filtradas em CSV com delimitador ";" — mesmo padrão
 * dos arquivos de origem, para reabrir no Excel sem ajustes.
 */
export function exportarCsv(rows: Row[], colunas: string[], nomeArquivo: string) {
  const escapar = (valor: string) => {
    const texto = (valor ?? "").replace(/"/g, '""');
    return /[;"\n]/.test(texto) ? `"${texto}"` : texto;
  };

  const linhas = [
    colunas.map(escapar).join(";"),
    ...rows.map((row) => colunas.map((col) => escapar(row[col] ?? "")).join(";")),
  ];

  // O BOM (\uFEFF) garante acentuação correta ao abrir no Excel.
  const blob = new Blob(["\uFEFF" + linhas.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  baixar(blob, nomeArquivo);
}

/** Colunas exibidas no PDF (rótulo + função que extrai o texto). */
export interface ColunaPdf {
  titulo: string;
  valor: (row: Row) => string;
}

/**
 * Gera um PDF de resumo: cabeçalho institucional, KPIs e tabela principal.
 * Limitamos a 60 linhas para manter o relatório enxuto e legível.
 */
export function exportarPdf(options: {
  titulo: string;
  kpis: Kpis;
  colunas: ColunaPdf[];
  rows: Row[];
  nomeArquivo: string;
}) {
  const { titulo, kpis, colunas, rows, nomeArquivo } = options;
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const larguraPagina = doc.internal.pageSize.getWidth();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(titulo, 40, 44);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(
    `Secretaria Municipal de Direitos Humanos e Cidadania - Contratos | Emitido em ${new Date().toLocaleString("pt-BR")}`,
    40,
    60,
  );

  // Bloco de KPIs em formato de tabela de duas colunas.
  autoTable(doc, {
    startY: 78,
    head: [["Indicador", "Valor"]],
    body: [
      ["Valor Atualizado", formatBRL(kpis.atualizado)],
      ["Valor Empenhado", formatBRL(kpis.empenhado)],
      ["Valor Pago", formatBRL(kpis.pago)],
      ["Saldo Disponível", formatBRL(kpis.saldo)],
      ["Total Necessário", formatBRL(kpis.necessario)],
      ["Registros considerados", String(kpis.linhas)],
    ],
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [17, 71, 79], textColor: 255 },
    tableWidth: larguraPagina / 2 - 40,
    margin: { left: 40 },
  });

  const posY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Tabela principal (dados filtrados)", 40, posY + 26);

  autoTable(doc, {
    startY: posY + 36,
    head: [colunas.map((c) => c.titulo)],
    body: rows.slice(0, 60).map((row) => colunas.map((c) => c.valor(row))),
    theme: "striped",
    styles: { fontSize: 7.5, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [17, 71, 79], textColor: 255 },
    margin: { left: 40, right: 40 },
  });

  if (rows.length > 60) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text(
      `Exibindo 60 de ${rows.length} registros. Utilize a exportação CSV para a base completa.`,
      40,
      doc.internal.pageSize.getHeight() - 24,
    );
  }

  doc.save(nomeArquivo);
}
