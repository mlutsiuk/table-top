# TableTop Engine — Повна архітектурна документація

> Цей документ є вичерпним описом архітектури, рішень та домовленостей по проекту TableTop Engine. Призначений для введення в курс справи нового розробника або AI агента.

---

## Зміст

1. [Місія та концепція](#1-місія-та-концепція)
2. [Технологічний стек](#2-технологічний-стек)
3. [Термінологія](#3-термінологія)
4. [Рівні системи](#4-рівні-системи)
5. [Модель даних](#5-модель-даних)
6. [Mechanic система](#6-mechanic-система)
7. [Layered State Resolve](#7-layered-state-resolve)
8. [Formula Parser](#8-formula-parser)
9. [EntityRelation система](#9-entityrelation-система)
10. [Інвентар та предмети](#10-інвентар-та-предмети)
11. [Ефекти (Active Effects)](#11-ефекти-active-effects)
12. [Actions (Дії)](#12-actions-дії)
13. [Sheet Builder](#13-sheet-builder)
14. [VTT (відкладено)](#14-vtt-відкладено)
15. [Статуси кампанії](#15-статуси-кампанії)
16. [Prisma схема](#16-prisma-схема)
17. [Етапи розробки](#17-етапи-розробки)
18. [Відкриті питання](#18-відкриті-питання)

---

## 1. Місія та концепція

### "Дані над кодом" (Data-Driven Architecture)

TableTop Engine — це VTT (Virtual Tabletop) система де **ігрова логіка не зашита в код, а інтерпретується на основі даних наданих користувачем**.

**Проблема існуючих рішень:**
- Більшість VTT систем (Roll20, Foundry VTT) або прив'язані до конкретної ігрової системи (D&D), або вимагають від користувача писати код для кастомізації.
- Foundry VTT вирішує це через JavaScript модулі які пишуть розробники — але не звичайні майстри.

**Рішення TableTop:**
- Система надає абстрактні інструменти ("контейнери") які користувач наповнює змістом через графічний інтерфейс.
- Система не "знає" що таке "Сила" чи "Хіти" поки майстер не створить відповідну механіку.
- Гнучкість рівня розробника доступна через UI без знання програмування.

**Аналогія з Terraform:**
Архітектура дуже нагадує Terraform:
```
Terraform              →  TableTop
Provider               →  Mechanic (код, логіка)
Resource               →  MechanicInstance (конфіг під кампанію)
Variable               →  Field (static/dynamic)
Output                 →  Formula field
State file             →  AssetTrait / EntityTrait
Plan (dry run)         →  pre-flight check при draft→active
Dependency graph       →  FieldReference таблиця
```

**Поточний фокус розробки:**
- Solo Master Tool — спочатку без multiplayer
- DOM замість Canvas — верифікуємо архітектуру даних без складності рендерингу
- Canvas розглядається як додаткове View яке підключається пізніше

---

## 2. Технологічний стек

| Технологія | Причина |
|---|---|
| **Nuxt.js** | Fullstack framework, спільна логіка (Zod) на клієнті і сервері, SSR для публічних сторінок |
| **PostgreSQL** | JSONB для поліморфних трейтів, надійність, транзакційність, повнотекстовий пошук |
| **Prisma ORM** | Type-safety для складних реляційних зв'язків |
| **tRPC** | Пряма передача типів від БД до фронтенду, Zod валідація |
| **Zod** | Runtime валідація схем, спільна між клієнтом і сервером |
| **Tailwind CSS** | Гнучкість для Sheet Builder без громіздкого CSS |
| **WebSockets** | Real-time синхронізація (на пізніх етапах) |

**Авторизація:** JWT токени через Google OAuth (вже реалізовано).

---

## 3. Термінологія

> ⚠️ Важливо: використовувати саме ці терміни для консистентності.

| Термін | Визначення |
|---|---|
| **Mechanic** | Оголошена **в коді** логіка. Описує структури даних, схеми валідації, компоненти для UI, методи які можна викликати в Actions. Це "плагін" для движка. |
| **MechanicInstance** | Створена **під конкретну кампанію** зв'язка кампанії та механіки з налаштуваннями. Якщо Mechanic описує що можуть бути числові поля, то Instance налаштовує їх під DnD 5e (str, dex, con...). |
| **Asset** | Шаблон/креслення сутності. Має назву, опціональну картинку, текстовий опис. Лежить у папці, належить кампанії. Аналог **класу** в ООП. |
| **Entity** | Конкретний екземпляр Asset. Живий об'єкт у світі гри. Аналог **об'єкту** в ООП. |
| **AssetTrait** | Зв'язка Asset + MechanicInstance + статичні дані. Характеризує шаблон. Наприклад: гоблін має MaxHP=10. |
| **EntityTrait** | Зв'язка Entity + MechanicInstance + динамічні дані. Поточний стан конкретного екземпляру. Наприклад: цей гоблін має HP=3. |
| **EntityRelation** | Зв'язок між двома Entity. Має key (тип зв'язку) і data (JSONB з деталями). Використовується для інвентарю, ефектів, спорядження тощо. |
| **Action** | Набір покрокових інструкцій прив'язаних до Asset. Описує що відбувається при використанні (атака, зілля, закляття). |
| **Scene** | Ігрове поле (VTT). *(відкладено)* |
| **SceneEntity** | Присутність Entity на сцені з координатами. *(відкладено)* |
| **SceneDecoration** | Статичні декорації на сцені. *(відкладено)* |

**Стара термінологія яку НЕ використовуємо:**
- `Token` → замінено на `Entity`
- `Trait` (без префіксу) → використовуємо `AssetTrait` або `EntityTrait`

---

## 4. Рівні системи

```
┌─────────────────────────────────────────────┐
│  ENGINE LEVEL (код розробника, незмінний)   │
│  Asset / Entity / AssetTrait / EntityTrait  │
│  EntityRelation API                         │
│  Layered State Resolve                      │
│  Formula Parser                             │
│  Action Engine                              │
│  MechanicRegistry                           │
└─────────────────────────────────────────────┘
          ↕ використовують
┌─────────────────────────────────────────────┐
│  MECHANIC LEVEL (код розробника)            │
│  values-v1, health-v1, inventory-v1...      │
│  Реєструються в MechanicRegistry            │
│  Надають: schemas, components, methods      │
└─────────────────────────────────────────────┘
          ↕ налаштовується через
┌─────────────────────────────────────────────┐
│  CAMPAIGN LEVEL (налаштування майстра)      │
│  MechanicInstance (які механіки підключені) │
│  Конфіг інстансів (поля, формули)           │
│  Assets і їх AssetTraits                    │
│  Actions на Assets                          │
└─────────────────────────────────────────────┘
          ↕ виконується як
┌─────────────────────────────────────────────┐
│  RUNTIME LEVEL (під час гри)                │
│  Entity (інстанси Assets)                   │
│  EntityTrait (поточний стан)                │
│  EntityRelation (інвентар, ефекти, зв'язки) │
│  SceneEntity (позиції на сцені)             │
└─────────────────────────────────────────────┘
```

---

## 5. Модель даних

### Ієрархія

```
Campaign
  └── Folder (рекурсивна структура)
        └── Folder
              └── Asset
                    └── AssetTrait (× кількість MechanicInstances)
                    └── Action
                    └── Entity (× кількість створених екземплярів)
                          └── EntityTrait
                          └── EntityRelation → інший Entity
```

### Asset vs Entity (Клас vs Об'єкт)

| | Asset | Entity |
|---|---|---|
| **Роль** | Шаблон / Клас | Екземпляр / Об'єкт |
| **Дані** | Статичні (MaxHP, опис) | Динамічні (поточне HP, позиція) |
| **Кількість** | Один тип | Багато екземплярів |
| **Аналогія** | Клас "Goblin" | Конкретний гоблін у бою |

**Ключова перевага:** Якщо майстер змінює MaxHP у Asset, всі Entity які не мають override автоматично отримують нове значення через Layered State Resolve.

### AssetTrait vs EntityTrait

```
AssetTrait [health-instance]:
  max_hp: 10        ← статичне, спільне для всіх копій

EntityTrait [health-instance]:
  hp: 3             ← динамічне, унікальне для кожного екземпляру
```

При створенні Entity з Asset — EntityTrait автоматично ініціалізується з дефолтних значень через `onEntityCreated` hook механіки.

---

## 6. Mechanic система

### Оголошення Mechanic в коді

```typescript
const valuesMechanic: Mechanic<ValuesInstanceConfig> = {
  name: 'values-v1',
  
  schemas: {
    // валідація конфігу інстансу
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
          // немає kind і default — формула завжди обчислюється на фронтенді
        }),
      ]))
    }),
    // структура даних в AssetTrait (JSONB)
    assetTrait: z.record(z.unknown()),
    // структура даних в EntityTrait (JSONB)
    entityTrait: z.record(z.unknown()),
  },
  
  components: {
    campaignSetup: ValuesEditorComponent,  // редактор інстансу
    assetView: ValuesViewComponent,        // перегляд трейту на ассеті
  },
  
  methods: {
    // методи доступні в Action конфігах
  },
  
  hooks: {
    // ініціалізація EntityTrait при створенні Entity
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
  
  // кастомна бізнес-валідація (після Zod)
  validate: (config, traitData) => {
    // перевірка дублікатів ключів, циклічних формул тощо
  }
}
```

### Типи полів (values-v1)

| Тип | kind | Де зберігається | Примітка |
|---|---|---|---|
| `number` | `static` | AssetTrait JSONB | Паспортні дані |
| `number` | `dynamic` | EntityTrait JSONB | Поточний стан |
| `text` | `static` / `dynamic` | AssetTrait / EntityTrait | |
| `boolean` | `static` / `dynamic` | AssetTrait / EntityTrait | |
| `formula` | — | Ніде (тільки конфіг інстансу) | Рахується на фронтенді |

### MechanicRegistry

```typescript
// реєстрація всіх механік
const mechanicRegistry = {
  'values-v1': valuesMechanic,
  'inventory-v1': inventoryMechanic,
  'health-v1': healthMechanic,
  'effects-v1': effectsMechanic,
  'sheet-v1': sheetMechanic,
}
```

### Валідація — два рівні

```
Рівень 1 — Zod (структура):
  Чи є fields масивом? Чи кожне поле має key, label, type?

Рівень 2 — кастомна функція (бізнес-логіка):
  Чи немає дублікатів ключів?
  Чи formula поле не має default?
  Чи немає циклічних залежностей?
```

### Приклади MechanicInstance конфігів для DnD 5e

**Інстанс `core-stats`:**
```json
{
  "fields": [
    { "key": "str", "label": "Strength", "type": "number", "kind": "static", "default": 10 },
    { "key": "dex", "label": "Dexterity", "type": "number", "kind": "static", "default": 10 },
    { "key": "con", "label": "Constitution", "type": "number", "kind": "static", "default": 10 },
    { "key": "int", "label": "Intelligence", "type": "number", "kind": "static", "default": 10 },
    { "key": "wis", "label": "Wisdom", "type": "number", "kind": "static", "default": 10 },
    { "key": "cha", "label": "Charisma", "type": "number", "kind": "static", "default": 10 },
    { "key": "str_mod", "label": "STR Modifier", "type": "formula", "formula": "FLOOR((@self.trait['core-stats'].str - 10) / 2)" },
    { "key": "dex_mod", "label": "DEX Modifier", "type": "formula", "formula": "FLOOR((@self.trait['core-stats'].dex - 10) / 2)" }
  ]
}
```

**Інстанс `health`:**
```json
{
  "fields": [
    { "key": "max_hp", "label": "Max HP", "type": "number", "kind": "static", "default": 1 },
    { "key": "hp", "label": "Current HP", "type": "number", "kind": "dynamic", "default": 1 }
  ]
}
```

**Інстанс `skills`:**
```json
{
  "fields": [
    { "key": "athletics_prof", "label": "Athletics Proficiency", "type": "boolean", "kind": "static", "default": false },
    { "key": "athletics_mod", "label": "Athletics", "type": "formula", "formula": "@self.trait['core-stats'].str_mod + IF(@self.trait['skills'].athletics_prof, @self.trait['proficiency'].bonus, 0)" },
    { "key": "passive_perception", "label": "Passive Perception", "type": "formula", "formula": "10 + @self.trait['skills'].perception_mod" }
  ]
}
```

### Підтримувані механіки движка (values-v1 покриває)

**Етап 1 (прості числові значення):**
- `core-stats` — STR, DEX, CON, INT, WIS, CHA
- `health` — MaxHP (static), HP (dynamic)
- `combat` — AC, Speed, Initiative
- `identity` — Class (text), Level, Background, Race, Alignment (text)
- `meta` — Player Name (text), Experience Points (dynamic)
- `proficiency` — Proficiency Bonus

**Етап 2 (формули):**
- `core-stats` розширюється модифікаторами (formula fields)
- `skills` — proficiency (boolean) + modifier (formula)
- `saving-throws` — аналогічно до skills

**Етап 3 (колекції — окрема механіка):**
- `spell-slots`, `hit-dice`, `class-resources`

---

## 7. Layered State Resolve

При запиті будь-якого значення параметра система проходить рівні від найвищого пріоритету:

```
1. Active Effects    ← EntityRelation з key: 'active_effect'
                       модифікації з трейту ефект-Entity
2. Entity Override   ← EntityTrait (ручний перезапис)
3. Asset Static      ← AssetTrait (значення шаблону)
4. Mechanic Default  ← конфіг MechanicInstance (default поля)
```

**Приклад для AC:**
```
Токен має AC=15 в AssetTrait
+ ефект "Shield" додає +5 (Active Effect)
+ майстер вручну перезаписав +2 (Entity Override)

Результат: 15 (Asset) + 2 (Override) + 5 (Effect) = 22
```

> ⚠️ Важливо: Active Effects агрегуються — якщо кілька ефектів модифікують одне поле, всі враховуються.

---

## 8. Formula Parser

### Синтаксис

```
// Контексти
@self    — entity який ініціює дію
@owner   — entity який володіє предметом
@target  — entity ціль
@global  — змінні рівня кампанії

// Посилання на трейт
@self.trait['instance-name'].field_key

// Функції
FLOOR(x), CEIL(x), ABS(x), MAX(a,b), MIN(a,b)
ROLL(1, 20)          — кидок кубика
IF(condition, a, b)  — умовний вираз

// Приклади
FLOOR((@self.trait['core-stats'].str - 10) / 2)
ROLL(1,20) + @self.trait['core-stats'].str_mod >= @target.trait['combat'].ac
IF(@self.trait['skills'].athletics_prof, @self.trait['proficiency'].bonus, 0)
```

### Де виконується

| Тип формули | Де рахується | Причина |
|---|---|---|
| Статичні (модифікатори, пасивні значення) | **Фронтенд** | Швидко, реактивно, дані вже є |
| Actions з ROLL | **Сервер** | Безпека, анти-чит |
| Actions що змінюють БД | **Сервер** | Цілісність даних |
| Actions з @target (приховані дані) | **Сервер** | Fog of War |

### Порядок обчислення

Система будує граф залежностей і обчислює у **топологічному порядку**:

```
str → str_mod → athletics_mod → (використовується в Action)
wis → wis_mod → perception_mod → passive_perception
prof_bonus → athletics_mod, perception_mod
```

**Циклічні залежності заборонені.** При збереженні формули система перевіряє цикли через DFS. Якщо цикл знайдено — формула не зберігається з поясненням де саме цикл.

### FieldReference (індекс залежностей)

> Відкладено на пізніший етап. Поки що деструктивні зміни (видалення/перейменування поля) показують попередження але не блокуються.

```prisma
// додати пізніше
model FieldReference {
  id               String @id
  sourceType       String // 'formula' | 'action'
  sourceId         String
  targetInstanceId String
  targetFieldKey   String
  @@index([targetInstanceId, targetFieldKey])
}
```

### Відображення формул (два режими)

**Режим редагування:**
```
FLOOR((@self.trait['core-stats'].str - 10) / 2)
```

**Режим перегляду** (людська читабельність):
```
FLOOR(( [Self: Core Stats: Strength] - 10) / 2)
```
Де `[Self: Core Stats: Strength]` — бейдж з підсвіченим фоном, при наведенні показує реальне значення `= 16`. Broken посилання підсвічуються червоним.

---

## 9. EntityRelation система

### Структура

```prisma
model EntityRelation {
  id       String @id
  sourceId String // Entity (звідки)
  targetId String // Entity (куди)
  key      String // тип зв'язку — визначає механіка
  data     Json?  // JSONB — формат визначає механіка
  
  @@index([sourceId, key])
  @@index([targetId, key]) // для симетричних зв'язків
}
```

### Принцип

- EntityRelation — це **механізм движка**, не механіка кампанії
- Механіки використовують його як API для реалізації своєї логіки
- `key` — рядок який визначає механіка (не enum в БД)
- `data` — JSONB формат якого визначає механіка

### TypeScript типізація через Registry

```typescript
declare module '@engine/relations' {
  interface RelationRegistry {
    inventory:     { quantity?: number }
    active_effect: { appliedAt: Date, appliedBy: string }
    equipped:      { slot: string }
    companion:     { bond?: string }
  }
}

// типізований API
engine.relations.create<'inventory'>({
  sourceId: entityId,
  targetId: itemEntityId,
  key: 'inventory',
  data: { quantity: 1 } // TypeScript знає цей тип
})
```

### Engine API для механік

```typescript
engine.relations.create({ sourceId, targetId, key, data })
engine.relations.getBySource({ sourceId, key })
engine.relations.getByTarget({ targetId, key })
engine.relations.getBoth({ entityId, key })  // для симетричних
engine.relations.update({ id, data })
engine.relations.delete({ id })
```

### Симетричні зв'язки

Якщо зв'язок симетричний (наприклад "союзники") — механіка сама обробляє це:

```typescript
// механіка allies-v1
getAllies(entityId) {
  const [fromSource, fromTarget] = await Promise.all([
    engine.relations.getBySource({ sourceId: entityId, key: 'ally' }),
    engine.relations.getByTarget({ targetId: entityId, key: 'ally' }),
  ])
  return [...fromSource, ...fromTarget]
}
```

---

## 10. Інвентар та предмети

### Правило: кожен предмет = окремий Entity

```
3 мечі = 3 Entity в БД
50 стріл = 50 Entity в БД
```

**Чому не quantity в зв'язку:**
- Потрібна можливість екіпірувати конкретний предмет зі "стаку"
- Предмет може мати унікальний стан (прокляття, зачарування)
- Архітектурна консистентність — всі зв'язки між Entity

**Стакінг — тільки візуальний в UI:**
```typescript
function groupInventory(items: Entity[]) {
  return items.reduce((acc, item) => {
    const isIdentical = isEmpty(item.overrides) // немає перезаписів
    const key = isIdentical ? item.assetId : item.id
    if (!acc[key]) acc[key] = { item, count: 0 }
    acc[key].count++
    return acc
  }, {})
}
```

**Lazy loading:** Завантажуємо EntityTrait предметів тільки коли відкритий інвентар.

### Типи зв'язків інвентарю

```typescript
// предмет в інвентарі
EntityRelation { key: 'inventory', data: {} }

// предмет екіпірований
EntityRelation { key: 'equipped', data: { slot: 'main_hand' } }
```

---

## 11. Ефекти (Active Effects)

### Концепція: Ефект = Asset + Entity

```
Asset "Rage" (шаблон ефекту)
  └── AssetTrait [effect-v1]
        modifications: [
          { field: 'combat.damage', operation: 'add', value: '2' },
          { field: 'combat.resistance', operation: 'add', value: 'physical' }
        ]
        duration: { type: 'rounds', value: 10 }
        isConcentration: false

Entity "Rage #1" (конкретний ефект застосований на токені)
  └── EntityTrait [effect-v1]
        remainingRounds: 8
        appliedAt: timestamp

EntityRelation:
  source: Entity "Thorin"
  target: Entity "Rage #1"
  key: 'active_effect'
  data: { appliedAt, appliedBy: 'thorin-entity-id' }
```

### Типи модифікацій

```typescript
type Modification =
  | { operation: 'add', field: string, value: number | string }
  | { operation: 'subtract', field: string, value: number | string }
  | { operation: 'multiply', field: string, value: number }
  | { operation: 'override', field: string, value: number | string }
  | { operation: 'advantage', field: string }
  | { operation: 'disadvantage', field: string }
  | { operation: 'immunity', damageType: string }
  | { operation: 'resistance', damageType: string }
```

### Типи тривалості

```typescript
type Duration =
  | { type: 'rounds', value: number }
  | { type: 'until_rest', rest: 'short' | 'long' }
  | { type: 'concentration' }
  | { type: 'permanent' }
  | { type: 'until_condition', condition: string }
```

### MVP ефектів (перший етап)

```
✓ Asset "ефект" з AssetTrait [effect-v1]
✓ Entity для кожного застосованого ефекту
✓ EntityRelation з key: 'active_effect'
✓ Тільки статичні модифікації (add, subtract, override)
✓ Тривалість: тільки permanent і rounds
✓ Майстер знімає ефекти вручну

Відкладено:
✗ Тригерні ефекти (on_turn_start)
✗ Concentration відстеження
✗ AoE ефекти
✗ Автоматичний expire
```

---

## 12. Actions (Дії)

### Концепція

Action завжди прив'язаний до **Asset**. Entity наслідує Actions через `assetId`.

Action = **декларативний покроковий конфіг** який виконується на сервері і логується.

### Структура

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
  formula: string   // '@owner.trait["mana"].current >= 15'
  errorMessage: string
}

type Compute = {
  key: string       // ім'я змінної
  formula: string   // '1d20 + @self.trait["core-stats"].str_mod'
}

type MethodCall = {
  mechanic: string  // 'health-v1'
  method: string    // 'damage'
  params: Record<string, unknown>
}
```

### Методи механік (доступні в Actions)

Кожна механіка надає методи які майстер може використовувати в Action конфігу:

```typescript
// inventory-v1
methods: {
  removeItem: { label: 'Видалити предмет', params: { entity, quantity } },
  addItem:    { label: 'Додати предмет', params: { entity, assetId, quantity } },
  equip:      { label: 'Екіпірувати', params: { entity, slot } },
  unequip:    { label: 'Зняти', params: { entity, slot } },
}

// health-v1
methods: {
  damage: { label: 'Завдати шкоди', params: { entity, amount } },
  heal:   { label: 'Відновити HP', params: { entity, amount } },
  setHP:  { label: 'Встановити HP', params: { entity, value } },
}

// mana-v1 (якщо є така механіка)
methods: {
  spend:   { label: 'Витратити ману', params: { entity, amount } },
  restore: { label: 'Відновити ману', params: { entity, amount } },
}
```

### Приклад: Зілля лікування

```json
{
  "steps": [
    {
      "name": "Перевірка",
      "conditions": [
        { "formula": "has_item(@owner, @self.assetId)", "errorMessage": "Немає зілля в інвентарі" }
      ]
    },
    {
      "name": "Лікування",
      "compute": [
        { "key": "healing", "formula": "ROLL(2,4) + 2" }
      ],
      "call": [
        { "mechanic": "health-v1", "method": "heal", "params": { "entity": "target", "amount": "{healing}" } },
        { "mechanic": "inventory-v1", "method": "removeItem", "params": { "entity": "owner", "quantity": 1 } }
      ],
      "log": "{owner} використав Зілля лікування на {target}. Відновлено {healing} HP."
    }
  ]
}
```

### Приклад: Атака мечем

```json
{
  "steps": [
    {
      "name": "Перевірка цілі",
      "conditions": [
        { "formula": "has_trait(@target, 'health')", "errorMessage": "Ціль не має здоров'я" }
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
        { "formula": "{hit} >= @target.trait['combat'].ac", "errorMessage": "Промах!" }
      ],
      "compute": [
        { "key": "damage", "formula": "ROLL(1,6) + @owner.trait['core-stats'].str_mod" }
      ],
      "call": [
        { "mechanic": "health-v1", "method": "damage", "params": { "entity": "target", "amount": "{damage}" } }
      ],
      "log": "Влучання! {owner} завдає {damage} шкоди {target}."
    }
  ]
}
```

### Візуальний редактор Actions

Майстер не пише JSON вручну — використовує блочний редактор:

```
[+ Додати крок]

▼ Крок 1: Перевірка
  [+ Умова ▾] → owner має достатньо мани (≥ 15)

▼ Крок 2: Розрахунок  
  [+ Обчислення ▾] → hit = ROLL(1,20) + STR modifier

▼ Крок 3: Застосування
  [+ Умова ▾] → hit >= AC цілі
  [+ Метод ▾] → 🗡 Завдати шкоди (health-v1) → target → ROLL(1,6)
  [+ Метод ▾] → 🎒 Видалити предмет (inventory-v1) → owner → 1шт
```

---

## 13. Sheet Builder

### Концепція

Sheet Builder — це механіка `sheet-v1` в engine. Майстер підключає інстанс цієї механіки до кампанії і через спеціальний компонент будує шаблон листа персонажа.

```
MechanicInstance "Player Sheet" [sheet-v1]
  └── AssetTrait на Asset "Barbarian"
        layout: { ...дерево нод... }
```

### Принцип відображення: Figma Auto Layout

Не drag-and-drop на піксельній сітці і не CSS grid з колонками.

Замість цього — **ієрархія flex/grid контейнерів**:

```
Container (flex-row)
  └── Container (flex-col)
        └── ValueNode → binding: 'core-stats.str'
        └── ValueNode → binding: 'core-stats.str_mod' (formula)
  └── Container (flex-col)
        └── ProgressBarNode → binding: 'health.hp / health.max_hp'
        └── InputNode → binding: 'health.hp'
        └── ButtonNode → action: 'attack-action-id'
```

### Типи нод

| Тип | Функція | Binding |
|---|---|---|
| `Container` | Групування, flex/grid layout | — |
| `ValueNode` | Відображення значення | AssetTrait field |
| `InputNode` | Редагування значення | EntityTrait field |
| `ProgressBarNode` | Візуалізація ресурсу | dynamic/static поле |
| `ButtonNode` | Кнопка виклику Action | Action ID |
| `FormulaNode` | Відображення формули | formula field |

### Реактивність

- WebSocket → зміни EntityTrait → автоматичне оновлення Sheet без перезавантаження
- `formula` поля перераховуються на фронтенді при зміні базових значень
- `Conditional visibility` — показувати/приховувати ноди за умовами

---

## 14. VTT (відкладено)

Весь цей розділ відкладений на пізній етап. Спочатку будуємо DOM-based інтерфейс.

```
Відкладено:
  Scene, SceneEntity, SceneDecoration — моделі і логіка
  Canvas / PixiJS / WebGL рендеринг
  Fog of War / Line of Sight (raycasting)
  Система шарів (z-index)
  Grid типи (square, hex, gridless)
  Масштабування і координати
```

---

## 15. Статуси кампанії

```
DRAFT → ACTIVE → ARCHIVED
```

| Статус | Що можна робити |
|---|---|
| `DRAFT` | Повне редагування: механіки, ассети, формули, налаштування |
| `ACTIVE` | Механіки заблоковані. Гра йде. Entity створюються/видаляються |
| `ARCHIVED` | Тільки читання |

### Перехід DRAFT → ACTIVE

Явна дія майстра ("Запустити кампанію"). В момент переходу — pre-flight check:

```
✓ Всі MechanicInstances мають валідний конфіг
✓ Немає broken посилань у формулах
✓ Немає циклічних залежностей
⚠ Попередження: механіки будуть заблоковані
```

### Редагування механік

У статусі `DRAFT` — все можна змінювати.

Зміни класифікуються:
```
Безпечні (без попередження):
  + додати нове поле
  + змінити label
  + змінити default value

Деструктивні (попередження + підтвердження):
  ⚠ видалити поле
  ⚠ перейменувати key поля
  ⚠ змінити type поля
```

У статусі `ACTIVE` — механіки **заблоковані** повністю.

---

## 16. Prisma схема

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

generator json {
  provider  = "prisma-json-types-generator"
  namespace = "PrismaJson"
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

model User {
  id        String     @id @default(uuid())
  email     String     @unique
  name      String
  createdAt DateTime   @default(now()) @map("created_at")
  campaigns Campaign[]

  @@map("users")
}

model Campaign {
  id                String             @id @default(uuid())
  title             String
  status            CampaignStatus     @default(DRAFT)
  createdAt         DateTime           @default(now()) @map("created_at")
  masterId          String             @map("master_id")
  master            User               @relation(fields: [masterId], references: [id])
  folders           Folder[]
  assets            Asset[]
  mechanicInstances MechanicInstance[]
  entities          Entity[]

  @@map("campaigns")
}

model Folder {
  id         String   @id @default(uuid())
  title      String
  parentId   String?  @map("parent_id")
  parent     Folder?  @relation("SubFolders", fields: [parentId], references: [id])
  subFolders Folder[] @relation("SubFolders")
  campaignId String   @map("campaign_id")
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  assets     Asset[]

  @@map("folders")
}

model Asset {
  id          String       @id @default(uuid())
  title       String
  campaignId  String       @map("campaign_id")
  campaign    Campaign     @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  folderId    String       @map("folder_id")
  folder      Folder       @relation(fields: [folderId], references: [id], onDelete: Cascade)
  assetTraits AssetTrait[]
  entities    Entity[]

  @@map("assets")
}

model MechanicInstance {
  id           String        @id @default(uuid())
  key          String        // 'values-v1', 'inventory-v1', 'sheet-v1'
  name         String        // назва від майстра: 'core-stats', 'health'
  /// [MechanicInstanceConfig]
  config       Json
  campaignId   String        @map("campaign_id")
  campaign     Campaign      @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  assetTraits  AssetTrait[]
  entityTraits EntityTrait[]

  @@unique([campaignId, name])
  @@map("mechanic_instances")
}

model AssetTrait {
  id                 String           @id @default(uuid())
  assetId            String           @map("asset_id")
  asset              Asset            @relation(fields: [assetId], references: [id], onDelete: Cascade)
  mechanicInstanceId String           @map("mechanic_instance_id")
  mechanicInstance   MechanicInstance @relation(fields: [mechanicInstanceId], references: [id], onDelete: Cascade)
  /// [AssetTraitData]
  data               Json

  @@unique([assetId, mechanicInstanceId])
  @@map("asset_traits")
}

model Entity {
  id            String           @id @default(uuid())
  assetId       String           @map("asset_id")
  asset         Asset            @relation(fields: [assetId], references: [id], onDelete: Cascade)
  campaignId    String           @map("campaign_id")
  campaign      Campaign         @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  entityTraits  EntityTrait[]
  relationsFrom EntityRelation[] @relation("RelationSource")
  relationsTo   EntityRelation[] @relation("RelationTarget")

  @@map("entities")
}

model EntityTrait {
  id                 String           @id @default(uuid())
  entityId           String           @map("entity_id")
  entity             Entity           @relation(fields: [entityId], references: [id], onDelete: Cascade)
  mechanicInstanceId String           @map("mechanic_instance_id")
  mechanicInstance   MechanicInstance @relation(fields: [mechanicInstanceId], references: [id], onDelete: Cascade)
  /// [EntityTraitData]
  data               Json

  @@unique([entityId, mechanicInstanceId])
  @@map("entity_traits")
}

model EntityRelation {
  id       String  @id @default(uuid())
  sourceId String  @map("source_id")
  source   Entity  @relation("RelationSource", fields: [sourceId], references: [id], onDelete: Cascade)
  targetId String  @map("target_id")
  target   Entity  @relation("RelationTarget", fields: [targetId], references: [id], onDelete: Cascade)
  key      String  // визначає механіка: 'inventory', 'active_effect', 'equipped'
  /// [EntityRelationData]
  data     Json?

  @@index([sourceId, key])
  @@index([targetId, key])
  @@map("entity_relations")
}
```

### Порядок міграцій (від існуючої схеми)

```bash
# Вже існує: User, Campaign, Folder, Asset
prisma migrate dev --name add_campaign_status    # + enum + поле status
prisma migrate dev --name add_mechanic_engine    # + MechanicInstance + AssetTrait
prisma migrate dev --name add_entity_system      # + Entity + EntityTrait + EntityRelation
```

---

## 17. Етапи розробки

### Етап 1 — Вікі/Бібліотека (поточний) [складність: 3/10]

```
✓ Campaign CRUD (статуси: DRAFT/ACTIVE/ARCHIVED)
✓ Folder структура (рекурсивна)
✓ Asset CRUD
○ MechanicInstance CRUD (values-v1 з number/text/boolean полями)
○ AssetTrait CRUD
○ Перегляд Asset з трейтами
○ Базовий UI без формул і formula полів
```

**Результат:** Повноцінна вікі де можна вести бестіарій, описувати зброю, NPC.

### Етап 2 — Sheet Builder [складність: 5-6/10]

```
○ formula поля (парсер формул базовий)
○ Entity CRUD
○ EntityTrait CRUD
○ Layered State Resolve
○ Sheet Builder (Figma Auto Layout концепція)
○ Реактивне оновлення листа
```

**Результат:** Можна вести персонажів, відслідковувати HP, інвентар — без VTT.

### Етап 3 — Actions [складність: 6/10]

```
○ Action конфіг на Asset
○ Методи механік (health-v1.damage, inventory-v1.removeItem...)
○ Виконання Actions на сервері
○ Логування подій
○ EntityRelation (інвентар, ефекти)
```

### Етап 4 — Простий VTT [складність: 6-7/10]

```
○ Scene, SceneEntity, SceneDecoration
○ Canvas / PixiJS базовий рендеринг
○ Переміщення Entity на карті
○ WebSocket real-time синхронізація
```

### Етап 5 — Повний VTT [складність: 7-8/10]

```
○ Fog of War
○ Line of Sight (raycasting)
○ Динамічне освітлення
○ Multiplayer (RBAC ролі)
○ Marketplace / Snapshots
```

---

## 18. Відкриті питання

Речі які ще не вирішені або вирішені частково:

| Питання | Статус |
|---|---|
| Як expire Active Effects (автоматично чи вручну) | Відкрито — поки вручну |
| Тригерні ефекти (on_turn_start) | Відкладено |
| Concentration механіка | Відкладено |
| FieldReference індекс залежностей | Відкладено |
| Відкіт Actions (Undo) | Відкладено |
| GameEvent лог повна структура | Частково |
| Multiplayer / WebSocket архітектура | Відкладено |
| Fog of War серверна фільтрація | Відкладено |
| Marketplace / Campaign Snapshot | Відкладено |
| Smart Mapping при імпорті | Відкладено |
| AoE Actions | Відкладено |

---

*Документ створено на основі архітектурної сесії. Версія актуальна на момент завершення Етапу 1 планування.*
