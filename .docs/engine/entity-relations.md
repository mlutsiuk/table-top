# EntityRelation система

## Концепція

EntityRelation — це **механізм двигуна** (не механіка кампанії) для зв'язків між Entity.

- `key` — рядок який визначає тип зв'язку (не enum в БД, рядок)
- `data` — JSONB, формат якого визначає механіка яка використовує цей зв'язок
- Механіки використовують EntityRelation API, але самі не є EntityRelation

---

## Engine API

```typescript
engine.relations.create({ sourceId, targetId, key, data })
engine.relations.getBySource({ sourceId, key })
engine.relations.getByTarget({ targetId, key })
engine.relations.getBoth({ entityId, key })  // для симетричних зв'язків
engine.relations.update({ id, data })
engine.relations.delete({ id })
```

---

## TypeScript типізація через Registry

```typescript
declare module '@engine/relations' {
  interface RelationRegistry {
    inventory:     { quantity?: number }
    active_effect: { appliedAt: Date, appliedBy: string }
    equipped:      { slot: string }
    companion:     { bond?: string }
  }
}

// TypeScript знає тип data для кожного key
engine.relations.create<'inventory'>({
  sourceId: entityId,
  targetId: itemEntityId,
  key: 'inventory',
  data: { quantity: 1 }  // TS перевіряє
})
```

---

## Стандартні key (визначені в двигуні)

| key | Опис | data |
|---|---|---|
| `inventory` | Предмет в інвентарі | `{}` |
| `equipped` | Предмет екіпірований | `{ slot: string }` |
| `active_effect` | Активний ефект на Entity | `{ appliedAt: Date, appliedBy: string }` |

Інші key — механіки або майстер визначають самостійно.

---

## Інвентар через EntityRelation

```typescript
// Предмет в інвентарі
EntityRelation {
  sourceId: characterEntityId,
  targetId: swordEntityId,
  key: 'inventory',
  data: {}
}

// Предмет екіпірований
EntityRelation {
  sourceId: characterEntityId,
  targetId: swordEntityId,
  key: 'equipped',
  data: { slot: 'main_hand' }
}
```

**Правило:** 3 мечі = 3 окремих Entity. Стакінг тільки візуальний в UI.

**Lazy loading:** EntityTrait предметів завантажується тільки коли відкритий інвентар.

```typescript
// Візуальне групування в UI (не в БД)
function groupInventory(items: Entity[]) {
  return items.reduce((acc, item) => {
    const isIdentical = isEmpty(item.overrides)
    const key = isIdentical ? item.assetId : item.id
    if (!acc[key]) acc[key] = { item, count: 0 }
    acc[key].count++
    return acc
  }, {})
}
```

---

## Симетричні зв'язки

Якщо зв'язок симетричний — механіка сама читає з обох сторін:

```typescript
// Наприклад: союзники
getAllies(entityId: string) {
  const [fromSource, fromTarget] = await Promise.all([
    engine.relations.getBySource({ sourceId: entityId, key: 'ally' }),
    engine.relations.getByTarget({ targetId: entityId, key: 'ally' }),
  ])
  return [...fromSource, ...fromTarget]
}
```

В БД два індекси для ефективного пошуку в обох напрямках:
```
@@index([sourceId, key])
@@index([targetId, key])
```
