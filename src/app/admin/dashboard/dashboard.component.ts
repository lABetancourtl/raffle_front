import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [
    RouterModule, 
    CommonModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  menuAbierto = false;
  weatherData: any = null;
  loadingWeather = true;
  errorWeather: string | null = null;

  constructor(private router: Router) {}


  toggleMenu() {
    this.menuAbierto = !this.menuAbierto;
  }

  navegar(ruta: string): void {
    this.router.navigate([ruta]);
  }


  cerrarSesion() {
    localStorage.clear();
    window.location.href = '/login';
  }

  

  menuItems = [
    { iconClass: 'bi bi-file-earmark-plus', nombre: 'Nuevo evento', ruta: '/dashboard/newraffle' },
    { iconClass: 'bi bi-star', nombre: 'Eventos', ruta: '/dashboard/raffles' }
  ];


}

