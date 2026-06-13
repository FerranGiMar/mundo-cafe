let carrito = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', async () => {
    pintarCarrito();
    iniciarLogicaEntrega();
    iniciarLogicaPago();
    actualizarContadorCarrito();
    prepararCamposTarjeta();
    marcarPaginaActual();

    const logueado = await comprobarSesion();
    if (logueado) {
        await cargarPerfilCheckout();
    }
});

function actualizarContadorCarrito() {
    const badge = document.getElementById('cart-count');
    if (!badge) return;

    const totalItems = carrito.reduce((acc, item) => acc + (item.quantity || 1), 0);

    if (totalItems > 0) {
        badge.innerText = totalItems;
        badge.style.display = 'flex';
        badge.classList.add('bump');
        setTimeout(() => badge.classList.remove('bump'), 300);
    } else {
        badge.style.display = 'none';
    }
}

function actualizarAvisoEnvio(total) {
    const promoElement = document.getElementById('shippingPromo');
    if (!promoElement) return;

    const limiteEnvioGratis = 20;

    if (total >= limiteEnvioGratis) {
        promoElement.innerHTML = '<i class="fa-solid fa-circle-check"></i> ¡Tienes envío gratuito incluido!';
        promoElement.classList.add('success');
    } else {
        const falta = (limiteEnvioGratis - total).toFixed(2);
        promoElement.innerHTML = `<i class="fa-solid fa-truck-fast"></i> Añade ${falta}€ más para envío gratis`;
        promoElement.classList.remove('success');
    }
}

window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) closeAuthModal();
});

function pintarCarrito() {
    const cartList = document.getElementById('cartList');
    const subtotalElement = document.getElementById('subtotal');

    actualizarContadorCarrito();
    if (!cartList) return;

    if (carrito.length === 0) {
        cartList.innerHTML = `
            <div class="it-girl-empty-state">
                <div class="empty-content">
                    <span class="aesthetic-icon">☕</span>
                    <h2>Tu carrito está vacío</h2>
                    <p>Añade productos desde la carta para continuar con el pedido.</p>
                    <a href="pedirahora.html" class="btn-explore">Ver carta</a>
                </div>
            </div>`;
        if (subtotalElement) subtotalElement.innerText = '0,00 €';
        actualizarAvisoEnvio(0);
        return;
    }

    let total = 0;
    cartList.innerHTML = '';

    carrito.forEach((item) => {
        const quantity = item.quantity || 1;
        const sub = (item.price || 0) * quantity;
        total += sub;

        const esPremio = item.price === 0 || (item.id && (item.id.toString().includes('PREMIO') || item.id.toString().includes('canje')));

        cartList.innerHTML += `
            <div class="cart-item">
                <div class="item-info-group">
                    <img src="${item.image}" alt="${item.name}">
                    <div class="item-details">
                        <strong>${item.name}</strong>
                        <span class="unit-price">${item.price === 0 ? 'Recompensa' : item.price.toFixed(2) + '€/ud'}</span>
                    </div>
                </div>
                <div class="item-actions-group">
                    ${esPremio
                        ? '<span class="qty-fixed" style="padding:0 15px;font-weight:bold;">1 ud</span>'
                        : `<select class="qty-select" onchange="updateQuantity('${item.id}', this.value)">
                               ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => `<option value="${n}" ${quantity === n ? 'selected' : ''}>${n}</option>`).join('')}
                           </select>`}
                    <span class="item-price">${sub.toFixed(2).replace('.', ',')} €</span>
                    <button class="remove" onclick="removeFromCart('${item.id}')"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>`;
    });

    if (subtotalElement) subtotalElement.innerText = `${total.toFixed(2).replace('.', ',')} €`;
    actualizarAvisoEnvio(total);
}

function updateQuantity(id, qty) {
    const item = carrito.find((entry) => String(entry.id) === String(id));
    if (!item) return;

    if (item.price === 0 || (item.id && (item.id.toString().includes('PREMIO') || item.id.toString().includes('canje')))) {
        return;
    }

    item.quantity = parseInt(qty, 10);
    localStorage.setItem('cart', JSON.stringify(carrito));
    pintarCarrito();
}

function removeFromCart(id) {
    carrito = carrito.filter((item) => String(item.id) !== String(id));
    localStorage.setItem('cart', JSON.stringify(carrito));
    pintarCarrito();
}

async function comprobarSesion() {
    const loginBtn = document.querySelector('.login-btn');
    const joinBtn = document.querySelector('.join-btn');
    const userProfile = document.getElementById('user-profile');

    try {
        const res = await fetch('/session', {
            credentials: 'include'
        });

        const data = await res.json();

        if (data.logueado && data.usuario) {
            localStorage.setItem('activeUser', JSON.stringify(data.usuario));

            if (userProfile) userProfile.style.display = 'flex';
            if (loginBtn) {
                loginBtn.innerText = 'MI PERFIL';
                loginBtn.onclick = () => {
                    window.location.href = 'TuPerfil.html';
                };
            }
            if (joinBtn) joinBtn.style.display = 'none';
            return true;
        }

        localStorage.removeItem('activeUser');

        if (userProfile) userProfile.style.display = 'none';
        if (loginBtn) {
            loginBtn.innerText = 'ENTRAR';
            loginBtn.onclick = () => openAuthModal('log');
        }
        if (joinBtn) joinBtn.style.display = 'inline-block';
        return false;
    } catch (error) {
        console.error('Error comprobando sesión:', error);

        if (userProfile) userProfile.style.display = 'none';
        if (loginBtn) {
            loginBtn.innerText = 'ENTRAR';
            loginBtn.onclick = () => openAuthModal('log');
        }
        if (joinBtn) joinBtn.style.display = 'inline-block';
        return false;
    }
}

async function cargarPerfilCheckout() {
    try {
        const res = await fetch('/api/profile', {
            method: 'GET',
            credentials: 'include'
        });

        const data = await res.json();

        if (!res.ok || !data.usuario) {
            return;
        }

        const usuario = data.usuario;

        const phoneInput = document.getElementById('phone');
        const addressInput = document.getElementById('input-calle');
        const shopSelect = document.getElementById('shopSelect');
        const shopSchedule = document.getElementById('shopSelectSchedule');

        if (phoneInput && usuario.telefono) {
            phoneInput.value = usuario.telefono;
        }

        if (addressInput && usuario.direccion_habitual) {
            addressInput.value = usuario.direccion_habitual;
        }

        if (shopSelect && usuario.tienda_favorita) {
            shopSelect.value = usuario.tienda_favorita;
        }

        if (shopSchedule && usuario.tienda_favorita) {
            shopSchedule.value = usuario.tienda_favorita;
        }
    } catch (error) {
        console.error('Error cargando perfil para checkout:', error);
    }
}

function addToCart(product, btn) {
    const existingItem = carrito.find((item) => String(item.id) === String(product.id) && item.tipo === product.tipo);

    if (existingItem) {
        if (product.price !== 0 && !product.id.toString().includes('PREMIO')) {
            existingItem.quantity += 1;
        }
    } else {
        carrito.push({
            ...product,
            quantity: product.quantity || 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(carrito));
    actualizarContadorCarrito();

    if (document.getElementById('cartList')) {
        pintarCarrito();
    }

    if (btn) {
        const originalContent = btn.innerHTML;
        const originalBg = btn.style.backgroundColor;

        btn.innerHTML = '<i class="fa-solid fa-check" style="color:white;"></i>';
        btn.style.backgroundColor = '#28a745';
        btn.style.pointerEvents = 'none';

        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.backgroundColor = originalBg;
            btn.style.pointerEvents = 'auto';
        }, 800);
    }
}

function marcarPaginaActual() {
    const currentPath = window.location.pathname.split('/').pop();
    const currentPage = (currentPath === '' || currentPath === '/') ? 'index.html' : currentPath;

    document.querySelectorAll('.navbar .nav-link').forEach((link) => {
        link.classList.toggle('active-link', link.getAttribute('href') === currentPage);
    });
}

function iniciarLogicaEntrega() {
    const deliveryOptions = document.querySelectorAll('input[name="delivery"]');
    const sections = {
        home: document.getElementById('homeFields'),
        clickcollect: document.getElementById('clickFields'),
        schedule: document.getElementById('scheduleFields')
    };

    function aplicarEntrega(valor) {
        Object.keys(sections).forEach((key) => {
            if (sections[key]) {
                sections[key].style.display = key === valor ? 'block' : 'none';
            }
        });

        gestionarPagoTienda(valor);
    }

    const activeOpt = document.querySelector('input[name="delivery"]:checked');
    if (activeOpt) aplicarEntrega(activeOpt.value);

    deliveryOptions.forEach((opt) => {
        opt.addEventListener('change', () => aplicarEntrega(opt.value));
    });
}

function gestionarPagoTienda(tipoEntrega) {
    const radioTienda = document.querySelector('input[name="payment"][value="store"]');
    const radioTarjeta = document.querySelector('input[name="payment"][value="card"]');
    const cardFields = document.getElementById('cardFields');
    const labelTienda = document.getElementById('labelPagoTienda');

    if (!radioTienda) return;

    if (tipoEntrega === 'home') {
        radioTienda.disabled = true;

        if (labelTienda) {
            labelTienda.style.opacity = '0.35';
            labelTienda.style.cursor = 'not-allowed';
            labelTienda.title = 'No disponible para envío a domicilio';
        }

        if (radioTienda.checked) {
            radioTienda.checked = false;
            if (radioTarjeta) radioTarjeta.checked = true;
            if (cardFields) cardFields.style.display = 'block';
        }
    } else {
        radioTienda.disabled = false;

        if (labelTienda) {
            labelTienda.style.opacity = '1';
            labelTienda.style.cursor = 'pointer';
            labelTienda.title = '';
        }
    }
}

function iniciarLogicaPago() {
    const paymentOptions = document.querySelectorAll('input[name="payment"]');
    const cardFields = document.getElementById('cardFields');

    paymentOptions.forEach((opt) => {
        opt.addEventListener('change', () => {
            if (cardFields) {
                cardFields.style.display = opt.value === 'card' ? 'block' : 'none';
            }
        });
    });
}

function prepararCamposTarjeta() {
    const numInput = document.getElementById('cardNumber');
    if (numInput) {
        numInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });
    }

    const expiry = document.getElementById('cardExpiry');
    if (expiry) {
        expiry.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length >= 2) {
                value = `${value.substring(0, 2)}/${value.substring(2, 4)}`;
            }
            e.target.value = value;
        });
    }

    const phone = document.getElementById('phone');
    if (phone) {
        phone.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^\d+\s()-]/g, '');
        });
    }
}

function convertirCarritoParaPedido() {
    return carrito
        .filter((item) => item.price !== 0)
        .map((item) => ({
            tipo: item.tipo || 'producto',
            id: Number(item.id),
            cantidad: Number(item.quantity || 1)
        }));
}

function obtenerPayloadEntrega() {
    const entregaSeleccionada = document.querySelector('input[name="delivery"]:checked');
    if (!entregaSeleccionada) {
        throw new Error('Por favor, selecciona un método de envío.');
    }

    const paymentSelected = document.querySelector('input[name="payment"]:checked');
    if (!paymentSelected) {
        throw new Error('Por favor, selecciona un método de pago.');
    }

    const phone = document.getElementById('phone')?.value.trim() || '';
    const notes = document.getElementById('orderNotes')?.value.trim() || '';
    const tipoEntrega = entregaSeleccionada.value;

    let destination = '';
    let esProgramado = false;
    let scheduledFor = null;

    if (tipoEntrega === 'home') {
        const calle = document.getElementById('input-calle')?.value.trim() || '';
        const numero = document.getElementById('input-numero')?.value.trim() || '';
        const planta = document.getElementById('input-planta')?.value.trim() || '';
        const puerta = document.getElementById('input-puerta')?.value.trim() || '';
        const cp = document.getElementById('input-cp')?.value.trim() || '';

        if (!calle) throw new Error('Por favor, introduce la dirección de entrega.');
        if (!cp || cp.length < 5) throw new Error('Por favor, introduce un código postal válido (5 dígitos).');

        const direccionGeo = `${calle}${numero ? ` ${numero}` : ''}, ${cp}, España`;
        const partesPiso = [
            planta ? `Planta ${planta}` : '',
            puerta ? `Puerta ${puerta}` : ''
        ].filter(Boolean).join(', ');

        destination = `${calle}${numero ? ` ${numero}` : ''}${partesPiso ? ` — ${partesPiso}` : ''}, CP ${cp}`;

        localStorage.setItem('direccionGeo', direccionGeo);
        localStorage.removeItem('tiendaProgramada');
    } else if (tipoEntrega === 'clickcollect') {
        const shopSelect = document.getElementById('shopSelect');
        if (!shopSelect || !shopSelect.value) {
            throw new Error('Por favor, selecciona un punto de recogida.');
        }

        destination = shopSelect.value;
        localStorage.removeItem('direccionGeo');
        localStorage.removeItem('tiendaProgramada');
    } else if (tipoEntrega === 'schedule') {
        const fecha = document.getElementById('deliveryDate')?.value;
        const hora = document.getElementById('deliveryTime')?.value;
        const shopSchedule = document.getElementById('shopSelectSchedule')?.value || '';

        if (!fecha || !hora) {
            throw new Error('Por favor, selecciona fecha y hora para el pedido programado.');
        }

        if (!shopSchedule) {
            throw new Error('Por favor, selecciona una tienda para el pedido programado.');
        }

        esProgramado = true;
        scheduledFor = `${fecha}T${hora}:00`;
        destination = shopSchedule;

        const [anio, mes, dia] = fecha.split('-');
        const fechaObj = new Date(Number(anio), Number(mes) - 1, Number(dia));
        const fechaLeg = fechaObj.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        localStorage.setItem('fechaPedido', fechaLeg);
        localStorage.setItem('horaPedido', `${hora}h`);
        localStorage.setItem('tiendaProgramada', shopSchedule);
        localStorage.removeItem('direccionGeo');
    }

    if (!phone) {
        throw new Error('Por favor, introduce un teléfono de contacto.');
    }

    return {
        deliveryType: tipoEntrega,
        destination,
        phone,
        notes,
        paymentMethod: paymentSelected.value,
        esProgramado,
        scheduledFor
    };
}

document.getElementById('confirmOrder')?.addEventListener('click', async function () {
    if (carrito.length === 0) {
        return alert('El carrito está vacío.');
    }

    const activeUser = localStorage.getItem('activeUser');
    if (!activeUser) {
        return alert('Debes iniciar sesión para realizar el pedido.');
    }

    let contextoEntrega;

    try {
        contextoEntrega = obtenerPayloadEntrega();
    } catch (error) {
        return alert(error.message);
    }

    const items = convertirCarritoParaPedido();
    if (items.length === 0) {
        return alert('No hay artículos válidos para comprar.');
    }

    this.disabled = true;
    this.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> PROCESANDO...';

    try {
        const response = await fetch('/pedido', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                items,
                deliveryType: contextoEntrega.deliveryType,
                destination: contextoEntrega.destination,
                phone: contextoEntrega.phone,
                notes: contextoEntrega.notes,
                paymentMethod: contextoEntrega.paymentMethod,
                scheduledFor: contextoEntrega.scheduledFor
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'No se pudo procesar el pedido.');
        }

        localStorage.setItem('tipoEntrega', contextoEntrega.deliveryType);
        localStorage.setItem('datoDestino', contextoEntrega.destination);
        localStorage.setItem('esProgramado', contextoEntrega.esProgramado ? 'true' : 'false');
        localStorage.setItem('pedido_carrito', JSON.stringify(carrito));
        localStorage.setItem('ultimoPedido', JSON.stringify(data.pedido));
        localStorage.setItem('puntosActuales', String(data.puntos_actuales));

        carrito = [];
        localStorage.removeItem('cart');

        window.location.href = 'Confirmación.html';
    } catch (error) {
        alert(error.message || 'Error al procesar el pedido.');
        this.disabled = false;
        this.innerHTML = 'CONFIRMAR PEDIDO';
        console.error(error);
    }
});

document.getElementById('clearCart')?.addEventListener('click', function () {
    if (carrito.length === 0) return;
    if (!confirm('¿Seguro que quieres vaciar el carrito?')) return;

    carrito = [];
    localStorage.removeItem('cart');
    pintarCarrito();
});
