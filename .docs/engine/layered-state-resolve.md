# Layered State Resolve

## Концепція

Не пошаровий прохід, а **рекурсія**: кожен вхід формули резолвиться тією самою процедурою
(ADR-015). Через це модель описується трьома кроками й не потребує окремих проходів.

```
resolve(поле):

  1. База
     formula → обчислити з входів, кожен через resolve()
     static  → EntityTrait → AssetTrait → default поля
     dynamic → EntityTrait → default поля        (шару асета немає)

  2. Ефекти поверх бази, у фіксованому порядку:
     multiply → add → upgrade/downgrade → override

  3. Значення. Назад нічого не записується.
```

**Чому dynamic не має шару асета:** асет динамічних полів не носить, вони існують лише на
сутності (ADR-017). Дефолт при цьому може бути виразом: `hp` стартує з `@health.max_hp`.

**Формульне поле можна брати ціллю ефекту**, включно з `override`. Конвеєр працює на читання, тож
коли ефект спадає, обчислене значення повертається саме. Але ефекти застосовуються **до** формул:
формула читає вже зрезолвлені входи.

**Значення ефекту заморожується в момент застосування**, а не рахується при кожному читанні —
інакше resolve перестав би бути локальним для однієї сутності.

---

## Приклад: AC персонажа

```
Asset "Fighter" має AC=15 в AssetTrait [combat instance]
Майстер вручну перезаписав +2 в EntityTrait (Entity Override)
Ефект "Shield of Faith" додає +2 (Active Effect)
Ефект "Bless" додає перевагу на кидки (Active Effect)

Результат AC: 15 (Asset) + 2 (Override) + 2 (Effect) = 19
```

> ⚠️ Active Effects агрегуються — якщо кілька ефектів модифікують одне поле, всі враховуються одночасно.

---

## Операції ефектів

Порядок застосування закритий і однаковий завжди, інакше два ефекти на одному полі дадуть різний
результат залежно від вибірки з бази: **multiply → add → upgrade/downgrade → override**.

| Операція | Поведінка при агрегації |
|---|---|
| `add` | Всі ефекти додаються: +2 + +3 = +5 |
| `subtract` | Всі ефекти віднімаються |
| `multiply` | Множники застосовуються послідовно |
| `override` | Останній/найвищий пріоритет перезаписує |
| `advantage` | Якщо хоча б один ефект дає перевагу → перевага |
| `disadvantage` | Перевага і недолік скасовують одне одного |
| `immunity` | Ігнорує шкоду певного типу |
| `resistance` | Ділить шкоду певного типу на 2 |

---

## Lazy Init і Layered State Resolve

EntityTrait зберігає тільки відхилення від дефолту. Тому при resolve:

```typescript
function resolve(traitKey: string, fieldKey: string, entity: Entity): unknown {
  const config = getTraitConfig(traitKey)
  const field = config.fields.find(f => f.key === fieldKey)

  // 1. База
  let base
  if (field.type === 'formula') {
    // кожен вхід проходить через цей самий resolve()
    base = evaluate(field.formula, entity)
  }
  else {
    const entityTrait = entity.entityTraits.find(t => t.traitDef.key === traitKey)
    const assetTrait = entity.asset.assetTraits.find(t => t.traitDef.key === traitKey)

    base = field.kind === 'dynamic'
      ? entityTrait?.data[fieldKey] ?? defaultOf(field, entity)
      : entityTrait?.data[fieldKey] ?? assetTrait?.data[fieldKey] ?? defaultOf(field, entity)
  }

  // 2. Ефекти поверх бази, у фіксованому порядку
  const mods = activeEffectsOn(entity)
    .flatMap(e => e.modifications.filter(m => m.field === `${traitKey}.${fieldKey}`))

  return applyModifications(base, mods)   // multiply → add → upgrade/downgrade → override
}

```

---

## Formula поля і Layered State Resolve

Formula поля (`kind: 'formula'`) **не зберігаються** ні в AssetTrait ні в EntityTrait. Вони завжди обчислюються на фронтенді з поточних значень через Formula Parser.

Формула сама по собі є Layered State Resolve — вона посилається на інші поля які вже розрезолвлені.
