// --- Global Data State (Using LocalStorage for persistence) ---
const STORAGE_KEY = 'reliefCareSystemData';

// Generate initial state if none exists in browser
let appData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {
    inventory: [],
    distributions: [],
    activities: [],
    itemIdCounter: 1001,
    // System Security Defaults
    auth: {
        username: 'admin',
        password: 'admin123',
        recoveryPin: '0000'
    }
};

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

// --- DOM Elements ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const contentSections = document.querySelectorAll('.content-section');
const navButtons = document.querySelectorAll('.nav-btn');
const loginForm = document.getElementById('login-form');
const forgotForm = document.getElementById('forgot-form');

// Modal Elements
const modalOverlay = document.getElementById('modal-overlay');
const editModal = document.getElementById('edit-modal');
const deleteModal = document.getElementById('delete-modal');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');

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

// --- SECURE AUTHENTICATION LOGIC ---

// Form Toggles
document.getElementById('go-to-forgot').addEventListener('click', () => {
    loginForm.classList.add('hidden');
    forgotForm.classList.remove('hidden');
});
document.getElementById('back-to-login').addEventListener('click', () => {
    forgotForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
});

// Login Execution
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('login-username').value;
    const pass = document.getElementById('login-password').value;
    const btnText = document.querySelector('.btn-text');
    const spinner = document.getElementById('login-spinner');
    
    btnText.textContent = 'Verifying...';
    spinner.classList.remove('hidden');
    
    setTimeout(() => {
        btnText.textContent = 'Secure Login';
        spinner.classList.add('hidden');
        
        // Check credentials
        if (user === appData.auth.username && pass === appData.auth.password) {
            authContainer.classList.add('hidden');
            appContainer.classList.remove('hidden');
            showToast('Access Granted. Welcome Admin.', 'success');
            
            renderInventory();
            renderDistributions();
            renderActivity();
            updateDashboard();
            loginForm.reset();
        } else {
            showToast('Access Denied: Incorrect credentials.', 'error');
            document.getElementById('login-password').value = ''; 
        }
    }, 800);
});

// Password Reset Execution
forgotForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const enteredPin = document.getElementById('reset-pin').value;
    const newPassword = document.getElementById('reset-new-password').value;

    if (enteredPin === appData.auth.recoveryPin) {
        appData.auth.password = newPassword;
        saveData();
        showToast('Password reset successfully! Please log in.', 'success');
        forgotForm.reset();
        document.getElementById('back-to-login').click();
    } else {
        showToast('Security Error: Invalid Secret PIN.', 'error');
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
    appContainer.classList.add('hidden');
    authContainer.classList.remove('hidden');
    showToast('Securely logged out.', 'success');
});

// Dropdowns
function toggleDropdown(toggleId, menuId) {
    const menu = document.getElementById(menuId);
    document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (m.id !== menuId) m.classList.remove('active');
    });
    menu.classList.toggle('active');
}
document.getElementById('notif-toggle').addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown('notif-toggle', 'notif-menu'); });
document.getElementById('profile-toggle').addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown('profile-toggle', 'profile-menu'); });
document.addEventListener('click', () => document.querySelectorAll('.dropdown-menu').forEach(menu => menu.classList.remove('active')));

// --- Sidebar Navigation ---
function closeSidebar() {
    document.getElementById('sidebar').classList.remove('active');
    document.getElementById('sidebar-overlay').classList.remove('active');
    document.body.style.overflow = '';
}
document.getElementById('mobile-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.add('active');
    document.getElementById('sidebar-overlay').classList.add('active');
    document.body.style.overflow = 'hidden';
});
document.getElementById('close-sidebar-btn').addEventListener('click', closeSidebar);
document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.remove('active'));
        contentSections.forEach(s => s.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-target')).classList.remove('hidden');
        closeSidebar();
    });
});

// --- Modals Logic ---
function openModal(modalId) {
    modalOverlay.classList.remove('hidden');
    document.getElementById(modalId).classList.remove('hidden');
}
function closeAllModals() {
    modalOverlay.classList.add('hidden');
    editModal.classList.add('hidden');
    deleteModal.classList.add('hidden');
}
closeModalBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
modalOverlay.addEventListener('click', closeAllModals);

// --- Activity Feed ---
function logActivity(message, iconClass) {
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    appData.activities.unshift({ message, iconClass, time });
    if(appData.activities.length > 8) appData.activities.pop();
    saveData();
    renderActivity();
}

function renderActivity() {
    const list = document.getElementById('activity-list');
    list.innerHTML = '';
    if (appData.activities.length === 0) {
        list.innerHTML = '<li class="empty-state">No recent activity yet.</li>';
        return;
    }
    appData.activities.forEach(act => {
        list.innerHTML += `
            <li>
                <div class="activity-icon"><i class="fa-solid ${act.iconClass}"></i></div>
                <div class="activity-text"><p>${act.message}</p><small>${act.time}</small></div>
            </li>
        `;
    });
}
document.getElementById('clear-activity-btn').addEventListener('click', () => {
    appData.activities = []; saveData(); renderActivity(); showToast("Activity feed cleared.");
});

// --- Inventory Logic ---
document.getElementById('donation-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const donor = document.getElementById('donor-name').value.trim();
    const name = document.getElementById('item-name').value.trim();
    const qty = parseInt(document.getElementById('item-qty').value);
    const unit = document.getElementById('item-unit').value;

    const existingItem = appData.inventory.find(item => item.name.toLowerCase() === name.toLowerCase() && item.unit === unit);
    
    if (existingItem) {
        existingItem.qty += qty;
        logActivity(`Restocked: Added ${qty} ${unit} to ${name}`, 'fa-box-open');
    } else {
        appData.inventory.push({ id: appData.itemIdCounter++, donor, name, qty, unit });
        logActivity(`New Donation: ${qty} ${unit} of ${name} from ${donor}`, 'fa-truck-loading');
    }
    saveData(); document.getElementById('donation-form').reset();
    renderInventory(); updateDashboard(); showToast('Donation saved successfully!', 'success');
});

// Inventory Editing
let itemToEditIndex = null;
window.editItem = function(id) {
    itemToEditIndex = appData.inventory.findIndex(i => i.id === id);
    if (itemToEditIndex > -1) {
        const item = appData.inventory[itemToEditIndex];
        document.getElementById('edit-id').value = item.id;
        document.getElementById('edit-name').value = item.name;
        document.getElementById('edit-qty').value = item.qty;
        openModal('edit-modal');
    }
};

document.getElementById('edit-form').addEventListener('submit', (e) => {
    e.preventDefault();
    if (itemToEditIndex > -1) {
        const newName = document.getElementById('edit-name').value;
        const newQty = parseInt(document.getElementById('edit-qty').value);
        appData.inventory[itemToEditIndex].name = newName;
        appData.inventory[itemToEditIndex].qty = newQty;
        
        logActivity(`Updated item #${appData.inventory[itemToEditIndex].id} to ${newName}`, 'fa-pen-to-square');
        saveData(); renderInventory(); updateDashboard(); closeAllModals(); showToast("Item updated successfully", "success");
    }
});

// Inventory Deletion
let itemToDeleteId = null;
window.confirmDelete = function(id) {
    const item = appData.inventory.find(i => i.id === id);
    if(item) {
        itemToDeleteId = id;
        document.getElementById('delete-item-name').textContent = item.name;
        openModal('delete-modal');
    }
};

document.getElementById('confirm-delete-btn').addEventListener('click', () => {
    if (itemToDeleteId) {
        const item = appData.inventory.find(i => i.id === itemToDeleteId);
        appData.inventory = appData.inventory.filter(i => i.id !== itemToDeleteId);
        logActivity(`Deleted item: ${item.name} from records`, 'fa-trash');
        saveData(); renderInventory(); updateDashboard(); closeAllModals(); showToast("Item deleted permanently.", "success");
    }
});

function getStatusBadge(qty) {
    if (qty === 0) return `<span class="badge out-stock">Out of Stock</span>`;
    if (qty < 10) return `<span class="badge low-stock">Low Stock</span>`;
    return `<span class="badge in-stock">In Stock</span>`;
}

function renderInventory(filterText = '') {
    const tbody = document.getElementById('inventory-table-body');
    const select = document.getElementById('distribute-item');
    tbody.innerHTML = ''; select.innerHTML = '<option value="">Choose from inventory...</option>';

    appData.inventory.forEach(item => {
        if (item.name.toLowerCase().includes(filterText.toLowerCase()) || item.donor.toLowerCase().includes(filterText.toLowerCase())) {
            tbody.innerHTML += `
                <tr>
                    <td>#${item.id}</td>
                    <td>${item.donor}</td>
                    <td><strong>${item.name}</strong> (${item.unit})</td>
                    <td>${item.qty}</td>
                    <td>${getStatusBadge(item.qty)}</td>
                    <td>
                        <button class="action-btn" onclick="editItem(${item.id})" title="Edit"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="action-btn delete" onclick="confirmDelete(${item.id})" title="Delete"><i class="fa-solid fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }
        if (item.qty > 0) {
            select.innerHTML += `<option value="${item.id}">${item.name} - ${item.qty} ${item.unit} left</option>`;
        }
    });
    if(tbody.innerHTML === '' && appData.inventory.length > 0) tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:gray;">No items match your search.</td></tr>`;
}

document.getElementById('search-inventory').addEventListener('input', (e) => renderInventory(e.target.value));
document.getElementById('global-search').addEventListener('keypress', (e) => {
    if(e.key === 'Enter') {
        navButtons[1].click();
        document.getElementById('search-inventory').value = e.target.value;
        renderInventory(e.target.value);
    }
});

// --- Distribution Logic ---
document.getElementById('distribution-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const beneficiary = document.getElementById('beneficiary-name').value.trim();
    const itemId = parseInt(document.getElementById('distribute-item').value);
    const qtyToGive = parseInt(document.getElementById('distribute-qty').value);
    const itemIndex = appData.inventory.findIndex(i => i.id === itemId);
    
    if (itemIndex > -1) {
        if (appData.inventory[itemIndex].qty >= qtyToGive) {
            appData.inventory[itemIndex].qty -= qtyToGive;
            const date = new Date().toLocaleString([], {year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'});
            appData.distributions.unshift({ date, beneficiary, itemName: appData.inventory[itemIndex].name, qty: qtyToGive, unit: appData.inventory[itemIndex].unit });
            logActivity(`Issued ${qtyToGive} ${appData.inventory[itemIndex].unit} of ${appData.inventory[itemIndex].name} to ${beneficiary}`, 'fa-handshake');
            saveData(); document.getElementById('distribution-form').reset();
            renderInventory(); renderDistributions(); updateDashboard(); showToast('Relief items released successfully!', 'success');
        } else {
            showToast('Insufficient stock for this request!', 'error');
        }
    }
});

function renderDistributions() {
    const tbody = document.getElementById('distribution-table-body');
    tbody.innerHTML = '';
    if (appData.distributions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:gray;">No distribution logs yet.</td></tr>`; return;
    }
    appData.distributions.forEach(dist => {
        tbody.innerHTML += `<tr><td>${dist.date}</td><td><strong>${dist.beneficiary}</strong></td><td>${dist.itemName}</td><td><span class="badge in-stock">${dist.qty} ${dist.unit}</span></td></tr>`;
    });
}

// --- Dashboard & Export ---
function updateDashboard() {
    document.getElementById('stat-total-donations').textContent = appData.inventory.reduce((sum, item) => sum + item.qty, 0);
    document.getElementById('stat-total-distributed').textContent = appData.distributions.reduce((sum, dist) => sum + dist.qty, 0);
    document.getElementById('stat-beneficiaries').textContent = [...new Set(appData.distributions.map(d => d.beneficiary))].length;
}

document.getElementById('export-csv-btn').addEventListener('click', () => {
    if(appData.inventory.length === 0 && appData.distributions.length === 0) return showToast("No data to export.", "error");
    
    let csvContent = "data:text/csv;charset=utf-8,--- INVENTORY STOCK ---\nID,Donor,Item,Quantity,Unit\n";
    appData.inventory.forEach(item => { csvContent += `${item.id},"${item.donor}","${item.name}",${item.qty},${item.unit}\n`; });
    csvContent += "\n--- DISTRIBUTION LOGS ---\nDate,Beneficiary,Item,Quantity,Unit\n";
    appData.distributions.forEach(dist => { csvContent += `"${dist.date}","${dist.beneficiary}","${dist.itemName}",${dist.qty},${dist.unit}\n`; });

    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "ReliefCare_Master_Report.csv";
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    logActivity("Exported system report to CSV", "fa-download"); showToast("Report generated and downloaded!", "success");
});
