import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Modal } from 'bootstrap';
import { RaffleService } from '../../../../services/raffle.service';

@Component({
  selector: 'app-raffles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './raffles.component.html',
  styleUrls: ['./raffles.component.css']
})
export class RafflesComponent {
  raffles: any[] = [];
  rifaSeleccionada: any = null;
  modalInstance: any;

  numeroCliente: string = '';
  mensajeCliente: string = '';
  cliente: any = null;

  constructor(
    private raffleService: RaffleService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.raffleService.getAllRaffles().subscribe({
      next: (data) => {
        this.raffles = data;
        console.log('Rifas recibidas:', this.raffles);
      },
      error: (err) => {
        console.error('Error al obtener las rifas', err);
      }
    });
  }

  abrirModalRifa(raffle: any): void {
    this.rifaSeleccionada = raffle;
    this.numeroCliente = '';
    this.mensajeCliente = '';
    this.cliente = null;

    const modalElement = document.getElementById('detalleRifaModal');
    if (modalElement) {
      this.modalInstance = new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  consultarCliente(numero: string): void {
    if (!numero) {
      this.mensajeCliente = 'Por favor ingresa un número válido.';
      return;
    }

    this.raffleService.obtenerClientePorNumero(numero).subscribe({
      next: (res) => {
        this.mensajeCliente = res.respuesta?.mensaje || '';
        this.cliente = res.respuesta?.cliente || null;
      },
      error: (err) => {
        this.cliente = null;
        this.mensajeCliente = 'Cliente no encontrado o error en la consulta';
        console.error(err);
      }
    });
  }

  cambiarEstadoRifa(raffleId: string, estadoActual: string): void {
    let nuevoEstado: string;

    switch (estadoActual) {
      case 'ACTIVO':
        nuevoEstado = 'PAUSA';
        break;
      case 'PAUSA':
        nuevoEstado = 'ACTIVO';
        break;
      default:
        return;
    }

    const dto = {
      id: raffleId,
      nuevoEstado: nuevoEstado
    };

    this.raffleService.cambiarEstadoRifa(dto).subscribe({
      next: (res) => {
        console.log('Estado cambiado:', res);
        this.actualizarLista();
      },
      error: (err) => {
        console.error('Error al cambiar el estado', err);
        alert('No se pudo cambiar el estado');
      }
    });
  }

  actualizarLista(): void {
    this.raffleService.getAllRaffles().subscribe({
      next: (data) => this.raffles = data,
      error: (err) => console.error('Error al refrescar rifas', err)
    });
  }

  getColorEstado(estado: string): string {
  switch (estado) {
    case 'ACTIVO': return 'success';
    case 'PAUSA': return 'warning';
    case 'FINALIZADO': return 'danger';
    default: return 'secondary';
  }
}

}
