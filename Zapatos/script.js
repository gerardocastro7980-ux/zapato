const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* Menú móvil */
const nav = $("#nav");
$("#menuButton").addEventListener("click", () => nav.classList.toggle("active"));
$$("#nav a").forEach(a => a.addEventListener("click", () => nav.classList.remove("active")));

/* Modo oscuro (recuerda la elección) */
const body = document.body;
try { if (localStorage.getItem("tema") === "dark") body.classList.add("dark"); } catch (e) {}
$("#darkMode").addEventListener("click", () => {
  body.classList.toggle("dark");
  try { localStorage.setItem("tema", body.classList.contains("dark") ? "dark" : "light"); } catch (e) {}
});

/* Filtros, colores y orden */
const grid = $(".grid");
const cards = $$(".card");
const original = [...cards];
let cat = "all", color = "all";

function aplicar() {
  let visibles = 0;
  cards.forEach(c => {
    const ok = (cat === "all" || c.dataset.cat === cat) && (color === "all" || c.dataset.color === color);
    c.style.display = ok ? "" : "none";
    if (ok) visibles++;
  });
  $("#noResults").hidden = visibles > 0;
}

function ordenar(modo) {
  const precio = c => parseFloat($(".card-photo", c).dataset.price.replace(/[^0-9.]/g, ""));
  const lista = modo === "default" ? original : [...cards].sort((a, b) => modo === "asc" ? precio(a) - precio(b) : precio(b) - precio(a));
  lista.forEach(c => grid.appendChild(c));
}

function activar(grupo, btn) {
  $$("button", grupo).forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

$$("#catFilters button").forEach(b => b.addEventListener("click", () => { cat = b.dataset.cat; activar($("#catFilters"), b); aplicar(); }));
$$("#colorFilters button").forEach(b => b.addEventListener("click", () => { color = b.dataset.color; activar($("#colorFilters"), b); aplicar(); }));
$("#sort").addEventListener("change", e => ordenar(e.target.value));

/* Favoritos */
let favs = 0;
$$(".favorite").forEach(btn => btn.addEventListener("click", e => {
  e.stopPropagation();
  const on = btn.classList.toggle("active");
  btn.textContent = on ? "♥" : "♡";
  favs += on ? 1 : -1;
  $("#favCount").textContent = favs;
}));

/* Modal con tallas y bolsa */
const modal = $("#modal"), sizesBox = $("#sizes"), modalMsg = $("#modalMsg");
let talla = null, modalData = null;

["5","6","7","8","9","10","11","12"].forEach(t => {
  const b = document.createElement("button");
  b.textContent = t;
  b.addEventListener("click", () => {
    $$("button", sizesBox).forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    talla = t;
    modalMsg.textContent = "";
  });
  sizesBox.appendChild(b);
});

$$(".card-photo").forEach(p => p.addEventListener("click", () => {
  const d = p.dataset;
  $("#imagenModal").src = d.image;
  $("#imagenModal").alt = d.model + " " + d.color;
  $("#imagenModal").classList.toggle("cutout", p.classList.contains("cutout"));
  $("#modeloModal").textContent = d.model;
  $("#colorModal").textContent = d.color;
  $("#precioModal").textContent = d.price;
  modalData = d; talla = null;
  modalMsg.textContent = "";
  $$("button", sizesBox).forEach(x => x.classList.remove("active"));
  modal.classList.add("active");
  body.style.overflow = "hidden";
}));

function closeModal() { modal.classList.remove("active"); body.style.overflow = ""; }
$("#cerrar").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

/* Bolsa */
let cart = [];
try { cart = JSON.parse(localStorage.getItem("bolsa")) || []; } catch (e) {}
const drawer = $("#drawer"), overlay = $("#overlay");
const money = n => "$" + n.toLocaleString("es");
const FREE = 100;

function openDrawer() { drawer.classList.add("active"); overlay.classList.add("active"); body.style.overflow = "hidden"; }
function closeDrawer() { drawer.classList.remove("active"); overlay.classList.remove("active"); body.style.overflow = ""; }

function renderCart() {
  const box = $("#cartItems");
  box.innerHTML = "";
  if (!cart.length) box.innerHTML = '<p class="empty">Tu bolsa está vacía.</p>';
  cart.forEach((it, i) => {
    const el = document.createElement("div");
    el.className = "item";
    el.innerHTML = `<img src="${it.image}" alt="${it.model}">
      <div><h3>${it.model}</h3><p>${it.color} · Talla ${it.talla}</p>
      <div class="item-row"><div class="qty"><button data-a="menos" aria-label="Quitar uno">−</button><span>${it.qty}</span><button data-a="mas" aria-label="Añadir uno">+</button></div><strong>${money(it.price * it.qty)}</strong></div>
      <button class="remove" data-a="borrar">Eliminar</button></div>`;
    el.addEventListener("click", e => {
      const a = e.target.dataset.a;
      if (a === "mas") it.qty++;
      else if (a === "menos") it.qty--;
      else if (a === "borrar") it.qty = 0;
      else return;
      if (it.qty <= 0) cart.splice(i, 1);
      renderCart();
    });
    box.appendChild(el);
  });
  const count = cart.reduce((s, it) => s + it.qty, 0);
  const total = cart.reduce((s, it) => s + it.qty * it.price, 0);
  $("#cartCount").textContent = count;
  $("#cartTotal").textContent = money(total);
  const falta = FREE - total;
  $("#shipText").textContent = total === 0 ? "Envío gratis desde " + money(FREE)
    : falta > 0 ? "Te faltan " + money(falta) + " para envío gratis" : "Tienes envío gratis";
  $("#shipBar").style.width = Math.min(100, total / FREE * 100) + "%";
  try { localStorage.setItem("bolsa", JSON.stringify(cart)); } catch (e) {}
}

$("#addCart").addEventListener("click", () => {
  if (!talla) { modalMsg.textContent = "Elige una talla para continuar."; return; }
  const price = parseFloat(modalData.price.replace(/[^0-9.]/g, ""));
  const found = cart.find(it => it.image === modalData.image && it.talla === talla);
  if (found) found.qty++;
  else cart.push({ model: modalData.model, color: modalData.color, image: modalData.image, price, talla, qty: 1 });
  renderCart();
  closeModal();
  openDrawer();
});

$("#bagButton").addEventListener("click", openDrawer);
$("#closeDrawer").addEventListener("click", closeDrawer);
overlay.addEventListener("click", closeDrawer);
$("#checkout").addEventListener("click", () => {
  $("#cartMsg").textContent = cart.length ? "Esta es una demo: aquí iría el pago." : "Añade un zapato primero.";
});
renderCart();

/* Lookbook */
const strip = $("#strip");
const paso = () => strip.firstElementChild.getBoundingClientRect().width + 20;
$("#prev").addEventListener("click", () => strip.scrollBy({ left: -paso(), behavior: "smooth" }));
$("#next").addEventListener("click", () => strip.scrollBy({ left: paso(), behavior: "smooth" }));

/* Newsletter */
$("#subscribe").addEventListener("click", () => {
  const v = $("#email").value.trim();
  $("#newsMsg").textContent = /^\S+@\S+\.\S+$/.test(v)
    ? "Listo, te enviamos tu código de 10%."
    : "Escribe un correo válido.";
});

/* Volver arriba y teclado */
const backTop = $("#backTop");
window.addEventListener("scroll", () => backTop.classList.toggle("show", scrollY > 600));
backTop.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeModal(); closeDrawer(); } });

/* ===== MOVIMIENTO ===== */
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Barra de progreso + header que se esconde al bajar */
const prog = document.createElement("div");
prog.id = "progress";
document.body.appendChild(prog);
const header = $(".header");
let lastY = 0, ticking = false;
const parallax = $$("[data-parallax]");
const heroImg = $(".hero-photo img");

function onScroll() {
  const y = scrollY;
  const max = document.documentElement.scrollHeight - innerHeight;
  prog.style.width = (max > 0 ? y / max * 100 : 0) + "%";
  header.classList.toggle("hide", y > lastY && y > 300 && !nav.classList.contains("active"));
  lastY = y;
  if (!reduce) {
    if (heroImg && y < innerHeight) heroImg.style.transform = `scale(1.06) translateY(${y * .06}px)`;
    parallax.forEach(img => {
      const r = img.parentElement.getBoundingClientRect();
      if (r.bottom > 0 && r.top < innerHeight) {
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        img.style.transform = `translateY(${p * -40}px)`;
      }
    });
  }
  ticking = false;
}
addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

/* Aparición al hacer scroll (escalonada) */
const groups = [".section-head", ".card", ".split-item", ".strip", ".story-text", ".story-photo", ".detail", ".reviews h2", ".quotes", ".faq h2", ".faq details", ".newsletter h2", ".news-form", ".footer>div", ".perks div"];
groups.forEach(sel => $$(sel).forEach((el, i) => { el.classList.add("reveal"); el.style.setProperty("--d", (i % 3) * 0.12 + "s"); }));
const io = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { threshold: .12 });
$$(".reveal").forEach(el => io.observe(el));

/* Contadores */
const cio = new IntersectionObserver(es => es.forEach(e => {
  if (!e.isIntersecting) return;
  cio.unobserve(e.target);
  const el = e.target, end = parseFloat(el.dataset.count), dec = +(el.dataset.decimals || 0), suf = el.dataset.suffix || "";
  if (reduce) { el.textContent = end.toFixed(dec) + suf; return; }
  const t0 = performance.now();
  (function tick(t) {
    const p = Math.min((t - t0) / 1600, 1), v = end * (1 - Math.pow(1 - p, 3));
    el.textContent = v.toFixed(dec) + suf;
    if (p < 1) requestAnimationFrame(tick);
  })(t0);
}), { threshold: .6 });
$$("[data-count]").forEach(el => cio.observe(el));

/* Reseñas que rotan */
const quotes = $$(".quote"), qdots = $("#qdots");
let q = 0, qTimer;
quotes.forEach((_, i) => {
  const b = document.createElement("button");
  b.setAttribute("aria-label", "Reseña " + (i + 1));
  b.addEventListener("click", () => { showQuote(i); restartQ(); });
  qdots.appendChild(b);
});
function showQuote(i) {
  q = i;
  quotes.forEach((el, k) => el.classList.toggle("active", k === i));
  $$("button", qdots).forEach((b, k) => b.classList.toggle("active", k === i));
}
function restartQ() { clearInterval(qTimer); if (!reduce) qTimer = setInterval(() => showQuote((q + 1) % quotes.length), 5000); }
showQuote(0); restartQ();
onScroll();