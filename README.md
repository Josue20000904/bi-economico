# BI.ECONÔMICO

Painel econômico interativo que combina dados empresariais, indicadores macroeconômicos e métodos estatísticos para explorar o desempenho de empresas brasileiras e suas relações com a economia.

**Aplicação publicada:** [bi-economico.vercel.app](https://bi-economico.vercel.app)  
**Repositório:** [github.com/Josue20000904/bi-economico](https://github.com/Josue20000904/bi-economico)

## Objetivo

O BI.ECONÔMICO foi desenvolvido como projeto de portfólio em Business Intelligence e Ciência de Dados. A aplicação transforma séries financeiras e econômicas em uma experiência de análise acessível, permitindo observar evolução histórica, relações estatísticas, defasagens temporais e mudanças de comportamento.

## Funcionalidades

- Filtros por segmento, empresa, período, métrica, indicador econômico, defasagem e frequência;
- KPIs empresariais com comparação entre períodos;
- Série histórica com escalas independentes para empresa e economia;
- Correlação de Pearson em diferentes defasagens temporais;
- Seleção automática da maior associação absoluta válida;
- Gráfico de dispersão com regressão linear e coeficiente R²;
- Diagnóstico de tendência, volatilidade, variações e pontos atípicos;
- Identificação visual da origem real ou simulada de cada série;
- Interface responsiva em tema escuro.

## Escopo atual dos dados

| Conjunto                                     | Situação atual                      | Fonte                   |
| -------------------------------------------- | ----------------------------------- | ----------------------- |
| Receita líquida e lucro líquido da Petrobras | Dados históricos reais              | CVM                     |
| Selic, IPCA e câmbio                         | Séries reais                        | Banco Central do Brasil |
| EBITDA, margem e demais empresas             | Dados demonstrativos identificados  | Simulação               |
| Ibovespa, Brent e desemprego                 | Séries demonstrativas identificadas | Simulação               |

Os dados simulados permanecem explicitamente identificados na interface para não serem confundidos com informações oficiais.

## Metodologia estatística

### Correlação de Pearson

A aplicação calcula a associação linear entre a métrica empresarial e o indicador econômico. A interpretação utiliza o valor absoluto da correlação:

- Muito fraca: abaixo de 0,20;
- Fraca: de 0,20 a 0,39;
- Moderada: de 0,40 a 0,69;
- Forte: a partir de 0,70.

### Defasagem temporal

São avaliadas relações sem defasagem e com deslocamentos de 1, 2 e 4 períodos. A seleção automática considera a maior correlação absoluta entre os resultados com quantidade mínima de observações válidas.

### Regressão e diagnóstico

O laboratório de relações estima uma regressão linear simples, apresenta a linha de tendência e calcula o coeficiente R². O diagnóstico também avalia tendência histórica, variação acumulada, coeficiente de variação e observações atípicas por z-score.

> Correlação não implica causalidade. Os resultados têm caráter exploratório e devem ser interpretados junto ao contexto econômico e empresarial.

## Tecnologias

- Next.js com App Router;
- React;
- TypeScript;
- Tailwind CSS;
- Recharts;
- Lucide React;
- APIs e dados públicos da CVM e do Banco Central;
- Git, GitHub e Vercel.

## Estrutura principal

```text
src/
├── app/
│   └── api/economic-data/
├── components/
│   ├── charts/
│   ├── dashboard/
│   ├── filters/
│   └── ui/
├── data/
├── hooks/
├── lib/
└── types/
```

## Executar localmente

### Pré-requisitos

- Node.js 20 ou superior;
- npm.

### Instalação

```bash
git clone https://github.com/Josue20000904/bi-economico.git
cd bi-economico
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Verificações de qualidade

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Roadmap

- Ampliar a cobertura de empresas com dados reais da CVM;
- Adicionar comparação direta entre empresas do mesmo segmento;
- Expandir as integrações de indicadores econômicos;
- Evoluir a arquitetura de dados e persistência;
- Criar uma experiência exploratória 3D como módulo experimental;
- Avaliar modelos preditivos somente após consolidar dados históricos, validação e monitoramento.

## Uso responsável

Este projeto tem finalidade educacional, analítica e demonstrativa. As informações apresentadas não constituem recomendação de investimento, oferta de valores mobiliários ou aconselhamento financeiro.

## Autor

**Josue Honório**  
Contabilidade, Business Intelligence e Ciência de Dados.
