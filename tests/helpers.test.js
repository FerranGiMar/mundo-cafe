const test = require('node:test');
const assert = require('node:assert/strict');

const { hashPassword, verifyPassword, isHashedPassword } = require('../lib/passwords');
const { parseOrderContext, parseProfilePayload, validateEmail } = require('../lib/validators');

test('hashPassword genera un hash verificable', async () => {
    const plainPassword = 'PortfolioCafe2026';
    const hash = await hashPassword(plainPassword);

    assert.equal(isHashedPassword(hash), true);
    assert.equal(await verifyPassword(plainPassword, hash), true);
    assert.equal(await verifyPassword('incorrecta', hash), false);
});

test('parseProfilePayload valida y normaliza el perfil', () => {
    const result = parseProfilePayload({
        full_name: '  Ferran Gimenez  ',
        phone: '+34 600 111 222',
        address: '  Calle Mayor 12  ',
        favorite_store: 'Mataró Parc'
    });

    assert.equal(result.ok, true);
    assert.equal(result.data.nombre, 'Ferran Gimenez');
    assert.equal(result.data.telefono, '+34 600 111 222');
    assert.equal(result.data.direccion, 'Calle Mayor 12');
    assert.equal(result.data.tienda_favorita, 'Mataró Parc');
});

test('parseOrderContext rechaza tiendas no válidas en recogida', () => {
    const result = parseOrderContext({
        deliveryType: 'clickcollect',
        destination: 'Tienda inventada',
        phone: '+34 600 111 222',
        notes: '',
        paymentMethod: 'store'
    });

    assert.equal(result.ok, false);
});

test('parseOrderContext acepta un pedido programado válido', () => {
    const result = parseOrderContext({
        deliveryType: 'schedule',
        destination: 'Westfield Glories',
        phone: '+34 600 111 222',
        notes: 'Sin azúcar',
        paymentMethod: 'card',
        scheduledFor: '2026-05-01T10:30:00'
    });

    assert.equal(result.ok, true);
    assert.ok(result.data.scheduledFor instanceof Date);
});

test('validateEmail distingue correos válidos', () => {
    assert.equal(validateEmail('demo@mundocafe.com'), true);
    assert.equal(validateEmail('correo-invalido'), false);
});
