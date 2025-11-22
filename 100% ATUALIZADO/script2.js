/* script2.js
  - quick add: click tamanho dentro do card => adiciona item (mensagem toast)
  - "Pedir agora": abre modal do carrinho com a pizza selecionada (nome/desc),
    permite escolher tamanho e quantidade, adicionar ao carrinho
  - carrinho persistente em localStorage (key: "carrinho")
  - remover / ajustar qty no modal, finalizar pedido via WhatsApp
  - número WhatsApp: 55 81 9964 1479 => "5581999641479"
*/

(function () {
  // CONFIG
  const STORAGE_KEY = "carrinho";
  const WHATSAPP_NUMBER = "5581999641479"; // formato internacional sem +
  // DOM
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

  // modal selected product elements
  const selectedProductEl = document.getElementById("selected-product");
  const selectedNameEl = document.getElementById("selected-name");
  const selectedDescEl = document.getElementById("selected-desc");
  const modalTamanhosEl = document.getElementById("modal-tamanhos");
  const qtyDecreaseBtn = document.getElementById("qty-decrease");
  const qtyIncreaseBtn = document.getElementById("qty-increase");
  const qtyValueEl = document.getElementById("qty-value");
  const modalAddBtn = document.getElementById("modal-add-btn");
  const cartModalTitle = document.getElementById("cart-modal-title");

  // state
  let cart = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  let modalSelected = null; // { name, desc, sizes: [{size, price}], chosenSize, qty }

  // util
  function saveCart() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); }
  function formatBRL(n) {
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }
  function showToast(message = "Adicionado ao carrinho!") {
    toast.textContent = message;
    toast.classList.add("toast-show");
    setTimeout(() => toast.classList.remove("toast-show"), 1500);
  }
  function updateBadge() {
    const totalQty = cart.reduce((s, it) => s + it.quantity, 0);
    cartBadge.textContent = totalQty;
  }

  // read sizes from a .produto's .tamanhos buttons
  function buildSizesFromProduct(prodElem) {
    const btns = Array.from(prodElem.querySelectorAll(".tamanho-btn"));
    return btns.map(b => ({ size: b.dataset.size, price: parseFloat(b.dataset.price) }));
  }

  // quick add: when clicking a tamanho button inside product card
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

  // "Pedir agora" opens modal with selected product preloaded (not yet added)
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

  // open cart via header button (no selected product)
  openCartBtn.addEventListener("click", function (ev) {
    ev.preventDefault();
    modalSelected = null; // open without preselected product
    openCartModal(false);
  });

  function openCartModal(withSelected) {
    cartOverlay.classList.remove("overlay-hidden");
    cartOverlay.classList.add("overlay-active");
    document.body.classList.add("popup-open");

    // render selected product area
    if (withSelected && modalSelected) {
      selectedProductEl.style.display = "block";
      selectedNameEl.textContent = modalSelected.name;
      selectedDescEl.textContent = modalSelected.desc || "";
      qtyValueEl.textContent = modalSelected.qty;

      // build sizes buttons
      modalTamanhosEl.innerHTML = "";
      modalSelected.sizes.forEach(sz => {
        const b = document.createElement("button");
        b.className = "modal-size";
        b.dataset.size = sz.size;
        b.dataset.price = sz.price;
        b.textContent = `${sz.size} — ${formatBRL(sz.price)}`;
        b.addEventListener("click", () => {
          // toggle active
          Array.from(modalTamanhosEl.children).forEach(x => x.classList.remove("active"));
          b.classList.add("active");
          modalSelected.chosenSize = sz;
          updateModalPrice();
        });
        modalTamanhosEl.appendChild(b);
      });
      cartModalTitle.textContent = `Pedido — ${modalSelected.name}`;
    } else {
      // hide selected product area
      selectedProductEl.style.display = "none";
      cartModalTitle.textContent = "Seu Carrinho";
    }

    renderCartItems();
    updateBadge();
  }

  // close handlers
  closeCartBtn.addEventListener("click", closeCartModal);
  cartOverlay.addEventListener("click", function (e) {
    if (e.target === cartOverlay) closeCartModal();
  });
  if (cartPopup) cartPopup.addEventListener("click", e => e.stopPropagation());

  function closeCartModal() {
    cartOverlay.classList.remove("overlay-active");
    cartOverlay.classList.add("overlay-hidden");
    document.body.classList.remove("popup-open");
    // reset modal qty selection
    if (modalSelected) {
      modalSelected.qty = 1;
      modalSelected.chosenSize = null;
    }
  }

  // qty controls in modal
  qtyDecreaseBtn.addEventListener("click", () => {
    if (!modalSelected) return;
    if (modalSelected.qty > 1) modalSelected.qty--;
    qtyValueEl.textContent = modalSelected.qty;
    updateModalPrice();
  });
  qtyIncreaseBtn.addEventListener("click", () => {
    if (!modalSelected) return;
    modalSelected.qty++;
    qtyValueEl.textContent = modalSelected.qty;
    updateModalPrice();
  });

  function updateModalPrice() {
    // optionally can show live price; currently we keep the UI minimal (you can extend)
    // we could update a small span showing total for selected product
  }

  // add from modal button
  modalAddBtn.addEventListener("click", () => {
    if (!modalSelected) return alert("Escolha um tamanho antes de adicionar.");

    if (!modalSelected.chosenSize) return alert("Escolha um tamanho antes de adicionar.");
    const { name, chosenSize, qty } = modalSelected;
    addToCart({ name, size: chosenSize.size, price: chosenSize.price, quantity: Number(qty) });
    showToast("Adicionado ao carrinho!");
    // reset modal selected area but keep modal open showing cart
    modalSelected = null;
    // re-render will hide selected product area
    openCartModal(false);
  });

  // CART operations
  function addToCart(item) {
    // item: { name, size, price, quantity }
    const existing = cart.find(it => it.name === item.name && String(it.size) === String(item.size) && Number(it.price) === Number(item.price));
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
    cartItemsEl.innerHTML = "";
    if (!cart.length) {
      const li = document.createElement("li");
      li.textContent = "Seu carrinho está vazio.";
      li.style.padding = "8px";
      cartItemsEl.appendChild(li);
      cartTotalEl.textContent = formatBRL(0);
      return;
    }

    cart.forEach((it, idx) => {
      const li = document.createElement("li");
      li.className = "cart-item";

      const left = document.createElement("div");
      left.className = "item-left";
      left.innerHTML = `<strong>${it.name}</strong><small>${it.size}</small><small>${formatBRL(it.price)} un.</small>`;

      const right = document.createElement("div");
      right.className = "item-right";
      const dec = document.createElement("button");
      dec.className = "qty-btn";
      dec.textContent = "−";
      dec.addEventListener("click", () => {
        if (it.quantity > 1) it.quantity--;
        else {
          // remove
          cart.splice(idx, 1);
        }
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

    // total
    const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);
    cartTotalEl.textContent = formatBRL(total);
  }

  // clear cart
  clearCartBtn.addEventListener("click", () => {
    if (!cart.length) return;
    if (!confirm("Deseja limpar todo o carrinho?")) return;
    cart = [];
    saveCart();
    renderCartItems();
    updateBadge();
  });

  // checkout -> WhatsApp
  checkoutBtn.addEventListener("click", () => {
    if (!cart.length) { alert("Seu carrinho está vazio!"); return; }

    let message = "Olá! Gostaria de fazer o pedido:%0A%0A";
    cart.forEach((it, i) => {
      message += `${i + 1}. ${it.name} — ${it.size} — ${it.quantity} x R$ ${it.price.toFixed(2).replace(".", ",")} = R$ ${(it.price * it.quantity).toFixed(2).replace(".", ",")}%0A`;
    });
    const total = cart.reduce((s, it) => s + it.price * it.quantity, 0);
    message += `%0ATotal: R$ ${total.toFixed(2).replace(".", ",")}%0A%0A`;
    message += "Endereço: %0A";
    message += "%0AForma de pagamento: %0A";

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
    window.open(url, "_blank");
  });

  // initialize
  function init() {
    renderCartItems();
    updateBadge();
  }
  init();

  // login modal code (kept simple and robust)
  document.addEventListener("DOMContentLoaded", function () {
    const openLoginBtn = document.getElementById("openLoginBtn");
    const loginOverlay = document.getElementById("loginOverlay");
    const closeLoginBtn = document.getElementById("closeLoginBtn");
    const loginPopup = document.getElementById("loginPopup");
    const loginForm = document.getElementById("loginForm");

    if (!loginOverlay) return;

    function showLogin() {
      loginOverlay.classList.remove("overlay-hidden");
      loginOverlay.classList.add("overlay-active");
      document.body.classList.add("popup-open");
    }
    function hideLogin() {
      loginOverlay.classList.remove("overlay-active");
      loginOverlay.classList.add("overlay-hidden");
      document.body.classList.remove("popup-open");
    }

    if (openLoginBtn) openLoginBtn.addEventListener("click", (e) => { e.preventDefault(); showLogin(); });
    if (closeLoginBtn) closeLoginBtn.addEventListener("click", hideLogin);
    loginOverlay.addEventListener("click", (e) => { if (e.target === loginOverlay) hideLogin(); });
    if (loginPopup) loginPopup.addEventListener("click", e => e.stopPropagation());

   
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(loginForm).entries());
        if (!data.nome || !data.telefone) { alert("Preencha nome e telefone."); return; }
        const key = "clientesCadastrados";
        const existingJSON = localStorage.getItem(key);
        const lista = existingJSON ? JSON.parse(existingJSON) : [];
        lista.push(data);
        localStorage.setItem(key, JSON.stringify(lista));
        alert("Cadastro salvo com sucesso!");
        hideLogin();
        loginForm.reset();
      });
    }
  });

})();

