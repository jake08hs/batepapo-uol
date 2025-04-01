const estadoChat = {
    loginVisivel: true,
    chatVisivel: false,
    nomeUsuario: "",
    identificadorSala: "20bf46a1-855a-4a39-aaaf-6eeda1934a1e",
    mensagens: [],
    usuariosOnline: []
};

// Entrar na sala
async function entrarNoChat() {
    const nome = document.querySelector(".username-input").value.trim();
    if (!nome) return alert("Digite seu nome!");

    try {
        await axios.post(`https://mock-api.driven.com.br/api/v6/uol/participants/${estadoChat.identificadorSala}`, { name: nome });
        estadoChat.nomeUsuario = nome;
        iniciarChat();
    } catch (err) {
        alert(err?.response?.status === 400 ? "Nome já em uso!" : "Erro ao entrar.");
    }
}

function iniciarChat() {
    document.querySelector(".login-container").style.display = "none";
    document.querySelector(".chat-container").style.display = "block";
    atualizarUsuariosOnline();
    buscarMensagens();
    setInterval(manterUsuarioAtivo, 5000);

    toggleSidebar(true);
}

// Presença
async function manterUsuarioAtivo() {
    if (!estadoChat.nomeUsuario) return;
    try {
        await axios.post(`https://mock-api.driven.com.br/api/v6/uol/status/${estadoChat.identificadorSala}`, { name: estadoChat.nomeUsuario });
    } catch (err) {
        console.error("Erro presença:", err);
    }
}

// Mensagens
async function buscarMensagens() {
    try {
        const res = await axios.get(`https://mock-api.driven.com.br/api/v6/uol/messages/${estadoChat.identificadorSala}`);
        estadoChat.mensagens = res.data;
        renderizarMensagens();
    } catch (err) {
        console.error("Erro ao buscar mensagens:", err);
    }
}

function renderizarMensagens() {
    const container = document.querySelector(".chat-messages");
    const manterScroll = container.scrollHeight - container.clientHeight <= container.scrollTop + 1;
    container.innerHTML = "";

    estadoChat.mensagens.forEach(msg => {
        const msgEl = document.createElement("div");
        const tipo = msg.type === "status" ? "mensagem-status" :
                     msg.type === "private_message" ? "mensagem-reservada" : "mensagem-normal";

        msgEl.classList.add("mensagem", tipo);
        if (msg.from === estadoChat.nomeUsuario) msgEl.classList.add("minha-mensagem");

        const data = new Date(isNaN(msg.time) ? Date.parse(msg.time) : msg.time * 1000);
        const hora = data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dia = data.toLocaleDateString();

        msgEl.innerHTML = `<span class="hora">(${hora}) ${dia}</span> <strong>${msg.from}</strong> para <strong>${msg.to}</strong>: ${msg.text}`;
        container.appendChild(msgEl);
    });

    container.scrollTop = manterScroll ? container.scrollHeight : container.scrollHeight;
}

// Enviar mensagem
async function enviarMensagem() {
    const input = document.querySelector(".message-input");
    const texto = input.value.trim();
    if (!texto) return;

    const para = document.querySelector(".destinatario")?.value || "Todos";
    const visivel = para === "Todos" ? "message" : "private_message";

    const msg = {
        from: estadoChat.nomeUsuario,
        to: para,
        text: texto,
        type: visivel
    };

    try {
        await axios.post(`https://mock-api.driven.com.br/api/v6/uol/messages/${estadoChat.identificadorSala}`, msg);
        input.value = "";
        buscarMensagens();
        atualizarRodape(para);
    } catch (err) {
        console.error("Erro ao enviar:", err);
    }
}

// Rodapé
function atualizarRodape(destinatario) {
    const vis = document.querySelector(".visibilidade.selecionado")?.dataset.visibilidade;
    const texto = destinatario === "Todos" || vis !== "reservado"
        ? "Enviando para Todos (público)"
        : `Enviando Reservadamente para ${destinatario}`;
    document.querySelector(".chat-footer p").textContent = texto;
}

// Participantes
async function atualizarUsuariosOnline() {
    try {
        const res = await axios.get(`https://mock-api.driven.com.br/api/v6/uol/participants/${estadoChat.identificadorSala}`);
        estadoChat.usuariosOnline = res.data;
        renderizarUsuarios();
    } catch (err) {
        console.error("Erro ao buscar usuários:", err);
    }
}

function renderizarUsuarios() {
    const container = document.getElementById("usuarios-online");
    container.innerHTML = ""; 
    estadoChat.usuariosOnline.forEach(u => {
        if (u.name === estadoChat.nomeUsuario) return;
        const el = document.createElement("div");
        el.classList.add("opcao", "contato");
        el.dataset.contato = u.name;
        el.textContent = u.name;
        el.addEventListener("click", () => selecionarContato(u.name));
        container.appendChild(el);
    });
    const todosBtn = document.querySelector(`.contato[data-contato="Todos"]`);
    todosBtn.addEventListener("click", () => selecionarContato("Todos"));
}


// Seleção de contato
function selecionarContato(nome) {
    document.querySelectorAll(".contato").forEach(o => o.classList.remove("selecionado"));
    const el = document.querySelector(`.contato[data-contato="${nome}"]`);
    if (el) el.classList.add("selecionado");

    document.querySelector(".destinatario").value = nome;
    atualizarRodape(nome);
}

// Seleção de visibilidade
function selecionarVisibilidade(tipo) {
    document.querySelectorAll(".visibilidade").forEach(o => o.classList.remove("selecionado"));
    const el = document.querySelector(`.visibilidade[data-visibilidade="${tipo}"]`);
    if (el) el.classList.add("selecionado");

    const contato = document.querySelector(".destinatario")?.value || "Todos";
    atualizarRodape(contato);
    toggleSidebar(false);
}

// Sidebar
/*function toggleSidebar(abrir) {
    document.querySelector(".sidebar-chat").style.display = abrir ? "block" : "none";
    document.querySelector(".overlay").style.display = abrir ? "block" : "none";
    document.querySelector(".chat-container").classList.toggle("sidebar-aberta", abrir);
}
*/
function toggleSidebar(abrir = null) {
    const sidebar = document.querySelector(".sidebar-chat");
    const overlay = document.querySelector(".overlay");

    const estaAberta = sidebar.classList.contains("visivel");
    const estado = abrir !== null ? abrir : !estaAberta;

    if (estado) {
        sidebar.classList.add("visivel");
        overlay.classList.add("visivel");
    } else {
        sidebar.classList.remove("visivel");
        overlay.classList.remove("visivel");
    }
}



// Eventos
document.querySelector(".overlay").addEventListener("click", () => toggleSidebar(false));
document.querySelector(".chat-header img:last-of-type").addEventListener("click", () => toggleSidebar(true));
document.querySelector(".enter-button").addEventListener("click", entrarNoChat);
document.querySelector(".send-button").addEventListener("click", enviarMensagem);
document.querySelector(".message-input").addEventListener("keypress", e => e.key === "Enter" && enviarMensagem());

document.querySelectorAll(".opcao.visibilidade").forEach(opcao =>
    opcao.addEventListener("click", () => selecionarVisibilidade(opcao.dataset.visibilidade))
);

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    selecionarContato("Todos");
    document.querySelector(`.visibilidade[data-visibilidade="publico"]`).classList.add("selecionado");
});

// Intervalos
setInterval(manterUsuarioAtivo, 5000);
setInterval(buscarMensagens, 3000);
setInterval(atualizarUsuariosOnline, 10000);
