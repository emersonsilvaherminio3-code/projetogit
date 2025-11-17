let show = true;

const menuContent = document.querySelector('.content');
const menuToggle = menuContent.querySelector('.menu-toggle');

menuToggle.addEventListener('click', () => {
    
    // Adiciona ou remove a classe 'on' do 'menuContent'
    // A variável 'show' controla se o menu deve ser mostrado ou escondido
    menuContent.classList.toggle('on', show);
    
    // Inverte o valor da variável 'show'
    show=!show;

});



    // 1. Seleção de Elementos (Modal)
    const openBtn = document.getElementById('openPopup');
    const closeBtn = document.getElementById('closePopup');
    const overlay = document.getElementById('overlay');
    const popup = document.getElementById('popup'); // Adiciona o pop-up para o stopPropagation
    
    // 2. Seleção do Formulário
    const form = document.getElementById('formlogin');

    // Funções do Modal (Reutilizadas da nossa conversa anterior)
    function openModal() {
        // Assume que a classe 'active' está no overlay para mostrá-lo
        overlay.classList.add('active'); 
    }

    function closeModal() {
        overlay.classList.remove('active');
        // Opcional: Limpa o formulário quando fecha
        form.reset(); 
    }
    
    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    
    // Fechar ao clicar fora do pop-up
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            closeModal();
        }
    });
    
    // Impede que cliques DENTRO do pop-up fechem o modal
    if (popup) {
        popup.addEventListener('click', function(event) {
            event.stopPropagation(); 
        });
    }

    // ----------------------------------------------------
    // FUNÇÃO PRINCIPAL: SALVAR DADOS NO LOCAL STORAGE
    // ----------------------------------------------------

   if (form) { form.addEventListener('submit', function(event) {
        // Impede o envio padrão do formulário (que recarregaria a página)
        event.preventDefault(); 

        // Coleta todos os dados do formulário
        const formData = new FormData(form);
        const novoCliente = Object.fromEntries(formData.entries());
        
        // --- 1. CARREGAR DADOS EXISTENTES ---
        // Pega a string JSON do Local Storage ou '[]' se for a primeira vez
        const cadastrosExistentesJSON = localStorage.getItem('clientesCadastrados');
        
        // Converte a string JSON em um Array JavaScript
        const listaDeClientes = cadastrosExistentesJSON 
            ? JSON.parse(cadastrosExistentesJSON) 
            : [];
        
        // --- 2. ADICIONAR NOVO CADASTRO ---
        // Adiciona o novo objeto cliente ao array
        listaDeClientes.push(novoCliente);
        
        // --- 3. SALVAR ATUALIZADO NO LOCAL STORAGE ---
        // Converte o array atualizado de volta para JSON e salva
        localStorage.setItem('clientesCadastrados', JSON.stringify(listaDeClientes));
        
        // Mensagem de Feedback
        console.log('--- NOVO CLIENTE CADASTRADO ---');
        console.log(novoCliente);
        console.log('Total de clientes no Local Storage:', listaDeClientes.length);
        
        alert('Cadastro efetuado e salvo no Local Storage!');
        
        // Finaliza o processo
        closeModal();
    });
} else{

    console.error('ERRO: Formulario com ID "formlogin" nao encontrado.');
}

