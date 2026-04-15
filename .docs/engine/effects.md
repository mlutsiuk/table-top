# Active Effects

## Концепція: Ефект = Asset + Entity

Ефект — це такий самий Asset як і будь-який інший, але з трейтом `effects-v1`.
При застосуванні ефекту на Entity — створюється окремий Entity і EntityRelation.

```
Asset "Rage" (шаблон ефекту в бібліотеці)
  └── AssetTrait [effects-v1 instance]
        modifications: [
          { operation: 'add', field: 'combat.damage_bonus', value: 2 },
          { operation: 'resistance', damageType: 'physical' }
        ]
        duration: { type: 'rounds', value: 10 }
        isConcentration: false

Entity "Rage on Thorin" (конкретне застосування)
  └── EntityTrait [effects-v1 instance]
        remainingRounds: 8
        appliedAt: '2024-01-15T10:30:00Z'

EntityRelation:
  sourceId: Entity "Thorin"
  targetId: Entity "Rage on Thorin"
  key: 'active_effect'
  data: { appliedAt, appliedBy: 'thorin-entity-id' }
```

---

## Типи модифікацій

```typescript
type Modification =
  | { operation: 'add',         field: string, value: number | string }
  | { operation: 'subtract',    field: string, value: number | string }
  | { operation: 'multiply',    field: string, value: number }
  | { operation: 'override',    field: string, value: number | string }
  | { operation: 'advantage',   field: string }
  | { operation: 'disadvantage', field: string }
  | { operation: 'immunity',    damageType: string }
  | { operation: 'resistance',  damageType: string }
```

`field` — посилається на трейт і поле: `'health.max_hp'`, `'combat.ac'`.

---

## Типи тривалості

```typescript
type Duration =
  | { type: 'permanent' }
  | { type: 'rounds', value: number }
  | { type: 'until_rest', rest: 'short' | 'long' }
  | { type: 'concentration' }
  | { type: 'until_condition', condition: string }
```

---

## MVP (Етап 5 — що реалізується першим)

```
✓ Asset "ефект" з AssetTrait [effects-v1]
✓ Entity для кожного застосованого ефекту
✓ EntityRelation з key: 'active_effect'
✓ Тільки: add, subtract, override модифікації
✓ Тривалість: тільки permanent і rounds
✓ Майстер знімає ефекти вручну

Відкладено:
✗ Тригерні ефекти (on_turn_start, on_damage)
✗ Concentration відстеження (скидання при отриманні шкоди)
✗ AoE ефекти (застосування на кількох Entity)
✗ Автоматичний expire по раундах
```

---

## Як ефекти впливають на значення

Ефекти застосовуються на першому рівні Layered State Resolve. При запиті значення поля — система:

1. Знаходить всі `active_effect` EntityRelation для цього Entity
2. Збирає всі `modifications` з AssetTrait кожного ефекту
3. Фільтрує по `field` (який трейт і поле)
4. Агрегує: add складаються, override перезаписує, і т.д.
5. Застосовує до базового значення

Детальніше: [`layered-state-resolve.md`](./layered-state-resolve.md)
