import { Component, OnInit, AfterViewInit, ViewChild, HostListener } from '@angular/core';
import { RaffleService } from '../../services/raffle.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { enviroments } from '../../../enviroments/enviroments';
import { countries, ICountry } from 'countries-list';
import { RegisterService } from '../../services/register.service';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LoginService } from '../../services/login.service';


// Define una interfaz para nuestro país personalizado
interface PaisPersonalizado {
  nombre: string;
  prefijo: string;
  codigo: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit, AfterViewInit {
  cantidadDisponible: number = 0;
  mostrarModalReducido: boolean = false;
  precioFinal: number = 0;


  selectedCurrency: string = 'COP'; // Valor por defecto

  paquetes: number[] = [];

  // Estado del dropdown de usuario
  isDropdownOpen = false;

  //Ver o debar de ver contraseña (login, register)
  showPassword = false;
  showConfirmPassword = false;
  registerPassword = '';
  registerConfirmPassword = '';
  registerEmail = '';

  //Subida de documentos
  docFront: File | null = null;
  docBack: File | null = null;

  //Datos crear usuario no validaado (proceso 1)
  newUserNotValidated = {
    email: '',
    password: '',
  }


  instagramUrl = enviroments.instagramUrl;
  telegramUrl = enviroments.telegramUrl;
  raffle: any = null;
  selectedPackage: number | null = null;
  testimonials: any;

  // Fondos (números por email)
  emailUser: string = '';
  userNumbers: string[] = []; 
  errorMsg: string = '';
  loading: boolean = false;
  formSubmitted: boolean = false;

  // Datos del comprador
  buyerData = {
    buyerName: '',
    buyerApellido: '',
    buyerPais: 'Colombia', // Valor por defecto
    buyerEmail: '',
    buyerConfirmarEmail: '',
    buyerPrefix: '+57', // Valor por defecto
    buyerPhone: ''
  };

  // Lista de países y prefijos
  paises: any[] = [];
  prefijosUnicos: string[] = [];

  @ViewChild('emailForm') emailForm!: NgForm;

  constructor(
    private raffleService: RaffleService,
    private registerService: RegisterService,
    private loginService: LoginService,
    private router: Router,
    private http: HttpClient

  ) {
    // Convertir el objeto countries a array y ordenar
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

  ngAfterViewInit() {
    const modalElement = document.getElementById('emailModal');
    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', () => {
        this.resetModal();
      });
    }
  }

ngOnInit(): void {
  this.raffleService.getRaffleActiva().subscribe({
    next: (data) => {
      this.raffle = data;
      console.log('Rifa activa recibida:', this.raffle);

      // ✅ Extraer paquetes si vienen en la respuesta
      if (this.raffle && this.raffle.paquetes) {
        this.paquetes = this.raffle.paquetes;
      } else {
        this.paquetes = []; 
      }
    },
    error: (err) => {
      console.error('Error al obtener la rifa activa', err);
    }
  });
}


  selectPackage(quantity: number): void {
    this.selectedPackage = this.selectedPackage === quantity ? null : quantity;
  }

  consultarFondos(): void {
    this.formSubmitted = true;
    this.errorMsg = '';
    this.userNumbers = [];

    if (!this.emailUser) {
      this.errorMsg = 'Por favor ingresa un email.';
      return;
    }

    const emailPattern = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+$/;
    if (!emailPattern.test(this.emailUser)) {
      this.errorMsg = 'Email no válido.';
      return;
    }

    this.loading = true;

    this.raffleService.obtenerNumerosPorEmail(this.emailUser).subscribe({
      next: (data) => {
        console.log("data: ", data)
        this.userNumbers = data.map((item: any) => item.numero.padStart(4, '0'));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error consultando números:', err);
        this.errorMsg = 'No se pudieron obtener los fondos.';
        this.loading = false;
      }
    });
  }

  // Actualiza el prefijo cuando cambia el país
  actualizarPrefijo() {
    const paisSeleccionado = this.paises.find(p => p.nombre === this.buyerData.buyerPais);
    if (paisSeleccionado) {
      this.buyerData.buyerPrefix = paisSeleccionado.prefijo;
    }
  }

  resetModal() {
    this.emailUser = '';
    this.userNumbers = [];
    this.errorMsg = '';
    this.loading = false;
    this.formSubmitted = false;
    if (this.emailForm) {
      this.emailForm.resetForm();
    }
  }

  /* Mercado Pago - ya no se usa
validarYRealizarPago() {
    console.log("desde validarYRealizarPago al inicio: ",this.selectedPackage)
  if (!this.selectedPackage || !this.buyerData.buyerName || !this.buyerData.buyerApellido ||
      !this.buyerData.buyerPais || !this.buyerData.buyerPrefix || !this.buyerData.buyerPhone ||
      !this.buyerData.buyerEmail || !this.buyerData.buyerConfirmarEmail) {
    alert('Por favor completa todos los campos requeridos antes de pagar.');
    return;
  }

  if (!this.raffle) {
    alert('No se ha cargado la información de la rifa. Por favor intenta nuevamente.');
    return;
  }

  let precioPaquete = 0;
  let nombrePaquete = `Paquete de ${this.selectedPackage} números`;

  if (this.raffle.priceNumber) {
    precioPaquete = this.selectedPackage * this.raffle.priceNumber;
    this.precioFinal = precioPaquete;
  } else if (this.raffle.packages) {
    const paquete = this.raffle.packages.find((p: any) => p.cantidad === this.selectedPackage);
    if (paquete) {
      precioPaquete = paquete.precio;
      nombrePaquete = paquete.nombre || nombrePaquete;
    }
  }
    console.log("precioPaquete: ",precioPaquete)
const datosPago = {
  descripcion: nombrePaquete,
  cantidad: 1,
  precio: precioPaquete,
  email: this.buyerData.buyerEmail,

  buyer: {
    raffleId: this.raffle.id,
    quantity: this.selectedPackage,
    buyerName: this.buyerData.buyerName,
    buyerApellido: this.buyerData.buyerApellido,
    buyerPais: this.buyerData.buyerPais,
    buyerEmail: this.buyerData.buyerEmail,
    buyerConfirmarEmail: this.buyerData.buyerConfirmarEmail,
    buyerPrefix: this.buyerData.buyerPrefix,
    buyerPhone: this.buyerData.buyerPhone,
  }
};


  this.raffleService.crearPreferenciaPago(datosPago).subscribe({
    next: (response) => {
      if (response && response.init_point) {
        window.location.href = response.init_point; // 🔁 Redirige al Checkout Pro
      } else {
        alert('Error al obtener enlace de pago.');
      }
    },
    error: (err) => {
      console.error('Error al crear preferencia de pago:', err);
      alert('Ocurrió un error al procesar el pago.');
    }
  });
}

*/

validarYRealizarPago() {
  console.log("desde validarYRealizarPago al inicio: ", this.selectedPackage);

  // 🔹 Validaciones de campos
  if (!this.selectedPackage || !this.buyerData.buyerName || !this.buyerData.buyerApellido ||
      !this.buyerData.buyerPais || !this.buyerData.buyerPrefix || !this.buyerData.buyerPhone ||
      !this.buyerData.buyerEmail || !this.buyerData.buyerConfirmarEmail) {
    alert('Por favor completa todos los campos requeridos antes de pagar.');
    return;
  }

  if (!this.raffle) {
    alert('No se ha cargado la información de la rifa. Por favor intenta nuevamente.');
    return;
  }

  // 🔹 Calcular precio
  let precioPaquete = 0;
  let nombrePaquete = `Paquete de ${this.selectedPackage} números`;

  if (this.raffle.priceNumber) {
    precioPaquete = this.selectedPackage * this.raffle.priceNumber;
    this.precioFinal = precioPaquete;
  } else if (this.raffle.packages) {
    const paquete = this.raffle.packages.find((p: any) => p.cantidad === this.selectedPackage);
    if (paquete) {
      precioPaquete = paquete.precio;
      nombrePaquete = paquete.nombre || nombrePaquete;
    }
  }

  console.log("precioPaquete: ", precioPaquete);

  // 🔹 Construir objeto PagoRequestDTO compatible con backend
  const datosPago = {
    descripcion: nombrePaquete,
    cantidad: this.selectedPackage,
    precio: precioPaquete,
    email: this.buyerData.buyerEmail,
    buyer: {
      raffleId: this.raffle.id,
      quantity: this.selectedPackage,
      buyerName: this.buyerData.buyerName,
      buyerApellido: this.buyerData.buyerApellido,
      buyerPais: this.buyerData.buyerPais,
      buyerEmail: this.buyerData.buyerEmail,
      buyerConfirmarEmail: this.buyerData.buyerConfirmarEmail,
      buyerPrefix: this.buyerData.buyerPrefix,
      buyerPhone: this.buyerData.buyerPhone
    }
  };

  // 🔹 Llamada al backend para generar transacción Wompi
  this.raffleService.crearTransaccionWompi(datosPago).subscribe({
    next: (response: any) => {
      if (response && response.publicKey) {
        // 🔹 Generar botón Wompi con datos devueltos por backend
        this.generarBotonWompi(response);
      } else {
        alert('Error al obtener datos de pago de Wompi.');
      }
    },
    error: (err) => {
      console.error('Error al crear transacción Wompi:', err);
      alert('Ocurrió un error al procesar el pago.');
    }
  });
}

generarBotonWompi(data: any) {
  const script = document.createElement('script');
  script.src = 'https://checkout.wompi.co/widget.js';
  script.setAttribute('data-render', 'button');
  script.setAttribute('data-public-key', data.publicKey);
  script.setAttribute('data-currency', data.currency);
  script.setAttribute('data-amount-in-cents', data.amountInCents);
  script.setAttribute('data-reference', data.reference);
  script.setAttribute('data-signature:integrity', data.signatureIntegrity);
  script.setAttribute('data-customer-email', data.customerEmail);

  const container = document.getElementById('wompi-button-container');
  if (container) {
    container.innerHTML = '';
    container.appendChild(script);
  }
}




consultarCantidadNumerosDisponibles(): void {
  const token = localStorage.getItem('token');

  if (!token) {
    alert('Debes iniciar sesión para poder comprar.');
    this.openModal('login'); 
    return;
  }

  if (!this.raffle || !this.raffle.id || !this.selectedPackage) {
    return;
  }

  this.raffleService.obtenerCantidadNumerosDisponibles(this.raffle.id).subscribe({
    next: (respuesta) => {
      this.cantidadDisponible = respuesta.respuesta;

      if (this.cantidadDisponible >= this.selectedPackage!) {
        this.cargarDatosUsuario(); 
        const modal = new (window as any).bootstrap.Modal(
          document.getElementById('purchaseModal')
        );
        modal.show();
      } else if (this.cantidadDisponible > 0) {
        const modalReducido = new (window as any).bootstrap.Modal(
          document.getElementById('disponibilidadModal')
        );
        modalReducido.show();
      } else {
        alert('Lo sentimos, ya no hay números disponibles para esta rifa.');
      }
    },
    error: (err) => {
      console.error('Error al verificar disponibilidad:', err);
      alert('Hubo un problema al verificar los números disponibles.');
    }
  });
}


confirmarCompraReducida(): void {
  this.selectedPackage = this.cantidadDisponible;
  console.log("desde confirmarCompraReducida: ",this.selectedPackage)
  const modal = new (window as any).bootstrap.Modal(document.getElementById('purchaseModal'));
  modal.show();
  const modalReducido = (window as any).bootstrap.Modal.getInstance(document.getElementById('disponibilidadModal'));
  modalReducido.hide();
}


// Manejo del dropdown de usuario (login, register)
toggleDropdown(event: Event) {
  event.preventDefault(); 
  this.isDropdownOpen = !this.isDropdownOpen;
}

// Cierra el dropdown si se hace clic fuera de él (login, register)
@HostListener('document:click', ['$event'])
clickOutside(event: Event) {
  if (!(event.target as HTMLElement).closest('.nav-item.dropdown')) {
    this.isDropdownOpen = false;
  }
}

// Abre el modal correspondiente y cierra el dropdown (login, register)
openModal(type: 'login' | 'register') {
  this.isDropdownOpen = false; 
  const modalId = type === 'login' ? 'loginModal' : 'registerModal';
  const modalEl = document.getElementById(modalId);
  if (modalEl) {
    const Modal = (window as any).bootstrap.Modal; 
    const modal = new Modal(modalEl);
    modal.show();
  }
}

onFileSelected(event: Event, type: 'front' | 'back') {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    if (type === 'front') {
      this.docFront = input.files[0];
    } else {
      this.docBack = input.files[0];
    }
  }
}

registrarUsuario() {
  if (!this.registerEmail || !this.registerPassword || !this.registerConfirmPassword || !this.docFront || !this.docBack) {
    this.errorMsg = 'Por favor completa todos los campos requeridos.';
    return;
  }

  if (this.registerPassword !== this.registerConfirmPassword) {
    this.errorMsg = 'Las contraseñas no coinciden.';
    return;
  }

  const formData = new FormData();
  formData.append('imagenes', this.docFront);
  formData.append('imagenes', this.docBack);

  this.registerService.subirFotos(formData).subscribe({
    next: (res) => {
      const urlImagDocFront = res.urls[0];
      const urlImagDocBack = res.urls[1];
      const payload = {
        urlImagDocFront,
        urlImagDocBack,
        email: this.registerEmail,
        password: this.registerPassword,
      };


      this.registerService.registrarUsuario(payload).subscribe({
        next: (res) => {
          console.log('Usuario registrado:', res);
          alert('Registro exitoso. Por favor verifica tu email antes de iniciar sesión.');
          this.router.navigate(['/']);
        },
        error: (err) => {
          console.error('Error al registrar usuario:', err);
          this.errorMsg = err.error?.message || 'Error al registrar usuario.';
        }
      });
    },
    error: (err) => {
      console.error('Error al subir documentos:', err);
      this.errorMsg = 'Error al subir los documentos.';
    }
  });
}


loginUser() {
  if (!this.registerEmail || !this.registerPassword) {
    this.errorMsg = 'Por favor completa todos los campos requeridos.';
    return;
  }

  const payload = {
    email: this.registerEmail,
    password: this.registerPassword,
  };

  this.loginService.loginUser(payload).subscribe({
    next: (res) => {
      // Ahora backend devuelve: { error: false, respuesta: { token, refreshToken, name, surName, email } }
      if (res?.error === false && res.respuesta?.token) {
        // Guardar token
        localStorage.setItem('token', res.respuesta.token);

        // Guardar datos de usuario
        const userData = {
          name: res.respuesta.name,
          surName: res.respuesta.surName,
          email: res.respuesta.email
        };
        localStorage.setItem('user', JSON.stringify(userData));

        alert('Inicio de sesión exitoso.');
        this.router.navigate(['/']);
      } else {
        this.errorMsg = 'No se pudo obtener el token.';
      }
    },
    error: (err) => {
      console.error('Error al iniciar sesión:', err);
      this.errorMsg = err.error?.message || 'Error al iniciar sesión.';
    }
  });
}


cargarDatosUsuario() {
  const userData = localStorage.getItem('user');
  if (userData) {
    const usuario = JSON.parse(userData);

    this.buyerData = {
      buyerName: usuario.name || '',
      buyerApellido: usuario.surName || '',
      buyerPais: this.buyerData?.buyerPais || '',   // país lo dejas vacío hasta que seleccione
      buyerPrefix: this.buyerData?.buyerPrefix || '',
      buyerPhone: this.buyerData?.buyerPhone || '',
      buyerEmail: usuario.email || '',
      buyerConfirmarEmail: usuario.email || ''
    };
  }
}




}