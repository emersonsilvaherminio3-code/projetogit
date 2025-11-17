document.addEventListener('DOMContentLoaded', () => {

  // Seleções seguras dos elementos
  const openBtn = document.getElementById('openLoginBtn');
  const overlay = document.getElementById('loginOverlay');
  const popup = document.getElementById('openLoginBtn');
  const closeBtn = document.getElementById('closeLoginBtn');
  const form = document.getElementById('loginForm');

  if (!overlay) {
    console.error('loginOverlay não encontrado no DOM.');
    return;
  }

  // Função para mostrar o modal
  function showModal() {
    overlay.classList.remove('overlay-hidden');
    overlay.classList.add('overlay-active');
    // opcional: bloquear scroll do body
    document.body.classList.add('popup-open');
  }

  // Função para fechar
  function hideModal() {
    overlay.classList.remove('overlay-active');
    overlay.classList.add('overlay-hidden');
    document.body.classList.remove('popup-open');
  }

  // abrir (botão)
  if (openBtn) {
    openBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showModal();
    });
  } else {
    console.warn('Botão de abrir login (openLoginBtn) não encontrado.');
  }

  // fechar (x)
  if (closeBtn) {
    closeBtn.addEventListener('click', hideModal);
  }

  // fechar clicando fora do popup
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideModal();
  });

  // impedir que clique dentro do popup feche
  if (popup) {
    popup.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // tratamento do submit do form
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault(); // ESSENCIAL: evita recarregar a página

      try {
        const data = Object.fromEntries(new FormData(form).entries());
        console.log('Dados do formulário (antes de salvar):', data);

        // Validação simples (exemplo)
        if (!data.nome || !data.telefone) {
          alert('Preencha nome e telefone.');
          return;
        }

        // Ler lista existente
        const key = 'clientesCadastrados';
        const existingJSON = localStorage.getItem(key);
        const lista = existingJSON ? JSON.parse(existingJSON) : [];

        // Adiciona e salva
        lista.push(data);
        localStorage.setItem(key, JSON.stringify(lista));

        console.log('Salvo em localStorage. Total agora:', lista.length);

        alert('Cadastro salvo com sucesso!');
        hideModal();
        form.reset();
      } catch (err) {
        console.error('Erro ao salvar formulário:', err);
        alert('Erro ao salvar. Veja o console.');
      }
    });
  } else {
    console.error('Formulário loginForm não encontrado.');
  }

});