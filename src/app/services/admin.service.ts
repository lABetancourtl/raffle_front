import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroments } from '../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class AdminService {


// En admin.service.ts
activarUsuario(datosUsuario: any): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  return this.http.patch<any>(`${this.apiUrl}/admin/validarDocumento`, datosUsuario, { headers });
}

  private apiUrl = enviroments.apiUrl;

  constructor(private http: HttpClient) {}

crearRifa(data: any): Observable<any> {
  const token = localStorage.getItem('authToken');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  return this.http.post(`${this.apiUrl}/raffle/crearRifa`, data, { headers });
}


subirFoto(data: any): Observable<any> {
  const token = localStorage.getItem('authToken');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
  });

  return this.http.post(`${this.apiUrl}/imagenes`, data, { headers });
}

compraAleatoriaDesdeAdmin(data: any): Observable<any> {
  const token = localStorage.getItem('authToken');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  return this.http.post(`${this.apiUrl}/admin/asignarAleatorio`, data, { headers });
}

compraManualDesdeAdmin(data: any, numeroManual: any): Observable<any> {
  const token = localStorage.getItem('authToken');
  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  return this.http.post(`${this.apiUrl}/admin/asignarNumero`, {data, numeroManual}, { headers });
}

getUsuarioEmailVerificado() {

 return this.http.get<any[]>(`${this.apiUrl}/admin/usuarioEmailVerificado`);
}

}
