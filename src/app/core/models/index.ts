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
}

export type EstadoPago = 'pendiente' | 'parcial' | 'completo';

export interface VentaFormData {
  cliente: string;
  cantidad: number;
  valor_total: number;
  estado_pago: EstadoPago;
  monto_recibido: number | null;
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
