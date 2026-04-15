# Layered State Resolve

## Концепція

При запиті будь-якого значення параметра Entity — система проходить рівні від найвищого пріоритету до найнижчого і повертає перше знайдене (або агрегує, для ефектів).

```
Пріоритет (від найвищого):

1. Active Effects    ← EntityRelation з key: 'active_effect'
                       модифікації з AssetTrait ефект-Entity

2. Entity Override   ← EntityTrait (ручний перезапис майстром)

3. Asset Static      ← AssetTrait (значення шаблону)

4. Mechanic Default  ← конфіг MechanicInstance (default поля)
```

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
function resolveField(instanceName: string, fieldKey: string, entity: Entity): unknown {
  // 1. Перевіряємо Active Effects
  const effects = getActiveEffects(entity)
  const effectMods = effects.flatMap(e => e.modifications.filter(m => m.field === `${instanceName}.${fieldKey}`))

  // 2. Базове значення
  const entityTrait = entity.entityTraits.find(t => t.mechanicInstance.name === instanceName)
  const assetTrait = entity.asset.assetTraits.find(t => t.mechanicInstance.name === instanceName)
  const instanceConfig = getInstanceConfig(instanceName)
  const field = instanceConfig.fields.find(f => f.key === fieldKey)

  let baseValue =
    entityTrait?.data[fieldKey] ??     // Entity Override (якщо є)
    assetTrait?.data[fieldKey] ??      // Asset Static (якщо є)
    field?.default                     // Mechanic Default

  // 3. Застосовуємо ефекти
  return applyModifications(baseValue, effectMods)
}
```

---

## Formula поля і Layered State Resolve

Formula поля (`kind: 'formula'`) **не зберігаються** ні в AssetTrait ні в EntityTrait. Вони завжди обчислюються на фронтенді з поточних значень через Formula Parser.

Формула сама по собі є Layered State Resolve — вона посилається на інші поля які вже розрезолвлені.
