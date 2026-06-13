let tamanoPackActual = 0;
let precioPackActual = "";
let bebidasSeleccionadas = [];

const bebidasDisponibles = [
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

    pintarSelectoresDeBebidas();
}

function volverATamanos() {
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');

    if (step1) step1.style.display = 'block';
    if (step2) step2.style.display = 'none';

    bebidasSeleccionadas = [];
}

function pintarSelectoresDeBebidas() {
    const container = document.getElementById('drinks-container');
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < tamanoPackActual; i++) {
        const div = document.createElement('div');
        div.className = "select-wrapper";

        let selectHtml = `<select class="pack-drink-select" onchange="actualizarEstadoPack()">`;
        selectHtml += `<option value="" disabled selected>Seleccionar bebida ${i + 1}...</option>`;

        bebidasDisponibles.forEach(bebida => {
            selectHtml += `<option value="${bebida}">${bebida}</option>`;
        });

        selectHtml += `</select>`;
        div.innerHTML = selectHtml;
        container.appendChild(div);
    }

    actualizarEstadoPack();
}

function actualizarEstadoPack() {
    const selects = document.querySelectorAll('.pack-drink-select');
    let totalSeleccionadas = 0;
    let bebidasElegidas = [];

    selects.forEach(select => {
        if (select.value !== "") {
            totalSeleccionadas++;
            bebidasElegidas.push(select.value);
        }
    });

    bebidasSeleccionadas = bebidasElegidas;

    const summary = document.getElementById('pack-summary');
    if (summary) {
        summary.innerText = `Seleccionadas: ${totalSeleccionadas} / ${tamanoPackActual}`;
    }

    const btn = document.getElementById('add-pack-btn');
    if (btn) {
        btn.disabled = totalSeleccionadas < tamanoPackActual;
    }
}

function confirmPack() {
    const packPreparado = {
        name: `Lote de ${tamanoPackActual} bebidas`,
        price: precioPackActual,
        items: bebidasSeleccionadas
    };

    console.log("Lote preparado:", packPreparado);
    alert(`Lote de ${tamanoPackActual} bebidas preparado correctamente.`);
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

function logout() {
    const userProfile = document.getElementById('user-profile');
    const authButtons = document.querySelectorAll('.join-btn, .login-btn');

    if (userProfile) userProfile.style.display = 'none';
    authButtons.forEach(btn => btn.style.display = 'inline-flex');

    alert("Has cerrado sesión correctamente.");
    window.location.href = "index.html";
}

window.onclick = function(event) {
    const packModal = document.getElementById('pack-wizard');
    const authModal = document.getElementById('authModal');

    if (event.target === packModal) closePackWizard();
    if (event.target === authModal) closeAuthModal();
};

document.addEventListener('DOMContentLoaded', () => {
    const profileBtn = document.querySelector('.profile-button');
    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            if (profileBtn.getAttribute('href')) {
                window.location.href = profileBtn.href;
            }
        });
    }
});
