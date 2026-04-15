# Етапи розробки

> Оновлений план згідно планувальних сесій.
> Не реалізовуй речі з майбутніх етапів раніше часу.

---

## Поточний стан

**Вже реалізовано (до початку роботи по плану):**
- Google OAuth авторизація (JWT токени)
- Campaign CRUD (базовий)
- Folder структура (рекурсивна)
- Asset CRUD (базовий)

---

## Етап 1 — Вікі / Бібліотека [складність: 3/10]

**Мета:** Повноцінна вікі де можна вести бестіарій, описувати зброю, NPC з картинками.

```
○ Campaign CRUD (статуси є в БД але ігноруються в логіці)
○ Folder структура (рекурсивна, дерево в сайдбарі)
○ Asset CRUD
○ Media система + Uploadthing інтеграція
○ Asset редактор (TipTap вікі-редактор + головна картинка з Media)
○ Дерево Asset/Folder в сайдбарі
```

---

## Етап 2 — Механіки (тільки static) [складність: 4/10]

**Мета:** Статичні характеристики (Сила=16, MaxHP=45, AC=18).

```
○ MechanicInstance CRUD (values-v1, тільки number/text/boolean поля)
○ AssetTrait CRUD (підключення інстансу до Asset, заповнення значень)
○ Перегляд трейтів на Asset (auto-generated UI)
○ Без formula полів, без Entity
```

---

## Етап 3 — Entity + Dynamic + Формули [складність: 6/10]

**Мета:** Живі об'єкти з поточним станом, формули рахуються автоматично.

```
○ Entity CRUD (створення з Asset)
○ EntityTrait з Lazy Init
○ Layered State Resolve
○ formula поля (Formula Parser, DFS валідація циклів)
○ Граф залежностей (dev панель — опційно)
```

---

## Етап 4 — Sheet Builder [складність: 5/10]

**Мета:** Кастомний лист персонажа з реактивним оновленням.

```
○ sheet-v1 механіка
○ Figma Auto Layout концепція (ієрархія flex контейнерів)
○ Ноди: Value, Input, ProgressBar, Button, Formula, Container
○ Реактивне оновлення через WebSocket
○ Статуси кампанії DRAFT/ACTIVE (блокування механік)
○ Pre-flight check при DRAFT → ACTIVE
```

---

## Етап 5 — Actions + Effects [складність: 6/10]

**Мета:** Ігрові дії з кидками кубиків і активні ефекти.

```
○ Action конфіг на Asset
○ Блочний редактор Actions в UI
○ Виконання Actions на сервері (tRPC)
○ Логування подій (GameEvent)
○ EntityRelation (інвентар: key: 'inventory', key: 'equipped')
○ effects-v1 механіка
○ Active Effects через EntityRelation
```

---

## Етап 6 — VTT [складність: 7/10]

**Мета:** Базовий ігровий стіл з картою і фігурками.

```
○ Scene, SceneEntity моделі і логіка
○ Canvas / PixiJS базовий рендеринг
○ Переміщення Entity на карті
○ WebSocket real-time синхронізація
○ Multiplayer (RBAC ролі: Master, Player)
```

---

## Етап 7 — Wizard + Marketplace [складність: 7/10]

**Мета:** Покрокове створення персонажів і обмін кампаніями.

```
○ Wizard сутність і конфіг
○ UI для проходження Wizard (character creation flow)
○ UI для створення Wizard конфігу (builder)
○ Campaign Snapshot / Marketplace
```

---

## Порядок реалізації фіч в Етапі 1

Чіткий порядок:

1. Prisma міграції (всі таблиці зі схеми)
2. Campaign CRUD
3. Media система + Uploadthing
4. Folder + Asset дерево (сайдбар)
5. Asset редактор (TipTap + головна картинка)
6. MechanicInstance CRUD (values-v1, тільки static)
7. AssetTrait CRUD
8. Entity + EntityTrait
9. Формули (Formula Parser, DFS)
10. Sheet Builder
11. Actions
12. Effects
13. Wizard
