// Cart State
let cart = [];

/**
 * Parses the raw HTML string to extract menu data.
 * Returns an object with categories as keys and arrays of items as values.
 */
function extractMenuData(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');

    const menuData = {};

    // Select all category blocks
    // Based on HTML structure: class 'f8twAd' looks like the container for a category
    const categoryBlocks = doc.querySelectorAll('.f8twAd');

    categoryBlocks.forEach(block => {
        // Extract Category Name
        const titleElement = block.querySelector('.EJHGm');
        if (!titleElement) return;

        const categoryName = titleElement.textContent.trim();
        const items = [];

        // Extract Items within this category
        // Item container class appears to be 'J8zyUd'
        const itemBlocks = block.querySelectorAll('.J8zyUd');

        itemBlocks.forEach(itemBlock => {
            // Name: class 't3RpAe' (inside 'su7Prc')
            const nameEl = itemBlock.querySelector('.t3RpAe');
            const name = nameEl ? nameEl.textContent.trim() : 'Produto sem nome';

            // Image: class 'LFhsDb' style background-image
            const imgEl = itemBlock.querySelector('.LFhsDb');
            let imageUrl = '';

            if (imgEl && imgEl.style.backgroundImage) {
                // Remove 'url("' and '")' wrapper
                imageUrl = imgEl.style.backgroundImage.slice(4, -1).replace(/["']/g, "");
            }

            items.push({
                name: name,
                image: imageUrl
            });
        });

        if (items.length > 0) {
            menuData[categoryName] = items;
        }
    });

    return menuData;
}

// Icon mapping for categories
const CATEGORY_ICONS = {
    'Bebidas Refrescantes': 'local_drink',
    'Drinks': 'local_bar',
    'Cafés Gourmet': 'coffee',
    'Cafés': 'coffee',
    'Sanduíches': 'lunch_dining',
    'Sobremesa': 'icecream',
    'Todos': 'restaurant_menu'
};

/**
 * Renders the category filter buttons
 */
function renderCategoryFilters(categories) {
    const filterContainer = document.getElementById('menu-filters');
    filterContainer.innerHTML = '';

    // Add "Todos" option
    const allCategories = ['Todos', ...categories];

    allCategories.forEach(category => {
        const btn = document.createElement('button');
        btn.className = `filter-btn ${category === 'Todos' ? 'active' : ''}`;

        // Icon
        const iconName = CATEGORY_ICONS[category] || 'restaurant';
        const icon = document.createElement('i');
        icon.className = 'material-icons';
        icon.textContent = iconName;

        btn.appendChild(icon);
        btn.appendChild(document.createTextNode(category));

        // Click Event
        btn.onclick = () => {
            // Remove active class from all
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // Add to current
            btn.classList.add('active');

            // Render Menu Filtered
            // We need access to the full data here. 
            // Ideally, we store the full data globally or pass it down.
            // For simplicity, we'll assume global data is available on the window 
            // not a best practice but fits this simple architecture.
            if (window.FULL_MENU_DATA) {
                renderMenu(window.FULL_MENU_DATA, category);
            }
        };

        filterContainer.appendChild(btn);
    });
}

/**
 * Renders the menu into the DOM
 */
function renderMenu(menuData, filter = 'Todos') {
    const container = document.getElementById('menu-container');
    container.innerHTML = ''; // Clear current items

    let categoriesToRender = [];

    if (filter === 'Todos') {
        categoriesToRender = Object.keys(menuData);
    } else if (menuData[filter]) {
        categoriesToRender = [filter];
    }

    if (categoriesToRender.length === 0) {
        container.innerHTML = '<div class="loading">Nenhum item encontrado.</div>';
        return;
    }

    // Optimization: Use DocumentFragment to minimize reflows
    const fragment = document.createDocumentFragment();

    // Iterate over categories to render
    categoriesToRender.forEach(category => {
        const items = menuData[category];

        // Create Category Section
        const categorySection = document.createElement('div');
        categorySection.className = 'menu-category';

        const categoryTitle = document.createElement('h4');
        categoryTitle.className = 'menu-category-title';
        categoryTitle.textContent = category;

        const grid = document.createElement('div');
        grid.className = 'menu-grid';

        // Create Items
        items.forEach((item, index) => {
            const itemCard = document.createElement('div');
            itemCard.className = 'menu-item';

            // Optimization: Reduce animation delay cap. 
            // Previous: index * 50ms -> 100 items = 5 seconds delay!
            // New: index * 10ms, capped at 500ms.
            // Items beyond 50 will appear almost instantly after the first batch.
            const delay = Math.min(index * 20, 500);
            itemCard.style.animationDelay = `${delay}ms`;

            // Image Div
            const imgDiv = document.createElement('div');
            imgDiv.className = 'menu-item-image';
            if (item.image) {
                // Resize image url if possible or use lazy loading?
                // For now just use the url.
                imgDiv.style.backgroundImage = `url('${item.image}')`;
            } else {
                imgDiv.style.backgroundColor = '#2a2a2a'; // Fallback
            }

            // Info Div
            const infoDiv = document.createElement('div');
            infoDiv.className = 'menu-item-info';

            const itemName = document.createElement('h5');
            itemName.className = 'menu-item-name';
            itemName.textContent = item.name;

            // Actions
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'menu-actions';

            // Order Button (Direct WhatsApp)
            const orderBtn = document.createElement('button');
            orderBtn.className = 'btn-action btn-order';
            orderBtn.innerHTML = '<i class="material-icons">whatsapp</i> Pedir';
            orderBtn.onclick = () => sendItemOrder(item);

            // Add to Cart Button
            const addBtn = document.createElement('button');
            addBtn.className = 'btn-action btn-add-cart';
            // CHANGED: "Add" -> "Adicionar"
            addBtn.innerHTML = '<i class="material-icons">add_shopping_cart</i> Adicionar';
            addBtn.onclick = () => addToCart(item);

            actionsDiv.appendChild(orderBtn);
            actionsDiv.appendChild(addBtn);

            // Append
            infoDiv.appendChild(itemName);
            infoDiv.appendChild(actionsDiv);

            itemCard.appendChild(imgDiv);
            itemCard.appendChild(infoDiv);
            grid.appendChild(itemCard);
        });

        // Append Category to Container
        categorySection.appendChild(categoryTitle);
        categorySection.appendChild(grid);
        fragment.appendChild(categorySection);
    });

    container.appendChild(fragment);
}

// Cart Functions
function addToCart(item) {
    cart.push(item);
    updateCartIcon();
    alert(`"${item.name}" adicionado ao carrinho!`);
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartIcon() {
    const countSpan = document.getElementById('cart-count');
    if (countSpan) {
        countSpan.textContent = cart.length;
        // Animate badge
        countSpan.style.transform = 'scale(1.2)';
        setTimeout(() => countSpan.style.transform = 'scale(1)', 200);
    }
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal.style.display === 'flex') {
        modal.classList.remove('open');
        setTimeout(() => modal.style.display = 'none', 300);
    } else {
        updateCartUI();
        modal.style.display = 'flex';
        // Force reflow
        modal.offsetHeight;
        modal.classList.add('open');
    }
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const totalCountSpan = document.getElementById('cart-total-count');

    cartItemsContainer.innerHTML = '';
    totalCountSpan.textContent = cart.length;
    updateCartIcon();

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Seu carrinho está vazio.</p>';
        return;
    }

    cart.forEach((item, index) => {
        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item';

        itemRow.innerHTML = `
            <span class="cart-item-name">${item.name}</span>
            <button class="btn-remove" onclick="removeFromCart(${index})">
                <i class="material-icons">delete</i>
            </button>
        `;

        cartItemsContainer.appendChild(itemRow);
    });
}

// WhatsApp Integration
const PHONE_NUMBER = '5518996536710';

function sendItemOrder(item) {
    const text = encodeURIComponent(`Olá! Gostaria de pedir: *${item.name}*.`);
    window.open(`https://wa.me/${PHONE_NUMBER}?text=${text}`, '_blank');
}

function checkoutCart() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }

    let message = 'Olá! Gostaria de fazer o seguinte pedido:\n\n';
    cart.forEach(item => {
        message += `- ${item.name}\n`;
    });

    message += `\nTotal de Itens: ${cart.length}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${PHONE_NUMBER}?text=${encodedMessage}`, '_blank');
}

// Opening Status Logic
function checkOpeningStatus() {
    const now = new Date();
    const currentHour = now.getHours();

    const statusElement = document.getElementById('opening-status');
    if (!statusElement) return;

    // Closing time is 21:00 (9 PM)

    if (currentHour >= 21) {
        statusElement.textContent = "Fechado ⋅ Abre amanhã";
        statusElement.style.color = "#ff4d4d"; // Red
    } else {
        statusElement.textContent = "Aberto ⋅ Fecha 21:00";
        statusElement.style.color = "#25d366"; // Green
    }
}


// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Viatábua Script Loaded');

    checkOpeningStatus();
    // Check status every minute
    setInterval(checkOpeningStatus, 60000);

    if (typeof RAW_MENU_HTML !== 'undefined') {
        const data = extractMenuData(RAW_MENU_HTML);

        // Store globally for the filter click handler
        window.FULL_MENU_DATA = data;

        console.log('Extracted Data:', data);

        // Render Filters
        renderCategoryFilters(Object.keys(data));

        // Initial Render
        renderMenu(data, 'Todos');
    } else {
        console.error('RAW_MENU_HTML not found. Make sure data.js is loaded.');
        document.getElementById('menu-container').innerHTML = 'Erro ao carregar cardápio. (Dados não encontrados)';
    }
});
