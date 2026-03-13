# 🔐 Повна концепція системи аутентифікації, сесій та аудит-логів

## 🧱 Стек технологій
**Nuxt + tRPC + Prisma + MongoDB**  
Мета: побудувати безпечну, керовану й масштабовану систему аутентифікації з короткоживучими access-токенами, ротацією refresh-токенів, серверними сесіями та audit-log для безпеки.

---

## 1. Ролі токенів
### Access-токен (JWT)
- Використовується для доступу до API через `Authorization: Bearer`.
- Короткий термін життя: **5–15 хв**.
- Підписується секретом або приватним ключем.
- Не зберігається в localStorage/sessionStorage, **лише в пам'яті**.

### Refresh-токен (Opaque)
- Рандомний унікальний ідентифікатор (UUID або 256-біт entropy).
- Зберігається в **HttpOnly+Secure cookie**.
- Використовується для оновлення access-токена, має тривалість **до 30 днів**.
- Не є JWT — сервер зберігає його стан у БД (allowlist).

---

## 2. Зберігання токенів
- **Access-токен** — у пам’яті (Pinia/composable).
- **Refresh-токен** — у cookie:
  - `HttpOnly; Secure; SameSite=Strict або Lax`
  - `Path=/auth/refresh`
  - префікс `__Host-` (додаткова безпека).

---

## 3. Модель бази даних (MongoDB через Prisma)

### Колекція `users`
| Поле | Тип | Опис |
|------|------|------|
| id | string | Ідентифікатор користувача |
| email | string | Унікальний email |
| passwordHash | string | Хеш пароля |
| tokenVersion | number | Версія токенів (для revoke all) |
| createdAt | Date | Дата створення |

### Колекція `sessions`
| Поле | Тип | Опис |
|------|------|------|
| id | string | Ідентифікатор сесії |
| userId | string | Посилання на користувача |
| device | string | Інформація про пристрій |
| ip | string | Усічений IP |
| userAgent | string | User-Agent |
| status | enum | active, inactive, revoked, expired |
| createdAt | Date | Дата створення |
| lastUsedAt | Date | Остання активність |
| maxLifetimeAt | Date | Максимальний термін дії |

### Колекція `refreshTokens`
| Поле | Тип | Опис |
|------|------|------|
| id (jti) | string | Унікальний ідентифікатор токена |
| sessionId | string | Прив’язка до сесії |
| userId | string | Користувач |
| issuedAt | Date | Коли видано |
| expiresAt | Date | Коли протухає |
| status | enum | active, used, revoked |
| replacedBy | string | Новий jti (для ротації) |

### Колекція `auditLog`
| Поле | Тип | Опис |
|------|------|------|
| _id | string | Унікальний запис |
| ts | Date | Час події |
| type | string | Ключ події (auth.login, auth.logout...) |
| version | number | Версія схеми |
| user_id | string | Користувач |
| session_id | string | Сесія |
| ip_truncated | string | Усічений IP |
| ua | string | User-Agent |
| source | string | Джерело |
| metadata | object | Дані події |
| kid | string | Ідентифікатор HMAC ключа |
| token_fp | string | HMAC-хеш токена |

---

## 4. Потоки аутентифікації

### Login
1. Користувач надсилає email+пароль.
2. Сервер перевіряє → створює `session`.
3. Видає `refresh` (cookie) + `access` (JSON).
4. Лог: `auth.login_success`.

### Refresh
1. Клієнт викликає `/auth/refresh` (cookie додається автоматично).
2. Сервер перевіряє токен → ротує → створює новий.
3. Старий позначається `used` або `revoked`.
4. Видається новий access і новий refresh-cookie.
5. Лог: `auth.refresh_rotated`.

### Logout
1. `POST /auth/logout` — видаляє refresh-токени сесії.
2. `session.status = revoked`.
3. Очищає cookie.
4. Лог: `auth.logout`.

### Реанімація сесії
- Якщо refresh протух, але є `sid` → показати екран “увійти знову”.
- Після підтвердження — новий refresh, той самий sessionId.

---

## 5. Audit Log

### Призначення
- Безпека, аналітика, розслідування інцидентів.
- Лише **append-only** — події не редагуються.

### Приклади подій
- `auth.login_success`, `auth.login_failed`, `auth.refresh_rotated`, `auth.logout`, `token.reuse_detected`, `session.resumed`.

### Зміст запису
- `type`, `version`, `user_id`, `session_id`, `ip_truncated`, `ua`, `metadata`, `kid`, `token_fp`.

### Еволюція
- Нові схеми → підвищення `version`.
- Старі події лишаються валідними.

---

## 6. HMAC-хешування токенів

### Чому не SHA256
- SHA256 без секрету можна перевірити будь-кому.
- HMAC додає секрет, тож тільки сервер може порівняти токени.

### Як працює
- `fingerprint = HMAC_SHA256(secret, token)`.
- У логах зберігаємо `fingerprint` + `kid`.

### Ротація ключів
- Новий ключ кожні 30–90 днів.
- Старі ключі зберігаються до закінчення ретеншну логів.
- Кожен запис має `kid`.

---

## 7. Денормалізація
- `user_id` і `session_id` зберігаються в кожному записі.
- Це дозволяє легко фільтрувати без додаткових зв’язків.
- Подія самодостатня, навіть якщо сесія видалена.

---

## 8. Безпека
- HTTPS, `Secure` cookies.
- CSP + XSS-захист.
- Rate limit для `/auth/*`.
- Origin/Referer перевірки (CSRF).
- Анонімізація IP (/24 або /48).

---

## 9. Політика зберігання (ретеншн)
| Дані | Період | Дії |
|------|---------|-----|
| Access-токени | 5–15 хв | Автоматично протухають |
| Refresh-токени | 30 днів | TTL + видалення |
| Сесії | 30–90 днів | Архівація або анонімізація |
| Audit Log | 90 днів (звичайні), 1 рік (інциденти) | TTL або архів |
| HMAC ключі | = ретеншн логів | Безпечне зберігання в KMS |

---

## 10. Архітектура з tRPC і Nuxt

### Клієнт (Nuxt)
- Access-токен зберігається у пам'яті (Pinia/composable).
- tRPC link додає `Authorization` header.
- На `401` → викликає `/auth/refresh` (cookie автоматично додається).
- SSR не виконує refresh.

### Сервер (tRPC/Nitro)
- `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/resume` — звичайні HTTP-роути.
- tRPC мідлварі для перевірки JWT, ролей, скоупів.
- Видає `Set-Cookie` для refresh.

---

## 11. Висновок

- **Access-токен**: короткий JWT, лише в пам’яті.
- **Refresh-токен**: opaque random, у HttpOnly cookie, з ротацією.
- **Session ID**: постійний ідентифікатор пристрою.
- **Audit Log**: централізований журнал дій з версіями схем і HMAC-відбитками токенів.
- **MongoDB + Prisma**: колекції `users`, `sessions`, `refreshTokens`, `auditLog` з TTL-індексами.
- **tRPC + Nuxt**: працюють через HTTP, cookie для refresh і Bearer access.
- **Безпека**: HTTPS, CSRF, CSP, rate limits, HMAC, ротація ключів, ретеншн.

---

✅ **Підсумок:**  
Ця система дає повний контроль над аутентифікацією, відновленням, керуванням пристроями, історією подій і аналітикою безпеки.  
Короткі access-токени — безпечні, refresh opaque — керовані, а audit-log — прозорий і розширюваний.