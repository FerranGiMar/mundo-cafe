const ALLOWED_ORDER_STATUSES = ['Preparacion', 'Reparto', 'Entregado'];
const ALLOWED_DELIVERY_TYPES = ['home', 'clickcollect', 'schedule'];
const ALLOWED_PAYMENT_METHODS = ['card', 'store'];
const ALLOWED_STORES = ['Mataró Parc', 'CC Montigalá', 'Westfield Glories'];

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function cleanText(value, maxLength = 255) {
    return String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, maxLength);
}

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePasswordStrength(password) {
    return typeof password === 'string' && password.length >= 6;
}

function validatePhone(phone) {
    if (!phone) {
        return true;
    }

    return /^[+\d\s()-]{7,20}$/.test(phone);
}

function validarEstadoPedido(estado) {
    return ALLOWED_ORDER_STATUSES.includes(estado);
}

function parseProfilePayload(payload = {}) {
    const nombre = cleanText(payload.nombre ?? payload.full_name, 150);
    const telefono = cleanText(payload.telefono ?? payload.phone, 30);
    const direccion = cleanText(payload.direccion_habitual ?? payload.address, 200);
    const tiendaFavorita = cleanText(payload.tienda_favorita ?? payload.favorite_store, 120);

    if (!nombre) {
        return { ok: false, error: 'El nombre completo es obligatorio.' };
    }

    if (!validatePhone(telefono)) {
        return { ok: false, error: 'El teléfono no tiene un formato válido.' };
    }

    if (tiendaFavorita && !ALLOWED_STORES.includes(tiendaFavorita)) {
        return { ok: false, error: 'La tienda favorita seleccionada no es válida.' };
    }

    return {
        ok: true,
        data: {
            nombre,
            telefono,
            direccion,
            tienda_favorita: tiendaFavorita
        }
    };
}

function parseOrderContext(payload = {}) {
    const deliveryType = String(payload.deliveryType || '').trim();
    const paymentMethod = String(payload.paymentMethod || '').trim();
    const destination = cleanText(payload.destination, 255);
    const phone = cleanText(payload.phone, 30);
    const notes = cleanText(payload.notes, 500);
    const scheduledForRaw = String(payload.scheduledFor || '').trim();

    if (!ALLOWED_DELIVERY_TYPES.includes(deliveryType)) {
        return { ok: false, error: 'El método de entrega no es válido.' };
    }

    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
        return { ok: false, error: 'El método de pago no es válido.' };
    }

    if (!validatePhone(phone)) {
        return { ok: false, error: 'El teléfono de contacto no es válido.' };
    }

    if (!destination) {
        return { ok: false, error: 'Falta el destino del pedido.' };
    }

    if (deliveryType !== 'home' && !ALLOWED_STORES.includes(destination)) {
        return { ok: false, error: 'La tienda seleccionada no es válida.' };
    }

    let scheduledFor = null;

    if (deliveryType === 'schedule') {
        if (!scheduledForRaw) {
            return { ok: false, error: 'Debes indicar fecha y hora para el pedido programado.' };
        }

        const parsedDate = new Date(scheduledForRaw);
        if (Number.isNaN(parsedDate.getTime())) {
            return { ok: false, error: 'La fecha programada no es válida.' };
        }

        scheduledFor = parsedDate;
    }

    return {
        ok: true,
        data: {
            deliveryType,
            paymentMethod,
            destination,
            phone,
            notes,
            scheduledFor
        }
    };
}

module.exports = {
    ALLOWED_STORES,
    cleanText,
    normalizeEmail,
    parseOrderContext,
    parseProfilePayload,
    validateEmail,
    validatePasswordStrength,
    validarEstadoPedido
};
