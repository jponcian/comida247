-- Reiniciar base de datos
DROP TABLE IF EXISTS order_item_ingredients;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS business_user;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS businesses;

-- 1. Tabla de Negocios
CREATE TABLE businesses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Usuarios
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Relación Usuario-Negocio con Roles
CREATE TABLE business_user (
    business_id INT,
    user_id INT,
    role ENUM('atencion', 'cocina', 'caja', 'administrador') NOT NULL,
    PRIMARY KEY (business_id, user_id),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Tabla de Ingredientes (Configurables por negocio)
CREATE TABLE ingredients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price_usd DECIMAL(10, 2) DEFAULT 0.00,
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- 5. Tabla de Productos (Relacionados con negocio)
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_usd DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- 6. Tabla de Clientes
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) NOT NULL,
    phone VARCHAR(20),
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    UNIQUE(business_id, cedula)
);

-- 7. Tabla de Pedidos
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),
    customer_id INT NULL,
    order_type ENUM('comer_aqui', 'llevar_delivery', 'llevar_retiro') DEFAULT 'comer_aqui',
    table_number VARCHAR(10) NULL,
    total_usd DECIMAL(10, 2) NOT NULL,
    observations TEXT,
    status ENUM('pendiente', 'preparando', 'listo', 'cobrado') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- 7. Detalle de los Pedidos (Items)
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    price_at_time DECIMAL(10, 2) NOT NULL,
    observations TEXT,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 8. Ingredientes Extra por Item de Pedido
CREATE TABLE order_item_ingredients (
    order_item_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (order_item_id, ingredient_id),
    FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
);

-- 9. Tabla de Mesas
CREATE TABLE IF NOT EXISTS tables (
    id INT AUTO_INCREMENT PRIMARY KEY,
    business_id INT NOT NULL,
    name VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE CASCADE
);

-- Datos iniciales para pruebas
INSERT INTO businesses (name) VALUES ('La Gran Hamburguesa'), ('Pizzería Italia');

-- Password 'admin123'
INSERT INTO users (name, cedula, phone, password, is_super_admin) VALUES 
('Super Admin', '12345678', '04121234567', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE),
('Juan Atencion', '87654321', '04147654321', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', FALSE),
('Usuario Principal', '16912337', '0', '$2y$10$HeUF8YbDK1wxX/z2NZzCP.KVPNm8zpCby5kejQVETxGUN9OaXl.MS', TRUE);

-- Asignar Juan al negocio 1 como atencion
INSERT INTO business_user (business_id, user_id, role) VALUES (1, 2, 'atencion');

-- Ingredientes para negocio 1
INSERT INTO ingredients (business_id, name, price_usd) VALUES 
(1, 'Extra Queso', 0.50),
(1, 'Tocino', 1.00),
(1, 'Aguacate', 0.80);

-- Productos para negocio 1
INSERT INTO products (business_id, name, description, price_usd, category, image_url) VALUES 
(1, 'Burger Clásica', 'Carne 150g, queso cheddar, lechuga y tomate.', 5.99, 'Hamburguesas', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80'),
(1, 'Perro Especial', 'Salchicha, queso rallado, tocino y salsas.', 4.00, 'Perros Calientes', 'https://images.unsplash.com/photo-1541214113241-21578d2d9b62?auto=format&fit=crop&w=500&q=80');
