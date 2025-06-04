import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { enviroments } from '../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  
  private apiUrl = enviroments.apiUrl  //url del api creada de manera global

  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((response: any) => {
        localStorage.setItem('authToken', response.token);
      })
    );
  }

  
  obtenerUsuario(id: string): Observable<any> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.get<any>(`${this.apiUrl}/usuarios/${id}`, { headers });
  }
  


  
  isAuthenticated(): boolean {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return false;
    }
  
    try {
      const decoded: any = jwtDecode(token);
      const now = Date.now() / 1000;
      return decoded.exp > now; // Solo devuelve true si el token aún es válido
    } catch (error) {
      return false;
    }
  }
  

  deleteUser(id: string, headers: any) : Observable<any> {
   
    return this.http.delete(`${this.apiUrl}/usuarios/${id}`, { headers });
    
  }

  cerrarSesion() {
    localStorage.clear();
    window.location.href = '/login';
  }

 
}
function jwtDecode(token: string): any {
  throw new Error('Function not implemented.');
}




