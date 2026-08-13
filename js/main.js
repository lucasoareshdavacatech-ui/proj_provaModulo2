import { db, collection, addDoc, onSnapshot } from './firebase-config.js';

// --- ELEMENTOS DO DOM EXISTENTES ---
const form = document.querySelector('#finance-form');
const descInput = document.querySelector('#desc-input');
const valueInput = document.querySelector('#value-input');
const list = document.querySelector('#transactions-list');
const typeToggleBtn = document.querySelector('#type-toggle-btn');
const totalIncomeEl = document.querySelector('#total-income');
const totalExpensesEl = document.querySelector('#total-expenses');
const totalBalanceEl = document.querySelector('#total-balance');

// --- NOVOS ELEMENTOS DO GERENCIADOR DE PERFIL ---
const menuHamburger = document.querySelector('#menu-hamburger');
const closeSidebar = document.querySelector('#close-sidebar');
const accountSidebar = document.querySelector('#account-sidebar');
const sidebarOverlay = document.querySelector('#sidebar-overlay');
const quickProfileTrigger = document.querySelector('#quick-profile-trigger');
const accountForm = document.querySelector('#account-form');
const savedProfilesList = document.querySelector('#saved-profiles-list');

const topAvatar = document.querySelector('#top-avatar');
const topUsername = document.querySelector('#top-username');
const sidebarAvatar = document.querySelector('#sidebar-avatar');
const sidebarEmail = document.querySelector('#sidebar-email');
const editDisplayName = document.querySelector('#edit-display-name');
const btnEditName = document.querySelector('#btn-edit-name');
const avatarUpload = document.querySelector('#avatar-upload');

const transactionsRef = collection(db, "transactions");
let categoryChartInstance = null;
let evolutionChartInstance = null;
let isExpenseMode = false;

// --- SISTEMA INTERNO DE GESTÃO DE PERFIS (LOCALSTORAGE) ---
let profiles = JSON.parse(localStorage.getItem('profiles')) || [
    { id: 'p1', name: 'Lucas Soares', email: 'lucas@email.com', avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }
];
let activeProfileId = localStorage.getItem('activeProfileId') || 'p1';

const saveProfilesToStorage = () => {
    localStorage.setItem('profiles', JSON.stringify(profiles));
    localStorage.setItem('activeProfileId', activeProfileId);
};

const getActiveProfile = () => profiles.find(p => p.id === activeProfileId) || profiles[0];

const updateProfileUI = () => {
    const current = getActiveProfile();
    if (!current) return;

    // Atualiza barra do topo
    topUsername.innerText = current.name;
    topAvatar.src = current.avatar;

    // Atualiza painel lateral
    editDisplayName.value = current.name;
    sidebarAvatar.src = current.avatar;
    sidebarEmail.innerText = current.email;

    renderProfilesList();
};

const renderProfilesList = () => {
    savedProfilesList.innerHTML = '';
    profiles.forEach(p => {
        const item = document.createElement('div');
        item.className = `profile-item ${p.id === activeProfileId ? 'selected' : ''}`;
        
        item.innerHTML = `
            <div class="profile-meta" onclick="window.switchProfile('${p.id}')">
                <img src="${p.avatar}" alt="Avatar">
                <div>
                    <span>${p.name}</span>
                    <small>${p.email}</small>
                </div>
            </div>
            ${profiles.length > 1 ? `<button class="btn-delete-profile" onclick="window.deleteProfile('${p.id}')"><i class="fas fa-trash-alt"></i></button>` : ''}
        `;
        savedProfilesList.appendChild(item);
    });
};

// Funções globais anexadas à window para os cliques inline
window.switchProfile = (id) => {
    activeProfileId = id;
    saveProfilesToStorage();
    updateProfileUI();
};

window.deleteProfile = (id) => {
    if (id === activeProfileId) return;
    profiles = profiles.filter(p => p.id !== id);
    saveProfilesToStorage();
    renderProfilesList();
};

// Controle de abertura da Sidebar
const toggleSidebar = () => {
    accountSidebar.classList.toggle('open');
    sidebarOverlay.classList.toggle('open');
};
menuHamburger.addEventListener('click', toggleSidebar);
quickProfileTrigger.addEventListener('click', toggleSidebar);
closeSidebar.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar);

// Criar Nova Conta
accountForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.querySelector('#acc-name').value.trim();
    const email = document.querySelector('#acc-email').value.trim();
    
    const newProfile = {
        id: 'p_' + Date.now(),
        name,
        email,
        avatar: 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
    };

    profiles.push(newProfile);
    activeProfileId = newProfile.id;
    saveProfilesToStorage();
    updateProfileUI();
    accountForm.reset();
});

// Editar Nome (Inline) com botão lápis
btnEditName.addEventListener('click', () => {
    if (editDisplayName.hasAttribute('readonly')) {
        editDisplayName.removeAttribute('readonly');
        editDisplayName.classList.add('editable');
        editDisplayName.focus();
        btnEditName.innerHTML = `<i class="fas fa-check" style="color: #10b981;"></i>`;
    } else {
        editDisplayName.setAttribute('readonly', true);
        editDisplayName.classList.remove('editable');
        btnEditName.innerHTML = `<i class="fas fa-pencil-alt"></i>`;
        
        const current = getActiveProfile();
        current.name = editDisplayName.value.trim();
        saveProfilesToStorage();
        updateProfileUI();
    }
});

// Carregar Imagem Local/Foto de Perfil (Lápis do Avatar)
avatarUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const current = getActiveProfile();
            current.avatar = event.target.result; // Converte imagem para base64 local
            saveProfilesToStorage();
            updateProfileUI();
        };
        reader.readAsDataURL(file);
    }
});

// Inicializa a UI do Perfil
updateProfileUI();


// --- LÓGICA EXISTENTE FINANCEIRA (CHART.JS / FIREBASE) ---
if (typeToggleBtn) {
    typeToggleBtn.style.backgroundColor = "#10b981";
    typeToggleBtn.innerText = "Tipo: Entrada";
    typeToggleBtn.addEventListener('click', () => {
        isExpenseMode = !isExpenseMode;
        if (isExpenseMode) {
            typeToggleBtn.innerText = "Tipo: Retirada / Saque";
            typeToggleBtn.style.backgroundColor = "#ef4444";
        } else {
            typeToggleBtn.innerText = "Tipo: Entrada";
            typeToggleBtn.style.backgroundColor = "#10b981";
        }
    });
}

const updateCharts = (transactions) => {
    if (typeof Chart === 'undefined') return;
    const incomeTotal = transactions.filter(t => t.value > 0).reduce((acc, t) => acc + t.value, 0);
    const expenseTotal = Math.abs(transactions.filter(t => t.value < 0).reduce((acc, t) => acc + t.value, 0));

    const ctxCategory = document.getElementById('categoryChart')?.getContext('2d');
    if (ctxCategory) {
        if (categoryChartInstance) categoryChartInstance.destroy();
        categoryChartInstance = new Chart(ctxCategory, {
            type: 'doughnut',
            data: {
                labels: ['Entradas', 'Saídas'],
                datasets: [{ data: [incomeTotal, expenseTotal], backgroundColor: ['#10b981', '#ef4444'], borderWidth: 0 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }

    const ctxEvolution = document.getElementById('evolutionChart')?.getContext('2d');
    if (ctxEvolution) {
        if (evolutionChartInstance) evolutionChartInstance.destroy();
        let accumulatedBalance = 0;
        const balanceHistory = [];
        const changeValues = [];
        const timeLabels = [];

        transactions.forEach((t, index) => {
            accumulatedBalance += t.value;
            balanceHistory.push(accumulatedBalance);
            changeValues.push(t.value);
            if (t.createdAt) {
                try {
                    const date = t.createdAt.toDate ? t.createdAt.toDate() : new Date(t.createdAt);
                    timeLabels.push(date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}));
                } catch(e) { timeLabels.push(`Mov. ${index + 1}`); }
            } else { timeLabels.push(`Mov. ${index + 1}`); }
        });

        evolutionChartInstance = new Chart(ctxEvolution, {
            type: 'line',
            data: {
                labels: timeLabels.length ? timeLabels : ['Sem dados'],
                datasets: [{ label: 'Saldo Geral', data: balanceHistory.length ? balanceHistory : [0], borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', fill: true, tension: 0.25, pointRadius: 4, pointHoverRadius: 7 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                const idx = context.dataIndex;
                                return [`Saldo: R$ ${context.raw.toFixed(2)}`, `Alteração: ${changeValues[idx] >= 0 ? '+' : ''}R$ ${changeValues[idx].toFixed(2)}`];
                            }
                        }
                    }
                },
                scales: { y: { grid: { color: 'rgba(148, 163, 184, 0.1)' } }, x: { display: false } }
            }
        });
    }
};

const updateValues = (transactions) => {
    if (!totalIncomeEl || !totalExpensesEl || !totalBalanceEl) return;
    const incomes = transactions.filter(t => t.value > 0).reduce((acc, t) => acc + t.value, 0);
    const expenses = transactions.filter(t => t.value < 0).reduce((acc, t) => acc + t.value, 0);
    const balance = incomes + expenses;

    totalIncomeEl.innerText = `R$ ${incomes.toFixed(2)}`;
    totalExpensesEl.innerText = `R$ ${Math.abs(expenses).toFixed(2)}`;
    totalBalanceEl.innerText = `R$ ${balance.toFixed(2)}`;
    totalBalanceEl.style.color = balance >= 0 ? 'var(--income)' : 'var(--expense)';
    updateCharts(transactions);
};

const saveTransaction = async (e) => {
    e.preventDefault();
    const description = descInput.value.trim();
    let value = parseFloat(valueInput.value);
    if (description === "" || isNaN(value)) return;
    value = isExpenseMode ? -Math.abs(value) : Math.abs(value);
    try {
        await addDoc(transactionsRef, { description, value, createdAt: new Date() });
        form.reset();
    } catch (error) { console.error("Erro ao salvar: ", error); }
};

const renderTransactions = () => {
    onSnapshot(transactionsRef, (snapshot) => {
        list.innerHTML = "";
        let allTransactions = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            allTransactions.push({ description: data.description, value: data.value, createdAt: data.createdAt || null });
        });
        allTransactions.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return dateA - dateB;
        });
        allTransactions.forEach((t) => {
            const li = document.createElement('li');
            li.className = t.value >= 0 ? 'income' : 'expense';
            li.innerHTML = `${t.description} <span>R$ ${t.value.toFixed(2)}</span>`;
            list.appendChild(li);
        });
        updateValues(allTransactions);
    });
};

if (form) form.addEventListener('submit', saveTransaction);
renderTransactions();

// Navegação do Menu (SPA)
const menuButtons = document.querySelectorAll('.menu-btn');
const sections = document.querySelectorAll('.app-section');
menuButtons.forEach(button => button.addEventListener('click', (e) => {
    const targetSectionId = e.target.getAttribute('data-target');
    menuButtons.forEach(btn => btn.classList.remove('active'));
    sections.forEach(sec => sec.classList.remove('active'));
    e.target.classList.add('active');
    document.getElementById(targetSectionId)?.classList.add('active');
}));

// Alternador de Tema
const themeToggleBtn = document.querySelector('#theme-toggle');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    });
}
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-theme');