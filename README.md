# Tracking Docs That Don't Suck

Demo for the Analytics Pioneers Summit 2026 barcamp session (11:00, Session 1).

```
docs/   Docusaurus site using docusaurus-plugin-generate-schema-docs
        (github.com/benedikt-buchert/tracking_docs). The schemas live in docs/static/schemas/.
slides/ The deck (PowerPoint, Up Reply template).
site/   "Brezn Bude", a tiny pretzel shop. Every click pushes add_to_cart into the dataLayer,
        and a live validator checks each push against the schema from docs/.
```

## Setup (once, with wifi)

```bash
npm run setup          # installs the docs site
```

## Before the talk

Use two terminals:

```bash
npm run docs           # http://localhost:3000  (docs, regenerated whenever a schema changes)
npm run shop           # http://localhost:8000  (shop + validator, no install needed)
```

```bash
./demo.sh reset        # start at step 0
```

Open in your editor: `docs/static/schemas/pretzel-add-to-cart-event.json` and `docs/static/schemas/components/pretzel.json`.

## Demo steps

Every step is a branch. If live typing goes wrong, `./demo.sh next` jumps to the finished state of the next step. Your edits are stashed, not lost.

| Step | Branch | What changes | Click in shop |
|---|---|---|---|
| 0 | `main` | Half-built schema: `event` + `currency` | ❌ unknown `value`, `items` |
| 1 | `step-1-value` | + `value` (number, required) | ❌ unknown `items` |
| 2 | `step-2-items` | + `items` array via `$ref` to `components/pretzel.json` | ❌ unknown `topping` |
| 3 | `step-3-topping` | + `topping` enum in the component | ✅ |

```bash
./demo.sh          # list steps, ▶ marks the current one
./demo.sh next     # or: prev, reset, 0-3
```

## Script (about 18 min)

### Act 1: Design (step 0 → 3, about 6 min)

1. **Step 0:** show the schema. "This is the whole spec today."
2. Click "In den Warenkorb" → ❌ `must NOT have additional properties: "value"`, `"items"`.
   *"The site already sends more than the docs know. In Excel you'd never notice."*
3. **Step 1:** type `value` into `properties.ecommerce.properties`:
   ```json
   "value": { "type": "number", "description": "Sum of price * quantity.", "minimum": 0, "examples": [7] }
   ```
   and add `"value"` to `ecommerce.required`. Click → ❌ only `items` left.
4. **Step 2:** add `items` (reuse, don't copy):
   ```json
   "items": {
     "type": "array", "description": "The pretzels added.", "minItems": 1,
     "items": { "$ref": "./components/pretzel.json" }
   }
   ```
   add `"items"` to `required`. Click → ❌ `/ecommerce/items/0 must NOT have additional properties: "topping"`.
5. **Step 3:** in `components/pretzel.json` add
   ```json
   "topping": {
     "type": "string", "description": "The one true topping. Anything else is a bug.",
     "enum": ["salt", "cheese", "butter", "pumpkin_seeds"], "examples": ["salt"]
   }
   ```
   and `"topping"` to `required`. Click → ✅. No reload needed.

### Act 2: Docs (about 5 min)

1. Open http://localhost:3000 → "Pretzel Add to Cart". Table, descriptions, enum values and a ready-to-copy `dataLayer.push` example, all from the file you just edited.
   *"Nobody wrote this page. It is the schema."*
2. `npm run validate` → the examples inside the schema are checked too, ready for CI.

### Act 3: Validate (about 5 min)

1. Shop: pick "Kürbiskerne" → click → ✅.
2. Console:
   ```js
   dataLayer.push({
     $schema: 'http://localhost:3000/schemas/pretzel-add-to-cart-event.json',
     event: 'add_to_cart',
     ecommerce: { currency: 'EUR', value: '7,00',
       items: [{ item_id: 'PRZ-001', item_name: 'Riesenbreze', price: 3.5, quantity: 2, topping: 'nutella' }] }
   })
   ```
   → ❌ `value must be number`, ❌ `topping must be equal to one of the allowed values`.
   **Backup:** `Shift+N` on the shop page pushes the same broken event.
3. `dataLayer.push({ event: 'page_view' })` → ⚠️ no `$schema`: "nobody knows what this should look like".
4. *"The event carries a link to its own docs. Any tool can check it: this console, your CI, sGTM."*

→ back to the slides: "Steal this".

## How the pieces connect

- Every event carries `$schema: http://localhost:3000/schemas/…`, the URL of its own contract on the docs site.
- `site/validator.js` hooks `dataLayer.push` and validates with Ajv (bundled in `site/vendor/`, no network needed).
- `site/serve.mjs` serves the shop and `/schemas/*` straight from `docs/static/schemas`, so a schema edit or a branch switch is live on the next click.
- In production, you'd drop the mapping in `validator.js` and fetch from the real docs URL.

## If something breaks

- No validator panel → open the shop via `npm run shop`, not as a file.
- ⚠️ "Cannot load schema" → JSON typo. Great live moment: *"the docs are broken, and we found out immediately."* Or `./demo.sh next`.
- Docs page didn't update → save again or restart `npm run docs`.
