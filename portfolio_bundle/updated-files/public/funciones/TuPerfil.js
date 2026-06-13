let usuarioActual = null;

document.addEventListener('DOMContentLoaded', async () => {
    actualizarContadorCarrito();
    marcarNavegacionActiva();

    const sesionOk = await cargarPerfil();

    if (!sesionOk) {
        renderPerfilInvitado();
        return;
    }

    await Promise.all([
        cargarPuntos(),
        cargarPedidos()
    ]);

    rellenarDatosUsuario();
    iniciarFormularioPerfil();
});

async function cargarPerfil() {
    try {
        const res = await fetch('/api/profile', {
            method: 'GET',
            credentials: 'include'
        });

        const result = typeof parseResponse === 'function'
            ? await parseResponse(res)
            : { ok: res.ok, data: await res.json() };

        if (!result.ok || !result.data?.usuario) {
            return false;
        }

        usuarioActual = result.data.usuario;
        localStorage.setItem('activeUser', JSON.stringify(usuarioActual));

        const nameDisplay = document.getElementById('user-display-name');
        if (nameDisplay) {
            nameDisplay.innerText = `Hola, ${usuarioActual.nombre || 'Usuario'}`;
        }

        return true;
    } catch (error) {
        console.error('Error cargando perfil:', error);
        return false;
    }
}

function renderPerfilInvitado() {
    const historyBody = document.getElementById('history-body');
    const pointsNumber = document.getElementById('points-number');
    const pointsNeededMsg = document.getElementById('points-needed-msg');
    const statusMsg = document.getElementById('status-msg');

    if (pointsNumber) pointsNumber.textContent = '0';
    if (pointsNeededMsg) pointsNeededMsg.textContent = 'Inicia sesión para ver tus puntos.';
    if (statusMsg) statusMsg.textContent = 'Inicia sesión para consultar tu progreso.';

    renderSellos(0);

    if (historyBody) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;opacity:0.7;padding:20px;">
                    Inicia sesión para ver tu historial de pedidos.
                </td>
            </tr>
        `;
    }

    const fullName = document.getElementById('full-name');
    const userEmail = document.getElementById('user-email');
    const userPhone = document.getElementById('user-phone');
    const userAddress = document.getElementById('user-address');
    const userStore = document.getElementById('user-store');

    if (fullName) fullName.value = '';
    if (userEmail) userEmail.value = '';
    if (userPhone) userPhone.value = '';
    if (userAddress) userAddress.value = '';
    if (userStore) userStore.value = 'Westfield Glories';
}

async function cargarPuntos() {
    try {
        const res = await fetch('/api/puntos', {
            method: 'GET',
            credentials: 'include'
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'No se pudieron cargar los puntos.');
        }

        const puntos = Number(data.puntos || 0);

        renderPuntos(puntos);
        renderizarClubFidelizacion(puntos);
    } catch (error) {
        console.error('Error cargando puntos:', error);
    }
}

function renderPuntos(puntos) {
    const pointsNumber = document.getElementById('points-number');
    const pointsNeededMsg = document.getElementById('points-needed-msg');

    const objetivo = 1200;
    const faltan = Math.max(objetivo - puntos, 0);

    if (pointsNumber) {
        pointsNumber.textContent = puntos;
    }

    if (pointsNeededMsg) {
        if (puntos >= objetivo) {
            pointsNeededMsg.textContent = 'Ya tienes una recompensa disponible.';
        } else {
            pointsNeededMsg.textContent = `Te faltan ${faltan} puntos para la siguiente recompensa.`;
        }
    }
}

function renderizarClubFidelizacion(puntos) {
    const cafesComprados = Math.floor(puntos / 10);
    const cafesEnCiclo = cafesComprados % 8;
    const statusMsg = document.getElementById('status-msg');

    renderSellos(cafesEnCiclo);

    if (statusMsg) {
        if (cafesEnCiclo === 7) {
            statusMsg.textContent = 'Te falta solo 1 café para completar el ciclo.';
        } else if (cafesEnCiclo === 0 && cafesComprados > 0) {
            statusMsg.textContent = 'Has completado un ciclo de fidelización.';
        } else {
            statusMsg.textContent = `Llevas ${cafesEnCiclo} de 8 cafés en tu ciclo actual.`;
        }
    }
}

function renderSellos(cafesComprados) {
    const grid = document.getElementById('stamps-grid');
    if (!grid) return;

    grid.innerHTML = '';

    for (let i = 1; i <= 8; i++) {
        const stamp = document.createElement('div');
        stamp.className = 'stamp';

        if (i === 8) {
            stamp.innerHTML = '<div class="free-badge">GRATIS</div>';
            stamp.classList.add('free-stamp');
        } else {
            stamp.innerHTML = '<img src="img/CafeFidel.png" alt="Café" class="stamp-icon">';
        }

        if (i <= cafesComprados) {
            stamp.classList.add('active');
        }

        grid.appendChild(stamp);
    }
}

async function cargarPedidos() {
    try {
        const res = await fetch('/api/mis-pedidos', {
            method: 'GET',
            credentials: 'include'
        });

        const pedidos = await res.json();

        if (!res.ok) {
            throw new Error(pedidos.error || 'No se pudieron cargar los pedidos.');
        }

        await pintarPedidos(pedidos);
    } catch (error) {
        console.error('Error cargando pedidos:', error);

        const historyBody = document.getElementById('history-body');
        if (historyBody) {
            historyBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align:center;color:#b00020;padding:20px;">
                        Error al cargar el historial de pedidos.
                    </td>
                </tr>
            `;
        }
    }
}

async function pintarPedidos(pedidos) {
    const historyBody = document.getElementById('history-body');
    if (!historyBody) return;

    if (!Array.isArray(pedidos) || pedidos.length === 0) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align:center;opacity:0.7;padding:20px;">
                    Aún no tienes pedidos registrados.
                </td>
            </tr>
        `;
        return;
    }

    const filas = await Promise.all(
        pedidos.map(async (pedido) => {
            const productosTexto = await obtenerResumenLineasPedido(pedido.id_pedido);
            const fechaFormateada = formatearFecha(pedido.fecha);
            const totalFormateado = `${Number(pedido.total).toFixed(2).replace('.', ',')}€`;
            const estadoBonito = traducirEstado(pedido.estado);
            const estadoClase = claseEstado(pedido.estado);

            return `
                <tr>
                    <td>${fechaFormateada}</td>
                    <td style="color:#666">${productosTexto}</td>
                    <td><strong>${totalFormateado}</strong></td>
                    <td><span class="status-dot ${estadoClase}"></span> ${estadoBonito}</td>
                </tr>
            `;
        })
    );

    historyBody.innerHTML = filas.join('');
}

async function obtenerResumenLineasPedido(idPedido) {
    try {
        const res = await fetch(`/api/pedidos/${idPedido}`, {
            method: 'GET',
            credentials: 'include'
        });

        const data = await res.json();

        if (!res.ok || !data.lineas) {
            return 'Detalle no disponible';
        }

        return data.lineas.map((linea) => {
            const nombre = linea.producto_nombre || linea.menu_nombre || 'Artículo';
            return `${linea.cantidad}x ${nombre}`;
        }).join(', ');
    } catch (error) {
        console.error(`Error cargando líneas del pedido ${idPedido}:`, error);
        return 'Detalle no disponible';
    }
}

function rellenarDatosUsuario() {
    if (!usuarioActual) return;

    const fullName = document.getElementById('full-name');
    const userEmail = document.getElementById('user-email');
    const userPhone = document.getElementById('user-phone');
    const userAddress = document.getElementById('user-address');
    const userStore = document.getElementById('user-store');

    if (fullName) fullName.value = usuarioActual.nombre || '';
    if (userEmail) userEmail.value = usuarioActual.email || '';
    if (userPhone) userPhone.value = usuarioActual.telefono || '';
    if (userAddress) userAddress.value = usuarioActual.direccion_habitual || '';
    if (userStore) userStore.value = usuarioActual.tienda_favorita || 'Westfield Glories';
}

function iniciarFormularioPerfil() {
    const saveBtn = document.getElementById('save-profile-btn') || document.querySelector('.save-btn');
    if (!saveBtn) return;

    saveBtn.addEventListener('click', async function () {
        const payload = {
            full_name: document.getElementById('full-name')?.value.trim() || '',
            phone: document.getElementById('user-phone')?.value.trim() || '',
            address: document.getElementById('user-address')?.value.trim() || '',
            favorite_store: document.getElementById('user-store')?.value || ''
        };

        this.disabled = true;
        const originalText = this.textContent;
        this.textContent = 'Guardando...';

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            const result = typeof parseResponse === 'function'
                ? await parseResponse(res)
                : { ok: res.ok, data: await res.json() };

            if (!result.ok) {
                throw new Error(result.data?.error || 'No se pudo guardar el perfil.');
            }

            usuarioActual = result.data.usuario;
            localStorage.setItem('activeUser', JSON.stringify(usuarioActual));

            const nameDisplay = document.getElementById('user-display-name');
            if (nameDisplay) {
                nameDisplay.innerText = `Hola, ${usuarioActual.nombre}`;
            }

            this.textContent = 'Guardado';
        } catch (error) {
            console.error('Error guardando perfil:', error);
            alert(error.message || 'No se pudo guardar el perfil.');
            this.textContent = originalText;
        } finally {
            setTimeout(() => {
                this.disabled = false;
                this.textContent = originalText;
            }, 1200);
        }
    });
}

function marcarNavegacionActiva() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.navbar .nav-link').forEach((link) => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active-link');
        }
    });
}

function actualizarContadorCarrito() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;

    const cartData = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cartData.reduce((acc, item) => acc + (item.quantity || 1), 0);

    badge.innerText = totalItems;
    badge.style.display = totalItems > 0 ? 'flex' : 'none';
}

function formatearFecha(fechaIso) {
    if (!fechaIso) return '--';

    const fecha = new Date(fechaIso);
    return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function traducirEstado(estado) {
    switch (estado) {
        case 'Preparacion':
            return 'Preparación';
        case 'Reparto':
            return 'Reparto';
        case 'Entregado':
            return 'Entregado';
        default:
            return estado || 'Pendiente';
    }
}

function claseEstado(estado) {
    switch (estado) {
        case 'Preparacion':
            return 'preparacion';
        case 'Reparto':
            return 'reparto';
        case 'Entregado':
            return 'entregado';
        default:
            return 'pendiente';
    }
}
