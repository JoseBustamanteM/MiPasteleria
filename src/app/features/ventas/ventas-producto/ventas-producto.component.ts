import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Venta, VentaFormData, EstadoPago } from '../../../core/models';

@Component({
  selector: 'app-ventas-producto',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './ventas-producto.component.html',
})
export class VentasProductoComponent implements OnInit {
  protected supabase = inject(SupabaseService);
  protected router = inject(Router);
  private route = inject(ActivatedRoute);

  fecha = '';
  productoId = '';

  mostrarFormulario = signal(false);
  ventaEditando = signal<Venta | null>(null);
  ventaAEliminar = signal<Venta | null>(null);

  form: VentaFormData = {
    cliente: '',
    cantidad: 1,
    valor_total: 0,
    estado_pago: 'completo',
    monto_recibido: null
  };

  nombreProducto = computed(() => {
    const producto = this.supabase.productos().find(p => p.id === this.productoId);
    return producto?.nombre ?? 'Producto';
  });

  formValido(): boolean {
  const f = this.form;
  if (!f.cliente.trim() || !f.cantidad || !f.valor_total) return false;
  if (f.estado_pago === 'parcial' && (!f.monto_recibido || f.monto_recibido <= 0)) return false;
  return true;
}

  async ngOnInit() {
    this.fecha = this.route.snapshot.paramMap.get('fecha') ?? '';
    this.productoId = this.route.snapshot.paramMap.get('productoId') ?? '';
    await Promise.all([
      this.supabase.cargarProductos(),
      this.supabase.cargarVentasPorFechaYProducto(this.fecha, this.productoId)
    ]);
  }

  abrirFormulario() {
    this.ventaEditando.set(null);
    this.resetForm();
    this.supabase.limpiarError();
    this.mostrarFormulario.set(true);
  }

  editarVenta(venta: Venta) {
    this.ventaEditando.set(venta);
    this.form = {
      cliente: venta.cliente,
      cantidad: venta.cantidad,
      valor_total: venta.valor_total,
      estado_pago: venta.estado_pago,
      monto_recibido: venta.monto_recibido
    };
    this.supabase.limpiarError();
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario() {
    this.mostrarFormulario.set(false);
    this.ventaEditando.set(null);
    this.resetForm();
  }

  async guardarVenta() {
    const editando = this.ventaEditando();
    if (editando) {
      const ok = await this.supabase.actualizarVenta(editando.id, this.form);
      if (ok) this.cerrarFormulario();
    } else {
      const nueva = await this.supabase.crearVenta(this.fecha, this.productoId, this.form);
      if (nueva) this.cerrarFormulario();
    }
  }

  confirmarEliminar(venta: Venta) {
    this.ventaAEliminar.set(venta);
  }

  async eliminarVenta() {
    const venta = this.ventaAEliminar();
    if (!venta) return;
    await this.supabase.eliminarVenta(venta.id);
    this.ventaAEliminar.set(null);
  }

  private resetForm() {
    this.form = {
      cliente: '',
      cantidad: 1,
      valor_total: 0,
      estado_pago: 'completo',
      monto_recibido: null
    };
  }

  getBadgeClass(estado: EstadoPago): string {
    const base = 'text-xs font-semibold px-2 py-0.5 rounded-full';
    if (estado === 'completo') return `${base} bg-green-100 text-green-700`;
    if (estado === 'parcial') return `${base} bg-amber-100 text-amber-700`;
    return `${base} bg-red-100 text-red-600`;
  }

  getLabelEstado(estado: EstadoPago): string {
    if (estado === 'completo') return '✓ Pagado';
    if (estado === 'parcial') return '⚡ Parcial';
    return '⏳ Pendiente';
  }
}
