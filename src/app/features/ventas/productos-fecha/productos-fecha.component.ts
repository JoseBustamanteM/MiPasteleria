import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Producto } from '../../../core/models';

@Component({
  selector: 'app-productos-fecha',
  standalone: true,
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './productos-fecha.component.html',
})
export class ProductosFechaComponent implements OnInit {
  protected supabase = inject(SupabaseService);
  protected router = inject(Router);
  private route = inject(ActivatedRoute);

  fecha = '';
  private ventasPorProducto = new Map<string, number>();

  resumenDia = computed(() => {
    const ventas = this.supabase.ventas();
    if (!ventas.length) return null;
    const total = ventas.reduce((s, v) => s + v.valor_total, 0);
    const cobrado = ventas.reduce((s, v) => {
      if (v.estado_pago === 'completo') return s + v.valor_total;
      if (v.estado_pago === 'parcial') return s + (v.monto_recibido ?? 0);
      return s;
    }, 0);
    return { total, cobrado, pendiente: total - cobrado };
  });

  async ngOnInit() {
    this.fecha = this.route.snapshot.paramMap.get('fecha') ?? '';
    await Promise.all([
      this.supabase.cargarProductos(),
      this.supabase.cargarVentasPorFecha(this.fecha)
    ]);

    // Construir mapa de ventas por producto
    this.supabase.ventas().forEach(v => {
      const count = this.ventasPorProducto.get(v.producto_id) ?? 0;
      this.ventasPorProducto.set(v.producto_id, count + 1);
    });
  }

  getVentasProducto(productoId: string): number {
    return this.ventasPorProducto.get(productoId) ?? 0;
  }

  getUnidadesProducto(productoId: string): number {
  return this.supabase.ventas()
    .filter(v => v.producto_id === productoId)
    .reduce((sum, v) => sum + v.cantidad, 0);
}

  getEmoji(nombre: string): string {
    const n = nombre.toLowerCase();
    if (n.includes('limón') || n.includes('limon')) return '🍋';
    if (n.includes('alfajor')) return '🍪';
    if (n.includes('torta') || n.includes('cake')) return '🎂';
    if (n.includes('muffin') || n.includes('queque')) return '🧁';
    if (n.includes('chocolate')) return '🍫';
    if (n.includes('frutilla') || n.includes('fresa')) return '🍓';
    if (n.includes('pan') || n.includes('barra')) return '🥐';
    return '🍰';
  }

  irAProducto(producto: Producto) {
    this.router.navigate(['/ventas', this.fecha, producto.id]);
  }
}
