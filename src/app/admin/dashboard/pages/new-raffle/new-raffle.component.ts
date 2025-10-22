import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../services/admin.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-new-raffle',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './new-raffle.component.html',
  styleUrl: './new-raffle.component.css'
})

export class NewRaffleComponent {
  
  nuevaRifa = {
    nombre: '',
    descripcion: '',
    precio: null,
    compraMinima: 1,
    digitos: 2,
    paquetes: [null, null, null],
  };

  imagenSeleccionada: File | null = null;

  constructor(
    private adminService: AdminService,
    private router: Router,
    private http: HttpClient
  ) {}

  onFileSelected(event: any) {
    this.imagenSeleccionada = event.target.files[0];
  }

crearRifa() {
  if (!this.imagenSeleccionada) {
    alert('Debes seleccionar una imagen');
    return;
  }

  const formData = new FormData();
  formData.append('imagen', this.imagenSeleccionada);

  //Subimos la imagen usando el servicio
  this.adminService.subirFoto(formData).subscribe({
    next: (res) => {
      const urlImagen = res.url;
      const payload = {
        urlImagen,
        nameRaffle: this.nuevaRifa.nombre,
        description: this.nuevaRifa.descripcion,
        priceNumber: this.nuevaRifa.precio,
        minPurchase: this.nuevaRifa.compraMinima,
        digitLength: this.nuevaRifa.digitos,
        paquetes: this.nuevaRifa.paquetes, 
      };


      this.adminService.crearRifa(payload).subscribe({
        next: (res) => {
          console.log('Rifa creada:', res);
          alert('Rifa creada exitosamente');
          this.router.navigate(['/dashboard/raffles']);
        },
        error: (err) => {
          console.error('Error al crear rifa:', err);
          alert('Error al crear la rifa');
        }
      });
    },
    error: (err) => {
      console.error('Error al subir imagen:', err);
      alert('Error al subir la imagen');
    }
  });
}
}
