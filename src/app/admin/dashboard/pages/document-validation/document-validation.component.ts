import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Modal } from 'bootstrap';
import { AdminService } from '../../../../services/admin.service';

@Component({
  selector: 'app-document-validation',
  imports: [CommonModule, FormsModule],
  templateUrl: './document-validation.component.html',
  styleUrl: './document-validation.component.css'
})
export class DocumentValidationComponent implements AfterViewInit, OnInit{


  usersEmailVerificado: any[] = [];
  selectedEmail: string = '';

  constructor(
    private adminService: AdminService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
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

  ngAfterViewInit(): void {

  }

abrirModalConEmail(email: string): void {
  this.selectedEmail = email;
  const modalElement = document.getElementById('miModal');
  if (modalElement) {
    // @ts-ignore
    const bsModal = new window.bootstrap.Modal(modalElement);
    bsModal.show();
  }
}

}
