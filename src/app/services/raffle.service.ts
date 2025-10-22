import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroments } from '../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class RaffleService {
  private apiUrl = enviroments.apiUrl; // URL del API global

  constructor(private http: HttpClient) { }

  getAllRaffles(): Observable<any[]> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.get<any[]>(`${this.apiUrl}/raffle/allRifas`, { headers });
  }

  cambiarEstadoRifa(dto: { id: string; nuevoEstado: string }) {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.patch<any>(`${this.apiUrl}/raffle/cambiarEstadoRifa`, dto, { headers });
  }

  obtenerClientePorNumero(raffleId: string, numero: string): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const params = new HttpParams()
      .set('raffleId', raffleId)
      .set('numero', numero);

    return this.http.get<any>(`${this.apiUrl}/raffle/clientePorNumero`, {
      headers,
      params
    });
  }

  // Llamado a endpoint desde el home (para clientes)
  getRaffleActiva(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/raffle/activa`);
  }

  obtenerNumerosPorEmail(email: string): Observable<string[]> {
    return this.http.get<string[]>(
      `${this.apiUrl}/raffle/numerosPorEmail/soloNumeros?email=${email}`
    );
  }

  obtenerCantidadNumerosDisponibles(
    idRaffle: string
  ): Observable<{ error: boolean; respuesta: number }> {
    return this.http.get<{ error: boolean; respuesta: number }>(
      `${this.apiUrl}/purchase/cantidadNumerosDisponibles?idRaffle=${idRaffle}`
    );
  }

  crearPreferenciaPago(datosPago: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/mercadopago/crear-preferencia`, datosPago);
  }

  procesarPago(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/mercadopago/procesar-pago`, formData);
  }

  getOperacionesByRaffle(raffleId: string): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
    return this.http.get<any>(`${this.apiUrl}/raffle/operaciones/${raffleId}`, { headers });
  }

  // ✅ NUEVO MÉTODO para ejecutar el sorteo
  ejecutarSorteo(raffleId: string, numeroGanadores: number): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.http.post<any>(
      `${this.apiUrl}/raffle/ejecutarSorteo/${raffleId}?numeroGanadores=${numeroGanadores}`,
      {},
      { headers }
    );
  }

  descargarActa(sorteoId: number) {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });
    return this.http.get(`${this.apiUrl}/raffle/acta/${sorteoId}/pdf`, {
      headers,
      responseType: 'blob'
    });
  }

}
