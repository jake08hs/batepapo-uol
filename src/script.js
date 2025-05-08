const estadoChat = {
    loginVisivel: true,
    chatVisivel: false,
    nomeUsuario: "",
    identificadorSala: "20bf46a1-855a-4a39-aaaf-6eeda1934a1e", // nova uuid 
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

       
        const nomeUsuarioSidebar = document.querySelector(".nome-usuario-sidebar");
        if (nomeUsuarioSidebar) {
            nomeUsuarioSidebar.textContent = nome;
        }
       

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

    estadoChat.mensagens = resposta.data;
    limparMensagensAntigas(); // chama logo depois
    renderizarMensagens();

}
// Limpar mensagens 
function limparMensagensAntigas() {
    const agora = Date.now();
    const tempoLimite = 5 * 60 * 1000; // 5 minutos para atualizar

    estadoChat.mensagens = estadoChat.mensagens.filter(msg => {
        const msgTime = new Date(msg.time).getTime();
        return agora - msgTime < tempoLimite;
    });
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

        // horário
        let data;
        if (!msg.time || msg.time === "Invalid Date") {

            data = new Date();
        } else if (isNaN(msg.time)) {
          
            data = new Date(Date.parse(msg.time));
        } else {
           
            data = new Date(msg.time * 1000);
        }

        if (isNaN(data.getTime())) {
            data = new Date();
        }

        const hora = data.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dia = data.toLocaleDateString();

        msgEl.innerHTML = `<span class="hora">(${hora}) ${dia}</span> <strong>${msg.from}</strong> para <strong>${msg.to}</strong>: ${msg.text}`;
        container.appendChild(msgEl);
    });

    container.scrollTop = manterScroll ? container.scrollHeight : container.scrollHeight;
}


// Enviar mensagem
async function enviarMensagem() {
    const inputMensagem = document.querySelector(".message-input");
    const textoMensagem = inputMensagem.value.trim();
    if (!textoMensagem) return;

    const destinatarioSelecionado = document.querySelector(".destinatario")?.value || "Todos";
    const tipoDeMensagem = destinatarioSelecionado === "Todos" 
        ? "message" 
        : "private_message";

    const mensagemParaEnviar = {
        from: estadoChat.nomeUsuario,
        to: destinatarioSelecionado,
        text: textoMensagem,
        type: tipoDeMensagem
    };

    try {
        await axios.post(`https://mock-api.driven.com.br/api/v6/uol/messages/${estadoChat.identificadorSala}`, mensagemParaEnviar);
        inputMensagem.value = ""; 
        buscarMensagens(); 
        atualizarRodape(destinatarioSelecionado); 
    } catch (erro) {
        console.error("Erro ao enviar a mensagem:", erro);
    }
}


// Rodapé
function atualizarRodape(destinatario) {
    const visibilidadeSelecionada = document.querySelector(".visibilidade.selecionado");
    const tipoVisibilidade = visibilidadeSelecionada?.getAttribute("data-visibilidade");

    // Verificar se a visibilidade é "reservado" ou "público"
    const tipoMensagem = tipoVisibilidade === "reservado" ? "(reservadamente)" : "(público)";

    const elementoAviso = document.querySelector(".chat-footer .aviso-mensagem");
    if (elementoAviso) {
        elementoAviso.textContent = `Enviando para ${destinatario} ${tipoMensagem}`;
    }
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

    // Adiciona o próprio usuário logado na lista
    const usuarioLogado = document.createElement("div");
    usuarioLogado.classList.add("opcao", "contato");
    usuarioLogado.dataset.contato = estadoChat.nomeUsuario;
    usuarioLogado.innerHTML = `
        <input type="checkbox" class="checkbox-icone">
        <ion-icon name="person-outline"></ion-icon> ${estadoChat.nomeUsuario}
    `;
    container.appendChild(usuarioLogado);

    // Adiciona os demais usuários online (exceto o próprio)
    estadoChat.usuariosOnline.forEach(u => {
        if (u.name === estadoChat.nomeUsuario) return;
        const el = document.createElement("div");
        el.classList.add("opcao", "contato");
        el.dataset.contato = u.name;
        el.innerHTML = `
            <input type="checkbox" class="checkbox-icone">
            <ion-icon name="person-outline"></ion-icon> ${u.name}
        `;
        container.appendChild(el);
    });
}



// Seleção de contato
function selecionarContato(nome) {
    const contatos = document.querySelectorAll(".contato");
    contatos.forEach(contato => contato.classList.remove("selecionado"));

    const contatoSelecionado = Array.from(contatos).find(contato => {
        const nomeContato = contato.querySelector(".nome-contato")?.textContent;
        return nomeContato === nome;
    });

    if (contatoSelecionado) {
        contatoSelecionado.classList.add("selecionado");
    }

    atualizarRodape(nome); // usa a visibilidade já selecionada
}




// Seleção de visibilidade
function selecionarVisibilidade(tipo) {
    const opcoes = document.querySelectorAll(".visibilidade");
    opcoes.forEach(opcao => {
        opcao.classList.remove("selecionado");
        const checkbox = opcao.querySelector(".checkbox-icone");
        if (checkbox) checkbox.checked = false;
    });

    const novaOpcao = Array.from(opcoes).find(opcao => {
        const tipoVisibilidade = opcao.getAttribute("data-visibilidade");
        return tipoVisibilidade === tipo;
    });

    if (novaOpcao) {
        novaOpcao.classList.add("selecionado");
        const checkbox = novaOpcao.querySelector(".checkbox-icone");
        if (checkbox) checkbox.checked = true;
    }

    // Atualiza o rodapé com o contato selecionado atual
    const contatoSelecionado = document.querySelector(".contato.selecionado");
    const destinatario = contatoSelecionado?.getAttribute("data-contato") || "Todos";
    atualizarRodape(destinatario);
}



// Sidebar
function toggleSidebar(abrir) {
    document.querySelector(".sidebar-chat").style.display = abrir ? "block" : "none";
    document.querySelector(".overlay").style.display = abrir ? "block" : "none";
    document.querySelector(".chat-container").classList.toggle("sidebar-aberta", abrir);
}

// expõe pro console
window.toggleSidebar = toggleSidebar;


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

    document.querySelectorAll(".visibilidade").forEach(item => {
        item.addEventListener("click", () => {
            const tipo = item.getAttribute("data-visibilidade");
            selecionarVisibilidade(tipo);
        });
    });

   
    document.querySelectorAll(".contato").forEach(item => {
        item.addEventListener("click", () => {
            const nome = item.getAttribute("data-contato");
            selecionarContato(nome);
        });
    });
});


document.addEventListener("click", function (event) {
    const contato = event.target.closest(".contato");
    if (contato && contato.dataset.contato) {
        selecionarContato(contato.dataset.contato);
        document.querySelectorAll(".contato").forEach(el => el.classList.remove("selecionado"));
        contato.classList.add("selecionado");
    }
});

// Intervalos
setInterval(manterUsuarioAtivo, 5000);
setInterval(buscarMensagens, 3000);
setInterval(atualizarUsuariosOnline, 10000);
