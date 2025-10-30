import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingScreenComponent } from './loading-screen/loading-screen.component';
import { ChatComponent } from './chat/chat.component';

@Component({
  selector: 'app-root',
  standalone: true,
  // Importe os novos componentes que vamos criar
  imports: [RouterOutlet, CommonModule, LoadingScreenComponent, ChatComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'] // Podemos criar estilos específicos se quisermos
})
export class AppComponent {
  title = 'chatbot-angular';
  isLoading = true;

  // Esta função será chamada pelo evento (onLoadingComplete) do componente filho
  onLoadingComplete() {
    this.isLoading = false;
  }
}