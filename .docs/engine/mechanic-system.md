# Mechanic система

## Концепція

Mechanic — це "плагін" для двигуна оголошений в коді. Він описує:
- Zod схеми для валідації конфігу і даних трейтів
- Vue компоненти для UI (редактор конфігу, перегляд трейту)
- Методи доступні в Action конфігах
- Хуки (наприклад ініціалізація EntityTrait при створенні Entity)

Механіки реєструються в `MechanicRegistry` і стають доступні для використання в кампаніях.

---

## Структура Mechanic

```typescript
const valuesMechanic: Mechanic<ValuesInstanceConfig> = {
  name: 'values-v1',

  schemas: {
    // Валідація конфігу MechanicInstance (що майстер налаштовує)
    mechanicInstance: z.object({
      fields: z.array(z.discriminatedUnion('type', [
        z.object({
          key: z.string(),
          label: z.string(),
          type: z.literal('number'),
          kind: z.enum(['static', 'dynamic']),
          default: z.number()
        }),
        z.object({
          key: z.string(),
          label: z.string(),
          type: z.literal('text'),
          kind: z.enum(['static', 'dynamic']),
          default: z.string()
        }),
        z.object({
          key: z.string(),
          label: z.string(),
          type: z.literal('boolean'),
          kind: z.enum(['static', 'dynamic']),
          default: z.boolean()
        }),
        z.object({
          key: z.string(),
          label: z.string(),
          type: z.literal('formula'),
          formula: z.string()
          // немає kind і default — formula завжди обчислюється на фронтенді
        }),
      ]))
    }),

    // Структура JSONB в AssetTrait
    assetTrait: z.record(z.unknown()),

    // Структура JSONB в EntityTrait
    entityTrait: z.record(z.unknown()),
  },

  components: {
    campaignSetup: ValuesEditorComponent,  // UI для налаштування інстансу
    assetView: ValuesViewComponent,        // UI перегляду трейту на Asset
  },

  methods: {
    // Методи доступні в Action конфігах (визначає кожна механіка)
  },

  hooks: {
    // Викликається при створенні Entity з Asset
    // Ініціалізує початкові значення dynamic полів
    onEntityCreated: (assetTrait, instanceConfig) => {
      const entityTrait: Record<string, unknown> = {}
      for (const field of instanceConfig.fields) {
        if (field.type !== 'formula' && field.kind === 'dynamic') {
          entityTrait[field.key] = field.default
        }
      }
      return entityTrait
    },
  },

  // Кастомна бізнес-валідація після Zod
  validate: (config, traitData) => {
    // Перевірка дублікатів ключів
    // Перевірка циклічних залежностей формул
  }
}
```

---

## MechanicRegistry

```typescript
const mechanicRegistry = {
  'values-v1':  valuesMechanic,
  'sheet-v1':   sheetMechanic,
  'effects-v1': effectsMechanic,
}
```

---

## Валідація — два рівні

```
Рівень 1 — Zod (структура):
  Чи є fields масивом?
  Чи кожне поле має key, label, type?
  Чи formula поле не має kind і default?

Рівень 2 — кастомна функція (бізнес-логіка):
  Чи немає дублікатів ключів?
  Чи немає циклічних залежностей між formula полями?
```

---

## Методи механік (доступні в Actions)

Методи які механіка надає — викликаються з Action конфігів:

```typescript
// values-v1 / health instance
methods: {
  damage: { label: 'Завдати шкоди', params: { entity, amount } },
  heal:   { label: 'Відновити HP', params: { entity, amount } },
  setHP:  { label: 'Встановити HP', params: { entity, value } },
}

// inventory (через EntityRelation API)
methods: {
  removeItem: { label: 'Видалити предмет', params: { entity, quantity } },
  addItem:    { label: 'Додати предмет', params: { entity, assetId, quantity } },
  equip:      { label: 'Екіпірувати', params: { entity, slot } },
  unequip:    { label: 'Зняти', params: { entity, slot } },
}
```

---

## Зміни конфігу інстансу — безпечні vs деструктивні

```
Безпечні (без попередження):
  + додати нове поле
  + змінити label
  + змінити default value

Деструктивні (показуємо попередження + підтвердження):
  ⚠ видалити поле
  ⚠ перейменувати key поля
  ⚠ змінити type поля
```

У статусі кампанії `ACTIVE` — конфіг механік заблокований повністю (реалізується в Етапі 4).
