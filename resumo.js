// ---------- Configuração ----------
const inputApiUrl = "http://10.100.3.52:8080";

function getApiUrl() {
    return inputApiUrl;
}

// ---------- Elementos ----------
const corpoLista = document.getElementById("corpoLista");
const mensagemLista = document.getElementById("mensagemLista");
const btnAtualizarLista = document.getElementById("btnAtualizarLista");
const btnBaixarResumo = document.getElementById("btnBaixarResumo");

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

function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = "mensagem " + (tipo || "");
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

// ---------- Baixar resumo geral ----------
async function baixarResumoGeral() {
    mostrarMensagem(mensagemLista, "Gerando resumo geral...", "");

    try {
        const resposta = await fetch(`${getApiUrl()}/producoes/resumo/pdf`);
        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }
        const blob = await resposta.blob();
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = "resumo-geral-producao.pdf";
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        mostrarMensagem(mensagemLista, "", "");
    } catch (erro) {
        mostrarMensagem(mensagemLista, `Falha ao baixar resumo geral: ${erro.message}`, "erro");
    }
}

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
btnAtualizarLista.addEventListener("click", carregarListaProducoes);
btnBaixarResumo.addEventListener("click", baixarResumoGeral);

carregarListaProducoes();
