let cart = [];
let availableIngredients = [];
let exchangeRate = 36.50;
let currentSection = 'pedidos';
let userRole = '';
let currentEditingOrderId = null;
let currentExtraTargetIndex = null;
let lastKnownOrderId = 0;

document.addEventListener('DOMContentLoaded', async () => {
    const auth = await checkAuth();
    if (!auth.logged_in) {
        window.location.href = 'index.html';
        return;
    }

    userRole = auth.role;
    setupUIByRole(auth);
    
    loadProducts();
    loadIngredients();
    updateExchangeRate();
    setInterval(refreshData, 5000);
});

async function checkAuth() {
    const res = await fetch('auth.php?action=check');
    return await res.json();
}

function setupUIByRole(auth) {
    if (userRole === 'administrador' || auth.user.is_super_admin) {
        document.getElementById('nav-admin').style.display = 'block';
    }
    if (auth.user.is_super_admin) {
        document.getElementById('nav-super').style.display = 'block';
    }
}

async function refreshData() {
    if (currentSection === 'cocina') loadKitchenOrders();
    if (currentSection === 'caja') loadPaymentOrders();
}

async function loadProducts() {
    const res = await fetch('api.php?action=get_products');
    const products = await res.json();
    const container = document.getElementById('menu-container');
    
    if (currentSection === 'pedidos') {
        container.innerHTML = products.map(p => `
            <div class="product-card">
                <img src="${p.image_url}" alt="${p.name}">
                <div class="product-info">
                    <h3>${p.name}</h3>
                    <p>${p.description}</p>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="price-tag">$${parseFloat(p.price_usd).toFixed(2)}</span>
                        <button class="btn-add" onclick="addToCart(${JSON.stringify(p).replace(/"/g, '&quot;')})">Añadir</button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // Si estamos en admin, cargar lista de admin
    if (currentSection === 'admin') {
        document.getElementById('admin-products-list').innerHTML = products.map(p => `
            <div class="admin-item">
                <span>${p.name} ($${p.price_usd})</span>
                <button onclick="editProduct(${JSON.stringify(p).replace(/"/g, '&quot;')})">Editar</button>
            </div>
        `).join('');
    }
}

async function loadIngredients() {
    const res = await fetch('api.php?action=get_ingredients');
    availableIngredients = await res.json();
    
    if (currentSection === 'admin') {
        document.getElementById('admin-ingredients-list').innerHTML = availableIngredients.map(i => `
            <div class="admin-item">
                <span>${i.name} (+$${i.price_usd})</span>
                <button onclick="editIngredient(${JSON.stringify(i).replace(/"/g, '&quot;')})">Editar</button>
            </div>
        `).join('');
    }
}

function addToCart(product) {
    cart.push({
        id: product.id,
        name: product.name,
        price: parseFloat(product.price_usd),
        basePrice: parseFloat(product.price_usd),
        quantity: 1,
        extras: []
    });
    updateCartUI();
}

function updateCartUI() {
    const float = document.getElementById('cart-float');
    if (cart.length > 0) {
        float.style.display = 'flex';
        document.getElementById('cart-count').innerText = cart.length;
        const total = calculateTotal();
        document.getElementById('cart-total').innerText = `$${total.toFixed(2)}`;
    } else {
        float.style.display = 'none';
    }
}

function calculateTotal() {
    return cart.reduce((sum, item) => {
        const extrasTotal = item.extras.reduce((s, e) => s + parseFloat(e.price), 0);
        return sum + (item.basePrice + extrasTotal) * item.quantity;
    }, 0);
}

function openCheckoutModal() {
    const container = document.getElementById('checkout-items');
    container.innerHTML = cart.map((item, index) => `
        <div class="checkout-item">
            <div style="display: flex; justify-content: space-between;">
                <strong>${item.name}</strong>
                <span>$${item.basePrice.toFixed(2)}</span>
            </div>
            <div class="extras-preview">
                ${item.extras.map(e => `<span>+ ${e.name} ($${e.price})</span>`).join('')}
            </div>
            <div style="margin-top: 0.5rem; display: flex; gap: 0.5rem;">
                <button class="btn-small" onclick="openExtrasModal(${index})">+ Extras</button>
                <button class="btn-small btn-cancel" onclick="removeFromCart(${index})">Eliminar</button>
            </div>
        </div>
    `).join('');
    
    document.getElementById('modal-checkout').style.display = 'flex';
}

function openExtrasModal(index) {
    currentExtraTargetIndex = index;
    const container = document.getElementById('extras-list');
    container.innerHTML = availableIngredients.map(ing => {
        const isSelected = cart[index].extras.some(e => e.id === ing.id);
        return `
            <div class="extra-option ${isSelected ? 'selected' : ''}" onclick="toggleExtra(${ing.id}, '${ing.name}', ${ing.price_usd})">
                ${ing.name} (+$${ing.price_usd})
            </div>
        `;
    }).join('');
    document.getElementById('modal-extras').style.display = 'flex';
}

function toggleExtra(id, name, price) {
    const item = cart[currentExtraTargetIndex];
    const exists = item.extras.findIndex(e => e.id === id);
    if (exists > -1) {
        item.extras.splice(exists, 1);
    } else {
        item.extras.push({ id, name, price });
    }
    openExtrasModal(currentExtraTargetIndex); // Refresh
    updateCartUI();
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
    if (cart.length === 0) closeModal('modal-checkout');
    else openCheckoutModal();
}

async function confirmOrder() {
    const obs = document.getElementById('order-observations').value;
    const type = document.getElementById('order-type').value;
    const cust_name = document.getElementById('cust-name').value || 'Cliente Genérico';
    const cust_phone = document.getElementById('cust-phone').value;
    const cust_cedula = document.getElementById('cust-cedula').value;
    const total = calculateTotal();
    
    // Primero guardar/actualizar cliente si hay cédula
    if (cust_cedula) {
        await fetch('api.php?action=save_customer', {
            method: 'POST',
            body: JSON.stringify({ name: cust_name, cedula: cust_cedula, phone: cust_phone })
        });
    }

    const data = {
        id: currentEditingOrderId,
        customer_name: cust_name,
        customer_phone: cust_phone,
        order_type: type,
        total_usd: total,
        observations: obs,
        items: cart.map(i => ({
            id: i.id,
            name: i.name,
            price: i.basePrice,
            quantity: i.quantity,
            extras: i.extras
        }))
    };

    const action = currentEditingOrderId ? 'update_order' : 'create_order';
    const res = await fetch(`api.php?action=${action}`, {
        method: 'POST',
        body: JSON.stringify(data)
    });

    const result = await res.json();
    if (result.success) {
        alert(currentEditingOrderId ? "Orden actualizada" : "Pedido enviado");
        cart = [];
        currentEditingOrderId = null;
        document.getElementById('order-observations').value = '';
        updateCartUI();
        closeModal('modal-checkout');
        if (currentSection === 'cocina') loadKitchenOrders();
    }
}

async function loadKitchenOrders() {
    const res = await fetch('api.php?action=get_orders');
    const orders = await res.json();
    const kitchenOrders = orders.filter(o => o.status === 'pendiente' || o.status === 'preparando');
    
    // Detectar nueva orden
    if (kitchenOrders.length > 0) {
        const maxId = Math.max(...kitchenOrders.map(o => o.id));
        if (lastKnownOrderId !== 0 && maxId > lastKnownOrderId) {
            showNotification("🔔 ¡Nuevo Pedido Recibido!");
            playNotificationSound();
        }
        lastKnownOrderId = maxId;
    }

    const container = document.getElementById('kitchen-container');
    container.innerHTML = kitchenOrders.map(o => `
        <div class="order-card ${o.status === 'preparando' ? 'preparing' : ''}">
            <div class="order-header">
                <strong>#${o.id} - ${o.customer_name}</strong>
                <span>${o.status.toUpperCase()}</span>
            </div>
            <div class="order-details">
                ${o.items.map(i => `
                    <div>• ${i.name} ${i.ingredients.length ? `(${i.ingredients.map(ing => ing.name).join(', ')})` : ''}</div>
                `).join('')}
            </div>
            ${o.observations ? `<p class="obs">Nota: ${o.observations}</p>` : ''}
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button class="btn-status" onclick="updateOrderStatus(${o.id}, '${o.status === 'pendiente' ? 'preparando' : 'listo'}')">
                    ${o.status === 'pendiente' ? 'Empezar' : 'Listo'}
                </button>
                <button class="btn-small" onclick="editExistingOrder(${JSON.stringify(o).replace(/"/g, '&quot;')})">Editar</button>
            </div>
        </div>
    `).join('');
}

function editExistingOrder(order) {
    currentEditingOrderId = order.id;
    cart = order.items.map(i => ({
        id: i.product_id,
        name: i.name,
        basePrice: parseFloat(i.price_at_time),
        quantity: i.quantity,
        extras: i.ingredients.map(ing => ({ id: ing.ingredient_id, name: ing.name, price: ing.price_at_time }))
    }));
    document.getElementById('order-observations').value = order.observations || '';
    document.getElementById('order-type').value = order.order_type || 'comer_aqui';
    document.getElementById('cust-name').value = order.customer_name || '';
    document.getElementById('cust-phone').value = order.customer_phone || '';
    document.getElementById('cust-cedula').value = order.customer_cedula || '';
    
    updateCartUI();
    showSection('pedidos');
    openCheckoutModal();
}

async function searchCustomerByCedula() {
    const cedula = document.getElementById('cust-cedula').value;
    if (!cedula) return;
    
    const btn = event.target;
    btn.innerText = '...';
    
    try {
        const res = await fetch(`api.php?action=search_cedula&cedula=${cedula}`);
        const data = await res.json();
        if (data && data.name) {
            document.getElementById('cust-name').value = data.name;
            document.getElementById('cust-phone').value = data.phone || '';
        } else {
            alert("Cliente no encontrado, puedes registrarlo manualmente.");
        }
    } catch (e) {
        console.error(e);
    } finally {
        btn.innerText = '🔍';
    }
}

// Funciones de navegación y modales
function showSection(id) {
    currentSection = id;
    document.querySelectorAll('.view-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
    
    document.getElementById(id).classList.add('active');
    document.getElementById('nav-' + id).classList.add('active');

    if (id === 'pedidos') loadProducts();
    if (id === 'cocina') loadKitchenOrders();
    if (id === 'caja') loadPaymentOrders();
    if (id === 'super') { loadBusinesses(); loadUsers(); }
}

async function loadBusinesses() {
    const res = await fetch('api.php?action=get_businesses');
    const businesses = await res.json();
    document.getElementById('super-business-list').innerHTML = businesses.map(b => `
        <div class="admin-item">
            <span>${b.name} ${!b.active ? '(Inactivo)' : ''}</span>
            <button onclick="editBusiness(${JSON.stringify(b).replace(/"/g, '&quot;')})">Editar</button>
        </div>
    `).join('');
}

async function loadUsers() {
    const res = await fetch('api.php?action=get_users');
    const users = await res.json();
    document.getElementById('super-users-list').innerHTML = users.map(u => `
        <div class="admin-item">
            <span>${u.name} (V-${u.cedula})</span>
            <button onclick="editUser(${JSON.stringify(u).replace(/"/g, '&quot;')})">Editar</button>
        </div>
    `).join('');
}

function openUserModal(user = null) {
    document.getElementById('edit-user-id').value = user ? user.id : '';
    document.getElementById('user-cedula').value = user ? user.cedula : '';
    document.getElementById('user-name').value = user ? user.name : '';
    document.getElementById('user-phone').value = user ? user.phone : '';
    document.getElementById('user-pass').value = '';
    document.getElementById('modal-user').style.display = 'flex';
}

async function saveUser() {
    const data = {
        id: document.getElementById('edit-user-id').value || undefined,
        cedula: document.getElementById('user-cedula').value,
        name: document.getElementById('user-name').value,
        phone: document.getElementById('user-phone').value,
        password: document.getElementById('user-pass').value
    };
    await fetch('api.php?action=save_user', { method: 'POST', body: JSON.stringify(data) });
    closeModal('modal-user');
    loadUsers();
}

async function searchUserByCedula() {
    const cedula = document.getElementById('user-cedula').value;
    if (!cedula) return;
    
    const btn = event.target;
    const oldText = btn.innerText;
    btn.innerText = '...';
    
    try {
        const res = await fetch(`api.php?action=search_cedula&cedula=${cedula}`);
        const data = await res.json();
        if (data && data.p_apellido) {
            const fullName = `${data.p_nombre} ${data.s_nombre || ''} ${data.p_apellido} ${data.s_apellido || ''}`.replace(/\s+/g, ' ').trim();
            document.getElementById('user-name').value = fullName;
        } else {
            alert("No se encontraron datos para esta cédula");
        }
    } catch (e) {
        alert("Error al consultar la API");
    } finally {
        btn.innerText = oldText;
    }
}

async function logout() {
    await fetch('auth.php?action=logout');
    window.location.href = 'index.html';
}

function showNotification(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

function playNotificationSound() {
    // Sonido sutil para avisar a cocina
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    audio.play().catch(e => console.log("Auto-play blocked"));
}

// --- CRUD Admin (Simplificado para el ejemplo) ---
function openProductModal(prod = null) {
    document.getElementById('product-modal-title').innerText = prod ? 'Editar Producto' : 'Nuevo Producto';
    document.getElementById('edit-product-id').value = prod ? prod.id : '';
    document.getElementById('prod-name').value = prod ? prod.name : '';
    document.getElementById('prod-desc').value = prod ? prod.description : '';
    document.getElementById('prod-price').value = prod ? prod.price_usd : '';
    document.getElementById('prod-cat').value = prod ? prod.category : '';
    document.getElementById('prod-img').value = prod ? prod.image_url : '';
    document.getElementById('modal-product').style.display = 'flex';
}

async function saveProduct() {
    const data = {
        id: document.getElementById('edit-product-id').value || undefined,
        name: document.getElementById('prod-name').value,
        description: document.getElementById('prod-desc').value,
        price_usd: document.getElementById('prod-price').value,
        category: document.getElementById('prod-cat').value,
        image_url: document.getElementById('prod-img').value
    };
    await fetch('api.php?action=save_product', { method: 'POST', body: JSON.stringify(data) });
    closeModal('modal-product');
    loadProducts();
}

// Fallback para tasa si falla api
async function updateExchangeRate() {
    try {
        const res = await fetch('api.php?action=get_exchange_rate');
        const data = await res.json();
        exchangeRate = data.rate;
    } catch(e) { exchangeRate = 36.5; }
}
