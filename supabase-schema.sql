-- ============================================================
-- SCHEMA SUPABASE - Pastelería App
-- Ejecuta este SQL en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";

-- ─── TABLA: productos ────────────────────────────────────────
create table public.productos (
  id          uuid primary key default uuid_generate_v4(),
  nombre      text not null,
  precio_base integer not null default 0,  -- en pesos CLP (sin decimales)
  activo      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── TABLA: ventas ───────────────────────────────────────────
create table public.ventas (
  id              uuid primary key default uuid_generate_v4(),
  fecha           date not null,
  producto_id     uuid not null references public.productos(id) on delete restrict,
  cliente         text not null,
  cantidad        integer not null default 1 check (cantidad > 0),
  valor_total     integer not null check (valor_total >= 0),  -- CLP
  estado_pago     text not null default 'pendiente'
                    check (estado_pago in ('pendiente', 'parcial', 'completo')),
  monto_recibido  integer check (monto_recibido >= 0),        -- solo si parcial
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── ÍNDICES ─────────────────────────────────────────────────
create index idx_ventas_fecha on public.ventas(fecha desc);
create index idx_ventas_producto on public.ventas(producto_id);
create index idx_ventas_fecha_producto on public.ventas(fecha, producto_id);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────
alter table public.productos enable row level security;
alter table public.ventas enable row level security;

-- Políticas: solo usuarios autenticados pueden operar
create policy "auth_all_productos" on public.productos
  for all using (auth.role() = 'authenticated');

create policy "auth_all_ventas" on public.ventas
  for all using (auth.role() = 'authenticated');

-- ─── TRIGGER: updated_at automático ──────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_productos_updated_at
  before update on public.productos
  for each row execute function public.set_updated_at();

create trigger trg_ventas_updated_at
  before update on public.ventas
  for each row execute function public.set_updated_at();

-- ─── DATOS DE EJEMPLO ─────────────────────────────────────────
insert into public.productos (nombre, precio_base) values
  ('Pie de Limón',        8500),
  ('Alfajores (caja x6)', 6000),
  ('Torta de Chocolate',  22000),
  ('Muffins (unidad)',     1800),
  ('Queque de Vainilla',  12000);
