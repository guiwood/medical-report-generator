// Dashboard JavaScript
let supabase;
let currentUser = null;
let userProfile = null;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    checkAuthAndLoadDashboard();
    setupEventListeners();
});

async function checkAuthAndLoadDashboard() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            // User not logged in, redirect to login
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = session.user;
        await loadUserProfile();
        await loadDashboardData();
        
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = 'login.html';
    }
}

async function loadUserProfile() {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
        }
        
        userProfile = data;
        
        // Update UI with user name
        const userName = userProfile?.full_name || currentUser.email;
        document.getElementById('userName').textContent = userName;
        
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('userName').textContent = currentUser.email;
    }
}

async function loadDashboardData() {
    await Promise.all([
        loadTemplates(),
        loadRecentReports(),
        loadStatistics()
    ]);
}

async function loadTemplates() {
    const templatesList = document.getElementById('templatesList');
    const emptyTemplates = document.getElementById('emptyTemplates');
    
    try {
        const { data: templates, error } = await supabase
            .from('templates')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        if (templates && templates.length > 0) {
            templatesList.innerHTML = '';
            templates.forEach(template => {
                templatesList.appendChild(createTemplateItem(template));
            });
            emptyTemplates.style.display = 'none';
        } else {
            templatesList.innerHTML = '';
            emptyTemplates.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error loading templates:', error);
        templatesList.innerHTML = '<div class="loading">Erro ao carregar templates</div>';
    }
}

async function loadRecentReports() {
    const reportsList = document.getElementById('recentReportsList');
    const emptyReports = document.getElementById('emptyReports');
    
    try {
        const { data: reports, error } = await supabase
            .from('reports')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (error) throw error;
        
        if (reports && reports.length > 0) {
            reportsList.innerHTML = '';
            reports.forEach(report => {
                reportsList.appendChild(createReportItem(report));
            });
            emptyReports.style.display = 'none';
        } else {
            reportsList.innerHTML = '';
            emptyReports.style.display = 'block';
        }
        
    } catch (error) {
        console.error('Error loading reports:', error);
        reportsList.innerHTML = '<div class="loading">Erro ao carregar relatórios</div>';
    }
}

async function loadStatistics() {
    try {
        // Load templates count
        const { count: templatesCount } = await supabase
            .from('templates')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id);
        
        // Load reports count
        const { count: reportsCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id);
        
        // Load this month reports
        const firstDayOfMonth = new Date();
        firstDayOfMonth.setDate(1);
        firstDayOfMonth.setHours(0, 0, 0, 0);
        
        const { count: thisMonthCount } = await supabase
            .from('reports')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', currentUser.id)
            .gte('created_at', firstDayOfMonth.toISOString());
        
        // Update UI
        document.getElementById('totalTemplates').textContent = templatesCount || 0;
        document.getElementById('totalReports').textContent = reportsCount || 0;
        document.getElementById('thisMonthReports').textContent = thisMonthCount || 0;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

function createTemplateItem(template) {
    const item = document.createElement('div');
    item.className = 'template-item';
    item.innerHTML = `
        <div class="template-name">${template.name}</div>
        <div class="template-description">${template.description || 'Sem descrição'}</div>
        <div class="template-actions">
            <button class="btn-small primary" onclick="useTemplate('${template.id}')">Usar</button>
            <button class="btn-small secondary" onclick="editTemplate('${template.id}')">Editar</button>
            <button class="btn-small danger" onclick="deleteTemplate('${template.id}')">Excluir</button>
        </div>
    `;
    return item;
}

function createReportItem(report) {
    const item = document.createElement('div');
    item.className = 'report-item';
    const date = new Date(report.created_at).toLocaleDateString('pt-BR');
    item.innerHTML = `
        <div class="report-name">${report.patient_name}</div>
        <div class="report-date">${date}</div>
        <div class="report-actions">
            <button class="btn-small primary" onclick="viewReport('${report.id}')">Ver</button>
            <button class="btn-small danger" onclick="deleteReport('${report.id}')">Excluir</button>
        </div>
    `;
    return item;
}

function setupEventListeners() {
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Quick actions
    document.getElementById('newReportBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    
    document.getElementById('newTemplateBtn').addEventListener('click', showTemplateModal);
    document.getElementById('createFirstTemplate').addEventListener('click', showTemplateModal);
    document.getElementById('profileBtn').addEventListener('click', showProfileModal);
    
    // Refresh buttons
    document.getElementById('refreshTemplates').addEventListener('click', loadTemplates);
    document.getElementById('refreshReports').addEventListener('click', loadRecentReports);
    
    // Modal controls
    document.getElementById('closeModal').addEventListener('click', hideTemplateModal);
    document.getElementById('cancelTemplate').addEventListener('click', hideTemplateModal);
    document.getElementById('templateForm').addEventListener('submit', saveTemplate);
    
    document.getElementById('closeProfileModal').addEventListener('click', hideProfileModal);
    document.getElementById('cancelProfile').addEventListener('click', hideProfileModal);
    document.getElementById('profileForm').addEventListener('submit', saveProfile);
    
    // Close modals when clicking outside
    document.getElementById('templateModal').addEventListener('click', (e) => {
        if (e.target.id === 'templateModal') {
            hideTemplateModal();
        }
    });
    
    document.getElementById('profileModal').addEventListener('click', (e) => {
        if (e.target.id === 'profileModal') {
            hideProfileModal();
        }
    });
}

async function logout() {
    try {
        await supabase.auth.signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

function showTemplateModal() {
    document.getElementById('templateModal').style.display = 'flex';
    document.getElementById('templateName').focus();
}

function hideTemplateModal() {
    document.getElementById('templateModal').style.display = 'none';
    document.getElementById('templateForm').reset();
}

function showProfileModal() {
    // Pre-fill profile form
    if (userProfile) {
        document.getElementById('profileName').value = userProfile.full_name || '';
        document.getElementById('profileDoctorName').value = userProfile.doctor_name || '';
        document.getElementById('profileCRM').value = userProfile.crm_number || '';
        document.getElementById('profileCRMState').value = userProfile.crm_state || '';
        document.getElementById('profileRQE').value = userProfile.rqe_number || '';
    }
    
    // Setup number formatting
    setupProfileNumberFormatting();
    
    document.getElementById('profileModal').style.display = 'flex';
}

function hideProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
    document.getElementById('profileForm').reset();
}

async function saveTemplate(e) {
    e.preventDefault();
    
    const name = document.getElementById('templateName').value;
    const description = document.getElementById('templateDescription').value;
    
    try {
        const { error } = await supabase
            .from('templates')
            .insert({
                user_id: currentUser.id,
                name: name,
                description: description,
                template_data: {} // Empty template for now
            });
        
        if (error) throw error;
        
        alert('Template criado com sucesso!');
        hideTemplateModal();
        loadTemplates();
        loadStatistics();
        
    } catch (error) {
        console.error('Error saving template:', error);
        alert('Erro ao criar template: ' + error.message);
    }
}

async function saveProfile(e) {
    e.preventDefault();
    
    const fullName = document.getElementById('profileName').value;
    const doctorName = document.getElementById('profileDoctorName').value;
    const crmNumber = document.getElementById('profileCRM').value;
    const crmState = document.getElementById('profileCRMState').value;
    const rqeNumber = document.getElementById('profileRQE').value;
    
    try {
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: currentUser.id,
                email: currentUser.email,
                full_name: fullName,
                doctor_name: doctorName,
                crm_number: crmNumber,
                crm_state: crmState,
                rqe_number: rqeNumber,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        alert('Perfil atualizado com sucesso!');
        hideProfileModal();
        await loadUserProfile();
        
    } catch (error) {
        console.error('Error saving profile:', error);
        alert('Erro ao salvar perfil: ' + error.message);
    }
}

async function useTemplate(templateId) {
    // Store template ID in localStorage and redirect to report generator
    localStorage.setItem('selectedTemplateId', templateId);
    window.location.href = 'index.html';
}

async function editTemplate(templateId) {
    // TODO: Implement template editing
    alert('Funcionalidade de edição em desenvolvimento');
}

async function deleteTemplate(templateId) {
    if (!confirm('Tem certeza que deseja excluir este template?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', templateId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        alert('Template excluído com sucesso!');
        loadTemplates();
        loadStatistics();
        
    } catch (error) {
        console.error('Error deleting template:', error);
        alert('Erro ao excluir template: ' + error.message);
    }
}

async function viewReport(reportId) {
    // TODO: Implement report viewing
    alert('Funcionalidade de visualização em desenvolvimento');
}

async function deleteReport(reportId) {
    if (!confirm('Tem certeza que deseja excluir este relatório?')) {
        return;
    }
    
    try {
        const { error } = await supabase
            .from('reports')
            .delete()
            .eq('id', reportId)
            .eq('user_id', currentUser.id);
        
        if (error) throw error;
        
        alert('Relatório excluído com sucesso!');
        loadRecentReports();
        loadStatistics();
        
    } catch (error) {
        console.error('Error deleting report:', error);
        alert('Erro ao excluir relatório: ' + error.message);
    }
}

function setupProfileNumberFormatting() {
    // Format CRM number
    const crmInput = document.getElementById('profileCRM');
    if (crmInput) {
        crmInput.addEventListener('input', function() {
            formatNumberInput(this);
        });
    }
    
    // Format RQE number
    const rqeInput = document.getElementById('profileRQE');
    if (rqeInput) {
        rqeInput.addEventListener('input', function() {
            formatNumberInput(this);
        });
    }
}

function formatNumberInput(input) {
    // Remove all non-digits
    let value = input.value.replace(/\D/g, '');
    
    // Limit to 6 digits
    if (value.length > 6) {
        value = value.substring(0, 6);
    }
    
    // Add dot separator for thousands
    if (value.length > 3) {
        value = value.substring(0, value.length - 3) + '.' + value.substring(value.length - 3);
    }
    
    input.value = value;
}