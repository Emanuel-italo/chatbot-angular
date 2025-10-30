import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Importe para usar o ngModel
import { ChatService, NotaFiscalResponse } from '../chat.service'; // Importe nosso serviço
import { gsap } from 'gsap';

// Definimos interfaces para o estado
interface ConversationState {
  step: number;
  cnpj: string;
  nota: string;
  userName: string;
  userArea: string;
}

interface Message {
  type: 'bot' | 'user';
  text: string;
  options?: string[];
  areaDescription?: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule], // Adicione FormsModule
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit, AfterViewChecked {
  // @ViewChild é a forma do Angular de obter referências do DOM
  @ViewChild('chatMessagesContainer') private chatMessagesContainer!: ElementRef;

  isChatOpen = false;
  isTyping = false;
  atendimentoIniciado = false;
  userInput = ''; // [(ngModel)] usará esta propriedade
  
  messages: Message[] = [];
  conversationState: ConversationState = {
    step: 0,
    cnpj: "",
    nota: "",
    userName: "",
    userArea: ""
  };

  readonly BOT_DELAY = 800;
  readonly AREA_DESCRIPTIONS = {
    "Recrutamento e Seleção": "Essa área é vital para atrair e selecionar os melhores talentos ...",
    "Unibrad": "A Unibrad é responsável pelo desenvolvimento educacional e capacitação dos nossos colaboradores...",
    "Financeiro": "Setor responsável pela gestão de pagamentos e controle de notas fiscais...",
    "RH": "Área de Gestão de Pessoas..."
  };
  readonly AREA_OPTIONS = Object.keys(this.AREA_DESCRIPTIONS);

  // Injete o ChatService
  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    //this.loadConversationHistory(); // Você pode habilitar isso se quiser
  }
  
  // Substitui o scrollToBottom() e garante que role após a renderização
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(show: boolean) {
    this.isChatOpen = show;
    
    // Precisamos de um pequeno delay para o *ngIf criar o elemento
    setTimeout(() => {
      const chatBoxEl = document.getElementById('chatBox');
      if (!chatBoxEl) return;

      if (show) {
        gsap.fromTo(chatBoxEl,
          { opacity: 0, scale: 0.3, rotationX: -90, transformPerspective: 600 },
          { opacity: 1, scale: 1, rotationX: 0, duration: 1, ease: "power4.out" }
        );
      } else {
        gsap.to(chatBoxEl, {
          opacity: 0, scale: 0.3, rotationX: -90, duration: 0.6, ease: "power4.in",
          onComplete: () => this.isChatOpen = false // Garante que o *ngIf remova
        });
      }
    }, 0);
  }

  startConversation() {
    if (this.atendimentoIniciado) {
      this.toggleChat(true);
      return;
    }
    
    this.atendimentoIniciado = true;
    this.toggleChat(true);
    this.appendBotMessage("Oláaaa, tudo bem ? Sou o Caio, assistente virtual do time de pagamentos. Como posso te chamar?");
    this.conversationState.step = 1;
  }

  appendBotMessage(text: string, options: string[] = []) {
    const description = options.length > 0 ? this.AREA_DESCRIPTIONS[text as keyof typeof this.AREA_DESCRIPTIONS] : undefined;
    this.messages.push({ type: 'bot', text, options, areaDescription: description });
    this.saveConversation();
  }

  appendUserMessage(text: string) {
    const sanitizedMsg = this.sanitizeInput(text);
    this.messages.push({ type: 'user', text: sanitizedMsg });
    this.saveConversation();
  }

  selectOption(option: string) {
    this.conversationState.userArea = option;
    this.appendUserMessage(option);
    
    this.isTyping = true;
    setTimeout(() => {
      this.isTyping = false;
      const description = this.AREA_DESCRIPTIONS[option as keyof typeof this.AREA_DESCRIPTIONS] || "Área de atuação.";
      this.appendBotMessage(`Ótima escolha!<div class="area-description">${description}</div>Por favor, o numero da nota (apenas números):`);
      this.conversationState.step = 3;
    }, this.BOT_DELAY);
  }

  sendMessage() {
    const text = this.userInput.trim();
    if (!text) return;

    this.appendUserMessage(text);
    this.userInput = ''; // Limpa o input (graças ao ngModel)
    this.isTyping = true;

    switch (this.conversationState.step) {
      case 1:
        this.conversationState.userName = this.sanitizeInput(text);
        setTimeout(() => {
          this.isTyping = false;
          this.appendBotMessage(`Prazer em te conhecer, ${this.conversationState.userName}! Em qual área você atua?`, this.AREA_OPTIONS);
          this.conversationState.step = 2;
        }, this.BOT_DELAY);
        break;
      case 3:
        this.conversationState.cnpj = text; // A validação de CNPJ foi removida no seu JS original
        setTimeout(() => {
          this.isTyping = false;
          this.appendBotMessage("Agora informe o número da nota fiscal:");
          this.conversationState.step = 4;
        }, this.BOT_DELAY);
        break;
      case 4:
        this.conversationState.nota = this.sanitizeInput(text);
        // Agora usamos o Serviço!
        this.chatService.fetchNotaFiscal(this.conversationState.cnpj, this.conversationState.nota)
          .subscribe((response: NotaFiscalResponse) => {
            this.isTyping = false;
            if (response.success) {
              this.appendBotMessage(`Nota fiscal encontrada:<br>
                <strong>Fornecedor:</strong> ${response.nome_fornecedor}<br>
                <strong>CNPJ:</strong> ${this.formatCNPJ(this.conversationState.cnpj)}<br>
                <strong>Nota:</strong> ${this.conversationState.nota}<br>
                <strong>Valor:</strong> R$ ${response.valor?.toFixed(2)}<br>
                <strong>Status:</strong> ${response.status}`);
            } else {
              this.appendBotMessage(response.error || "Não encontrei esta nota fiscal. Verifique os dados e tente novamente.");
            }
            this.conversationState.step = 0; // Reinicia o fluxo
          });
        break;
      default:
        this.isTyping = false;
        this.appendBotMessage("Vamos começar novamente. Qual seu nome?");
        this.conversationState.step = 1;
    }
  }

  // Funções de utilidade (copiadas do seu script.js)
  scrollToBottom(): void {
    try {
      this.chatMessagesContainer.nativeElement.scrollTop = this.chatMessagesContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  sanitizeInput(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  formatCNPJ(cnpj: string): string {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }

  saveConversation() {
    localStorage.setItem('bradesco_chat_history', JSON.stringify(this.messages));
  }

  loadConversationHistory() {
    const savedChat = localStorage.getItem('bradesco_chat_history');
    if (savedChat) {
      this.messages = JSON.parse(savedChat);
    }
  }
}