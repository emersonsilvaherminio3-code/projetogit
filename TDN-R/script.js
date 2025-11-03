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
