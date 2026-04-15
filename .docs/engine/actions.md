# Actions (Дії)

## Концепція

- Action завжди прив'язаний до **Asset**. Entity наслідує Actions через `assetId`.
- Action = **декларативний покроковий конфіг** який **виконується на сервері** і логується.
- Майстер створює Actions через блочний редактор (не пише JSON вручну).

---

## Структура ActionConfig

```typescript
type ActionConfig = {
  steps: Step[]
}

type Step = {
  name: string
  conditions?: Condition[]  // перевірки — якщо false, зупиняємось
  compute?: Compute[]       // розрахунки (формули, ROLL)
  call?: MethodCall[]       // виклики методів механік
  log?: string              // шаблон повідомлення в лог
}

type Condition = {
  formula: string      // '@owner.trait["mana"].current >= 15'
  errorMessage: string
}

type Compute = {
  key: string     // ім'я змінної для наступних кроків
  formula: string // 'ROLL(1,20) + @self.trait["core-stats"].str_mod'
}

type MethodCall = {
  mechanic: string  // 'values-v1' (і назва instance через params)
  method: string    // 'damage' | 'heal' | 'removeItem' | ...
  params: Record<string, unknown>
}
```

---

## Приклад: Зілля лікування

```json
{
  "steps": [
    {
      "name": "Перевірка наявності",
      "conditions": [
        {
          "formula": "has_item(@owner, @self.assetId)",
          "errorMessage": "Немає зілля в інвентарі"
        }
      ]
    },
    {
      "name": "Лікування",
      "compute": [
        { "key": "healing", "formula": "ROLL(2,4) + 2" }
      ],
      "call": [
        {
          "mechanic": "values-v1",
          "method": "heal",
          "params": { "instance": "health", "entity": "target", "amount": "{healing}" }
        },
        {
          "mechanic": "inventory",
          "method": "removeItem",
          "params": { "entity": "owner", "quantity": 1 }
        }
      ],
      "log": "{owner} використав Зілля лікування на {target}. Відновлено {healing} HP."
    }
  ]
}
```

## Приклад: Атака мечем

```json
{
  "steps": [
    {
      "name": "Перевірка цілі",
      "conditions": [
        {
          "formula": "has_trait(@target, 'health')",
          "errorMessage": "Ціль не має здоров'я"
        }
      ]
    },
    {
      "name": "Кидок влучання",
      "compute": [
        { "key": "hit", "formula": "ROLL(1,20) + @owner.trait['core-stats'].str_mod" }
      ],
      "log": "{owner} кидає на влучання: {hit}"
    },
    {
      "name": "Шкода",
      "conditions": [
        {
          "formula": "{hit} >= @target.trait['combat'].ac",
          "errorMessage": "Промах!"
        }
      ],
      "compute": [
        { "key": "damage", "formula": "ROLL(1,6) + @owner.trait['core-stats'].str_mod" }
      ],
      "call": [
        {
          "mechanic": "values-v1",
          "method": "damage",
          "params": { "instance": "health", "entity": "target", "amount": "{damage}" }
        }
      ],
      "log": "Влучання! {owner} завдає {damage} шкоди {target}."
    }
  ]
}
```

---

## Методи механік

```typescript
// values-v1 (health instance)
methods: {
  damage: { label: 'Завдати шкоди', params: { entity, instance, amount } },
  heal:   { label: 'Відновити HP', params: { entity, instance, amount } },
  set:    { label: 'Встановити значення', params: { entity, instance, field, value } },
}

// inventory (EntityRelation API)
methods: {
  removeItem: { label: 'Видалити предмет', params: { entity, quantity } },
  addItem:    { label: 'Додати предмет', params: { entity, assetId, quantity } },
  equip:      { label: 'Екіпірувати', params: { entity, slot } },
  unequip:    { label: 'Зняти', params: { entity, slot } },
}
```

---

## Візуальний редактор (блочний)

Майстер будує Action через UI, не пише JSON:

```
[+ Додати крок]

▼ Крок 1: Перевірка
  Умова: owner має достатньо мани (≥ 15)

▼ Крок 2: Розрахунок
  Обчислення: hit = ROLL(1,20) + STR modifier

▼ Крок 3: Застосування
  Умова: hit >= AC цілі
  Метод: 🗡 Завдати шкоди → target → ROLL(1,6) + STR mod
  Метод: 🎒 Видалити предмет → owner → 1шт
```

---

## Виконання на сервері

Всі Actions виконуються на сервері (tRPC endpoint):
- Розрахунки з `ROLL` → сервер (анти-чит)
- Зміни в БД (EntityTrait, EntityRelation) → сервер (цілісність)
- Читання `@target` даних → сервер (Fog of War)

Результат логується в GameEvent лог (повна структура — відкладено).
