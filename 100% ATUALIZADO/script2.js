/* script2.js
  - quick add: click tamanho dentro do card => adiciona item (mensagem toast)
  - "Pedir agora": abre modal do carrinho com a pizza selecionada (nome/desc),
    permite escolher tamanho e quantidade, adicionar ao carrinho
  - carrinho persistente em localStorage (key: "carrinho")
  - remover / ajustar qty no modal, finalizar pedido via WhatsApp
  - login/cadastro simples via localStorage (clientesCadastrados, usuarioAtivo)
  - número WhatsApp: 55 81 9964 1479 => "5581999641479"
*/

(function () {
  /* =================== CONFIG / DOM (CARRINHO) =================== */
  const STORAGE_KEY = "carrinho";
  const WHATSAPP_NUMBER = "5581999641479";

  // Cart DOM
  const openCartBtn = document.getElementById("openCartBtn");
  const cartOverlay = document.getElementById("cartOverlay");
  const cartPopup = document.getElementById("cartPopup");
  const closeCartBtn = document.getElementById("closeCartBtn");
  const cartItemsEl = document.getElementById("cart-items");
  const cartTotalEl = document.getElementById("cart-total");
  const clearCartBtn = document.getElementById("clearCartBtn");
  const checkoutBtn = document.getElementById("checkoutBtn");
  const cartBadge = document.getElementById("cart-badge");
  const toast = document.getElementById("toast");

  // Modal selected product elements
  const selectedProductEl = document.getElementById("selected-product");
  const selectedNameEl = document.getElementById("selected-name");
  const selectedDescEl = document.getElementById("selected-desc");
  const modalTamanhosEl = document.getElementById("modal-tamanhos");
  const qtyDecreaseBtn = document.getElementById("qty-decrease");
  const qtyIncreaseBtn = document.getElementById("qty-increase");
  const qtyValueEl = document.getElementById("qty-value");
  const modalAddBtn = document.getElementById("modal-add-btn");
  const cartModalTitle = document.getElementById("cart-modal-title");

  /* =================== STATE (CARRINHO) =================== */
  let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  let modalSelected = null;

  /* =================== HELPERS (CARRINHO) =================== */
  function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
  function formatBRL(n) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  function showToast(message = "Adicionado ao carrinho!") {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("toast-show");
    setTimeout(() => toast.classList.remove("toast-show"), 1500);
  }
  function updateBadge() {
    if (!cartBadge) return;
    const totalQty = cart.reduce((s, it) => s + it.quantity, 0);
    cartBadge.textContent = totalQty;
  }

  /* =================== CARRINHO: leitura de tamanhos e quick add =================== */
  function buildSizesFromProduct(prodElem) {
    const btns = Array.from(prodElem.querySelectorAll(".tamanho-btn"));
    return btns.map(b => ({ size: b.dataset.size, price: parseFloat(b.dataset.price) }));
  }

  document.body.addEventListener("click", function (e) {
    const tb = e.target.closest(".tamanho-btn");
    if (!tb) return;
    const prod = tb.closest(".produto");
    if (!prod) return;

    const name = prod.querySelector(".info h3") ? prod.querySelector(".info h3").textContent.trim() : "Produto";
    const size = tb.dataset.size;
    const price = parseFloat(tb.dataset.price);

    addToCart({ name, size, price, quantity: 1 });
    showToast();
  });

  document.body.addEventListener("click", function (e) {
    const pb = e.target.closest(".pedir-btn");
    if (!pb) return;
    const prod = pb.closest(".produto");
    if (!prod) return;

    const name = prod.querySelector(".info h3") ? prod.querySelector(".info h3").textContent.trim() : "Produto";
    const desc = prod.querySelector(".info .descrição") ? prod.querySelector(".info .descrição").textContent.trim() : "";
    const sizes = buildSizesFromProduct(prod);

    modalSelected = { name, desc, sizes, chosenSize: null, qty: 1 };
    openCartModal(true);
  });

  /* =================== MODAL DO CARRINHO =================== */
  if (openCartBtn) {
    openCartBtn.addEventListener("click", function (ev) {
      ev.preventDefault();
      modalSelected = null;
      openCartModal(false);
    });
  }

  function openCartModal(withSelected) {
    if (!cartOverlay) return;
    cartOverlay.classList.remove("overlay-hidden");
    cartOverlay.classList.add("overlay-active");
    document.body.classList.add("popup-open");

    if (withSelected && modalSelected) {
      selectedProductEl.style.display = "block";
      selectedNameEl.textContent = modalSelected.name;
      selectedDescEl.textContent = modalSelected.desc || "";
      qtyValueEl.textContent = modalSelected.qty;

      modalTamanhosEl.innerHTML = "";
      modalSelected.sizes.forEach(sz => {
        const b = document.createElement("button");
        b.className = "modal-size";
        b.dataset.size = sz.size;
        b.dataset.price = sz.price;
        b.textContent = `${sz.size} — ${formatBRL(sz.price)}`;
        b.addEventListener("click", () => {
          Array.from(modalTamanhosEl.children).forEach(x => x.classList.remove("active"));
          b.classList.add("active");
          modalSelected.chosenSize = sz;
        });
        modalTamanhosEl.appendChild(b);
      });

      cartModalTitle.textContent = `Pedido — ${modalSelected.name}`;
    } else {
      if (selectedProductEl) selectedProductEl.style.display = "none";
      cartModalTitle.textContent = "Seu Carrinho";
    }

    renderCartItems();
    updateBadge();
  }

  if (closeCartBtn) closeCartBtn.addEventListener("click", closeCartModal);
  if (cartOverlay) cartOverlay.addEventListener("click", function (e) {
    if (e.target === cartOverlay) closeCartModal();
  });
  if (cartPopup) cartPopup.addEventListener("click", e => e.stopPropagation());

  function closeCartModal() {
    if (!cartOverlay) return;
    cartOverlay.classList.remove("overlay-active");
    cartOverlay.classList.add("overlay-hidden");
    document.body.classList.remove("popup-open");
    
    if (modalSelected) {
      modalSelected.qty = 1;
      modalSelected.chosenSize = null;
    }
  }

  if (qtyDecreaseBtn) qtyDecreaseBtn.addEventListener("click", () => {
    if (!modalSelected) return;
    if (modalSelected.qty > 1) modalSelected.qty--;
    qtyValueEl.textContent = modalSelected.qty;
  });
  if (qtyIncreaseBtn) qtyIncreaseBtn.addEventListener("click", () => {
    if (!modalSelected) return;
    modalSelected.qty++;
    qtyValueEl.textContent = modalSelected.qty;
  });

  if (modalAddBtn) modalAddBtn.addEventListener("click", () => {
    if (!modalSelected) return alert("Escolha um tamanho antes de adicionar.");
    if (!modalSelected.chosenSize) return alert("Escolha um tamanho antes de adicionar.");

    const { name, chosenSize, qty } = modalSelected;
    addToCart({ name, size: chosenSize.size, price: chosenSize.price, quantity: Number(qty) });
    showToast("Adicionado ao carrinho!");
    modalSelected = null;
    openCartModal(false);
  });

  /* =================== CARRINHO: operações =================== */
  function addToCart(item) {
    const existing = cart.find(it =>
      it.name === item.name &&
      String(it.size) === String(item.size) &&
      Number(it.price) === Number(item.price)
    );
    if (existing) {
      existing.quantity = Number(existing.quantity) + Number(item.quantity);
    } else {
      cart.push({
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: item.name,
        size: item.size,
        price: Number(item.price),
        quantity: Number(item.quantity)
      });
    }
    saveCart();
    renderCartItems();
    updateBadge();
  }

  function renderCartItems() {
    if (!cartItemsEl) return;
    cartItemsEl.innerHTML = "";
    if (!cart.length) {
      const li = document.createElement("li");
      li.textContent = "Seu carrinho está vazio.";
      li.style.padding = "8px";
      cartItemsEl.appendChild(li);
      if (cartTotalEl) cartTotalEl.textContent = formatBRL(0);
      return;
    }

    cart.forEach((it, idx) => {
      const li = document.createElement("li");
      li.className = "cart-item";

      const left = document.createElement("div");
      left.className = "item-left";
      left.innerHTML = `
        <strong>${it.name}</strong>
        <small>${it.size}</small>
        <small>${formatBRL(it.price)} un.</small>
      `;

      const right = document.createElement("div");
      right.className = "item-right";

      const dec = document.createElement("button");
      dec.className = "qty-btn";
      dec.textContent = "−";
      dec.addEventListener("click", () => {
        if (it.quantity > 1) it.quantity--;
        else cart.splice(idx, 1);
        saveCart();
        renderCartItems();
        updateBadge();
      });

      const qtySpan = document.createElement("span");
      qtySpan.textContent = it.quantity;

      const inc = document.createElement("button");
      inc.className = "qty-btn";
      inc.textContent = "+";
      inc.addEventListener("click", () => {
        it.quantity++;
        saveCart();
        renderCartItems();
        updateBadge();
      });

      const removeBtn = document.createElement("button");
      removeBtn.className = "clear-btn";
      removeBtn.textContent = "Remover";
      removeBtn.addEventListener("click", () => {
        if (confirm("Remover este item do carrinho?")) {
          cart.splice(idx, 1);
          saveCart();
          renderCartItems();
          updateBadge();
        }
      });

      const subtotal = document.createElement("div");
      subtotal.innerHTML = `<small>${formatBRL(it.price * it.quantity)}</small>`;

      right.appendChild(dec);
      right.appendChild(qtySpan);
      right.appendChild(inc);
      right.appendChild(removeBtn);
      right.appendChild(subtotal);

      li.appendChild(left);
      li.appendChild(right);

      cartItemsEl.appendChild(li);
    });

    const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);
    if (cartTotalEl) cartTotalEl.textContent = formatBRL(total);
  }

  if (clearCartBtn) clearCartBtn.addEventListener("click", () => {
    if (!cart.length) return;
    if (!confirm("Deseja limpar todo o carrinho?")) return;
    cart = [];
    saveCart();
    renderCartItems();
    updateBadge();
  });

  if (checkoutBtn) checkoutBtn.addEventListener("click", () => {
    if (!cart.length) { alert("Seu carrinho está vazio!"); return; }

    let message = "Olá! Gostaria de fazer o pedido:%0A%0A";
    cart.forEach((it, i) => {
      message += `${i + 1}. ${it.name} — ${it.size} — ${it.quantity} x R$ ${it.price.toFixed(2).replace(".", ",")} = R$ ${(it.price * it.quantity).toFixed(2).replace(".", ",")}%0A`;
    });
    const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);
    message += `%0ATotal: R$ ${total.toFixed(2).replace(".", ",")}%0A%0A`;
    message += "Endereço: %0A%0AForma de pagamento: %0A";

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, "_blank");
  });

  function init() {
    renderCartItems();
    updateBadge();
  }
  init();

// =========================
// ELEMENTOS
// =========================
const openLoginBtn = document.getElementById("openLoginBtn");
const loginOverlay = document.getElementById("loginOverlay");
const closeLoginBtn = document.getElementById("closeLoginBtn");

const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const profileScreen = document.getElementById("profileScreen");

const goToRegister = document.getElementById("goToRegister");
const goToLogin = document.getElementById("goToLogin");
const goToLoginFromProfile = document.getElementById("goToLoginFromProfile");

const btnLogout = document.getElementById("btnLogout");

// Campos login
const loginCpf = document.getElementById("loginCpf");
const loginPassword = document.getElementById("loginPassword");

// Campos cadastro
const regNome = document.getElementById("regNome");
const regCpf = document.getElementById("regCpf");
const regTel = document.getElementById("regTel");
const regPassword = document.getElementById("regPassword");
const regPasswordConfirm = document.getElementById("regPasswordConfirm");

// Campos perfil
const profileNome = document.getElementById("profileNome");
const profileCpf = document.getElementById("profileCpf");
const profileTel = document.getElementById("profileTel");

// =========================
// FUNÇÕES ÚTEIS
// =========================
function maskCPF(v) {
  v = v.replace(/\D/g, "");
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function maskPhone(v) {
  v = v.replace(/\D/g, "");
  return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
}

function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;

  return resto === parseInt(cpf[10]);
}

function getUsers() {
  return JSON.parse(localStorage.getItem("usuarios") || "[]");
}

function saveUsers(users) {
  localStorage.setItem("usuarios", JSON.stringify(users));
}

// =========================
// FUNÇÕES DE TROCA DE TELA (LOGICA CORRIGIDA)
// Garante que apenas uma tela está 'active' e visível.
// =========================
function showLogin() {
  // Apenas o Login deve estar visível
  loginForm.classList.remove("hidden");
  loginForm.classList.add("active");

  registerForm.classList.add("hidden");
  registerForm.classList.remove("active");

  profileScreen.classList.add("hidden");
  profileScreen.classList.remove("active");
}

function showRegister() {
  // Apenas o Cadastro deve estar visível
  loginForm.classList.add("hidden");
  loginForm.classList.remove("active");

  registerForm.classList.remove("hidden");
  registerForm.classList.add("active");

  profileScreen.classList.add("hidden");
  profileScreen.classList.remove("active");
}

function showProfile(user) {
  // Apenas o Perfil deve estar visível
  loginForm.classList.add("hidden");
  loginForm.classList.remove("active");

  registerForm.classList.add("hidden");
  registerForm.classList.remove("active");

  profileNome.textContent = user.nome;
  profileCpf.textContent = maskCPF(user.cpf);
  profileTel.textContent = maskPhone(user.telefone);

  // Botão de editar oculto, se existir
  const btnEditar = document.getElementById("btnEditarPerfil");
  if (btnEditar) btnEditar.classList.add("hidden");

  profileScreen.classList.remove("hidden");
  profileScreen.classList.add("active");
}

// =========================
// ABRIR / FECHAR MODAL (CORREÇÃO DE SOBREPOSIÇÃO) ✅
// Esconde e mostra o botão principal.
// =========================
openLoginBtn.addEventListener("click", () => {
  loginOverlay.classList.remove("overlay-hidden");
  
  // ✅ CORREÇÃO: Esconde o botão da página principal ao ABRIR o modal
  openLoginBtn.classList.add("open-btn-hidden"); 

  const user = JSON.parse(localStorage.getItem("logado"));
  if (user) showProfile(user);
  else showLogin();
});

closeLoginBtn.addEventListener("click", () => {
  loginOverlay.classList.add("overlay-hidden");
  
  // ✅ CORREÇÃO: Mostra o botão novamente ao FECHAR o modal
  openLoginBtn.classList.remove("open-btn-hidden"); 
});

// =========================
// TROCAR TELA
// =========================
goToRegister.addEventListener("click", (e) => {
  e.preventDefault();
  showRegister();
});

goToLogin.addEventListener("click", (e) => {
  e.preventDefault();
  showLogin();
});

goToLoginFromProfile.addEventListener("click", (e) => {
  e.preventDefault();
  showLogin();
});

// =========================
// LOGIN
// =========================
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const cpf = loginCpf.value.replace(/\D/g, "");
  const senha = loginPassword.value;

  if (senha.length < 8) {
    alert("A senha deve ter no mínimo 8 caracteres!");
    return;
  }

  const users = getUsers();
  const user = users.find((u) => u.cpf === cpf);

  if (!user) {
    alert("Usuário não encontrado! Faça cadastro.");
    showRegister();
    return;
  }

  if (user.senha !== senha) {
    alert("Senha incorreta!");
    return;
  }

  localStorage.setItem("logado", JSON.stringify(user));
  openLoginBtn.textContent = user.nome.split(" ")[0];
  showProfile(user);
});

// =========================
// CADASTRO
// =========================
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const nome = regNome.value.trim();
  const cpf = regCpf.value.replace(/\D/g, "");
  const telefone = regTel.value.replace(/\D/g, "");
  const senha = regPassword.value;
  const senhaConf = regPasswordConfirm.value;

  if (!validarCPF(cpf)) {
    alert("CPF inválido!");
    return;
  }

  if (senha.length < 8) {
    alert("A senha deve ter no mínimo 8 caracteres!");
    return;
  }

  if (senha !== senhaConf) {
    alert("As senhas não coincidem!");
    return;
  }

  // Validação do telefone: 11 dígitos
  if (telefone.length !== 11) {
    alert("O telefone deve ter 11 dígitos!");
    return;
  }

  const users = getUsers();
  if (users.some((u) => u.cpf === cpf)) {
    alert("Esse CPF já está cadastrado!");
    return;
  }

  const novoUser = { nome, cpf, telefone, senha };
  users.push(novoUser);
  saveUsers(users);

  localStorage.setItem("logado", JSON.stringify(novoUser));
  openLoginBtn.textContent = nome.split(" ")[0];
  showProfile(novoUser);
});

// =========================
// LOGOUT (CORREÇÃO DE SOBREPOSIÇÃO) ✅
// Garante que o botão principal não fique sobreposto após o logout.
// =========================
btnLogout.addEventListener("click", () => {
  localStorage.removeItem("logado");
  openLoginBtn.textContent = "LOGIN";
  
  // ✅ CORREÇÃO: Mostra o botão da página principal novamente
  openLoginBtn.classList.remove("open-btn-hidden"); 
  
  // O modal se fecha e a tela de login (oculta) é preparada para o próximo uso
  loginOverlay.classList.add("overlay-hidden");
  showLogin(); 
});

// =========================
// MÁSCARAS
// =========================
regCpf.addEventListener("input", () => {
  regCpf.value = maskCPF(regCpf.value);
});
loginCpf.addEventListener("input", () => {
  loginCpf.value = maskCPF(loginCpf.value);
});
regTel.addEventListener("input", () => {
  regTel.value = maskPhone(regTel.value);
});

// =========================
// MOSTRAR SENHA NOS INPUTS
// =========================
document.querySelectorAll(".show-pass-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === "password" ? "text" : "password";
  });
});

// =========================
// CARREGAR USUÁRIO LOGADO
// =========================
const userLogado = JSON.parse(localStorage.getItem("logado"));
if (userLogado) {
  openLoginBtn.textContent = userLogado.nome.split(" ")[0];
}

// O código não foi encerrado com '})();' para evitar o erro de escopo anterior.
})();