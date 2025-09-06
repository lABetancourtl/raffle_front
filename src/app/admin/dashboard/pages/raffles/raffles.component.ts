import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Modal } from 'bootstrap';
import { RaffleService } from '../../../../services/raffle.service';
import { AdminService } from '../../../../services/admin.service';
import { countries } from 'countries-list';

@Component({
  selector: 'app-raffles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './raffles.component.html',
  styleUrls: ['./raffles.component.css']
})
export class RafflesComponent implements AfterViewInit, OnInit {

  

  paquetes: number[] = [];
  raffle: any = null;

  adminCompra = {
    buyerName: '',
    buyerApellido: '',
    buyerEmail: '',
    buyerConfirmarEmail: '',
    buyerPais: 'Colombia', // Valor por defecto
    buyerPrefix: '+57', // Valor por defecto
    buyerPhone: '',
    quantity: 1,
    tipoAsignacion: '', 
    numeroManual: ''
  };

    // Lista de países y prefijos
  paises: any[] = [];
  prefijosUnicos: string[] = [];

  mensajeAsignacionAdmin: string = '';

  userNumbers: any[] = [];
  

  raffles: any[] = [];
  rifaSeleccionada: any = null;
  modalInstance: any;

  numeroCliente: string = '';
  mensajeCliente: string = '';
  cliente: any = null;

  paymentOperations: any[] = [];
  cargandoOperaciones: boolean = false;

  constructor(
    private raffleService: RaffleService,
    private adminService: AdminService,
    private http: HttpClient
  ) {
      this.paises = Object.entries(countries)
        .map(([code, c]) => ({
          nombre: c.name,
          prefijo: c.phone,
          codigo: code
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre));
        // Obtener prefijos únicos
        this.prefijosUnicos = [...new Set(this.paises.map(p => p.prefijo))].sort();
  }

  ngOnInit(): void {
    this.raffleService.getAllRaffles().subscribe({
      next: (data) => {
        this.raffles = data;
      },
      error: (err) => {
        console.error('Error al obtener las rifas', err);
      }
    });
  }

abrirModalRifa(raffle: any): void {
  this.raffle = raffle;
  this.rifaSeleccionada = raffle;
  this.numeroCliente = '';
  this.mensajeCliente = '';
  this.cliente = null;
  this.paymentOperations = [];
  this.cargandoOperaciones = true;
  this.paquetes = this.rifaSeleccionada.paquetes;

  // Llamar servicio para operaciones de pago
  this.raffleService.getOperacionesByRaffle(raffle.id).subscribe({
    next: (operaciones) => {
      this.paymentOperations = operaciones;
      this.cargandoOperaciones = false;
    },
    error: (err) => {
      console.error('Error al obtener operaciones de pago:', err);
      this.paymentOperations = [];
      this.cargandoOperaciones = false;
    }
  });

  // Mostrar el modal
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

  const raffleId = this.raffle.id;

  this.raffleService.obtenerClientePorNumero(raffleId, numero).subscribe({
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

getColorEstadoPago(status: string): string {
  switch (status?.toLowerCase()) {
    case 'approved': return 'success';
    case 'pending': return 'warning';
    case 'rejected': return 'danger';
    default: return 'secondary';
  }
}

asignarDesdeAdmin(): void {
  if (!this.rifaSeleccionada?.id) {
    this.mensajeAsignacionAdmin = 'No se ha seleccionado una rifa.';
    return;
  }

  const data = {
    ...this.adminCompra,
    raffleId: this.rifaSeleccionada.id
  };



  if (this.adminCompra.tipoAsignacion === "aleatoria") {
    console.log("Entró en asignación aleatoria");

    this.adminService.compraAleatoriaDesdeAdmin(data).subscribe({
      next: (res) => this.handleAsignacionExitosa(res),
      error: (err) => {
        console.error(err);
        this.mensajeAsignacionAdmin = 'Error al asignar los números desde Admin.';
      }
    });

  } else if (this.adminCompra.tipoAsignacion === "manual") {
    // ✅ Validación del campo numeroManual
    if (!this.adminCompra.numeroManual || this.adminCompra.numeroManual.trim() === '') {
      this.mensajeAsignacionAdmin = 'Debes ingresar un número manual.';
      return;
    }

    console.log("Entró en asignación manual");

    this.adminService.compraManualDesdeAdmin(data, this.adminCompra.numeroManual).subscribe({
      next: (res) => this.handleAsignacionExitosa(res),
      error: (err) => {
        console.error(err);
        this.mensajeAsignacionAdmin = 'Error al asignar el número manual desde Admin.';
      }
    });
  }
}

private handleAsignacionExitosa(res: any): void {
  this.mensajeAsignacionAdmin = `Números asignados exitosamente para ${this.adminCompra.buyerName} ${this.adminCompra.buyerApellido} con email ${this.adminCompra.buyerEmail}`;

  this.userNumbers = res.respuesta.map((item: any) => item.numero.padStart(4, '0'));

  const modalElement = document.getElementById('emailModal');
  if (modalElement) {
    this.modalInstance = new Modal(modalElement);
    this.modalInstance.show();
  }

  this.adminCompra = {
    buyerName: '',
    buyerApellido: '',
    buyerEmail: '',
    buyerConfirmarEmail: '',
    buyerPais: '',
    buyerPrefix: '',
    buyerPhone: '',
    quantity: 1,
    tipoAsignacion: 'Aleatoria',
    numeroManual: ''
  };
}


resetearFormularioAdmin(): void {
  this.adminCompra = {
    buyerName: '',
    buyerApellido: '',
    buyerEmail: '',
    buyerConfirmarEmail: '',
    buyerPais: 'Colombia',  // valor por defecto
    buyerPrefix: '+57',     // valor por defecto
    buyerPhone: '',
    quantity: 1,
    tipoAsignacion: 'aleatoria', // valor por defecto
    numeroManual: ''
  };

  this.mensajeAsignacionAdmin = '';
  this.userNumbers = [];
}



  ngAfterViewInit(): void {
  const modalElement = document.getElementById('detalleRifaModal');
  if (modalElement) {
    modalElement.addEventListener('hidden.bs.modal', () => {
      this.resetearFormularioAdmin();
    });
  }
}


  // Actualiza el prefijo cuando cambia el país
  actualizarPrefijo() {
    const paisSeleccionado = this.paises.find(p => p.nombre === this.adminCompra.buyerPais);
    if (paisSeleccionado) {
      this.adminCompra.buyerPrefix = paisSeleccionado.prefijo;
    }
  }


  

  

}



