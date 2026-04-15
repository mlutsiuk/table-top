# sheet-v1 — Sheet Builder

## Концепція

`sheet-v1` — механіка для побудови листа персонажа. Зберігає **тільки шаблон відображення** (дерево нод). Самі дані завжди живуть у values трейтах.

```
MechanicInstance "Player Sheet" [sheet-v1]
  └── AssetTrait на Asset "Barbarian"
        data: { layout: { ...дерево нод... } }
```

---

## Принцип: Figma Auto Layout

Не drag-and-drop на піксельній сітці.
Не CSS grid з фіксованими колонками.

**Ієрархія flex/grid контейнерів** — як в Figma Auto Layout:

```
Container (flex-row)
  ├── Container (flex-col)
  │     ├── ValueNode  → binding: 'core-stats.str'
  │     └── ValueNode  → binding: 'core-stats.str_mod' (formula)
  └── Container (flex-col)
        ├── ProgressBarNode → binding: 'health.hp / health.max_hp'
        ├── InputNode       → binding: 'health.hp'
        └── ButtonNode      → actionId: 'attack-sword-id'
```

---

## Типи нод

| Тип | Функція | Що приймає |
|---|---|---|
| `Container` | Групування, flex або grid layout | Дочірні ноди |
| `ValueNode` | Відображення (readonly) значення | `instance.field_key` |
| `InputNode` | Редагування dynamic значення | `instance.field_key` (тільки dynamic) |
| `ProgressBarNode` | Візуалізація ресурсу | `instance.current_field / instance.max_field` |
| `ButtonNode` | Кнопка виклику Action | `actionId` |
| `FormulaNode` | Відображення результату формули | `instance.formula_field` |

---

## Binding формат

```typescript
// Посилання на поле трейту
binding: {
  instance: 'health',  // назва MechanicInstance
  field: 'hp'          // key поля
}

// Для ProgressBarNode
binding: {
  current: { instance: 'health', field: 'hp' },
  max:     { instance: 'health', field: 'max_hp' }
}

// Для ButtonNode
binding: {
  actionId: 'uuid-of-action'
}
```

---

## Реактивність

- WebSocket → зміни EntityTrait → Sheet оновлюється без перезавантаження
- `formula` поля перераховуються на фронтенді при зміні базових значень
- Conditional visibility — показувати/приховувати ноди за умовами (майбутнє)

---

## Важливо: sheet-v1 не зберігає дані

- Sheet читає з values трейтів, але не пише в них напряму (тільки через InputNode → tRPC)
- Якщо нода посилається на трейт якого немає на Asset → **попередження**, але не помилка
- Майстер сам вирішує чи підключати трейт до конкретного Asset

---

## Реалізується в Етапі 4

Sheet Builder — Етап 4 згідно roadmap. До цього моменту трейти відображаються в дефолтному auto-generated UI.
