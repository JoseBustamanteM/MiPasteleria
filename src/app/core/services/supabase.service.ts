import { Injectable, inject, signal, computed } from '@angular/core';
import { createClient, SupabaseClient, AuthSession } from '@supabase/supabase-js';
import { environment } from '../../../enviroments/enviroment';
import { Producto, Venta, VentaFormData, DiaConVentas } from '../models';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  // ── Estado reactivo ──────────────────────────────────────
  readonly session = signal<AuthSession | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Productos
  readonly productos = signal<Producto[]>([]);
  readonly productosActivos = computed(() =>
    this.productos().filter(p => p.activo)
  );

  // Ventas
  readonly ventas = signal<Venta[]>([]);
  readonly diasConVentas = signal<DiaConVentas[]>([]);

  // Computed - Totales en tiempo real
  readonly totalDiario = computed(() =>
    this.ventas().reduce((sum, v) => sum + v.valor_total, 0)
  );

  readonly totalRecaudado = computed(() =>
    this.ventas().reduce((sum, v) => {
      if (v.estado_pago === 'completo') return sum + v.valor_total;
      if (v.estado_pago === 'parcial') return sum + (v.monto_recibido ?? 0);
      return sum;
    }, 0)
  );

  readonly saldoPendiente = computed(() =>
    this.totalDiario() - this.totalRecaudado()
  );

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );

    // Restaurar sesión
    this.supabase.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
    });

    // Escuchar cambios de auth
    this.supabase.auth.onAuthStateChange((_, session) => {
      this.session.set(session);
    });
  }

  // ── AUTH ─────────────────────────────────────────────────

  async signIn(email: string, password: string) {
    this.loading.set(true);
    this.error.set(null);
    try {
      const { error } = await this.supabase.auth.signInWithPassword({ email, password });
      if (error) this.error.set(error.message);
    } finally {
      this.loading.set(false);
    }
  }

  async signOut() {
    await this.supabase.auth.signOut();
    this.session.set(null);
  }

  // ── PRODUCTOS ─────────────────────────────────────────────

  async cargarProductos() {
    this.loading.set(true);
    const { data, error } = await this.supabase
      .from('productos')
      .select('*')
      .order('nombre');

    if (error) { this.error.set(error.message); }
    else { this.productos.set(data ?? []); }
    this.loading.set(false);
  }

  async crearProducto(nombre: string, precio_base: number): Promise<Producto | null> {
    const { data, error } = await this.supabase
      .from('productos')
      .insert({ nombre, precio_base, activo: true })
      .select()
      .single();

    if (error) { this.error.set(error.message); return null; }
    this.productos.update(prev => [...prev, data]);
    return data;
  }

  async actualizarProducto(id: string, updates: Partial<Producto>): Promise<boolean> {
    const { error } = await this.supabase
      .from('productos')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) { this.error.set(error.message); return false; }
    this.productos.update(prev =>
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );
    return true;
  }

  async eliminarProducto(id: string): Promise<boolean> {
  const { error } = await this.supabase
    .from('productos')
    .delete()
    .eq('id', id);

  if (error) { this.error.set(error.message); return false; }
  this.productos.update(prev => prev.filter(p => p.id !== id));
  return true;
}

  async toggleProducto(id: string, activo: boolean): Promise<boolean> {
    return this.actualizarProducto(id, { activo });
  }

  // ── VENTAS ────────────────────────────────────────────────

  async cargarVentasPorFecha(fecha: string) {
    this.loading.set(true);
    const { data, error } = await this.supabase
      .from('ventas')
      .select('*, producto:productos(*)')
      .eq('fecha', fecha)
      .order('created_at', { ascending: false });

    if (error) { this.error.set(error.message); }
    else {
      const ventasConSaldo = (data ?? []).map(v => ({
        ...v,
        saldo_pendiente: this.calcularSaldo(v)
      }));
      this.ventas.set(ventasConSaldo);
    }
    this.loading.set(false);
  }

  async cargarVentasPorFechaYProducto(fecha: string, productoId: string) {
    this.loading.set(true);
    const { data, error } = await this.supabase
      .from('ventas')
      .select('*, producto:productos(*)')
      .eq('fecha', fecha)
      .eq('producto_id', productoId)
      .order('created_at', { ascending: false });

    if (error) { this.error.set(error.message); }
    else {
      const ventasConSaldo = (data ?? []).map(v => ({
        ...v,
        saldo_pendiente: this.calcularSaldo(v)
      }));
      this.ventas.set(ventasConSaldo);
    }
    this.loading.set(false);
  }

  async cargarDiasConVentas() {
    this.loading.set(true);
    const { data, error } = await this.supabase
      .from('ventas')
      .select('fecha, valor_total, estado_pago, monto_recibido')
      .order('fecha', { ascending: false });

    if (error) { this.error.set(error.message); this.loading.set(false); return; }

    // Agrupar por fecha
    const map = new Map<string, DiaConVentas>();
    (data ?? []).forEach(v => {
      const existing = map.get(v.fecha) ?? {
        fecha: v.fecha,
        total_ventas: 0,
        total_recaudado: 0,
        saldo_pendiente: 0,
        cantidad_ventas: 0
      };
      const recaudado = v.estado_pago === 'completo'
        ? v.valor_total
        : (v.estado_pago === 'parcial' ? (v.monto_recibido ?? 0) : 0);

      map.set(v.fecha, {
        ...existing,
        total_ventas: existing.total_ventas + v.valor_total,
        total_recaudado: existing.total_recaudado + recaudado,
        saldo_pendiente: existing.saldo_pendiente + (v.valor_total - recaudado),
        cantidad_ventas: existing.cantidad_ventas + 1
      });
    });

    this.diasConVentas.set(Array.from(map.values()));
    this.loading.set(false);
  }

  async crearVenta(fecha: string, productoId: string, form: VentaFormData): Promise<Venta | null> {
    const payload = {
      fecha,
      producto_id: productoId,
      cliente: form.cliente,
      cantidad: form.cantidad,
      valor_total: form.valor_total,
      estado_pago: form.estado_pago,
      monto_recibido: form.estado_pago === 'parcial' ? form.monto_recibido : null
    };

    const { data, error } = await this.supabase
      .from('ventas')
      .insert(payload)
      .select('*, producto:productos(*)')
      .single();

    if (error) { this.error.set(error.message); return null; }

    const nuevaVenta = { ...data, saldo_pendiente: this.calcularSaldo(data) };
    this.ventas.update(prev => [nuevaVenta, ...prev]);
    return nuevaVenta;
  }

  async actualizarVenta(id: string, form: VentaFormData): Promise<boolean> {
    const payload = {
      cliente: form.cliente,
      cantidad: form.cantidad,
      valor_total: form.valor_total,
      estado_pago: form.estado_pago,
      monto_recibido: form.estado_pago === 'parcial' ? form.monto_recibido : null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('ventas')
      .update(payload)
      .eq('id', id)
      .select('*, producto:productos(*)')
      .single();

    if (error) { this.error.set(error.message); return false; }

    const actualizada = { ...data, saldo_pendiente: this.calcularSaldo(data) };
    this.ventas.update(prev => prev.map(v => v.id === id ? actualizada : v));
    return true;
  }

  async eliminarVenta(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('ventas')
      .delete()
      .eq('id', id);

    if (error) { this.error.set(error.message); return false; }
    this.ventas.update(prev => prev.filter(v => v.id !== id));
    return true;
  }

  // ── HELPERS ───────────────────────────────────────────────

  private calcularSaldo(v: { valor_total: number; estado_pago: string; monto_recibido: number | null }): number {
    if (v.estado_pago === 'completo') return 0;
    if (v.estado_pago === 'parcial') return v.valor_total - (v.monto_recibido ?? 0);
    return v.valor_total;
  }

  limpiarError() {
    this.error.set(null);
  }
}
