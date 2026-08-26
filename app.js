// ---------- Configuração ----------
const inputApiUrl = "https://api-orc-v1.onrender.com";

function getApiUrl() {
    // remove barra final, se houver
    return inputApiUrl;
}

// ---------- Elementos ----------
const form = document.getElementById("formOrcamento");
const corpoProdutos = document.getElementById("corpoProdutos");
const templateLinhaProduto = document.getElementById("templateLinhaProduto");
const btnAddProduto = document.getElementById("btnAddProduto");
const totalPreview = document.getElementById("totalPreview");
const mensagemForm = document.getElementById("mensagemForm");

const corpoLista = document.getElementById("corpoLista");
const mensagemLista = document.getElementById("mensagemLista");
const btnAtualizarLista = document.getElementById("btnAtualizarLista");

// ---------- Formatação ----------
function formatarMoeda(valor) {
    return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(dataIso) {
    if (!dataIso) return "-";
    const [ano, mes, dia] = dataIso.split("-");
    return `${dia}/${mes}/${ano}`;
}

// ---------- Linhas de produto ----------
function adicionarLinhaProduto() {
    const fragmento = templateLinhaProduto.content.cloneNode(true);
    const linha = fragmento.querySelector("tr");

    linha.querySelector(".botao.remover").addEventListener("click", () => {
        linha.remove();
        atualizarTotalPreview();
    });

    linha.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", atualizarTotalPreview);
    });

    corpoProdutos.appendChild(linha);
}

function lerProdutosDoForm() {
    const linhas = corpoProdutos.querySelectorAll("tr");
    const produtos = [];

    linhas.forEach((linha) => {
        const nome = linha.querySelector(".input-nome").value.trim();
        const descricao = linha.querySelector(".input-descricao").value.trim();
        const quantidade = parseInt(linha.querySelector(".input-quantidade").value, 10);
        const valorUnitario = parseFloat(linha.querySelector(".input-valor").value);

        if (nome && quantidade > 0 && valorUnitario > 0) {
            produtos.push({ nome, descricao, quantidade, valorUnitario });
        }
    });

    return produtos;
}

function atualizarTotalPreview() {
    const produtos = lerProdutosDoForm();
    const total = produtos.reduce((soma, p) => soma + p.quantidade * p.valorUnitario, 0);
    totalPreview.textContent = formatarMoeda(total);
}

// ---------- Mensagens ----------
function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = "mensagem " + (tipo || "");
}

// ---------- Criar orçamento ----------
async function criarOrcamento(evento) {
    evento.preventDefault();
    mostrarMensagem(mensagemForm, "", "");

    const produtos = lerProdutosDoForm();

    if (produtos.length === 0) {
        mostrarMensagem(mensagemForm, "Adicione ao menos um produto válido.", "erro");
        return;
    }

    const payload = {
        nomeCliente: document.getElementById("nomeCliente").value.trim(),
        nomeVendedor: document.getElementById("nomeVendedor").value.trim(),
        cpfCnpj: document.getElementById("cpfCnpj").value.trim(),
        dataValidade: document.getElementById("dataValidade").value,
        produtos: produtos,
    };

    try {
        const resposta = await fetch(`${getApiUrl()}/orcamentos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => null);
            throw new Error(erro && erro.mensagem ? erro.mensagem : `Erro HTTP ${resposta.status}`);
        }

        const orcamentoCriado = await resposta.json();
        mostrarMensagem(mensagemForm, `Orçamento criado com sucesso! ID: ${orcamentoCriado.id}`, "sucesso");

        form.reset();
        corpoProdutos.innerHTML = "";
        adicionarLinhaProduto();
        atualizarTotalPreview();

        carregarListaOrcamentos();
    } catch (erro) {
        mostrarMensagem(mensagemForm, `Falha ao criar orçamento: ${erro.message}`, "erro");
    }
}

// ---------- Listar orçamentos ----------
async function carregarListaOrcamentos() {
    mostrarMensagem(mensagemLista, "Carregando...", "");
    corpoLista.innerHTML = "";

    try {
        const resposta = await fetch(`${getApiUrl()}/orcamentos`);
        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }

        const orcamentos = await resposta.json();

        if (orcamentos.length === 0) {
            mostrarMensagem(mensagemLista, "Nenhum orçamento cadastrado ainda.", "");
            return;
        }

        mostrarMensagem(mensagemLista, "", "");

        orcamentos.forEach((orcamento) => {
            const total = (orcamento.produtos || []).reduce(
                (soma, p) => soma + p.quantidade * p.valorUnitario,
                0
            );

            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${escapeHtml(orcamento.nomeCliente)}</td>
                <td>${escapeHtml(orcamento.nomeVendedor)}</td>
                <td>${escapeHtml(orcamento.cpfCnpj)}</td>
                <td>${formatarData(orcamento.dataValidade)}</td>
                <td>${formatarMoeda(total)}</td>
                <td class="acoes-linha"></td>
            `;

            const celulaAcoes = linha.querySelector(".acoes-linha");

            const btnBaixarPdf = document.createElement("button");
            btnBaixarPdf.textContent = "Baixar PDF";
            btnBaixarPdf.className = "botao link";
            btnBaixarPdf.addEventListener("click", () => baixarPdf(orcamento.id));

            celulaAcoes.appendChild(btnBaixarPdf);

            corpoLista.appendChild(linha);
        });
    } catch (erro) {
        mostrarMensagem(mensagemLista, `Falha ao carregar orçamentos: ${erro.message}`, "erro");
    }
}

function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto || "";
    return div.innerHTML;
}

// ---------- PDF ----------
function abrirPdf(id) {
    window.open(`${getApiUrl()}/orcamentos/${id}/pdf`, "_blank");
}

async function baixarPdf(id) {
    try {
        const resposta = await fetch(`${getApiUrl()}/orcamentos/${id}/pdf`);
        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }
        const blob = await resposta.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `orcamento-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (erro) {
        mostrarMensagem(mensagemLista, `Falha ao baixar PDF: ${erro.message}`, "erro");
    }
}

// ---------- Inicialização ----------
form.addEventListener("submit", criarOrcamento);
btnAddProduto.addEventListener("click", adicionarLinhaProduto);
btnAtualizarLista.addEventListener("click", carregarListaOrcamentos);

adicionarLinhaProduto();
atualizarTotalPreview();
carregarListaOrcamentos();
