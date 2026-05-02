import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { Producto } from '../../core/models';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CurrencyPipe, FormsModule],
  templateUrl: './catalogo.component.html'
})
export class CatalogoComponent implements OnInit {
  protected supabase = inject(SupabaseService);

  mostrarFormulario = signal(false);
  productoEditando = signal<Producto | null>(null);
  nombreForm = '';
  precioForm: number = 0;

  productosInactivos() {
    return this.supabase.productos().filter(p => !p.activo);
  }

  async ngOnInit() {
    await this.supabase.cargarProductos();
  }

  abrirFormulario() {
    this.productoEditando.set(null);
    this.nombreForm = '';
    this.precioForm = 0;
    this.supabase.limpiarError();
    this.mostrarFormulario.set(true);
  }

  editarProducto(producto: Producto) {
    this.productoEditando.set(producto);
    this.nombreForm = producto.nombre;
    this.precioForm = producto.precio_base;
    this.supabase.limpiarError();
    this.mostrarFormulario.set(true);
  }

  productoAEliminar = signal<Producto | null>(null);

confirmarEliminar(producto: Producto) {
  this.productoAEliminar.set(producto);
}

async eliminarProducto() {
  const producto = this.productoAEliminar();
  if (!producto) return;
  await this.supabase.eliminarProducto(producto.id);
  this.productoAEliminar.set(null);
}

  cerrarFormulario() {
    this.mostrarFormulario.set(false);
    this.productoEditando.set(null);
  }

  async guardarProducto() {
    const editando = this.productoEditando();
    if (editando) {
      await this.supabase.actualizarProducto(editando.id, {
        nombre: this.nombreForm,
        precio_base: this.precioForm
      });
    } else {
      await this.supabase.crearProducto(this.nombreForm, this.precioForm);
    }
    if (!this.supabase.error()) this.cerrarFormulario();
  }

  // async toggleActivo(producto: Producto) {
  //   await this.supabase.toggleProducto(producto.id, !producto.activo);
  // }
}
