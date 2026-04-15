# TableTop Engine — Документація для розробника / AI агента

> Читай цей файл першим. Він пояснює де що знаходиться і з чого починати.

## З чого починати

Якщо ти новий розробник або AI агент який щойно відкрив цей проект:

1. **[`architecture/terminology.md`](./architecture/terminology.md)** — спочатку сюди. Глосарій термінів. Без цього решта не зрозуміла.
2. **[`architecture/overview.md`](./architecture/overview.md)** — місія, стек, рівні системи.
3. **[`architecture/decisions.md`](./architecture/decisions.md)** — ключові архітектурні рішення і чому саме так. Читай перед тим як щось змінювати.
4. **[`roadmap/stages.md`](./roadmap/stages.md)** — що вже є, що в роботі, що відкладено. Допомагає не реалізовувати те що ще не потрібно.

---

## Структура документації

```
.docs/
├── README.md                        ← ти тут
│
├── architecture/
│   ├── overview.md                  ← місія, стек, рівні системи (Engine/Mechanic/Campaign/Runtime)
│   ├── data-model.md                ← Prisma схема, ієрархія Campaign→Asset→Entity
│   ├── terminology.md               ← глосарій: що як називається і що НЕ використовувати
│   └── decisions.md                 ← ADR: чому саме такі рішення прийняті
│
├── engine/
│   ├── mechanic-system.md           ← як оголошувати Mechanic, MechanicRegistry, хуки
│   ├── layered-state-resolve.md     ← пріоритети: Effect → Override → Asset → Default
│   ├── formula-parser.md            ← синтаксис формул, де рахується, DFS, граф залежностей
│   ├── entity-relations.md          ← EntityRelation API, інвентар, симетричні зв'язки
│   ├── actions.md                   ← ActionConfig структура, методи механік, приклади
│   └── effects.md                   ← Active Effects через EntityRelation, types
│
├── mechanics/
│   ├── values-v1.md                 ← головна механіка: static/dynamic/formula поля
│   ├── sheet-v1.md                  ← Sheet Builder: Figma Auto Layout концепція, ноди
│   └── effects-v1.md                ← структура модифікацій і тривалості
│
├── infrastructure/
│   ├── media.md                     ← Media сутність, Uploadthing інтеграція
│   └── campaign-status.md           ← DRAFT/ACTIVE/ARCHIVED, pre-flight check
│
└── roadmap/
    ├── stages.md                    ← етапи 1-7 з поточним статусом і результатами
    └── open-questions.md            ← відкриті питання і відкладені рішення
```

---

## Ключові принципи проекту (коротко)

- **Data-Driven:** ігрова логіка — це дані, не код. Майстер налаштовує через UI.
- **Asset = клас, Entity = об'єкт.** Asset — шаблон. Entity — живий екземпляр.
- **Mechanic — плагін.** `values-v1` покриває ~80% потреб RPG через три типи полів.
- **EntityRelation — механізм движка.** Інвентар, ефекти, спорядження — все через нього.
- **Статуси кампанії поки ігноруються** — реалізуємо після Етапу 3.

## Поточний стан розробки

**Етап 1** (Вікі/Бібліотека) — в процесі.
Деталі: [`roadmap/stages.md`](./roadmap/stages.md)
