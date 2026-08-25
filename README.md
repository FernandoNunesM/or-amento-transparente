# Orçamento Transparente

Crie uma aplicação web chamada "Dashboard de Execução Orçamentária - Contratos SMDHC". Você deve atuar como um engenheiro de software especialista em Python, com foco em análise de dados usando Pandas e desenvolvimento web com Streamlit e Plotly.

1. Contexto e Objetivo
A aplicação é um painel de controle financeiro e gerencial para a execução orçamentária da Secretaria Municipal de Direitos Humanos e Cidadania de São Paulo (SMDHC), focado na área de Contratos. Todo o frontend e backend devem ser unificados em Python usando a biblioteca Streamlit. O código deve ser extremamente claro, modular e amplamente comentado (didático), para que futuros mantenedores com conhecimentos fundamentais de Python possam atualizá-lo de forma prática.

2. Estrutura de Ingestão e Processamento de Dados (Pandas)
Crie uma barra lateral (st.sidebar) com um componente st.file_uploader permitindo o upload de dois arquivos CSV principais (delimitador ;). Utilize o pandas para ler e tratar os dados no cache (@st.cache_data para otimização).

Arquivo 1 (Controle Geral de Contratos): Colunas principais: Coordenação, Tipo, Fornecedor, Contrato, Prazo meses, Valor assinado, Data vigência, e valores mensais (JAN a DEZ).

Arquivo 2 (Orçamento Detalhado): Colunas principais: Órgão / Unidade, Objeto da Despesa, Credor, Processo, Valor Inicial, Valor Atualizado, Valor Reservado, Valor Empenhado, Valor Pago, Total_necessário.

3. Interface de Usuário (UI) no Streamlit
A interface deve usar os componentes nativos do Streamlit com um layout organizado.

Menu Lateral: Upload de arquivos e Filtros Globais.

Área Principal: Dividida em abas usando st.tabs: ["Visão Geral", "Tabela de Contratos", "Previsões de Realocação"].

4. Funcionalidades Principais

A. Filtros Avançados (Sidebar):
Crie multiselects (st.multiselect) dinâmicos na barra lateral para: Coordenação / Unidade Gestora, Fornecedor / Credor, Processo e Tipo de Contratação. Os dataframes devem ser filtrados em tempo real com base nessas seleções, refletindo em todas as abas.

B. Representações Gráficas (Aba Visão Geral):
Utilize plotly.express para gráficos interativos e st.metric para KPIs:

KPIs: Exibir cartões lado a lado com a soma de "Valor Atualizado", "Valor Empenhado", "Valor Pago" e "Saldo Disponível".

Gráfico de Barras Empilhadas: Comparação de "Valor Empenhado" vs "Valor Pago" ao longo dos meses.

Gráfico de Barras Horizontal: Top 10 Coordenações ou Fornecedores com maior consumo do orçamento.

Gráfico de Donut (Pie): Distribuição do orçamento por "Tipo de Contratação".

C. Tabela de Consulta (Aba Tabela de Contratos):
Utilize st.dataframe ou a integração do AgGrid para exibir os dados filtrados em formato de tabela, permitindo ao usuário ordenar colunas e buscar dados internamente de forma fluida.

D. Previsões de Realocação (Aba de Realocação - Lógica em Python):
Crie uma lógica robusta usando operações do Pandas baseadas no Arquivo 2:

Identificar Sobras: Filtrar linhas onde o Valor Atualizado é maior que o Total_necessário.

Identificar Faltas (Pressão): Filtrar linhas onde o Total_necessário ultrapassa o Valor Atualizado.

Exibir em duas tabelas separadas usando st.dataframe para facilitar a decisão de remanejamento.

E. Exportação de Relatórios:

Inclua botões st.download_button para exportar os dados atualmente filtrados em formato CSV.

Adicione uma função para gerar um PDF simples contendo o resumo dos KPIs e a tabela principal (pode utilizar bibliotecas como fpdf ou pdfkit).

5. Requisitos de Qualidade do Código:

Organize o código em funções (ex: load_data(), create_kpis(), plot_charts()) para manter a legibilidade.

Inclua docstrings e comentários explicativos em português detalhando a lógica do Pandas e as decisões de interface, pensando em um ambiente de desenvolvimento colaborativo e focado em aprendizado prático.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/0b59571d-b856-4bc6-b679-5de8492dee48).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
