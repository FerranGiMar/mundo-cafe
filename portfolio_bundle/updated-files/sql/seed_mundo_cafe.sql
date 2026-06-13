BEGIN;

INSERT INTO categorias (id, nombre) VALUES
(1, 'Cafes'),
(2, 'Tes'),
(3, 'Infusiones'),
(4, 'Otras Bebidas'),
(5, 'Dulces'),
(6, 'Edicion Limitada'),
(7, 'Tostadas'),
(8, 'Pequenos Placeres'),
(9, 'Momentos Especiales');

INSERT INTO productos (id_producto, nombre, descripcion, precio, id_categoria, stock_disponible) VALUES
(1, 'Cafe Matcha', 'Bebida vibrante con matcha, espresso y leche al vapor.', 4.50, 1, 99),
(2, 'Chai Latte', 'Te negro especiado con leche al vapor.', 3.80, 1, 99),
(3, 'Sweet Potato', 'Latte de temporada con boniato especiado.', 4.80, 1, 99),
(4, 'Latte Machiatto', 'Leche al vapor marcada con espresso.', 3.80, 1, 99),
(5, 'Cappuccino', 'Espresso, leche al vapor y espuma.', 3.50, 1, 99),
(6, 'Flat-White', 'Doble espresso con microespuma.', 3.80, 1, 99),
(7, 'Te Matcha', 'Matcha de alta calidad con leche al vapor.', 4.00, 2, 99),
(8, 'Te Blanco', 'Te delicado, floral y antioxidante.', 3.20, 2, 99),
(9, 'Te Negro', 'Te intenso con oxidacion completa.', 3.00, 2, 99),
(10, 'Pai Mu Tan', 'Variedad premium de te blanco.', 3.50, 2, 99),
(11, 'Chai Masala', 'Te negro con especias y leche.', 3.80, 2, 99),
(12, 'Roibos Supergrade', 'Infusion sudafricana sin cafeina.', 3.00, 2, 99),
(13, 'Menta Poleo', 'Infusion refrescante y digestiva.', 2.80, 3, 99),
(14, 'Manzanilla', 'Infusion suave y calmante.', 2.80, 3, 99),
(15, 'Valeriana', 'Infusion sedante y relajante.', 2.80, 3, 99),
(16, 'Tila', 'Infusion floral contra el estres.', 2.80, 3, 99),
(17, 'Infusion de jengibre', 'Infusion caliente antiinflamatoria.', 3.00, 3, 99),
(18, 'Infusion de anis estrellado con miel', 'Infusion especiada y digestiva.', 2.80, 3, 99),
(19, 'Batido De Chocolate', 'Batido cremoso de chocolate.', 5.50, 4, 99),
(20, 'Cafe Bombon', 'Espresso con leche condensada.', 3.20, 4, 99),
(21, 'Zumo de Naranja Natural', 'Zumo recien exprimido.', 4.20, 4, 99),
(22, 'Zumo De Melocoton Natural', 'Zumo natural de melocoton.', 4.80, 4, 99),
(23, 'Zumo De Pina Natural', 'Zumo natural de pina.', 4.80, 4, 99),
(24, 'Zumo de manzana natural', 'Zumo natural de manzana.', 4.80, 4, 99),
(25, 'Judi''s Banana Bread', 'Bizcocho casero de platano y canela.', 4.20, 5, 99),
(26, 'Apple Loaf Cake', 'Bizcocho de manzana especiado.', 3.50, 5, 99),
(27, 'Carrot Cake', 'Tarta de zanahoria con frosting.', 3.50, 5, 99),
(28, 'Lemon Pie', 'Tarta de limon con merengue.', 4.50, 5, 99),
(29, 'Oatmeal Chocolate Raisin Cookies (x6)', 'Galletas de avena, chocolate y pasas.', 5.50, 5, 99),
(30, 'Cinnamon Roll', 'Roll de canela con glaseado.', 4.00, 5, 99),
(31, 'Surtido Galleta Navidenas (x6)', 'Surtido de galletas navidenas.', 5.50, 6, 99),
(32, 'Chocolate caliente', 'Chocolate caliente con canela y marshmallows.', 4.00, 6, 99),
(33, 'Red Velvet Cake Latte', 'Latte con sirope red velvet y nata.', 5.20, 6, 99),
(34, 'THE GREEN STANDARD', 'Tostada de aguacate, lima, cilantro y huevo campero.', 4.50, 7, 99),
(35, 'WELLNES HARVEST', 'Tostada con hummus de remolacha, aguacate y huevo.', 9.99, 7, 99),
(36, 'ESSENTIAL AVOCADO', 'Tostada de centeno con doble aguacate y huevo.', 9.99, 7, 99),
(37, 'THE SPICY QUEEN', 'Tostada citrica con aguacate, huevo y cebolla encurtida.', 9.99, 7, 99),
(38, 'TRUFFLE RITUAL', 'Tostada gourmet con crema trufada, aguacate y pistachos.', 5.90, 7, 99),
(39, 'GOLDEN HOUR TOAST', 'Tostada mediterranea con tomate seco y queso de cabra.', 5.90, 7, 99),
(40, 'PISTACHIO VELVET', 'Cruasan relleno de crema de pistacho.', 5.90, 8, 99),
(41, 'THE KINDER DREAM', 'Cruasan premium con chocolate blanco y avellanas.', 5.90, 8, 99),
(42, 'HIPPO GLOW', 'Cruasan con relleno cremoso y topping Happy Hippo.', 5.90, 8, 99),
(43, 'LOTUS OBSESSION', 'Cruasan con crema Lotus y crumble.', 5.90, 8, 99),
(44, 'THE TIMELESS CROISSANT', 'Cruasan artesano clasico de mantequilla.', 5.90, 8, 99),
(45, 'GRAIN & GLORY', 'Cruasan multicereales con semillas.', 5.90, 8, 99),
(46, 'Pack Cumpleanos', 'Bizcocho personalizado con bebida favorita.', 8.99, 9, 99),
(47, 'Best Sellers', '3 tostadas, 3 piezas dulces y bebida favorita.', 19.99, 9, 99),
(48, 'Desayuna en equipo', '4 tostadas, 2 cruasanes y mezcla de cafes y zumos.', 15.99, 9, 99),
(49, 'ACTIVA TU DIA', 'Pack de cafes de especialidad a elegir.', 9.99, 9, 99),
(50, 'DOMINGOS CASEROS', 'Tostada o reposteria con bebida favorita.', 5.80, 9, 99);

INSERT INTO menus (id_menu, nombre, precio_combo, descripcion) VALUES
(1, 'Menu Cafes', 0.00, 'Carta principal de cafes de especialidad.'),
(2, 'Menu Tes', 0.00, 'Carta principal de tes.'),
(3, 'Menu Infusiones', 0.00, 'Carta principal de infusiones.'),
(4, 'Menu Otras Bebidas', 0.00, 'Carta principal de otras bebidas.'),
(5, 'Menu Dulces', 0.00, 'Carta principal de reposteria.'),
(6, 'Menu Edicion Limitada', 0.00, 'Carta de temporada.'),
(7, 'Packs Tostadas a tu altura', 0.00, 'Seleccion de tostadas premium.'),
(8, 'Packs Pequenos placeres', 0.00, 'Seleccion de cruasanes premium.'),
(9, 'Packs Momentos especiales', 0.00, 'Packs especiales para compartir.'),
(10, 'THE COFFEE GANG x2', 5.50, 'Pack personalizable de 2 bebidas.'),
(11, 'THE COFFEE GANG x4', 10.50, 'Pack personalizable de 4 bebidas.'),
(12, 'THE COFFEE GANG x6', 15.00, 'Pack personalizable de 6 bebidas.'),
(13, 'THE COFFEE GANG x8', 18.50, 'Pack personalizable de 8 bebidas.');

INSERT INTO menu_productos (id_menu, id_producto) VALUES
(1, 1),(1, 2),(1, 3),(1, 4),(1, 5),(1, 6),
(2, 7),(2, 8),(2, 9),(2, 10),(2, 11),(2, 12),
(3, 13),(3, 14),(3, 15),(3, 16),(3, 17),(3, 18),
(4, 19),(4, 20),(4, 21),(4, 22),(4, 23),(4, 24),
(5, 25),(5, 26),(5, 27),(5, 28),(5, 29),(5, 30),
(6, 31),(6, 32),(6, 33),
(7, 34),(7, 35),(7, 36),(7, 37),(7, 38),(7, 39),
(8, 40),(8, 41),(8, 42),(8, 43),(8, 44),(8, 45),
(9, 46),(9, 47),(9, 48),(9, 49),(9, 50),
(10, 1),(10, 2),(10, 4),(10, 5),(10, 6),(10, 13),(10, 14),(10, 15),(10, 16),(10, 17),(10, 18),
(11, 1),(11, 2),(11, 4),(11, 5),(11, 6),(11, 13),(11, 14),(11, 15),(11, 16),(11, 17),(11, 18),
(12, 1),(12, 2),(12, 4),(12, 5),(12, 6),(12, 13),(12, 14),(12, 15),(12, 16),(12, 17),(12, 18),
(13, 1),(13, 2),(13, 4),(13, 5),(13, 6),(13, 13),(13, 14),(13, 15),(13, 16),(13, 17),(13, 18);

INSERT INTO usuarios (
    id_usuario,
    nombre_completo,
    email,
    password,
    puntos_acumulados,
    rol,
    telefono,
    direccion_habitual,
    tienda_favorita,
    fecha_registro
) VALUES
(1, 'Ferran Gimenez', 'ferran@mundocafe.com', 'scrypt$b0071287ea9748a04a1de5b12afad807$6737c6d5d7531dd567a99c298495104568773707fb333475aafdc55b18dba579b6a591012ed6bd9edffebd2c64ed71eb5e337d9194e7f2a190ff4aa7d9099b6d', 1000, 'cliente', '+34 600 123 456', 'Carrer d''Exemple 15, Barcelona', 'Westfield Glories', '2026-03-01 09:00:00'),
(2, 'Laura Moreno', 'laura@mundocafe.com', 'scrypt$bd379c8985214a6f491f656edfc5b268$86a57db1a47d836a87a3d085976ce3e96bea3b47fafde38f89da56c7cdc41762116027303d6e32a9a19cd40b6e5e1606be39abf4efcdfc6998bae812e34d784f', 650, 'cliente', '+34 611 987 654', 'Avinguda Central 8, Badalona', 'CC Montigalá', '2026-03-08 11:30:00'),
(3, 'Admin Mundo Cafe', 'admin@mundocafe.com', 'scrypt$216c6ae5b42ebf648763403e5e7bc042$e4f540c316ff784e882ea0789b67913a038423aaea46f39dfc8fbedc44f93d6bd507168af36b6fc6fe82443c4cf2ba5a1f8c6d0cb1daf81aa3499734cd624214', 0, 'admin', '+34 600 000 000', 'Sede central', 'Mataró Parc', '2026-03-01 08:00:00');

INSERT INTO pedidos (
    id_pedido,
    id_usuario,
    fecha,
    total,
    puntos_ganados,
    estado,
    tipo_entrega,
    destino_entrega,
    telefono_contacto,
    notas,
    metodo_pago,
    fecha_programada
) VALUES
(1, 1, '2026-03-19 08:10:00', 6.50, 65, 'Entregado', 'clickcollect', 'Westfield Glories', '+34 600 123 456', '', 'store', NULL),
(2, 1, '2026-03-15 14:05:00', 4.20, 42, 'Entregado', 'home', 'Carrer d''Exemple 15, Barcelona', '+34 600 123 456', 'Sin azucar', 'card', NULL),
(3, 1, '2026-03-10 18:00:00', 7.60, 76, 'Entregado', 'schedule', 'Westfield Glories', '+34 600 123 456', '', 'card', '2026-03-10 18:30:00'),
(4, 2, '2026-04-02 09:30:00', 19.99, 199, 'Reparto', 'home', 'Avinguda Central 8, Badalona', '+34 611 987 654', 'Llamar al llegar', 'card', NULL),
(5, 2, '2026-04-05 12:45:00', 15.99, 159, 'Preparacion', 'clickcollect', 'CC Montigalá', '+34 611 987 654', '', 'store', NULL);

INSERT INTO lineas_pedido (id_linea, id_pedido, id_producto, id_menu, cantidad, precio_unitario, estado) VALUES
(1, 1, 6, NULL, 1, 3.80, 'Entregado'),
(2, 1, 26, NULL, 1, 2.70, 'Entregado'),
(3, 2, 25, NULL, 1, 4.20, 'Entregado'),
(4, 3, 5, NULL, 2, 3.80, 'Entregado'),
(5, 4, 47, 9, 1, 19.99, 'Reparto'),
(6, 5, 48, 9, 1, 15.99, 'Preparacion');

INSERT INTO recompensas (id_recompensa, nombre, descripcion, puntos_requeridos, id_producto_vinculado, id_menu_vinculado) VALUES
(1, 'CAFE CLASICO A ELEGIR', 'Cafe de especialidad favorito preparado al gusto.', 100, 1, NULL),
(2, 'CRUASAN ARTESANO', 'Cruasan clasico de mantequilla.', 200, 44, NULL),
(3, 'THE GREEN STANDARD', 'Tostada premium de aguacate y huevo.', 300, 34, NULL),
(4, 'ZUMO VITAMIN BOOST', 'Zumo natural recien exprimido.', 400, 21, NULL),
(5, 'PACK DOMINGO CASERO', 'Pack con bebida y tostada o reposteria.', 500, 50, NULL),
(6, 'PACK BEST SELLERS', 'Caja premium con tostadas, dulces y bebida.', 600, NULL, 9);

INSERT INTO historial_canjes (
    id_canje,
    id_usuario,
    id_recompensa,
    fecha_canje,
    puntos_totales_antes,
    puntos_gastados,
    puntos_totales_despues
) VALUES
(1, 1, 1, '2026-03-05 10:00:00', 500, 100, 400),
(2, 1, 2, '2026-03-12 09:00:00', 400, 200, 200),
(3, 2, 1, '2026-04-01 11:30:00', 250, 100, 150);

SELECT setval('categorias_id_seq', (SELECT MAX(id) FROM categorias), true);
SELECT setval('productos_id_producto_seq', (SELECT MAX(id_producto) FROM productos), true);
SELECT setval('menus_id_menu_seq', (SELECT MAX(id_menu) FROM menus), true);
SELECT setval('usuarios_id_usuario_seq', (SELECT MAX(id_usuario) FROM usuarios), true);
SELECT setval('pedidos_id_pedido_seq', (SELECT MAX(id_pedido) FROM pedidos), true);
SELECT setval('lineas_pedido_id_linea_seq', (SELECT MAX(id_linea) FROM lineas_pedido), true);
SELECT setval('recompensas_id_recompensa_seq', (SELECT MAX(id_recompensa) FROM recompensas), true);
SELECT setval('historial_canjes_id_canje_seq', (SELECT MAX(id_canje) FROM historial_canjes), true);

COMMIT;
