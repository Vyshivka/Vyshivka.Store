document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('shopProductGrid');
    if (!grid) return;

    try {
        const response = await fetch('data/products.json');
        const products = await response.json();

        // Read URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        let currentCategory = urlParams.get('category') || 'all';
        let currentStyle = urlParams.get('style') || urlParams.get('motif') || 'all';
        let searchQuery = '';
        let currentPage = 1;
        const itemsPerPage = 12;

        const searchInput = document.getElementById('shopSearchInput');

        // Auto-highlight active filter chips based on URL params
        if (currentCategory !== 'all') {
            document.querySelectorAll('.ecommerce-filter-chip[data-filter-type="category"]').forEach(c => {
                c.classList.toggle('active', c.dataset.filterVal === currentCategory);
            });
        }
        if (currentStyle !== 'all') {
            document.querySelectorAll('.ecommerce-filter-chip[data-filter-type="style"]').forEach(c => {
                c.classList.toggle('active', c.dataset.filterVal === currentStyle);
            });
        }

        // Single Source of Truth Filter Engine (Category + Style + Search Term)
        const applyFilters = () => {
            return products.filter(p => {
                const matchCat = currentCategory === 'all' || p.category === currentCategory;
                const pStyle = p.style || p.motif || '';
                const matchStyle = currentStyle === 'all' || pStyle.toLowerCase() === currentStyle.toLowerCase();
                
                // Real-time keyword search across title, description, category, and style
                const q = searchQuery.toLowerCase().trim();
                const matchSearch = !q || 
                    (p.title && p.title.toLowerCase().includes(q)) ||
                    (p.description && p.description.toLowerCase().includes(q)) ||
                    (p.category && p.category.toLowerCase().includes(q)) ||
                    (pStyle && pStyle.toLowerCase().includes(q));

                return matchCat && matchStyle && matchSearch;
            });
        };

        const updateGrid = () => {
            const filtered = applyFilters();
            
            // Calculate total pages dynamically based on active search results
            const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
            
            // Ensure current page never exceeds valid maximum
            if (currentPage > totalPages) {
                currentPage = 1;
            }

            const startIdx = (currentPage - 1) * itemsPerPage;
            const paginatedItems = filtered.slice(startIdx, startIdx + itemsPerPage);

            renderProducts(paginatedItems);
            renderPaginationControls(filtered.length, totalPages);
        };

        // Real-Time Search Listener
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                searchQuery = e.target.value;
                currentPage = 1; // Always reset to page 1 on search input
                updateGrid();
            });
        }

        // Setup Filter Chip Clicks
        document.querySelectorAll('.ecommerce-filter-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const type = chip.dataset.filterType;
                const val = chip.dataset.filterVal;

                document.querySelectorAll(`.ecommerce-filter-chip[data-filter-type="${type}"]`).forEach(c => {
                    c.classList.remove('active');
                });
                chip.classList.add('active');

                if (type === 'category') currentCategory = val;
                if (type === 'style') currentStyle = val;

                currentPage = 1; // Always reset to page 1 on filter chip change
                updateGrid();
            });
        });

        // Dynamic Styles for Filter Chips and Pagination
        const styleTag = document.createElement('style');
        styleTag.innerHTML = `
            .ecommerce-filter-chip {
                background: transparent;
                border: 1px solid rgba(173,46,80,0.2);
                padding: 0.4rem 1rem;
                border-radius: 20px;
                font-size: 0.85rem;
                font-family: 'Montserrat', sans-serif;
                color: #6A5A5A;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .ecommerce-filter-chip:hover {
                border-color: #2D1E21;
                color: #2D1E21;
            }
            .ecommerce-filter-chip.active {
                background: #2D1E21;
                color: #FFFAF0;
                border-color: #2D1E21;
                font-weight: 600;
            }
            .pagination-bar {
                display: flex;
                justify-content: flex-start;
                align-items: center;
                gap: 0.5rem;
                margin-top: 3rem;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
                padding-bottom: 1rem;
                width: 100%;
                box-sizing: border-box;
                scrollbar-width: none;
            }
            .pagination-bar::-webkit-scrollbar {
                display: none;
            }
            .page-btn {
                background: #FFFAF0;
                border: 1px solid rgba(0,0,0,0.12);
                color: #2D1E21;
                padding: 0.5rem 1rem;
                border-radius: 10px;
                font-weight: 600;
                cursor: pointer;
                flex-shrink: 0;
                transition: all 0.2s ease;
            }
            .page-btn:hover:not(:disabled) {
                background: #2D1E21;
                color: #FFFAF0;
                border-color: #2D1E21;
            }
            .page-btn.active-page {
                background: #2D1E21;
                color: #FFFAF0;
                border-color: #2D1E21;
            }
            .page-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(styleTag);

        function renderPaginationControls(totalItems, totalPages) {
            let paginationContainer = document.getElementById('paginationContainer');
            if (!paginationContainer) {
                paginationContainer = document.createElement('div');
                paginationContainer.id = 'paginationContainer';
                grid.parentNode.appendChild(paginationContainer);
            }

            // HIDE PAGINATION COMPLETELY IF 12 OR FEWER ITEMS ARE FOUND
            if (totalItems <= itemsPerPage || totalPages <= 1) {
                paginationContainer.innerHTML = '';
                paginationContainer.style.display = 'none';
                return;
            }

            paginationContainer.style.display = 'flex';

            let buttonsHTML = `
                <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} id="prevPageBtn">&larr; Prev</button>
            `;

            for (let i = 1; i <= totalPages; i++) {
                buttonsHTML += `
                    <button class="page-btn ${currentPage === i ? 'active-page' : ''}" data-page="${i}">${i}</button>
                `;
            }

            buttonsHTML += `
                <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} id="nextPageBtn">Next &rarr;</button>
            `;

            paginationContainer.className = 'pagination-bar';
            paginationContainer.innerHTML = buttonsHTML;

            // Page Number Clicks
            paginationContainer.querySelectorAll('.page-btn[data-page]').forEach(btn => {
                btn.addEventListener('click', () => {
                    currentPage = parseInt(btn.dataset.page);
                    updateGrid();
                });
            });

            // Prev Button
            const prevBtn = document.getElementById('prevPageBtn');
            if (prevBtn) {
                prevBtn.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        updateGrid();
                    }
                });
            }

            // Next Button
            const nextBtn = document.getElementById('nextPageBtn');
            if (nextBtn) {
                nextBtn.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        updateGrid();
                    }
                });
            }
        }

        updateGrid();
        setupModal(products);

    } catch (error) {
        console.error('Failed to load shop catalog:', error);
    }
});

function renderProducts(products) {
    const grid = document.getElementById('shopProductGrid');

    if (products.length === 0) {
        grid.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #6A5A5A; padding: 3rem;">No pieces found matching your search criteria.</p>`;
        return;
    }

    // 10 Rich, Warm Light Theme Palettes (+10% Saturation)
    const themePalettes = [
        { bg: '#E2D7C5', text: '#2D1E21' },
        { bg: '#C2CDBB', text: '#2D1E21' },
        { bg: '#E3CFBA', text: '#2D1E21' },
        { bg: '#D9C6CB', text: '#2D1E21' },
        { bg: '#C5D3D6', text: '#2D1E21' },
        { bg: '#EAD9C6', text: '#2D1E21' },
        { bg: '#D8C3B8', text: '#2D1E21' },
        { bg: '#C0CED8', text: '#2D1E21' },
        { bg: '#E0D3C1', text: '#2D1E21' },
        { bg: '#C6CCBB', text: '#2D1E21' }
    ];

    grid.innerHTML = products.map(product => {
        const initials = (product.title || 'VY')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .split(' ')
            .filter(Boolean)
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase() || 'VY';

        const palette = themePalettes[(product.id || 0) % themePalettes.length];

        return `
        <div class="shop-card" style="background: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 8px 20px rgba(0,0,0,0.04); display: flex; flex-direction: column; justify-content: space-between;">
            <div style="height: 280px; overflow: hidden; position: relative;" class="card-img-container">
                <img src="${product.image}" alt="${product.title}" 
                     style="width: 100%; height: 100%; object-fit: cover;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                
                <div class="fallback-placeholder" style="display: none; width: 100%; height: 100%; background: ${palette.bg}; color: ${palette.text}; align-items: center; justify-content: center; font-family: 'Playfair Display', serif; font-size: 3.8rem; font-weight: 700; letter-spacing: 3px;">
                    ${initials}
                </div>

                <span style="position: absolute; top: 1rem; left: 1rem; background: #2D1E21; padding: 0.38rem 0.85rem; border-radius: 20px; font-size: 0.72rem; font-weight: 600; color: #FFFAF0; text-transform: uppercase; z-index: 2; letter-spacing: 0.5px;">${product.category}</span>
            </div>
            
            <div style="padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; flex-grow: 1;">
                <h3 style="font-family: 'Playfair Display', serif; font-size: 1.25rem; color: #2D1E21;">${product.title}</h3>
                <p style="font-size: 0.9rem; color: #6A5A5A; line-height: 1.4;">${product.description}</p>
                <div style="margin-top: auto; padding-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-family: 'Playfair Display', serif; font-size: 1.2rem; font-weight: 700; color: #2D1E21;">₹${product.price.toLocaleString()}</span>
                    <button class="open-inquiry-btn" data-id="${product.id}" style="background: #2D1E21; color: #FFFAF0; border: none; padding: 0.65rem 1.25rem; border-radius: 20px; font-weight: 600; cursor: pointer; font-size: 0.85rem; transition: background 0.2s ease;">Enquire & Order</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

function setupModal(products) {
    const modal = document.getElementById('inquiryModal');
    const closeModal = document.getElementById('closeModal');
    const titleElem = document.getElementById('modalItemTitle');
    const priceElem = document.getElementById('modalItemPrice');
    
    const sizeSelect = document.getElementById('modalSize');
    const customBox = document.getElementById('customMeasurementsBox');
    const sizeChartBtn = document.getElementById('toggleSizeChart');
    const sizeChartBox = document.getElementById('sizeChartModalBox');
    const closeChartBtn = document.getElementById('closeSizeChart');
    
    const designChoiceSelect = document.getElementById('modalDesignChoice');
    const predefinedMotifBox = document.getElementById('predefinedMotifBox');
    const catalogMotifSelect = document.getElementById('modalCatalogMotifSelect');
    const customUploadBox = document.getElementById('customDesignUploadBox');
    const customFileInput = document.getElementById('customDesignFile');
    
    const nameInput = document.getElementById('modalUserName');
    const phoneInput = document.getElementById('modalUserPhone');
    const emailInput = document.getElementById('modalUserEmail');
    
    const waBtn = document.getElementById('whatsappInquiryBtn');
    const igBtn = document.getElementById('instagramInquiryBtn');
    const emailBtn = document.getElementById('emailInquiryBtn');
    const errorNotice = document.getElementById('formErrorNotice');

    let activeProduct = null;

    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('open-inquiry-btn')) {
            const productId = parseInt(e.target.dataset.id);
            activeProduct = products.find(p => p.id === productId);
            if (activeProduct) {
                titleElem.textContent = activeProduct.title;
                priceElem.textContent = `Starts from ₹${activeProduct.price.toLocaleString()}`;
                modal.style.display = 'flex';
                checkFormValidity();
            }
        }
    });

    if (designChoiceSelect) {
        designChoiceSelect.addEventListener('change', () => {
            if (designChoiceSelect.value === 'Own Custom Design') {
                customUploadBox.style.display = 'flex';
                predefinedMotifBox.style.display = 'none';
            } else if (designChoiceSelect.value === 'Predefined Catalog Style') {
                customUploadBox.style.display = 'none';
                predefinedMotifBox.style.display = 'flex';
            } else {
                customUploadBox.style.display = 'none';
                predefinedMotifBox.style.display = 'none';
            }
            checkFormValidity();
        });
    }

    if (sizeSelect) {
        sizeSelect.addEventListener('change', () => {
            customBox.style.display = sizeSelect.value === 'Custom' ? 'flex' : 'none';
            checkFormValidity();
        });
    }

    if (sizeChartBtn) {
        sizeChartBtn.addEventListener('click', () => {
            sizeChartBox.style.display = sizeChartBox.style.display === 'none' ? 'block' : 'none';
        });
    }

    if (closeChartBtn) {
        closeChartBtn.addEventListener('click', () => {
            sizeChartBox.style.display = 'none';
        });
    }

    const isValidEmail = (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    };

    const isValidPhone = (phone) => {
        const cleanPhone = phone.replace(/\D/g, '');
        return cleanPhone.length >= 10;
    };

    const checkFormValidity = () => {
        if (!activeProduct) return false;

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const size = sizeSelect.value;
        const designChoice = designChoiceSelect.value;

        if (!name || !isValidPhone(phone) || !isValidEmail(email) || !size || !designChoice) {
            errorNotice.style.display = 'block';
            disableButton(waBtn);
            disableButton(igBtn);
            disableButton(emailBtn);
            return false;
        }

        if (size === 'Custom') {
            const chest = document.getElementById('custChest').value.trim();
            const waist = document.getElementById('custWaist').value.trim();
            if (!chest || !waist) {
                errorNotice.style.display = 'block';
                disableButton(waBtn);
                disableButton(igBtn);
                disableButton(emailBtn);
                return false;
            }
        }

        if (designChoice === 'Own Custom Design') {
            if (customFileInput.files.length === 0) {
                errorNotice.style.display = 'block';
                disableButton(waBtn);
                disableButton(igBtn);
                disableButton(emailBtn);
                return false;
            }
        }

        errorNotice.style.display = 'none';
        enableButton(waBtn, '#25D366');
        enableButton(igBtn, '#ad2e50');
        enableButton(emailBtn, '#2D1E21');
        setupActionLinks(name, phone, email, size, designChoice);
        return true;
    };

    const enableButton = (btn, color) => {
        btn.disabled = false;
        btn.style.background = color;
        btn.style.cursor = 'pointer';
    };

    const disableButton = (btn) => {
        btn.disabled = true;
        btn.style.background = '#ccc';
        btn.style.cursor = 'not-allowed';
    };

    // Helper to display a sleek toast notification
    const showToast = (text) => {
        let existingToast = document.getElementById('atelierToast');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'atelierToast';
        toast.textContent = text;
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background: #2D1E21;
            color: #FFFAF0;
            padding: 0.8rem 1.6rem;
            border-radius: 30px;
            font-family: 'Montserrat', sans-serif;
            font-size: 0.85rem;
            font-weight: 600;
            box-shadow: 0 10px 25px rgba(0,0,0,0.25);
            z-index: 9999;
            transition: opacity 0.3s ease;
            border: 1px solid rgba(173,46,80,0.4);
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    };

    const setupActionLinks = (name, phone, email, size, designChoice) => {
        let sizeDetails = `Size: ${size}`;
        if (size === 'Custom') {
            const chest = document.getElementById('custChest').value;
            const waist = document.getElementById('custWaist').value;
            const length = document.getElementById('custLength').value || '-';
            const sleeve = document.getElementById('custSleeve').value || '-';
            sizeDetails = `Custom Measurements -> Chest: ${chest}, Waist: ${waist}, Length: ${length}, Sleeve: ${sleeve}`;
        }

        let designDetails = `Design Type: ${designChoice}`;
        let fileInstruction = "";
        
        if (designChoice === 'Predefined Catalog Style') {
            designDetails += ` -> Chosen Style: ${catalogMotifSelect.value}`;
        } else if (designChoice === 'Own Custom Design' && customFileInput.files[0]) {
            designDetails += ` -> [Custom Design Reference File: ${customFileInput.files[0].name}]`;
        }

        const message = `Hello Vyshivka Studio! I would like to order/enquire:\n\n*Item:* ${activeProduct.title} (₹${activeProduct.price})\n*${sizeDetails}*\n*${designDetails}*\n\n*Customer Details:*\nName: ${name}\nPhone: ${phone}\nEmail: ${email}`;

        waBtn.onclick = () => {
            window.open(`https://wa.me/919948675873?text=${encodeURIComponent(message)}`, '_blank');
        };

        igBtn.onclick = () => {
            // 1. Close the modal immediately so the user can see the notification
            modal.style.display = 'none';

            // 2. Copy order details to clipboard
            navigator.clipboard.writeText(message).then(() => {
                showToast("✨ Order details copied! Opening Instagram DM...");
            }).catch(err => {
                console.error('Clipboard copy failed:', err);
                showToast("⚠️ Could not copy automatically. Please copy manually.");
            });

            // 3. Open Instagram chat with a smooth 600ms delay so the toast is clearly visible
            setTimeout(() => {
                window.open('https://ig.me/m/vyshivka.store', '_blank');
            }, 1000);
        };
        emailBtn.onclick = () => {
            window.location.href = `mailto:vyshivka.store@gmail.com?subject=Order Inquiry: ${activeProduct.title}&body=${encodeURIComponent(message)}`;
        };
    };

    const inputsToWatch = [
        nameInput, phoneInput, emailInput, sizeSelect, designChoiceSelect, catalogMotifSelect, customFileInput, 
        document.getElementById('custChest'), document.getElementById('custWaist'), 
        document.getElementById('custLength'), document.getElementById('custSleeve')
    ];

    inputsToWatch.forEach(input => {
        if (input) {
            input.addEventListener('input', checkFormValidity);
            input.addEventListener('change', checkFormValidity);
        }
    });

    if (closeModal) closeModal.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
}