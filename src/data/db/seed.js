/**
 * CAPA DE PERSISTENCIA - Datos semilla.
 * Uso:  node src/data/db/seed.js --reset
 * Las caducidades se generan RELATIVAS a hoy para que el semaforo
 * (verde / amarillo / rojo) se vea siempre poblado.
 */
import { createConnection } from './connection.js';

const db = createConnection();
const reset = process.argv.includes('--reset');

if (reset) {
  db.exec(`DELETE FROM cooking_logs;
           DELETE FROM recipe_ingredients;
           DELETE FROM recipes;
           DELETE FROM pantry_items;
           DELETE FROM ingredients;
           DELETE FROM sqlite_sequence;`);
}

const inDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

// --- Catalogo de ingredientes -------------------------------------------------
const INGREDIENTS = [
  ['Espinaca', 'Verduras', 'g'],       ['Tomate', 'Verduras', 'g'],
  ['Cebolla', 'Verduras', 'g'],        ['Ajo', 'Verduras', 'pza'],
  ['Calabacin', 'Verduras', 'g'],      ['Champinones', 'Verduras', 'g'],
  ['Zanahoria', 'Verduras', 'g'],      ['Papa', 'Verduras', 'g'],
  ['Leche', 'Lacteos', 'ml'],          ['Queso crema', 'Lacteos', 'g'],
  ['Queso parmesano', 'Lacteos', 'g'], ['Yogur natural', 'Lacteos', 'g'],
  ['Huevo', 'Lacteos', 'pza'],         ['Mantequilla', 'Lacteos', 'g'],
  ['Pechuga de pollo', 'Carnes', 'g'], ['Carne molida', 'Carnes', 'g'],
  ['Arroz', 'Despensa seca', 'g'],     ['Pasta', 'Despensa seca', 'g'],
  ['Lentejas', 'Despensa seca', 'g'],  ['Aceite de oliva', 'Despensa seca', 'ml'],
  ['Caldo de verduras', 'Despensa seca', 'ml'], ['Pan', 'Despensa seca', 'g'],
];

const insIng = db.prepare('INSERT INTO ingredients (name, category, default_unit) VALUES (?, ?, ?)');
const ids = {};
for (const [name, cat, unit] of INGREDIENTS) {
  insIng.run(name, cat, unit);
  ids[name] = Number(db.prepare('SELECT id FROM ingredients WHERE name = ?').get(name).id);
}

// --- Despensa: mezcla deliberada de urgencias ---------------------------------
const PANTRY = [
  ['Espinaca', 250, 'g', 1],           // ROJO
  ['Champinones', 300, 'g', 0],        // ROJO (vence hoy)
  ['Leche', 900, 'ml', 1],             // ROJO
  ['Pechuga de pollo', 600, 'g', -1],  // ROJO (vencido)
  ['Yogur natural', 400, 'g', 3],      // AMARILLO
  ['Tomate', 500, 'g', 3],             // AMARILLO
  ['Calabacin', 350, 'g', 4],          // AMARILLO
  ['Huevo', 10, 'pza', 4],             // AMARILLO
  ['Carne molida', 400, 'g', 2],       // AMARILLO
  ['Pan', 300, 'g', 2],                // AMARILLO
  ['Queso crema', 200, 'g', 6],        // VERDE
  ['Queso parmesano', 150, 'g', 20],
  ['Cebolla', 600, 'g', 15],
  ['Ajo', 8, 'pza', 30],
  ['Zanahoria', 400, 'g', 12],
  ['Papa', 900, 'g', 18],
  ['Mantequilla', 200, 'g', 25],
  ['Arroz', 1000, 'g', 300],
  ['Pasta', 800, 'g', 400],
  ['Lentejas', 500, 'g', 365],
  ['Aceite de oliva', 750, 'ml', 200],
  ['Caldo de verduras', 1000, 'ml', 90],
];

const insPantry = db.prepare(
  'INSERT INTO pantry_items (ingredient_id, quantity, unit, expiry_date) VALUES (?, ?, ?, ?)');
for (const [name, qty, unit, days] of PANTRY) insPantry.run(ids[name], qty, unit, inDays(days));

// --- Recetario ---------------------------------------------------------------
// weight = protagonismo del ingrediente dentro de la receta (factor del Score).
const RECIPES = [
  {
    title: 'Crema de espinaca y champinones',
    description: 'Cremosa, lista en media hora y el mejor destino para verduras de hoja al limite.',
    minutes: 25, baseServings: 2,
    steps: ['Saltea cebolla y ajo en mantequilla.', 'Agrega champinones y espinaca.',
            'Vierte leche y caldo, cocina 10 min.', 'Licua, sazona y sirve caliente.'],
    ingredients: [
      ['Espinaca', 200, 'g', 1.0], ['Champinones', 150, 'g', 0.9],
      ['Leche', 300, 'ml', 0.8],   ['Cebolla', 80, 'g', 0.4],
      ['Ajo', 1, 'pza', 0.2],      ['Mantequilla', 20, 'g', 0.3],
      ['Caldo de verduras', 200, 'ml', 0.3],
    ],
  },
  {
    title: 'Pollo al horno con verduras de la semana',
    description: 'Bandeja unica: rescata el pollo y cualquier verdura que ya pida turno.',
    minutes: 45, baseServings: 2,
    steps: ['Precalienta el horno a 200 grados.', 'Trocea papa, zanahoria y calabacin.',
            'Coloca el pollo sobre las verduras con aceite y ajo.', 'Hornea 35-40 min.'],
    ingredients: [
      ['Pechuga de pollo', 300, 'g', 1.0], ['Papa', 300, 'g', 0.6],
      ['Zanahoria', 150, 'g', 0.5],        ['Calabacin', 150, 'g', 0.6],
      ['Aceite de oliva', 30, 'ml', 0.2],  ['Ajo', 2, 'pza', 0.2],
    ],
  },
  {
    title: 'Pasta al pomodoro con parmesano',
    description: 'Clasico de despensa: tomates maduros, pasta seca y mucho queso.',
    minutes: 20, baseServings: 2,
    steps: ['Hierve la pasta al dente.', 'Sofrie ajo y tomate en aceite 10 min.',
            'Mezcla, ajusta sal y corona con parmesano.'],
    ingredients: [
      ['Tomate', 350, 'g', 1.0],  ['Pasta', 200, 'g', 0.7],
      ['Ajo', 2, 'pza', 0.3],     ['Aceite de oliva', 20, 'ml', 0.2],
      ['Queso parmesano', 40, 'g', 0.4],
    ],
  },
  {
    title: 'Tortilla de calabacin y cebolla',
    description: 'Huevos y verdura sobrante: cena de rescate en 20 minutos.',
    minutes: 20, baseServings: 2,
    steps: ['Pocha la cebolla y el calabacin.', 'Bate los huevos y mezcla.',
            'Cuaja a fuego bajo por ambos lados.'],
    ingredients: [
      ['Huevo', 4, 'pza', 1.0],   ['Calabacin', 200, 'g', 0.8],
      ['Cebolla', 100, 'g', 0.5], ['Aceite de oliva', 15, 'ml', 0.2],
    ],
  },
  {
    title: 'Lentejas guisadas con verduras',
    description: 'Guiso de fondo de alacena, ideal cuando sobran raices y caldo.',
    minutes: 50, baseServings: 4,
    steps: ['Sofrie cebolla, ajo y zanahoria.', 'Agrega lentejas y caldo.',
            'Cocina 40 min a fuego lento.', 'Rectifica la sal antes de servir.'],
    ingredients: [
      ['Lentejas', 350, 'g', 1.0],  ['Zanahoria', 200, 'g', 0.5],
      ['Cebolla', 150, 'g', 0.4],   ['Ajo', 2, 'pza', 0.2],
      ['Caldo de verduras', 800, 'ml', 0.5], ['Papa', 200, 'g', 0.4],
    ],
  },
  {
    title: 'Bolonesa expres con carne molida',
    description: 'Salsa espesa para vaciar carne y tomate antes de que caduquen.',
    minutes: 35, baseServings: 4,
    steps: ['Dora la carne con cebolla y ajo.', 'Suma el tomate y cocina 20 min.',
            'Sirve sobre pasta con parmesano.'],
    ingredients: [
      ['Carne molida', 400, 'g', 1.0], ['Tomate', 400, 'g', 0.8],
      ['Cebolla', 120, 'g', 0.4],      ['Ajo', 2, 'pza', 0.2],
      ['Pasta', 320, 'g', 0.6],        ['Queso parmesano', 50, 'g', 0.3],
    ],
  },
  {
    title: 'Arroz cremoso con champinones',
    description: 'Risotto de casa: champinones al limite y caldo de despensa.',
    minutes: 40, baseServings: 2,
    steps: ['Sofrie cebolla y champinones.', 'Nacara el arroz.',
            'Anade caldo poco a poco durante 20 min.', 'Termina con mantequilla y parmesano.'],
    ingredients: [
      ['Champinones', 200, 'g', 1.0], ['Arroz', 200, 'g', 0.7],
      ['Caldo de verduras', 600, 'ml', 0.5], ['Cebolla', 80, 'g', 0.3],
      ['Mantequilla', 25, 'g', 0.3],  ['Queso parmesano', 40, 'g', 0.3],
    ],
  },
  {
    title: 'Pan tostado con yogur y tomate',
    description: 'Desayuno de rescate para pan y lacteos que no aguantan otro dia.',
    minutes: 10, baseServings: 2,
    steps: ['Tuesta el pan.', 'Mezcla el yogur con ajo y sal.',
            'Extiende y corona con tomate en rodajas.'],
    ingredients: [
      ['Pan', 150, 'g', 0.9],    ['Yogur natural', 200, 'g', 1.0],
      ['Tomate', 150, 'g', 0.6], ['Aceite de oliva', 10, 'ml', 0.2],
      ['Ajo', 1, 'pza', 0.1],
    ],
  },
];

const insRecipe = db.prepare(
  'INSERT INTO recipes (title, description, minutes, base_servings, steps) VALUES (?, ?, ?, ?, ?)');
const insLine = db.prepare(`INSERT INTO recipe_ingredients
  (recipe_id, ingredient_id, quantity, unit, weight, optional) VALUES (?, ?, ?, ?, ?, 0)`);

for (const r of RECIPES) {
  const info = insRecipe.run(r.title, r.description, r.minutes, r.baseServings, JSON.stringify(r.steps));
  const rid = Number(info.lastInsertRowid);
  for (const [name, qty, unit, weight] of r.ingredients) insLine.run(rid, ids[name], qty, unit, weight);
}

console.log(`Semilla cargada: ${INGREDIENTS.length} ingredientes, ${PANTRY.length} lotes, ${RECIPES.length} recetas.`);
db.close();
