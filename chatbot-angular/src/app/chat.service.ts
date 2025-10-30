import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';

// Definimos uma interface para a resposta
export interface NotaFiscalResponse {
  success: boolean;
  nome_fornecedor?: string;
  valor?: number;
  status?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  // O Angular "injeta" o HttpClient aqui
  constructor(private http: HttpClient) { }

  // Trocamos 'fetch' por 'http.post'
  // Usamos 'Observable' em vez de 'Promise' (padrão do Angular)
  fetchNotaFiscal(cnpj: string, nota: string): Observable<NotaFiscalResponse> {
    const token = localStorage.getItem('bradesco_auth_token') || '';

    // O backend.py parece estar na raiz, então a URL da API seria /consultar-nota
    // NOTA: Em produção, você precisará de um proxy ou da URL completa
    return this.http.post<NotaFiscalResponse>('/consultar-nota', { cnpj, nota }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      }
    }).pipe(
      catchError(error => {
        console.error("Erro na consulta:", error);
        // Retorna um objeto de erro padronizado
        return of({ success: false, error: "Serviço indisponível" });
      })
    );
  }
}