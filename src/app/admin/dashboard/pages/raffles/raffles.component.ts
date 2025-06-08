import { Component } from '@angular/core';
import { RaffleService } from '../../../../services/raffle.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-raffles',
  imports: [
    CommonModule,
  ],
  templateUrl: './raffles.component.html',
  styleUrl: './raffles.component.css'
})
export class RafflesComponent {
  raffles: any[] = [];

  constructor(private raffleService: RaffleService) {}

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
}