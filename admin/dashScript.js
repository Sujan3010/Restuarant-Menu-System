document.addEventListener('DOMContentLoaded', function() {
    // Check if logged in
    if (localStorage.getItem('admin_logged_in') !== 'true') {
        window.location.href = 'login.html';
        return;
    }

    // DOM elements
    const logoutBtn = document.getElementById('logoutBtn');
    const addItemBtn = document.getElementById('addItemBtn');
    const itemModal = document.getElementById('itemModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const itemForm = document.getElementById('itemForm');
    const modalTitle = document.getElementById('modalTitle');
    const saveItemBtn = document.getElementById('saveItemBtn');
    
    // Stats elements
    const totalItemsEl = document.getElementById('totalItems');
    const availableItemsEl = document.getElementById('availableItems');
    const categoriesCountEl = document.getElementById('categoriesCount');
    
    // Menu items container
    const menuItemsContainer = document.getElementById('menuItems');
    
    // Form elements
    const itemNameEl = document.getElementById('itemName');
    const itemDescriptionEl = document.getElementById('itemDescription');
    const itemPriceEl = document.getElementById('itemPrice');
    const itemCategoryEl = document.getElementById('itemCategory');
    const itemImageEl = document.getElementById('itemImage');
    const itemAvailableEl = document.getElementById('itemAvailable');

    let currentEditId = null;
    let categories = [];
    let menuItems = [];

    // Event listeners
    logoutBtn.addEventListener('click', logout);
    addItemBtn.addEventListener('click', () => openModal());
    closeModal.addEventListener('click', closeModalHandler);
    cancelBtn.addEventListener('click', closeModalHandler);
    itemForm.addEventListener('submit', saveItem);

    // Close modal when clicking outside
    itemModal.addEventListener('click', function(e) {
        if (e.target === itemModal) {
            closeModalHandler();
        }
    });

    // Initialize dashboard
    init();

    async function init() {
        try {
            await loadCategories();
            await loadStats();
            await loadMenuItems();
        } catch (error) {
            console.error('Initialization error:', error);
            alert('Failed to load dashboard data. Please refresh the page.');
        }
    }

    async function loadStats() {
        try {
            const response = await fetch('../api/stats.php');
            const data = await response.json();
            
            if (response.ok) {
                totalItemsEl.textContent = data.total_items;
                availableItemsEl.textContent = data.available_items;
                categoriesCountEl.textContent = data.categories;
            } else {
                console.error('Failed to load stats:', data.error);
            }
        } catch (error) {
            console.error('Stats loading error:', error);
        }
    }

    async function loadCategories() {
        try {
            const response = await fetch('../api/categories.php');
            const data = await response.json();
            
            if (response.ok) {
                categories = data;
                populateCategorySelect();
            } else {
                console.error('Failed to load categories:', data.error);
            }
        } catch (error) {
            console.error('Categories loading error:', error);
        }
    }

    function populateCategorySelect() {
        itemCategoryEl.innerHTML = '<option value="">Select category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            itemCategoryEl.appendChild(option);
        });
    }

    async function loadMenuItems() {
        try {
            const response = await fetch('../api/menu.php');
            const data = await response.json();
            
            if (response.ok) {
                menuItems = data;
                displayMenuItems();
            } else {
                console.error('Failed to load menu items:', data.error);
            }
        } catch (error) {
            console.error('Menu items loading error:', error);
        }
    }

    function displayMenuItems() {
        if (menuItems.length === 0) {
            menuItemsContainer.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No menu items found. Add your first item!</p>';
            return;
        }

        menuItemsContainer.innerHTML = menuItems.map(item => `
            <div class="menu-item-card">
                <div class="menu-item-image">
                    ${item.image_url ? `<img src="${item.image_url}" alt="${item.name}" style="width: 100%; height: 100%; object-fit: cover;">` : '🍽️'}
                </div>
                <div class="menu-item-content">
                    <div class="menu-item-header">
                        <h3 class="menu-item-title">${item.name}</h3>
                        <div class="menu-item-price">AUD$${parseFloat(item.price).toFixed(2)}</div>
                    </div>
                    <p class="menu-item-description">${item.description || 'No description available'}</p>
                    <div class="menu-item-meta">
                        <span class="category-badge">${item.category_name}</span>
                        <span class="availability-badge ${item.is_available ? 'available' : 'unavailable'}">
                            ${item.is_available ? 'Available' : 'Unavailable'}
                        </span>
                    </div>
                    <div class="menu-item-actions">
                        <button class="btn btn-edit btn-small" onclick="editItem(${item.id})">
                            Edit
                        </button>
                        <button class="btn btn-delete btn-small" onclick="deleteItem(${item.id}, '${item.name}')">
                         Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function openModal(item = null) {
        console.log("Acheived here",item)
        currentEditId = item ? item.id : null;
   
        if (item) {
            modalTitle.textContent = 'Edit Menu Item';
            saveItemBtn.textContent = 'Update Item';
            
            // Populate form with item data
            itemNameEl.value = item.name;
            itemDescriptionEl.value = item.description || '';
            itemPriceEl.value = item.price;
            itemCategoryEl.value = item.category_id;
           if (itemImageEl.type === 'file') {
  console.log("File input type",)
    itemImageEl.value = ''; 
} else {
    itemImageEl.value = item.image_url || '';
}
            itemAvailableEl.checked = item.is_available;
        } else {
            modalTitle.textContent = 'Add New Menu Item';
            saveItemBtn.textContent = 'Add Item';
            itemForm.reset();
            itemAvailableEl.checked = true;
        }
        
        itemModal.classList.add('show');
    }

    function closeModalHandler() {
        itemModal.classList.remove('show');
        currentEditId = null;
        itemForm.reset();
    }

    async function saveItem(e) {
        e.preventDefault();
        
        const formData = {
            name: itemNameEl.value.trim(),
            description: itemDescriptionEl.value.trim(),
            price: parseFloat(itemPriceEl.value),
            category_id: parseInt(itemCategoryEl.value),
            image_url: itemImageEl.value.trim() || null,
            is_available: itemAvailableEl.checked
        };

        if (currentEditId) {
            formData.id = currentEditId;
        }

        // Show loading state
        saveItemBtn.disabled = true;
        const originalText = saveItemBtn.textContent;
        saveItemBtn.textContent = 'Saving...';

        try {
            const url = '../api/menu.php';
            const method = currentEditId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                closeModalHandler();
                await loadMenuItems();
                await loadStats();
                
                // Show success message
                showNotification(data.message, 'success');
            } else {
                alert(data.error || 'Failed to save item');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Connection error. Please try again.');
        } finally {
            saveItemBtn.disabled = false;
            saveItemBtn.textContent = originalText;
        }
    }

    // Global functions for inline event handlers
    window.editItem = function(id) {
          console.log("Pressed2",id)
         
      if(menuItems.length>0){
        console.log("Pressed1", menuItems)
        const item = menuItems.find(i => String(i.id) === String(id));
        console.log("Pressed3", item)
        if (item) {
            openModal(item);
        }
      }
 
        
    };

    window.deleteItem = async function(id, name) {
        if (!confirm(`Are you sure you want to delete "${name}"?`)) {
            return;
        }

        try {
            const response = await fetch('../api/menu.php', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: id })
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                await loadMenuItems();
                await loadStats();
                showNotification(data.message, 'success');
            } else {
                alert(data.error || 'Failed to delete item');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Connection error. Please try again.');
        }
    };

    function logout() {
        if (confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('admin_logged_in');
            localStorage.removeItem('admin_user');
            window.location.href = 'login.html';
        }
    }

    function showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
            color: ${type === 'success' ? '#155724' : '#721c24'};
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    // Add CSS animations for notifications
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});

