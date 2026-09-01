/**
 * UI — Controlador de vista (capa de presentacion, lado cliente).
 * No contiene reglas de negocio: urgencias, scores y escalado
 * llegan ya calculados desde los servicios del backend.
 */
import { api } from './api.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

const state = {
  view: 'pantry',
  category: 'Todas',
  servings: 2,
  openRecipeId: null,
};

const esc = (s) => String(s ?? '').replace(/[&<>"']/g,
  (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmt = (n) => (Number.isInteger(n) ? n : Number(n).toFixed(1));

/* ------------------------------- Toast ------------------------------- */
let toastTimer;
function toast(message, kind = 'ok') {
  const el = $('#toast');
  el.textContent = message;
  el.className = `toast${kind === 'error' ? ' toast--error' : ''}`;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 4200);
}

/* -------------------------------- Tabs ------------------------------- */
$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    state.view = tab.dataset.view;
    $$('.tab').forEach((t) => {
      const active = t === tab;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', String(active));
    });
    $$('.view').forEach((v) => v.classList.toggle('is-active', v.id === `view-${state.view}`));
    if (state.view === 'recipes') loadRecipes();
    if (state.view === 'history') loadHistory();
  });
});

/* ============================== DESPENSA ============================== */
function jarTemplate(item) {
  const tone = item.badge.tone;
  return `
    <article class="jar jar--${tone}" data-id="${item.id}">
      <span class="jar-status" title="${esc(item.badge.label)}">${item.badge.dot}</span>
      <div>
        <div class="jar-name">${esc(item.name)}</div>
        <div class="jar-meta">${fmt(item.quantity)} ${esc(item.unit)} · ${esc(item.category)}</div>
      </div>
      <span class="jar-expiry">${esc(item.expiryText)}</span>
      <button class="jar-remove" data-remove="${item.id}" title="Quitar de la despensa">✕</button>
    </article>`;
}

function renderShelves(items) {
  const host = $('#shelves');
  if (!items.length) {
    host.innerHTML = `<p class="empty-note">La alacena está vacía. Añade algo en la pizarra de la izquierda.</p>`;
    return;
  }
  // Se agrupa por categoria manteniendo el orden por urgencia del backend.
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }
  host.innerHTML = [...groups].map(([cat, list]) => `
    <section class="shelf">
      <h3 class="shelf-label">${esc(cat)}</h3>
      ${list.map(jarTemplate).join('')}
    </section>`).join('');
}

function renderFilters(categories) {
  $('#categoryFilters').innerHTML = categories.map((c) =>
    `<button class="filter${c === state.category ? ' is-active' : ''}" data-category="${esc(c)}">${esc(c)}</button>`
  ).join('');
}

function renderSummary(summary) {
  $('#rescueCount').textContent = summary.atRisk;
  $('#rescueMeter').title =
    `${summary.total} lotes · ${summary.urgent} urgentes · ${summary.expired} vencidos · ${summary.soon} por consumir`;
}

async function loadPantry() {
  try {
    const data = await api.getPantry(state.category);
    renderFilters(data.categories);
    renderShelves(data.items);
    renderSummary(data.summary);
    $('#ingredientList').innerHTML =
      [...new Set(data.items.map((i) => i.name))].map((n) => `<option value="${esc(n)}">`).join('');
  } catch (err) {
    toast(err.message, 'error');
  }
}

$('#categoryFilters').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-category]');
  if (!btn) return;
  state.category = btn.dataset.category;
  loadPantry();
});

// Microinteraccion: el lote se "tacha" y se desliza antes de desaparecer.
$('#shelves').addEventListener('click', async (e) => {
  const btn = e.target.closest('[data-remove]');
  if (!btn) return;
  const jar = btn.closest('.jar');
  jar.classList.add('is-consumed');
  try {
    await api.removeItem(Number(btn.dataset.remove));
    setTimeout(loadPantry, 320);
  } catch (err) {
    jar.classList.remove('is-consumed');
    toast(err.message, 'error');
  }
});

/* --------------------------- Alta de lote ---------------------------- */
$('#addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const fd = new FormData(form);
  $('#addError').textContent = '';
  try {
    await api.addItem({
      name: fd.get('name'),
      category: fd.get('category'),
      quantity: Number(fd.get('quantity')),
      unit: fd.get('unit'),
      expiryDate: fd.get('expiryDate'),
    });
    form.reset();
    toast('Guardado en la alacena 🧺');
    loadPantry();
  } catch (err) {
    const detail = err.details ? Object.values(err.details).join(' · ') : err.message;
    $('#addError').textContent = detail;
  }
});

// Por defecto, caducidad a 5 dias vista.
(function primeDate() {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  $('#addForm [name="expiryDate"]').value = d.toISOString().slice(0, 10);
})();

/* ============================== RECETAS =============================== */
function chipFor(ing) {
  if (!ing.inPantry || !ing.enough) return `<span class="chip chip--missing">${esc(ing.name)}</span>`;
  const tone = ing.badge?.tone;
  if (tone === 'urgent' || tone === 'expired') return `<span class="chip chip--urgent">${ing.badge.dot} ${esc(ing.name)}</span>`;
  if (tone === 'soon') return `<span class="chip chip--soon">${ing.badge.dot} ${esc(ing.name)}</span>`;
  return `<span class="chip">${esc(ing.name)}</span>`;
}

function cardTemplate(recipe, maxScore, index) {
  const pct = maxScore > 0 ? Math.round((recipe.score / maxScore) * 100) : 0;
  const tagClass = recipe.atRiskCount > 0 ? 'rescue-tag' : 'rescue-tag rescue-tag--calm';
  return `
    <article class="card${index === 0 ? ' is-top' : ''}" data-recipe="${recipe.id}" tabindex="0">
      ${index === 0 ? '<span class="card-rank">Mejor rescate</span>' : ''}
      <h3>${esc(recipe.title)}</h3>
      <div class="card-meta">
        <span>⏲️ ${recipe.minutes} min</span>
        <span>👥 ${recipe.servings} comensales</span>
        <span>🧺 ${recipe.coveragePct}% en despensa</span>
      </div>
      <div class="score-strip">
        <span class="score-value">${recipe.score.toFixed(1)}</span>
        <div class="score-bar"><div class="score-fill" style="width:${pct}%"></div></div>
      </div>
      <span class="${tagClass}">🔥 ${esc(recipe.highlight)}</span>
      <div class="chip-row">${recipe.ingredients.map(chipFor).join('')}</div>
      <p class="coverage-note">${recipe.cookable
        ? '✅ Tienes todo lo necesario'
        : `⚠️ Faltan ${recipe.missing.length}: ${esc(recipe.missing.map((m) => m.name).join(', '))}`}</p>
    </article>`;
}

async function loadRecipes() {
  try {
    const { recipes } = await api.getRecipes(state.servings);
    const max = Math.max(...recipes.map((r) => r.score), 0);
    $('#recipeCards').innerHTML = recipes.length
      ? recipes.map((r, i) => cardTemplate(r, max, i)).join('')
      : `<p class="empty-note">Aún no hay recetas cargadas.</p>`;
  } catch (err) {
    toast(err.message, 'error');
  }
}

// Selector de porciones: recalcula en tiempo real (PortionScalingService).
$$('.serv').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.servings = Number(btn.dataset.servings);
    $$('.serv').forEach((b) => b.classList.toggle('is-active', b === btn));
    loadRecipes();
    if (state.openRecipeId) openRecipe(state.openRecipeId);
  });
});

$('#recipeCards').addEventListener('click', (e) => {
  const card = e.target.closest('[data-recipe]');
  if (card) openRecipe(Number(card.dataset.recipe));
});
$('#recipeCards').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const card = e.target.closest('[data-recipe]');
  if (card) { e.preventDefault(); openRecipe(Number(card.dataset.recipe)); }
});

/* ====================== FICHA DE RECETA (MODAL) ======================= */
function sheetTemplate(r) {
  return `
    <h2 class="sheet-title" id="sheetTitle">${esc(r.title)}</h2>
    <p class="sheet-desc">${esc(r.description)}</p>
    <div class="card-meta" style="padding-left:0">
      <span>⏲️ ${r.minutes} min</span>
      <span>📈 Score ${r.score.toFixed(1)}</span>
      <span>🧺 ${r.coveragePct}% disponible</span>
    </div>

    <h3 class="sheet-section-title">Ingredientes para ${r.servings} comensales</h3>
    <div class="ing-table">
      ${r.ingredients.map((i) => `
        <div class="ing-row${i.enough ? '' : ' is-missing'}">
          <span>${esc(i.name)}</span>
          <span class="ing-qty">${fmt(i.quantity)} ${esc(i.unit)}</span>
          <span class="ing-flag">${i.enough
            ? `${i.badge.dot} ${esc(i.badge.label)}`
            : i.inPantry ? `⚠️ solo ${fmt(i.available)} ${esc(i.unit)}` : '✕ no tienes'}</span>
        </div>`).join('')}
    </div>

    <h3 class="sheet-section-title">Preparación</h3>
    <ol class="sheet-steps">${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>

    ${r.cookable ? '' : `<p class="missing-note">Faltan ingredientes: ${
      esc(r.missing.map((m) => `${m.name} (tienes ${fmt(m.available)} de ${fmt(m.needed)} ${m.unit})`).join(' · '))
    }</p>`}

    <div class="sheet-footer">
      <div class="sheet-servings">
        ${[1, 2, 4, 6].map((s) => `
          <button class="serv${s === r.servings ? ' is-active' : ''}" data-sheet-servings="${s}">${s}</button>
        `).join('')}
      </div>
      <button class="btn btn--cook" id="cookBtn" data-recipe="${r.id}" ${r.cookable ? '' : 'disabled'}>
        🍲 ${r.cookable ? '¡Cocinada!' : 'Faltan ingredientes'}
      </button>
    </div>`;
}

async function openRecipe(id) {
  try {
    const recipe = await api.getRecipe(id, state.servings);
    state.openRecipeId = id;
    $('#sheetBody').innerHTML = sheetTemplate(recipe);
    $('#modal').hidden = false;
  } catch (err) {
    toast(err.message, 'error');
  }
}

function closeSheet() {
  $('#modal').hidden = true;
  state.openRecipeId = null;
}

$('#sheetClose').addEventListener('click', closeSheet);
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeSheet(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) closeSheet(); });

// Delegacion dentro de la ficha: porciones + boton "¡Cocinada!".
$('#sheetBody').addEventListener('click', async (e) => {
  const servBtn = e.target.closest('[data-sheet-servings]');
  if (servBtn) {
    state.servings = Number(servBtn.dataset.sheetServings);
    $$('.serv[data-servings]').forEach((b) =>
      b.classList.toggle('is-active', Number(b.dataset.servings) === state.servings));
    openRecipe(state.openRecipeId);
    loadRecipes();
    return;
  }

  const cookBtn = e.target.closest('#cookBtn');
  if (!cookBtn || cookBtn.disabled) return;

  // Microinteraccion: la olla "hierve" mientras se ejecuta la transaccion.
  cookBtn.classList.add('is-cooking');
  cookBtn.disabled = true;
  try {
    const result = await api.cook(Number(cookBtn.dataset.recipe), state.servings);
    closeSheet();
    toast(result.message);
    await Promise.all([loadPantry(), loadRecipes()]);
  } catch (err) {
    const missing = err.details?.missing
      ?.map((m) => `${m.name} (faltan ${fmt(m.shortBy ?? m.needed)} ${m.unit})`).join(' · ');
    toast(missing ? `${err.message}: ${missing}` : err.message, 'error');
  } finally {
    cookBtn.classList.remove('is-cooking');
    cookBtn.disabled = false;
  }
});

/* ============================== HISTORIAL ============================= */
async function loadHistory() {
  try {
    const { logs } = await api.history();
    $('#historyList').innerHTML = logs.length ? logs.map((l) => `
      <article class="log">
        <h3>${esc(l.recipeTitle)}</h3>
        <p class="log-meta">${new Date(l.cookedAt.replace(' ', 'T') + 'Z').toLocaleString('es')} · ${l.servings} comensales</p>
        <p class="log-consumed">Descontado: ${esc(l.consumed.map((c) => `${c.ingredientName} ${fmt(c.quantity)} ${c.unit}`).join(', '))}</p>
        ${l.savedItems > 0 ? `<span class="log-saved">♻️ ${l.savedItems} rescatado(s) del desperdicio</span>` : ''}
      </article>`).join('')
      : `<p class="empty-note">Todavía no has cocinado nada. ¡La despensa espera!</p>`;
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ------------------------------ Arranque ----------------------------- */
loadPantry();
