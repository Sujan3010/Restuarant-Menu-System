document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const filters_Buttons = document.querySelectorAll('.filter-btn');
    const menuGrid = document.getElementById('menuGrid');
    const loadingSpinner = document.getElementById('loading');
    const noItemsMessage = document.getElementById('noItems');

    let allMenuItems = [];
    let categories = [];
    let currentFilter = 'all';

    // Event listeners
    filters_Buttons.forEach(button => {
        button.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            setActiveFilter(this);
            filterMenuItems(category);
        });
    });

    // Initialize
    init();

    async function init() {
        try {
            await loadCategories();
            await loadMenuItems();
            displayMenuItems(allMenuItems);
        } catch (error) {
            console.error('Initialization error:', error);
            showError('Failed to load menu. Please refresh the page.');
        } finally {
            hideLoading();
        }
    }

    async function loadCategories() {
        try {
            const response = await fetch('../api/categories.php');
            const data = await response.json();
            
            if (response.ok) {
                categories = data;
            } else {
                console.error('Failed to load categories:', data.error);
            }
        } catch (error) {
            console.error('Categories loading error:', error);
        }
    }

    async function loadMenuItems() {
        try {
            const response = await fetch('../api/menu.php');
            const data = await response.json();
            
            if (response.ok) {
                // Only show available items to customers
                allMenuItems = data.filter(item => item.is_available);
            } else {
                console.error('Failed to load menu items:', data.error);
                throw new Error('Failed to load menu items');
            }
        } catch (error) {
            console.error('Menu items loading error:', error);
            throw error;
        }
    }

    function setActiveFilter(activeButton) {
        filters_Buttons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');
    }

    function filterMenuItems(category) {
        currentFilter = category;
        
        let filteredItems;
        if (category === 'all') {
            filteredItems = allMenuItems;
        } else {
            filteredItems = allMenuItems.filter(item => item.category_id == category);
        }
        
        displayMenuItems(filteredItems);
    }

    function displayMenuItems(items) {
        if (items.length === 0) {
            showNoItems();
            return;
        }

        hideNoItems();
        
        menuGrid.innerHTML = items.map((item, index) => `
            <div class="menu-item" style="animation-delay: ${index * 0.1}s">
                <div class="menu-item-image">
                    ${item.image_url ? 
                        `<img src="${item.image_url}" alt="${item.name}" onerror="this.style.display='none'; this.parentElement.innerHTML='🍽️';">` : 
                        getDefaultIcon(item.category_name)
                    }
                </div>
                <div class="menu-item-content">
                    <div class="menu-item-header">
                        <h3 class="menu-item-title">${item.name}</h3>
                        <div class="menu-item-price">AU$${parseFloat(item.price).toFixed(2)}</div>
                    </div>
                    <p class="menu-item-description">${item.description || 'A delicious dish crafted with care and the finest ingredients.'}</p>
                    <div class="menu-item-footer">
                        <span class="category-tag">${item.category_name}</span>
                        <div class="availability-status available">
                            <span class="status-dot"></span>
                            Available
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        menuGrid.style.display = 'grid';
    }

    function getDefaultIcon(categoryName) {
        const icons = {
            'Main Dishes': '🍽️',
            'Side Dishes': '🥗',
            'Beverages': '🥤'
        };
  
        return icons[categoryName] || '🍽️';
    }

    function showNoItems() {
        menuGrid.style.display = 'none';
        noItemsMessage.style.display = 'block';
    }

    function hideNoItems() {
        noItemsMessage.style.display = 'none';
    }

    function hideLoading() {
        loadingSpinner.style.display = 'none';
    }

    function showError(message) {
        hideLoading();
        menuGrid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                <div style="font-size: 60px; margin-bottom: 20px; opacity: 0.5;">😞</div>
                <h3 style="color: #333; margin-bottom: 10px;">Oops! Something went wrong</h3>
                <p style="color: #666; font-size: 16px;">${message}</p>
                <button onclick="location.reload()" style="
                    margin-top: 20px;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #3543ffff 0%, #f7931e 100%);
                    color: white;
                    border: none;
                    border-radius: 25px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                " onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                    Try Again
                </button>
            </div>
        `;
        menuGrid.style.display = 'grid';
    }


  
    filters_Buttons.forEach(button => {
        button.addEventListener('click', function() {
            // Add loading state
            const originalText = this.textContent;
            this.style.pointerEvents = 'none';
            
            setTimeout(() => {
                this.style.pointerEvents = 'auto';
            }, 300);
        });
    });



    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.animationPlayState = 'running';
            }
        });
    }, observerOptions);

 
    const originalDisplayMenuItems = displayMenuItems;
    displayMenuItems = function(items) {
        originalDisplayMenuItems(items);
        
        
        setTimeout(() => {
            const menuItems = document.querySelectorAll('.menu-item');
            menuItems.forEach(item => {
                item.style.animationPlayState = 'paused';
                observer.observe(item);
            });
        }, 100);
    };
});

