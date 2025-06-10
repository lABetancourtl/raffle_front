import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroments } from '../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class RaffleService {
    private apiUrl = enviroments.apiUrl  //url del api creada de manera global

  constructor(private http: HttpClient) {}

getAllRaffles(): Observable<any[]> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    });

    return this.http.get<any[]>(`${this.apiUrl}/raffle/allRifas`, { headers });
}

getRaffleActiva(): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/raffle/activa`);
}

obtenerNumerosPorEmail(email: string): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/raffle/numerosPorEmail/soloNumeros?email=${email}`);
}

cambiarEstadoRifa(dto: { id: string; nuevoEstado: string }) {
      const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
    });
  return this.http.patch<any>(`${this.apiUrl}/raffle/cambiarEstadoRifa`, dto, { headers });
}


obtenerClientePorNumero(numero: string): Observable<any> {
  const token = localStorage.getItem('authToken');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  return this.http.get<any>(`${this.apiUrl}/raffle/clientePorNumero?numero=${numero}`, { headers });
}




}
