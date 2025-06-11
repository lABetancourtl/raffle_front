import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { RaffleService } from '../../services/raffle.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { enviroments } from '../../../enviroments/enviroments';
import { countries, ICountry } from 'countries-list';

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
  selectedCurrency: string = 'COP'; // Valor por defecto


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

  constructor(private raffleService: RaffleService) {
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
        this.userNumbers = data.map((num: string) => num.padStart(4, '0'));
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

  validarYRealizarPago() {
  if (!this.selectedPackage || !this.buyerData.buyerName || !this.buyerData.buyerApellido ||
      !this.buyerData.buyerPais || !this.buyerData.buyerPrefix || !this.buyerData.buyerPhone ||
      !this.buyerData.buyerEmail || !this.buyerData.buyerConfirmarEmail) {
    alert('Por favor completa todos los campos requeridos antes de pagar.');
    return;
  }

   // Aquí iría tu lógica de pago
}



}