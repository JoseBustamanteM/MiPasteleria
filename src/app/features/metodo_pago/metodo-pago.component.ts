import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { MetodoPago } from '../../core/models';

@Component({
  selector: 'app-metodos-pago',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './metodo-pago.component.html'
})
export class MetodosPagoComponent implements OnInit {
  protected supabase = inject(SupabaseService);

  mostrarFormulario = signal(false);
  editando = signal<MetodoPago | null>(null);
  metodoAEliminar = signal<MetodoPago | null>(null);
  nombreForm = '';
  iconoForm = '💳';

 inactivos = computed(() => this.supabase.metodosPago().filter(m => !m.activo));
 metodosPagoActivos = computed(() => this.supabase.metodosPagoActivos());

  async ngOnInit() {
    await this.supabase.cargarMetodosPago();
  }

  async toggleMetodo(id: string, activo: boolean) {
  await this.supabase.toggleMetodoPago(id, activo);
}

  abrirFormulario() {
    this.editando.set(null);
    this.nombreForm = '';
    this.iconoForm = '💳';
    this.mostrarFormulario.set(true);
  }

  editarMetodo(metodo: MetodoPago) {
    this.editando.set(metodo);
    this.nombreForm = metodo.nombre;
    this.iconoForm = metodo.icono;
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario() {
    this.mostrarFormulario.set(false);
    this.editando.set(null);
  }

  async guardar() {
    const e = this.editando();
    if (e) {
      await this.supabase.actualizarMetodoPago(e.id, this.nombreForm, this.iconoForm);
    } else {
      await this.supabase.crearMetodoPago(this.nombreForm, this.iconoForm);
    }
    this.cerrarFormulario();
  }

  confirmarEliminar(metodo: MetodoPago) {
    this.metodoAEliminar.set(metodo);
  }

  async eliminar() {
    const m = this.metodoAEliminar();
    if (!m) return;
    await this.supabase.eliminarMetodoPago(m.id);
    this.metodoAEliminar.set(null);
  }
}