import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { enviroments } from '../../enviroments/enviroments';
import { jwtDecode } from 'jwt-decode';



@Injectable({
  providedIn: 'root'
})
export class RegisterService {
  
  private apiUrl = enviroments.apiUrl  

  constructor(private http: HttpClient) {}

subirFotos(data: any): Observable<any> {
//  const token = localStorage.getItem('authToken');
//  const headers = new HttpHeaders({
//    Authorization: `Bearer ${token}`,
//  });
  return this.http.post(`${this.apiUrl}/imagenes/varias`, data);
}

registrarUsuario(data: any): Observable<any> { 

  return this.http.post(`${this.apiUrl}/admin/crearUsuarioHome`, data);
}


}





