import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { SupabaseService } from '../../core/services/supabase.service';
import { FormsModule } from '@angular/forms';

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
  mostrarExportar = signal(false);
  fechaDesde = signal(new Date().toISOString().split('T')[0]);
  fechaHasta = signal(new Date().toISOString().split('T')[0]);


  totalPendienteGlobal = computed(() =>
    this.supabase.diasConVentas().reduce((sum, d) => sum + d.saldo_pendiente, 0)
  );

  ventasFiltradas = computed(() =>
  this.supabase.diasConVentas().filter(d =>
    d.fecha >= this.fechaDesde() && d.fecha <= this.fechaHasta()
  )
);

totalFiltrado = computed(() =>
  this.ventasFiltradas().reduce((sum, d) => sum + d.total_ventas, 0)
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

  exportarCSV() {
  const datos = this.ventasFiltradas();
  if (!datos.length) return;

  const headers = 'Fecha,Total Ventas,Total Cobrado,Saldo Pendiente,Cantidad Ventas';
  const filas = datos.map(d =>
    `${d.fecha},${d.total_ventas},${d.total_recaudado},${d.saldo_pendiente},${d.cantidad_ventas}`
  );
  const csv = [headers, ...filas].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ventas_${this.fechaDesde()}_al_${this.fechaHasta()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  this.mostrarExportar.set(false);
}
}
