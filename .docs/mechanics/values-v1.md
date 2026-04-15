# values-v1 — Головна механіка

## Призначення

`values-v1` — єдина механіка для зберігання будь-яких значень. Покриває ~80% потреб RPG через три типи полів.

**Немає окремих механік Stats, Health, Combat** — всі вони реалізуються як різні MechanicInstance з `values-v1`.

---

## Типи полів

| type | kind | Де зберігається | Призначення |
|---|---|---|---|
| `number` | `static` | AssetTrait JSONB | Статична характеристика (STR=16, MaxHP=45) |
| `number` | `dynamic` | EntityTrait JSONB | Поточне значення (HP=23) |
| `text` | `static` | AssetTrait JSONB | Опис, клас, раса (статичне) |
| `text` | `dynamic` | EntityTrait JSONB | Стан, нотатки (змінюється) |
| `boolean` | `static` | AssetTrait JSONB | Властивість (proficiency = false) |
| `boolean` | `dynamic` | EntityTrait JSONB | Стан (концентрація = true) |
| `formula` | — | Тільки конфіг інстансу | Обчислюється на фронтенді, не зберігається |

---

## Приклади конфігів MechanicInstance для DnD 5e

### Інстанс `core-stats`
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

### Інстанс `health`
```json
{
  "fields": [
    { "key": "max_hp", "label": "Max HP", "type": "number", "kind": "static", "default": 1 },
    { "key": "hp",     "label": "Current HP", "type": "number", "kind": "dynamic", "default": 1 }
  ]
}
```

### Інстанс `combat`
```json
{
  "fields": [
    { "key": "ac",        "label": "Armor Class", "type": "number", "kind": "static", "default": 10 },
    { "key": "speed",     "label": "Speed", "type": "number", "kind": "static", "default": 30 },
    { "key": "initiative","label": "Initiative", "type": "formula", "formula": "@self.trait['core-stats'].dex_mod" }
  ]
}
```

### Інстанс `identity`
```json
{
  "fields": [
    { "key": "class",      "label": "Class", "type": "text", "kind": "static", "default": "" },
    { "key": "race",       "label": "Race", "type": "text", "kind": "static", "default": "" },
    { "key": "background", "label": "Background", "type": "text", "kind": "static", "default": "" },
    { "key": "level",      "label": "Level", "type": "number", "kind": "static", "default": 1 }
  ]
}
```

### Інстанс `proficiency`
```json
{
  "fields": [
    { "key": "bonus", "label": "Proficiency Bonus", "type": "number", "kind": "static", "default": 2 }
  ]
}
```

### Інстанс `skills`
```json
{
  "fields": [
    { "key": "athletics_prof", "label": "Athletics Proficiency", "type": "boolean", "kind": "static", "default": false },
    { "key": "athletics_mod",  "label": "Athletics", "type": "formula",
      "formula": "@self.trait['core-stats'].str_mod + IF(@self.trait['skills'].athletics_prof, @self.trait['proficiency'].bonus, 0)" },
    { "key": "perception_prof", "label": "Perception Proficiency", "type": "boolean", "kind": "static", "default": false },
    { "key": "perception_mod",  "label": "Perception", "type": "formula",
      "formula": "@self.trait['core-stats'].wis_mod + IF(@self.trait['skills'].perception_prof, @self.trait['proficiency'].bonus, 0)" },
    { "key": "passive_perception", "label": "Passive Perception", "type": "formula",
      "formula": "10 + @self.trait['skills'].perception_mod" }
  ]
}
```

---

## Правила валідації

- `key` — унікальний в межах одного інстансу (дублікати → помилка)
- `formula` поле не має `kind` і `default`
- Формули не мають циклічних залежностей (DFS перевірка при збереженні)
- `key` не може змінюватися після того як трейт прив'язаний до Asset (деструктивна операція)

---

## Етапи підключення механік (DnD 5e приклад)

**Етап 1** (Вікі — тільки static поля, без формул):
- `identity` — клас, раса, рівень
- `core-stats` — str, dex, con, int, wis, cha (без модифікаторів)
- `health` — max_hp
- `combat` — ac, speed
- `proficiency` — bonus

**Етап 2** (формули):
- `core-stats` + модифікатори (formula поля)
- `skills` — proficiency (boolean) + modifier (formula)
- `saving-throws` — аналогічно до skills

**Майбутнє** (колекції — потребує окремої механіки):
- `spell-slots`, `hit-dice`, `class-resources`
