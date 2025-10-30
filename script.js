/// Constantes e configurações
const BOT_DELAY = 800; // Tempo de resposta simulada
let atendimentoIniciado = false; // Controle do início do atendimento
const AREA_DESCRIPTIONS = {
  "Recrutamento e Seleção": "Essa área é vital para atrair e selecionar os melhores talentos ...",
  "Unibrad": "A Unibrad é responsável pelo desenvolvimento educacional e capacitação dos nossos colaboradores...",
  "Financeiro": "Setor responsável pela gestão de pagamentos e controle de notas fiscais...",
  "RH": "Área de Gestão de Pessoas..."
};

// Estado da conversa
let conversationState = {
  step: 0,
  cnpj: "",
  nota: "",
  userName: "",
  userArea: "",
  isTyping: false
};

// Elementos do DOM
const domElements = {
  chatBox: document.getElementById('chatBox'),
  chatMessages: document.getElementById('chatMessages'),
  userInput: document.getElementById('userInput'),
  introMessage: document.getElementById('intro'), // Caso seja adicionado futuramente
  chatTrigger: document.getElementById('chatBtn')
};

document.addEventListener("DOMContentLoaded", () => {
  let progress = 0;
  const loadingText = document.getElementById("loadingText");
  const progressFill = document.getElementById("progressFill");
  const progressGlow = document.getElementById("progressGlow");

  const interval = setInterval(() => {
    progress += 10;
    progressFill.style.width = `${progress}%`;
    progressGlow.style.left = `${progress}%`;
    loadingText.textContent = `Carregando... ${progress}%`;

    if (progress >= 100) {
      clearInterval(interval);
      loadingText.textContent = "✅ ESTA PRONTO PARA FALAR COM O CAIO? BEM-VINDO";
      setTimeout(() => {
        gsap.to("#loadingScreen", { opacity: 0, duration: 1, onComplete: () => {
          document.getElementById("loadingScreen").style.display = "none";
        }});
      }, 1000);
    }
  }, 300);
});


function toggleChat(show) {
  // Se desejar ignorar a condição para permitir a abertura quando o atendimento ainda não estiver iniciado, remova a linha abaixo:
  // if (!atendimentoIniciado && show) return;

  if (show) {
    // Exibe o chat
    domElements.chatBox.style.display = 'flex';

    // Animação de entrada com GSAP inspirada no moncy.dev
    gsap.fromTo(
      domElements.chatBox,
      {
        opacity: 0,
        scale: 0.3,
        rotationX: -90,
        transformPerspective: 600
      },
      {
        opacity: 1,
        scale: 1,
        rotationX: 0,
        duration: 1,
        ease: "power4.out"
      }
    );

    // Oculta o botão e foca no input
    domElements.chatTrigger.style.display = 'none';
    domElements.userInput.focus();
  } else {
    // Animação de saída (opcional)
    gsap.to(domElements.chatBox, {
      opacity: 0,
      scale: 0.3,
      rotationX: -90,
      duration: 0.6,
      ease: "power4.in",
      onComplete: () => {
        domElements.chatBox.style.display = 'none';
        domElements.chatTrigger.style.display = 'flex';
      }
    });
  }
}



function startConversation() {
  if (!atendimentoIniciado) {
    atendimentoIniciado = true;
    if (domElements.introMessage) {
      domElements.introMessage.style.display = 'none';
    }
    toggleChat(true);
    appendBotMessage("Oláaaa, tudo bem ? Sou o Caio, assistente virtual do time de pagamentos. Como posso te chamar?");
    conversationState.step = 1;
  }
}

function appendBotMessage(msg, options = []) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message bot-message';
  messageDiv.innerHTML = `<strong>CAIO:</strong> ${msg}`;
  
  if (options.length > 0) {
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'area-btn-container';
    options.forEach(option => {
      const button = document.createElement('button');
      button.className = 'area-btn';
      button.textContent = option;
      button.onclick = () => selectOption(option);
      optionsContainer.appendChild(button);
    });
    messageDiv.appendChild(optionsContainer);
  }
  
  domElements.chatMessages.appendChild(messageDiv);
  scrollToBottom();
  saveConversation();
}

function appendUserMessage(msg) {
  const sanitizedMsg = sanitizeInput(msg);
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message user-message';
  messageDiv.innerHTML = `<strong>VOCÊ:</strong> ${sanitizedMsg}`;
  domElements.chatMessages.appendChild(messageDiv);
  scrollToBottom();
  saveConversation();
}

function selectOption(option) {
  conversationState.userArea = option;
  appendUserMessage(option);
  
  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    const description = AREA_DESCRIPTIONS[option] || "Área de atuação.";
    // Removido o uso de conversationState.userName na mensagem
    appendBotMessage(`Ótima escolha!<div class="area-description">${description}</div>Por favor, o numero da nota (apenas números):`);
    conversationState.step = 3;
  }, BOT_DELAY);
}


async function sendMessage() {
  const text = domElements.userInput.value.trim();
  if (!text) return;

  appendUserMessage(text);
  domElements.userInput.value = '';

  switch (conversationState.step) {
    case 1:
      conversationState.userName = sanitizeInput(text);
      showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        appendBotMessage(`Prazer em te conhecer, ${conversationState.userName}! Em qual área você atua?`, Object.keys(AREA_DESCRIPTIONS));
        conversationState.step = 2;
      }, BOT_DELAY);
      break;
    case 3:
      // Removida a verificação do CNPJ:
      // if (!validateCNPJ(text)) {
      //   appendBotMessage("CNPJ inválido. Por favor, digite os 14 números sem pontos ou traços.");
      //   return;
      // }
      conversationState.cnpj = text;
      showTypingIndicator();
      setTimeout(() => {
        removeTypingIndicator();
        appendBotMessage("Agora informe o número da nota fiscal:");
        conversationState.step = 4;
      }, BOT_DELAY);
      break;
    case 4:
      conversationState.nota = sanitizeInput(text);
      showTypingIndicator();
      try {
        const response = await fetchNotaFiscal(conversationState.cnpj, conversationState.nota);
        removeTypingIndicator();
        if (response.success) {
          appendBotMessage(`Nota fiscal encontrada:<br>
            <strong>Fornecedor:</strong> ${response.nome_fornecedor}<br>
            <strong>CNPJ:</strong> ${formatCNPJ(conversationState.cnpj)}<br>
            <strong>Nota:</strong> ${conversationState.nota}<br>
            <strong>Valor:</strong> R$ ${response.valor.toFixed(2)}<br>
            <strong>Status:</strong> ${response.status}`);
        } else {
          appendBotMessage(response.error || "Não encontrei esta nota fiscal. Verifique os dados e tente novamente.");
        }
      } catch (error) {
        removeTypingIndicator();
        appendBotMessage("Estou com dificuldades para acessar o sistema no momento. Por favor, tente mais tarde.");
      }
      conversationState.step = 0;
      break;
    default:
      appendBotMessage("Vamos começar novamente. Qual seu nome?");
      conversationState.step = 1;
  }
}

function showTypingIndicator() {
  conversationState.isTyping = true;
  const typingDiv = document.createElement('div');
  typingDiv.className = 'typing-indicator';
  typingDiv.id = 'typingIndicator';
  typingDiv.innerHTML = `
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
    <span class="typing-dot"></span>
  `;
  domElements.chatMessages.appendChild(typingDiv);
  scrollToBottom();
}

function removeTypingIndicator() {
  conversationState.isTyping = false;
  const indicator = document.getElementById('typingIndicator');
  if (indicator) indicator.remove();
}

function scrollToBottom() {
  domElements.chatMessages.scrollTop = domElements.chatMessages.scrollHeight;
}

function sanitizeInput(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function validateCNPJ(cnpj) {
  cnpj = cnpj.replace(/[^\d]+/g, '');
  return cnpj.length === 14 && !/^(\d)\1+$/.test(cnpj);
}

function formatCNPJ(cnpj) {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

async function fetchNotaFiscal(cnpj, nota) {
  try {
    const response = await fetch('/api/consultar-nota', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getAuthToken()
      },
      body: JSON.stringify({ cnpj, nota })
    });
    
    if (!response.ok) throw new Error('Erro na API');
    return await response.json();
  } catch (error) {
    console.error("Erro na consulta:", error);
    return { success: false, error: "Serviço indisponível" };
  }
}

function getAuthToken() {
  return localStorage.getItem('bradesco_auth_token') || '';
}

function saveConversation() {
  const conversation = domElements.chatMessages.innerHTML;
  localStorage.setItem('bradesco_chat_history', conversation);
}

function loadConversationHistory() {
  const savedChat = localStorage.getItem('bradesco_chat_history');
  if (savedChat) {
    domElements.chatMessages.innerHTML = savedChat;
    scrollToBottom();
  }
}

// Funções mínimas para as ações não implementadas
function showService(service) {
  alert("Serviço " + service + " selecionado!");
}

function quickAction(action) {
  alert("Ação rápida " + action + " acionada!");
}
