import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { enviroments } from '../../enviroments/enviroments';
import { jwtDecode } from 'jwt-decode';



@Injectable({
  providedIn: 'root'
})
export class LoginService {
  
  private apiUrl = enviroments.apiUrl  

  constructor(private http: HttpClient) {}

  login(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, data).pipe(
      tap((response: any) => {
        const token = response.respuesta?.token;
        if (token) {
          localStorage.setItem('authToken', token);
        }
      })

    );
  }


  loginUser(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/userlogin`, data)
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
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const now = Date.now() / 1000;
      return decoded.exp > now;
    } catch (error) {
      console.error('Token inválido o malformado', error);
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


  validarEmail(data: any): Observable<any> {

    console.log('Enviando datos a la API:', data);
    return this.http.patch(`${this.apiUrl}/admin/validarEmail`, data); 
  }
 
}





