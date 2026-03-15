import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-sorteo',
  imports: [CommonModule, FormsModule],
  templateUrl: './sorteo.component.html',
  styleUrl: './sorteo.component.css'
})
export class SorteoComponent {
  wheels = [0, 1, 2, 3, 4]; // 5 ruletas
  currentNumbers = [0, 0, 0, 0, 0]; // valor actual
  finalNumber: string = "";
  isSpinning = false;
  selectedDigits = 5; // cantidad de dígitos seleccionados
  
  async startSpin() {
    this.isSpinning = true;
    this.finalNumber = "";
    
    // Solo girar los dígitos seleccionados
    for (let i = 0; i < this.selectedDigits; i++) {
      await this.spinWheel(i);
    }

    // Generar número final solo con los dígitos seleccionados
    this.finalNumber = this.currentNumbers
      .slice(0, this.selectedDigits)
      .join("");
    this.isSpinning = false;
  }

  spinWheel(index: number): Promise<void> {
    return new Promise((resolve) => {
      // Generar el número final ANTES de girar (verdaderamente aleatorio)
      const finalNumber = Math.floor(Math.random() * 10);
      
      // Vueltas totales (más vueltas = más realista)
      const totalSpins = 40 + Math.floor(Math.random() * 40); // Entre 40 y 79 vueltas
      
      // Velocidad variable (empieza rápido, termina lento para efecto visual)
      let interval = 50; // velocidad inicial
      let count = 0;
      
      let spinInterval = setInterval(() => {
        // Incrementar número
        this.currentNumbers[index] = (this.currentNumbers[index] + 1) % 10;
        count++;
        
        // Aumentar el intervalo gradualmente (efecto de desaceleración)
        if (count > totalSpins * 0.7) {
          interval = 80;
        }
        if (count > totalSpins * 0.85) {
          interval = 150;
        }
        
        // Cuando lleguemos al final, asegurar que termine en el número aleatorio
        if (count >= totalSpins) {
          this.currentNumbers[index] = finalNumber;
          clearInterval(spinInterval);
          resolve();
        }
      }, interval);
    });
  }

  onDigitsChange(value: number) {
    this.selectedDigits = value;
    // Resetear los números no seleccionados
    for (let i = this.selectedDigits; i < this.wheels.length; i++) {
      this.currentNumbers[i] = 0;
    }
    this.finalNumber = "";
  }
}