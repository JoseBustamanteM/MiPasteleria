// ============================================================
// INTERFACES PRINCIPALES - Pastelería App
// ============================================================

export interface Producto {
  id: string;
  nombre: string;
  precio_base: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Venta {
  id: string;
  fecha: string; // ISO date string 'YYYY-MM-DD'
  producto_id: string;
  producto?: Producto;
  cliente: string;
  cantidad: number;
  valor_total: number;
  estado_pago: EstadoPago;
  monto_recibido: number | null;
  saldo_pendiente: number; // computed
  created_at: string;
  updated_at: string;
  metodo_pago: MetodoPago;
  entregado: boolean;
  cliente_id: string | null;
  cliente_obj?: Cliente; // para el join
  metodo_pago_id: string | null;
  metodo_pago_obj?: MetodoPago;
}

export interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Computed en frontend
  total_comprado?: number;
  total_pendiente?: number;
  cantidad_compras?: number;
  ultima_compra?: string | null | undefined;
}

export interface MetodoPago {
  id: string;
  nombre: string;
  icono: string;
  activo: boolean;
  created_at: string;
}

export type EstadoPago = 'pendiente' | 'parcial' | 'completo';

export interface VentaFormData {
  cliente: string;
  cantidad: number;
  valor_total: number;
  estado_pago: EstadoPago;
  monto_recibido: number | null;
  metodo_pago_id: string | null;
  entregado: boolean;
  cliente_id: string | null;
  
}

export interface DiaConVentas {
  fecha: string; // 'YYYY-MM-DD'
  total_ventas: number;
  total_recaudado: number;
  saldo_pendiente: number;
  cantidad_ventas: number;
}

export interface ResumenDiario {
  fecha: string;
  ventas: Venta[];
  total_ventas: number;
  total_recaudado: number;
  saldo_pendiente: number;
}

export interface ProductoVentasResumen {
  producto: Producto;
  ventas: Venta[];
  total_dia: number;
  recaudado_dia: number;
  pendiente_dia: number;
}

export interface SupabaseError {
  message: string;
  code?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: SupabaseError | null;
}

export interface ClienteResumen extends Cliente {
  total_comprado: number;
  total_pendiente: number;
  cantidad_compras: number;
  ultima_compra: string | null | undefined; // ← cambiar
  es_frecuente: boolean;
}

