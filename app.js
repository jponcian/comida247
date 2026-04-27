let cart = [];
let availableIngredients = [];
let exchangeRate = 36.50;
let currentSection = 'pedidos';
let userRole = '';
let currentEditingOrderId = null;
let currentExtraTargetIndex = null;
let standbyOrders = JSON.parse(localStorage.getItem('standbyOrders') || '[]');
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
    updateStandbyUI();
    setInterval(refreshData, 5000);


    // Cerrar modales al hacer clic fuera del contenido
    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            closeModal(event.target.id);
        }
    };
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
        extras: [],
        observations: ''
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
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="flex: 1;">
                    <strong>${item.name}</strong>
                    ${(item.extras.length || item.observations) ? `
                        <div style="font-size: 0.75rem; color: var(--text-muted); font-style: italic; margin-top: 2px;">
                            (${[...item.extras.map(e => e.name), item.observations].filter(Boolean).join(', ')})
                        </div>
                    ` : ''}
                </div>
                <div style="text-align: right; display: flex; align-items: center; gap: 0.8rem;">
                    <span style="font-weight: 800; font-size: 0.9rem;">$${item.basePrice.toFixed(2)}</span>
                    <div style="display: flex; gap: 0.3rem;">
                        <button class="btn-icon ${item.observations ? 'active' : ''}" onclick="toggleNote(${index})">📝</button>
                        <button class="btn-icon" onclick="openExtrasModal(${index})">✨</button>
                        <button class="btn-icon" onclick="removeFromCart(${index})" style="color: var(--danger);">🗑️</button>
                    </div>
                </div>
            </div>
            <div id="note-container-${index}" class="note-expandable">
                <input type="text" placeholder="Nota para la cocina..." 
                    value="${item.observations}" 
                    style="font-size: 0.85rem;"
                    oninput="updateItemObservation(${index}, this.value)">
            </div>
        </div>
    `).join('');
    
    document.getElementById('modal-checkout').style.display = 'flex';
}

function toggleNote(index) {
    const container = document.getElementById(`note-container-${index}`);
    const isExpanded = container.classList.toggle('expanded');
    // Actualizar estado visual del botón
    const btn = document.querySelectorAll('.checkout-item')[index].querySelector('.btn-icon');
    btn.classList.toggle('active', isExpanded);
    
    if (isExpanded) {
        container.querySelector('input').focus();
    }
}


function updateItemObservation(index, value) {
    cart[index].observations = value;
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
    const btn = document.getElementById('btn-confirm-order');
    const oldContent = btn.innerHTML;
    
    const obs = document.getElementById('order-observations').value;
    const type = document.getElementById('order-type').value;
    const cust_name = document.getElementById('cust-name').value || 'Cliente Genérico';
    const cust_phone = document.getElementById('cust-phone').value;
    const cust_cedula = document.getElementById('cust-cedula').value;
    const total = calculateTotal();
    
    if (cart.length === 0) {
        alert("El carrito está vacío");
        return;
    }

    btn.innerHTML = '⌛ Enviando...';
    btn.disabled = true;

    try {
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
                extras: i.extras,
                observations: i.observations
            }))
        };

        const action = currentEditingOrderId ? 'update_order' : 'create_order';
        const res = await fetch(`api.php?action=${action}`, {
            method: 'POST',
            body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.success) {
            Swal.fire({
                title: currentEditingOrderId ? '¡Actualizado!' : '¡Enviado!',
                text: currentEditingOrderId ? 'La orden ha sido modificada.' : 'El pedido ya está en cocina.',
                icon: 'success',
                background: 'var(--bg)',
                color: 'var(--text)',
                confirmButtonColor: 'var(--primary)'
            });
            cart = [];
            currentEditingOrderId = null;
            document.getElementById('order-observations').value = '';
            updateCartUI();
            closeModal('modal-checkout');
            if (currentSection === 'cocina') loadKitchenOrders();
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.error || 'No se pudo procesar el pedido',
                background: 'var(--bg)',
                color: 'var(--text)'
            });
        }

    } catch (e) {
        console.error(e);
        alert("Error de conexión al enviar el pedido");
    } finally {
        btn.innerHTML = oldContent;
        btn.disabled = false;
    }
}

function parkOrder() {
    if (cart.length === 0) return;
    
    const orderData = {
        cart: [...cart],
        customer: {
            name: document.getElementById('cust-name').value,
            phone: document.getElementById('cust-phone').value,
            cedula: document.getElementById('cust-cedula').value,
            type: document.getElementById('order-type').value,
            observations: document.getElementById('order-observations').value
        },
        timestamp: new RegExp().toString(), // Using a hack to avoid complex Date formatting for now or just Date.now()
        id: Date.now()
    };
    
    standbyOrders.push(orderData);
    saveStandby();
    
    // Resetear todo
    cart = [];
    resetCheckoutForm();
    updateCartUI();
    closeModal('modal-checkout');
    showNotification("📦 Pedido puesto en espera");
    updateStandbyUI();
}

function resetCheckoutForm() {
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('cust-cedula').value = '';
    document.getElementById('order-type').value = 'comer_aqui';
    document.getElementById('order-observations').value = '';
}

function saveStandby() {
    localStorage.setItem('standbyOrders', JSON.stringify(standbyOrders));
}

function updateStandbyUI() {
    const btn = document.getElementById('btn-standby-list');
    if (standbyOrders.length > 0) {
        btn.style.display = 'flex';
        btn.innerHTML = `⏳ <span>${standbyOrders.length}</span>`;
    } else {
        btn.style.display = 'none';
    }
}

function openStandbyModal() {
    const container = document.getElementById('standby-list');
    container.innerHTML = standbyOrders.map((o, index) => `
        <div class="standby-item">
            <div>
                <strong>${o.customer.name || 'Cliente sin nombre'}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">
                    ${o.cart.length} productos - $${o.cart.reduce((s, i) => s + i.basePrice, 0).toFixed(2)}
                </div>
            </div>
            <div style="display: flex; gap: 0.5rem;">
                <button class="btn-small btn-primary" onclick="resumeOrder(${index})">🔄 Reanudar</button>
                <button class="btn-small btn-cancel" onclick="deleteStandby(${index})">🗑️</button>
            </div>
        </div>
    `).join('');
    document.getElementById('modal-standby').style.display = 'flex';
}

async function resumeOrder(index) {
    const order = standbyOrders[index];
    if (cart.length > 0) {
        const result = await Swal.fire({
            title: '¿Reemplazar carrito?',
            text: 'Ya tienes productos en el carrito. ¿Deseas reemplazarlos con el pedido en espera?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
            cancelButtonColor: 'var(--danger)',
            confirmButtonText: 'Sí, reemplazar',
            cancelButtonText: 'Cancelar',
            background: 'var(--bg)',
            color: 'var(--text)'
        });
        if (!result.isConfirmed) return;
    }

    
    cart = order.cart;
    document.getElementById('cust-name').value = order.customer.name;
    document.getElementById('cust-phone').value = order.customer.phone;
    document.getElementById('cust-cedula').value = order.customer.cedula;
    document.getElementById('order-type').value = order.customer.type;
    document.getElementById('order-observations').value = order.customer.observations;
    
    standbyOrders.splice(index, 1);
    saveStandby();
    updateCartUI();
    updateStandbyUI();
    closeModal('modal-standby');
    openCheckoutModal();
}

function deleteStandby(index) {
    Swal.fire({
        title: '¿Eliminar espera?',
        text: '¿Estás seguro de eliminar este pedido en espera?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--danger)',
        confirmButtonText: 'Sí, eliminar',
        background: 'var(--bg)',
        color: 'var(--text)'
    }).then((result) => {
        if (result.isConfirmed) {
            standbyOrders.splice(index, 1);
            saveStandby();
            updateStandbyUI();
            openStandbyModal();
        }
    });
}



async function loadKitchenOrders() {
    const res = await fetch('api.php?action=get_orders');
    const orders = await res.json();
    // Solo mostrar pendientes y preparando en cocina
    const kitchenOrders = orders.filter(o => o.status === 'pendiente' || o.status === 'preparando');
    
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
                <span class="badge ${o.status}">${o.status.toUpperCase()}</span>
            </div>
            <div class="order-details">
                ${o.items.map(i => `
                    <div style="margin-bottom: 0.3rem;">
                        <strong>• ${i.name}</strong> 
                        ${i.ingredients.length ? `<span class="extras-preview">(${i.ingredients.map(ing => ing.name).join(', ')})</span>` : ''}
                        ${i.observations ? `<div style="margin-left: 1rem; font-size: 0.9rem; color: var(--accent); font-style: italic;">↳ ${i.observations}</div>` : ''}
                    </div>
                `).join('')}
            </div>
            ${o.observations ? `<p class="obs">Nota: ${o.observations}</p>` : ''}
            <div style="margin-top: 1rem;">
                <button class="btn-status" onclick="updateOrderStatus(${o.id}, '${o.status === 'pendiente' ? 'preparando' : 'listo'}')">
                    ${o.status === 'pendiente' ? '👩‍🍳 Empezar' : '✅ Listo'}
                </button>
            </div>
        </div>
    `).join('');
}

async function updateOrderStatus(id, status) {
    if (status === 'listo') {
        const result = await Swal.fire({
            title: '¿Pedido terminado?',
            text: `¿Estás seguro de marcar la orden #${id} como LISTA?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: 'var(--primary)',
            cancelButtonColor: 'var(--danger)',
            confirmButtonText: 'Sí, ¡Listo!',
            cancelButtonText: 'Cancelar',
            background: 'var(--bg)',
            color: 'var(--text)'
        });
        
        if (!result.isConfirmed) return;
    }

    const res = await fetch('api.php?action=update_status', {
        method: 'POST',
        body: JSON.stringify({ id, status })
    });
    const result = await res.json();
    if (result.success) {
        if (status === 'listo') {
            Swal.fire({
                title: '¡Buen trabajo!',
                text: 'El pedido ha pasado a caja.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
                background: 'var(--bg)',
                color: 'var(--text)'
            });
        } else {
            showNotification(`Orden #${id} actualizada`);
        }
        
        if (currentSection === 'cocina') loadKitchenOrders();
        if (currentSection === 'caja') loadPaymentOrders();
    }
}

async function loadPaymentOrders() {
    const res = await fetch('api.php?action=get_orders');
    const orders = await res.json();
    const container = document.getElementById('payment-container');
    
    // En caja mostramos todo lo que no esté cobrado
    container.innerHTML = orders.map(o => {
        let actionBtn = '';
        if (o.status === 'listo') {
            if (o.order_type === 'llevar_delivery') {
                actionBtn = `<button class="btn-small btn-primary" onclick="updateOrderStatus(${o.id}, 'despachado')">🛵 Despachar</button>`;
            } else if (o.order_type === 'llevar_retiro') {
                actionBtn = `<button class="btn-small btn-primary" onclick="updateOrderStatus(${o.id}, 'despachado')">🥡 Entregar</button>`;
            }
        }

        return `
            <div class="order-card">
                <div class="order-header">
                    <strong>#${o.id} - ${o.customer_name}</strong>
                    <span class="badge ${o.status}">${o.status.toUpperCase()}</span>
                </div>
                <div class="order-details">
                    <div style="margin-bottom:0.5rem">Tipo: <strong>${formatOrderType(o.order_type)}</strong></div>
                    <div style="font-size: 1.5rem; color: var(--secondary); font-weight: 800;">
                        Total: $${parseFloat(o.total_usd).toFixed(2)}
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem;">
                    <button class="btn-confirm" onclick="processPayment(${o.id}, '${o.order_type}')">💵 Pagar</button>
                    <button class="btn-small" onclick="editExistingOrder(${JSON.stringify(o).replace(/"/g, '&quot;')})">✏️ Editar</button>
                    ${actionBtn}
                </div>
            </div>
        `;
    }).join('');
}

function formatOrderType(type) {
    const types = { 'comer_aqui': '🍽️ Comer Aquí', 'llevar_retiro': '🥡 Retiro', 'llevar_delivery': '🛵 Delivery' };
    return types[type] || type;
}

async function processPayment(id, type) {
    const result = await Swal.fire({
        title: 'Confirmar Pago',
        text: `¿Deseas procesar el pago de la orden #${id}?`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: 'var(--success)',
        cancelButtonColor: 'var(--danger)',
        confirmButtonText: 'Sí, Pagar',
        cancelButtonText: 'Cancelar',
        background: 'var(--bg)',
        color: 'var(--text)'
    });

    if (!result.isConfirmed) return;
    
    const newStatus = (type === 'comer_aqui') ? 'cobrado' : undefined;
    
    const res = await fetch('api.php?action=process_payment', {
        method: 'POST',
        body: JSON.stringify({ id, status: newStatus })
    });
    
    if ((await res.json()).success) {
        Swal.fire({
            title: '¡Pagado!',
            text: 'El pago ha sido registrado.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            background: 'var(--bg)',
            color: 'var(--text)'
        });
        loadPaymentOrders();
    }
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
    const cedulaInput = document.getElementById('cust-cedula');
    const nameInput = document.getElementById('cust-name');
    const phoneInput = document.getElementById('cust-phone');
    const cedula = cedulaInput.value.replace(/\D/g, ''); // Limpiar para la búsqueda
    
    if (cedula.length < 6) return;
    
    const btn = document.querySelector('button[onclick="searchCustomerByCedula()"]');
    
    // Bloquear inputs y mostrar estado de carga
    if (btn) btn.innerHTML = '⏳';
    nameInput.readOnly = true;
    nameInput.value = 'Validando...';
    nameInput.classList.add('loading-input');
    
    try {
        const res = await fetch(`api.php?action=search_cedula&cedula=${cedula}`);
        const data = await res.json();
        
        if (data && data.name) {
            nameInput.value = data.name;
            phoneInput.value = data.phone || '';
            nameInput.readOnly = true;
            phoneInput.focus();
        } else {
            nameInput.value = '';
            nameInput.readOnly = false;
            nameInput.placeholder = "Nombre no encontrado, ingresar manual...";
            nameInput.focus();
        }
    } catch (e) {
        console.error(e);
        nameInput.value = '';
        nameInput.readOnly = false;
        nameInput.focus();
    } finally {
        if (btn) btn.innerHTML = '🔍';
        nameInput.classList.remove('loading-input');
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
    Swal.fire({
        title: '¡Guardado!',
        text: 'El usuario ha sido actualizado.',
        icon: 'success',
        background: 'var(--bg)',
        color: 'var(--text)'
    });
    closeModal('modal-user');
    loadUsers();
}


async function searchUserByCedula() {
    const cedulaInput = document.getElementById('user-cedula');
    const nameInput = document.getElementById('user-name');
    const cedula = cedulaInput.value;
    if (!cedula) return;
    
    const btn = event.currentTarget;
    const oldBtnContent = btn.innerHTML;
    
    btn.innerHTML = '⏳';
    btn.disabled = true;
    nameInput.readOnly = true;
    nameInput.classList.add('loading-input');
    
    try {
        const res = await fetch(`api.php?action=search_cedula&cedula=${cedula}`);
        const data = await res.json();
        
        if (data && data.name) {
            nameInput.value = data.name;
            nameInput.readOnly = true;
            document.getElementById('user-phone').focus();
        } else {
            nameInput.value = '';
            nameInput.readOnly = false;
            nameInput.placeholder = "Nombre no encontrado...";
            nameInput.focus();
        }
    } catch (e) {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo consultar la API de Cédula.',
            background: 'var(--bg)',
            color: 'var(--text)'
        });
        nameInput.readOnly = false;
    } finally {

        btn.innerHTML = '🔍';
        btn.disabled = false;
        nameInput.classList.remove('loading-input');
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
    Swal.fire({
        title: '¡Guardado!',
        text: 'El producto ha sido actualizado.',
        icon: 'success',
        background: 'var(--bg)',
        color: 'var(--text)'
    });
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

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}
