import { Component, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
    buyerPais: 'Colombia',
    buyerPrefix: '+57',
    buyerPhone: '',
    quantity: 1,
    tipoAsignacion: 'aleatoria',
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

  // Propiedades para el sorteo
  sorteoEjecutado: boolean = false;
  ganadorSeleccionado: boolean = false;
  validandoSorteo: boolean = false;
  ejecutandoSorteo: boolean = false;
  mensajeSorteo: string = 'El sorteo no ha sido ejecutado aún.';

  validaciones = {
    rifaFinalizada: false,
    boletosVendidos: false,
    sinDevolucionesPendientes: false
  };

  configuracionSorteo = {
    numeroGanadores: 1,
    modalidad: 'unico'
  };

  totalBoletosVendidos: number = 0;
  ganadores: any[] = [];
  actaSorteo: any = null;

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

    // Resetear estado del sorteo
    this.sorteoEjecutado = false;
    this.ganadorSeleccionado = false;
    this.ganadores = [];
    this.actaSorteo = null;

    // Validar condiciones para el sorteo
    this.validarCondicionesSorteo(raffle);

    // Cargar operaciones de pago
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

    const modalElement = document.getElementById('detalleRifaModal');
    if (modalElement) {
      this.modalInstance = new Modal(modalElement);
      this.modalInstance.show();
    }
  }

  validarCondicionesSorteo(raffle: any): void {
    this.validaciones.rifaFinalizada =
      raffle.stateRaffle === 'FINALIZADO' || raffle.stateRaffle === 'PAUSA';
    this.validaciones.boletosVendidos = raffle.porcentajeVendidos > 0;
    this.validaciones.sinDevolucionesPendientes = true;

    const totalPosibles = Math.pow(10, raffle.digitLength);
    this.totalBoletosVendidos = Math.floor((raffle.porcentajeVendidos / 100) * totalPosibles);

    this.actualizarMensajeSorteo();
  }

  actualizarMensajeSorteo(): void {
    if (!this.validaciones.rifaFinalizada) {
      this.mensajeSorteo = 'La rifa debe estar finalizada para ejecutar el sorteo.';
    } else if (!this.validaciones.boletosVendidos) {
      this.mensajeSorteo = 'No hay boletos vendidos para realizar el sorteo.';
    } else if (!this.validaciones.sinDevolucionesPendientes) {
      this.mensajeSorteo = 'Existen devoluciones pendientes que deben resolverse.';
    } else if (this.sorteoEjecutado) {
      this.mensajeSorteo = 'El sorteo ha sido ejecutado exitosamente.';
    } else {
      this.mensajeSorteo = 'La rifa está lista para ejecutar el sorteo.';
    }
  }

  puedeEjecutarSorteo(): boolean {
    return (
      this.validaciones.rifaFinalizada &&
      this.validaciones.boletosVendidos &&
      this.validaciones.sinDevolucionesPendientes &&
      !this.sorteoEjecutado
    );
  }

  ejecutarSorteo(): void {
    if (!this.puedeEjecutarSorteo()) return;

    this.ejecutandoSorteo = true;
    this.mensajeSorteo = 'Ejecutando sorteo...';

    const ganadoresSolicitados =
      this.configuracionSorteo.modalidad === 'multiple'
        ? this.configuracionSorteo.numeroGanadores
        : 1;

    // Llamar al backend real
    this.raffleService.ejecutarSorteo(this.rifaSeleccionada.id, ganadoresSolicitados).subscribe({
      next: (res) => {
        const resultado = res?.respuesta;
        if (!resultado) {
          console.error('⚠️ No se recibió resultado válido:', res);
          return;
        }

        this.ganadores = resultado.ganadores || [];

        this.actaSorteo = {
          id: resultado.actaId, // 👈 corregido
          fechaEjecucion: new Date(),
          semilla: resultado.semilla,
          hash: resultado.hash
        };

        console.log('✅ Acta registrada:', this.actaSorteo);


        this.sorteoEjecutado = true;
        this.ganadorSeleccionado = true;
        this.ejecutandoSorteo = false;
        this.mensajeSorteo = '¡Sorteo ejecutado exitosamente!';
      },
      error: (err) => {
        console.error(err);
        this.ejecutandoSorteo = false;
        this.mensajeSorteo = err?.error?.mensaje || 'Error al ejecutar el sorteo.';
      }
    });

  }

  generarHash(): string {
    return 'SHA256:' + Math.random().toString(36).substr(2, 32).toUpperCase();
  }

  descargarActa(): void {

    const actaId = this.actaSorteo?.id;
    if (!actaId) {
      console.error('No hay acta registrada aún');
      return;
    }

    this.raffleService.descargarActa(actaId).subscribe((pdfBlob: Blob) => {
      const url = window.URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ActaSorteo_${actaId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    });


  }

  notificarGanadores(): void {
    console.log('Notificando a los ganadores...');
    // Llamar servicio backend si deseas enviar correos
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
      next: () => this.actualizarLista(),
      error: (err) => {
        console.error('Error al cambiar el estado', err);
        alert('No se pudo cambiar el estado');
      }
    });
  }

  actualizarLista(): void {
    this.raffleService.getAllRaffles().subscribe({
      next: (data) => (this.raffles = data),
      error: (err) => console.error('Error al refrescar rifas', err)
    });
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'ACTIVO':
        return 'success';
      case 'PAUSA':
        return 'warning';
      case 'FINALIZADO':
        return 'danger';
      default:
        return 'secondary';
    }
  }

  getColorEstadoPago(status: string): string {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'danger';
      default:
        return 'secondary';
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

    if (this.adminCompra.tipoAsignacion === 'aleatoria') {
      this.adminService.compraAleatoriaDesdeAdmin(data).subscribe({
        next: (res) => this.handleAsignacionExitosa(res),
        error: (err) => {
          console.error(err);
          this.mensajeAsignacionAdmin = 'Error al asignar los números desde Admin.';
        }
      });
    } else if (this.adminCompra.tipoAsignacion === 'manual') {
      if (!this.adminCompra.numeroManual || this.adminCompra.numeroManual.trim() === '') {
        this.mensajeAsignacionAdmin = 'Debes ingresar un número manual.';
        return;
      }

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

    this.resetearFormularioAdmin();
  }

  resetearFormularioAdmin(): void {
    this.adminCompra = {
      buyerName: '',
      buyerApellido: '',
      buyerEmail: '',
      buyerConfirmarEmail: '',
      buyerPais: 'Colombia',
      buyerPrefix: '+57',
      buyerPhone: '',
      quantity: 1,
      tipoAsignacion: 'aleatoria',
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

  actualizarPrefijo(): void {
    const paisSeleccionado = this.paises.find(p => p.nombre === this.adminCompra.buyerPais);
    if (paisSeleccionado) {
      this.adminCompra.buyerPrefix = paisSeleccionado.prefijo;
    }
  }
}
