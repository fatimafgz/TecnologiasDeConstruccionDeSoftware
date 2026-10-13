/**
 * Módulo de Internacionalización (i18n) para ZeroWaste Pantry.
 * Soporta Español (es) e Inglés (en) con interpolación de variables
 * y traducción completa de catálogo (ingredientes, recetas, pasos y descripciones).
 */

export const translations = {
  es: {
    app: {
      title: 'ZeroWaste Pantry',
      tagline: 'Cocina primero lo que está por vencer',
      atRiskToday: 'en riesgo hoy',
      co2SavedSession: 'CO₂ evitado en sesión',
      selectLang: 'Idioma',
    },
    websocket: {
      connecting: 'Conectando...',
      connected: 'En vivo ({count})',
      disconnected: 'Sin conexión en vivo',
      broadcastBtn: '📡 Avisar cocina',
      broadcastPrompt: 'Escribe un aviso para los demás cocineros de la casa:',
      alertBroadcasted: 'Aviso enviado a toda la cocina 📡',
      pantryUpdated: '📡 [En vivo] La despensa ha sido actualizada.',
      cookedRecipe: '📡 [En vivo] ¡Se ha cocinado "{title}"! ({saved} ingredientes rescatados)',
      wasteAlert: '⚠️ [Alerta en Vivo] {user}: {message}',
    },
    errors: {
      nameRequired: 'El nombre del ingrediente es obligatorio',
      nameInvalid: 'El nombre debe contener solo letras y espacios (2 a 50 caracteres)',
      quantityRequired: 'La cantidad es obligatoria',
      quantityInvalid: 'La cantidad debe ser un número positivo (ej. 250 o 1.5)',
      expiryRequired: 'La fecha de caducidad es obligatoria',
      expiryInvalid: 'Fecha inválida (formato requerido: AAAA-MM-DD)',
      unitInvalid: 'Unidad no válida',
      categoryInvalid: 'Categoría no válida',
      formHasErrors: 'Por favor, corrige los campos marcados antes de guardar.',
    },
    tabs: {
      pantry: '🧺 Mi despensa',
      recipes: '📇 Recetas sugeridas',
      history: '🍲 Cocinadas',
      external: '🌐 Recetas del mundo (API Externa)',
    },
    pantry: {
      addTitle: 'Añadir a la despensa',
      ingredient: 'Ingrediente',
      ingredientPlaceholder: 'Espinaca, leche, pollo…',
      category: 'Categoría',
      quantity: 'Cantidad',
      unit: 'Unidad',
      expiresOn: 'Caduca el',
      saveBtn: 'Guardar en la alacena',
      trafficLight: 'Semáforo',
      freshLegend: 'Fresco · más de 5 días',
      soonLegend: 'Consumir pronto · 2 a 4 días',
      urgentLegend: 'Urgente · 24-48 h o vencido',
      cupboardTitle: 'La alacena',
      emptyNote: 'La alacena está vacía. Añade algo en la pizarra de la izquierda.',
      removeTooltip: 'Quitar de la despensa',
      savedToast: 'Guardado en la alacena 🧺',
      expiry: {
        expiredAgo: 'Vencido hace {days} d',
        today: 'Vence hoy',
        tomorrow: 'Vence mañana',
        daysLeft: '{days} días',
      },
    },
    categories: {
      'Todas': 'Todas',
      'Verduras': 'Verduras',
      'Lacteos': 'Lácteos',
      'Carnes': 'Carnes',
      'Despensa seca': 'Despensa seca',
      'Otros': 'Otros',
    },
    urgency: {
      fresh: 'Fresco',
      soon: 'Consumir pronto',
      urgent: '¡Urgente!',
      expired: 'Vencido',
    },
    ingredients: {
      'Espinaca': 'Espinaca',
      'Tomate': 'Tomate',
      'Cebolla': 'Cebolla',
      'Ajo': 'Ajo',
      'Calabacin': 'Calabacín',
      'Champinones': 'Champiñones',
      'Zanahoria': 'Zanahoria',
      'Papa': 'Papa',
      'Leche': 'Leche',
      'Queso crema': 'Queso crema',
      'Queso parmesano': 'Queso parmesano',
      'Yogur natural': 'Yogur natural',
      'Huevo': 'Huevo',
      'Mantequilla': 'Mantequilla',
      'Pechuga de pollo': 'Pechuga de pollo',
      'Carne molida': 'Carne molida',
      'Arroz': 'Arroz',
      'Pasta': 'Pasta',
      'Lentejas': 'Lentejas',
      'Aceite de oliva': 'Aceite de oliva',
      'Caldo de verduras': 'Caldo de verduras',
      'Pan': 'Pan',
    },
    recipes: {
      title: 'Recetario ordenado por {scoreEmphasis}',
      scoreName: 'Score de Aprovechamiento',
      subtitle: 'Primero las recetas que rescatan más ingredientes al límite.',
      favoritesBtn: '⭐ Favoritas ({count})',
      servingsLabel: 'Comensales',
      bestRescue: 'Mejor rescate',
      minutes: '{min} min',
      servings: '{count} comensales',
      inPantryPct: '{pct}% en despensa',
      usesRisk: 'Usa {count} ingrediente{plural} a punto de vencer',
      noRisk: 'Sin ingredientes en riesgo',
      ecoBadge: '🌱 {co2}',
      allAvailable: '✅ Tienes todo lo necesario',
      missingNote: '⚠️ Faltan {count}: {list}',
      emptyNote: 'Aún no hay recetas cargadas.',
      emptyFavsNote: 'No tienes recetas marcadas como favoritas aún.',
    },
    recipesCatalog: {
      'Crema de espinaca y champinones': {
        title: 'Crema de espinaca y champiñones',
        description: 'Cremosa, lista en media hora y el mejor destino para verduras de hoja al límite.',
        steps: [
          'Saltea cebolla y ajo en mantequilla.',
          'Agrega champiñones y espinaca.',
          'Vierte leche y caldo, cocina 10 min.',
          'Licúa, sazona y sirve caliente.',
        ],
      },
      'Pollo al horno con verduras de la semana': {
        title: 'Pollo al horno con verduras de la semana',
        description: 'Bandeja única: rescata el pollo y cualquier verdura que ya pida turno.',
        steps: [
          'Precalienta el horno a 200 grados.',
          'Trocea papa, zanahoria y calabacín.',
          'Coloca el pollo sobre las verduras con aceite y ajo.',
          'Hornea 35-40 min.',
        ],
      },
      'Pasta al pomodoro con parmesano': {
        title: 'Pasta al pomodoro con parmesano',
        description: 'Clásico de despensa: tomates maduros, pasta seca y mucho queso.',
        steps: [
          'Hierve la pasta al dente.',
          'Sofríe ajo y tomate en aceite 10 min.',
          'Mezcla, ajusta sal y corona con parmesano.',
        ],
      },
      'Tortilla de calabacin y cebolla': {
        title: 'Tortilla de calabacín y cebolla',
        description: 'Huevos y verdura sobrante: cena de rescate en 20 minutos.',
        steps: [
          'Pocha la cebolla y el calabacín.',
          'Bate los huevos y mezcla.',
          'Cuaja a fuego bajo por ambos lados.',
        ],
      },
      'Lentejas guisadas con verduras': {
        title: 'Lentejas guisadas con verduras',
        description: 'Guiso de fondo de alacena, ideal cuando sobran raíces y caldo.',
        steps: [
          'Sofríe cebolla, ajo y zanahoria.',
          'Agrega lentejas y caldo.',
          'Cocina 40 min a fuego lento.',
          'Rectifica la sal antes de servir.',
        ],
      },
      'Bolonesa expres con carne molida': {
        title: 'Bolonesa exprés con carne molida',
        description: 'Salsa espesa para vaciar carne y tomate antes de que caduquen.',
        steps: [
          'Dora la carne con cebolla y ajo.',
          'Suma el tomate y cocina 20 min.',
          'Sirve sobre pasta con parmesano.',
        ],
      },
      'Arroz cremoso con champinones': {
        title: 'Arroz cremoso con champiñones',
        description: 'Risotto de casa: champiñones al límite y caldo de despensa.',
        steps: [
          'Sofríe cebolla y champiñones.',
          'Nacara el arroz.',
          'Añade caldo poco a poco durante 20 min.',
          'Termina con mantequilla y parmesano.',
        ],
      },
      'Pan tostado con yogur y tomate': {
        title: 'Pan tostado con yogur y tomate',
        description: 'Desayuno de rescate para pan y lácteos que no aguantan otro día.',
        steps: [
          'Tuesta el pan.',
          'Mezcla el yogur con ajo y sal.',
          'Extiende y corona con tomate en rodajas.',
        ],
      },
    },
    modal: {
      favorite: '⭐ Favorita',
      markFavorite: '☆ Marcar favorita',
      impactBadge: '🌱 Impacto: {co2} · {water}',
      ingredientsTitle: 'Ingredientes para {count} comensales',
      instructionsTitle: 'Preparación',
      shoppingListDiff: 'Lista de compras sugerida (Stateless Diff): {list}',
      missingShort: 'faltan {qty} {unit}',
      onlyAvailable: '⚠️ solo {qty} {unit}',
      notInPantry: '✕ no tienes',
      cookBtn: '🍲 ¡Cocinada!',
      missingBtn: '🍲 Faltan ingredientes',
    },
    history: {
      title: 'Ollas ya cocinadas',
      subtitle: 'Cada entrada descontó ingredientes reales de tu despensa.',
      recipesCooked: 'Recetas cocinadas:',
      batchesRescued: 'Lotes rescatados:',
      co2Avoided: 'CO₂ evitado:',
      waterSaved: 'Agua ahorrada:',
      streak: 'Racha de rescate:',
      emptyNote: 'Todavía no has cocinado nada. ¡La despensa espera!',
      deducted: 'Descontado: {list}',
      rescuedTag: '♻️ {count} rescatado(s) del desperdicio',
      ecoTag: '🌱 {co2} · {water}',
    },
    feedback: {
      cookedSuccessWithRescue: '¡Cocinada! Rescataste {count} ingrediente{plural} del desperdicio.',
      cookedSuccess: '¡Cocinada! Despensa actualizada.',
    },
    external: {
      title: 'Recetario Internacional en Vivo (TheMealDB API)',
      subtitle: 'Conexión en tiempo real con TheMealDB API para encontrar nuevas ideas con lo que tienes en la alacena.',
      searchPlaceholder: 'Buscar recetas del mundo (ej. chicken, soup, pasta, curry, beef)…',
      searchBtn: 'Buscar en la Web',
      quickPantryTitle: 'O busca directamente con ingredientes de tu alacena:',
      loading: 'Consultando servicio externo TheMealDB…',
      noResults: 'No se encontraron recetas para esta búsqueda en el servicio externo.',
      error: 'Ocurrió un error al consultar el servicio externo. Verifica tu conexión a internet.',
      viewRecipe: 'Ver receta completa',
      sourceInfo: 'Datos en vivo de TheMealDB API abierta',
      youtubeBtn: '▶ Ver video tutorial en YouTube',
      sourceBtn: '🔗 Fuente original',
      originBadge: '🌍 Cocina {area}',
      categoryBadge: '🏷️ {category}',
      modalIngredients: 'Ingredientes y medidas (API Externa)',
      modalInstructions: 'Instrucciones de preparación',
      openFoodFactsBtn: '🔍 Consultar Open Food Facts',
      openFoodFactsTitle: 'Datos del producto (Open Food Facts API)',
      nutriScoreLabel: 'Nutri-Score:',
      ecoScoreLabel: 'Eco-Score:',
      co2Label: 'Huella CO₂:',
    },
  },

  en: {
    app: {
      title: 'ZeroWaste Pantry',
      tagline: 'Cook first what is about to expire',
      atRiskToday: 'at risk today',
      co2SavedSession: 'CO₂ saved in session',
      selectLang: 'Language',
    },
    websocket: {
      connecting: 'Connecting...',
      connected: 'Live ({count})',
      disconnected: 'Offline',
      broadcastBtn: '📡 Alert Kitchen',
      broadcastPrompt: 'Enter an alert for the other cooks in the house:',
      alertBroadcasted: 'Alert broadcast to the household 📡',
      pantryUpdated: '📡 [Live] Pantry was updated.',
      cookedRecipe: '📡 [Live] Someone cooked "{title}"! ({saved} items rescued)',
      wasteAlert: '⚠️ [Live Alert] {user}: {message}',
    },
    errors: {
      nameRequired: 'Ingredient name is required',
      nameInvalid: 'Name must contain only letters and spaces (2 to 50 characters)',
      quantityRequired: 'Quantity is required',
      quantityInvalid: 'Quantity must be a positive number (e.g. 250 or 1.5)',
      expiryRequired: 'Expiry date is required',
      expiryInvalid: 'Invalid date (required format: YYYY-MM-DD)',
      unitInvalid: 'Invalid unit',
      categoryInvalid: 'Invalid category',
      formHasErrors: 'Please fix the highlighted fields before saving.',
    },
    tabs: {
      pantry: '🧺 My Pantry',
      recipes: '📇 Suggested Recipes',
      history: '🍲 Cooked Meals',
      external: '🌐 World Recipes (External API)',
    },
    pantry: {
      addTitle: 'Add to Pantry',
      ingredient: 'Ingredient',
      ingredientPlaceholder: 'Spinach, milk, chicken…',
      category: 'Category',
      quantity: 'Quantity',
      unit: 'Unit',
      expiresOn: 'Expires on',
      saveBtn: 'Save to Pantry',
      trafficLight: 'Traffic Light',
      freshLegend: 'Fresh · more than 5 days',
      soonLegend: 'Use soon · 2 to 4 days',
      urgentLegend: 'Urgent · 24-48 h or expired',
      cupboardTitle: 'The Cupboard',
      emptyNote: 'The cupboard is empty. Add something on the chalkboard on the left.',
      removeTooltip: 'Remove from pantry',
      savedToast: 'Saved to the cupboard 🧺',
      expiry: {
        expiredAgo: 'Expired {days} d ago',
        today: 'Expires today',
        tomorrow: 'Expires tomorrow',
        daysLeft: '{days} days',
      },
    },
    categories: {
      'Todas': 'All',
      'Verduras': 'Vegetables',
      'Lacteos': 'Dairy',
      'Carnes': 'Meats',
      'Despensa seca': 'Dry Pantry',
      'Otros': 'Other',
    },
    urgency: {
      fresh: 'Fresh',
      soon: 'Use soon',
      urgent: 'Urgent!',
      expired: 'Expired',
    },
    ingredients: {
      'Espinaca': 'Spinach',
      'Tomate': 'Tomato',
      'Cebolla': 'Onion',
      'Ajo': 'Garlic',
      'Calabacin': 'Zucchini',
      'Champinones': 'Mushrooms',
      'Zanahoria': 'Carrot',
      'Papa': 'Potato',
      'Leche': 'Milk',
      'Queso crema': 'Cream Cheese',
      'Queso parmesano': 'Parmesan Cheese',
      'Yogur natural': 'Plain Yogurt',
      'Huevo': 'Egg',
      'Mantequilla': 'Butter',
      'Pechuga de pollo': 'Chicken Breast',
      'Carne molida': 'Ground Beef',
      'Arroz': 'Rice',
      'Pasta': 'Pasta',
      'Lentejas': 'Lentils',
      'Aceite de oliva': 'Olive Oil',
      'Caldo de verduras': 'Vegetable Broth',
      'Pan': 'Bread',
    },
    recipes: {
      title: 'Recipe Book sorted by {scoreEmphasis}',
      scoreName: 'Waste Reduction Score',
      subtitle: 'Recipes that rescue the most at-risk ingredients first.',
      favoritesBtn: '⭐ Favorites ({count})',
      servingsLabel: 'Servings',
      bestRescue: 'Best rescue',
      minutes: '{min} min',
      servings: '{count} servings',
      inPantryPct: '{pct}% in pantry',
      usesRisk: 'Uses {count} ingredient{plural} about to expire',
      noRisk: 'No ingredients at risk',
      ecoBadge: '🌱 {co2}',
      allAvailable: '✅ You have everything needed',
      missingNote: '⚠️ Missing {count}: {list}',
      emptyNote: 'No recipes loaded yet.',
      emptyFavsNote: 'No recipes marked as favorites yet.',
    },
    recipesCatalog: {
      'Crema de espinaca y champinones': {
        title: 'Spinach and Mushroom Cream Soup',
        description: 'Creamy, ready in half an hour and the best destination for leafy greens on the edge.',
        steps: [
          'Sauté onion and garlic in butter.',
          'Add mushrooms and spinach.',
          'Pour milk and broth, cook for 10 min.',
          'Blend, season and serve hot.',
        ],
      },
      'Pollo al horno con verduras de la semana': {
        title: 'Baked Chicken with Week\'s Vegetables',
        description: 'Single tray: rescue chicken and any veggies waiting their turn.',
        steps: [
          'Preheat oven to 200°C (400°F).',
          'Chop potato, carrot and zucchini.',
          'Place chicken over vegetables with oil and garlic.',
          'Bake for 35-40 min.',
        ],
      },
      'Pasta al pomodoro con parmesano': {
        title: 'Pasta al Pomodoro with Parmesan',
        description: 'Pantry classic: ripe tomatoes, dry pasta and plenty of cheese.',
        steps: [
          'Boil pasta until al dente.',
          'Sauté garlic and tomato in oil for 10 min.',
          'Mix, adjust salt and top with parmesan.',
        ],
      },
      'Tortilla de calabacin y cebolla': {
        title: 'Zucchini and Onion Omelette',
        description: 'Eggs and leftover vegetables: 20-minute rescue dinner.',
        steps: [
          'Sauté onion and zucchini gently.',
          'Beat eggs and mix together.',
          'Cook over low heat on both sides until set.',
        ],
      },
      'Lentejas guisadas con verduras': {
        title: 'Vegetable Lentil Stew',
        description: 'Back-of-the-pantry stew, ideal when you have leftover root veggies and broth.',
        steps: [
          'Sauté onion, garlic and carrot.',
          'Add lentils and vegetable broth.',
          'Simmer for 40 min over low heat.',
          'Adjust salt before serving.',
        ],
      },
      'Bolonesa expres con carne molida': {
        title: 'Express Ground Beef Bolognese',
        description: 'Thick sauce to use up meat and tomatoes before they expire.',
        steps: [
          'Brown the meat with onion and garlic.',
          'Add tomato and simmer for 20 min.',
          'Serve over pasta topped with parmesan.',
        ],
      },
      'Arroz cremoso con champinones': {
        title: 'Creamy Mushroom Rice',
        description: 'Homestyle risotto: mushrooms on the brink and pantry broth.',
        steps: [
          'Sauté onion and mushrooms.',
          'Toast the rice until translucent.',
          'Add broth gradually over 20 min.',
          'Finish with butter and parmesan.',
        ],
      },
      'Pan tostado con yogur y tomate': {
        title: 'Toasted Bread with Yogurt and Tomato',
        description: 'Rescue breakfast for bread and dairy that won\'t last another day.',
        steps: [
          'Toast the bread.',
          'Mix yogurt with garlic and salt.',
          'Spread over toast and top with tomato slices.',
        ],
      },
    },
    modal: {
      favorite: '⭐ Favorite',
      markFavorite: '☆ Mark favorite',
      impactBadge: '🌱 Impact: {co2} · {water}',
      ingredientsTitle: 'Ingredients for {count} servings',
      instructionsTitle: 'Instructions',
      shoppingListDiff: 'Suggested shopping list (Stateless Diff): {list}',
      missingShort: 'missing {qty} {unit}',
      onlyAvailable: '⚠️ only {qty} {unit}',
      notInPantry: '✕ not in pantry',
      cookBtn: '🍲 Cooked!',
      missingBtn: '🍲 Missing ingredients',
    },
    history: {
      title: 'Cooked Meals',
      subtitle: 'Each entry deducted real ingredients from your pantry.',
      recipesCooked: 'Recipes cooked:',
      batchesRescued: 'Batches rescued:',
      co2Avoided: 'CO₂ avoided:',
      waterSaved: 'Water saved:',
      streak: 'Rescue streak:',
      emptyNote: 'You haven\'t cooked anything yet. The pantry is waiting!',
      deducted: 'Deducted: {list}',
      rescuedTag: '♻️ {count} rescued from waste',
      ecoTag: '🌱 {co2} · {water}',
    },
    feedback: {
      cookedSuccessWithRescue: 'Cooked! You rescued {count} ingredient{plural} from waste.',
      cookedSuccess: 'Cooked! Pantry updated.',
    },
    external: {
      title: 'Live International Recipes (TheMealDB API)',
      subtitle: 'Real-time connection with TheMealDB API to discover global culinary ideas with your pantry items.',
      searchPlaceholder: 'Search world recipes (e.g. chicken, soup, pasta, curry, beef)…',
      searchBtn: 'Search the Web',
      quickPantryTitle: 'Or search directly with ingredients from your pantry:',
      loading: 'Querying external service TheMealDB…',
      noResults: 'No recipes found for this search in the external service.',
      error: 'An error occurred while querying the external service. Please check your internet connection.',
      viewRecipe: 'View full recipe',
      sourceInfo: 'Live data provided by Open TheMealDB API',
      youtubeBtn: '▶ Watch video tutorial on YouTube',
      sourceBtn: '🔗 Original source',
      originBadge: '🌍 {area} Cuisine',
      categoryBadge: '🏷️ {category}',
      modalIngredients: 'Ingredients & measurements (External API)',
      modalInstructions: 'Cooking Instructions',
      openFoodFactsBtn: '🔍 Query Open Food Facts',
      openFoodFactsTitle: 'Product facts (Open Food Facts API)',
      nutriScoreLabel: 'Nutri-Score:',
      ecoScoreLabel: 'Eco-Score:',
      co2Label: 'CO₂ Footprint:',
    },
  },
};

/**
 * Gestor de Internacionalización con estado.
 */
export function createI18nManager(defaultLang = 'es') {
  let currentLang = defaultLang;

  return {
    getLang() {
      return currentLang;
    },

    setLang(lang) {
      if (translations[lang]) {
        currentLang = lang;
        return true;
      }
      return false;
    },

    t(path, params = {}) {
      const keys = String(path).split('.');
      let val = translations[currentLang];
      for (const k of keys) {
        val = val?.[k];
        if (val === undefined) break;
      }

      if (typeof val !== 'string') {
        let fallback = translations['es'];
        for (const k of keys) {
          fallback = fallback?.[k];
          if (fallback === undefined) break;
        }
        val = typeof fallback === 'string' ? fallback : path;
      }

      return val.replace(/\{(\w+)\}/g, (_, key) => (params[key] !== undefined ? params[key] : `{${key}}`));
    },

    translateCategory(catName) {
      return translations[currentLang]?.categories?.[catName] ?? catName;
    },

    translateIngredient(name) {
      if (!name) return '';
      return translations[currentLang]?.ingredients?.[name] ??
             translations['es']?.ingredients?.[name] ??
             name;
    },

    translateRecipeTitle(title) {
      if (!title) return '';
      return translations[currentLang]?.recipesCatalog?.[title]?.title ?? title;
    },

    translateRecipeDescription(title, fallbackDesc = '') {
      if (!title) return fallbackDesc;
      return translations[currentLang]?.recipesCatalog?.[title]?.description ?? fallbackDesc;
    },

    translateRecipeSteps(title, fallbackSteps = []) {
      if (!title) return fallbackSteps;
      return translations[currentLang]?.recipesCatalog?.[title]?.steps ?? fallbackSteps;
    },
  };
}
