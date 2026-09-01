# 🥬 ZeroWaste Pantry

Web app que **reduce el desperdicio de comida** sugiriendo recetas según los ingredientes
más próximos a caducar en tu despensa.

Construida con **Node.js 24 + SQLite nativo (`node:sqlite`)** y **cero dependencias externas**,
bajo una **arquitectura N-capas estricta**.

---

## 🚀 Arranque

```bash
npm run seed
```

```bash
npm start
```

Abre <http://localhost:3000>. Para los tests de la capa de negocio:

```bash
npm test
```

---

## 🏗️ Arquitectura en N-Capas

Dependencias estrictamente unidireccionales; ninguna capa conoce a la de arriba.

```
[ Presentación ]  controllers · dto · http · public (UI)
        ↓
[ Negocio ]       PantryService · RecipeMatchingService
                  PortionScalingService · CookingExecutionService
        ↓
[ Acceso a Datos ] IPantryRepository · IRecipeRepository … + mappers
        ↓
[ Persistencia ]   SQLite (schema.sql)

        ↖ [ Dominio ] entidades puras, usadas por todas las capas
```

`src/composition.js` es el **único** punto donde las capas se cablean entre sí
(inyección de dependencias): los servicios reciben *interfaces* de repositorio,
nunca SQLite. Por eso los tests corren contra una BD temporal y un reloj fijo.

### Árbol de directorios

```
zerowaste-pantry/
├── server.js                     # Bootstrap HTTP
├── src/
│   ├── composition.js            # Composition root (DI)
│   │
│   ├── domain/                   # CAPA DE DOMINIO
│   │   ├── Urgency.js            #   semáforo de caducidad (VO + reglas puras)
│   │   ├── PantryItem.js         #   lote en la despensa
│   │   ├── Ingredient.js         #   catálogo + categorías + unidades
│   │   ├── Recipe.js
│   │   ├── RecipeIngredient.js   #   línea con `weight` (protagonismo)
│   │   └── CookingLog.js
│   │
│   ├── business/                 # CAPA DE LÓGICA DE NEGOCIO
│   │   ├── PantryService.js
│   │   ├── RecipeMatchingService.js
│   │   ├── PortionScalingService.js
│   │   ├── CookingExecutionService.js
│   │   └── errors.js             #   errores de dominio con status HTTP
│   │
│   ├── data/                     # CAPA DE ACCESO A DATOS
│   │   ├── db/
│   │   │   ├── schema.sql        #   CAPA DE PERSISTENCIA
│   │   │   ├── connection.js     #   conexión + withTransaction()
│   │   │   └── seed.js
│   │   ├── mappers/              #   fila SQL ⇄ entidad de dominio
│   │   └── repositories/
│   │       ├── interfaces.js     #   IPantryRepository, IRecipeRepository…
│   │       └── Sqlite*Repository.js
│   │
│   └── presentation/             # CAPA DE PRESENTACIÓN
│       ├── controllers/          #   PantryController, RecipeController, CookingController
│       ├── dto/                  #   validación de forma del payload
│       ├── http/                 #   router, responses (status + serialización), estáticos
│       └── public/               #   UI: index.html, css/styles.css, js/
└── tests/business.test.js
```

---

## 🗄️ Modelo de datos

| Tabla | Campos clave | Relaciones |
|---|---|---|
| `ingredients` | `id`, `name` (único), `category`, `default_unit` | 1—N con `pantry_items` y `recipe_ingredients` |
| `pantry_items` | `id`, `ingredient_id`, `quantity` REAL, `unit`, `expiry_date`, `added_at` | N—1 con `ingredients` |
| `recipes` | `id`, `title`, `description`, `minutes`, `base_servings`, `steps` (JSON) | 1—N con `recipe_ingredients` |
| `recipe_ingredients` | PK (`recipe_id`,`ingredient_id`), `quantity`, `unit`, `weight`, `optional` | tabla puente N—M |
| `cooking_logs` | `id`, `recipe_id`, `servings`, `cooked_at`, `consumed` (JSON), `saved_items` | N—1 con `recipes` |

Un mismo ingrediente admite **varios lotes** con caducidades distintas: es lo que
permite el descuento FEFO al cocinar.

---

## 🧮 Reglas de negocio

### Semáforo de caducidad (`domain/Urgency.js`)

| Nivel | Días restantes | Peso en el score |
|---|---|---|
| 🟢 Fresco | ≥ 5 | 1 |
| 🟡 Consumir pronto | 2 – 4 | 2.5 |
| 🔴 Urgente | 0 – 1 (24-48 h) | 5 |
| 🔴 Vencido | < 0 | 6 |

### Matching Score (`RecipeMatchingService`)

```
Score = Σ ( peso_del_ingrediente_en_la_receta × urgencia_de_caducidad )
```

Solo suman los ingredientes que la receta usa **y** están en la despensa. Si un
ingrediente tiene varios lotes, manda el **más crítico**. Desempate: nº de
ingredientes en riesgo → cobertura → menor tiempo de preparación.

### Escalado de porciones (`PortionScalingService`)

`cantidad_escalada = cantidad_base × (comensales / porciones_base)`;
las unidades `pza` se redondean al entero superior (mínimo 1).

### Modo "¡Cocinada!" (`CookingExecutionService`)

1. **Planifica** el reparto por lotes en memoria, siguiendo **FEFO**
   (*First Expired, First Out*): se gasta primero el lote más próximo a vencer.
2. Si algo no alcanza → `InsufficientStockError` (HTTP 409) y **no se toca la BD**.
3. Si alcanza → una sola **transacción** descuenta cantidades, elimina lotes
   vacíos y escribe la bitácora con los lotes rescatados del desperdicio.

---

## 🌐 API REST

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/pantry?category=Verduras` | Despensa etiquetada + resumen + categorías |
| `POST` | `/api/pantry` | Añade un lote (`name, category, quantity, unit, expiryDate`) |
| `PATCH` | `/api/pantry/:id` | Ajusta la cantidad de un lote |
| `DELETE` | `/api/pantry/:id` | Elimina un lote |
| `GET` | `/api/recipes?servings=4` | Recetas ordenadas por Score ZeroWaste |
| `GET` | `/api/recipes/:id?servings=4` | Ficha escalada y contrastada con la despensa |
| `POST` | `/api/cook` | Registra la preparación y descuenta inventario |
| `GET` | `/api/cook/history` | Últimas recetas cocinadas |

Códigos: `200` / `201` · `404` no encontrado · `409` stock insuficiente ·
`422` validación (con `details` por campo) · `500` interno.

---

## 🎨 UI — "Cocina rústica y cálida"

- **Paleta**: fondos crema y lino (`#FAF6F0`, `#F3EDE2`), verde oliva (`#556B2F`,
  `#606C38`), terracota (`#BC6C25`, `#DDA15E`), rojo tomate para lo urgente
  (`#D64045`); tinta en marrón-carbón (`#283618`, `#2B2D2F`), nunca negro puro.
- **Pizarra de cocina** para dar de alta ingredientes; **alacena de madera** con
  los lotes agrupados por estante (categoría) y etiqueta de caducidad.
- **Fichas de recetas** con textura de cartulina rayada, margen rojo, títulos en
  serifa (Bitter) y marcador de tiempo con ⏲️.
- **Microinteracciones**: el lote consumido se tacha y se desliza al eliminarse;
  el botón "¡Cocinada!" hierve mientras corre la transacción; las fichas se
  inclinan levemente al pasar el cursor. Todo se desactiva con
  `prefers-reduced-motion`.
