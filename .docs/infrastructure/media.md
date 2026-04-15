# Media система

## Концепція

Media — окрема сутність прив'язана до Campaign. Файли не зберігаються напряму в полях Asset, а завантажуються окремо і на них посилаються звідусіль.

**Чому не просто URL рядок в полі Asset:**
- Один файл може використовуватися в кількох місцях (обкладинка Asset, картинка в TipTap тексті, іконка Folder)
- Централізоване управління медіафайлами кампанії
- Можливість видаляти файл і оновлювати всі посилання
- Майбутня Media бібліотека в UI

---

## Prisma модель

```prisma
model Media {
  id         String   @id @default(uuid())
  campaignId String   @map("campaign_id")
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  url        String   // Public URL від Uploadthing (AWS S3)
  key        String   // Ключ файлу в Uploadthing (для видалення через API)
  name       String   // Оригінальна назва файлу
  type       String   // 'image' | 'document' | 'audio'
  size       Int      // Розмір в байтах
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("media")
}
```

---

## Uploadthing інтеграція

**Пакет:** `@uploadthing/nuxt`

**Чому Uploadthing (а не власний S3):**
- Офіційний Nuxt модуль, проста інтеграція
- Безкоштовний план достатній для розробки
- Капотом AWS S3 — при потребі можна перейти на власний S3/Cloudflare R2 замінивши тільки адаптер
- Логіка Media в БД залишається незмінною при міграції

### Потік завантаження

```
1. Користувач обирає файл в UI
2. Uploadthing завантажує файл на AWS S3
3. Uploadthing повертає { url, key }
4. Ми зберігаємо Media запис в БД: { campaignId, url, key, name, type, size }
5. Повертаємо Media.id клієнту
6. Клієнт використовує Media.id для прив'язки до Asset або вставки в TipTap
```

---

## Де використовується Media

| Місце | Поле | Тип |
|---|---|---|
| Asset обкладинка | `Asset.coverId → Media.id` | image |
| TipTap контент | `Media.url` через кастомний extension | image, document |
| Майбутнє: іконки Folder | `Folder.iconId → Media.id` | image |
| Майбутнє: картинки ефектів | `Asset.coverId → Media.id` | image |

---

## Видалення файлів

При видаленні Media запису → також видаляємо файл з Uploadthing через `Media.key`.

При видаленні Campaign → `onDelete: Cascade` видаляє всі Media записи → потрібно також очистити файли в Uploadthing (через webhook або окрему задачу).
