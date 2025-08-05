// Authentication JavaScript
let supabase;

// Initialize Supabase client
document.addEventListener('DOMContentLoaded', function() {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    // Check if user is already logged in
    checkAuthState();
    
    // Setup event listeners
    setupEventListeners();
});

async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // User is logged in, redirect to dashboard
        window.location.href = 'dashboard.html';
    }
}

function setupEventListeners() {
    // Form submissions
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    document.getElementById('forgotForm').addEventListener('submit', handleForgotPassword);
    
    // Form switching
    document.getElementById('show-signup').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('signup');
    });
    
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('login');
    });
    
    document.getElementById('forgot-password').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('forgot');
    });
    
    document.getElementById('back-to-login').addEventListener('click', (e) => {
        e.preventDefault();
        showForm('login');
    });
}

function showForm(formType) {
    // Hide all forms
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('forgot-form').style.display = 'none';
    
    // Show selected form
    document.getElementById(`${formType}-form`).style.display = 'block';
    
    // Clear messages
    clearMessage();
    
    // Update header text
    const header = document.querySelector('.auth-header p');
    switch(formType) {
        case 'login':
            header.textContent = 'Faça login para acessar sua conta';
            break;
        case 'signup':
            header.textContent = 'Crie sua conta para começar';
            break;
        case 'forgot':
            header.textContent = 'Recupere sua senha';
            break;
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    showLoading(true);
    clearMessage();
    
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        showMessage('Login realizado com sucesso! Redirecionando...', 'success');
        
        // Redirect to dashboard
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
        
    } catch (error) {
        showMessage('Erro no login: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleSignup(e) {
    e.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const doctorName = document.getElementById('doctor-name').value;
    const crmNumber = document.getElementById('crm-number').value;
    
    showLoading(true);
    clearMessage();
    
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    doctor_name: doctorName,
                    crm_number: crmNumber
                }
            }
        });
        
        if (error) throw error;
        
        showMessage('Conta criada com sucesso! Verifique seu email para confirmar a conta.', 'success');
        
        // Switch to login form after a delay
        setTimeout(() => {
            showForm('login');
        }, 3000);
        
    } catch (error) {
        showMessage('Erro no cadastro: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    
    const email = document.getElementById('forgot-email').value;
    
    showLoading(true);
    clearMessage();
    
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
        
        if (error) throw error;
        
        showMessage('Link de recuperação enviado para seu email!', 'success');
        
        // Switch to login form after a delay
        setTimeout(() => {
            showForm('login');
        }, 3000);
        
    } catch (error) {
        showMessage('Erro ao enviar email: ' + error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function showLoading(show) {
    const loading = document.getElementById('loading');
    const forms = document.querySelectorAll('.auth-form');
    
    if (show) {
        forms.forEach(form => form.style.display = 'none');
        loading.style.display = 'block';
    } else {
        loading.style.display = 'none';
        // Show the currently active form
        const activeForm = document.querySelector('.auth-form[style*="block"]') || document.getElementById('login-form');
        activeForm.style.display = 'block';
    }
}

function showMessage(text, type) {
    const messageEl = document.getElementById('message');
    messageEl.textContent = text;
    messageEl.className = `message ${type}`;
}

function clearMessage() {
    const messageEl = document.getElementById('message');
    messageEl.textContent = '';
    messageEl.className = 'message';
}