const SUPABASE_URL = "https://nxzvxluhetjktfohhuxy.supabase.co";
const SUPABASE_KEY = "sb_publishable_gmxU_wrHczTHQrxvyHx8wQ_JPRe0z2v";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const FinanceHelpers = window.HoraCertaFinance;

document.addEventListener('DOMContentLoaded', () => {
    // ================= STATE & CONFIGURATION =================
    const STORAGE_KEY_USERS = 'horacerta_users_data';
    const STORAGE_KEY_CURRENT = 'horacerta_current_user';
    
    // Contract mapping configurations
    const CONTRACT_CONFIGS = {
        'CLT': {
            weeklyRequiredMinutes: 44 * 60, // 2640 minutes
            dailyTargetMinutes: 9 * 60 // 9 hours = 540 minutes
        },
        'Estagiário': {
            weeklyRequiredMinutes: 30 * 60, // 1800 minutes
            dailyTargetMinutes: 6 * 60 // 6 hours = 360 minutes
        }
    };

    let users = loadUsersData();
    let currentUser = loadCurrentSession();
    const holidayCache = {};

    // ================= DOM ELEMENT SELECTORS =================
    // Views
    const viewAuth = document.getElementById('view-auth');
    const viewDashboardLayout = document.getElementById('view-dashboard-layout');
    
    // Auth Forms
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const linkGoToRegister = document.getElementById('link-go-to-register');
    const linkGoToLogin = document.getElementById('link-go-to-login');
    
    // Auth Inputs
    const loginNameInput = document.getElementById('login-name');
    const loginPasswordInput = document.getElementById('login-password');
    const registerNameInput = document.getElementById('register-name');
    const registerPasswordInput = document.getElementById('register-password');
    const registerContractSelect = document.getElementById('register-contract');
    
    // Sidebar / Header
    const navUserName = document.getElementById('nav-user-name');
    const navUserBadge = document.getElementById('nav-user-badge');
    const navUserAvatar = document.getElementById('nav-user-avatar');
    const btnLogout = document.getElementById('btn-logout');
    const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
    const headerPanelTitle = document.getElementById('header-panel-title');
    const headerPanelSubtitle = document.getElementById('header-panel-subtitle');
    const headerDate = document.getElementById('header-date');
    const sidebarNavItems = document.querySelectorAll('.sidebar-nav .nav-item');
    const panelSections = document.querySelectorAll('.panel-section');

    // Dashboard Panel Elements
    const mainBalanceCard = document.getElementById('main-balance-card');
    const balanceValueDisplay = document.getElementById('balance-value-display');
    const balanceMessageText = document.getElementById('balance-message-text');
    const balanceMetaText = document.getElementById('balance-meta-text');
    const statContractType = document.getElementById('stat-contract-type');
    const statHoursRequired = document.getElementById('stat-hours-required');
    const statHoursRequiredDaily = document.getElementById('stat-hours-required-daily');
    const statHoursWorked = document.getElementById('stat-hours-worked');
    const statHoursDiff = document.getElementById('stat-hours-diff');
    const statMonthlyRequirement = document.getElementById('stat-monthly-requirement');
    const statDiffIconContainer = document.getElementById('stat-diff-icon-container');

    // Register Form Elements
    const formRegisterHours = document.getElementById('form-register-hours');
    const pointDateInput = document.getElementById('point-date');
    const pointEntryInput = document.getElementById('point-entry');
    const pointLunchOutInput = document.getElementById('point-lunch-out');
    const pointLunchReturnInput = document.getElementById('point-lunch-return');
    const pointExitInput = document.getElementById('point-exit');
    const motivoSelect = document.getElementById('motivo');
    const justificativaTextarea = document.getElementById('justificativa');
    const liberacaoEmpresaCheckbox = document.getElementById('liberacao-empresa');
    const motivoField = document.getElementById('motivo-field');
    const justificativaField = document.getElementById('justificativa-field');
    const justificativaModal = document.getElementById('justificativa-modal');
    const observacaoModal = document.getElementById('observacao-modal');
    const modalObservationContent = document.getElementById('modal-observation-content');
    const btnAddJustificativa = document.getElementById('btn-add-justificativa');
    const btnContinueWithoutJustificativa = document.getElementById('btn-continue-without-justificativa');

    // History Panel Elements
    const tableBodyHistory = document.getElementById('table-body-history');
    const historyEmptyMessage = document.getElementById('history-empty-message');
    const filterMonthInput = document.getElementById('filter-month');
    const btnClearFilter = document.getElementById('btn-clear-filter');
    const btnEmptyStateGoRegister = document.getElementById('btn-empty-state-go-register');
    const historyCompetenceName = document.getElementById('history-competence-name');
    const historyCompetencePeriod = document.getElementById('history-competence-period');
    const dashboardWarningCard = document.getElementById('dashboard-warning-card');
    const dashboardWarningText = document.getElementById('dashboard-warning-text');
    const btnGoProfileFromDashboard = document.getElementById('btn-go-profile-from-dashboard');
    const financeSalaryValue = document.getElementById('finance-salary-value');
    const financeDayDiscount = document.getElementById('finance-day-discount');
    const financeMonthDiscount = document.getElementById('finance-month-discount');
    const financeNetSalary = document.getElementById('finance-net-salary');
    const formProfile = document.getElementById('form-profile');
    const profileSalaryInput = document.getElementById('profile-salary');
    const profileWorkloadSelect = document.getElementById('profile-workload');
    const profileCustomWorkloadGroup = document.getElementById('profile-custom-workload-group');
    const profileCustomWorkloadInput = document.getElementById('profile-custom-workload');

    // Analytics Panel Elements
    const svgChartContainer = document.getElementById('svg-chart-container');
    const metricTotalDays = document.getElementById('metric-total-days');
    const metricTotalWorked = document.getElementById('metric-total-worked');
    const metricTotalRequired = document.getElementById('metric-total-required');
    const metricOverallBalance = document.getElementById('metric-overall-balance');

    // ================= INITIALIZATION & ROUTING =================
    attachPasswordToggleListeners();
    initializePage();

    async function initializePage() {
        // Update header date
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        headerDate.textContent = new Date().toLocaleDateString('pt-BR', options);
        
        // Set default date picker to today
        const todayStr = new Date().toISOString().split('T')[0];
        pointDateInput.value = todayStr;
        
        // Router check
        if (currentUser) {
            try {
                await carregarPontosDoSupabase();
            } catch (err) {
                console.error("Erro ao sincronizar dados com Supabase no início:", err);
                if (currentUser) {
                    currentUser.entries = [];
                    setCurrentSession(currentUser);
                }
            }
            showDashboard();
        } else {
            showAuth();
        }
    }

    function showAuth() {
        viewDashboardLayout.classList.add('hidden');
        viewAuth.classList.remove('hidden');
        formLogin.classList.remove('hidden');
        formRegister.classList.add('hidden');
        clearAuthInputs();
    }

    function showDashboard() {
        viewAuth.classList.add('hidden');
        viewDashboardLayout.classList.remove('hidden');
        
        // Load navigation user info
        navUserName.textContent = currentUser.name;
        navUserBadge.textContent = currentUser.contractType;
        navUserAvatar.textContent = currentUser.name.charAt(0).toUpperCase();

        // Load dashboard stats
        updateDashboardData();
        renderFinanceSummary();
        updateProfileForm();
        
        // Reset panel view to summary
        switchPanel('panel-summary');
    }

    function getPasswordToggleIcon(isVisible) {
        return isVisible
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>'
            : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.7 5.55A9.67 9.67 0 0 1 12 5c6.5 0 10 7 10 7a14.5 14.5 0 0 1-2.1 3.16"></path><path d="M14.12 14.12A3 3 0 0 1 9.88 9.88"></path><path d="M6.61 6.61 4 4"></path><path d="m20 20-4.61-4.61"></path><path d="M3 3l18 18"></path></svg>';
    }

    function resetPasswordVisibility() {
        document.querySelectorAll('.password-toggle').forEach(button => {
            const input = document.getElementById(button.dataset.target);
            if (!input) return;
            input.type = 'password';
            button.setAttribute('aria-pressed', 'false');
            button.setAttribute('aria-label', 'Mostrar senha');
            button.innerHTML = getPasswordToggleIcon(false);
        });
    }

    function attachPasswordToggleListeners() {
        document.querySelectorAll('.password-toggle').forEach(button => {
            button.addEventListener('click', () => {
                const input = document.getElementById(button.dataset.target);
                if (!input) return;
                const isVisible = input.type === 'text';
                input.type = isVisible ? 'password' : 'text';
                button.setAttribute('aria-pressed', String(!isVisible));
                button.setAttribute('aria-label', isVisible ? 'Mostrar senha' : 'Ocultar senha');
                button.innerHTML = getPasswordToggleIcon(!isVisible);
            });
        });
    }

    function clearAuthInputs() {
        loginNameInput.value = '';
        loginPasswordInput.value = '';
        registerNameInput.value = '';
        registerPasswordInput.value = '';
        registerContractSelect.selectedIndex = 0;
        resetPasswordVisibility();
    }

    function showModal(modalElement) {
        if (modalElement) modalElement.classList.remove('hidden');
    }

    function hideModal(modalElement) {
        if (modalElement) modalElement.classList.add('hidden');
    }

    function highlightJustificativaFields() {
        [motivoField, justificativaField].forEach(field => field?.classList.add('highlight-justificativa'));
    }

    function clearJustificativaHighlight() {
        [motivoField, justificativaField].forEach(field => field?.classList.remove('highlight-justificativa'));
    }

    function resetJustificativaForm() {
        motivoSelect.value = '';
        justificativaTextarea.value = '';
        clearJustificativaHighlight();
    }

    document.querySelectorAll('[data-close-modal]').forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-close-modal');
            const target = document.getElementById(targetId);
            hideModal(target);
        });
    });

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-backdrop')) {
            hideModal(event.target);
        }
    });

    // ================= LOCALSTORAGE DATA ACCESS =================
    function loadUsersData() {
        const data = localStorage.getItem(STORAGE_KEY_USERS);
        return data ? JSON.parse(data) : {};
    }

    function saveUsersData() {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }

   function loadCurrentSession() {
    const data = localStorage.getItem(STORAGE_KEY_CURRENT);
    return data ? JSON.parse(data) : null;
}

function setCurrentSession(userData) {
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(userData));
    currentUser = userData;
}

function normalizeEntryId(entryId) {
    if (entryId === null || entryId === undefined) return '';
    return String(entryId);
}

async function carregarPontosDoSupabase() {
    if (!currentUser || !currentUser.id) {
        if (currentUser) {
            currentUser.entries = [];
            setCurrentSession(currentUser);
        }
        return;
    }

    await carregarPerfilDoSupabase();

    const { data, error } = await supabaseClient
        .from("registros_ponto")
        .select("*")
        .eq("usuario_id", currentUser.id)
        .order("data", { ascending: true });

    if (error) {
        showToast("Erro ao carregar pontos: " + error.message, "error");
        currentUser.entries = [];
        setCurrentSession(currentUser);
        throw error;
    }

    const filteredData = data.filter(ponto => {
        return !ponto.deleted && !ponto.is_deleted && !ponto.isDeleted && !ponto.deleted_at && !ponto.deletedAt;
    });

    currentUser.entries = filteredData.map(ponto => ({
        id: normalizeEntryId(ponto.id),
        date: ponto.data,
        entry: ponto.entrada,
        lunchOut: ponto.saida_almoco,
        lunchReturn: ponto.retorno_almoco,
        exit: ponto.saida,
        motivo: ponto.motivo || '',
        justificativa: ponto.justificativa || '',
        liberacaoEmpresa: Boolean(ponto.liberacao_empresa)
    }));

    setCurrentSession(currentUser);
    renderFinanceSummary();
    updateProfileForm();
}

    function clearCurrentSession() {
        localStorage.removeItem(STORAGE_KEY_CURRENT);
        currentUser = null;
    }

    async function carregarPerfilDoSupabase() {
        if (!currentUser || !currentUser.id) {
            return null;
        }

        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('id, salario, carga_horaria_mensal')
            .eq('id', currentUser.id)
            .maybeSingle();

        if (error) {
            console.error('Erro ao carregar perfil do usuário:', error);
            return null;
        }

        if (data) {
            currentUser.salario = data.salario ?? currentUser.salario ?? 0;
            currentUser.cargaHorariaMensal = data.carga_horaria_mensal ?? currentUser.cargaHorariaMensal ?? 0;
            setCurrentSession(currentUser);
        }

        return data;
    }

    async function salvarPerfilNoSupabase(payload) {
        if (!currentUser || !currentUser.id) {
            throw new Error('Usuário não autenticado.');
        }

        const perfilParaPersistir = {
            salario: Number(payload.salario) || 0,
            carga_horaria_mensal: Number(payload.carga_horaria_mensal) || 0
        };

        const { error } = await supabaseClient
            .from('usuarios')
            .update(perfilParaPersistir)
            .eq('id', currentUser.id);

        if (error) {
            throw error;
        }

        currentUser.salario = perfilParaPersistir.salario;
        currentUser.cargaHorariaMensal = perfilParaPersistir.carga_horaria_mensal;
        setCurrentSession(currentUser);
    }

    function getCurrentProfileConfig() {
        return {
            salario: Number(currentUser?.salario) || 0,
            cargaHorariaMensal: Number(currentUser?.cargaHorariaMensal) || 0
        };
    }

    function updateProfileForm() {
        if (!currentUser) {
            return;
        }

        const profileConfig = getCurrentProfileConfig();
        profileSalaryInput.value = profileConfig.salario || '';
        if (profileConfig.cargaHorariaMensal && [180, 200, 220].includes(profileConfig.cargaHorariaMensal)) {
            profileWorkloadSelect.value = String(profileConfig.cargaHorariaMensal);
            profileCustomWorkloadGroup.classList.add('hidden');
            profileCustomWorkloadInput.value = '';
        } else if (profileConfig.cargaHorariaMensal) {
            profileWorkloadSelect.value = 'custom';
            profileCustomWorkloadGroup.classList.remove('hidden');
            profileCustomWorkloadInput.value = String(profileConfig.cargaHorariaMensal);
        } else {
            profileWorkloadSelect.value = '';
            profileCustomWorkloadGroup.classList.add('hidden');
            profileCustomWorkloadInput.value = '';
        }
    }

    function setProfileWarningVisibility() {
        const hasProfile = FinanceHelpers && FinanceHelpers.isProfileConfigured(currentUser);
        if (dashboardWarningCard) {
            dashboardWarningCard.style.display = hasProfile ? 'none' : 'flex';
        }
        if (dashboardWarningText) {
            dashboardWarningText.textContent = hasProfile
                ? 'Perfil configurado. Os descontos automáticos já estão ativos.'
                : 'Cadastre seu salário e sua carga horária para habilitar o cálculo automático de descontos.';
        }
    }

    function calculateEntryDiscount(entry) {
        if (!currentUser || !FinanceHelpers || !FinanceHelpers.isProfileConfigured(currentUser)) {
            return 0;
        }

        if (isHoliday(entry.date) || entry.liberacaoEmpresa) {
            return 0;
        }

        const dailyTargetMinutes = getDailyTargetMinutes(entry.date, currentUser.contractType);
        const workedMinutes = calculateWorkedMinutes(entry);
        const motivo = (entry.motivo || '').toLowerCase();

        if (motivo.includes('falta')) {
            return FinanceHelpers.calculateFinancialDiscount(dailyTargetMinutes, currentUser.salario, currentUser.cargaHorariaMensal);
        }

        const negativeMinutes = Math.max(0, dailyTargetMinutes - workedMinutes);
        return FinanceHelpers.calculateFinancialDiscount(negativeMinutes, currentUser.salario, currentUser.cargaHorariaMensal);
    }

    function calculateMonthlyDiscount(entries) {
        return (entries || []).reduce((sum, entry) => sum + calculateEntryDiscount(entry), 0);
    }

    function calculateFinanceSummary(entries) {
        const profileConfig = getCurrentProfileConfig();
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEntry = (entries || []).find(ent => ent.date === todayStr);
        const dayDiscount = todayEntry ? calculateEntryDiscount(todayEntry) : 0;
        const monthDiscount = calculateMonthlyDiscount(entries || []);
        const netSalary = profileConfig.salario - monthDiscount;

        return {
            salary: profileConfig.salario,
            dayDiscount,
            monthDiscount,
            netSalary
        };
    }

    function renderFinanceSummary() {
        const summary = calculateFinanceSummary(currentUser?.entries || []);
        if (financeSalaryValue) financeSalaryValue.textContent = FinanceHelpers ? FinanceHelpers.formatCurrencyBRL(summary.salary) : 'R$ 0,00';
        if (financeDayDiscount) financeDayDiscount.textContent = FinanceHelpers ? FinanceHelpers.formatCurrencyBRL(summary.dayDiscount) : 'R$ 0,00';
        if (financeMonthDiscount) financeMonthDiscount.textContent = FinanceHelpers ? FinanceHelpers.formatCurrencyBRL(summary.monthDiscount) : 'R$ 0,00';
        if (financeNetSalary) financeNetSalary.textContent = FinanceHelpers ? FinanceHelpers.formatCurrencyBRL(summary.netSalary) : 'R$ 0,00';
        setProfileWarningVisibility();
    }

    // ================= SECURITY: CRYPTOGRAPHIC PASSWORD HASHING =================
    /**
     * Compute SHA-256 hash using browser native SubtleCrypto API.
     * Prevents storing plaintext passwords in localStorage.
     */
    async function hashPassword(password) {
        // Fallback for non-secure contexts (HTTP) or unsupported browsers
        if (!window.crypto || !window.crypto.subtle) {
            let hash = 5381;
            for (let i = 0; i < password.length; i++) {
                hash = (hash * 33) ^ password.charCodeAt(i);
            }
            return 'fallback_' + (hash >>> 0).toString(16);
        }
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // ================= TOAST NOTIFICATION SYSTEM =================
    function showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;

        const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        iconSvg.setAttribute('width', '20');
        iconSvg.setAttribute('height', '20');
        iconSvg.setAttribute('viewBox', '0 0 24 24');
        iconSvg.setAttribute('fill', 'none');
        iconSvg.setAttribute('stroke', 'currentColor');
        iconSvg.setAttribute('stroke-width', '2');
        iconSvg.setAttribute('stroke-linecap', 'round');
        iconSvg.setAttribute('stroke-linejoin', 'round');

        if (type === 'success') {
            const check = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            check.setAttribute('points', '20 6 9 17 4 12');
            iconSvg.appendChild(check);
        } else if (type === 'error') {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '12');
            circle.setAttribute('cy', '12');
            circle.setAttribute('r', '10');
            const line1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line1.setAttribute('x1', '15');
            line1.setAttribute('y1', '9');
            line1.setAttribute('x2', '9');
            line1.setAttribute('y2', '15');
            const line2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line2.setAttribute('x1', '9');
            line2.setAttribute('y1', '9');
            line2.setAttribute('x2', '15');
            line2.setAttribute('y2', '15');
            iconSvg.appendChild(circle);
            iconSvg.appendChild(line1);
            iconSvg.appendChild(line2);
        } else {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '12');
            circle.setAttribute('cy', '12');
            circle.setAttribute('r', '10');
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', '12');
            line.setAttribute('y1', '16');
            line.setAttribute('x2', '12');
            line.setAttribute('y2', '12');
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            dot.setAttribute('x1', '12');
            dot.setAttribute('y1', '8');
            dot.setAttribute('x2', '12.01');
            dot.setAttribute('y2', '8');
            iconSvg.appendChild(circle);
            iconSvg.appendChild(line);
            iconSvg.appendChild(dot);
        }

        const msgDiv = document.createElement('div');
        msgDiv.className = 'toast-message';
        msgDiv.textContent = message;

        toast.appendChild(iconSvg);
        toast.appendChild(msgDiv);
        container.appendChild(toast);

        // Remove toast after 4 seconds
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-10px) scale(0.9)';
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // ================= AUTHENTICATION FLOW =================
    // Switch between Login and Register
    linkGoToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        formLogin.classList.add('hidden');
        formRegister.classList.remove('hidden');
    });
    linkGoToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        formRegister.classList.add('hidden');
        formLogin.classList.remove('hidden');
    });

    const linkClearStorage = document.getElementById('link-clear-storage');
    if (linkClearStorage) {
        linkClearStorage.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem(STORAGE_KEY_USERS);
            localStorage.removeItem(STORAGE_KEY_CURRENT);
            users = {};
            currentUser = null;
            showToast('Dados locais limpos com sucesso. Você pode se cadastrar novamente!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }

    formProfile.addEventListener('submit', async (e) => {
        e.preventDefault();

        const salary = Number(profileSalaryInput.value);
        const workloadSelection = profileWorkloadSelect.value;
        let cargaHorariaMensal = 0;

        if (!profileSalaryInput.value || Number.isNaN(salary) || salary <= 0) {
            showToast('Informe um salário válido.', 'error');
            return;
        }

        if (!workloadSelection) {
            showToast('Selecione a carga horária mensal.', 'error');
            return;
        }

        if (workloadSelection === 'custom') {
            cargaHorariaMensal = Number(profileCustomWorkloadInput.value);
            if (!profileCustomWorkloadInput.value || Number.isNaN(cargaHorariaMensal) || cargaHorariaMensal <= 0) {
                showToast('Informe uma carga horária personalizada válida.', 'error');
                return;
            }
        } else {
            cargaHorariaMensal = Number(workloadSelection);
        }

        try {
            await salvarPerfilNoSupabase({
                salario: salary,
                carga_horaria_mensal: cargaHorariaMensal
            });
            renderFinanceSummary();
            updateDashboardData();
            renderHistoryTable();
            showToast('Perfil salvo com sucesso.', 'success');
        } catch (err) {
            console.error('Erro ao salvar perfil:', err);
            showToast('Erro ao salvar perfil: ' + err.message, 'error');
        }
    });

    profileWorkloadSelect.addEventListener('change', () => {
        if (profileWorkloadSelect.value === 'custom') {
            profileCustomWorkloadGroup.classList.remove('hidden');
        } else {
            profileCustomWorkloadGroup.classList.add('hidden');
            profileCustomWorkloadInput.value = '';
        }
    });

    btnGoProfileFromDashboard.addEventListener('click', () => {
        switchPanel('panel-profile');
        updateProfileForm();
    });

    // Handle Register Submit
    formRegister.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = registerNameInput.value.trim();
        const password = registerPasswordInput.value;
        const contractType = registerContractSelect.value;
        
        // Field validations
        if (!name) {
            showToast('Por favor, informe seu nome completo.', 'error');
            return;
        }
        if (password.length < 8) {
            showToast('A senha deve ter pelo menos 8 caracteres.', 'error');
            return;
        }
        if (!contractType) {
            showToast('Por favor, selecione o tipo de vínculo.', 'error');
            return;
        }
        try {
    const passwordHash = await hashPassword(password);

    const { data, error } = await supabaseClient
        .from("usuarios")
        .insert([
            {
                nome: name,
        senha: passwordHash,
        tipo_contrato: contractType
            }
        ]);

    if (error) {
        showToast("Erro ao cadastrar: " + error.message, "error");
        return;
    }

    showToast("Cadastro realizado com sucesso! Faça seu login.", "success");
    formRegister.classList.add("hidden");
    formLogin.classList.remove("hidden");
    clearAuthInputs();

} catch (err) {
    showToast("Erro ao realizar o cadastro. Tente novamente.", "error");
}
    });

    // Handle Login Submit
    formLogin.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = loginNameInput.value.trim();
        const password = loginPasswordInput.value;
        
        if (!name || !password) {
            showToast('Preencha todos os campos.', 'error');
            return;
        }

        const userKey = name.toLowerCase().replace(/\s+/g, '_');

      try {
    const calculatedHash = await hashPassword(password);

    const { data, error } = await supabaseClient
        .from("usuarios")
        .select("*")
        .eq("nome", name)
        .eq("senha", calculatedHash)
        .maybeSingle();

    if (error || !data) {
    showToast("Login inválido.", "error");
    return;
    }

   setCurrentSession({
    id: data.id,
    name: data.nome,
    senha: data.senha,
    contractType: data.tipo_contrato || "CLT",
    entries: []
});
currentUser = loadCurrentSession();

await carregarPontosDoSupabase();

showToast(`Bem-vindo, ${currentUser.name}!`, "success");
showDashboard();

} catch (err) {
    console.error("ERRO REAL DO LOGIN:", err);
    showToast("Erro ao validar dados de login: " + err.message, "error");
}
    });

    // Logout Action
    btnLogout.addEventListener('click', () => {
        clearCurrentSession();
        showToast('Sessão encerrada com sucesso.', 'info');
        showAuth();
    });

    // ================= DASHBOARD PANELS NAVIGATION =================
    // Toggle Sidebar in Mobile
    btnToggleSidebar.addEventListener('click', () => {
        viewDashboardLayout.classList.toggle('sidebar-open');
    });

    // Hide sidebar on clicking anywhere outside or nav items in mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 992 && 
            !viewDashboardLayout.contains(e.target) && 
            viewDashboardLayout.classList.contains('sidebar-open') && 
            e.target !== btnToggleSidebar) {
            viewDashboardLayout.classList.remove('sidebar-open');
        }
    });

    function isMobileViewport() {
        return window.matchMedia('(max-width: 992px)').matches;
    }

    function closeSidebarOnMobile() {
        if (isMobileViewport()) {
            viewDashboardLayout.classList.remove('sidebar-open');
        }
    }

    sidebarNavItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetPanelId = item.getAttribute('data-target');
            switchPanel(targetPanelId);
            closeSidebarOnMobile();
        });
    });

    function switchPanel(panelId) {
        // Close mobile sidebar when navigating panels
        if (viewDashboardLayout.classList.contains('sidebar-open')) {
            viewDashboardLayout.classList.remove('sidebar-open');
        }

        // Toggle active nav styling
        sidebarNavItems.forEach(btn => {
            if (btn.getAttribute('data-target') === panelId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Show correct panel section
        panelSections.forEach(section => {
            if (section.id === panelId) {
                section.classList.add('active-panel');
            } else {
                section.classList.remove('active-panel');
            }
        });

        // Set titles/subtitles dynamically
        switch (panelId) {
            case 'panel-summary':
                headerPanelTitle.textContent = 'Painel Geral';
                headerPanelSubtitle.textContent = 'Resumo geral do seu saldo e horas trabalhadas.';
                updateDashboardData();
                renderFinanceSummary();
                break;
            case 'panel-profile':
                headerPanelTitle.textContent = 'Perfil';
                headerPanelSubtitle.textContent = 'Gerencie seu salário e sua carga horária.';
                updateProfileForm();
                break;
            case 'panel-register':
                headerPanelTitle.textContent = 'Registrar Ponto';
                headerPanelSubtitle.textContent = 'Insira e salve seus registros diários de jornada de trabalho.';
                break;
            case 'panel-history':
                headerPanelTitle.textContent = 'Histórico de Pontos';
                headerPanelSubtitle.textContent = 'Consulte e filtre todos os seus horários registrados.';
                renderHistoryTable();
                break;
            case 'panel-charts':
                headerPanelTitle.textContent = 'Desempenho';
                headerPanelSubtitle.textContent = 'Acompanhe graficamente a evolução do seu saldo de horas.';
                renderAnalyticsPanel();
                break;
        }
    }

    // Direct transition helper from empty history states
    btnEmptyStateGoRegister.addEventListener('click', () => {
        switchPanel('panel-register');
    });

    // ================= CORE CALCULATIONS & STATS =================
    
    /**
     * Converts a time string (HH:MM) to total minutes from start of day.
     */
    function timeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    }

    /**
     * Converts total minutes to readable HH:MM formatting (un-signed).
     */
    function minutesToHoursString(totalMin) {
        const absMin = Math.abs(totalMin);
        const h = Math.floor(absMin / 60);
        const m = absMin % 60;
        return `${h}h ${m.toString().padStart(2, '0')}min`;
    }

    function getContractConfig(contractType) {
        return CONTRACT_CONFIGS[contractType] || CONTRACT_CONFIGS['CLT'];
    }

    function formatDateString(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function getEasterDate(year) {
        const a = year % 19;
        const b = Math.floor(year / 100);
        const c = year % 100;
        const d = Math.floor(b / 4);
        const e = b % 4;
        const f = Math.floor((b + 8) / 25);
        const g = Math.floor((b - f + 1) / 3);
        const h = (19 * a + b - d - g + 15) % 30;
        const i = Math.floor(c / 4);
        const k = c % 4;
        const l = (32 + 2 * e + 2 * i - h - k) % 7;
        const m = Math.floor((a + 11 * h + 22 * l) / 451);
        const month = Math.floor((h + l - 7 * m + 114) / 31);
        const day = ((h + l - 7 * m + 114) % 31) + 1;
        return new Date(year, month - 1, day);
    }

    function getBrazilHolidays(year) {
        if (holidayCache[year]) {
            return holidayCache[year];
        }

        const holidays = [];
        const fixedHolidays = [
            { month: 1, day: 1, name: 'Confraternização Universal' },
            { month: 4, day: 21, name: 'Tiradentes' },
            { month: 5, day: 1, name: 'Dia do Trabalho' },
            { month: 9, day: 7, name: 'Independência do Brasil' },
            { month: 10, day: 12, name: 'Nossa Senhora Aparecida' },
            { month: 11, day: 2, name: 'Finados' },
            { month: 11, day: 15, name: 'Proclamação da República' },
            { month: 11, day: 20, name: 'Consciência Negra' },
            { month: 12, day: 25, name: 'Natal' }
        ];

        fixedHolidays.forEach(holiday => {
            holidays.push({
                date: formatDateString(new Date(year, holiday.month - 1, holiday.day)),
                name: holiday.name
            });
        });

        const easter = getEasterDate(year);
        const carnival = new Date(easter);
        carnival.setDate(easter.getDate() - 47);
        const goodFriday = new Date(easter);
        goodFriday.setDate(easter.getDate() - 2);
        const corpusChristi = new Date(easter);
        corpusChristi.setDate(easter.getDate() + 60);

        holidays.push(
            { date: formatDateString(carnival), name: 'Carnaval' },
            { date: formatDateString(goodFriday), name: 'Sexta-feira Santa' },
            { date: formatDateString(corpusChristi), name: 'Corpus Christi' }
        );

        holidayCache[year] = holidays;
        return holidays;
    }

    function isHoliday(dateString) {
        if (!dateString) return false;
        const year = dateString.slice(0, 4);
        const holidays = getBrazilHolidays(Number(year));
        return holidays.some(holiday => holiday.date === dateString);
    }

    function getHolidayName(dateString) {
        if (!dateString || !isHoliday(dateString)) return null;
        const year = dateString.slice(0, 4);
        const holidays = getBrazilHolidays(Number(year));
        return holidays.find(holiday => holiday.date === dateString)?.name || null;
    }

    function getDailyTargetMinutes(dateString, contractType) {
        return isHoliday(dateString) ? 0 : getContractConfig(contractType).dailyTargetMinutes;
    }

    function getWeekRequiredMinutes(weekId, contractType) {
        const config = getContractConfig(contractType);
        const [year, week] = weekId.split('-W').map(Number);
        const januaryFourth = new Date(Date.UTC(year, 0, 4));
        const dayOfWeek = januaryFourth.getUTCDay() || 7;
        const weekStart = new Date(januaryFourth);
        weekStart.setUTCDate(januaryFourth.getUTCDate() + 1 - dayOfWeek + (week - 1) * 7);

        let holidayCount = 0;
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(weekStart);
            currentDate.setUTCDate(weekStart.getUTCDate() + i);
            const dateString = formatDateString(currentDate);
            if (isHoliday(dateString)) holidayCount += 1;
        }

        return Math.max(0, config.weeklyRequiredMinutes - holidayCount * config.dailyTargetMinutes);
    }

    /**
     * ISO week identifier (YYYY-Www) to group history points into calendar weeks.
     */
    function getWeekIdentifier(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const tempDate = new Date(date.valueOf());
        // Set to nearest Thursday: current date + 4 - current day number
        // Make Sunday's day number 7
        tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
        const UTCyear = tempDate.getFullYear();
        // Get first day of school year
        const firstThursday = new Date(UTCyear, 0, 4);
        firstThursday.setDate(firstThursday.getDate() + 4 - (firstThursday.getDay() || 7));
        // Calculate weeks between first Thursday and nearest Thursday
        const weekNumber = 1 + Math.ceil((tempDate - firstThursday) / 604800000);
        return `${UTCyear}-W${weekNumber.toString().padStart(2, '0')}`;
    }

    /**
     * Compute worked minutes for a specific single-day entry.
     * Calculated by (LunchOut - Entry) + (Exit - LunchReturn)
     */
    function calculateWorkedMinutes(entry) {
        const t1 = timeToMinutes(entry.entry);
        const t2 = timeToMinutes(entry.lunchOut);
        const t3 = timeToMinutes(entry.lunchReturn);
        const t4 = timeToMinutes(entry.exit);
        
        return (t2 - t1) + (t4 - t3);
    }

    function getDailyBalanceSummary(entry) {
        const config = getContractConfig(currentUser.contractType);
        const dailyTargetMinutes = getDailyTargetMinutes(entry.date, currentUser.contractType);
        const dailyWorkedMinutes = calculateWorkedMinutes(entry);
        const dailyBalanceMinutes = dailyWorkedMinutes - dailyTargetMinutes;
        const absBalanceMinutes = Math.abs(dailyBalanceMinutes);
        const likelyDelay = dailyBalanceMinutes < 0 && timeToMinutes(entry.entry) > 8 * 60;

        if (isHoliday(entry.date)) {
            return {
                tone: 'positive',
                label: 'Feriado',
                detail: `Dia de ${getHolidayName(entry.date) || 'feriado'} sem obrigação de jornada.`,
                debtMinutes: 0
            };
        }

        if (entry.liberacaoEmpresa) {
            return {
                tone: 'positive',
                label: 'Liberação da Empresa',
                detail: 'Dia liberado oficialmente pela empresa: jornada concluída sem pendências.',
                debtMinutes: 0
            };
        }

        if (dailyBalanceMinutes >= 0) {
            return {
                tone: 'positive',
                label: 'Em dia',
                detail: `Você acumulou ${minutesToHoursString(dailyBalanceMinutes)} a mais do que a meta diária.`,
                debtMinutes: 0
            };
        }

        return {
            tone: 'negative',
            label: 'Devendo horas do dia',
            detail: likelyDelay
                ? `Você ficou devendo ${minutesToHoursString(absBalanceMinutes)} e pode ter havido atraso de entrada.`
                : `Você ficou devendo ${minutesToHoursString(absBalanceMinutes)} nesta jornada.`,
            debtMinutes: absBalanceMinutes,
            likelyDelay
        };
    }

    /**
     * Processes user entries to compute accumulated balance, weekly stats, and returns.
     */
    function computeOverallMetrics() {
        if (!currentUser || !currentUser.entries || currentUser.entries.length === 0) {
            return {
                totalWorkedMinutes: 0,
                totalRequiredMinutes: 0,
                netBalanceMinutes: 0,
                weeksMap: {},
                sortedEntries: []
            };
        }

        const sortedEntries = [...currentUser.entries].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Find all unique weeks present in user entries
        const uniqueWeeks = new Set();
        let totalWorkedMinutes = 0;

        sortedEntries.forEach(entry => {
            const worked = calculateWorkedMinutes(entry);
            totalWorkedMinutes += worked;
            
            const weekId = getWeekIdentifier(entry.date);
            uniqueWeeks.add(weekId);
        });

        // Required hours based on weeks present, reducing weekly target when holidays occur
        const totalRequiredMinutes = Array.from(uniqueWeeks).reduce((sum, weekId) => {
            return sum + getWeekRequiredMinutes(weekId, currentUser.contractType);
        }, 0);
        const netBalanceMinutes = totalWorkedMinutes - totalRequiredMinutes;

        // Group worked hours by week for weekly stats
        const weeksMap = {};
        sortedEntries.forEach(entry => {
            const weekId = getWeekIdentifier(entry.date);
            if (!weeksMap[weekId]) {
                weeksMap[weekId] = 0;
            }
            weeksMap[weekId] += calculateWorkedMinutes(entry);
        });

        return {
            totalWorkedMinutes,
            totalRequiredMinutes,
            netBalanceMinutes,
            weeksMap,
            sortedEntries
        };
    }

    /**
     * Computes statistics for the current active week (if entries exist).
     */
    function computeCurrentWeekMetrics(weeksMap) {
        const todayStr = new Date().toISOString().split('T')[0];
        const currentWeekId = getWeekIdentifier(todayStr);
        const config = getContractConfig(currentUser.contractType);
        
        const workedMinutes = weeksMap[currentWeekId] || 0;
        const requiredMinutes = getWeekRequiredMinutes(currentWeekId, currentUser.contractType);
        const diffMinutes = workedMinutes - requiredMinutes;

        return {
            currentWeekId,
            workedMinutes,
            requiredMinutes,
            diffMinutes
        };
    }

    // ================= PANEL UPDATES & RENDERING =================

    /**
     * Updates all dashboard visual metrics cards.
     */
    function updateDashboardData() {
        const metrics = computeOverallMetrics();
        const config = getContractConfig(currentUser.contractType);
        
        // 1. Balance Main Display Card
        const balance = metrics.netBalanceMinutes;
        const formattedBalance = formatBalance(balance);
        const todayStr = new Date().toISOString().split('T')[0];
        const todayEntry = (currentUser.entries || []).find(ent => ent.date === todayStr);
        const todaySummary = todayEntry ? getDailyBalanceSummary(todayEntry) : {
            tone: 'warning',
            detail: 'Ainda não há registro para hoje.'
        };
        const holidayName = getHolidayName(todayStr);
        
        balanceValueDisplay.textContent = formattedBalance;
        
        // Clean card classes
        mainBalanceCard.classList.remove('positive-balance', 'negative-balance');
        
        if (balance >= 0) {
            mainBalanceCard.classList.add('positive-balance');
            balanceMessageText.textContent = `Você possui ${minutesToHoursString(balance)} positivas.`;
            balanceMetaText.textContent = todaySummary.tone === 'negative'
                ? todaySummary.detail
                : holidayName
                    ? `Hoje é feriado (${holidayName}) e a jornada não gera saldo negativo.`
                    : 'Seu saldo geral está acima da meta e o dia está dentro do esperado.';
        } else {
            mainBalanceCard.classList.add('negative-balance');
            balanceMessageText.textContent = `Você possui ${minutesToHoursString(balance)} negativas.`;
            balanceMetaText.textContent = todaySummary.tone === 'negative'
                ? todaySummary.detail
                : holidayName
                    ? `Hoje é feriado (${holidayName}) e a jornada não gera saldo negativo.`
                    : `Seu saldo geral está negativo. Você precisa compensar ${minutesToHoursString(Math.abs(balance))}.`;
        }

        // 2. Metrics Info Grid
        statContractType.textContent = currentUser.contractType;
        statHoursRequired.textContent = `${config.weeklyRequiredMinutes / 60}h`;
        statHoursRequiredDaily.textContent = `${config.dailyTargetMinutes / 60}h`;

        // Weekly current week details
        const weekMetrics = computeCurrentWeekMetrics(metrics.weeksMap);
        statHoursWorked.textContent = minutesToHoursString(weekMetrics.workedMinutes);

        // Difference stats
        const diff = weekMetrics.diffMinutes;
        statHoursDiff.textContent = formatBalance(diff);

        const monthlyRequirementValue = currentUser?.cargaHorariaMensal;
        if (statMonthlyRequirement) {
            if (monthlyRequirementValue && Number(monthlyRequirementValue) > 0) {
                statMonthlyRequirement.textContent = `${Number(monthlyRequirementValue)}h`;
            } else {
                statMonthlyRequirement.textContent = '--';
            }
        }
        
        // Remove prior colors
        statHoursDiff.classList.remove('text-success', 'text-danger');
        statDiffIconContainer.className = 'stat-icon';

        if (diff >= 0) {
            statHoursDiff.classList.add('text-success');
            statDiffIconContainer.classList.add('success');
            // Check icon SVG inside diff container
            statDiffIconContainer.replaceChildren();
            const svgArrowUp = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgArrowUp.setAttribute('width', '20');
            svgArrowUp.setAttribute('height', '20');
            svgArrowUp.setAttribute('viewBox', '0 0 24 24');
            svgArrowUp.setAttribute('fill', 'none');
            svgArrowUp.setAttribute('stroke', 'currentColor');
            svgArrowUp.setAttribute('stroke-width', '2');
            svgArrowUp.setAttribute('stroke-linecap', 'round');
            svgArrowUp.setAttribute('stroke-linejoin', 'round');
            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            polyline.setAttribute('points', '18 15 12 9 6 15');
            svgArrowUp.appendChild(polyline);
            statDiffIconContainer.appendChild(svgArrowUp);
        } else {
            statHoursDiff.classList.add('text-danger');
            statDiffIconContainer.classList.add('danger');
            // Check icon SVG inside diff container
            statDiffIconContainer.replaceChildren();
            const svgArrowDown = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svgArrowDown.setAttribute('width', '20');
            svgArrowDown.setAttribute('height', '20');
            svgArrowDown.setAttribute('viewBox', '0 0 24 24');
            svgArrowDown.setAttribute('fill', 'none');
            svgArrowDown.setAttribute('stroke', 'currentColor');
            svgArrowDown.setAttribute('stroke-width', '2');
            svgArrowDown.setAttribute('stroke-linecap', 'round');
            svgArrowDown.setAttribute('stroke-linejoin', 'round');
            const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
            polyline.setAttribute('points', '6 9 12 15 18 9');
            svgArrowDown.appendChild(polyline);
            statDiffIconContainer.appendChild(svgArrowDown);
        }

    }

    function formatBalance(minutes) {
        const sign = minutes >= 0 ? '+' : '-';
        const absMinutes = Math.abs(minutes);
        const h = Math.floor(absMinutes / 60);
        const m = absMinutes % 60;
        return `${sign}${h}h ${m.toString().padStart(2, '0')}min`;
    }

    // ================= REGISTER HOURS ENDPOINT =================
    // ================= REGISTER HOURS ENDPOINT =================
formRegisterHours.addEventListener('submit', async (e) => {
    e.preventDefault();

    const date = pointDateInput.value;
    const entry = pointEntryInput.value;
    const lunchOut = pointLunchOutInput.value;
    const lunchReturn = pointLunchReturnInput.value;
    const exit = pointExitInput.value;
    const motivo = motivoSelect.value;
    const justificativa = justificativaTextarea.value.trim();
    const liberacaoEmpresa = liberacaoEmpresaCheckbox.checked;

    console.log("CLICOU EM SALVAR REGISTRO");
    console.log("USUÁRIO ATUAL:", currentUser);
    console.log("DADOS DO PONTO:", {
        date,
        entry,
        lunchOut,
        lunchReturn,
        exit
    });

    if (!currentUser || !currentUser.id) {
        showToast("Erro: usuário sem ID. Saia e faça login novamente.", "error");
        console.error("currentUser sem id:", currentUser);
        return;
    }

    if (!date || !entry || !lunchOut || !lunchReturn || !exit) {
        showToast("Preencha todos os campos do horário.", "error");
        console.error("Campos faltando:", {
            date,
            entry,
            lunchOut,
            lunchReturn,
            exit
        });
        return;
    }

    const entryMin = timeToMinutes(entry);
    const lunchOutMin = timeToMinutes(lunchOut);
    const lunchReturnMin = timeToMinutes(lunchReturn);
    const exitMin = timeToMinutes(exit);

    if (lunchOutMin <= entryMin) {
        showToast("A saída para almoço deve ser posterior à entrada.", "error");
        return;
    }

    if (lunchReturnMin <= lunchOutMin) {
        showToast("O retorno do almoço deve ser posterior à saída de almoço.", "error");
        return;
    }

    if (exitMin <= lunchReturnMin) {
        showToast("A saída final deve ser posterior ao retorno do almoço.", "error");
        return;
    }

    const workedMinutes = calculateWorkedMinutes({ entry, lunchOut, lunchReturn, exit });
    const targetMinutes = getDailyTargetMinutes(date, currentUser.contractType);
    const shouldSuggestJustificativa = !liberacaoEmpresa && targetMinutes > 0 && workedMinutes < targetMinutes && (!motivo && !justificativa);

    if (shouldSuggestJustificativa) {
        highlightJustificativaFields();
        showModal(justificativaModal);
        return;
    }

    const registro = {
        usuario_id: currentUser.id,
        data: date,
        entrada: entry,
        saida_almoco: lunchOut,
        retorno_almoco: lunchReturn,
        saida: exit,
        motivo,
        justificativa,
        liberacao_empresa: liberacaoEmpresa
    };

    console.log("ENVIANDO PARA SUPABASE:", registro);

    const { data, error } = await supabaseClient
        .from("registros_ponto")
        .insert([registro])
        .select()
        .single();

    if (error) {
        console.error("ERRO REAL AO SALVAR NO SUPABASE:", error);
        showToast("Erro ao salvar ponto: " + error.message, "error");
        return;
    }

    console.log("SALVO NO SUPABASE:", data);

    const novoRegistroLocal = {
        id: String(data.id),
        date: data.data,
        entry: data.entrada,
        lunchOut: data.saida_almoco,
        lunchReturn: data.retorno_almoco,
        exit: data.saida,
        motivo: data.motivo || '',
        justificativa: data.justificativa || '',
        liberacaoEmpresa: Boolean(data.liberacao_empresa)
    };

    if (!currentUser.entries) {
        currentUser.entries = [];
    }

    currentUser.entries.push(novoRegistroLocal);
    setCurrentSession(currentUser);

    updateDashboardData();
    renderFinanceSummary();
    renderHistoryTable();

    showToast("Novo registro de ponto salvo com sucesso.", "success");

    pointEntryInput.value = "";
    pointLunchOutInput.value = "";
    pointLunchReturnInput.value = "";
    pointExitInput.value = "";
    liberacaoEmpresaCheckbox.checked = false;
    resetJustificativaForm();

    setTimeout(() => {
        switchPanel("panel-summary");
    }, 800);
});

    btnAddJustificativa.addEventListener('click', () => {
        hideModal(justificativaModal);
        motivoSelect.focus();
        highlightJustificativaFields();
    });

    btnContinueWithoutJustificativa.addEventListener('click', async () => {
        hideModal(justificativaModal);
        clearJustificativaHighlight();

        const date = pointDateInput.value;
        const entry = pointEntryInput.value;
        const lunchOut = pointLunchOutInput.value;
        const lunchReturn = pointLunchReturnInput.value;
        const exit = pointExitInput.value;

        const registro = {
            usuario_id: currentUser.id,
            data: date,
            entrada: entry,
            saida_almoco: lunchOut,
            retorno_almoco: lunchReturn,
            saida: exit,
            motivo: '',
            justificativa: '',
            liberacao_empresa: false
        };

        const { data, error } = await supabaseClient
            .from("registros_ponto")
            .insert([registro])
            .select()
            .single();

        if (error) {
            showToast("Erro ao salvar ponto: " + error.message, "error");
            return;
        }

        const novoRegistroLocal = {
            id: String(data.id),
            date: data.data,
            entry: data.entrada,
            lunchOut: data.saida_almoco,
            lunchReturn: data.retorno_almoco,
            exit: data.saida,
            motivo: data.motivo || '',
            justificativa: data.justificativa || ''
        };

        currentUser.entries.push(novoRegistroLocal);
        setCurrentSession(currentUser);
        updateDashboardData();
        renderFinanceSummary();
        renderHistoryTable();
        showToast("Registro salvo sem justificativa.", "info");
        resetJustificativaForm();
        pointEntryInput.value = '';
        pointLunchOutInput.value = '';
        pointLunchReturnInput.value = '';
        pointExitInput.value = '';
        setTimeout(() => switchPanel('panel-summary'), 800);
    });

    // ================= HISTORIC LIST RENDERING =================
    filterMonthInput.addEventListener('change', renderHistoryTable);
    btnClearFilter.addEventListener('click', () => {
        filterMonthInput.value = '';
        renderHistoryTable();
    });

    function getCompetenceIdentifierFromDate(date) {
        const [year, month, day] = date.split('-').map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day)) {
            return null;
        }

        const competenceMonth = day >= 26 ? month + 1 : month;
        const competenceYear = day >= 26 && competenceMonth === 13 ? year + 1 : year;
        const normalizedMonth = competenceMonth === 13 ? 1 : competenceMonth;

        return `${competenceYear}-${String(normalizedMonth).padStart(2, '0')}`;
    }

    function getCompetenceRange(competenceId) {
        const [year, month] = competenceId.split('-').map(Number);
        if (isNaN(year) || isNaN(month)) {
            return null;
        }

        const endDate = new Date(year, month - 1, 25);
        const startDate = new Date(year, month - 2, 26);

        const toIso = date => date.toISOString().split('T')[0];
        return {
            start: toIso(startDate),
            end: toIso(endDate)
        };
    }

    function getCompetenceLabel(competenceId) {
        if (!competenceId) return 'Todas as competências';
        const [year, month] = competenceId.split('-');
        const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
        return `Competência: ${monthNames[Number(month) - 1]}/${year}`;
    }

    function getCompetencePeriodLabel(competenceId) {
        if (!competenceId) return 'Período: Todos os registros';
        const range = getCompetenceRange(competenceId);
        if (!range) return 'Período: —';
        return `Período: ${range.start.split('-').reverse().join('/')} a ${range.end.split('-').reverse().join('/')}`;
    }

    function populateHistoryCompetenceOptions() {
        const selectedValue = filterMonthInput.value || '';
        const competenceSet = new Set();

        if (currentUser.entries) {
            currentUser.entries.forEach(entry => {
                if (entry.date) {
                    const competenceId = getCompetenceIdentifierFromDate(entry.date);
                    if (competenceId) {
                        competenceSet.add(competenceId);
                    }
                }
            });
        }

        const competenceIds = Array.from(competenceSet).sort((a, b) => b.localeCompare(a));
        filterMonthInput.replaceChildren();

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Todas as competências';
        filterMonthInput.appendChild(defaultOption);

        competenceIds.forEach(competenceId => {
            const option = document.createElement('option');
            option.value = competenceId;
            const [year, month] = competenceId.split('-');
            const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
            option.textContent = `${monthNames[Number(month) - 1]}/${year}`;
            filterMonthInput.appendChild(option);
        });

        filterMonthInput.value = competenceIds.includes(selectedValue) ? selectedValue : '';
    }

    function getEntriesForCompetence(entries, competenceId) {
        if (!competenceId) return entries;
        const range = getCompetenceRange(competenceId);
        if (!range) return entries;
        return entries.filter(ent => ent.date >= range.start && ent.date <= range.end);
    }

    function updateHistoryCompetenceSummary(competenceId) {
        historyCompetenceName.textContent = getCompetenceLabel(competenceId);
        historyCompetencePeriod.textContent = getCompetencePeriodLabel(competenceId);
    }

    function renderHistoryTable() {
        populateHistoryCompetenceOptions();
        updateHistoryCompetenceSummary(filterMonthInput.value);
        tableBodyHistory.replaceChildren();
        
        if (!currentUser.entries || currentUser.entries.length === 0) {
            historyEmptyMessage.classList.remove('hidden');
            return;
        }

        const selectedCompetence = filterMonthInput.value;
        
        // Filter and sort descending by date based on competence range
        let filteredEntries = getEntriesForCompetence([...currentUser.entries], selectedCompetence);
        filteredEntries.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filteredEntries.length === 0) {
            historyEmptyMessage.classList.remove('hidden');
            return;
        }

        historyEmptyMessage.classList.add('hidden');

        filteredEntries.forEach(entry => {
            const tr = document.createElement('tr');
            
            // Format date to local standard DD/MM/YYYY
            const tdDate = document.createElement('td');
            const [year, month, day] = entry.date.split('-');
            tdDate.textContent = `${day}/${month}/${year}`;
            tr.appendChild(tdDate);

            // Time columns
            const tdEntry = document.createElement('td');
            tdEntry.textContent = entry.entry;
            tr.appendChild(tdEntry);

            const tdLunchOut = document.createElement('td');
            tdLunchOut.textContent = entry.lunchOut;
            tr.appendChild(tdLunchOut);

            const tdLunchReturn = document.createElement('td');
            tdLunchReturn.textContent = entry.lunchReturn;
            tr.appendChild(tdLunchReturn);

            const tdExit = document.createElement('td');
            tdExit.textContent = entry.exit;
            tr.appendChild(tdExit);

            // Daily Total column
            const tdWorked = document.createElement('td');
            const dailyWorkedMinutes = calculateWorkedMinutes(entry);
            const dailyTargetMinutes = getDailyTargetMinutes(entry.date, currentUser.contractType);
            const dailyBalance = dailyWorkedMinutes - dailyTargetMinutes;
            const absBalanceMin = Math.abs(dailyBalance);
            
            const durationSpan = document.createElement('span');
            durationSpan.textContent = isHoliday(entry.date) ? '00h 00min' : minutesToHoursString(dailyWorkedMinutes);
            
            const statusBadge = document.createElement('div');
            if (isHoliday(entry.date)) {
                statusBadge.className = 'history-status-badge positive';
                statusBadge.textContent = `Feriado • ${getHolidayName(entry.date) || 'Sem obrigação'}`;
            } else {
                statusBadge.className = `history-status-badge ${dailyBalance >= 0 ? 'positive' : 'negative'}`;
                const badgeText = dailyBalance >= 0
                    ? `Adiantado ${minutesToHoursString(absBalanceMin)}`
                    : `Devendo ${minutesToHoursString(absBalanceMin)}`;
                statusBadge.textContent = dailyBalance < 0 && timeToMinutes(entry.entry) > 8 * 60
                    ? `${badgeText} • possível atraso`
                    : badgeText;
            }
            
            const valueWrap = document.createElement('div');
            valueWrap.className = 'history-hours-cell';
            valueWrap.appendChild(durationSpan);
            valueWrap.appendChild(statusBadge);
            tdWorked.appendChild(valueWrap);
            tr.appendChild(tdWorked);

            // Discount column
            const tdDiscount = document.createElement('td');
            const discountValue = calculateEntryDiscount(entry);
            tdDiscount.textContent = FinanceHelpers ? FinanceHelpers.formatCurrencyBRL(discountValue) : 'R$ 0,00';
            tr.appendChild(tdDiscount);

            // Observation column
            const tdObservation = document.createElement('td');
            const btnViewObservation = document.createElement('button');
            btnViewObservation.className = 'view-observation-btn';
            btnViewObservation.textContent = entry.liberacaoEmpresa ? '🏢 Ver' : '📝 Ver';
            btnViewObservation.addEventListener('click', () => {
                const text = entry.justificativa?.trim();
                const motivoText = entry.motivo?.trim() || 'Não informado';
                if (entry.liberacaoEmpresa) {
                    modalObservationContent.innerHTML = '<p><strong>Tipo:</strong> Liberação da Empresa</p><p><strong>Motivo:</strong> Liberação da Empresa</p>';
                } else if (text) {
                    modalObservationContent.innerHTML = `<p><strong>Motivo:</strong> ${motivoText}</p><p><strong>Justificativa:</strong> ${text}</p>`;
                } else {
                    modalObservationContent.innerHTML = '<p>Nenhuma observação registrada.</p>';
                }
                showModal(observacaoModal);
            });
            tdObservation.appendChild(btnViewObservation);
            tr.appendChild(tdObservation);

            // Actions column
            const tdActions = document.createElement('td');
            const btnDelete = document.createElement('button');
            btnDelete.className = 'btn-danger btn';
            btnDelete.style.padding = '4px 8px';
            btnDelete.style.fontSize = '0.75rem';
            btnDelete.textContent = 'Excluir';
            btnDelete.addEventListener('click', () => {
                deleteHistoryEntry(entry.id);
            });
            tdActions.appendChild(btnDelete);
            tr.appendChild(tdActions);

            tableBodyHistory.appendChild(tr);
        });
    }

    async function deleteHistoryEntry(entryId) {
        console.log('Tentando excluir registro de ponto:', entryId);
        if (!currentUser || !currentUser.id) {
            showToast('Erro: usuário não autenticado para exclusão.', 'error');
            console.error('deleteHistoryEntry falhou: currentUser inválido', currentUser);
            return;
        }

        const normalizedEntryId = normalizeEntryId(entryId);
        const deleteId = /^\\d+$/.test(normalizedEntryId) ? Number(normalizedEntryId) : normalizedEntryId;
        console.log('ID enviado para Supabase DELETE:', deleteId);

        const response = await supabaseClient
            .from('registros_ponto')
            .delete()
            .select()
            .eq('id', deleteId)
            .eq('usuario_id', currentUser.id);

        console.log('Resposta do Supabase DELETE:', response);

        const { data, error } = response;

        if (error) {
            showToast('Erro ao excluir registro: ' + error.message, 'error');
            console.error('Supabase DELETE error:', error);
            return;
        }

        if (!data || data.length === 0) {
            showToast('Exclusão não realizada: registro não encontrado ou permissão negada.', 'error');
            console.error('Supabase DELETE sem dados retornados, possível ID incorreto ou RLS bloqueando a exclusão.', { deleteId, response });
            return;
        }

        await carregarPontosDoSupabase();
        updateDashboardData();
        renderFinanceSummary();
        renderHistoryTable();

        const userKey = currentUser.name.toLowerCase().replace(/\s+/g, '_');
        users[userKey] = currentUser;
        saveUsersData();
        setCurrentSession(currentUser);

        showToast('Registro excluído do histórico.', 'success');
    }

    // ================= ANALYTICS & CUSTOM SVG CHART =================
    function renderAnalyticsPanel() {
        const metrics = computeOverallMetrics();
        const config = CONTRACT_CONFIGS[currentUser.contractType] || CONTRACT_CONFIGS['CLT'];

        // Aggregate total parameters
        const totalDays = metrics.sortedEntries.length;
        metricTotalDays.textContent = totalDays;
        
        metricTotalWorked.textContent = minutesToHoursString(metrics.totalWorkedMinutes);
        metricTotalRequired.textContent = minutesToHoursString(metrics.totalRequiredMinutes);
        
        const balance = metrics.netBalanceMinutes;
        metricOverallBalance.textContent = formatBalance(balance);
        
        metricOverallBalance.className = 'metric-num font-semibold';
        if (balance >= 0) {
            metricOverallBalance.classList.add('text-success');
        } else {
            metricOverallBalance.classList.add('text-danger');
        }

        // Draw the SVG evolution chart
        drawSVGChart(metrics.sortedEntries, config.dailyTargetMinutes);
    }

    /**
     * Generates a completely secure, dynamic, interactive SVG line graph.
     * Prevents security vulnerabilities of external graphing library scripts.
     */
    function drawSVGChart(entries, dailyTargetMinutes) {
        svgChartContainer.replaceChildren();

        if (entries.length === 0) {
            const emptyLabel = document.createElement('div');
            emptyLabel.className = 'text-secondary';
            emptyLabel.textContent = 'Adicione registros de ponto para ver o gráfico de evolução.';
            svgChartContainer.appendChild(emptyLabel);
            return;
        }

        // Get container dimensions
        const width = svgChartContainer.clientWidth || 450;
        const height = 300;
        const paddingLeft = 50;
        const paddingRight = 30;
        const paddingTop = 40;
        const paddingBottom = 40;

        const chartWidth = width - paddingLeft - paddingRight;
        const chartHeight = height - paddingTop - paddingBottom;

        // Compute cumulative daily balances
        let currentCumulative = 0;
        const dataPoints = [];

        entries.forEach(entry => {
            const worked = calculateWorkedMinutes(entry);
            const dailyDiff = worked - dailyTargetMinutes;
            currentCumulative += dailyDiff;
            
            dataPoints.push({
                date: entry.date,
                balanceMinutes: currentCumulative
            });
        });

        // Compute bounds
        const balances = dataPoints.map(p => p.balanceMinutes);
        const maxVal = Math.max(0, ...balances);
        const minVal = Math.min(0, ...balances);
        
        const range = maxVal - minVal === 0 ? 120 : (maxVal - minVal) * 1.25; // 25% padding
        const yCenterOffset = (maxVal - minVal) === 0 ? 60 : maxVal;
        
        // Convert to SVG points
        const numPoints = dataPoints.length;
        const points = [];

        dataPoints.forEach((point, i) => {
            // Distribute points evenly along X axis
            const x = paddingLeft + (numPoints > 1 ? (i / (numPoints - 1)) * chartWidth : chartWidth / 2);
            // Translate balance to Y coordinate
            const yNormalized = (yCenterOffset - point.balanceMinutes) / range;
            const y = paddingTop + yNormalized * chartHeight;
            
            points.push({ x, y, val: point.balanceMinutes, date: point.date });
        });

        // Initialize SVG element
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        // Define gradients for areas
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const linearGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        linearGradient.setAttribute('id', 'chart-gradient');
        linearGradient.setAttribute('x1', '0');
        linearGradient.setAttribute('y1', '0');
        linearGradient.setAttribute('x2', '0');
        linearGradient.setAttribute('y2', '1');

        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop1.setAttribute('offset', '0%');
        stop1.setAttribute('stop-color', 'var(--color-primary)');
        stop1.setAttribute('stop-opacity', '0.35');

        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        stop2.setAttribute('offset', '100%');
        stop2.setAttribute('stop-color', 'var(--color-primary)');
        stop2.setAttribute('stop-opacity', '0.00');

        linearGradient.appendChild(stop1);
        linearGradient.appendChild(stop2);
        defs.appendChild(linearGradient);
        svg.appendChild(defs);

        // Draw grid lines and Y axis scale
        const numGridLines = 5;
        for (let i = 0; i < numGridLines; i++) {
            const gridVal = minVal + (range * (i / (numGridLines - 1)));
            const yNormalized = (yCenterOffset - gridVal) / range;
            const y = paddingTop + yNormalized * chartHeight;

            // Grid line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', paddingLeft);
            line.setAttribute('y1', y);
            line.setAttribute('x2', width - paddingRight);
            line.setAttribute('y2', y);
            line.setAttribute('class', gridVal === 0 ? 'chart-axis-line' : 'chart-grid-line');
            svg.appendChild(line);

            // Axis Text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', paddingLeft - 8);
            text.setAttribute('y', y + 4);
            text.setAttribute('class', 'chart-axis-text');
            text.setAttribute('text-anchor', 'end');
            text.textContent = formatBalance(Math.round(gridVal));
            svg.appendChild(text);
        }

        // Generate Path String
        if (points.length > 0) {
            let pathD = `M ${points[0].x} ${points[0].y}`;
            let areaD = `M ${points[0].x} ${points[0].y}`;
            
            for (let i = 1; i < points.length; i++) {
                pathD += ` L ${points[i].x} ${points[i].y}`;
                areaD += ` L ${points[i].x} ${points[i].y}`;
            }

            // Close the area path to the horizontal bottom of graph
            areaD += ` L ${points[points.length - 1].x} ${height - paddingBottom}`;
            areaD += ` L ${points[0].x} ${height - paddingBottom} Z`;

            // Draw Area
            const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            areaPath.setAttribute('d', areaD);
            areaPath.setAttribute('class', 'chart-line-area');
            svg.appendChild(areaPath);

            // Draw Path Line
            const linePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            linePath.setAttribute('d', pathD);
            linePath.setAttribute('class', 'chart-line');
            svg.appendChild(linePath);
        }

        // Draw X-axis date labels (limit to maximum 6 labels for visibility)
        const xStep = Math.max(1, Math.floor(points.length / 5));
        points.forEach((point, i) => {
            if (i % xStep === 0 || i === points.length - 1) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', point.x);
                text.setAttribute('y', height - paddingBottom + 20);
                text.setAttribute('class', 'chart-axis-text');
                text.setAttribute('text-anchor', 'middle');
                
                // Format YYYY-MM-DD -> DD/MM
                const [, m, d] = point.date.split('-');
                text.textContent = `${d}/${m}`;
                svg.appendChild(text);
            }

            // Interactive Data points (Circles)
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', point.x);
            circle.setAttribute('cy', point.y);
            circle.setAttribute('r', '5');
            circle.setAttribute('class', 'chart-point');

            // Interactive Tooltip Elements
            const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
            const [, m, d] = point.date.split('-');
            title.textContent = `Data: ${d}/${m}\nSaldo: ${formatBalance(point.val)}`;
            circle.appendChild(title);

            svg.appendChild(circle);
        });

        svgChartContainer.appendChild(svg);
    }
    });
