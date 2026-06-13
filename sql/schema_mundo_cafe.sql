BEGIN;

DROP TABLE IF EXISTS historial_canjes CASCADE;
DROP TABLE IF EXISTS lineas_pedido CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS menu_productos CASCADE;
DROP TABLE IF EXISTS recompensas CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;

CREATE TABLE categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE productos (
    id_producto SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    precio NUMERIC(10, 2) NOT NULL CHECK (precio >= 0),
    id_categoria INTEGER NOT NULL REFERENCES categorias(id),
    stock_disponible INTEGER NOT NULL DEFAULT 99 CHECK (stock_disponible >= 0)
);

CREATE TABLE menus (
    id_menu SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    precio_combo NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (precio_combo >= 0),
    descripcion TEXT
);

CREATE TABLE menu_productos (
    id_menu INTEGER NOT NULL REFERENCES menus(id_menu) ON DELETE CASCADE,
    id_producto INTEGER NOT NULL REFERENCES productos(id_producto) ON DELETE CASCADE,
    PRIMARY KEY (id_menu, id_producto)
);

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    puntos_acumulados INTEGER NOT NULL DEFAULT 0 CHECK (puntos_acumulados >= 0),
    rol VARCHAR(50) NOT NULL DEFAULT 'cliente' CHECK (rol IN ('cliente', 'admin')),
    telefono VARCHAR(30) NOT NULL DEFAULT '',
    direccion_habitual VARCHAR(200) NOT NULL DEFAULT '',
    tienda_favorita VARCHAR(120) NOT NULL DEFAULT '',
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pedidos (
    id_pedido SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    puntos_ganados INTEGER NOT NULL DEFAULT 0 CHECK (puntos_ganados >= 0),
    estado VARCHAR(30) NOT NULL DEFAULT 'Preparacion' CHECK (estado IN ('Preparacion', 'Reparto', 'Entregado')),
    tipo_entrega VARCHAR(30) NOT NULL DEFAULT 'clickcollect' CHECK (tipo_entrega IN ('home', 'clickcollect', 'schedule')),
    destino_entrega VARCHAR(255) NOT NULL DEFAULT '',
    telefono_contacto VARCHAR(30) NOT NULL DEFAULT '',
    notas TEXT NOT NULL DEFAULT '',
    metodo_pago VARCHAR(30) NOT NULL DEFAULT 'card' CHECK (metodo_pago IN ('card', 'store')),
    fecha_programada TIMESTAMP NULL
);

CREATE TABLE lineas_pedido (
    id_linea SERIAL PRIMARY KEY,
    id_pedido INTEGER NOT NULL REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    id_producto INTEGER REFERENCES productos(id_producto),
    id_menu INTEGER REFERENCES menus(id_menu),
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),
    precio_unitario NUMERIC(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    estado VARCHAR(30) NOT NULL DEFAULT 'Preparacion' CHECK (estado IN ('Preparacion', 'Reparto', 'Entregado')),
    CONSTRAINT chk_linea_producto_o_menu
        CHECK (
            (id_producto IS NOT NULL AND id_menu IS NULL) OR
            (id_producto IS NULL AND id_menu IS NOT NULL)
        )
);

CREATE TABLE recompensas (
    id_recompensa SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    puntos_requeridos INTEGER NOT NULL CHECK (puntos_requeridos > 0),
    id_producto_vinculado INTEGER REFERENCES productos(id_producto),
    id_menu_vinculado INTEGER REFERENCES menus(id_menu),
    CONSTRAINT chk_recompensa_vinculada
        CHECK (
            (id_producto_vinculado IS NOT NULL AND id_menu_vinculado IS NULL) OR
            (id_producto_vinculado IS NULL AND id_menu_vinculado IS NOT NULL)
        )
);

CREATE TABLE historial_canjes (
    id_canje SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL REFERENCES usuarios(id_usuario) ON DELETE CASCADE,
    id_recompensa INTEGER NOT NULL REFERENCES recompensas(id_recompensa) ON DELETE CASCADE,
    fecha_canje TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    puntos_totales_antes INTEGER NOT NULL DEFAULT 0,
    puntos_gastados INTEGER NOT NULL DEFAULT 0,
    puntos_totales_despues INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_pedidos_usuario_fecha ON pedidos(id_usuario, fecha DESC);
CREATE INDEX idx_lineas_pedido_pedido ON lineas_pedido(id_pedido);
CREATE INDEX idx_historial_canjes_usuario_fecha ON historial_canjes(id_usuario, fecha_canje DESC);

COMMIT;
