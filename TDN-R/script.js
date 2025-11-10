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

      const openPopup = document.getElementById('openPopup');
      const closePopup = document.getElementById('closePopup');
      const overlay = document.getElementById('overlay');

      openPopup.addEventListener('click', (e) => {
         e.preventDefault();
            overlay.style.display = 'flex';
       });

       closePopup.addEventListener('click', () => {
            overlay.style.display = 'none';
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });

   document.addEventListener('DOMContentLoaded', () => {
  const telefone = document.getElementById('telefone');
  const cpf = document.getElementById('cpf');

  telefone.addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, ''); // remove não-números
    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
    valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
    e.target.value = valor.slice(0, 15);
      });

  cpf.addEventListener('input', (e) => {
    let valor = e.target.value.replace(/\D/g, '');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
    valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = valor.slice(0, 14);
  });
});

// Abrir popup de pizza ao clicar em "Pedir agora"
document.querySelectorAll('.pedir').forEach((botao) => {
  botao.addEventListener('click', () => {
    const pizzaDiv = botao.closest('div');
    const nome = pizzaDiv.querySelector('h3').textContent;
    const img = pizzaDiv.querySelector('img').src;
    const precoBase = parseFloat(pizzaDiv.querySelector('h4 span:last-child').textContent.replace('R$', '').replace(',', '.'));

    document.getElementById('pizzaPopup').style.display = 'flex';
    document.body.classList.add('popun-open');
    document.getElementById('pizzaName').textContent = nome;
    document.getElementById('pizzaImage').src = img;
    document.getElementById('pizzaPrice').textContent = precoBase.toFixed(2).replace('.', ',');
    document.getElementById('totalPrice').textContent = precoBase.toFixed(2).replace('.', ',');
    document.getElementById('quantidade').textContent = 1;
  });
});

// Fechar popup
document.getElementById('closePizzaPopup').addEventListener('click', () => {
  document.getElementById('pizzaPopup').style.display = 'none';
});

// Lógica de quantidade e valor total
const quantidadeSpan = document.getElementById('quantidade');
const totalPrice = document.getElementById('totalPrice');
let quantidade = 1;

document.getElementById('mais').addEventListener('click', () => {
  quantidade++;
  atualizarTotal();
});

document.getElementById('menos').addEventListener('click', () => {
  if (quantidade > 1) quantidade--;
  atualizarTotal();
});

document.querySelectorAll('input[name="tamanho"]').forEach(radio => {
  radio.addEventListener('change', atualizarTotal);
});

function atualizarTotal() {
  const tamanho = document.querySelector('input[name="tamanho"]:checked').value;
  const total = tamanho * quantidade;
  quantidadeSpan.textContent = quantidade;
  totalPrice.textContent = total.toFixed(2).replace('.', ',');
}
