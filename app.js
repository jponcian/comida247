let cart = [];
let exchangeRate = 1;
let currentSection = 'pedidos';

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateExchangeRate();
    setInterval(refreshData, 5000); // Actualizar cada 5 seg
});

function refreshData() {
    if (currentSection === 'cocina') loadKitchenOrders();
    if (currentSection === 'caja') loadPaymentOrders();
}

async function loadProducts() {
    const res = await fetch('api.php?action=get_products');
    const products = await res.json();
    const container = document.getElementById('menu-container');
    container.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.image_url}" alt="${p.name}">
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>${p.description}</p>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="price-tag">$${parseFloat(p.price_usd).toFixed(2)}</span>
                    <button class="btn-add" onclick="addToCart(${p.id}, '${p.name}', ${p.price_usd})">Añadir</button>
                </div>
            </div>
        </div>
    `).join('');
}

async function updateExchangeRate() {
    const res = await fetch('api.php?action=get_exchange_rate');
    const data = await res.json();
    exchangeRate = data.rate;
}

function showSection(id) {
    currentSection = id;
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    
    document.getElementById(id).classList.add('active');
    document.getElementById('nav-' + id).classList.add('active');

    if (id === 'cocina') loadKitchenOrders();
    if (id === 'caja') loadPaymentOrders();
}

function addToCart(id, name, price) {
    cart.push({ id, name, price });
    updateCartUI();
}

function updateCartUI() {
    const float = document.getElementById('cart-float');
    if (cart.length > 0) {
        float.style.display = 'flex';
        document.getElementById('cart-count').innerText = cart.length;
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        document.getElementById('cart-total').innerText = `$${total.toFixed(2)}`;
    } else {
        float.style.display = 'none';
    }
}

async function checkoutOrder() {
    const name = prompt("¿Nombre del cliente?");
    if (!name) return;

    const total = cart.reduce((sum, item) => sum + item.price, 0);
    const orderData = {
        customer_name: name,
        total_usd: total,
        items: cart.map(i => ({ id: i.id, price: i.price, quantity: 1 }))
    };

    const res = await fetch('api.php?action=create_order', {
        method: 'POST',
        body: JSON.stringify(orderData)
    });

    const result = await res.json();
    if (result.success) {
        alert("¡Pedido enviado a cocina!");
        cart = [];
        updateCartUI();
    }
}

async function loadKitchenOrders() {
    const res = await fetch('api.php?action=get_orders');
    const orders = await res.json();
    const kitchenOrders = orders.filter(o => o.status === 'pendiente' || o.status === 'preparando');
    
    const container = document.getElementById('kitchen-container');
    container.innerHTML = kitchenOrders.map(o => `
        <div class="order-card ${o.status === 'preparando' ? 'preparing' : ''}">
            <div class="order-header">
                <strong>#${o.id} - ${o.customer_name}</strong>
                <span>${o.status.toUpperCase()}</span>
            </div>
            <p>Total: $${o.total_usd}</p>
            <button class="btn-status" style="background: ${o.status === 'pendiente' ? '#ffcc00' : '#00e676'}" 
                onclick="updateOrderStatus(${o.id}, '${o.status === 'pendiente' ? 'preparando' : 'listo'}')">
                ${o.status === 'pendiente' ? 'Empezar a cocinar' : 'Marcar como Listo'}
            </button>
        </div>
    `).join('');
}

async function loadPaymentOrders() {
    const res = await fetch('api.php?action=get_orders');
    const orders = await res.json();
    const readyOrders = orders.filter(o => o.status === 'listo');
    
    const container = document.getElementById('payment-container');
    container.innerHTML = readyOrders.map(o => {
        const totalBs = (o.total_usd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2 });
        return `
            <div class="payment-card" style="width: 100%;">
                <div class="order-header">
                    <strong>Orden #${o.id}</strong>
                    <span style="color: var(--success)">LISTO PARA COBRO</span>
                </div>
                <div style="margin: 1rem 0;">
                    <h2 style="color: var(--secondary)">$${parseFloat(o.total_usd).toFixed(2)} USD</h2>
                    <h3 style="color: var(--text-muted)">≈ Bs. ${totalBs}</h3>
                </div>
                <button class="btn-status" style="background: var(--primary)" onclick="updateOrderStatus(${o.id}, 'cobrado')">
                    Confirmar Pago y Entregar
                </button>
                <div class="exchange-info">Tasa usada: 1 USD = Bs. ${exchangeRate}</div>
            </div>
        `;
    }).join('');
}

async function updateOrderStatus(id, status) {
    await fetch('api.php?action=update_status', {
        method: 'POST',
        body: JSON.stringify({ id, status })
    });
    refreshData();
}
