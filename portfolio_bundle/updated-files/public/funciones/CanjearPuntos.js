let puntosUsuario = 0;
let usuarioActual = null;
let recompensas = [];

document.addEventListener('DOMContentLoaded', async () => {
    await Promise.all([
        cargarSesionYDatos(),
        cargarRecompensas()
    ]);

    actualizarHeader();
});

async function cargarSesionYDatos() {
    try {
        const sessionRes = await fetch('/session', {
            method: 'GET',
            credentials: 'include'
        });

        const sessionData = await sessionRes.json();

        if (!sessionRes.ok || !sessionData.logueado || !sessionData.usuario) {
            usuarioActual = null;
            puntosUsuario = 0;
            actualizarInterfaz();
            return;
        }

        usuarioActual = sessionData.usuario;
        localStorage.setItem('activeUser', JSON.stringify(usuarioActual));

        const puntosRes = await fetch('/api/puntos', {
            method: 'GET',
            credentials: 'include'
        });

        const puntosData = await puntosRes.json();

        if (!puntosRes.ok) {
            throw new Error(puntosData.error || 'No se pudieron cargar los puntos.');
        }

        puntosUsuario = Number(puntosData.puntos || 0);
        actualizarInterfaz();
    } catch (error) {
        console.error('Error cargando sesión o puntos:', error);
        puntosUsuario = 0;
        actualizarInterfaz();
    }
}

async function cargarRecompensas() {
    const rewardsGrid = document.getElementById('rewards-grid');
    if (!rewardsGrid) return;

    rewardsGrid.innerHTML = '<p class="rewards-loading">Cargando recompensas disponibles...</p>';

    try {
        const res = await fetch('/api/recompensas', {
            method: 'GET',
            credentials: 'include'
        });

        const data = await res.json();

        if (!res.ok || !Array.isArray(data)) {
            throw new Error(data.error || 'No se pudieron cargar las recompensas.');
        }

        recompensas = data;
        renderRecompensas();
        actualizarInterfaz();
    } catch (error) {
        console.error('Error cargando recompensas:', error);
        rewardsGrid.innerHTML = '<p class="rewards-loading">No se pudieron cargar las recompensas.</p>';
    }
}

function renderRecompensas() {
    const rewardsGrid = document.getElementById('rewards-grid');
    if (!rewardsGrid) return;

    const imageMap = {
        1: 'img/café-bombon.jpg',
        2: 'img/CruasanSimple.jpg',
        3: 'img/GreenStandard.jpg',
        4: 'img/zumo-de-naranja-natural.jpg',
        5: 'img/domingo.png',
        6: 'img/Best seller.jpg'
    };

    rewardsGrid.innerHTML = recompensas.map((reward) => `
        <button
            type="button"
            class="reward-card ${puntosUsuario >= reward.puntos_requeridos ? '' : 'locked'}"
            data-id="${reward.id_recompensa}"
        >
            <div class="card-img-container">
                <img src="${imageMap[reward.id_recompensa] || 'img/logo.png'}" alt="${reward.nombre}">
            </div>
            <div class="card-body">
                <p class="category-label">${reward.puntos_requeridos} puntos</p>
                <h3>${reward.nombre}</h3>
                <p class="card-description">${reward.descripcion || 'Recompensa disponible en el club de puntos.'}</p>
            </div>
            <div class="card-footer">
                <span class="card-pts">${reward.puntos_requeridos} pts</span>
            </div>
        </button>
    `).join('');

    rewardsGrid.querySelectorAll('.reward-card').forEach((card) => {
        card.addEventListener('click', () => {
            const id = Number(card.dataset.id);
            const recompensa = recompensas.find((item) => Number(item.id_recompensa) === id);
            if (!recompensa) return;

            intentarCanje(recompensa);
        });
    });
}

function actualizarInterfaz() {
    const displayGrande = document.getElementById('puntos-actuales-grande');
    if (displayGrande) displayGrande.innerText = puntosUsuario;

    const progressBar = document.getElementById('progress-bar-fill');
    const objetivoMaximo = recompensas.length
        ? Math.max(...recompensas.map((reward) => Number(reward.puntos_requeridos || 0)))
        : 600;

    if (progressBar) {
        const porcentaje = objetivoMaximo > 0
            ? Math.min((puntosUsuario / objetivoMaximo) * 100, 100)
            : 0;
        progressBar.style.width = `${porcentaje}%`;
    }

    const textoFaltante = document.getElementById('puntos-faltantes');
    if (textoFaltante) {
        const siguienteRecompensa = recompensas.find((reward) => puntosUsuario < Number(reward.puntos_requeridos));

        if (!siguienteRecompensa) {
            textoFaltante.innerHTML = '<strong>Tienes todas las recompensas desbloqueadas.</strong>';
        } else {
            const faltan = Number(siguienteRecompensa.puntos_requeridos) - puntosUsuario;
            textoFaltante.innerHTML = `Te faltan <b>${faltan}</b> puntos para desbloquear <b>${siguienteRecompensa.nombre}</b>.`;
        }
    }

    const cards = document.querySelectorAll('.reward-card');
    cards.forEach((card) => {
        const rewardId = Number(card.getAttribute('data-id'));
        const reward = recompensas.find((item) => Number(item.id_recompensa) === rewardId);
        const ptsRequeridos = Number(reward?.puntos_requeridos || 0);

        if (puntosUsuario >= ptsRequeridos) {
            card.classList.remove('locked');
        } else {
            card.classList.add('locked');
        }
    });
}

async function intentarCanje(recompensa) {
    if (!usuarioActual) {
        return alert('Debes iniciar sesión para usar tus puntos.');
    }

    const ptsNecesarios = Number(recompensa.puntos_requeridos || 0);

    if (puntosUsuario < ptsNecesarios) {
        return alert(`Te faltan ${ptsNecesarios - puntosUsuario} puntos para esta recompensa.`);
    }

    if (!confirm(`¿Quieres canjear ${ptsNecesarios} puntos por "${recompensa.nombre}"?`)) {
        return;
    }

    try {
        const res = await fetch('/api/canjear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id_recompensa: recompensa.id_recompensa })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'No se pudo realizar el canje.');
        }

        puntosUsuario = Number(data.puntos_actuales || 0);
        actualizarInterfaz();

        const imageMap = {
            1: 'img/café-bombon.jpg',
            2: 'img/CruasanSimple.jpg',
            3: 'img/GreenStandard.jpg',
            4: 'img/zumo-de-naranja-natural.jpg',
            5: 'img/domingo.png',
            6: 'img/Best seller.jpg'
        };

        añadirPremioAlCarrito(
            recompensa.id_recompensa,
            recompensa.nombre,
            imageMap[recompensa.id_recompensa] || 'img/logo.png'
        );

        alert('Canje realizado correctamente. Ya puedes verlo en el carrito.');
    } catch (error) {
        console.error('Error en canje:', error);
        alert(error.message || 'Error al canjear la recompensa.');
    }
}

function añadirPremioAlCarrito(idRecompensa, nombre, rutaImagen) {
    const carritoActual = JSON.parse(localStorage.getItem('cart')) || [];
    const imagenFinal = rutaImagen || 'img/logo.png';

    carritoActual.push({
        id: `PREMIO-${idRecompensa}-${Date.now()}`,
        tipo: 'recompensa',
        name: `${nombre} (Premio)`,
        price: 0,
        image: imagenFinal,
        quantity: 1,
        rewardId: idRecompensa
    });

    localStorage.setItem('cart', JSON.stringify(carritoActual));
    actualizarContadorCarrito();
}

function actualizarHeader() {
    const currentPath = window.location.pathname.split('/').pop();
    const currentPage = (currentPath === '' || currentPath === '/') ? 'index.html' : currentPath;

    document.querySelectorAll('.navbar .nav-link').forEach((link) => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage) {
            link.classList.add('active-link');
        } else {
            link.classList.remove('active-link');
        }
    });

    const userProfile = document.getElementById('user-profile');
    const joinBtn = document.getElementById('joinBtn');
    const userBtn = document.getElementById('userBtn');
    const userDisplayName = document.getElementById('user-display-name');

    const isLoggedIn = !!usuarioActual;

    if (userProfile) userProfile.style.display = isLoggedIn ? 'flex' : 'none';
    if (joinBtn) joinBtn.style.display = isLoggedIn ? 'none' : 'block';
    if (userBtn) userBtn.style.display = isLoggedIn ? 'none' : 'block';
    if (userDisplayName && usuarioActual) {
        userDisplayName.innerText = `Hola, ${usuarioActual.nombre || 'Usuario'}`;
    }

    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    const carrito = JSON.parse(localStorage.getItem('cart')) || [];
    const countElement = document.getElementById('cart-count');

    if (countElement) {
        const totalItems = carrito.reduce((acc, item) => acc + (item.quantity || 1), 0);
        countElement.innerText = totalItems;
        countElement.style.display = totalItems > 0 ? 'flex' : 'none';
    }
}
