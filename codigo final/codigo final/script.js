let show = true;

const MenuContent = document.querySelector('.content');
const MenuToggle = MenuContent.querySelector('.menu-toggle');

MenuToggle.addEventListener('click', () => {
  MenuContent.classList.toggle('on', show);
  show = !show;
});
