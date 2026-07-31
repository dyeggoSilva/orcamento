# Front-end — Orçamentos

Front-end simples em HTML + CSS + JS puro (sem frameworks, sem build), feito
para consumir a API `orcamento-api`.

## Como rodar

Basta abrir o `index.html` direto no navegador (duplo clique) **ou**, se
preferir, servir com qualquer servidor estático simples:

```bash
# Python 3
python3 -m http.server 5500

# ou, com Node instalado
npx serve .
```

Depois acesse `http://localhost:5500`.

> Abrir direto pelo `file://` funciona porque o backend já está configurado
> com CORS liberado (`CorsConfig.java`). Se preferir mais segurança, sirva
> via um servidor estático mesmo assim.

## Pré-requisito

O backend (`orcamento-api`) precisa estar rodando, por padrão em
`http://localhost:8080`. Se estiver em outra porta/host, ajuste o campo
**"URL da API"** no topo da página — ele já vem preenchido com
`http://localhost:8080`.

## O que a tela faz

- Formulário para criar um orçamento: dados do cliente + lista dinâmica de
  produtos (adicionar/remover linhas), com total estimado calculado em tempo
  real.
- Ao enviar, chama `POST /orcamentos` e mostra o ID gerado.
- Lista todos os orçamentos (`GET /orcamentos`) em uma tabela, com o total de
  cada um calculado no próprio front.
- Para cada orçamento: **"Ver PDF"** abre o PDF em uma nova aba
  (`GET /orcamentos/{id}/pdf`) e **"Baixar PDF"** força o download do
  arquivo.

## Arquivos

```
index.html   # estrutura da página (formulário + tabela de orçamentos)
style.css    # estilos
app.js       # toda a lógica: fetch para a API, renderização da lista, PDF
```

Não há dependências externas, bundlers ou frameworks — é só abrir e usar.
