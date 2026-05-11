import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../core/services/supabase.service';
import { Cliente, ClienteResumen, Venta } from '../../core/models';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, FormsModule],
  templateUrl: './clientes.component.html'
})
export class ClientesComponent implements OnInit {
  protected supabase = inject(SupabaseService);
  private router = inject(Router);

  busqueda = signal('');
  ordenar = signal<string>('nombre');
  mostrarFormulario = signal(false);
  editando = signal<Cliente | null>(null);
  clienteSeleccionado = signal<ClienteResumen | null>(null);
  resumen = signal<ClienteResumen[]>([]);
  clienteDetalle = signal<ClienteResumen | null>(null);
  ventasCliente = signal<Venta[]>([]);
  cargandoDetalle = signal(false);

  form: Partial<Cliente> = { nombre: '', telefono: '', email: '', notas: '' };

  opciones = [
    { label: 'Nombre', value: 'nombre' },
    { label: 'Mayor deuda', value: 'deuda' },
    { label: 'Más compras', value: 'compras' },
    { label: 'Más gastado', value: 'total' },
  ];

  clientesFiltrados = computed(() => {
    let lista = this.resumen().filter(c =>
      c.nombre.toLowerCase().includes(this.busqueda().toLowerCase()) ||
      c.telefono?.includes(this.busqueda())
    );
    if (this.ordenar() === 'deuda') lista = [...lista].sort((a, b) => b.total_pendiente - a.total_pendiente);
    if (this.ordenar() === 'compras') lista = [...lista].sort((a, b) => b.cantidad_compras - a.cantidad_compras);
    if (this.ordenar() === 'total') lista = [...lista].sort((a, b) => b.total_comprado - a.total_comprado);
    return lista;
  });

  async ngOnInit() {
    await this.supabase.cargarClientes();
    this.resumen.set(await this.supabase.cargarResumenClientes());
  }

  abrirFormulario() {
    this.editando.set(null);
    this.form = { nombre: '', telefono: '', email: '', notas: '' };
    this.mostrarFormulario.set(true);
  }

  editarCliente(cliente: Cliente) {
    this.editando.set(cliente);
    this.form = { nombre: cliente.nombre, telefono: cliente.telefono ?? '', email: cliente.email ?? '', notas: cliente.notas ?? '' };
    this.clienteSeleccionado.set(null);
    this.mostrarFormulario.set(true);
  }

  cerrarFormulario() { this.mostrarFormulario.set(false); }

  async guardar() {
    const e = this.editando();
    if (e) {
      await this.supabase.actualizarCliente(e.id, this.form);
    } else {
      await this.supabase.crearCliente(this.form);
    }
    this.resumen.set(await this.supabase.cargarResumenClientes());
    this.cerrarFormulario();
  }

  verCliente(c: ClienteResumen) { this.clienteSeleccionado.set(c); }

  async toggleActivo(c: Cliente) {
    await this.supabase.actualizarCliente(c.id, { activo: !c.activo });
    this.resumen.set(await this.supabase.cargarResumenClientes());
    this.clienteSeleccionado.set(null);
  }


  async verDetalle(c: ClienteResumen) {
  this.clienteDetalle.set(c);
  this.cargandoDetalle.set(true);
  const { data, error } = await (this.supabase as any).supabase
    .from('ventas')
    .select('*, producto:productos(*)')
    .eq('cliente_id', c.id)
    .order('fecha', { ascending: false });
  this.ventasCliente.set(data ?? []);
  this.cargandoDetalle.set(false);
}
}
