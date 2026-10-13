/**
 * UI — Controlador de vista (capa de presentacion, lado cliente).
 * Integra las 2 funciones stateless, las 2 funciones stateful, el módulo de i18n
 * y validación mediante Expresiones Regulares (Regex):
 *
 * FUNCIONES STATELESS:
 *   - calculateEcoImpact: cálculo puro del ahorro ecológico de ingredientes.
 *   - calculateShoppingListDiff: cálculo funcional de diferencias entre receta y despensa.
 *
 * FUNCIONES STATEFUL:
 *   - createFavoritesTracker: gestor con estado de recetas favoritas en sesión.
 *   - createWasteSavingsTracker: acumulador con estado del ahorro ecológico y racha.
 *   - createI18nManager: gestor con estado de idioma (es / en).
 *
 * VALIDACIÓN REGEX:
 *   - validateIngredientName, validateQuantity, validateExpiryDate, validatePantryForm.
 */
import { api } from './api.js';
import { calculateEcoImpact, calculateShoppingListDiff } from './statelessFunctions.js';
import { createFavoritesTracker, createWasteSavingsTracker } from './statefulFunctions.js';
import { createI18nManager } from './i18n.js';
import {
  validateIngredientName,
  validateQuantity,
  validateExpiryDate,
  validatePantryForm,
} from './validators.js';
import { externalService } from './externalService.js';
import { createWebSocketClient } from './wsClient.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

// Instancias de las funciones stateful en cliente
const favoritesTracker = createFavoritesTracker();
const wasteSavingsTracker = createWasteSavingsTracker();
const i18n = createI18nManager('es');
const wsClient = createWebSocketClient();
let currentWsClientsCount = 1;

let pantryCache = [];

const state = {
  view: 'pantry',
  category: 'Todas',
  servings: 2,
  openRecipeId: null,
  onlyFavorites: false,
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

/* ------------------------- Internacionalización (i18n) ---------------- */
function applyStaticTranslations() {
  document.documentElement.lang = i18n.getLang();

  $$('[data-i18n]').forEach((el) => {
    const key = el.dataset.i18n;
    el.textContent = i18n.t(key);
  });

  $$('[data-i18n-placeholder]').forEach((el) => {
    const key = el.dataset.i18nPlaceholder;
    el.placeholder = i18n.t(key);
  });

  const titleEl = $('#recipesMainTitle');
  if (titleEl) {
    titleEl.innerHTML = `${i18n.t('recipes.title', { scoreEmphasis: `<em>${esc(i18n.t('recipes.scoreName'))}</em>` })}`;
  }

  const langSelect = $('#langSelect');
  if (langSelect && langSelect.value !== i18n.getLang()) {
    langSelect.value = i18n.getLang();
  }

  updateFavControls();
  updateSessionMeters();
  updateWsBadge(wsClient.isConnected() ? 'connected' : 'connecting');
}

// Menú desplegable de selección de idioma
const langSelect = $('#langSelect');
if (langSelect) {
  langSelect.addEventListener('change', (e) => {
    const lang = e.target.value;
    i18n.setLang(lang);
    applyStaticTranslations();
    revalidateFormInCurrentLang();
    loadPantry();
    loadRecipes();
    if (state.openRecipeId) openRecipe(state.openRecipeId);
    if (state.view === 'history') loadHistory();
    if (state.view === 'external') loadExternalView();
  });
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
    if (state.view === 'external') loadExternalView();
  });
});

/* ============================== DESPENSA ============================== */
function formatExpiryText(daysLeft) {
  if (daysLeft < 0) return i18n.t('pantry.expiry.expiredAgo', { days: Math.abs(daysLeft) });
  if (daysLeft === 0) return i18n.t('pantry.expiry.today');
  if (daysLeft === 1) return i18n.t('pantry.expiry.tomorrow');
  return i18n.t('pantry.expiry.daysLeft', { days: daysLeft });
}

function jarTemplate(item) {
  const tone = item.badge.tone;
  const urgencyLabel = i18n.t(`urgency.${tone}`) || item.badge.label;
  const catLabel = i18n.translateCategory(item.category);
  const expiryText = formatExpiryText(item.daysLeft);
  const ingredientName = i18n.translateIngredient(item.name);

  return `
    <article class="jar jar--${tone}" data-id="${item.id}">
      <span class="jar-status" title="${esc(urgencyLabel)}">${item.badge.dot}</span>
      <div>
        <div class="jar-name">${esc(ingredientName)}</div>
        <div class="jar-meta">${fmt(item.quantity)} ${esc(item.unit)} · ${esc(catLabel)}</div>
      </div>
      <span class="jar-expiry">${esc(expiryText)}</span>
      <button class="jar-remove" data-remove="${item.id}" title="${esc(i18n.t('pantry.removeTooltip'))}">✕</button>
    </article>`;
}

function renderShelves(items) {
  const host = $('#shelves');
  if (!items.length) {
    host.innerHTML = `<p class="empty-note">${esc(i18n.t('pantry.emptyNote'))}</p>`;
    return;
  }
  const groups = new Map();
  for (const item of items) {
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  }
  host.innerHTML = [...groups].map(([cat, list]) => `
    <section class="shelf">
      <h3 class="shelf-label">${esc(i18n.translateCategory(cat))}</h3>
      ${list.map(jarTemplate).join('')}
    </section>`).join('');
}

function renderFilters(categories) {
  $('#categoryFilters').innerHTML = categories.map((c) =>
    `<button class="filter${c === state.category ? ' is-active' : ''}" data-category="${esc(c)}">${esc(i18n.translateCategory(c))}</button>`
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
    pantryCache = data.items;
    renderFilters(data.categories);
    renderShelves(data.items);
    renderSummary(data.summary);
    $('#ingredientList').innerHTML =
      [...new Set(data.items.map((i) => i18n.translateIngredient(i.name)))].map((n) => `<option value="${esc(n)}">`).join('');
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

/* --------------------- Validación con Regex de formulario -------------------- */
function setFieldValidation(inputEl, errorEl, result) {
  if (!inputEl || !errorEl) return;
  if (!result.isValid) {
    inputEl.classList.add('is-invalid');
    inputEl.classList.remove('is-valid');
    errorEl.textContent = i18n.t(result.errorKey);
    errorEl.classList.add('is-visible');
  } else {
    inputEl.classList.remove('is-invalid');
    if (inputEl.value && String(inputEl.value).trim().length > 0) {
      inputEl.classList.add('is-valid');
    } else {
      inputEl.classList.remove('is-valid');
    }
    errorEl.textContent = '';
    errorEl.classList.remove('is-visible');
  }
}

function clearFormValidation() {
  ['#inputName', '#inputQuantity', '#inputExpiryDate'].forEach((sel) => {
    const el = $(sel);
    if (el) el.classList.remove('is-invalid', 'is-valid');
  });
  ['#nameError', '#quantityError', '#expiryDateError', '#addError'].forEach((sel) => {
    const el = $(sel);
    if (el) {
      el.textContent = '';
      el.classList.remove('is-visible');
    }
  });
}

function revalidateFormInCurrentLang() {
  const nameEl = $('#inputName');
  const qtyEl = $('#inputQuantity');
  const expEl = $('#inputExpiryDate');

  if (nameEl && nameEl.classList.contains('is-invalid')) {
    setFieldValidation(nameEl, $('#nameError'), validateIngredientName(nameEl.value));
  }
  if (qtyEl && qtyEl.classList.contains('is-invalid')) {
    setFieldValidation(qtyEl, $('#quantityError'), validateQuantity(qtyEl.value));
  }
  if (expEl && expEl.classList.contains('is-invalid')) {
    setFieldValidation(expEl, $('#expiryDateError'), validateExpiryDate(expEl.value));
  }
  const addError = $('#addError');
  if (addError && addError.textContent) {
    addError.textContent = i18n.t('errors.formHasErrors');
  }
}

// Eventos de validación en tiempo real (input y blur)
const inputName = $('#inputName');
if (inputName) {
  inputName.addEventListener('input', () => {
    if (inputName.value.trim().length > 0) {
      setFieldValidation(inputName, $('#nameError'), validateIngredientName(inputName.value));
    } else {
      inputName.classList.remove('is-invalid', 'is-valid');
      $('#nameError').classList.remove('is-visible');
      $('#nameError').textContent = '';
    }
  });
  inputName.addEventListener('blur', () => {
    if (inputName.value.trim().length > 0) {
      setFieldValidation(inputName, $('#nameError'), validateIngredientName(inputName.value));
    }
  });
}

const inputQuantity = $('#inputQuantity');
if (inputQuantity) {
  inputQuantity.addEventListener('input', () => {
    if (inputQuantity.value.trim().length > 0) {
      setFieldValidation(inputQuantity, $('#quantityError'), validateQuantity(inputQuantity.value));
    } else {
      inputQuantity.classList.remove('is-invalid', 'is-valid');
      $('#quantityError').classList.remove('is-visible');
      $('#quantityError').textContent = '';
    }
  });
  inputQuantity.addEventListener('blur', () => {
    if (inputQuantity.value.trim().length > 0) {
      setFieldValidation(inputQuantity, $('#quantityError'), validateQuantity(inputQuantity.value));
    }
  });
}

const inputExpiryDate = $('#inputExpiryDate');
if (inputExpiryDate) {
  const checkExp = () => {
    if (inputExpiryDate.value.trim().length > 0) {
      setFieldValidation(inputExpiryDate, $('#expiryDateError'), validateExpiryDate(inputExpiryDate.value));
    }
  };
  inputExpiryDate.addEventListener('input', checkExp);
  inputExpiryDate.addEventListener('change', checkExp);
  inputExpiryDate.addEventListener('blur', checkExp);
}

function primeDate() {
  const d = new Date();
  d.setDate(d.getDate() + 5);
  const expInput = $('#inputExpiryDate');
  if (expInput) {
    expInput.value = d.toISOString().slice(0, 10);
    expInput.classList.remove('is-invalid');
  }
}

/* --------------------------- Alta de lote ---------------------------- */
$('#addForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.currentTarget;
  const fd = new FormData(form);

  const rawData = {
    name: fd.get('name'),
    category: fd.get('category'),
    quantity: fd.get('quantity'),
    unit: fd.get('unit'),
    expiryDate: fd.get('expiryDate'),
  };

  const nameVal = validateIngredientName(rawData.name);
  setFieldValidation($('#inputName'), $('#nameError'), nameVal);

  const qtyVal = validateQuantity(rawData.quantity);
  setFieldValidation($('#inputQuantity'), $('#quantityError'), qtyVal);

  const expVal = validateExpiryDate(rawData.expiryDate);
  setFieldValidation($('#inputExpiryDate'), $('#expiryDateError'), expVal);

  if (!nameVal.isValid || !qtyVal.isValid || !expVal.isValid) {
    $('#addError').textContent = i18n.t('errors.formHasErrors');
    if (!nameVal.isValid) $('#inputName').focus();
    else if (!qtyVal.isValid) $('#inputQuantity').focus();
    else if (!expVal.isValid) $('#inputExpiryDate').focus();
    return;
  }

  $('#addError').textContent = '';
  try {
    await api.addItem({
      name: String(rawData.name).trim(),
      category: rawData.category,
      quantity: Number(rawData.quantity),
      unit: rawData.unit,
      expiryDate: rawData.expiryDate,
    });
    form.reset();
    clearFormValidation();
    primeDate();
    toast(i18n.t('pantry.savedToast'));
    loadPantry();
  } catch (err) {
    const detail = err.details ? Object.values(err.details).join(' · ') : err.message;
    $('#addError').textContent = detail;
  }
});

primeDate();

/* ============================== RECETAS =============================== */
function chipFor(ing) {
  const ingName = i18n.translateIngredient(ing.name);
  if (!ing.inPantry || !ing.enough) return `<span class="chip chip--missing">${esc(ingName)}</span>`;
  const tone = ing.badge?.tone;
  if (tone === 'urgent' || tone === 'expired') return `<span class="chip chip--urgent">${ing.badge.dot} ${esc(ingName)}</span>`;
  if (tone === 'soon') return `<span class="chip chip--soon">${ing.badge.dot} ${esc(ingName)}</span>`;
  return `<span class="chip">${esc(ingName)}</span>`;
}

function cardTemplate(recipe, maxScore, index) {
  const pct = maxScore > 0 ? Math.round((recipe.score / maxScore) * 100) : 0;
  const tagClass = recipe.atRiskCount > 0 ? 'rescue-tag' : 'rescue-tag rescue-tag--calm';
  const isFav = favoritesTracker.isFavorite(recipe.id);
  // Uso de la función stateless calculateEcoImpact
  const eco = calculateEcoImpact(recipe.ingredients);
  const recipeTitle = i18n.translateRecipeTitle(recipe.title);

  const highlightText = recipe.atRiskCount > 0
    ? i18n.t('recipes.usesRisk', { count: recipe.atRiskCount, plural: recipe.atRiskCount > 1 ? 's' : '' })
    : i18n.t('recipes.noRisk');

  const missingList = recipe.missing.map((m) => i18n.translateIngredient(m.name)).join(', ');
  const coverageText = recipe.cookable
    ? i18n.t('recipes.allAvailable')
    : i18n.t('recipes.missingNote', { count: recipe.missing.length, list: esc(missingList) });

  return `
    <article class="card${index === 0 ? ' is-top' : ''}" data-recipe="${recipe.id}" tabindex="0">
      ${index === 0 ? `<span class="card-rank">${esc(i18n.t('recipes.bestRescue'))}</span>` : ''}
      <div class="card-header-row">
        <h3>${esc(recipeTitle)}</h3>
        <button class="card-fav-btn${isFav ? ' is-favorite' : ''}" data-fav-toggle="${recipe.id}" title="${isFav ? i18n.t('modal.favorite') : i18n.t('modal.markFavorite')}">
          ${isFav ? '⭐' : '☆'}
        </button>
      </div>
      <div class="card-meta">
        <span>⏲️ ${esc(i18n.t('recipes.minutes', { min: recipe.minutes }))}</span>
        <span>👥 ${esc(i18n.t('recipes.servings', { count: recipe.servings }))}</span>
        <span>🧺 ${esc(i18n.t('recipes.inPantryPct', { pct: recipe.coveragePct }))}</span>
      </div>
      <div class="score-strip">
        <span class="score-value">${recipe.score.toFixed(1)}</span>
        <div class="score-bar"><div class="score-fill" style="width:${pct}%"></div></div>
      </div>
      <span class="${tagClass}">🔥 ${esc(highlightText)}</span>
      <span class="eco-badge" title="Impacto ecológico stateless">🌱 ${esc(eco.formatted.co2)}</span>
      <div class="chip-row">${recipe.ingredients.map(chipFor).join('')}</div>
      <p class="coverage-note">${coverageText}</p>
    </article>`;
}

function updateFavControls() {
  const count = favoritesTracker.count();
  const countEl = $('#favCount');
  if (countEl) countEl.textContent = count;
  const btn = $('#favFilterBtn');
  if (btn) {
    btn.textContent = i18n.t('recipes.favoritesBtn', { count });
    btn.classList.toggle('is-active', state.onlyFavorites);
  }
}

async function loadRecipes() {
  try {
    const { recipes } = await api.getRecipes(state.servings);
    updateFavControls();

    let displayList = recipes;
    if (state.onlyFavorites) {
      displayList = recipes.filter((r) => favoritesTracker.isFavorite(r.id));
    }

    const max = Math.max(...displayList.map((r) => r.score), 0);
    $('#recipeCards').innerHTML = displayList.length
      ? displayList.map((r, i) => cardTemplate(r, max, i)).join('')
      : `<p class="empty-note">${esc(state.onlyFavorites ? i18n.t('recipes.emptyFavsNote') : i18n.t('recipes.emptyNote'))}</p>`;
  } catch (err) {
    toast(err.message, 'error');
  }
}

// Filtro de recetas favoritas (gestor stateful)
$('#favFilterBtn').addEventListener('click', () => {
  state.onlyFavorites = !state.onlyFavorites;
  loadRecipes();
});

// Selector de porciones
$$('.serv').forEach((btn) => {
  btn.addEventListener('click', () => {
    state.servings = Number(btn.dataset.servings);
    $$('.serv').forEach((b) => b.classList.toggle('is-active', b === btn));
    loadRecipes();
    if (state.openRecipeId) openRecipe(state.openRecipeId);
  });
});

$('#recipeCards').addEventListener('click', (e) => {
  const favBtn = e.target.closest('[data-fav-toggle]');
  if (favBtn) {
    e.stopPropagation();
    const id = Number(favBtn.dataset.favToggle);
    favoritesTracker.toggle(id);
    loadRecipes();
    return;
  }
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
  const isFav = favoritesTracker.isFavorite(r.id);
  // 1) Uso de calculateEcoImpact (stateless)
  const eco = calculateEcoImpact(r.ingredients);

  // 2) Uso de calculateShoppingListDiff (stateless)
  const diff = calculateShoppingListDiff(r.ingredients, pantryCache);

  const recipeTitle = i18n.translateRecipeTitle(r.title);
  const recipeDesc = i18n.translateRecipeDescription(r.title, r.description);
  const recipeSteps = i18n.translateRecipeSteps(r.title, r.steps);

  return `
    <div class="card-header-row">
      <h2 class="sheet-title" id="sheetTitle">${esc(recipeTitle)}</h2>
      <button class="card-fav-btn${isFav ? ' is-favorite' : ''}" data-sheet-fav="${r.id}">
        ${isFav ? esc(i18n.t('modal.favorite')) : esc(i18n.t('modal.markFavorite'))}
      </button>
    </div>
    <p class="sheet-desc">${esc(recipeDesc)}</p>
    <div class="card-meta" style="padding-left:0">
      <span>⏲️ ${esc(i18n.t('recipes.minutes', { min: r.minutes }))}</span>
      <span>📈 Score ${r.score.toFixed(1)}</span>
      <span>🧺 ${r.coveragePct}% ${esc(i18n.getLang() === 'en' ? 'available' : 'disponible')}</span>
      <span class="eco-badge">${esc(i18n.t('modal.impactBadge', { co2: eco.formatted.co2, water: eco.formatted.water }))}</span>
    </div>

    <h3 class="sheet-section-title">${esc(i18n.t('modal.ingredientsTitle', { count: r.servings }))}</h3>
    <div class="ing-table">
      ${r.ingredients.map((i) => {
        const ingName = i18n.translateIngredient(i.name);
        const flag = i.enough
          ? `${i.badge.dot} ${esc(i18n.t(`urgency.${i.badge.tone}`) || i.badge.label)}`
          : i.inPantry ? esc(i18n.t('modal.onlyAvailable', { qty: fmt(i.available), unit: i.unit })) : esc(i18n.t('modal.notInPantry'));
        return `
        <div class="ing-row${i.enough ? '' : ' is-missing'}">
          <span>${esc(ingName)}</span>
          <span class="ing-qty">${fmt(i.quantity)} ${esc(i.unit)}</span>
          <span class="ing-flag">${flag}</span>
        </div>`;
      }).join('')}
    </div>

    <h3 class="sheet-section-title">${esc(i18n.t('modal.instructionsTitle'))}</h3>
    <ol class="sheet-steps">${recipeSteps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>

    ${diff.canCook ? '' : `<p class="missing-note">${esc(i18n.t('modal.shoppingListDiff', {
      list: diff.missing.map((m) => `${i18n.translateIngredient(m.name)} (${i18n.t('modal.missingShort', { qty: fmt(m.shortBy), unit: m.unit })})`).join(' · ')
    }))}</p>`}

    <div class="sheet-footer">
      <div class="sheet-servings">
        ${[1, 2, 4, 6].map((s) => `
          <button class="serv${s === r.servings ? ' is-active' : ''}" data-sheet-servings="${s}">${s}</button>
        `).join('')}
      </div>
      <button class="btn btn--cook" id="cookBtn" data-recipe="${r.id}" data-title="${esc(r.title)}" ${r.cookable ? '' : 'disabled'}>
        ${esc(i18n.t(r.cookable ? 'modal.cookBtn' : 'modal.missingBtn'))}
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

$('#sheetBody').addEventListener('click', async (e) => {
  const sheetFav = e.target.closest('[data-sheet-fav]');
  if (sheetFav) {
    const id = Number(sheetFav.dataset.sheetFav);
    favoritesTracker.toggle(id);
    openRecipe(id);
    loadRecipes();
    return;
  }

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

  cookBtn.classList.add('is-cooking');
  cookBtn.disabled = true;
  try {
    const result = await api.cook(Number(cookBtn.dataset.recipe), state.servings);
    closeSheet();

    const savedCount = result.log.savedItems || 0;
    const msg = savedCount > 0
      ? i18n.t('feedback.cookedSuccessWithRescue', { count: savedCount, plural: savedCount > 1 ? 's' : '' })
      : i18n.t('feedback.cookedSuccess');
    toast(msg);

    // Registro en el acumulador stateful (createWasteSavingsTracker)
    const consumed = result.log.consumed || [];
    const ecoSavings = calculateEcoImpact(consumed);

    wasteSavingsTracker.recordCook({
      recipeTitle: cookBtn.dataset.title || 'Receta',
      servings: state.servings,
      savedItems: savedCount,
      co2AvoidedKg: ecoSavings.co2AvoidedKg,
      waterSavedLiters: ecoSavings.waterSavedLiters,
      moneySavedEur: ecoSavings.moneySavedEur,
    });

    updateSessionMeters();
    await Promise.all([loadPantry(), loadRecipes()]);
  } catch (err) {
    const missing = err.details?.missing
      ?.map((m) => `${i18n.translateIngredient(m.name)} (${i18n.t('modal.missingShort', { qty: fmt(m.shortBy ?? m.needed), unit: m.unit })})`).join(' · ');
    toast(missing ? `${err.message}: ${missing}` : err.message, 'error');
  } finally {
    cookBtn.classList.remove('is-cooking');
    cookBtn.disabled = false;
  }
});

function updateSessionMeters() {
  const summary = wasteSavingsTracker.getSummary();
  const co2El = $('#sessionCo2');
  if (co2El) co2El.textContent = `${summary.totalCo2AvoidedKg.toFixed(2)} kg`;

  if ($('#histTotalCooked')) $('#histTotalCooked').textContent = summary.totalCooked;
  if ($('#histTotalSaved')) $('#histTotalSaved').textContent = summary.totalSavedItems;
  if ($('#histTotalCo2')) $('#histTotalCo2').textContent = `${summary.totalCo2AvoidedKg.toFixed(2)} kg`;
  if ($('#histTotalWater')) $('#histTotalWater').textContent = `${summary.totalWaterSavedLiters} L`;
  if ($('#histStreak')) $('#histStreak').textContent = `${summary.streak} 🔥`;
}

/* ============================== HISTORIAL ============================= */
async function loadHistory() {
  try {
    const { logs } = await api.history();
    updateSessionMeters();

    $('#historyList').innerHTML = logs.length ? logs.map((l) => {
      // Uso de la función pura calculateEcoImpact
      const eco = calculateEcoImpact(l.consumed);
      const recipeTitle = i18n.translateRecipeTitle(l.recipeTitle);
      const consumedList = l.consumed.map((c) => `${i18n.translateIngredient(c.ingredientName)} ${fmt(c.quantity)} ${c.unit}`).join(', ');
      return `
        <article class="log">
          <h3>${esc(recipeTitle)}</h3>
          <p class="log-meta">${new Date(l.cookedAt.replace(' ', 'T') + 'Z').toLocaleString(i18n.getLang())} · ${esc(i18n.t('recipes.servings', { count: l.servings }))}</p>
          <p class="log-consumed">${esc(i18n.t('history.deducted', { list: consumedList }))}</p>
          ${l.savedItems > 0 ? `<span class="log-saved">${esc(i18n.t('history.rescuedTag', { count: l.savedItems }))}</span>` : ''}
          <span class="log-eco">${esc(i18n.t('history.ecoTag', { co2: eco.formatted.co2, water: eco.formatted.water }))}</span>
        </article>`;
    }).join('')
      : `<p class="empty-note">${esc(i18n.t('history.emptyNote'))}</p>`;
  } catch (err) {
    toast(err.message, 'error');
  }
}

/* ==================== SERVICIOS EXTERNOS (FRONT-END) ==================== */
let externalRecipesCache = [];
let extAbortController = null;

const INGREDIENT_EN_MAP = {
  'Espinaca': 'spinach',
  'Tomate': 'tomato',
  'Cebolla': 'onion',
  'Ajo': 'garlic',
  'Calabacin': 'zucchini',
  'Champinones': 'mushrooms',
  'Zanahoria': 'carrots',
  'Papa': 'potatoes',
  'Leche': 'milk',
  'Queso crema': 'cream_cheese',
  'Queso parmesano': 'parmesan',
  'Yogur natural': 'yogurt',
  'Huevo': 'eggs',
  'Mantequilla': 'butter',
  'Pechuga de pollo': 'chicken_breast',
  'Carne molida': 'minced_beef',
  'Arroz': 'rice',
  'Pasta': 'pasta',
  'Lentejas': 'lentils',
  'Aceite de oliva': 'olive_oil',
  'Caldo de verduras': 'vegetable_stock',
  'Pan': 'bread',
};

function renderQuickPantryChips() {
  const container = $('#quickPantryChips');
  if (!container) return;

  const uniqueIngs = [...new Set(pantryCache.map((i) => i.name))];
  if (!uniqueIngs.length) {
    container.innerHTML = `<span class="muted">${esc(i18n.t('pantry.emptyNote'))}</span>`;
    return;
  }

  container.innerHTML = uniqueIngs.map((name) => {
    const enTerm = INGREDIENT_EN_MAP[name] || name.toLowerCase();
    const displayName = i18n.translateIngredient(name);
    return `<button class="quick-chip" data-ext-ing="${esc(enTerm)}" data-display="${esc(displayName)}">🥘 ${esc(displayName)}</button>`;
  }).join('');
}

function setExternalStatus(msg, type = 'normal') {
  const el = $('#externalStatus');
  if (!el) return;
  if (!msg) {
    el.hidden = true;
    el.textContent = '';
    el.className = 'external-status';
  } else {
    el.hidden = false;
    el.textContent = msg;
    el.className = `external-status${type === 'loading' ? ' is-loading' : type === 'error' ? ' is-error' : ''}`;
  }
}

function renderExternalCards(recipes) {
  const host = $('#externalRecipeCards');
  if (!host) return;

  if (!recipes || !recipes.length) {
    host.innerHTML = '';
    return;
  }

  host.innerHTML = recipes.map((r) => `
    <article class="ext-card">
      <img class="ext-thumb" src="${esc(r.thumbnail || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500')}" alt="${esc(r.title)}" loading="lazy" />
      <div class="ext-body">
        <h3 class="ext-title">${esc(r.title)}</h3>
        <div class="ext-meta-tags">
          <span class="ext-tag">${esc(i18n.t('external.originBadge', { area: r.area || 'Global' }))}</span>
          <span class="ext-tag">${esc(i18n.t('external.categoryBadge', { category: r.category || 'Inspiración' }))}</span>
        </div>
        <button class="btn btn--ext-view" data-ext-recipe="${r.id}">
          ${esc(i18n.t('external.viewRecipe'))} ➔
        </button>
      </div>
    </article>
  `).join('');
}

async function searchExternal(query) {
  if (extAbortController) extAbortController.abort();
  extAbortController = new AbortController();

  setExternalStatus(i18n.t('external.loading'), 'loading');
  try {
    const recipes = await externalService.searchRecipes(query, extAbortController.signal);
    externalRecipesCache = recipes;
    if (recipes.length) {
      setExternalStatus('');
      renderExternalCards(recipes);
    } else {
      setExternalStatus(i18n.t('external.noResults'));
      renderExternalCards([]);
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    setExternalStatus(i18n.t('external.error'), 'error');
    renderExternalCards([]);
  }
}

async function filterExternalByIngredient(ingTerm, displayName) {
  if (extAbortController) extAbortController.abort();
  extAbortController = new AbortController();

  setExternalStatus(i18n.t('external.loading'), 'loading');
  try {
    const recipes = await externalService.getRecipesByIngredient(ingTerm, extAbortController.signal);
    externalRecipesCache = recipes;
    if (recipes.length) {
      setExternalStatus('');
      renderExternalCards(recipes);
    } else {
      await searchExternal(ingTerm);
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    setExternalStatus(i18n.t('external.error'), 'error');
    renderExternalCards([]);
  }
}

function loadExternalView() {
  renderQuickPantryChips();
  if (!externalRecipesCache.length) {
    const firstIng = pantryCache[0]?.name;
    const initialQuery = (firstIng && INGREDIENT_EN_MAP[firstIng]) || 'chicken';
    searchExternal(initialQuery);
  }
}

// Eventos de la vista externa
const extSearchForm = $('#externalSearchForm');
if (extSearchForm) {
  extSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = $('#externalSearchInput')?.value;
    if (query && query.trim()) {
      searchExternal(query.trim());
    }
  });
}

const quickChipsContainer = $('#quickPantryChips');
if (quickChipsContainer) {
  quickChipsContainer.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-ext-ing]');
    if (!chip) return;
    const ingTerm = chip.dataset.extIng;
    const displayName = chip.dataset.display;
    if ($('#externalSearchInput')) $('#externalSearchInput').value = displayName;
    filterExternalByIngredient(ingTerm, displayName);
  });
}

// Modal de detalle de receta externa
const extCardsGrid = $('#externalRecipeCards');
if (extCardsGrid) {
  extCardsGrid.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-ext-recipe]');
    if (!btn) return;
    const id = btn.dataset.extRecipe;
    try {
      toast(i18n.t('external.loading'));
      const details = await externalService.getRecipeDetails(id);
      openExternalRecipeModal(details);
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

function openExternalRecipeModal(meal) {
  const modal = $('#externalModal');
  const body = $('#extSheetBody');
  if (!modal || !body) return;

  const ingredientsList = meal.ingredients && meal.ingredients.length
    ? `<div class="ing-table">
        ${meal.ingredients.map((ing) => `
          <div class="ing-row">
            <span>${esc(ing.name)}</span>
            <span class="ing-qty">${esc(ing.measure)}</span>
            <span class="ing-flag">🌐 External API</span>
          </div>
        `).join('')}
       </div>`
    : '';

  body.innerHTML = `
    <div class="ext-detail-header">
      <img class="ext-detail-thumb" src="${esc(meal.thumbnail)}" alt="${esc(meal.title)}" />
      <div>
        <h2 class="sheet-title" id="extSheetTitle">${esc(meal.title)}</h2>
        <div class="ext-meta-tags" style="margin-top:.4rem">
          <span class="ext-tag">${esc(i18n.t('external.originBadge', { area: meal.area }))}</span>
          <span class="ext-tag">${esc(i18n.t('external.categoryBadge', { category: meal.category }))}</span>
        </div>
      </div>
    </div>

    <h3 class="sheet-section-title">${esc(i18n.t('external.modalIngredients'))}</h3>
    ${ingredientsList}

    <h3 class="sheet-section-title">${esc(i18n.t('external.modalInstructions'))}</h3>
    <p class="sheet-desc" style="white-space:pre-line; line-height:1.7; font-size:.9rem">${esc(meal.instructions)}</p>

    <div class="ext-links-row">
      ${meal.youtubeUrl ? `<a class="btn--youtube" href="${esc(meal.youtubeUrl)}" target="_blank" rel="noopener noreferrer">${esc(i18n.t('external.youtubeBtn'))}</a>` : ''}
      ${meal.sourceUrl ? `<a class="btn--source" href="${esc(meal.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(i18n.t('external.sourceBtn'))}</a>` : ''}
    </div>
  `;

  modal.hidden = false;
}

function closeExternalModal() {
  const modal = $('#externalModal');
  if (modal) modal.hidden = true;
}

$('#extSheetClose')?.addEventListener('click', closeExternalModal);
$('#externalModal')?.addEventListener('click', (e) => {
  if (e.target.id === 'externalModal') closeExternalModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('#externalModal')?.hidden) closeExternalModal();
});

// Consumo de Open Food Facts en el formulario de despensa
const offBtn = $('#openFoodFactsBtn');
if (offBtn) {
  offBtn.addEventListener('click', async () => {
    const inputName = $('#inputName');
    const preview = $('#offPreview');
    if (!inputName || !preview) return;

    const term = inputName.value.trim();
    if (!term) {
      preview.hidden = false;
      preview.innerHTML = `<span class="muted">${esc(i18n.t('errors.nameRequired'))}</span>`;
      return;
    }

    preview.hidden = false;
    preview.innerHTML = `<em>${esc(i18n.t('external.loading'))}</em>`;

    try {
      const products = await externalService.searchFoodFacts(term);
      if (!products.length) {
        preview.innerHTML = `<span>${esc(i18n.t('external.noResults'))}</span>`;
        return;
      }

      preview.innerHTML = `
        <strong style="color:var(--sand)">${esc(i18n.t('external.openFoodFactsTitle'))}</strong>
        ${products.map((p) => `
          <div class="off-preview-item" style="margin-top:.4rem">
            ${p.image ? `<img src="${esc(p.image)}" alt="${esc(p.name)}" class="off-thumb" />` : ''}
            <div>
              <div><strong>${esc(p.name)}</strong> · <span class="muted">${esc(p.brand)}</span></div>
              <div class="off-badges">
                <span class="badge-nutri">${esc(i18n.t('external.nutriScoreLabel'))} ${esc(p.nutriscore)}</span>
                <span class="badge-eco">${esc(i18n.t('external.ecoScoreLabel'))} ${esc(p.ecoscore)}</span>
                ${p.co2Kg ? `<span>🌱 ${esc(p.co2Kg)} kg CO₂/kg</span>` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      `;
    } catch (err) {
      preview.innerHTML = `<span style="color:#F87171">${esc(i18n.t('external.error'))}</span>`;
    }
  });
}

/* ======================== WEBSOCKETS EN TIEMPO REAL ======================= */
let liveAlertTimer = null;
function showLiveBanner(text) {
  const alertEl = $('#wsLiveAlert');
  if (!alertEl) return;
  alertEl.textContent = text;
  alertEl.hidden = false;
  clearTimeout(liveAlertTimer);
  liveAlertTimer = setTimeout(() => {
    alertEl.hidden = true;
  }, 6500);
}

function updateWsBadge(status) {
  const badge = $('#wsBadge');
  const textEl = $('#wsStatusText');
  if (!badge || !textEl) return;

  badge.classList.remove('is-connected', 'is-disconnected');

  if (status === 'connected') {
    badge.classList.add('is-connected');
    textEl.textContent = i18n.t('websocket.connected', { count: currentWsClientsCount });
  } else if (status === 'connecting') {
    textEl.textContent = i18n.t('websocket.connecting');
  } else {
    badge.classList.add('is-disconnected');
    textEl.textContent = i18n.t('websocket.disconnected');
  }
}

wsClient.onStatusChange((status) => {
  updateWsBadge(status);
});

wsClient.on('CLIENTS_COUNT', (data) => {
  currentWsClientsCount = data.count || 1;
  updateWsBadge('connected');
});

wsClient.on('PANTRY_UPDATED', (data) => {
  // Sincronizar despensa y recetas automáticamente al recibir cambio remoto
  loadPantry();
  loadRecipes();
  const alertText = i18n.t('websocket.pantryUpdated');
  toast(alertText);
  showLiveBanner(`📡 ${alertText}`);
});

wsClient.on('COOKED_RECIPE', (data) => {
  // Actualizar despensa, recetas e historial en tiempo real
  loadPantry();
  loadRecipes();
  if (state.view === 'history') loadHistory();
  const msg = i18n.t('websocket.cookedRecipe', {
    title: data.recipeTitle || 'Receta',
    saved: data.savedItems || 0,
  });
  toast(msg);
  showLiveBanner(`🍲 ${msg}`);
});

wsClient.on('WASTE_ALERT', (data) => {
  const msg = i18n.t('websocket.wasteAlert', {
    user: data.user || 'Cocina',
    message: data.message || 'Alerta de alimentos',
  });
  toast(msg, 'error');
  showLiveBanner(`⚠️ ${msg}`);
});

// Botón para transmitir alerta en tiempo real a otros cocineros
const broadcastBtn = $('#wsBroadcastBtn');
if (broadcastBtn) {
  broadcastBtn.addEventListener('click', () => {
    const defaultMsg = i18n.getLang() === 'en'
      ? 'Pantry reminder: Let\'s cook the ripe tomatoes today!'
      : '¡Aviso de despensa: Hay tomates que caducan pronto, preparémoslos hoy!';
    const userMsg = prompt(i18n.t('websocket.broadcastPrompt'), defaultMsg);
    if (userMsg && userMsg.trim()) {
      wsClient.broadcastAlert('ZeroWaste Alert', userMsg.trim());
      toast(i18n.t('websocket.alertBroadcasted'));
    }
  });
}

/* ------------------------------ Arranque ----------------------------- */
applyStaticTranslations();
loadPantry();
wsClient.connect();

