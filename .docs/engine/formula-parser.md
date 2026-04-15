# Formula Parser

## Синтаксис

### Контексти

```
@self    — entity який ініціює дію або "власник" формули
@owner   — entity який володіє предметом (в контексті Actions)
@target  — entity ціль (в контексті Actions)
@global  — змінні рівня кампанії (майбутнє)
```

### Посилання на трейт

```
@self.trait['instance-name'].field_key

// Приклади:
@self.trait['core-stats'].str
@self.trait['health'].hp
@self.trait['combat'].ac
@target.trait['health'].max_hp
```

### Вбудовані функції

```
FLOOR(x)           — округлення вниз
CEIL(x)            — округлення вгору
ABS(x)             — модуль числа
MAX(a, b)          — максимум
MIN(a, b)          — мінімум
ROLL(count, sides) — кидок кубика (тільки на сервері в Actions)
IF(condition, a, b) — умовний вираз
```

### Приклади формул

```
// STR модифікатор DnD
FLOOR((@self.trait['core-stats'].str - 10) / 2)

// Перевірка влучання
ROLL(1,20) + @self.trait['core-stats'].str_mod >= @target.trait['combat'].ac

// Навичка з профіцієнсі
@self.trait['core-stats'].str_mod + IF(
  @self.trait['skills'].athletics_prof,
  @self.trait['proficiency'].bonus,
  0
)

// Пасивна уважність
10 + @self.trait['skills'].perception_mod
```

---

## Де виконується

| Тип формули | Де рахується | Причина |
|---|---|---|
| Статичні (`formula` поля в values-v1) | **Фронтенд** | Швидко, реактивно, дані вже є в клієнті |
| Actions з `ROLL` | **Сервер** | Безпека, анти-чит |
| Actions що змінюють БД | **Сервер** | Цілісність даних |
| Actions з `@target` | **Сервер** | Fog of War (приховані дані цілі) |

---

## Порядок обчислення (топологічний)

Система будує граф залежностей і обчислює у правильному порядку:

```
str → str_mod → athletics_mod
wis → wis_mod → perception_mod → passive_perception
prof_bonus → athletics_mod
prof_bonus → perception_mod
```

Поле яке від нічого не залежить → рахується першим.
Поле яке залежить від інших → після них.

---

## Циклічні залежності

**Заборонені повністю.** В реальних RPG механіках циклів не існує — це завжди помилка дизайну.

```
❌ str_mod = FLOOR(str / 2) + combat_bonus
❌ combat_bonus = str_mod * 2
→ Цикл: str_mod → combat_bonus → str_mod
```

**Алгоритм:** При кожному збереженні формули:
1. Оновлюємо граф залежностей по всіх трейтах кампанії
2. Запускаємо DFS
3. Якщо цикл знайдено → не зберігаємо, показуємо де саме цикл

---

## Відображення формул в UI

**Режим редагування** (raw синтаксис):
```
FLOOR((@self.trait['core-stats'].str - 10) / 2)
```

**Режим перегляду** (людський):
```
FLOOR(( [Self: Core Stats: Strength] - 10) / 2)
```

- `[Self: Core Stats: Strength]` — бейдж з підсвіченим фоном
- При наведенні на бейдж — показує реальне значення `= 16`
- Broken посилання (поле видалено або перейменовано) → підсвічуються червоним

---

## FieldReference (відкладено)

Індекс всіх залежностей між формулами і полями — для блокування деструктивних змін.

```prisma
// Додати пізніше
model FieldReference {
  id               String @id
  sourceType       String // 'formula' | 'action'
  sourceId         String
  targetInstanceId String
  targetFieldKey   String
  @@index([targetInstanceId, targetFieldKey])
}
```

Поки що деструктивні зміни (видалення/перейменування поля) показують **попередження** але не блокуються.

---

## Два типи залежностей

**Compile-time** (перевіряються при збереженні формули):
```
athletics_mod = str_mod + bonus
→ залежить від str_mod і prof_bonus → будуємо граф → DFS
```

**Runtime** (перевіряються при виконанні Action):
```
@target.trait['health'].current_hp
→ якщо трейт не існує → Action падає з помилкою під час виконання
```

Залежності в Actions — це не граф compile-time, а передумова виконання.
