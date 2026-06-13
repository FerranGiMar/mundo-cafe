let productosDb = [];

function addToCart(producto) {
    let carrito = JSON.parse(localStorage.getItem('cart')) || [];

    const productoExistente = carrito.find(item =>
        String(item.id) === String(producto.id) && item.tipo === producto.tipo
    );

    if (productoExistente) {
        productoExistente.quantity += 1;
    } else {
        carrito.push({
            ...producto,
            quantity: producto.quantity || 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(carrito));
    actualizarContadorCarrito();
}

function actualizarContadorCarrito() {
    const cartCountBadge = document.getElementById('cart-count');
    if (!cartCountBadge) return;

    const carrito = JSON.parse(localStorage.getItem('cart')) || [];
    const total = carrito.reduce((acc, item) => acc + (item.quantity || 1), 0);

    cartCountBadge.innerText = total;
    cartCountBadge.style.display = total > 0 ? 'flex' : 'none';
}

function normalizarTexto(texto) {
    return String(texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

async function cargarProductos() {
    try {
        const respuesta = await fetch('/api/productos', {
            method: 'GET',
            credentials: 'include'
        });

        const datos = await respuesta.json();
        if (!respuesta.ok || !Array.isArray(datos)) {
            throw new Error(datos.error || 'No se pudieron cargar los productos.');
        }

        productosDb = datos;
    } catch (error) {
        console.error('Error cargando productos desde backend:', error);
        productosDb = [];
    }
}

function buscarProductoPorNombre(nombre) {
    const nombreBuscado = normalizarTexto(nombre);

    return productosDb.find(producto =>
        normalizarTexto(producto.nombre) === nombreBuscado
    ) || null;
}

function actualizarSesionHeader() {
    if (typeof checkUserSession === 'function') {
        checkUserSession();
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    actualizarSesionHeader();
    actualizarContadorCarrito();
    await cargarProductos();

    const sideCart = document.getElementById('side-cart');
    const overlay = document.getElementById('cart-overlay');
    const closeCart = document.getElementById('close-cart');
    const btnPagar = document.querySelector('.btn-pagar');

    const mostrarCarritoLateral = (state) => {
        if (sideCart && overlay) {
            sideCart.classList.toggle('active', state);
            overlay.classList.toggle('active', state);
        }
    };

    if (closeCart) closeCart.addEventListener('click', () => mostrarCarritoLateral(false));
    if (overlay) overlay.addEventListener('click', () => mostrarCarritoLateral(false));

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('.product-card');
            if (!card) return;

            const nombre = card.querySelector('.product-name')?.innerText?.trim() || 'Producto';
            const imagen = card.querySelector('img')?.src || '';
            const idDesdeHtml = Number(card.dataset.id || button.dataset.id || 0);

            let productoDb = null;

            if (idDesdeHtml) {
                productoDb = productosDb.find(producto => Number(producto.id_producto) === idDesdeHtml) || null;
            }

            if (!productoDb) {
                productoDb = buscarProductoPorNombre(nombre);
            }

            if (!productoDb) {
                alert(`No se ha podido relacionar "${nombre}" con la base de datos.`);
                return;
            }

            button.classList.add('added');
            const originalContent = button.innerHTML;
            button.innerHTML = '<i class="fas fa-check"></i>';

            setTimeout(() => {
                button.classList.remove('added');
                button.innerHTML = originalContent;
            }, 600);

            const productoParaCarrito = {
                id: Number(productoDb.id_producto),
                tipo: 'producto',
                name: productoDb.nombre,
                price: Number(productoDb.precio),
                image: imagen,
                quantity: 1
            };

            addToCart(productoParaCarrito);
            setTimeout(() => mostrarCarritoLateral(true), 200);
        });
    });

    if (btnPagar) {
        btnPagar.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'carrito.html';
        });
    }

    document.querySelectorAll('.nav-item a').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href').substring(1);

            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('visible');
                section.classList.add('hidden');
            });

            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('visible');
            }

            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });

            this.parentElement.classList.add('active');
        });
    });
});
