const UUID = "20bf46a1-855a-4a39-aaaf-6eeda1934a1e"; 
//const API_BASE_URL = `https://mock-api.driven.com.br/api/v6/uol/${UUID}`;


const estadoChat = {
    loginVisivel: true,
    chatVisivel: false,
    nomeUsuario: "",
    mensagens: [],
    usuariosOnline: [],
    destinatario: "Todos",             
    tipoVisibilidade: "message"        
};


// Entrar na sala
function entrarNoChat() {
    const nome = document.querySelector(".username-input").value.trim();
    if (!nome) return alert("Digite seu nome!");

    axios.post(
        'https://mock-api.driven.com.br/api/v6/uol/participants/20bf46a1-855a-4a39-aaaf-6eeda1934a1e',
        { name: nome }
    )
    .then(() => {
        estadoChat.nomeUsuario = nome;

        const nomeUsuarioSidebar = document.querySelector(".nome-usuario-sidebar");
        if (nomeUsuarioSidebar) {
            nomeUsuarioSidebar.textContent = nome;
        }

        iniciarChat();
    })
  .catch(err => {
    console.error("Erro completo ao tentar entrar:", err); 
    if (err?.response?.status === 400) {
        alert("Nome já em uso!");
    } else {
        alert("Erro grave ao entrar. Verifique o console."); 
    }
    if (err.response && err.response.data) {
        console.error("Dados da resposta do servidor (entrada):", err.response.data); 
    }
});
}


function iniciarChat() {
    document.querySelector(".login-container").style.display = "none";
    document.querySelector(".chat-container").style.display = "block";

    atualizarUsuariosOnline(); 
    buscarMensagens();       

   
    setInterval(manterUsuarioAtivo, 3000);
    setInterval(buscarMensagens, 3000);
    setInterval(atualizarUsuariosOnline, 10000);

    configurarVisibilidade();

  
    const opcaoInicial = document.querySelector(`.opcao.visibilidade[data-visibilidade="${estadoChat.tipoVisibilidade}"]`);
    if (opcaoInicial) {
        document.querySelector(".opcao.visibilidade.selecionado")?.classList.remove("selecionado");
        opcaoInicial.classList.add("selecionado");
    }
 
    selecionarContato("Todos"); 
}

// Presença
function manterUsuarioAtivo() {
    if (!estadoChat.nomeUsuario) return;

    axios.post('https://mock-api.driven.com.br/api/v6/uol/status/' + UUID, {
        name: estadoChat.nomeUsuario
    })
    .then(() => {
      
    })
    .catch(err => {
        console.error("Erro ao manter status de usuário:", err);
        if (err.response) {
            console.error("Status do erro:", err.response.status);
            console.error("Dados da resposta do erro:", err.response.data);
        }
    });
}

// Mensagens
function buscarMensagens() {
    axios.get('https://mock-api.driven.com.br/api/v6/uol/messages/20bf46a1-855a-4a39-aaaf-6eeda1934a1e')
        .then(res => {
            estadoChat.mensagens = res.data;
            //CONSOLE.LOG 
            console.log("Mensagens recebidas da API:", res.data);

            // limparMensagensAntigas(); 
            renderizarMensagens();
        })
        .catch(err => {
            console.error("Erro ao buscar mensagens:", err);

            if (err.response) {
                console.log("Status do erro:", err.response.status);
                console.log("Dados do erro:", err.response.data);
            } else {
                console.log("Erro sem resposta do servidor:", err.message);
            }
        });
}

// Limpar mensagens 
function limparMensagensAntigas() {
    const agora = Date.now();
    const tempoLimite = 5 * 60 * 1000; 

    estadoChat.mensagens = estadoChat.mensagens.filter(msg => {
        const msgTime = new Date(msg.time).getTime();
        return agora - msgTime < tempoLimite;
    });
}

function renderizarMensagens() {
    const container = document.querySelector(".chat-messages");
    container.innerHTML = "";

    estadoChat.mensagens.forEach(msg => {
        const msgEl = document.createElement("div");
        const tipo = msg.type === "status" ? "mensagem-status" :
            msg.type === "private_message" ? "mensagem-reservada" : "mensagem-normal";

        msgEl.classList.add("mensagem", tipo);
        if (msg.from === estadoChat.nomeUsuario) msgEl.classList.add("minha-mensagem");

        const [horasStr, minutosStr, segundosStr] = msg.time.split(':');
        const horaFormatada = `${horasStr}:${minutosStr}`;

        let mensagemConteudoHTML = `<span class="hora">(${horaFormatada})</span> `;

        if (msg.type === "status") {
            mensagemConteudoHTML += `<strong>${msg.from}</strong> ${msg.text}`;
        } else if (msg.type === "private_message") {
            mensagemConteudoHTML += `<strong>${msg.from}</strong> para <strong>${msg.to}</strong>: ${msg.text}`;
        } else { 
            mensagemConteudoHTML += `<strong>${msg.from}</strong> para <strong>${msg.to}</strong>: ${msg.text}`;
        }

        msgEl.innerHTML = mensagemConteudoHTML;
        container.appendChild(msgEl);
    });

    container.scrollTop = container.scrollHeight;
}

function configurarVisibilidade() {
    const opcoesVisibilidade = document.querySelectorAll(".opcao.visibilidade");

    opcoesVisibilidade.forEach(opcao => {
        opcao.addEventListener("click", () => {
         
            document.querySelector(".opcao.visibilidade.selecionado")?.classList.remove("selecionado");

            opcao.classList.add("selecionado");

            estadoChat.tipoVisibilidade = opcao.dataset.visibilidade;

            atualizarRodape(estadoChat.destinatario);
        });
    });
}

// Enviar mensagem
function enviarMensagem() {
    const inputMensagem = document.querySelector(".message-input");
    const textoMensagem = inputMensagem.value.trim();
    if (!textoMensagem) return;

    const destinatarioSelecionado = estadoChat.destinatario || "Todos";
    const tipoDeMensagem = estadoChat.tipoVisibilidade || "message";

    const mensagemParaEnviar = {
        from: estadoChat.nomeUsuario,
        to: destinatarioSelecionado,
        text: textoMensagem,
        type: tipoDeMensagem
    };

    axios.post(
        'https://mock-api.driven.com.br/api/v6/uol/messages/20bf46a1-855a-4a39-aaaf-6eeda1934a1e',
        mensagemParaEnviar
    )
    .then(() => {
        inputMensagem.value = "";
        buscarMensagens();
        atualizarRodape(destinatarioSelecionado);
    })
    .catch(erro => {
        console.error("Erro ao enviar a mensagem:", erro);
    });
}

// Rodapé
function atualizarRodape(destinatario) {
    const visibilidadeSelecionada = document.querySelector(".visibilidade.selecionado");
    const tipoVisibilidade = visibilidadeSelecionada?.getAttribute("data-visibilidade") || "message";

    estadoChat.tipoVisibilidade = tipoVisibilidade;

    const tipoMensagem = tipoVisibilidade === "private_message" ? "(reservadamente)" : "(público)";
    const elementoAviso = document.querySelector(".chat-footer .aviso-mensagem");

    if (elementoAviso) {
        elementoAviso.textContent = `Enviando para ${destinatario} ${tipoMensagem}`;
    }
}

// Participantes
function atualizarUsuariosOnline() {
    axios.get('https://mock-api.driven.com.br/api/v6/uol/participants/20bf46a1-855a-4a39-aaaf-6eeda1934a1e')
        .then(res => {
            estadoChat.usuariosOnline = res.data;
            renderizarUsuarios();
        })
        .catch(err => {
          
        });
}

function renderizarUsuarios() {
    const container = document.getElementById("usuarios-online");
    container.innerHTML = "";

    const usuarioLogado = document.createElement("div");
    usuarioLogado.classList.add("opcao", "contato");
    usuarioLogado.dataset.contato = estadoChat.nomeUsuario;
    usuarioLogado.innerHTML = `
        <input type="checkbox" class="checkbox-icone">
        <ion-icon name="person-outline"></ion-icon>
        <span class="nome-contato">${estadoChat.nomeUsuario}</span>
    `;
    usuarioLogado.addEventListener("click", () => {
        selecionarContato(estadoChat.nomeUsuario);
    });
    container.appendChild(usuarioLogado);

    estadoChat.usuariosOnline.forEach(u => {
        if (u.name === estadoChat.nomeUsuario) return;

        const el = document.createElement("div");
        el.classList.add("opcao", "contato");
        el.dataset.contato = u.name;
        el.innerHTML = `
            <input type="checkbox" class="checkbox-icone">
            <ion-icon name="person-outline"></ion-icon>
            <span class="nome-contato">${u.name}</span>
        `;
        el.addEventListener("click", () => {
            selecionarContato(u.name);
        });
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
        estadoChat.destinatario = nome; 
        atualizarRodape(nome);         
    }
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

    const contatoSelecionado = document.querySelector(".contato.selecionado");
    const destinatario = contatoSelecionado?.getAttribute("data-contato") || "Todos";
    atualizarRodape(destinatario);
}

// Sidebar
function toggleSidebar(abrir) {
    const sidebar = document.querySelector(".sidebar-chat");
    const overlay = document.querySelector(".overlay");
    const chatContainer = document.querySelector(".chat-container");

    if (abrir) {
        sidebar.classList.add("visivel");
        overlay.classList.add("visivel");
        chatContainer.classList.add("sidebar-aberta");
    } else {
        sidebar.classList.remove("visivel");
        overlay.classList.remove("visivel");
        chatContainer.classList.remove("sidebar-aberta");
    }
}
document.querySelector(".overlay").addEventListener("click", () => toggleSidebar(false));

document.querySelector(".chat-header img:last-of-type").addEventListener("click", () => toggleSidebar(true));

document.querySelectorAll(".sidebar-chat .opcao").forEach(opcao =>
    opcao.addEventListener("click", () => {
        setTimeout(() => toggleSidebar(false), 200);
    })
);

document.querySelector(".enter-button").addEventListener("click", entrarNoChat);

document.querySelector(".send-button").addEventListener("click", enviarMensagem);

document.querySelector(".message-input").addEventListener("keypress", e => e.key === "Enter" && enviarMensagem());

document.querySelectorAll(".opcao.visibilidade").forEach(opcao =>
    opcao.addEventListener("click", () => selecionarVisibilidade(opcao.dataset.visibilidade))
);

document.addEventListener("DOMContentLoaded", () => {

});