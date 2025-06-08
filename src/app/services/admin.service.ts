import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { enviroments } from '../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

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

}
