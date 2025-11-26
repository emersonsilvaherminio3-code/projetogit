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

  /* =================== LOGIN / CADASTRO (NOVO BLOCO) =================== */

  // DOM do login (existem no seu HTML)
  const openLoginBtn = document.getElementById("openLoginBtn");
  const loginOverlay = document.getElementById("loginOverlay");
  const loginPopup = document.getElementById("loginPopup");
  const closeLoginBtn = document.getElementById("closeLoginBtn");
  const loginForm = document.getElementById("loginForm");

  // inputs
  const inputNome = loginForm ? loginForm.querySelector("[name='nome']") : null;
  const inputTelefone = loginForm ? loginForm.querySelector("[name='telefone']") : null;
  const inputCpf = loginForm ? loginForm.querySelector("[name='cpf']") : null;
  const inputEndereco = loginForm ? loginForm.querySelector("[name='endereco']") : null;

  // keys localStorage
  const CLIENTES_KEY = "clientesCadastrados";
  const ATIVO_KEY = "usuarioAtivo";

  // modo atual do modal: 'login' ou 'cadastro'
  let loginMode = "login";

  // safety: se o modal não existir, não executamos nada do bloco de login
  if (loginOverlay && loginForm) {
    /* ---------- funções utilitárias do login ---------- */

    // Mostra o overlay
    function showLoginOverlay() {
      loginOverlay.classList.remove("overlay-hidden");
      loginOverlay.classList.add("overlay-active");
      document.body.classList.add("popup-open");
    }
    // Esconde o overlay
    function hideLoginOverlay() {
      loginOverlay.classList.remove("overlay-active");
      loginOverlay.classList.add("overlay-hidden");
      document.body.classList.remove("popup-open");
    }

    // recupera lista de clientes do localStorage
    function getClientes() {
      const raw = localStorage.getItem(CLIENTES_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    // salva lista de clientes no localStorage
    function setClientes(list) {
      localStorage.setItem(CLIENTES_KEY, JSON.stringify(list));
    }

    // grava usuario ativo (após login ou cadastro)
    function setUsuarioAtivo(obj) {
      localStorage.setItem(ATIVO_KEY, JSON.stringify(obj));
      // atualiza label do botão login no header para mostrar nome reduzido
      if (openLoginBtn) {
        const short = obj && obj.nome ? obj.nome.split(" ")[0] : "Entrar";
        openLoginBtn.textContent = short;
      }
    }
    function getUsuarioAtivo() {
      const r = localStorage.getItem(ATIVO_KEY);
      return r ? JSON.parse(r) : null;
    }
    function clearUsuarioAtivo() {
      localStorage.removeItem(ATIVO_KEY);
      if (openLoginBtn) openLoginBtn.textContent = "LOGIN";
    }

    // Toggle UI para mostrar modo (login / cadastro)
    function renderLoginUI(mode) {
      loginMode = mode;
      // formulário tem grupos .form-group — vamos esconder os que não interessam
      const nomeGroup = inputNome ? inputNome.closest(".form-group") : null;
      const enderecoGroup = inputEndereco ? inputEndereco.closest(".form-group") : null;
      const telefoneGroup = inputTelefone ? inputTelefone.closest(".form-group") : null;
      const cpfGroup = inputCpf ? inputCpf.closest(".form-group") : null;

      // header text
      const titleEl = loginPopup.querySelector("h3");
      if (titleEl) titleEl.textContent = mode === "login" ? "Entrar" : "Cadastrar";

      // submit button
      const submitBtn = loginForm.querySelector("button[type='submit']");
      if (submitBtn) submitBtn.textContent = mode === "login" ? "Entrar" : "Cadastrar";

      // For login mode: show telefone + cpf; hide nome + endereco
      if (mode === "login") {
        if (nomeGroup) nomeGroup.style.display = "none";
        if (enderecoGroup) enderecoGroup.style.display = "none";
        if (telefoneGroup) telefoneGroup.style.display = "";
        if (cpfGroup) cpfGroup.style.display = "";
        // add small switch link
        ensureSwitcher();
      } else {
        // cadastro mode: show all (nome, telefone, cpf) - endereco optional
        if (nomeGroup) nomeGroup.style.display = "";
        if (enderecoGroup) enderecoGroup.style.display = "";
        if (telefoneGroup) telefoneGroup.style.display = "";
        if (cpfGroup) cpfGroup.style.display = "";
        ensureSwitcher();
      }
    }

    // adiciona link para alternar entre Entrar / Cadastrar (apenas uma vez)
    function ensureSwitcher() {
      let sw = loginPopup.querySelector(".login-switcher");
      if (sw) return;
      sw = document.createElement("div");
      sw.className = "login-switcher";
      sw.style.marginTop = "10px";
      sw.style.textAlign = "center";
      sw.style.fontSize = "1.2rem";

      const link = document.createElement("a");
      link.href = "#";
      link.style.cursor = "pointer";
      link.style.color = "#0066cc";
      link.style.textDecoration = "underline";

      sw.appendChild(link);
      loginPopup.appendChild(sw);

      link.addEventListener("click", (ev) => {
        ev.preventDefault();
        if (loginMode === "login") renderLoginUI("cadastro");
        else renderLoginUI("login");
      });

      // atualiza texto dinamicamente (quando chamado)
      function updateText() {
        link.textContent = loginMode === "login" ? "Ainda não tem conta? Cadastre-se" : "Já tem conta? Entrar";
      }
      // observe loginMode via small interval update (lightweight)
      const obs = setInterval(() => {
        if (!document.contains(sw)) { clearInterval(obs); return; }
        updateText();
      }, 120);
    }

    // valida e faz login (modo 'login')
    function handleLoginSubmit(formData) {
      const cpf = (formData.get("cpf") || "").toString().trim();
      const telefone = (formData.get("telefone") || "").toString().trim();
      if (!cpf || !telefone) { alert("Preencha CPF e telefone."); return false; }

      const clientes = getClientes();
      const matched = clientes.find(c =>
        (c.cpf && c.cpf.replace(/\D/g, "") === cpf.replace(/\D/g, "")) &&
        (c.telefone && c.telefone.replace(/\D/g, "") === telefone.replace(/\D/g, ""))
      );

      if (matched) {
        // login bem-sucedido
        setUsuarioAtivo(matched);
        alert(`Bem-vindo de volta, ${matched.nome.split(" ")[0]}!`);
        hideLoginOverlay();
        return true;
      } else {
        // não encontrado
        const goRegister = confirm("Conta não encontrada. Deseja se cadastrar?");
        if (goRegister) {
          renderLoginUI("cadastro");
        }
        return false;
      }
    }

    // valida e cadastra novo cliente (modo 'cadastro')
    function handleCadastroSubmit(formData) {
      const nome = (formData.get("nome") || "").toString().trim();
      const cpf = (formData.get("cpf") || "").toString().trim();
      const telefone = (formData.get("telefone") || "").toString().trim();
      const endereco = (formData.get("endereco") || "").toString().trim();

      if (!nome || !cpf || !telefone) { alert("Preencha nome, CPF e telefone."); return false; }

      const clientes = getClientes();

      // evitar duplicado exato por cpf
      const already = clientes.find(c => c.cpf && c.cpf.replace(/\D/g, "") === cpf.replace(/\D/g, ""));
      if (already) {
        const ok = confirm("Já existe um cadastro com esse CPF. Deseja entrar com esse cadastro?");
        if (ok) {
          setUsuarioAtivo(already);
          alert(`Bem-vindo, ${already.nome.split(" ")[0]}!`);
          hideLoginOverlay();
          return true;
        } else {
          return false;
        }
      }

      const novo = { nome, cpf, telefone, endereco, criadoEm: new Date().toISOString() };
      clientes.push(novo);
      setClientes(clientes);
      setUsuarioAtivo(novo);
      alert("Cadastro realizado com sucesso!");
      hideLoginOverlay();
      return true;
    }

    /* ---------- comportamento do formulário ---------- */

    // Ao submeter o formulário — decide entre login ou cadastro
    loginForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      const fd = new FormData(loginForm);

      if (loginMode === "login") {
        handleLoginSubmit(fd);
      } else {
        handleCadastroSubmit(fd);
      }
      // não resetamos automaticamente aqui (o modal fecha em caso de sucesso)
    });

    // Quando abrir o modal: comportamento do botão openLoginBtn
    if (openLoginBtn) {
      openLoginBtn.addEventListener("click", function (ev) {
        ev.preventDefault();
        // se já tem usuario ativo: mostra info e modo 'login' com fields preenchidos
        const ativo = getUsuarioAtivo();
        renderLoginUI("login");
        if (ativo) {
          // preenche telefone/cpf para facilitar logout/visualização
          if (inputTelefone) inputTelefone.value = ativo.telefone || "";
          if (inputCpf) inputCpf.value = ativo.cpf || "";
        } else {
          // limpa campos para novo login
          if (inputNome) inputNome.value = "";
          if (inputTelefone) inputTelefone.value = "";
          if (inputCpf) inputCpf.value = "";
          if (inputEndereco) inputEndereco.value = "";
        }
        showLoginOverlay();
      });
    }

    // Fechar modal
    if (closeLoginBtn) closeLoginBtn.addEventListener("click", function (ev) {
      ev.preventDefault();
      hideLoginOverlay();
    });
    loginOverlay.addEventListener("click", function (e) {
      if (e.target === loginOverlay) hideLoginOverlay();
    });
    if (loginPopup) loginPopup.addEventListener("click", e => e.stopPropagation());

    // Ativa auto-salvamento rápido (último typed) para conforto: guarda em "ultimoLoginTemp"
    loginForm.addEventListener("input", () => {
      try {
        const data = Object.fromEntries(new FormData(loginForm).entries());
        localStorage.setItem("ultimoLoginTemp", JSON.stringify(data));
      } catch (err) { /* ignore */ }
    });

    // Ao carregar a página, tenta preencher campos com "usuarioAtivo" ou "ultimoLoginTemp"
    document.addEventListener("DOMContentLoaded", () => {
      const ativo = getUsuarioAtivo();
      if (ativo) {
        if (inputNome) inputNome.value = ativo.nome || "";
        if (inputTelefone) inputTelefone.value = ativo.telefone || "";
        if (inputCpf) inputCpf.value = ativo.cpf || "";
        if (inputEndereco) inputEndereco.value = ativo.endereco || "";
        // atualiza botão
        if (openLoginBtn && ativo.nome) openLoginBtn.textContent = ativo.nome.split(" ")[0];
      } else {
        const tmp = localStorage.getItem("ultimoLoginTemp");
        if (tmp) {
          try {
            const parsed = JSON.parse(tmp);
            if (inputNome && parsed.nome) inputNome.value = parsed.nome;
            if (inputTelefone && parsed.telefone) inputTelefone.value = parsed.telefone;
            if (inputCpf && parsed.cpf) inputCpf.value = parsed.cpf;
            if (inputEndereco && parsed.endereco) inputEndereco.value = parsed.endereco;
          } catch (err) { /* ignore parse */ }
        }
      }
    });

    // Expor função de logout rápida (pode ser chamada do console ou futuro botão)
    window.tdnLogout = function () {
      clearUsuarioAtivo();
      alert("Desconectado.");
    };

    // Inicializa a UI do modal em modo login
    renderLoginUI("login");
  } // fim bloco login existente

  /* =================== FIM BLOCO =================== */

})(); // fim IIFE
