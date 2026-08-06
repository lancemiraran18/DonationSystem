// --- Mock Database ---
let inventory = [];
let distributions = [];
let itemIdCounter = 1001;

// --- DOM Elements ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const logoutBtn = document.getElementById('logout-btn');
const navButtons = document.querySelectorAll('.nav-btn');
const contentSections = document.querySelectorAll('.content-section');

// Mobile Menu Elements
const sidebar = document.getElementById('sidebar');
const mobileToggle = document.getElementById('mobile-toggle');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebarOverlay = document.getElementById('sidebar-overlay');

// --- Mobile Navigation Drawer Handlers ---
function openSidebar() {
    sidebar.classList.add('active');
    sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
}

function closeSidebar() {
    sidebar.classList.remove('active');
    sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

if (mobileToggle) mobileToggle.addEventListener('click', openSidebar);
if (closeSidebarBtn) closeSidebarBtn.addEventListener('click', closeSidebar);
if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebar);

// --- Custom Toast Notification ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// --- Auth Toggle Logic ---
document.getElementById('go-to-register').addEventListener('click', () => {
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
});
document.getElementById('go-to-login').addEventListener('click', () => {
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// --- Login Logic ---
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    const btnText = document.querySelector('.btn-text');
    const spinner = document.getElementById('login-spinner');
    
    btnText.textContent = 'Authenticating...';
    spinner.classList.remove('hidden');
    
    setTimeout(() => {
        btnText.textContent = 'Sign In';
        spinner.classList.add('hidden');
        
        if (user.length >= 3 && pass.length >= 3) {
            document.getElementById('display-user-name').textContent = user;
            authContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            showToast(`Welcome back, ${user}!`, 'success');
            updateDashboard();
        } else {
            showToast('Invalid credentials (min 3 chars).', 'error');
        }
    }, 1000);
});

// Register Logic
registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showToast('Account created! Please sign in.', 'success');
    document.getElementById('go-to-login').click();
});

logoutBtn.addEventListener('click', () => {
    appContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    loginForm.reset();
    closeSidebar();
    showToast('Logged out successfully', 'success');
});

// --- Navigation Logic ---
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        contentSections.forEach(s => s.classList.add('hidden'));
        
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-target');
        document.getElementById(targetId).classList.remove('hidden');

        // Automatically close mobile sidebar menu after selecting a page
        closeSidebar();
    });
});

// --- Activity Feed Logic ---
function logActivity(message, iconClass) {
    const list = document.getElementById('activity-list');
    const emptyState = list.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const li = document.createElement('li');
    li.innerHTML = `
        <div class="activity-icon"><i class="fa-solid ${iconClass}"></i></div>
        <div class="activity-text">
            <p>${message}</p>
            <small>${time}</small>
        </div>
    `;
    list.prepend(li);
    
    if (list.children.length > 5) list.lastChild.remove();
}

// --- Inventory & Donation Logic ---
const donationForm = document.getElementById('donation-form');
const inventoryTableBody = document.getElementById('inventory-table-body');
const distributeItemSelect = document.getElementById('distribute-item');
const searchInventory = document.getElementById('search-inventory');

donationForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const donor = document.getElementById('donor-name').value;
    const name = document.getElementById('item-name').value;
    const qty = parseInt(document.getElementById('item-qty').value);
    const unit = document.getElementById('item-unit').value;

    const existingItem = inventory.find(item => item.name.toLowerCase() === name.toLowerCase() && item.unit === unit);
    
    if (existingItem) {
        existingItem.qty += qty;
        logActivity(`Added ${qty} ${unit} to existing ${name} stock`, 'fa-box-open');
    } else {
        inventory.push({ id: itemIdCounter++, donor, name, qty, unit });
        logActivity(`Received new donation: ${qty} ${unit} of ${name} from ${donor}`, 'fa-truck-loading');
    }

    donationForm.reset();
    renderInventory();
    updateDashboard();
    showToast('Donation recorded!', 'success');
});

function getStatusBadge(qty) {
    if (qty === 0) return `<span class="badge out-stock">Out of Stock</span>`;
    if (qty < 10) return `<span class="badge low-stock">Low Stock</span>`;
    return `<span class="badge in-stock">In Stock</span>`;
}

function renderInventory(filterText = '') {
    inventoryTableBody.innerHTML = '';
    distributeItemSelect.innerHTML = '<option value="">Choose from inventory...</option>';

    inventory.forEach(item => {
        if (item.name.toLowerCase().includes(filterText.toLowerCase()) || item.donor.toLowerCase().includes(filterText.toLowerCase())) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>#${item.id}</td>
                <td>${item.donor}</td>
                <td><strong>${item.name}</strong> (${item.unit})</td>
                <td>${item.qty}</td>
                <td>${getStatusBadge(item.qty)}</td>
                <td>
                    <button class="action-btn" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                    <button class="action-btn delete" title="Delete"><i class="fa-solid fa-trash"></i></button>
                </td>
            `;
            inventoryTableBody.appendChild(row);
        }

        if (item.qty > 0) {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = `${item.name} - ${item.qty} ${item.unit} left`;
            distributeItemSelect.appendChild(option);
        }
    });
}

if (searchInventory) {
    searchInventory.addEventListener('input', (e) => renderInventory(e.target.value));
}

// --- Distribution Logic ---
const distributionForm = document.getElementById('distribution-form');
const distributionTableBody = document.getElementById('distribution-table-body');

distributionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const beneficiary = document.getElementById('beneficiary-name').value;
    const itemId = parseInt(document.getElementById('distribute-item').value);
    const qtyToGive = parseInt(document.getElementById('distribute-qty').value);

    const itemIndex = inventory.findIndex(i => i.id === itemId);
    
    if (itemIndex !== -1) {
        if (inventory[itemIndex].qty >= qtyToGive) {
            inventory[itemIndex].qty -= qtyToGive;
            
            const date = new Date().toLocaleString([], {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
            distributions.push({ date, beneficiary, itemName: inventory[itemIndex].name, qty: qtyToGive, unit: inventory[itemIndex].unit });

            logActivity(`Distributed ${qtyToGive} ${inventory[itemIndex].unit} of ${inventory[itemIndex].name} to ${beneficiary}`, 'fa-handshake');

            distributionForm.reset();
            renderInventory();
            renderDistributions();
            updateDashboard();
            showToast('Items released!', 'success');
        } else {
            showToast('Insufficient stock!', 'error');
        }
    }
});

function renderDistributions() {
    distributionTableBody.innerHTML = '';
    distributions.forEach(dist => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dist.date}</td>
            <td><strong>${dist.beneficiary}</strong></td>
            <td>${dist.itemName}</td>
            <td><span class="badge in-stock">${dist.qty} ${dist.unit}</span></td>
        `;
        distributionTableBody.appendChild(row);
    });
}

// --- Dashboard Logic ---
function updateDashboard() {
    const totalDonations = inventory.reduce((sum, item) => sum + item.qty, 0);
    const totalDistributed = distributions.reduce((sum, dist) => sum + dist.qty, 0);
    const uniqueBeneficiaries = [...new Set(distributions.map(d => d.beneficiary))].length;

    animateValue('stat-total-donations', parseInt(document.getElementById('stat-total-donations').innerText) || 0, totalDonations, 400);
    animateValue('stat-total-distributed', parseInt(document.getElementById('stat-total-distributed').innerText) || 0, totalDistributed, 400);
    animateValue('stat-beneficiaries', parseInt(document.getElementById('stat-beneficiaries').innerText) || 0, uniqueBeneficiaries, 400);
}

function animateValue(id, start, end, duration) {
    if (start === end) return;
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) { window.requestAnimationFrame(step); }
    };
    window.requestAnimationFrame(step);
}
