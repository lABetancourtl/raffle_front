import { Component, AfterViewInit, OnInit, ViewChild, ElementRef } from '@angular/core';
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


  @ViewChild('ruletaCanvas', { static: false }) ruletaCanvas!: ElementRef<HTMLCanvasElement>;


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


  // nuevas propiedades
  allNumbers: string[] = []; // lista completa para la ruleta
  isSpinning = false;
  private ctx!: CanvasRenderingContext2D | null;
  private canvasSize = 600;

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

  // ---------- Reemplaza tu ejecutarSorteo() por esta versión -------------
  ejecutarSorteo(): void {
    if (!this.puedeEjecutarSorteo()) return;

    this.ejecutandoSorteo = true;
    this.mensajeSorteo = 'Ejecutando sorteo...';

    const ganadoresSolicitados =
      this.configuracionSorteo.modalidad === 'multiple'
        ? this.configuracionSorteo.numeroGanadores
        : 1;

    this.raffleService.ejecutarSorteo(this.rifaSeleccionada.id, ganadoresSolicitados).subscribe({
      next: (res) => {
        const resultado = res?.respuesta;
        if (!resultado) {
          console.error('⚠️ No se recibió resultado válido:', res);
          this.ejecutandoSorteo = false;
          this.mensajeSorteo = 'Respuesta inválida del servidor.';
          return;
        }

        // guardamos ganadores (pero no declaramos ganador hasta terminar la animación)
        this.ganadores = resultado.ganadores || [];

        // guardamos acta
        this.actaSorteo = {
          id: resultado.actaId,
          fechaEjecucion: new Date(),
          semilla: resultado.semilla,
          hash: resultado.hash
        };

        // lista completa de tickets (para la ruleta)
        this.allNumbers = resultado.allNumbers || [];

        // renderizamos la ruleta con los números
        setTimeout(() => { // espera a que ViewChild esté disponible
          this.setupCanvas();
          this.drawWheel(this.allNumbers);
          // iniciamos la animación hacia el primer ganador
          if (this.ganadores.length > 0 && this.allNumbers.length > 0) {
            // hacemos girar por el primer ganador, luego podemos mostrar los demás
            this.isSpinning = true;
            const target = this.ganadores[0].numero;
            this.spinToNumber(target).then(() => {
              // al terminar
              this.isSpinning = false;
              this.sorteoEjecutado = true;
              this.ganadorSeleccionado = true;
              this.ejecutandoSorteo = false;
              this.mensajeSorteo = '¡Sorteo ejecutado exitosamente!';
              // si hay más ganadores (multiple), podrías animar de nuevo o simplemente listarlos
            }).catch(err => {
              console.error('Error en animación:', err);
              this.isSpinning = false;
              this.ejecutandoSorteo = false;
              this.mensajeSorteo = 'Error al animar la ruleta.';
            });
          } else {
            // no hay números: marcar como ejecutado igual
            this.sorteoEjecutado = true;
            this.ganadorSeleccionado = true;
            this.ejecutandoSorteo = false;
            this.mensajeSorteo = '¡Sorteo ejecutado (sin números)!';
          }
        }, 50);


      },
      error: (err) => {
        console.error(err);
        this.ejecutandoSorteo = false;
        this.mensajeSorteo = err?.error?.mensaje || 'Error al ejecutar el sorteo.';
      }
    });

  }

  // ---------------- Canvas / Ruleta ----------------

  private setupCanvas() {
    if (!this.ruletaCanvas) return;
    const canvas = this.ruletaCanvas.nativeElement;
    canvas.width = this.canvasSize;
    canvas.height = this.canvasSize;
    this.ctx = canvas.getContext('2d');
  }

  private drawWheel(numbers: string[]) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const size = this.canvasSize;
    const cx = size / 2;
    const cy = size / 2;
    const radius = Math.min(cx, cy) - 10;
    ctx.clearRect(0, 0, size, size);

    const count = numbers.length;
    if (count === 0) {
      // texto cuando no hay números
      ctx.fillStyle = '#333';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No hay boletos vendidos', cx, cy);
      return;
    }

    const degPer = 2 * Math.PI / count;
    ctx.save();
    ctx.translate(cx, cy);

    // dibuja segmentos
    for (let i = 0; i < count; i++) {
      const start = i * degPer;
      const end = start + degPer;

      // alterna colores para que se distingan (usar tonos grises)
      const shade = (i % 2 === 0) ? 230 : 205;
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      ctx.fill();

      // texto en segmento
      ctx.save();
      ctx.rotate(start + degPer / 2);
      ctx.translate(radius * 0.6, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#111';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(numbers[i], 0, 0);
      ctx.restore();
    }

    // círculo central
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Anima la ruleta para que termine en targetNumber (string)
   * Devuelve una promesa que se resuelve cuando termina la animación.
   */
  private spinToNumber(targetNumber: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ctx || !this.ruletaCanvas) return reject('Canvas no inicializado');
      const canvas = this.ruletaCanvas.nativeElement;
      const ctx = this.ctx!;
      const numbers = this.allNumbers;
      const count = numbers.length;
      if (count === 0) return reject('Sin números');

      const targetIndex = numbers.indexOf(targetNumber);
      if (targetIndex === -1) {
        console.warn('target no encontrado en la lista de números; se escogerá aleatorio');
      }

      const degreesPer = 360 / count;
      // calcular ángulo final donde el centro de segmento quede en el pointer (0°)
      const idx = Math.max(0, targetIndex === -1 ? Math.floor(Math.random()*count) : targetIndex);

      // cantidad de vueltas extra (aleatorio para "emoción")
      const extraTurns = 5 + Math.floor(Math.random() * 3); // entre 5 y 7 vueltas
      // calculo de rotación final en grados: hacemos que el segmento idx quede en el tope (pointer)
      // hacemos corrección para centrar en la mitad del segmento
      const finalAngleDeg = extraTurns * 360 + (360 - (idx * degreesPer) - degreesPer / 2);

      // animación con easing
      const duration = 5000 + Math.floor(Math.random() * 1500); // 5-6.5s
      const start = performance.now();
      const initialRotation = 0; // asumimos dibujo inicial sin rotación
      const animate = (now: number) => {
        const elapsed = now - start;
        let t = Math.min(1, elapsed / duration);
        // cubic easing out sin modificar t
        const eased = 1 - Math.pow(1 - t, 3);
        const currentDeg = initialRotation + eased * finalAngleDeg;
        this.drawWheelRotated(currentDeg % 360);
        if (elapsed < duration) {
          requestAnimationFrame(animate);
        } else {
          // draw final (asegurar posición exacta)
          this.drawWheelRotated(finalAngleDeg % 360);
          resolve();
        }
      };
      requestAnimationFrame(animate);
    });
  }

  /**
   * Dibuja la ruleta rotada en grados (0 = la ruleta sin rotación, pointer en top)
   */
  private drawWheelRotated(rotationDeg: number) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const size = this.canvasSize;
    const cx = size / 2;
    const cy = size / 2;
    const radius = Math.min(cx, cy) - 10;
    ctx.clearRect(0, 0, size, size);

    const numbers = this.allNumbers;
    const count = numbers.length;
    if (count === 0) return;

    const degPer = 2 * Math.PI / count;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((rotationDeg * Math.PI) / 180); // rotamos todo

    // dibuja segmentos (misma lógica que drawWheel pero con la rotación aplicada)
    for (let i = 0; i < count; i++) {
      const start = i * degPer;
      const end = start + degPer;

      const shade = (i % 2 === 0) ? 230 : 205;
      ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      ctx.fill();

      ctx.save();
      ctx.rotate(start + degPer / 2);
      ctx.translate(radius * 0.6, 0);
      ctx.rotate(Math.PI / 2);
      ctx.fillStyle = '#111';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(numbers[i], 0, 0);
      ctx.restore();
    }

    // círculo central
    ctx.beginPath();
    ctx.fillStyle = '#ffffff';
    ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }


  get mostrarRuleta(): boolean {
  return this.ejecutandoSorteo || this.isSpinning ||
         (this.sorteoEjecutado && this.allNumbers && this.allNumbers.length > 0);
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
