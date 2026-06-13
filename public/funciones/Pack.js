let tamanoPackActual = 0;
let precioPackActual = "";
let bebidasSeleccionadas = [];

const bebidasPack = [
    "Café con matcha",
    "Té chai con leche",
    "Café con leche manchado",
    "Capuchino",
    "Café blanco",
    "Menta Poleo",
    "Manzanilla",
    "Valeriana",
    "Tila",
    "Infusión de jengibre",
    "Anís estrellado con miel"
];

function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

function buscarIdProductoPorNombre(nombre) {
    const nombreNormalizado = normalizarTexto(nombre);

    const mapa = {
        'tostada de aguacate y huevo': 7,
        'tostada de hummus y aguacate': 6,
        'tostada doble de aguacate': 7,
        'tostada picante de aguacate': 8
    };

    return mapa[nombreNormalizado] || null;
}

function openPackWizard() {
    const modalPacks = document.getElementById('pack-wizard');
    if (modalPacks) {
        modalPacks.style.display = 'flex';
        volverATamanos();
    }
}

function closePackWizard() {
    const modalPacks = document.getElementById('pack-wizard');
    if (modalPacks) modalPacks.style.display = 'none';
}

function selectPackSize(size, price) {
    tamanoPackActual = size;
    precioPackActual = price;

    document.getElementById('step-1').style.display = 'none';
    document.getElementById('step-2').style.display = 'block';
    document.getElementById('max-qty').innerText = size;

    pintarSelectoresPack();
}

function volverATamanos() {
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');

    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';

    bebidasSeleccionadas = [];
}

function pintarSelectoresPack() {
    const container = document.getElementById('drinks-container');
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < tamanoPackActual; i++) {
        const div = document.createElement('div');
        div.className = "select-wrapper";

        let selectHtml = `<select class="pack-drink-select" onchange="actualizarPack()">`;
        selectHtml += `<option value="" disabled selected>Seleccionar bebida ${i + 1}...</option>`;

        bebidasPack.forEach(bebida => {
            selectHtml += `<option value="${bebida}">${bebida}</option>`;
        });

        selectHtml += `</select>`;
        div.innerHTML = selectHtml;
        container.appendChild(div);
    }

    actualizarPack();
}

function actualizarPack() {
    const selects = document.querySelectorAll('.pack-drink-select');
    let totalElegidas = 0;
    let seleccionadas = [];

    selects.forEach(select => {
        if (select.value !== "") {
            totalElegidas++;
            seleccionadas.push(select.value);
        }
    });

    bebidasSeleccionadas = seleccionadas;

    const summary = document.getElementById('pack-summary');
    if (summary) {
        summary.innerText = `Seleccionadas: ${totalElegidas} / ${tamanoPackActual}`;
    }

    const btn = document.getElementById('add-pack-btn');
    if (btn) {
        btn.disabled = totalElegidas < tamanoPackActual;
    }
}

function confirmPack() {
    let idMenu = 3;

    if (tamanoPackActual <= 2) {
        idMenu = 1;
    } else if (tamanoPackActual === 3) {
        idMenu = 2;
    }

    const packPersonalizado = {
        id: idMenu,
        tipo: 'menu',
        name: `Lote de ${tamanoPackActual} bebidas`,
        price: parseFloat(precioPackActual.replace('€', '').replace(',', '.').trim()),
        image: "img/logo.png",
        quantity: 1,
        items: bebidasSeleccionadas
    };

    if (typeof addToCart === 'function') {
        addToCart(packPersonalizado);
    } else {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => String(item.id) === String(packPersonalizado.id) && item.tipo === packPersonalizado.tipo);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push(packPersonalizado);
        }

        localStorage.setItem('cart', JSON.stringify(cart));
    }

    alert(`Lote de ${tamanoPackActual} bebidas añadido correctamente.`);
    closePackWizard();
}

function openAuthModal(mode) {
    const modal = document.getElementById('authModal');
    if (modal) {
        modal.style.display = 'flex';
        switchTab(mode === 'log' ? 'login' : 'register');
    }
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function switchTab(tab) {
    const loginForm = document.getElementById('form-login') || document.getElementById('loginForm');
    const registerForm = document.getElementById('form-register') || document.getElementById('registerForm');

    if (tab === 'login') {
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
    } else {
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'block';
    }
}

async function logout() {
    try {
        const res = await fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'No se pudo cerrar sesión.');
        }

        localStorage.removeItem('activeUser');

        const userProfile = document.getElementById('user-profile');
        const authButtons = document.querySelectorAll('.join-btn, .login-btn');

        if (userProfile) userProfile.style.display = 'none';
        authButtons.forEach(btn => btn.style.display = 'inline-flex');

        alert("Has cerrado sesión correctamente.");
        window.location.href = "index.html";
    } catch (error) {
        console.error('Error en logout:', error);
        alert(error.message || 'Error al cerrar sesión.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.querySelector('.profile-button');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            if (profileBtn.getAttribute('href')) {
                window.location.href = profileBtn.href;
            }
        });
    }

    document.addEventListener('click', (e) => {
        const button = e.target.closest('.add-to-cart');
        if (!button) return;

        e.preventDefault();

        const card = button.closest('.product-card');
        if (!card) return;

        const nombre = card.querySelector('.product-name')?.innerText.trim() || '';
        const priceText = card.querySelector('.product-price')?.innerText.trim() || '';
        const imagen = card.querySelector('img')?.getAttribute('src') || '';

        if (!nombre || !priceText) {
            console.warn('No se pudo leer nombre o precio de la tarjeta');
            return;
        }

        let idProducto = card.dataset.id || button.dataset.id || null;

        if (!idProducto) {
            idProducto = buscarIdProductoPorNombre(nombre);
        }

        if (!idProducto) {
            alert(`No se ha podido relacionar "${nombre}" con la base de datos.`);
            return;
        }

        const productoCarrito = {
            id: Number(idProducto),
            tipo: 'producto',
            name: nombre,
            price: parseFloat(priceText.replace('€', '').replace(',', '.').trim()),
            image: imagen,
            quantity: 1
        };

        if (typeof addToCart === 'function') {
            addToCart(productoCarrito, button);
        } else {
            console.error('addToCart no está disponible');
        }
    });

    const links = document.querySelectorAll(".nav-item a");
    links.forEach(link => {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const targetId = this.getAttribute("href").substring(1);

            document.querySelectorAll(".content-section").forEach(section => {
                section.classList.remove("visible");
                section.classList.add("hidden");
            });

            const target = document.getElementById(targetId);
            if (target) {
                target.classList.remove("hidden");
                target.classList.add("visible");
            }

            document.querySelectorAll(".nav-item").forEach(item => {
                item.classList.remove("active");
            });

            this.parentElement.classList.add("active");
        });
    });
});
