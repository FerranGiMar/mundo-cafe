async function parseResponse(res) {
    const text = await res.text();

    try {
        return {
            ok: res.ok,
            status: res.status,
            data: JSON.parse(text)
        };
    } catch {
        return {
            ok: res.ok,
            status: res.status,
            data: { error: text || `Error ${res.status}` }
        };
    }
}

function clearLocalSession() {
    localStorage.removeItem('activeUser');
    localStorage.removeItem('userName');
}

function normalizeUser(usuario) {
    if (!usuario) return null;

    return {
        id_usuario: usuario.id_usuario,
        nombre: usuario.nombre || usuario.nombre_completo || '',
        email: usuario.email || '',
        puntos: Number(usuario.puntos || usuario.puntos_acumulados || 0),
        rol: usuario.rol || 'cliente'
    };
}

function saveLocalSession(usuario) {
    const usuarioNormalizado = normalizeUser(usuario);
    if (!usuarioNormalizado) return;

    localStorage.setItem('activeUser', JSON.stringify(usuarioNormalizado));
    if (usuarioNormalizado.nombre) {
        localStorage.setItem('userName', usuarioNormalizado.nombre);
    }
}

function buildErrorMessage(data, status) {
    return (
        data?.detalle ||
        data?.detail ||
        data?.error ||
        (data?.code ? `Código: ${data.code}` : null) ||
        `Error ${status}`
    );
}

function openAuthModal(mode) {
    const modal = document.getElementById('authModal');
    if (!modal) return;

    modal.style.display = 'flex';
    toggleAuth(mode === 'login' || mode === 'log' ? 'log' : 'reg');
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.style.display = 'none';
}

function toggleAuth(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (!loginForm || !registerForm) return;

    loginForm.style.display = (mode === 'log') ? 'block' : 'none';
    registerForm.style.display = (mode === 'log') ? 'none' : 'block';
}

window.addEventListener('click', (e) => {
    const modal = document.getElementById('authModal');
    if (!modal) return;
    if (e.target === modal) closeAuthModal();
});

async function ejecutarRegistro() {
    const nombre = document.getElementById('regName')?.value.trim();
    const email = document.getElementById('regEmail')?.value.trim().toLowerCase();
    const password = document.getElementById('regPass')?.value;

    if (!nombre || !email || !password) {
        alert('Por favor, completa todos los campos.');
        return;
    }

    try {
        const res = await fetch('/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ nombre, email, password })
        });

        const result = await parseResponse(res);

        if (!result.ok) {
            alert(buildErrorMessage(result.data, result.status));
            return;
        }

        saveLocalSession(result.data?.usuario);

        alert(`¡Cuenta creada con éxito! Bienvenido, ${normalizeUser(result.data?.usuario)?.nombre || nombre}.`);
        closeAuthModal();
        location.reload();
    } catch (err) {
        console.error('Error en registro:', err);
        alert('Servidor no disponible.');
    }
}

async function ejecutarLogin() {
    const email = document.getElementById('logEmail')?.value.trim().toLowerCase();
    const password = document.getElementById('logPass')?.value;

    if (!email || !password) {
        alert('Introduce email y contraseña.');
        return;
    }

    try {
        const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });

        const result = await parseResponse(res);

        if (!result.ok) {
            alert(buildErrorMessage(result.data, result.status));
            return;
        }

        saveLocalSession(result.data?.usuario);

        closeAuthModal();
        location.reload();
    } catch (err) {
        console.error('Error en login:', err);
        alert('Error de conexión con el servidor.');
    }
}

async function checkUserSession() {
    const joinBtn = document.getElementById('joinBtn');
    const userBtn = document.getElementById('userBtn');
    const userProfile = document.getElementById('user-profile');
    const nameDisplay = document.getElementById('user-display-name');

    try {
        const res = await fetch('/session', {
            method: 'GET',
            credentials: 'include'
        });

        const result = await parseResponse(res);
        const data = result.data;

        if (result.ok && data?.logueado && data?.usuario) {
            saveLocalSession(data.usuario);

            if (joinBtn) joinBtn.style.display = 'none';
            if (userBtn) userBtn.style.display = 'none';
            if (userProfile) userProfile.style.display = 'flex';

            if (nameDisplay) {
                const nombre = normalizeUser(data.usuario)?.nombre || data.usuario.email?.split('@')[0] || 'Mi Perfil';
                nameDisplay.innerText = `Hola, ${nombre}`;
            }
        } else {
            clearLocalSession();

            if (joinBtn) joinBtn.style.display = 'block';
            if (userBtn) userBtn.style.display = 'block';
            if (userProfile) userProfile.style.display = 'none';
        }
    } catch (err) {
        console.error('Error comprobando sesión:', err);

        clearLocalSession();

        if (joinBtn) joinBtn.style.display = 'block';
        if (userBtn) userBtn.style.display = 'block';
        if (userProfile) userProfile.style.display = 'none';
    }
}

async function logout() {
    try {
        const res = await fetch('/logout', {
            method: 'POST',
            credentials: 'include'
        });

        const result = await parseResponse(res);

        clearLocalSession();

        if (!result.ok) {
            alert(buildErrorMessage(result.data, result.status));
        }

        window.location.href = 'index.html';
    } catch (err) {
        console.error('Error en logout:', err);
        clearLocalSession();
        window.location.href = 'index.html';
    }
}

document.addEventListener('DOMContentLoaded', checkUserSession);
