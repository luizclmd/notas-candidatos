// Configurações - Substitua com seus dados
const GITHUB_USERNAME = 'seu-usuario';
const GITHUB_REPO = 'seu-repositorio';
const GITHUB_TOKEN = 'seu-token-de-acesso'; // Nunca expose no frontend em produção!

document.addEventListener('DOMContentLoaded', function() {
    // Configura link para o repositório
    document.getElementById('github-repo-link').href = `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}/issues`;
    
    // Carrega notas ao iniciar
    carregarNotas();
    
    // Configura evento do formulário
    document.getElementById('registrar').addEventListener('click', registrarNota);
});

async function registrarNota() {
    const nome = document.getElementById('nome').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const nota = document.getElementById('nota').value.trim();
    
    // Validação
    if (!nome || !cpf || !nota) {
        mostrarMensagem('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (cpf.length !== 11 || !/^\d+$/.test(cpf)) {
        mostrarMensagem('CPF deve conter exatamente 11 dígitos numéricos.', 'error');
        return;
    }
    
    const notaNum = parseFloat(nota);
    if (isNaN(notaNum) || notaNum < 0 || notaNum > 100) {
        mostrarMensagem('A nota deve ser um número entre 0 e 100.', 'error');
        return;
    }
    
    try {
        // Criar issue no GitHub
        await criarIssueNoGitHub(nome, cpf, notaNum);
        
        // Mostrar mensagem de sucesso
        mostrarMensagem('Nota registrada com sucesso!', 'success');
        
        // Limpar formulário
        document.getElementById('nome').value = '';
        document.getElementById('cpf').value = '';
        document.getElementById('nota').value = '';
        
        // Recarregar notas
        setTimeout(carregarNotas, 1000);
    } catch (error) {
        console.error('Erro ao registrar nota:', error);
        mostrarMensagem('Erro ao registrar nota. Por favor, tente novamente.', 'error');
    }
}

async function criarIssueNoGitHub(nome, cpf, nota) {
    const dataAtual = new Date().toLocaleString('pt-BR');
    const title = `Nota do Candidato: ${nome}`;
    const body = `
**CPF:** ${cpf}
**Nota:** ${nota}
**Data de Registro:** ${dataAtual}
    `;
    
    const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/issues`, {
        method: 'POST',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
            title: title,
            body: body,
            labels: ['nota-candidato']
        })
    });
    
    if (!response.ok) {
        throw new Error('Erro na API do GitHub');
    }
    
    return await response.json();
}

async function carregarNotas() {
    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/issues?labels=nota-candidato`);
        
        if (!response.ok) {
            throw new Error('Erro ao carregar notas');
        }
        
        const issues = await response.json();
        atualizarTabela(issues);
    } catch (error) {
        console.error('Erro ao carregar notas:', error);
        mostrarMensagem('Erro ao carregar notas. Por favor, recarregue a página.', 'error');
    }
}

function atualizarTabela(issues) {
    const tbody = document.getElementById('corpo-tabela');
    tbody.innerHTML = '';
    
    if (issues.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = '<td colspan="4" style="text-align: center;">Nenhuma nota registrada ainda</td>';
        tbody.appendChild(tr);
        return;
    }
    
    // Ordena por data de criação (mais recente primeiro)
    issues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    issues.forEach(issue => {
        // Extrai dados do corpo da issue
        const corpo = issue.body;
        const cpfMatch = corpo.match(/\*\*CPF:\*\*\s*(\d+)/);
        const notaMatch = corpo.match(/\*\*Nota:\*\*\s*([\d.]+)/);
        const dataMatch = corpo.match(/\*\*Data de Registro:\*\*\s*([^\n]+)/);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${issue.title.replace('Nota do Candidato: ', '')}</td>
            <td>${cpfMatch ? cpfMatch[1] : 'N/A'}</td>
            <td>${notaMatch ? notaMatch[1] : 'N/A'}</td>
            <td>${dataMatch ? dataMatch[1] : new Date(issue.created_at).toLocaleString('pt-BR')}</td>
        `;
        tbody.appendChild(tr);
    });
}

function mostrarMensagem(texto, tipo) {
    const elemento = document.getElementById('status-message');
    elemento.textContent = texto;
    elemento.className = `status-message ${tipo}`;
    elemento.classList.remove('hidden');
    
    setTimeout(() => {
        elemento.classList.add('hidden');
    }, 5000);
}