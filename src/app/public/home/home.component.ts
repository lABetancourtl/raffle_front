import { Component, OnInit } from '@angular/core';
import { RaffleService } from '../../services/raffle.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  raffle: any = null;
  selectedPackage: number | null = null;

  constructor(private raffleService: RaffleService) {}

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
}