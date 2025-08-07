// Global variables for selected codes
let selectedCidCodes = [];
let selectedTussCodes = [];
let cidCounter = 0;
let tussCounter = 0;
let supabase;
let currentUser = null;
let userProfile = null;

// Global variables for patient management
let currentPatient = null;
let allPatients = [];
let isEditingPatient = false;

// Load codes when page loads
document.addEventListener('DOMContentLoaded', function() {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    
    checkAuthAndSetup();
});

async function checkAuthAndSetup() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            // User not logged in, redirect to login
            window.location.href = 'login.html';
            return;
        }
        
        currentUser = session.user;
        await loadUserProfile();
        
        // Check for template to load
        const templateId = localStorage.getItem('selectedTemplateId');
        if (templateId) {
            await loadTemplate(templateId);
            localStorage.removeItem('selectedTemplateId');
        }
        
        console.log('Setting up application...');
        console.log('CID codes available:', typeof cidCodes !== 'undefined' ? cidCodes.length : 'No');
        console.log('TUSS codes available:', typeof tussCodes !== 'undefined' ? tussCodes.length : 'No');
        
        setupAutocomplete();
        setupFormHandlers();
        setupCPFValidation();
        setupPhoneFormatting();
        setDefaultReportDate();
        setupAuthenticatedFeatures();
        setupPatientHandlers();
        
    } catch (error) {
        console.error('Error checking auth:', error);
        window.location.href = 'login.html';
    }
}

async function loadUserProfile() {
    try {
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        userProfile = profile;
        const userName = profile?.full_name || currentUser.email;
        document.getElementById('currentUser').textContent = userName;
        
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('currentUser').textContent = currentUser.email;
        userProfile = null;
    }
}

async function loadTemplate(templateId) {
    try {
        const { data: template, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', templateId)
            .eq('user_id', currentUser.id)
            .single();
        
        if (error) throw error;
        
        if (template && template.template_data) {
            // Load template data into form
            const data = template.template_data;
            
            // Load regular form fields
            Object.keys(data).forEach(key => {
                if (key !== 'selectedCidCodes' && key !== 'selectedTussCodes') {
                    const element = document.getElementById(key);
                    if (element) {
                        element.value = data[key];
                    }
                }
            });
            
            // Load CID codes
            if (data.selectedCidCodes && data.selectedCidCodes.length > 0) {
                data.selectedCidCodes.forEach((cidCode, index) => {
                    if (cidCode && cidCode.code) {
                        selectedCidCodes[index] = cidCode;
                        const inputElement = document.getElementById(`cidCode${index}`);
                        if (inputElement) {
                            inputElement.value = cidCode.description;
                        }
                        
                        // Add more CID fields if needed
                        if (index > cidCounter) {
                            for (let i = cidCounter; i < index; i++) {
                                addNewCidField();
                            }
                        }
                    }
                });
            }
            
            // Load TUSS codes
            if (data.selectedTussCodes && data.selectedTussCodes.length > 0) {
                data.selectedTussCodes.forEach((tussCode, index) => {
                    if (tussCode && tussCode.code) {
                        selectedTussCodes[index] = tussCode;
                        const inputElement = document.getElementById(`tussCode${index}`);
                        if (inputElement) {
                            inputElement.value = tussCode.description;
                        }
                        
                        // Add more TUSS fields if needed
                        if (index > tussCounter) {
                            for (let i = tussCounter; i < index; i++) {
                                addNewTussField();
                            }
                        }
                    }
                });
            }
        }
        
    } catch (error) {
        console.error('Error loading template:', error);
    }
}

function setupAuthenticatedFeatures() {
    // Back to dashboard button
    document.getElementById('backToDashboard').addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    
    // Save as template button
    document.getElementById('saveAsTemplate').addEventListener('click', saveAsTemplate);
}

function setDefaultReportDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('reportDate').value = today;
}

function setupAutocomplete() {
    // Check if data is loaded
    if (typeof cidCodes === 'undefined' || typeof tussCodes === 'undefined') {
        console.error('CID or TUSS codes not loaded');
        setTimeout(() => setupAutocomplete(), 1000); // Retry after 1 second
        return;
    }
    
    console.log('Setting up autocomplete with', cidCodes.length, 'CID codes and', tussCodes.length, 'TUSS codes');
    
    // Setup initial CID and TUSS fields
    setupAutocompleteField(
        document.getElementById('cidCode0'),
        document.getElementById('cidSuggestions0'),
        cidCodes,
        (selectedItem) => handleCidSelection(0, selectedItem)
    );

    setupAutocompleteField(
        document.getElementById('tussCode0'),
        document.getElementById('tussSuggestions0'),
        tussCodes,
        (selectedItem) => handleTussSelection(0, selectedItem)
    );
}

function handleCidSelection(index, selectedItem) {
    selectedCidCodes[index] = selectedItem;
    document.getElementById(`cidCode${index}`).value = selectedItem.description;
    
    // Add new CID field if this is the last one
    if (index === cidCounter) {
        addNewCidField();
    }
}

function handleTussSelection(index, selectedItem) {
    selectedTussCodes[index] = selectedItem;
    document.getElementById(`tussCode${index}`).value = selectedItem.description;
    
    // Add new TUSS field if this is the last one
    if (index === tussCounter) {
        addNewTussField();
    }
}

function addNewCidField() {
    cidCounter++;
    const container = document.getElementById('cidCodesContainer');
    
    const newFieldDiv = document.createElement('div');
    newFieldDiv.className = 'form-group autocomplete-container';
    newFieldDiv.innerHTML = `
        <label for="cidCode${cidCounter}">Código CID adicional:</label>
        <input type="text" id="cidCode${cidCounter}" class="cid-input" placeholder="Digite para buscar código CID (ex: A00.0)" autocomplete="off">
        <div id="cidSuggestions${cidCounter}" class="autocomplete-suggestions"></div>
    `;
    
    container.appendChild(newFieldDiv);
    
    // Setup autocomplete for new field
    setupAutocompleteField(
        document.getElementById(`cidCode${cidCounter}`),
        document.getElementById(`cidSuggestions${cidCounter}`),
        cidCodes,
        (selectedItem) => handleCidSelection(cidCounter, selectedItem)
    );
}

function addNewTussField() {
    tussCounter++;
    const container = document.getElementById('tussCodesContainer');
    
    const newFieldDiv = document.createElement('div');
    newFieldDiv.className = 'form-group autocomplete-container';
    newFieldDiv.innerHTML = `
        <label for="tussCode${tussCounter}">Código TUSS adicional:</label>
        <input type="text" id="tussCode${tussCounter}" class="tuss-input" placeholder="Digite para buscar código TUSS (ex: 10101012)" autocomplete="off">
        <div id="tussSuggestions${tussCounter}" class="autocomplete-suggestions"></div>
    `;
    
    container.appendChild(newFieldDiv);
    
    // Setup autocomplete for new field
    setupAutocompleteField(
        document.getElementById(`tussCode${tussCounter}`),
        document.getElementById(`tussSuggestions${tussCounter}`),
        tussCodes,
        (selectedItem) => handleTussSelection(tussCounter, selectedItem)
    );
}

function setupAutocompleteField(input, suggestionsContainer, dataArray, onSelect) {
    if (!input || !suggestionsContainer || !dataArray) {
        console.error('Missing elements for autocomplete setup:', {
            input: !!input,
            suggestionsContainer: !!suggestionsContainer,
            dataArray: !!dataArray
        });
        return;
    }
    
    let currentHighlight = -1;

    input.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        
        if (query.length < 2) {
            suggestionsContainer.style.display = 'none';
            return;
        }

        // Filter data based on query
        const matches = dataArray.filter(item => 
            item.code.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        ).slice(0, 10); // Limit to 10 results for performance
        
        displaySuggestions(matches, suggestionsContainer, (selectedItem) => {
            onSelect(selectedItem);
            suggestionsContainer.style.display = 'none';
            currentHighlight = -1;
        });
    });

    // Handle keyboard navigation
    input.addEventListener('keydown', function(e) {
        const suggestions = suggestionsContainer.querySelectorAll('.autocomplete-suggestion');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentHighlight = Math.min(currentHighlight + 1, suggestions.length - 1);
            updateHighlight(suggestions, currentHighlight);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentHighlight = Math.max(currentHighlight - 1, -1);
            updateHighlight(suggestions, currentHighlight);
        } else if (e.key === 'Enter' && currentHighlight >= 0) {
            e.preventDefault();
            suggestions[currentHighlight].click();
        } else if (e.key === 'Escape') {
            suggestionsContainer.style.display = 'none';
            currentHighlight = -1;
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!input.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
            currentHighlight = -1;
        }
    });
}

function displaySuggestions(matches, container, onSelect) {
    if (matches.length === 0) {
        container.style.display = 'none';
        return;
    }

    container.innerHTML = '';
    
    matches.forEach((item, index) => {
        const suggestion = document.createElement('div');
        suggestion.className = 'autocomplete-suggestion';
        
        suggestion.innerHTML = `
            <div class="autocomplete-code">${item.code}</div>
            <div class="autocomplete-description">${item.description.split(' - ')[1] || item.description}</div>
        `;
        
        suggestion.addEventListener('click', function() {
            onSelect(item);
        });
        
        container.appendChild(suggestion);
    });
    
    container.style.display = 'block';
}

function updateHighlight(suggestions, highlightIndex) {
    suggestions.forEach((suggestion, index) => {
        if (index === highlightIndex) {
            suggestion.classList.add('highlighted');
        } else {
            suggestion.classList.remove('highlighted');
        }
    });
}

function setupCPFValidation() {
    const cpfInput = document.getElementById('patientCPF');
    const validationDiv = document.getElementById('cpfValidation');
    
    cpfInput.addEventListener('input', function() {
        // Format CPF as user types
        let value = this.value.replace(/\D/g, ''); // Remove non-digits
        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d)/, '$1.$2');
            value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
            this.value = value;
        }
        
        // Validate CPF
        const isValid = validateCPF(value);
        if (value.length === 14) { // Complete CPF format
            if (isValid) {
                validationDiv.textContent = '✓ CPF válido';
                validationDiv.className = 'validation-message validation-success';
            } else {
                validationDiv.textContent = '✗ CPF inválido';
                validationDiv.className = 'validation-message validation-error';
            }
        } else {
            validationDiv.textContent = '';
            validationDiv.className = 'validation-message';
        }
    });
}

function validateCPF(cpf) {
    cpf = cpf.replace(/\D/g, ''); // Remove formatting
    
    if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        return false; // Invalid length or all same digits
    }
    
    // Validate first check digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let checkDigit1 = 11 - (sum % 11);
    if (checkDigit1 === 10 || checkDigit1 === 11) checkDigit1 = 0;
    if (checkDigit1 !== parseInt(cpf.charAt(9))) return false;
    
    // Validate second check digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    let checkDigit2 = 11 - (sum % 11);
    if (checkDigit2 === 10 || checkDigit2 === 11) checkDigit2 = 0;
    if (checkDigit2 !== parseInt(cpf.charAt(10))) return false;
    
    return true;
}

function setupPhoneFormatting() {
    const phoneInput = document.getElementById('patientPhone');
    
    phoneInput.addEventListener('input', function() {
        // Format phone as user types
        let value = this.value.replace(/\D/g, ''); // Remove non-digits
        
        if (value.length <= 11) {
            if (value.length <= 10) {
                // Landline format: (11) 1234-5678
                value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
            } else {
                // Mobile format: (11) 99999-9999
                value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
            }
            this.value = value;
        }
    });
}

function setupFormHandlers() {
    const form = document.getElementById('reportForm');
    const copyButton = document.getElementById('copyButton');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await generateReport();
    });

    copyButton.addEventListener('click', function() {
        copyToClipboard();
    });
}

function calculateAge(birthDate) {
    const today = new Date();
    // Fix timezone issue by adding time to avoid date shifting
    const birth = new Date(birthDate + 'T12:00:00');
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    
    return age;
}

function formatDateExtensive(dateString) {
    const months = [
        'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
        'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
    ];
    
    // Fix timezone issue by adding time to avoid date shifting
    const date = new Date(dateString + 'T12:00:00');
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} de ${month} de ${year}`;
}

async function generateReport() {
    try {
        // Validar se paciente foi selecionado
        if (!currentPatient && document.getElementById('patientDataSection').style.display === 'none') {
            alert('Por favor, selecione um paciente antes de gerar o relatório.');
            return;
        }

        // Get form data
        const formData = {
            reportDate: document.getElementById('reportDate').value,
            patientName: document.getElementById('patientName').value,
            patientDOB: document.getElementById('patientDOB').value,
            patientCPF: document.getElementById('patientCPF').value,
            patientPhone: document.getElementById('patientPhone').value,
            patientCare: document.getElementById('patientCare').value,
            insuranceProvider: document.getElementById('insuranceProvider').value,
            insuranceNumber: document.getElementById('insuranceNumber').value,
            clinicalSummary: document.getElementById('clinicalSummary').value,
            materials: document.getElementById('materials').value
        };

        // Validate mandatory fields
        if (!formData.patientName.trim()) {
            alert('Por favor, preencha o nome do paciente.');
            return;
        }

        // Validate CPF only if provided
        if (formData.patientCPF.trim() && !validateCPF(formData.patientCPF)) {
            alert('CPF informado é inválido. Deixe em branco se não souber ou corrija o CPF.');
            return;
        }

        // Validate that at least one CID and TUSS code are selected
        const validCidCodes = selectedCidCodes.filter(code => code !== undefined);
        const validTussCodes = selectedTussCodes.filter(code => code !== undefined);
        
        if (validCidCodes.length === 0 || validTussCodes.length === 0) {
            alert('Por favor, selecione pelo menos um código CID e um código TUSS válidos.');
            return;
        }

        // Calculate age from DOB
        const age = formData.patientDOB ? calculateAge(formData.patientDOB) : null;

        // Generate report text
        const report = generateReportText(formData, validCidCodes, validTussCodes, age);

        // Display report
        document.getElementById('generatedReport').textContent = report;
        document.getElementById('output').style.display = 'block';
        
        // Save report to database
        if (currentUser) {
            await saveReport(formData, validCidCodes, validTussCodes, report);
        }
        
        // Scroll to output
        document.getElementById('output').scrollIntoView({ behavior: 'smooth' });
        
    } catch (error) {
        console.error('Error generating report:', error);
        alert('Erro ao gerar relatório: ' + error.message);
    }
}

function generateReportText(data, cidCodes, tussCodes, age) {
    const reportDate = data.reportDate ? 
        formatDateExtensive(data.reportDate) : 
        formatDateExtensive(new Date().toISOString().split('T')[0]);
    
    // Format CID codes with single line breaks
    const cidList = cidCodes.map(code => `CID: ${code.description}`).join('\n');
    
    // Format TUSS codes with single line breaks
    const tussList = tussCodes.map(code => `TUSS: ${code.description}`).join('\n');
    
    // Build patient info dynamically, only including filled fields
    let patientInfo = `Nome: ${data.patientName}`;
    
    if (data.patientDOB) {
        // Fix timezone issue by adding time to avoid date shifting
        const date = new Date(data.patientDOB + 'T12:00:00');
        const formattedDOB = date.toLocaleDateString('pt-BR');
        patientInfo += `\nData de Nascimento: ${formattedDOB}`;
        if (age !== null) {
            patientInfo += `\nIdade: ${age} anos`;
        }
    }
    
    if (data.patientCPF.trim()) {
        patientInfo += `\nCPF: ${data.patientCPF}`;
    }
    
    if (data.patientPhone.trim()) {
        patientInfo += `\nTelefone: ${data.patientPhone}`;
    }
    
    if (data.patientCare.trim()) {
        patientInfo += `\nNúmero do Atendimento: ${data.patientCare}`;
    }
    
    if (data.insuranceProvider.trim()) {
        patientInfo += `\nConvênio: ${data.insuranceProvider}`;
    }
    
    if (data.insuranceNumber.trim()) {
        patientInfo += `\nNúmero da Carteirinha: ${data.insuranceNumber}`;
    }
    
    // Build clinical sections
    let clinicalSection = '';
    if (data.clinicalSummary.trim()) {
        clinicalSection = `\n\nJUSTIFICATIVA CLÍNICA:\n${data.clinicalSummary}`;
    }
    
    let materialsSection = '';
    if (data.materials.trim()) {
        materialsSection = `\n\nMATERIAIS NECESSÁRIOS:\n${data.materials}`;
    }
    
    // Get doctor info from profile
    const doctorName = userProfile?.doctor_name || 'Dr. _________________________';
    let crmInfo = '_______________________';
    if (userProfile?.crm_number) {
        crmInfo = userProfile.crm_number;
        if (userProfile.crm_state) {
            crmInfo += '/' + userProfile.crm_state;
        }
    }
    
    let rqeInfo = '';
    if (userProfile?.rqe_number) {
        rqeInfo = `\nRQE: ${userProfile.rqe_number}`;
    }
    
    return `${reportDate}

SOLICITAÇÃO DE AUTORIZAÇÃO PARA PROCEDIMENTO MÉDICO

IDENTIFICAÇÃO DO PACIENTE:
${patientInfo}

DIAGNÓSTICO(S):
${cidList}

PROCEDIMENTO(S) SOLICITADO(S):
${tussList}${clinicalSection}${materialsSection}

Atenciosamente,
${doctorName}
CRM: ${crmInfo}${rqeInfo}`;
}

function copyToClipboard() {
    const reportText = document.getElementById('generatedReport').textContent;
    navigator.clipboard.writeText(reportText).then(function() {
        const button = document.getElementById('copyButton');
        const originalText = button.textContent;
        button.textContent = 'Copiado!';
        button.style.backgroundColor = '#28a745';
        
        setTimeout(function() {
            button.textContent = originalText;
            button.style.backgroundColor = '#28a745';
        }, 2000);
    }).catch(function(err) {
        alert('Erro ao copiar: ' + err);
    });
}

async function saveReport(formData, cidCodes, tussCodes, reportText) {
    if (!currentUser || !formData.patientName.trim()) return;
    
    try {
        const reportData = {
            ...formData,
            cidCodes: cidCodes.map(c => ({ code: c.code, description: c.description })),
            tussCodes: tussCodes.map(t => ({ code: t.code, description: t.description }))
        };
        
        const { error } = await supabase
            .from('reports')
            .insert({
                user_id: currentUser.id,
                patient_name: formData.patientName,
                report_data: reportData,
                generated_text: reportText
            });
        
        if (error) throw error;
        
    } catch (error) {
        console.error('Error saving report:', error);
        // Don't show error to user as this is background functionality
    }
}

async function saveAsTemplate() {
    const templateName = prompt('Nome do template:');
    if (!templateName || !templateName.trim()) return;
    
    try {
        // Collect current form data
        const templateData = {
            reportDate: document.getElementById('reportDate').value,
            patientName: document.getElementById('patientName').value,
            patientDOB: document.getElementById('patientDOB').value,
            patientCPF: document.getElementById('patientCPF').value,
            patientPhone: document.getElementById('patientPhone').value,
            patientCare: document.getElementById('patientCare').value,
            insuranceProvider: document.getElementById('insuranceProvider').value,
            insuranceNumber: document.getElementById('insuranceNumber').value,
            clinicalSummary: document.getElementById('clinicalSummary').value,
            materials: document.getElementById('materials').value,
            selectedCidCodes: selectedCidCodes.filter(c => c !== undefined),
            selectedTussCodes: selectedTussCodes.filter(t => t !== undefined)
        };
        
        const { error } = await supabase
            .from('templates')
            .insert({
                user_id: currentUser.id,
                name: templateName.trim(),
                description: `Template criado em ${new Date().toLocaleDateString('pt-BR')}`,
                template_data: templateData
            });
        
        if (error) throw error;
        
        alert('Template salvo com sucesso!');
        
    } catch (error) {
        console.error('Error saving template:', error);
        alert('Erro ao salvar template: ' + error.message);
    }
}

// ===== PATIENT MANAGEMENT FUNCTIONS =====

function setupPatientHandlers() {
    // Botões de seleção
    document.getElementById('createNewPatient').addEventListener('click', showCreatePatientForm);
    document.getElementById('selectExistingPatient').addEventListener('click', showExistingPatients);
    
    // Botões de ação
    document.getElementById('changePatientBtn').addEventListener('click', resetPatientSelection);
    document.getElementById('savePatientBtn').addEventListener('click', savePatient);
    document.getElementById('useWithoutSavingBtn').addEventListener('click', usePatientWithoutSaving);
    
    // Busca de pacientes
    document.getElementById('patientSearch').addEventListener('input', filterPatients);
}

function showCreatePatientForm() {
    // Ocultar seção de pacientes existentes
    document.getElementById('existingPatientsSection').style.display = 'none';
    
    // Mostrar seção de dados do paciente
    document.getElementById('patientDataSection').style.display = 'block';
    document.getElementById('patientSectionTitle').textContent = 'Novo Paciente';
    document.getElementById('editPatientBtn').style.display = 'none';
    document.getElementById('savePatientSection').style.display = 'block';
    
    // Limpar formulário
    clearPatientForm();
    
    // Definir como novo paciente
    currentPatient = null;
    isEditingPatient = false;
}

async function showExistingPatients() {
    // Ocultar seção de dados do paciente
    document.getElementById('patientDataSection').style.display = 'none';
    
    // Mostrar seção de pacientes existentes
    document.getElementById('existingPatientsSection').style.display = 'block';
    
    // Carregar pacientes
    await loadPatients();
    displayPatients(allPatients);
}

async function loadPatients() {
    try {
        const { data: patients, error } = await supabase
            .from('patients')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('name');
        
        if (error) throw error;
        
        allPatients = patients || [];
        
    } catch (error) {
        console.error('Error loading patients:', error);
        allPatients = [];
    }
}

function displayPatients(patients) {
    const patientsList = document.getElementById('patientsList');
    
    if (!patients || patients.length === 0) {
        patientsList.innerHTML = '<div class="no-patients">Nenhum paciente encontrado</div>';
        return;
    }
    
    patientsList.innerHTML = '';
    
    patients.forEach(patient => {
        const patientItem = document.createElement('div');
        patientItem.className = 'patient-item';
        patientItem.dataset.patientId = patient.id;
        
        const details = [];
        if (patient.date_of_birth) {
            const age = calculateAge(patient.date_of_birth);
            details.push(`${age} anos`);
        }
        if (patient.cpf) details.push(`CPF: ${patient.cpf}`);
        if (patient.insurance_provider) details.push(patient.insurance_provider);
        
        patientItem.innerHTML = `
            <div class="patient-name">${patient.name}</div>
            <div class="patient-details">${details.join(' • ')}</div>
        `;
        
        patientItem.addEventListener('click', () => selectPatient(patient));
        
        patientsList.appendChild(patientItem);
    });
}

function selectPatient(patient) {
    // Remover seleção anterior
    document.querySelectorAll('.patient-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Adicionar seleção atual
    document.querySelector(`[data-patient-id="${patient.id}"]`).classList.add('selected');
    
    // Definir paciente atual
    currentPatient = patient;
    
    // Preencher formulário
    fillPatientForm(patient);
    
    // Mostrar seção de dados
    document.getElementById('existingPatientsSection').style.display = 'none';
    document.getElementById('patientDataSection').style.display = 'block';
    document.getElementById('patientSectionTitle').textContent = `Paciente: ${patient.name}`;
    document.getElementById('editPatientBtn').style.display = 'inline-block';
    document.getElementById('savePatientSection').style.display = 'none';
    
    // Desabilitar campos (modo visualização)
    setPatientFormReadonly(true);
}

function fillPatientForm(patient) {
    document.getElementById('patientName').value = patient.name || '';
    document.getElementById('patientDOB').value = patient.date_of_birth || '';
    document.getElementById('patientCPF').value = patient.cpf || '';
    document.getElementById('patientPhone').value = patient.phone || '';
    document.getElementById('patientCare').value = patient.default_care_number || '';
    document.getElementById('insuranceProvider').value = patient.insurance_provider || '';
    document.getElementById('insuranceNumber').value = patient.insurance_number || '';
}

function clearPatientForm() {
    document.getElementById('patientName').value = '';
    document.getElementById('patientDOB').value = '';
    document.getElementById('patientCPF').value = '';
    document.getElementById('patientPhone').value = '';
    document.getElementById('patientCare').value = '';
    document.getElementById('insuranceProvider').value = '';
    document.getElementById('insuranceNumber').value = '';
    
    setPatientFormReadonly(false);
}

function setPatientFormReadonly(readonly) {
    const fields = [
        'patientName', 'patientDOB', 'patientCPF', 'patientPhone',
        'patientCare', 'insuranceProvider', 'insuranceNumber'
    ];
    
    fields.forEach(fieldId => {
        document.getElementById(fieldId).readOnly = readonly;
    });
}

function resetPatientSelection() {
    // Ocultar todas as seções
    document.getElementById('existingPatientsSection').style.display = 'none';
    document.getElementById('patientDataSection').style.display = 'none';
    
    // Limpar seleção
    currentPatient = null;
    isEditingPatient = false;
    clearPatientForm();
}

async function savePatient() {
    try {
        // Validar dados obrigatórios
        const name = document.getElementById('patientName').value.trim();
        if (!name) {
            alert('Nome do paciente é obrigatório');
            return;
        }
        
        // Validar CPF se fornecido
        const cpf = document.getElementById('patientCPF').value.trim();
        if (cpf && !validateCPF(cpf)) {
            alert('CPF informado é inválido');
            return;
        }
        
        // Preparar dados
        const patientData = {
            user_id: currentUser.id,
            name: name,
            date_of_birth: document.getElementById('patientDOB').value || null,
            cpf: cpf || null,
            phone: document.getElementById('patientPhone').value.trim() || null,
            insurance_provider: document.getElementById('insuranceProvider').value.trim() || null,
            insurance_number: document.getElementById('insuranceNumber').value.trim() || null,
            default_care_number: document.getElementById('patientCare').value.trim() || null
        };
        
        // Salvar no banco
        const { data: savedPatient, error } = await supabase
            .from('patients')
            .insert(patientData)
            .select()
            .single();
        
        if (error) throw error;
        
        // Definir como paciente atual
        currentPatient = savedPatient;
        
        // Atualizar interface
        document.getElementById('patientSectionTitle').textContent = `Paciente: ${savedPatient.name}`;
        document.getElementById('editPatientBtn').style.display = 'inline-block';
        document.getElementById('savePatientSection').style.display = 'none';
        setPatientFormReadonly(true);
        
        alert('Paciente salvo com sucesso!');
        
    } catch (error) {
        console.error('Error saving patient:', error);
        alert('Erro ao salvar paciente: ' + error.message);
    }
}

function usePatientWithoutSaving() {
    // Validar nome obrigatório
    const name = document.getElementById('patientName').value.trim();
    if (!name) {
        alert('Nome do paciente é obrigatório');
        return;
    }
    
    // Criar objeto paciente temporário
    currentPatient = {
        name: name,
        date_of_birth: document.getElementById('patientDOB').value || null,
        cpf: document.getElementById('patientCPF').value.trim() || null,
        phone: document.getElementById('patientPhone').value.trim() || null,
        insurance_provider: document.getElementById('insuranceProvider').value.trim() || null,
        insurance_number: document.getElementById('insuranceNumber').value.trim() || null,
        default_care_number: document.getElementById('patientCare').value.trim() || null
    };
    
    // Atualizar interface
    document.getElementById('patientSectionTitle').textContent = `Paciente: ${name} (não salvo)`;
    document.getElementById('editPatientBtn').style.display = 'none';
    document.getElementById('savePatientSection').style.display = 'none';
    setPatientFormReadonly(true);
}

function filterPatients() {
    const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
    
    if (!searchTerm) {
        displayPatients(allPatients);
        return;
    }
    
    const filteredPatients = allPatients.filter(patient => 
        patient.name.toLowerCase().includes(searchTerm) ||
        (patient.cpf && patient.cpf.includes(searchTerm))
    );
    
    displayPatients(filteredPatients);
}