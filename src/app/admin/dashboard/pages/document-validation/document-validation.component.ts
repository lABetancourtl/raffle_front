import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Modal } from 'bootstrap';
import { AdminService } from '../../../../services/admin.service';

// Definir interfaz para los datos del formulario
interface UserFormData {
  name: string;
  surName: string;
  docNumber: string;
  dateOfBirth: string;
}

@Component({
  selector: 'app-document-validation',
  imports: [CommonModule, FormsModule],
  templateUrl: './document-validation.component.html',
  styleUrl: './document-validation.component.css'
})
export class DocumentValidationComponent implements AfterViewInit, OnInit {

  usersEmailVerificado: any[] = [];
  selectedUser: any = null;
  userFormData: UserFormData = {
    name: '',
    surName: '',
    docNumber: '',
    dateOfBirth: ''
  };

  constructor(
    private adminService: AdminService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  ngAfterViewInit(): void {
    // Código de inicialización si es necesario
  }

  cargarUsuarios(): void {
    this.adminService.getUsuarioEmailVerificado().subscribe({
      next: (data) => {
        console.log('Usuarios con email verificado:', data);
        this.usersEmailVerificado = data;
      },
      error: (err) => {
        console.error('Error al obtener los usuarios:', err);
      }
    });
  }

  abrirModalConEmail(user: any): void {
    this.selectedUser = user;
    
    // Precargar datos existentes si están disponibles
    if (user) {
      this.userFormData = {
        name: user.name || '',
        surName: user.surName || '',
        docNumber: user.docNumber || '',
        dateOfBirth: user.dateOfBirth || ''
      };
    } else {
      // Resetear formulario si no hay usuario
      this.userFormData = {
        name: '',
        surName: '',
        docNumber: '',
        dateOfBirth: ''
      };
    }

    console.log('Usuario seleccionado:', this.selectedUser);
    const modalElement = document.getElementById('miModal');
    if (modalElement) {
      const bsModal = new Modal(modalElement);
      bsModal.show();
    }
  }

  activarUsuario(): void {
    if (this.selectedUser && this.validarFormulario()) {
      const datosCompletos = {
        id: this.selectedUser.id,
        email: this.selectedUser.email,
        name: this.userFormData.name,
        surName: this.userFormData.surName,
        docNumber: this.userFormData.docNumber,
        dateOfBirth: this.userFormData.dateOfBirth
      };

      this.adminService.activarUsuario(datosCompletos).subscribe({
        next: (response) => {
          console.log('Usuario activado:', response);

          this.cerrarModal();
          this.cargarUsuarios(); 
        },
        error: (err) => {
          console.error('Error al activar el usuario:', err);
        }
      });
    } else {
      console.error('No hay usuario seleccionado o formulario inválido.');
      alert('Por favor, complete todos los campos requeridos.');
    }   
  }

  private validarFormulario(): boolean {
    return this.userFormData.name.trim() !== '' && 
           this.userFormData.surName.trim() !== '' && 
           this.userFormData.docNumber.trim() !== '' && 
           this.userFormData.dateOfBirth.trim() !== '';
  }

  private cerrarModal(): void {
    const modalElement = document.getElementById('miModal');
    if (modalElement) {
      const bsModal = Modal.getInstance(modalElement);
      bsModal?.hide();
    }
    
    // Limpiar formulario
    this.userFormData = {
      name: '',
      surName: '',
      docNumber: '',
      dateOfBirth: ''
    };
  }
}