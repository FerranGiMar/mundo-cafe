require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const { Pool } = require('pg');

const { loadEnvFile } = require('./lib/env');
const { hashPassword, isHashedPassword, verifyPassword } = require('./lib/passwords');
const {
    normalizeEmail,
    parseOrderContext,
    parseProfilePayload,
    validateEmail,
    validatePasswordStrength,
    validarEstadoPedido
} = require('./lib/validators');

loadEnvFile(path.join(__dirname, '.env'));

const app = express();

const PORT = Number(process.env.PORT || 3000);
const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = NODE_ENV === 'production';
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-session-secret';
const CORS_ORIGIN = process.env.CORS_ORIGIN || `http://localhost:${PORT}`;

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        }
        : {
            user: process.env.DB_USER || 'postgres',
            host: process.env.DB_HOST || 'localhost',
            database: process.env.DB_NAME || 'mundo_cafe_db',
            password: process.env.DB_PASSWORD || 'postgres',
            port: Number(process.env.DB_PORT || 5432)
        }
);

function securityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(self), microphone=(), camera=()');
    next();
}

function createRateLimiter({ windowMs, maxRequests }) {
    const requests = new Map();

    return (req, res, next) => {
        const key = `${req.ip}:${req.path}`;
        const now = Date.now();
        const current = requests.get(key) || [];
        const recent = current.filter((timestamp) => now - timestamp < windowMs);

        recent.push(now);
        requests.set(key, recent);

        if (recent.length > maxRequests) {
            return res.status(429).json({
                error: 'Demasiadas solicitudes. Espera un momento e inténtalo de nuevo.'
            });
        }

        return next();
    };
}

const authLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 25
});

app.use(securityHeaders);
app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(session({
    name: 'mundo-cafe.sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: IS_PRODUCTION,
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));
app.use(express.static(path.join(__dirname, 'public')));

function requireLogin(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({ error: 'Debes iniciar sesión.' });
    }

    return next();
}

function requireAdmin(req, res, next) {
    if (!req.session.usuario) {
        return res.status(401).json({ error: 'Debes iniciar sesión.' });
    }

    if (req.session.usuario.rol !== 'admin') {
        return res.status(403).json({ error: 'No tienes permisos para esta acción.' });
    }

    return next();
}

function calcularPuntos(total) {
    return Math.floor(Number(total) * 10);
}

function mapUsuarioSesion(usuario) {
    return {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre_completo,
        email: usuario.email,
        puntos: Number(usuario.puntos_acumulados || 0),
        rol: usuario.rol,
        telefono: usuario.telefono || '',
        direccion_habitual: usuario.direccion_habitual || '',
        tienda_favorita: usuario.tienda_favorita || ''
    };
}

async function actualizarSesionUsuario(req, userId, client = pool) {
    const result = await client.query(
        `SELECT
            id_usuario,
            nombre_completo,
            email,
            puntos_acumulados,
            rol,
            telefono,
            direccion_habitual,
            tienda_favorita
         FROM usuarios
         WHERE id_usuario = $1`,
        [userId]
    );

    if (result.rows.length === 0) {
        req.session.usuario = null;
        return null;
    }

    const usuario = mapUsuarioSesion(result.rows[0]);
    req.session.usuario = usuario;
    return usuario;
}

async function sincronizarSecuencias(client = pool) {
    const secuencias = [
        ['categorias', 'id', 'categorias_id_seq'],
        ['productos', 'id_producto', 'productos_id_producto_seq'],
        ['menus', 'id_menu', 'menus_id_menu_seq'],
        ['usuarios', 'id_usuario', 'usuarios_id_usuario_seq'],
        ['pedidos', 'id_pedido', 'pedidos_id_pedido_seq'],
        ['lineas_pedido', 'id_linea', 'lineas_pedido_id_linea_seq'],
        ['recompensas', 'id_recompensa', 'recompensas_id_recompensa_seq'],
        ['historial_canjes', 'id_canje', 'historial_canjes_id_canje_seq']
    ];

    for (const [tabla, columna, secuencia] of secuencias) {
        await client.query(
            `SELECT setval(
                $1,
                COALESCE((SELECT MAX(${columna}) FROM ${tabla}), 0) + 1,
                false
            )`,
            [secuencia]
        );
    }
}

async function ensureDatabaseCompatibility() {
    await pool.query(`
        ALTER TABLE usuarios
        ADD COLUMN IF NOT EXISTS telefono VARCHAR(30),
        ADD COLUMN IF NOT EXISTS direccion_habitual VARCHAR(200),
        ADD COLUMN IF NOT EXISTS tienda_favorita VARCHAR(120)
    `);

    await pool.query(`
        ALTER TABLE pedidos
        ADD COLUMN IF NOT EXISTS tipo_entrega VARCHAR(30),
        ADD COLUMN IF NOT EXISTS destino_entrega VARCHAR(255),
        ADD COLUMN IF NOT EXISTS telefono_contacto VARCHAR(30),
        ADD COLUMN IF NOT EXISTS notas TEXT,
        ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(30),
        ADD COLUMN IF NOT EXISTS fecha_programada TIMESTAMP
    `);

    await pool.query(`
        CREATE INDEX IF NOT EXISTS idx_pedidos_usuario_fecha
        ON pedidos (id_usuario, fecha DESC)
    `);

    const legacyUsers = await pool.query(
        `SELECT id_usuario, password
         FROM usuarios`
    );

    for (const usuario of legacyUsers.rows) {
        if (!isHashedPassword(usuario.password)) {
            const hashedPassword = await hashPassword(usuario.password);
            await pool.query(
                `UPDATE usuarios
                 SET password = $1
                 WHERE id_usuario = $2`,
                [hashedPassword, usuario.id_usuario]
            );
        }
    }
}

app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        return res.json({
            ok: true,
            environment: NODE_ENV
        });
    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: 'La conexión con la base de datos no está disponible.'
        });
    }
});

app.post('/registro', authLimiter, async (req, res) => {
    const nombre = String(req.body?.nombre || '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!nombre || !email || !password) {
        return res.status(400).json({ error: 'Faltan campos obligatorios.' });
    }

    if (!validateEmail(email)) {
        return res.status(400).json({ error: 'Introduce un email válido.' });
    }

    if (!validatePasswordStrength(password)) {
        return res.status(400).json({
            error: 'La contraseña debe tener al menos 6 caracteres.'
        });
    }

    try {
        await sincronizarSecuencias();

        const existeUsuario = await pool.query(
            'SELECT id_usuario FROM usuarios WHERE email = $1',
            [email]
        );

        if (existeUsuario.rows.length > 0) {
            return res.status(409).json({ error: 'Este email ya está registrado.' });
        }

        const hashedPassword = await hashPassword(password);

        const result = await pool.query(
            `INSERT INTO usuarios (
                nombre_completo,
                email,
                password,
                puntos_acumulados,
                rol,
                fecha_registro,
                telefono,
                direccion_habitual,
                tienda_favorita
            )
            VALUES ($1, $2, $3, 0, 'cliente', NOW(), '', '', '')
            RETURNING id_usuario`,
            [nombre, email, hashedPassword]
        );

        const usuario = await actualizarSesionUsuario(req, result.rows[0].id_usuario);

        return res.status(201).json({
            mensaje: 'Usuario registrado con éxito.',
            usuario
        });
    } catch (error) {
        console.error('Error en /registro:', error);
        return res.status(500).json({ error: 'Error en el servidor.' });
    }
});

app.post('/login', authLimiter, async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    if (!email || !password) {
        return res.status(400).json({ error: 'Faltan email o contraseña.' });
    }

    try {
        const result = await pool.query(
            `SELECT
                id_usuario,
                nombre_completo,
                email,
                password,
                puntos_acumulados,
                rol,
                telefono,
                direccion_habitual,
                tienda_favorita
             FROM usuarios
             WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
        }

        const usuarioDb = result.rows[0];
        const passwordOk = await verifyPassword(password, usuarioDb.password);

        if (!passwordOk) {
            return res.status(401).json({ error: 'Email o contraseña incorrectos.' });
        }

        const usuario = mapUsuarioSesion(usuarioDb);
        req.session.usuario = usuario;

        return res.json({
            mensaje: 'Bienvenido.',
            usuario
        });
    } catch (error) {
        console.error('Error en /login:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

app.post('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            console.error('Error en /logout:', error);
            return res.status(500).json({ error: 'No se pudo cerrar sesión.' });
        }

        res.clearCookie('mundo-cafe.sid');
        return res.json({ mensaje: 'Sesión cerrada correctamente.' });
    });
});

app.get('/session', (req, res) => {
    if (!req.session.usuario) {
        return res.json({ logueado: false });
    }

    return res.json({
        logueado: true,
        usuario: req.session.usuario
    });
});

app.get('/api/profile', requireLogin, async (req, res) => {
    try {
        const usuario = await actualizarSesionUsuario(req, req.session.usuario.id_usuario);
        return res.json({ usuario });
    } catch (error) {
        console.error('Error en /api/profile:', error);
        return res.status(500).json({ error: 'No se pudo cargar el perfil.' });
    }
});

app.put('/api/profile', requireLogin, async (req, res) => {
    const parsed = parseProfilePayload(req.body);
    if (!parsed.ok) {
        return res.status(400).json({ error: parsed.error });
    }

    try {
        await pool.query(
            `UPDATE usuarios
             SET
                nombre_completo = $1,
                telefono = $2,
                direccion_habitual = $3,
                tienda_favorita = $4
             WHERE id_usuario = $5`,
            [
                parsed.data.nombre,
                parsed.data.telefono,
                parsed.data.direccion,
                parsed.data.tienda_favorita,
                req.session.usuario.id_usuario
            ]
        );

        const usuario = await actualizarSesionUsuario(req, req.session.usuario.id_usuario);

        return res.json({
            mensaje: 'Perfil actualizado correctamente.',
            usuario
        });
    } catch (error) {
        console.error('Error en /api/profile:', error);
        return res.status(500).json({ error: 'No se pudo actualizar el perfil.' });
    }
});

app.get('/api/productos', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                p.id_producto,
                p.nombre,
                p.descripcion,
                p.precio,
                p.id_categoria,
                p.stock_disponible,
                c.nombre AS categoria
             FROM productos p
             LEFT JOIN categorias c ON c.id = p.id_categoria
             ORDER BY p.id_producto`
        );

        return res.json(result.rows);
    } catch (error) {
        console.error('Error en /api/productos:', error);
        return res.status(500).json({ error: 'Error al obtener productos.' });
    }
});

app.get('/api/menus', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM menus
             ORDER BY id_menu`
        );

        return res.json(result.rows);
    } catch (error) {
        console.error('Error en /api/menus:', error);
        return res.status(500).json({ error: 'Error al obtener menús.' });
    }
});

app.get('/api/recompensas', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT *
             FROM recompensas
             ORDER BY puntos_requeridos`
        );

        return res.json(result.rows);
    } catch (error) {
        console.error('Error en /api/recompensas:', error);
        return res.status(500).json({ error: 'Error al obtener recompensas.' });
    }
});

app.get('/api/puntos', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT puntos_acumulados
             FROM usuarios
             WHERE id_usuario = $1`,
            [req.session.usuario.id_usuario]
        );

        const puntos = Number(result.rows[0]?.puntos_acumulados || 0);
        req.session.usuario.puntos = puntos;
        return res.json({ puntos });
    } catch (error) {
        console.error('Error en /api/puntos:', error);
        return res.status(500).json({ error: 'Error al obtener puntos.' });
    }
});

app.post('/pedido', requireLogin, async (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    const parsedOrderContext = parseOrderContext(req.body);

    if (!parsedOrderContext.ok) {
        return res.status(400).json({ error: parsedOrderContext.error });
    }

    if (items.length === 0) {
        return res.status(400).json({ error: 'El carrito está vacío.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        let total = 0;

        for (const item of items) {
            if (!item.tipo || !item.id || !item.cantidad) {
                throw new Error('Hay productos del carrito con datos incompletos.');
            }

            if (Number(item.cantidad) <= 0) {
                throw new Error('La cantidad debe ser mayor que 0.');
            }

            if (item.tipo === 'producto') {
                const productoRes = await client.query(
                    `SELECT id_producto, nombre, precio, stock_disponible
                     FROM productos
                     WHERE id_producto = $1`,
                    [item.id]
                );

                if (productoRes.rows.length === 0) {
                    throw new Error(`Producto no encontrado: ${item.id}`);
                }

                const producto = productoRes.rows[0];

                if (Number(producto.stock_disponible) < Number(item.cantidad)) {
                    throw new Error(`Stock insuficiente para ${producto.nombre}`);
                }

                total += Number(producto.precio) * Number(item.cantidad);
            } else if (item.tipo === 'menu') {
                const menuRes = await client.query(
                    `SELECT id_menu, nombre, precio_combo
                     FROM menus
                     WHERE id_menu = $1`,
                    [item.id]
                );

                if (menuRes.rows.length === 0) {
                    throw new Error(`Menú no encontrado: ${item.id}`);
                }

                total += Number(menuRes.rows[0].precio_combo) * Number(item.cantidad);
            } else {
                throw new Error('Tipo de item no válido.');
            }
        }

        const puntosGanados = calcularPuntos(total);

        const pedidoRes = await client.query(
            `INSERT INTO pedidos (
                id_usuario,
                fecha,
                total,
                puntos_ganados,
                estado,
                tipo_entrega,
                destino_entrega,
                telefono_contacto,
                notas,
                metodo_pago,
                fecha_programada
             )
             VALUES ($1, NOW(), $2, $3, 'Preparacion', $4, $5, $6, $7, $8, $9)
             RETURNING id_pedido, fecha, total, puntos_ganados, estado, tipo_entrega, destino_entrega, telefono_contacto, notas, metodo_pago, fecha_programada`,
            [
                req.session.usuario.id_usuario,
                total,
                puntosGanados,
                parsedOrderContext.data.deliveryType,
                parsedOrderContext.data.destination,
                parsedOrderContext.data.phone,
                parsedOrderContext.data.notes,
                parsedOrderContext.data.paymentMethod,
                parsedOrderContext.data.scheduledFor
            ]
        );

        const pedido = pedidoRes.rows[0];

        for (const item of items) {
            if (item.tipo === 'producto') {
                const productoRes = await client.query(
                    `SELECT id_producto, precio
                     FROM productos
                     WHERE id_producto = $1`,
                    [item.id]
                );

                const producto = productoRes.rows[0];

                await client.query(
                    `INSERT INTO lineas_pedido
                     (id_pedido, id_producto, id_menu, cantidad, precio_unitario, estado)
                     VALUES ($1, $2, NULL, $3, $4, 'Preparacion')`,
                    [pedido.id_pedido, item.id, item.cantidad, producto.precio]
                );

                await client.query(
                    `UPDATE productos
                     SET stock_disponible = stock_disponible - $1
                     WHERE id_producto = $2`,
                    [item.cantidad, item.id]
                );
            } else if (item.tipo === 'menu') {
                const menuRes = await client.query(
                    `SELECT id_menu, precio_combo
                     FROM menus
                     WHERE id_menu = $1`,
                    [item.id]
                );

                await client.query(
                    `INSERT INTO lineas_pedido
                     (id_pedido, id_producto, id_menu, cantidad, precio_unitario, estado)
                     VALUES ($1, NULL, $2, $3, $4, 'Preparacion')`,
                    [pedido.id_pedido, item.id, item.cantidad, menuRes.rows[0].precio_combo]
                );
            }
        }

        await client.query(
            `UPDATE usuarios
             SET puntos_acumulados = puntos_acumulados + $1
             WHERE id_usuario = $2`,
            [puntosGanados, req.session.usuario.id_usuario]
        );

        const usuarioActualizado = await actualizarSesionUsuario(req, req.session.usuario.id_usuario, client);

        await client.query('COMMIT');

        return res.json({
            mensaje: 'Pedido confirmado.',
            pedido,
            puntos_actuales: usuarioActualizado.puntos
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en /pedido:', error);
        return res.status(500).json({ error: error.message || 'Error al procesar el pedido.' });
    } finally {
        client.release();
    }
});

app.get('/api/mis-pedidos', requireLogin, async (req, res) => {
    try {
        const pedidosRes = await pool.query(
            `SELECT
                id_pedido,
                fecha,
                total,
                puntos_ganados,
                estado,
                tipo_entrega,
                destino_entrega,
                telefono_contacto,
                notas,
                metodo_pago,
                fecha_programada
             FROM pedidos
             WHERE id_usuario = $1
             ORDER BY fecha DESC`,
            [req.session.usuario.id_usuario]
        );

        return res.json(pedidosRes.rows);
    } catch (error) {
        console.error('Error en /api/mis-pedidos:', error);
        return res.status(500).json({ error: 'Error al obtener pedidos.' });
    }
});

app.get('/api/pedidos/:id', requireLogin, async (req, res) => {
    const { id } = req.params;

    try {
        const pedidoRes = await pool.query(
            `SELECT
                id_pedido,
                id_usuario,
                fecha,
                total,
                puntos_ganados,
                estado,
                tipo_entrega,
                destino_entrega,
                telefono_contacto,
                notas,
                metodo_pago,
                fecha_programada
             FROM pedidos
             WHERE id_pedido = $1`,
            [id]
        );

        if (pedidoRes.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        const pedido = pedidoRes.rows[0];

        if (
            pedido.id_usuario !== req.session.usuario.id_usuario &&
            req.session.usuario.rol !== 'admin'
        ) {
            return res.status(403).json({ error: 'No tienes permiso para ver este pedido.' });
        }

        const lineasRes = await pool.query(
            `SELECT
                lp.id_linea,
                lp.cantidad,
                lp.precio_unitario,
                lp.estado,
                p.nombre AS producto_nombre,
                m.nombre AS menu_nombre
             FROM lineas_pedido lp
             LEFT JOIN productos p ON p.id_producto = lp.id_producto
             LEFT JOIN menus m ON m.id_menu = lp.id_menu
             WHERE lp.id_pedido = $1
             ORDER BY lp.id_linea`,
            [id]
        );

        return res.json({
            pedido,
            lineas: lineasRes.rows
        });
    } catch (error) {
        console.error('Error en /api/pedidos/:id:', error);
        return res.status(500).json({ error: 'Error al obtener el pedido.' });
    }
});

app.put('/api/pedidos/:id/estado', requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { estado } = req.body;

    if (!validarEstadoPedido(estado)) {
        return res.status(400).json({ error: 'Estado no válido.' });
    }

    try {
        const pedidoRes = await pool.query(
            `UPDATE pedidos
             SET estado = $1
             WHERE id_pedido = $2
             RETURNING *`,
            [estado, id]
        );

        if (pedidoRes.rows.length === 0) {
            return res.status(404).json({ error: 'Pedido no encontrado.' });
        }

        await pool.query(
            `UPDATE lineas_pedido
             SET estado = $1
             WHERE id_pedido = $2`,
            [estado, id]
        );

        return res.json({
            mensaje: 'Estado actualizado correctamente.',
            pedido: pedidoRes.rows[0]
        });
    } catch (error) {
        console.error('Error en /api/pedidos/:id/estado:', error);
        return res.status(500).json({ error: 'Error al actualizar el estado.' });
    }
});

app.post('/api/canjear', requireLogin, async (req, res) => {
    const idRecompensa = Number(req.body?.id_recompensa || 0);

    if (!idRecompensa) {
        return res.status(400).json({ error: 'Falta la recompensa.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const usuarioRes = await client.query(
            `SELECT puntos_acumulados
             FROM usuarios
             WHERE id_usuario = $1`,
            [req.session.usuario.id_usuario]
        );

        const puntosAntes = Number(usuarioRes.rows[0].puntos_acumulados || 0);

        const recompensaRes = await client.query(
            `SELECT *
             FROM recompensas
             WHERE id_recompensa = $1`,
            [idRecompensa]
        );

        if (recompensaRes.rows.length === 0) {
            throw new Error('La recompensa no existe.');
        }

        const recompensa = recompensaRes.rows[0];

        if (puntosAntes < recompensa.puntos_requeridos) {
            throw new Error('No tienes puntos suficientes.');
        }

        const puntosDespues = puntosAntes - Number(recompensa.puntos_requeridos);

        await client.query(
            `UPDATE usuarios
             SET puntos_acumulados = $1
             WHERE id_usuario = $2`,
            [puntosDespues, req.session.usuario.id_usuario]
        );

        await client.query(
            `INSERT INTO historial_canjes
             (
                id_usuario,
                id_recompensa,
                fecha_canje,
                puntos_totales_antes,
                puntos_gastados,
                puntos_totales_despues
             )
             VALUES ($1, $2, NOW(), $3, $4, $5)`,
            [
                req.session.usuario.id_usuario,
                idRecompensa,
                puntosAntes,
                recompensa.puntos_requeridos,
                puntosDespues
            ]
        );

        await actualizarSesionUsuario(req, req.session.usuario.id_usuario, client);
        await client.query('COMMIT');

        return res.json({
            mensaje: 'Canje realizado correctamente.',
            recompensa: recompensa.nombre,
            puntos_antes: puntosAntes,
            puntos_gastados: Number(recompensa.puntos_requeridos),
            puntos_actuales: puntosDespues
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en /api/canjear:', error);
        return res.status(500).json({ error: error.message || 'Error al canjear recompensa.' });
    } finally {
        client.release();
    }
});

app.get('/api/historial-canjes', requireLogin, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT
                hc.id_canje,
                hc.fecha_canje,
                hc.puntos_totales_antes,
                hc.puntos_gastados,
                hc.puntos_totales_despues,
                r.nombre AS recompensa_nombre
             FROM historial_canjes hc
             INNER JOIN recompensas r ON r.id_recompensa = hc.id_recompensa
             WHERE hc.id_usuario = $1
             ORDER BY hc.fecha_canje DESC`,
            [req.session.usuario.id_usuario]
        );

        return res.json(result.rows);
    } catch (error) {
        console.error('Error en /api/historial-canjes:', error);
        return res.status(500).json({ error: 'Error al obtener historial de canjes.' });
    }
});

app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
    try {
        await pool.query('SELECT 1');
        await ensureDatabaseCompatibility();
        await sincronizarSecuencias();

        app.listen(PORT, () => {
            console.log(`Servidor corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('No se pudo iniciar el servidor:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

module.exports = {
    app,
    pool,
    startServer
};
