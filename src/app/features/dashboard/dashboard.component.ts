import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, TitleCasePipe],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  protected supabase = inject(SupabaseService);
  private router = inject(Router);

  mostrarCalendario = signal(false);
  fechaSeleccionada = signal(new Date().toISOString().split('T')[0]);

  totalPendienteGlobal = computed(() =>
    this.supabase.diasConVentas().reduce((sum, d) => sum + d.saldo_pendiente, 0)
  );

  ngOnInit() {
    this.supabase.cargarDiasConVentas();
  }

  onFechaChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.fechaSeleccionada.set(value);
  }

  irAFecha() {
    this.mostrarCalendario.set(false);
    this.router.navigate(['/ventas', this.fechaSeleccionada()]);
  }

  irADia(fecha: string) {
    this.router.navigate(['/ventas', fecha]);
  }
}
