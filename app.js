let cart = [];
let availableIngredients = [];
let exchangeRate = 36.50;
let currentSection = 'pedidos';
let userRole = '';
let currentEditingOrderId = null;
let currentExtraTargetIndex = null;
let standbyOrders = JSON.parse(localStorage.getItem('standbyOrders') || '[]');
let lastKnownOrderId = 0;
let allProducts = [];


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
        document.getElementById('nav-historial').style.display = 'block';
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
    allProducts = await res.json();
    const container = document.getElementById('menu-container');
    
    if (currentSection === 'pedidos') {
        container.innerHTML = allProducts.map(p => `
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
        document.getElementById('admin-products-list').innerHTML = allProducts.map(p => `
            <div class="admin-item">
                <span>${p.name} ($${p.price_usd})</span>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="editProduct(${p.id})">Editar</button>
                    <button style="background: var(--danger-glass); color: var(--danger); border-color: var(--danger);" onclick="deleteProduct(${p.id})">🗑️</button>
                </div>
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
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="editIngredient(${i.id})">Editar</button>
                    <button style="background: var(--danger-glass); color: var(--danger); border-color: var(--danger);" onclick="deleteIngredient(${i.id})">🗑️</button>
                </div>
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
    toggleTableInput(); // Asegurar estado correcto del input de mesa
    
    // Ocultar observaciones si están vacías
    const obs = document.getElementById('order-observations').value;
    if (!obs) {
        document.getElementById('obs-container').style.display = 'none';
        document.getElementById('btn-add-obs').style.display = 'block';
    } else {
        document.getElementById('obs-container').style.display = 'block';
        document.getElementById('btn-add-obs').style.display = 'none';
    }
}

function toggleGeneralObservations() {
    const container = document.getElementById('obs-container');
    const btn = document.getElementById('btn-add-obs');
    container.style.display = 'block';
    btn.style.display = 'none';
    container.querySelector('textarea').focus();
}

async function toggleTableInput() {
    const type = document.getElementById('order-type').value;
    const group = document.getElementById('table-input-group');
    if (type === 'comer_aqui') {
        group.style.display = 'block';
        
        // Cargar mesas dinámicamente
        const res = await fetch('api.php?action=get_tables');
        const tables = await res.json();
        const select = document.getElementById('order-table');
        if (tables.length > 0) {
            select.innerHTML = tables.map(t => `<option value="${t.name}">📍 ${t.name}</option>`).join('');
        } else {
            select.innerHTML = `<option value="">⚠️ No hay mesas registradas</option>`;
        }
    } else {
        group.style.display = 'none';
        document.getElementById('order-table').value = '';
    }
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
    const table = document.getElementById('order-table').value;
    const cust_name = document.getElementById('cust-name').value || 'Cliente Genérico';
    const cust_phone = document.getElementById('cust-phone').value;
    const cust_cedula = document.getElementById('cust-cedula').value;
    const total = calculateTotal();
    
    if (type === 'comer_aqui' && !table) {
        Swal.fire({
            icon: 'warning',
            title: 'Mesa requerida',
            text: 'Por favor, indica el número de mesa para comer aquí.',
            background: 'var(--bg)',
            color: 'var(--text)'
        });
        return;
    }

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
            table_number: table,
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
            resetCheckoutForm();
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
            table_number: document.getElementById('order-table').value,
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
    document.getElementById('order-table').value = order.customer.table_number || '';
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

    updateNavBadges(orders);

    const container = document.getElementById('kitchen-container');
    container.innerHTML = kitchenOrders.map(o => {
        const groupedItems = getGroupedItems(o.items);

        const isPaid = parseInt(o.is_paid) === 1;
        return `
            <div class="order-card ${o.status === 'preparando' ? 'preparing' : ''} ${o.status === 'listo' ? 'ready' : ''}">
                <div class="order-header">
                    <div>
                        <strong>#${o.id} - ${o.customer_name}</strong>
                        ${o.table_number ? `<div style="font-size: 0.9rem; color: var(--primary);">📍 Mesa: ${o.table_number}</div>` : ''}
                    </div>
                    <div style="display: flex; gap: 0.3rem;">
                        ${isPaid ? '<span class="paid-badge">Pagado</span>' : ''}
                        <span class="badge ${o.status}">${o.status.toUpperCase()}</span>
                    </div>
                </div>
                <div class="order-details">
                    ${groupedItems.map(i => `
                        <div style="margin-bottom: 0.3rem;">
                            <strong>${i.quantity > 1 ? `<span style="color: var(--secondary); font-size: 1.1rem;">${i.quantity} x </span>` : '• '}${i.name}</strong> 
                            ${i.ingredients.length ? `<span class="extras-preview">(${i.ingredients.map(ing => ing.name).join(', ')})</span>` : ''}
                            ${i.observations ? `<div style="margin-left: 1rem; font-size: 0.9rem; color: var(--accent); font-style: italic;">↳ ${i.observations}</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                ${o.observations ? `<p class="obs">Nota: ${o.observations}</p>` : ''}
                <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                    <button class="btn-status" style="flex: 2;" onclick="updateOrderStatus(${o.id}, '${o.status === 'pendiente' ? 'preparando' : 'listo'}')">
                        ${o.status === 'pendiente' ? '👩‍🍳 Empezar' : '✅ Listo'}
                    </button>
                    <button class="btn-small" style="flex: 1;" onclick="editExistingOrder(${JSON.stringify(o).replace(/"/g, '&quot;')})">✏️ Editar</button>
                </div>
            </div>
        `;
    }).join('');
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
    
    // Filtrar: si está listo y pagado, no mostrar en caja
    const activeOrders = orders.filter(o => !(o.status === 'listo' && parseInt(o.is_paid) === 1) && o.status !== 'cobrado');
    
    // Actualizar Badge Nav
    updateNavBadges(orders);

    if (activeOrders.length === 0) {
        container.innerHTML = '<div class="empty-state">No hay pedidos pendientes de cobro</div>';
        return;
    }

    container.innerHTML = activeOrders.map(o => {
        const isPaid = parseInt(o.is_paid) === 1;
        let actionBtn = '';
        if (o.status === 'listo') {
            if (o.order_type === 'llevar_delivery') {
                actionBtn = `<button class="btn-small" style="background: var(--primary); color: white;" onclick="updateOrderStatus(${o.id}, 'despachado')">🛵 Despachar</button>`;
            } else if (o.order_type === 'llevar_retiro') {
                actionBtn = `<button class="btn-small" style="background: var(--primary); color: white;" onclick="updateOrderStatus(${o.id}, 'despachado')">🥡 Entregar</button>`;
            }
        }

        const groupedItems = getGroupedItems(o.items);
        const itemsHtml = groupedItems.map(i => `
            <div style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 2px;">
                • ${i.quantity}x ${i.name}
            </div>
        `).join('');

        return `
            <div class="order-card ${o.status === 'listo' ? 'ready-payment' : ''}">
                <div class="order-header" style="flex-wrap: wrap; gap: 0.8rem; align-items: center;">
                    <strong style="flex: 1; min-width: 200px; font-size: 1.1rem;">#${o.id} - ${o.customer_name}</strong>
                    <div style="display: flex; gap: 0.6rem; align-items: center; justify-content: flex-end; margin-left: auto;">
                        ${!(isPaid && (o.status === 'listo' || o.status === 'cobrado')) ? 
                            `<button class="btn-icon" onclick="confirmDeleteOrder(${o.id})" title="Eliminar Orden" style="color: var(--danger); font-size: 1.1rem; background: rgba(255, 77, 109, 0.1); width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; border: 1px solid rgba(255,77,109,0.2);">🗑️</button>` 
                            : ''
                        }

                        <div style="display: flex; gap: 0.4rem; align-items: center;">
                            ${isPaid ? '<span class="paid-badge">Pagado</span>' : ''}
                            <span class="badge ${o.status}" style="padding: 4px 10px; border-radius: 8px;">${o.status.toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                <div class="order-details">
                    <div style="margin-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                        ${itemsHtml}
                    </div>
                    <div style="margin-bottom:0.5rem">Tipo: <strong>${formatOrderType(o.order_type)}</strong> ${o.table_number ? `(Mesa: ${o.table_number})` : ''}</div>
                    <div style="font-size: 1.5rem; color: var(--secondary); font-weight: 800;">
                        Total: $${parseFloat(o.total_usd).toFixed(2)}
                    </div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem;">
                    <button class="btn-pay" ${isPaid ? 'disabled style="background: var(--success); color: white; box-shadow: none; opacity: 0.9; cursor: default;"' : ''} onclick="processPayment(${o.id}, '${o.order_type}')">
                        ${isPaid ? '✅ Pagado' : '💵 Pagar'}
                    </button>

                    ${actionBtn || `<button class="btn-small" onclick="editExistingOrder(${JSON.stringify(o).replace(/"/g, '&quot;')})">✏️ Editar</button>`}
                </div>
            </div>
        `;
    }).join('');
}

function formatOrderType(type) {
    const types = { 'comer_aqui': '🍽️ Comer Aquí', 'llevar_retiro': '🥡 Retiro', 'llevar_delivery': '🛵 Delivery' };
    return types[type] || type;
}

function getGroupedItems(items) {
    const grouped = [];
    items.forEach(item => {
        const itemKey = JSON.stringify({
            id: item.product_id,
            obs: item.observations,
            extras: item.ingredients.map(ing => ing.ingredient_id).sort()
        });
        
        const existing = grouped.find(gi => gi.key === itemKey);
        if (existing) {
            existing.quantity += parseInt(item.quantity || 1);
        } else {
            grouped.push({
                key: itemKey,
                name: item.name,
                quantity: parseInt(item.quantity || 1),
                ingredients: item.ingredients,
                observations: item.observations
            });
        }
    });
    return grouped;
}

let currentPaymentOrderId = null;
let currentPaymentTotal = 0;
let addedPayments = [];

async function processPayment(id, type) {
    const res = await fetch('api.php?action=get_orders');
    const orders = await res.json();
    const order = orders.find(o => o.id == id);
    if (!order) return;

    currentPaymentOrderId = id;
    currentPaymentTotal = parseFloat(order.total_usd);
    
    // Cargar abonos existentes desde la base de datos para que no se pierdan al refrescar
    const payRes = await fetch(`api.php?action=get_payments&order_id=${id}`);
    const dbPayments = await payRes.json();
    
    addedPayments = dbPayments.map(p => ({
        id: p.id,
        amountOriginal: parseFloat(p.amount_original),
        currency: p.currency,
        method: p.method,
        amountUSD: parseFloat(p.amount_usd)
    }));

    document.getElementById('pay-total-usd').innerText = `$${currentPaymentTotal.toFixed(2)}`;
    document.getElementById('pay-total-bs').innerText = `Bs ${(currentPaymentTotal * exchangeRate).toFixed(2)}`;
    
    // Valores por defecto solicitados
    document.getElementById('pay-currency').value = 'VES';
    document.getElementById('pay-method').value = 'punto';
    updateDefaultPaymentAmount();

    updatePaymentList();
    document.getElementById('modal-payment').style.display = 'flex';
}


function updateDefaultPaymentAmount() {
    const currency = document.getElementById('pay-currency').value;
    const amountInput = document.getElementById('pay-amount');
    
    // Calcular lo que falta por pagar
    const totalPaidUSD = addedPayments.reduce((s, p) => s + p.amountUSD, 0);
    const remainingUSD = currentPaymentTotal - totalPaidUSD;
    
    if (currency === 'VES') {
        amountInput.value = (remainingUSD * exchangeRate).toFixed(2);
    } else {
        amountInput.value = remainingUSD.toFixed(2);
    }
    updateConversionDisplay();
}


function formatMoneyInput(input) {
    let value = input.value.replace(/\D/g, '');
    if (value === '') {
        document.getElementById('pay-conversion').innerText = '';
        return;
    }
    
    let floatValue = parseFloat(value) / 100;
    input.value = floatValue.toFixed(2);
    updateConversionDisplay();
}

function updateConversionDisplay() {
    const amount = parseFloat(document.getElementById('pay-amount').value) || 0;
    const currency = document.getElementById('pay-currency').value;
    const conversionEl = document.getElementById('pay-conversion');
    
    if (amount <= 0) {
        conversionEl.innerText = '';
        return;
    }

    if (currency === 'VES') {
        const usd = amount / exchangeRate;
        conversionEl.innerText = `≈ $ ${usd.toFixed(2)} USD`;
    } else {
        const ves = amount * exchangeRate;
        conversionEl.innerText = `≈ Bs ${ves.toFixed(2)} VES`;
    }
}


async function addPaymentRow() {
    const amountInput = document.getElementById('pay-amount');
    const amount = parseFloat(amountInput.value);
    const currency = document.getElementById('pay-currency').value;
    const method = document.getElementById('pay-method').value;

    if (!amount || amount <= 0) return;

    let finalAmount = amount;
    let finalCurrency = currency;
    let amountUSD = (currency === 'VES') ? amount / exchangeRate : amount;

    // Lógica: Si el método es de Bs (punto, pago_movil, efectivo) 
    // y el cajero puso el monto en USD como referencia, lo guardamos en Bs.
    if (method !== 'divisas' && currency === 'USD') {
        finalAmount = amount * exchangeRate;
        finalCurrency = 'VES';
    }

    // Guardar abono en la base de datos inmediatamente
    const res = await fetch('api.php?action=add_payment', {
        method: 'POST',
        body: JSON.stringify({
            order_id: currentPaymentOrderId,
            amount_original: finalAmount,
            currency: finalCurrency,
            method: method,
            amount_usd: amountUSD
        })
    });
    const result = await res.json();

    addedPayments.push({
        id: result.id,
        amountOriginal: finalAmount,
        currency: finalCurrency,
        method,
        amountUSD: amountUSD
    });

    amountInput.value = '';
    updatePaymentList();
    updateDefaultPaymentAmount();
}



function updatePaymentList() {
    const container = document.getElementById('payments-list');
    const balanceEl = document.getElementById('pay-remaining');
    const finishBtn = document.getElementById('btn-finish-payment');

    container.innerHTML = addedPayments.map((p, index) => `
        <div class="standby-item" style="padding: 0.5rem; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span>${getPaymentMethodEmoji(p.method)} ${p.amountOriginal.toFixed(2)} ${p.currency}</span>
            <button class="btn-icon" onclick="removePaymentRow(${index})" style="color: var(--danger); font-size: 0.8rem;">🗑️</button>
        </div>
    `).join('');

    const totalPaidUSD = addedPayments.reduce((s, p) => s + p.amountUSD, 0);
    let remaining = currentPaymentTotal - totalPaidUSD;
    
    // Evitar errores de precisión decimal (ej: -0.00000001)
    if (Math.abs(remaining) < 0.01) remaining = 0;

    balanceEl.innerText = `$${remaining.toFixed(2)}`;
    balanceEl.style.color = remaining <= 0 ? 'var(--success)' : 'var(--danger)';

    const balanceBsEl = document.getElementById('pay-remaining-bs');
    if (balanceBsEl) {
        balanceBsEl.innerText = `Bs ${(remaining * exchangeRate).toFixed(2)}`;
        balanceBsEl.style.color = remaining <= 0 ? 'var(--success)' : 'var(--primary)';
    }

    finishBtn.disabled = remaining > 0;
    if (remaining <= 0) {
        finishBtn.style.background = 'linear-gradient(135deg, var(--success), #00c853)';
    } else {
        finishBtn.style.background = '';
    }



}

async function removePaymentRow(index) {
    const payment = addedPayments[index];
    
    // Eliminar de la base de datos
    if (payment.id) {
        await fetch('api.php?action=delete_payment', {
            method: 'POST',
            body: JSON.stringify({ id: payment.id })
        });
    }

    addedPayments.splice(index, 1);
    updatePaymentList();
    updateDefaultPaymentAmount();
}


function getPaymentMethodEmoji(method) {
    const icons = { efectivo: '💵', punto: '💳', pago_movil: '📱', divisas: '💵' };
    return icons[method] || '💰';
}

async function finishPaymentProcess() {
    if (!currentPaymentOrderId) {
        Swal.fire({ title: 'Error', text: 'No se detectó el ID de la orden. Intenta cerrar y abrir el modal.', icon: 'error', background: 'var(--bg)', color: 'var(--text)' });
        return;
    }

    const btn = document.getElementById('btn-finish-payment');
    const originalContent = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '⌛ Procesando...';

    try {
        console.log("Enviando pago para orden:", currentPaymentOrderId, addedPayments);
        const res = await fetch('api.php?action=process_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: currentPaymentOrderId, 
                payments: addedPayments 
            })
        });
        
        const result = await res.json();
        if (result.success) {
            Swal.fire({
                title: '¡Pagado!',
                text: 'La orden ha sido marcada como pagada exitosamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false,
                background: 'var(--bg)',
                color: 'var(--text)'
            });
            closeModal('modal-payment');
            loadPaymentOrders();
        } else {
            throw new Error(result.error || 'Error desconocido en el servidor');
        }
    } catch (e) {
        console.error("Error al finalizar pago:", e);
        Swal.fire({
            title: 'Error al procesar',
            text: 'Hubo un problema al guardar el pago: ' + e.message,
            icon: 'error',
            background: 'var(--bg)',
            color: 'var(--text)'
        });
        btn.disabled = false;
        btn.innerHTML = originalContent;
    }
}




function editExistingOrder(order) {
    currentEditingOrderId = order.id;
    cart = order.items.map(i => ({
        id: i.product_id,
        name: i.name,
        basePrice: parseFloat(i.price_at_time),
        quantity: i.quantity,
        observations: i.observations || '',
        extras: i.ingredients.map(ing => ({ id: ing.ingredient_id, name: ing.name, price: ing.price_at_time }))
    }));
    const obs = order.observations || '';
    document.getElementById('order-observations').value = obs;
    
    if (obs) {
        document.getElementById('obs-container').style.display = 'block';
        document.getElementById('btn-add-obs').style.display = 'none';
    } else {
        document.getElementById('obs-container').style.display = 'none';
        document.getElementById('btn-add-obs').style.display = 'block';
    }

    document.getElementById('order-type').value = order.order_type || 'comer_aqui';
    document.getElementById('order-table').value = order.table_number || '';
    document.getElementById('cust-name').value = order.customer_name || '';
    document.getElementById('cust-phone').value = order.customer_phone || '';
    document.getElementById('cust-cedula').value = order.customer_cedula || '';
    
    toggleTableInput();
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
    if (id === 'historial') {
        document.getElementById('history-date').valueAsDate = new Date();
        loadHistory();
    }
    if (id === 'admin') { loadProducts(); loadIngredients(); loadTablesAdmin(); }
    if (id === 'super') { loadBusinesses(); loadUsers(); }
}

async function loadHistory() {
    const date = document.getElementById('history-date').value;
    const status = document.getElementById('history-status').value;
    const type = document.getElementById('history-type').value;
    const search = document.getElementById('history-search').value;
    
    const res = await fetch(`api.php?action=get_history&date=${date}&status=${status}&type=${type}&search=${search}`);
    const orders = await res.json();
    
    const container = document.getElementById('history-container');
    const summary = document.getElementById('history-summary');
    
    let totalUSD = 0;
    let count = orders.length;

    container.innerHTML = orders.map(o => {
        totalUSD += parseFloat(o.total_usd);
        const isReady = o.status === 'listo' || o.status === 'cobrado' || o.status === 'despachado';
        return `
            <div class="order-card ${isReady ? 'ready' : (o.status === 'preparando' ? 'preparing' : '')}">
                <div class="order-header">
                    <strong>#${o.id} - ${o.customer_name}</strong>
                    <span class="badge ${o.status}">${o.status.toUpperCase()}</span>
                </div>
                <div class="order-details">
                    <div style="font-size: 0.85rem; margin-bottom: 0.5rem;">
                        ${o.items.map(i => `• ${i.quantity}x ${i.name}`).join('<br>')}
                    </div>
                    <div style="font-weight: 800; color: var(--secondary);">Total: $${parseFloat(o.total_usd).toFixed(2)}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(o.created_at).toLocaleTimeString()}</div>
                </div>
            </div>
        `;
    }).join('');

    summary.innerHTML = `
        <div class="stat-card" style="background: var(--glass); padding: 1rem; border-radius: 15px; border: 1px solid var(--border);">
            <div style="font-size: 0.8rem; color: var(--text-muted);">Ventas Totales</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--primary);">$${totalUSD.toFixed(2)}</div>
        </div>
        <div class="stat-card" style="background: var(--glass); padding: 1rem; border-radius: 15px; border: 1px solid var(--border);">
            <div style="font-size: 0.8rem; color: var(--text-muted);">Cantidad de Pedidos</div>
            <div style="font-size: 1.5rem; font-weight: 800; color: var(--secondary);">${count}</div>
        </div>
    `;
}

async function loadTablesAdmin() {
    const res = await fetch('api.php?action=get_tables');
    const tables = await res.json();
    const container = document.getElementById('admin-tables-list');
    container.innerHTML = tables.map(t => `
        <div class="admin-item">
            <span>${t.name}</span>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="openTableModal(${JSON.stringify(t).replace(/"/g, '&quot;')})">Editar</button>
                <button style="background: var(--danger-glass); color: var(--danger); border-color: var(--danger);" onclick="deleteTable(${t.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

function openTableModal(table = null) {
    document.getElementById('table-modal-title').innerText = table ? 'Editar Mesa' : 'Nueva Mesa';
    document.getElementById('edit-table-id').value = table ? table.id : '';
    document.getElementById('table-name').value = table ? table.name : '';
    document.getElementById('modal-table').style.display = 'flex';
}

async function saveTable() {
    const id = document.getElementById('edit-table-id').value;
    const name = document.getElementById('table-name').value;
    
    if (!name) return;

    await fetch('api.php?action=save_table', {
        method: 'POST',
        body: JSON.stringify({ id: id || undefined, name })
    });
    
    closeModal('modal-table');
    loadTablesAdmin();
}

async function deleteTable(id) {
    const result = await Swal.fire({
        title: '¿Eliminar mesa?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--danger)',
        confirmButtonText: 'Sí, eliminar',
        background: 'var(--bg)',
        color: 'var(--text)'
    });

    if (result.isConfirmed) {
        await fetch('api.php?action=delete_table', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
        loadTablesAdmin();
    }
}

let allBusinesses = [];
let allUsers = [];

async function loadBusinesses() {
    const res = await fetch('api.php?action=get_businesses');
    allBusinesses = await res.json();
    document.getElementById('super-business-list').innerHTML = allBusinesses.map(b => `
        <div class="admin-item">
            <span>${b.name} ${parseInt(b.active) === 0 ? '<span style="color:var(--danger)">(Inactivo)</span>' : ''}</span>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editBusiness(${b.id})">Editar</button>
                <button style="background: var(--danger-glass); color: var(--danger); border-color: var(--danger);" onclick="deleteBusiness(${b.id})">🗑️</button>
            </div>
        </div>
    `).join('');
}

async function loadUsers() {
    const res = await fetch('api.php?action=get_users');
    allUsers = await res.json();
    document.getElementById('super-users-list').innerHTML = allUsers.map(u => `
        <div class="admin-item">
            <span>${u.name} (V-${u.cedula})</span>
            <div style="display: flex; gap: 0.5rem;">
                <button onclick="editUser(${u.id})">Editar</button>
                <button style="background: var(--danger-glass); color: var(--danger); border-color: var(--danger);" onclick="deleteUser(${u.id})">🗑️</button>
            </div>
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
    await fetch('api.php?action=save_user', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
    });
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

function openBusinessModal(business = null) {
    document.getElementById('edit-business-id').value = business ? business.id : '';
    document.getElementById('bus-name').value = business ? business.name : '';
    document.getElementById('bus-active').value = business ? business.active : '1';
    document.getElementById('modal-business').style.display = 'flex';
}

async function saveBusiness() {
    const data = {
        id: document.getElementById('edit-business-id').value || undefined,
        name: document.getElementById('bus-name').value,
        active: document.getElementById('bus-active').value
    };
    
    const res = await fetch('api.php?action=save_business', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
    });
    const result = await res.json();
    
    if (result.success) {
        Swal.fire({
            title: '¡Guardado!',
            text: 'Negocio actualizado correctamente.',
            icon: 'success',
            background: 'var(--bg)',
            color: 'var(--text)'
        });
        closeModal('modal-business');
        loadBusinesses();
    } else {
        Swal.fire({ icon: 'error', title: 'Error', text: result.error || 'No se pudo guardar' });
    }
}

function editBusiness(id) { 
    const b = allBusinesses.find(x => x.id == id);
    openBusinessModal(b); 
}

function editUser(id) { 
    const u = allUsers.find(x => x.id == id);
    openUserModal(u); 
}

async function deleteBusiness(id) {
    const b = allBusinesses.find(x => x.id == id);
    const result = await Swal.fire({
        title: '¿Eliminar Negocio?',
        text: `¿Estás seguro de eliminar "${b.name}"? Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--danger)',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: 'var(--bg)',
        color: 'var(--text)'
    });

    if (result.isConfirmed) {
        const res = await fetch('api.php?action=delete_business', { method: 'POST', body: JSON.stringify({ id }) });
        const resData = await res.json();
        if (resData.success) {
            Swal.fire({ title: '¡Eliminado!', icon: 'success' });
            loadBusinesses();
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: resData.error || 'No se pudo eliminar' });
        }
    }
}

async function deleteUser(id) {
    const u = allUsers.find(x => x.id == id);
    const result = await Swal.fire({
        title: '¿Eliminar Usuario?',
        text: `¿Estás seguro de eliminar a "${u.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--danger)',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: 'var(--bg)',
        color: 'var(--text)'
    });

    if (result.isConfirmed) {
        const res = await fetch('api.php?action=delete_user', { method: 'POST', body: JSON.stringify({ id }) });
        const resData = await res.json();
        if (resData.success) {
            Swal.fire({ title: '¡Eliminado!', icon: 'success' });
            loadUsers();
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: resData.error || 'No se pudo eliminar' });
        }
    }
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
function previewProductImage(input) {
    const preview = document.getElementById('prod-img-preview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        }
        reader.readAsDataURL(input.files[0]);
    }
}

function editProduct(id) {
    const prod = allProducts.find(p => p.id == id);
    if (prod) openProductModal(prod);
}

function openProductModal(prod = null) {
    document.getElementById('product-modal-title').innerText = prod ? 'Editar Producto' : 'Nuevo Producto';
    document.getElementById('edit-product-id').value = prod ? prod.id : '';
    document.getElementById('prod-name').value = prod ? prod.name : '';
    document.getElementById('prod-desc').value = prod ? prod.description : '';
    document.getElementById('prod-price').value = prod ? prod.price_usd : '';
    document.getElementById('prod-cat').value = prod ? prod.category : '';
    document.getElementById('prod-img').value = prod ? prod.image_url : '';
    
    // Resetear file input y previsualización
    document.getElementById('prod-img-file').value = '';
    const preview = document.getElementById('prod-img-preview');
    if (prod && prod.image_url) {
        preview.src = prod.image_url;
        preview.style.display = 'block';
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
    
    document.getElementById('modal-product').style.display = 'flex';
}

async function saveProduct() {
    const btn = event.currentTarget;
    const oldBtnContent = btn.innerHTML;
    
    const fileInput = document.getElementById('prod-img-file');
    let imageUrl = document.getElementById('prod-img').value;

    // Si hay un archivo seleccionado, subirlo primero
    if (fileInput.files.length > 0) {
        btn.innerHTML = '⌛ Subiendo...';
        btn.disabled = true;
        
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        
        try {
            const uploadRes = await fetch('api.php?action=upload_image', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (uploadData.success) {
                imageUrl = uploadData.url;
            } else {
                Swal.fire({ icon: 'error', title: 'Error de subida', text: uploadData.error });
                btn.innerHTML = oldBtnContent;
                btn.disabled = false;
                return;
            }
        } catch (e) {
            Swal.fire({ icon: 'error', title: 'Error', text: 'Error de conexión al subir la imagen' });
            btn.innerHTML = oldBtnContent;
            btn.disabled = false;
            return;
        }
    }

    const data = {
        id: document.getElementById('edit-product-id').value || undefined,
        name: document.getElementById('prod-name').value,
        description: document.getElementById('prod-desc').value,
        price_usd: document.getElementById('prod-price').value,
        category: document.getElementById('prod-cat').value,
        image_url: imageUrl
    };

    btn.innerHTML = '⌛ Guardando...';
    btn.disabled = true;

    await fetch('api.php?action=save_product', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
    });

    btn.innerHTML = oldBtnContent;
    btn.disabled = false;

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

async function deleteProduct(id) {
    const result = await Swal.fire({
        title: '¿Eliminar producto?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--danger)',
        confirmButtonText: 'Sí, eliminar',
        background: 'var(--bg)',
        color: 'var(--text)'
    });

    if (result.isConfirmed) {
        await fetch('api.php?action=delete_product', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
        loadProducts();
    }
}

function editIngredient(id) {
    const ing = availableIngredients.find(i => i.id == id);
    if (ing) openIngredientModal(ing);
}

function openIngredientModal(ing = null) {
    document.getElementById('ingredient-modal-title').innerText = ing ? 'Editar Ingrediente' : 'Nuevo Ingrediente';
    document.getElementById('edit-ingredient-id').value = ing ? ing.id : '';
    document.getElementById('ing-name').value = ing ? ing.name : '';
    document.getElementById('ing-price').value = ing ? ing.price_usd : '';
    document.getElementById('modal-ingredient').style.display = 'flex';
}

async function saveIngredient() {
    const data = {
        id: document.getElementById('edit-ingredient-id').value || undefined,
        name: document.getElementById('ing-name').value,
        price_usd: document.getElementById('ing-price').value
    };
    await fetch('api.php?action=save_ingredient', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) 
    });
    Swal.fire({
        title: '¡Guardado!',
        text: 'El ingrediente ha sido actualizado.',
        icon: 'success',
        background: 'var(--bg)',
        color: 'var(--text)'
    });
    closeModal('modal-ingredient');
    loadIngredients();
}

async function deleteIngredient(id) {
    const result = await Swal.fire({
        title: '¿Eliminar ingrediente?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--danger)',
        confirmButtonText: 'Sí, eliminar',
        background: 'var(--bg)',
        color: 'var(--text)'
    });

    if (result.isConfirmed) {
        await fetch('api.php?action=delete_ingredient', {
            method: 'POST',
            body: JSON.stringify({ id })
        });
        loadIngredients();
    }
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
function updateNavBadges(orders) {
    const kitchenCount = orders.filter(o => o.status === 'pendiente' || o.status === 'preparando').length;
    const cajaCount = orders.filter(o => !(o.status === 'listo' && parseInt(o.is_paid) === 1) && o.status !== 'cobrado' && o.status !== 'despachado').length;
    const pedidosCount = orders.length; // Total de órdenes no archivadas (en sistema)

    const bKitchen = document.getElementById('badge-kitchen');
    const bCaja = document.getElementById('badge-caja');
    const bPedidos = document.getElementById('badge-pedidos');

    if (bKitchen) {
        bKitchen.innerText = kitchenCount;
        bKitchen.style.display = kitchenCount > 0 ? 'inline-block' : 'none';
    }
    if (bCaja) {
        bCaja.innerText = cajaCount;
        bCaja.style.display = cajaCount > 0 ? 'inline-block' : 'none';
    }
    if (bPedidos) {
        bPedidos.innerText = pedidosCount;
        bPedidos.style.display = pedidosCount > 0 ? 'inline-block' : 'none';
    }
}

async function confirmDeleteOrder(id) {
    const result = await Swal.fire({
        title: '¿Eliminar orden?',
        text: "Esta acción no se puede deshacer y borrará todos los abonos registrados.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--danger)',
        cancelButtonColor: 'rgba(255,255,255,0.1)',
        confirmButtonText: 'Sí, borrar',
        cancelButtonText: 'Cancelar',
        background: 'var(--bg)',
        color: 'var(--text)'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch('api.php?action=delete_order', {
                method: 'POST',
                body: JSON.stringify({ id })
            });
            const data = await res.json();
            if (data.success) {
                Swal.fire({ 
                    title: '¡Eliminado!', 
                    icon: 'success', 
                    background: 'var(--bg)', 
                    color: 'var(--text)',
                    timer: 1500,
                    showConfirmButton: false
                });
                refreshData();
            } else {
                Swal.fire({ 
                    title: 'Error', 
                    text: data.error || 'No se pudo eliminar', 
                    icon: 'error', 
                    background: 'var(--bg)', 
                    color: 'var(--text)' 
                });
            }
        } catch (e) {
            console.error(e);
        }
    }
}


