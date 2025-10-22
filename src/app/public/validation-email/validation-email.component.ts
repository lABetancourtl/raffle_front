import { Component } from '@angular/core';
import { LoginService } from '../../services/login.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-validation-email',
  imports: [CommonModule, FormsModule],
  templateUrl: './validation-email.component.html',
  styleUrls: ['./validation-email.component.css']
})
export class ValidationEmailComponent {

  email: string = '';
  codigoValidacion: string = '';
  showErrorAlert: boolean = false;
  errorMsg: any;

  constructor(
    private loginService: LoginService,
    private snackBar: MatSnackBar,
  ) {}  

  validarEmail() {
    if (!this.email || !this.codigoValidacion) {
      this.errorMsg = 'Por favor completa todos los campos requeridos.';
      return;
    }

    const datosActivacion = {
      codigoValidacion: this.codigoValidacion,
      email: this.email
    };

    this.loginService.validarEmail(datosActivacion).subscribe({
      next: (response) => {

        console.log('Respuesta del servidor:', response);
        if(response.error === false) {
        this.snackBar.open('Cuenta activada correctamente', 'Cerrar', { duration: 3000 });
        window.location.href = '/home';
        }
        else {
          this.errorMsg = response.mensaje || 'Error al validar el email. Por favor, intenta de nuevo.';
        }
      },
      error: (error: any) => {
        console.error('Error al validar el email:', error);
        this.errorMsg = error.error?.mensaje || 'Error al validar el email. Por favor, intenta de nuevo.';
      }
    });
  }
}