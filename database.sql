-- Creación de la base de datos
CREATE DATABASE IF NOT EXISTS comida247;
USE comida247;

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_usd DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50),
    image_url VARCHAR(255),
    active BOOLEAN DEFAULT TRUE
);

-- Tabla de pedidos
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100),
    total_usd DECIMAL(10, 2) NOT NULL,
    status ENUM('pendiente', 'preparando', 'listo', 'cobrado') DEFAULT 'pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Detalle de los pedidos
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT,
    product_id INT,
    quantity INT DEFAULT 1,
    price_at_time DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Datos iniciales de ejemplo
INSERT INTO products (name, description, price_usd, category, image_url) VALUES 
('Burger Clásica', 'Carne 150g, queso cheddar, lechuga y tomate.', 5.99, 'Hamburguesas', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=80'),
('Doble Cheese', 'Doble carne, doble queso, tocino y salsa especial.', 8.50, 'Hamburguesas', 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=500&q=80'),
('Papas Fritas', 'Papas rústicas con sal de mar.', 2.50, 'Complementos', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=500&q=80'),
('Refresco', 'Varios sabores 500ml.', 1.50, 'Bebidas', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80');
