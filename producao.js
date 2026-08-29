// ---------- Configuração ----------
const inputApiUrl = "10.100.3.52";

function getApiUrl() {
    return inputApiUrl;
}

// ---------- Elementos ----------
const form = document.getElementById("formProducao");
const corpoPedidos = document.getElementById("corpoPedidos");
const templateLinhaPedido = document.getElementById("templateLinhaPedido");
const btnAddPedido = document.getElementById("btnAddPedido");
const totalPedidosPreview = document.getElementById("totalPedidosPreview");
const mensagemForm = document.getElementById("mensagemForm");

const corpoLista = document.getElementById("corpoLista");
const mensagemLista = document.getElementById("mensagemLista");
const btnAtualizarLista = document.getElementById("btnAtualizarLista");

// ---------- Formatação ----------
function formatarData(dataIso) {
    if (!dataIso) return "-";
    const [ano, mes, dia] = dataIso.split("-");
    return `${dia}/${mes}/${ano}`;
}

function escapeHtml(texto) {
    const div = document.createElement("div");
    div.textContent = texto || "";
    return div.innerHTML;
}

// ---------- Linhas de pedido ----------
function adicionarLinhaPedido() {
    const fragmento = templateLinhaPedido.content.cloneNode(true);
    const linha = fragmento.querySelector("tr");

    linha.querySelector(".botao.remover").addEventListener("click", () => {
        linha.remove();
        atualizarTotalPedidosPreview();
    });

    linha.querySelectorAll("input").forEach((input) => {
        input.addEventListener("input", atualizarTotalPedidosPreview);
    });

    corpoPedidos.appendChild(linha);
}

function lerPedidosDoForm() {
    const linhas = corpoPedidos.querySelectorAll("tr");
    const pedidos = [];

    linhas.forEach((linha) => {
        const nomeCliente = linha.querySelector(".input-pedido-cliente").value.trim();
        const descricaoItem = linha.querySelector(".input-pedido-item").value.trim();
        const quantidade = parseInt(linha.querySelector(".input-pedido-quantidade").value, 10);

        if (nomeCliente && descricaoItem && quantidade > 0) {
            pedidos.push({ nomeCliente, descricaoItem, quantidade });
        }
    });

    return pedidos;
}

function atualizarTotalPedidosPreview() {
    const pedidos = lerPedidosDoForm();
    const total = pedidos.reduce((soma, p) => soma + p.quantidade, 0);
    totalPedidosPreview.textContent = total;
}

// ---------- Mensagens ----------
function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = "mensagem " + (tipo || "");
}

// ---------- Criar produção ----------
async function criarProducao(evento) {
    evento.preventDefault();
    mostrarMensagem(mensagemForm, "", "");

    const pedidos = lerPedidosDoForm();

    if (pedidos.length === 0) {
        mostrarMensagem(mensagemForm, "Adicione ao menos um pedido válido.", "erro");
        return;
    }

    const payload = {
        nomeOperador: document.getElementById("nomeOperador").value.trim(),
        setor: document.getElementById("setor").value.trim(),
        data: document.getElementById("dataProducao").value,
        pedidos: pedidos,
    };

    try {
        const resposta = await fetch(`${getApiUrl()}/producoes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!resposta.ok) {
            const erro = await resposta.json().catch(() => null);
            throw new Error(erro && erro.mensagem ? erro.mensagem : `Erro HTTP ${resposta.status}`);
        }

        const producaoCriada = await resposta.json();
        mostrarMensagem(mensagemForm, `Produção criada com sucesso! ID: ${producaoCriada.id}`, "sucesso");

        form.reset();
        corpoPedidos.innerHTML = "";
        adicionarLinhaPedido();
        atualizarTotalPedidosPreview();

        carregarListaProducoes();
    } catch (erro) {
        mostrarMensagem(mensagemForm, `Falha ao criar produção: ${erro.message}`, "erro");
    }
}

// ---------- Listar produções ----------
async function carregarListaProducoes() {
    mostrarMensagem(mensagemLista, "Carregando...", "");
    corpoLista.innerHTML = "";

    try {
        const resposta = await fetch(`${getApiUrl()}/producoes`);
        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }

        const producoes = await resposta.json();

        if (producoes.length === 0) {
            mostrarMensagem(mensagemLista, "Nenhuma produção cadastrada ainda.", "");
            return;
        }

        mostrarMensagem(mensagemLista, "", "");

        producoes.forEach((producao) => {
            const totalGeral = (producao.pedidos || []).reduce(
                (soma, p) => soma + p.quantidade,
                0
            );

            const linha = document.createElement("tr");
            linha.innerHTML = `
                <td>${escapeHtml(producao.nomeOperador)}</td>
                <td>${escapeHtml(producao.setor)}</td>
                <td>${formatarData(producao.data)}</td>
                <td>${totalGeral}</td>
                <td class="acoes-linha"></td>
            `;

            const celulaAcoes = linha.querySelector(".acoes-linha");

            const btnBaixarPdf = document.createElement("button");
            btnBaixarPdf.textContent = "Baixar PDF";
            btnBaixarPdf.className = "botao link";
            btnBaixarPdf.addEventListener("click", () => baixarPdf(producao.id));

            celulaAcoes.appendChild(btnBaixarPdf);

            corpoLista.appendChild(linha);
        });
    } catch (erro) {
        mostrarMensagem(mensagemLista, `Falha ao carregar produções: ${erro.message}`, "erro");
    }
}

// ---------- PDF ----------
async function baixarPdf(id) {
    try {
        const resposta = await fetch(`${getApiUrl()}/producoes/${id}/pdf`);
        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }
        const blob = await resposta.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `producao-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (erro) {
        mostrarMensagem(mensagemLista, `Falha ao baixar PDF: ${erro.message}`, "erro");
    }
}

// ---------- Inicialização ----------
form.addEventListener("submit", criarProducao);
btnAddPedido.addEventListener("click", adicionarLinhaPedido);
btnAtualizarLista.addEventListener("click", carregarListaProducoes);

adicionarLinhaPedido();
atualizarTotalPedidosPreview();
carregarListaProducoes();
