import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../services/login.service';

@Component({
  selector: 'app-login',
  standalone: true, 
  imports: [
    CommonModule,
    FormsModule,
    RouterModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  showSuccessAlert = false;
  showErrorAlert = false;
  errorMessage = '';
  isLoading = false; 

  constructor(
    private loginService: LoginService, 
    private router: Router
  ) {}

  onLogin() {
    this.isLoading = true;

    const userData = {
      email: this.email,
      password: this.password
    };

    this.loginService.login(userData).subscribe({
      next: (response) => {
        if (response?.error === false && response.respuesta?.token) {
          const token = response.respuesta.token;
          localStorage.setItem('authToken', token);

          const payload = JSON.parse(atob(token.split('.')[1]));
          const rol = payload.rol || payload.role || '';

          this.showSuccessAlert = true;

          setTimeout(() => {
            this.isLoading = false;
            if (rol === 'ROLE_ADMIN') {
              this.router.navigate(['/dashboard']);
            } else {
              this.router.navigate(['/dashboard']);
            }
          }, 1000);
        }
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Credenciales incorrectas';
        this.showErrorAlert = true;
      }
    });
  }
}
