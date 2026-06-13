document.addEventListener('DOMContentLoaded', () => {
    const SEDES = {
        'Mataró Parc': { lat: 41.5545, lon: 2.4182 },
        'CC Montigalá': { lat: 41.4616, lon: 2.2345 },
        'Westfield Glories': { lat: 41.4035, lon: 2.1915 }
    };

    const tipo = localStorage.getItem('tipoEntrega');
    const destinoFull = localStorage.getItem('datoDestino');
    const direccionGeo = localStorage.getItem('direccionGeo');
    const esProgramado = localStorage.getItem('esProgramado') === 'true';
    const carrito = JSON.parse(localStorage.getItem('pedido_carrito')) || [];
    const tiendaProgramada = localStorage.getItem('tiendaProgramada') || '';
    const ultimoPedido = JSON.parse(localStorage.getItem('ultimoPedido') || 'null');
    const puntosActuales = Number(localStorage.getItem('puntosActuales') || 0);

    const boxEnvio = document.getElementById('display-envio');
    const boxRecogida = document.getElementById('display-recogida');
    const boxProgramado = document.getElementById('display-programado');
    const etaDisplay = document.getElementById('eta-time');
    const thermalText = document.getElementById('thermal-text');
    const shippingBlock = document.getElementById('shipping-info-block');
    const dirElem = document.getElementById('direccion-entrega');
    const orderNumberEl = document.getElementById('order-number');
    const loyaltyMsgEl = document.getElementById('loyalty-message');
    const pointsSummaryEl = document.getElementById('points-summary');

    renderResumenCompra(carrito, ultimoPedido);
    renderDatosPedido(ultimoPedido);
    renderBloquePuntos(ultimoPedido, puntosActuales);
    iniciarThermalStatus(ultimoPedido);

    localStorage.removeItem('pedido_carrito');

    if (tipo === 'home' && !esProgramado) {
        show(boxEnvio);
        show(shippingBlock);
        if (dirElem) dirElem.textContent = destinoFull || '—';
        iniciarSeguimientoEnvio(direccionGeo || destinoFull);
    } else if (tipo === 'clickcollect' && !esProgramado) {
        show(boxRecogida);
        setTimeout(() => iniciarMapaRecogida(destinoFull), 100);
    } else if (esProgramado || tipo === 'schedule') {
        show(boxProgramado);

        const resumenFecha = document.getElementById('resumen-fecha');
        const resumenHora = document.getElementById('resumen-hora');

        if (resumenFecha) resumenFecha.textContent = localStorage.getItem('fechaPedido') || '--';
        if (resumenHora) resumenHora.textContent = localStorage.getItem('horaPedido') || '--';

        if (tiendaProgramada) {
            const lineaTienda = document.getElementById('resumen-tienda-programada');
            const spanTienda = document.getElementById('tienda-programada');
            if (lineaTienda) lineaTienda.style.display = 'block';
            if (spanTienda) spanTienda.textContent = tiendaProgramada;
        }

        setTimeout(() => iniciarMapaRecogida(tiendaProgramada || destinoFull || 'Westfield Glories'), 100);
    }

    const btnPedir = document.querySelector('.nav-pedir-ahora');
    if (btnPedir) {
        btnPedir.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'pedirahora.html';
        });
    }

    function renderDatosPedido(pedido) {
        if (!pedido) return;

        if (orderNumberEl) {
            orderNumberEl.textContent = `Pedido #${pedido.id_pedido}`;
        }

        if (thermalText) {
            thermalText.textContent = traducirEstado(pedido.estado);
        }
    }

    function traducirEstado(estado) {
        switch (estado) {
            case 'Preparacion':
                return 'Pedido en preparación ☕';
            case 'Reparto':
                return 'Pedido en reparto 🛵';
            case 'Entregado':
                return 'Pedido entregado ✔';
            default:
                return 'Pedido recibido ✔';
        }
    }

    function renderBloquePuntos(pedido, puntosTotales) {
        const puntosGanados = Number(pedido?.puntos_ganados || 0);
        const progreso = Math.max(0, Math.min((puntosTotales % 100) || 0, 100));
        const progressBar = document.querySelector('.progress-bar');

        if (loyaltyMsgEl) {
            loyaltyMsgEl.innerHTML = `Has ganado <strong>${puntosGanados} puntos</strong> con este pedido.`;
        }

        if (pointsSummaryEl) {
            pointsSummaryEl.textContent = `Puntos acumulados actuales: ${puntosTotales}`;
        }

        if (progressBar) {
            progressBar.style.width = `${progreso}%`;
        }
    }

    function iniciarThermalStatus(pedido) {
        if (!thermalText) return;

        const estadoInicial = pedido?.estado || 'Preparacion';

        if (estadoInicial === 'Entregado') {
            thermalText.textContent = 'Pedido entregado ✔';
            return;
        }

        if (estadoInicial === 'Reparto') {
            thermalText.textContent = (tipo === 'home')
                ? 'En reparto 🛵'
                : 'Pedido listo para recoger ☕';
            return;
        }

        thermalText.textContent = 'Pedido en preparación ☕';

        setTimeout(() => {
            if (tipo === 'home') {
                thermalText.textContent = 'En reparto 🛵';
            } else {
                thermalText.textContent = '¡Listo para recoger! ☕';
            }
        }, 8000);
    }

    async function iniciarSeguimientoEnvio(direccionCompleta) {
        if (!direccionCompleta) {
            inicializarMapa(41.4035, 2.1915, 14);
            if (etaDisplay) etaDisplay.innerText = '~30 min aprox.';
            return;
        }

        try {
            const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccionCompleta)}&limit=1`,
                { headers: { 'Accept-Language': 'es' } }
            );
            const geoData = await geoRes.json();
            if (!geoData.length) throw new Error("Dirección no encontrada");

            const latDest = parseFloat(geoData[0].lat);
            const lonDest = parseFloat(geoData[0].lon);

            let mejorSede = SEDES['Westfield Glories'];
            let mejorNombre = 'Westfield Glories';
            let distMin = Infinity;

            for (const [nombre, coords] of Object.entries(SEDES)) {
                const d = Math.hypot(coords.lat - latDest, coords.lon - lonDest);
                if (d < distMin) {
                    distMin = d;
                    mejorSede = coords;
                    mejorNombre = nombre;
                }
            }

            const osrmRes = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${mejorSede.lon},${mejorSede.lat};${lonDest},${latDest}?overview=full&geometries=geojson`
            );
            const osrmData = await osrmRes.json();
            if (!osrmData.routes?.length) throw new Error("Sin ruta OSRM");

            const rutaCoords = osrmData.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
            const duracionMin = Math.ceil(osrmData.routes[0].duration / 60) + 10;
            const distanciaKm = (osrmData.routes[0].distance / 1000).toFixed(1);

            if (etaDisplay) etaDisplay.innerText = `${duracionMin} min aprox. (${distanciaKm} km)`;

            inicializarMapa(mejorSede.lat, mejorSede.lon, 13);

            const iconCafe = crearIcono('<i class="fa-solid fa-mug-hot"></i>', 'coffee-pin pulse-soft');
            const iconCasa = crearIcono('<i class="fa-solid fa-house-chimney"></i>', 'home-pin');
            const iconMoto = L.icon({
                iconUrl: 'img/moto.png',
                iconSize: [45, 45],
                className: 'moto-marker-img'
            });

            L.marker([mejorSede.lat, mejorSede.lon], { icon: iconCafe })
                .addTo(window.mapInstance)
                .bindPopup(`<b>${mejorNombre}</b><br>Tu pedido sale desde aquí.`);

            L.marker([latDest, lonDest], { icon: iconCasa })
                .addTo(window.mapInstance)
                .bindPopup('<b>📍 Tu dirección</b>');

            const markerMoto = L.marker([mejorSede.lat, mejorSede.lon], { icon: iconMoto })
                .addTo(window.mapInstance);

            const poly = L.polyline(rutaCoords, { color: '#ce967b', weight: 5 })
                .addTo(window.mapInstance);

            window.mapInstance.fitBounds(poly.getBounds(), { padding: [50, 50] });
            animarMotoRuta(markerMoto, rutaCoords, duracionMin);
        } catch (err) {
            console.error('Error mapa envío:', err);
            inicializarMapa(41.4035, 2.1915, 14);
            if (etaDisplay) etaDisplay.innerText = '~30 min aprox.';
        }
    }

    function iniciarMapaRecogida(nombreSede) {
        const coords = SEDES[nombreSede] || SEDES['Westfield Glories'];
        const tiendaNombre = SEDES[nombreSede] ? nombreSede : 'Nuestra Cafetería';

        const tiendaElem = document.getElementById('tienda-elegida');
        if (tiendaElem) tiendaElem.textContent = tiendaNombre;

        inicializarMapa(coords.lat, coords.lon, 16);

        const iconTienda = crearIcono('<i class="fa-solid fa-store"></i>', 'coffee-pin pulse-soft');
        L.marker([coords.lat, coords.lon], { icon: iconTienda })
            .addTo(window.mapInstance)
            .bindPopup(`<b>${tiendaNombre}</b><br>Tu pedido se preparará aquí.`)
            .openPopup();
    }

    function inicializarMapa(lat, lon, zoom) {
        if (window.mapInstance) {
            window.mapInstance.remove();
            window.mapInstance = null;
        }

        window.mapInstance = L.map('map', { zoomControl: true }).setView([lat, lon], zoom);

        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors © CARTO'
        }).addTo(window.mapInstance);

        setTimeout(() => {
            if (window.mapInstance) window.mapInstance.invalidateSize();
        }, 400);
    }

    function crearIcono(html, extraClass) {
        return L.divIcon({
            html: `<div class="custom-pin ${extraClass}">${html}</div>`,
            className: 'custom-leaflet-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });
    }

    function animarMotoRuta(marker, ruta, duracionTotalMin) {
        let secsRestantes = duracionTotalMin * 60;
        let idx = 0;
        const avance = ruta.length / secsRestantes;

        const timer = setInterval(() => {
            secsRestantes--;
            idx += avance;
            const pos = Math.min(Math.floor(idx), ruta.length - 1);

            if (secsRestantes > 0 && pos < ruta.length - 1) {
                const min = Math.ceil(secsRestantes / 60);
                if (etaDisplay) etaDisplay.innerText = `${min} min aprox.`;
                marker.setLatLng(ruta[pos]);

                if (thermalText && min <= 5) {
                    thermalText.textContent = '¡El repartidor está llegando! 🛵';
                }
            } else {
                clearInterval(timer);
                marker.setLatLng(ruta[ruta.length - 1]);

                if (etaDisplay) etaDisplay.innerText = '¡Entregado! ✔';
                if (thermalText) thermalText.textContent = '¡Pedido entregado! Buen provecho ☕';
            }
        }, 1000);
    }

    function show(el) {
        if (el) el.style.display = 'block';
    }

    function renderResumenCompra(productos, pedido) {
        const contenedor = document.getElementById('lista-productos');
        const totalElem = document.getElementById('total-precio');
        if (!contenedor) return;

        if (!productos.length) {
            contenedor.innerHTML = '<p style="opacity:0.6;font-size:0.85rem;">Sin productos en el pedido.</p>';
            if (totalElem && pedido?.total) {
                totalElem.innerText = `${Number(pedido.total).toFixed(2).replace('.', ',')}€`;
            }
            return;
        }

        let totalVisual = 0;

        contenedor.innerHTML = productos.map(p => {
            const price = parseFloat(p.price) || 0;
            const qty = p.quantity || 1;
            const sub = price * qty;
            totalVisual += sub;

            return `
                <div class="product-item">
                    <span><span class="product-qty">${qty}x</span> ${p.name}</span>
                    <span class="product-price-summary">${price === 0 ? 'Recompensa' : sub.toFixed(2).replace('.', ',') + '€'}</span>
                </div>
            `;
        }).join('');

        const totalFinal = pedido?.total ? Number(pedido.total) : totalVisual;
        if (totalElem) {
            totalElem.innerText = `${totalFinal.toFixed(2).replace('.', ',')}€`;
        }
    }
});
