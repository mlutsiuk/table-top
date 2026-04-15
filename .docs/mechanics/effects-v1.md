# effects-v1 — Механіка активних ефектів

## Призначення

`effects-v1` — механіка для опису ефектів які модифікують values трейти. Ефект — це Asset з трейтом `effects-v1` який описує що і як змінює.

Детальніше про застосування ефектів: [`../engine/effects.md`](../engine/effects.md)

---

## AssetTrait конфіг (шаблон ефекту)

```typescript
type EffectsAssetTraitData = {
  modifications: Modification[]
  duration: Duration
  isConcentration: boolean
  description?: string
}
```

### Модифікації

```typescript
type Modification =
  | { operation: 'add',          field: string, value: number | string }
  | { operation: 'subtract',     field: string, value: number | string }
  | { operation: 'multiply',     field: string, value: number }
  | { operation: 'override',     field: string, value: number | string }
  | { operation: 'advantage',    field: string }
  | { operation: 'disadvantage', field: string }
  | { operation: 'immunity',     damageType: string }
  | { operation: 'resistance',   damageType: string }
```

`field` — у форматі `'instanceName.fieldKey'`, наприклад `'combat.ac'`, `'health.max_hp'`.

### Тривалість

```typescript
type Duration =
  | { type: 'permanent' }
  | { type: 'rounds', value: number }
  | { type: 'until_rest', rest: 'short' | 'long' }
  | { type: 'concentration' }
  | { type: 'until_condition', condition: string }
```

---

## EntityTrait (поточний стан ефекту)

```typescript
type EffectsEntityTraitData = {
  remainingRounds?: number  // для duration.type === 'rounds'
  appliedAt: string         // ISO timestamp
}
```

---

## Приклади AssetTrait конфігів

### Shield of Faith (+2 AC, concentration)
```json
{
  "modifications": [
    { "operation": "add", "field": "combat.ac", "value": 2 }
  ],
  "duration": { "type": "concentration" },
  "isConcentration": true,
  "description": "A shimmering field appears and surrounds the target."
}
```

### Rage (бонус до шкоди + стійкість, 10 раундів)
```json
{
  "modifications": [
    { "operation": "add", "field": "combat.damage_bonus", "value": 2 },
    { "operation": "resistance", "damageType": "physical" }
  ],
  "duration": { "type": "rounds", "value": 10 },
  "isConcentration": false,
  "description": "Channel primal fury."
}
```

### Bless (+1d4 до атак і рятівних кидків)
```json
{
  "modifications": [
    { "operation": "advantage", "field": "combat.attack_roll" },
    { "operation": "advantage", "field": "combat.saving_throw" }
  ],
  "duration": { "type": "concentration" },
  "isConcentration": true
}
```

---

## MVP (Етап 5)

Перша реалізація підтримує:
- `add`, `subtract`, `override` модифікації
- `permanent` і `rounds` тривалість
- Ручне зняття ефектів майстром

Відкладено: `multiply`, `advantage`, `disadvantage`, `immunity`, `resistance`, автоматичний expire, concentration, AoE.
