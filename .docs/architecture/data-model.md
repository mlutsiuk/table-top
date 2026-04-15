# Модель даних

## Ієрархія сутностей

```
Campaign
  ├── MechanicInstance[] (values-v1, sheet-v1, effects-v1)
  ├── Media[] (файли кампанії)
  ├── Entity[] (всі живі об'єкти)
  └── Folder (рекурсивна структура)
        └── Folder
              └── Asset
                    ├── AssetTrait[] (× кількість MechanicInstances)
                    ├── Action[]
                    └── Entity[] (екземпляри цього Asset)
                          ├── EntityTrait[]
                          └── EntityRelation[] (інвентар, ефекти, зв'язки)
```

---

## Asset vs Entity

| | Asset | Entity |
|---|---|---|
| **Роль** | Шаблон / Клас | Екземпляр / Об'єкт |
| **Дані** | Статичні (MaxHP, опис) | Динамічні (поточне HP) |
| **Кількість** | Один тип | Багато екземплярів |
| **Аналогія** | Клас "Goblin" | Конкретний гоблін у бою |

**Ключова перевага:** зміна MaxHP в Asset автоматично діє на всі Entity які не мають override — через Layered State Resolve.

## AssetTrait vs EntityTrait

```
AssetTrait [health-instance]:
  max_hp: 10        ← статичне, спільне для всіх екземплярів

EntityTrait [health-instance]:
  hp: 3             ← динамічне, унікальне для кожного Entity
```

EntityTrait зберігає **тільки те що відрізняється від дефолту** (Lazy Init). Якщо поле не знайдено в EntityTrait — береться `default` з конфігу MechanicInstance. Це вирішує проблему розсинхрону коли майстер додає нове поле після створення Entity.

---

## Prisma схема

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client-js"
}

generator json {
  provider  = "prisma-json-types-generator"
  namespace = "PrismaJson"
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

model User {
  id        String     @id @default(uuid())
  email     String     @unique
  name      String
  createdAt DateTime   @default(now()) @map("created_at")
  campaigns Campaign[]

  @@map("users")
}

model Campaign {
  id                String             @id @default(uuid())
  title             String
  status            CampaignStatus     @default(DRAFT)
  createdAt         DateTime           @default(now()) @map("created_at")
  masterId          String             @map("master_id")
  master            User               @relation(fields: [masterId], references: [id])
  folders           Folder[]
  assets            Asset[]
  mechanicInstances MechanicInstance[]
  entities          Entity[]
  media             Media[]

  @@map("campaigns")
}

model Media {
  id         String   @id @default(uuid())
  campaignId String   @map("campaign_id")
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  url        String   // URL від Uploadthing
  key        String   // ключ файлу в Uploadthing (для видалення)
  name       String   // оригінальна назва файлу
  type       String   // 'image' | 'document' | 'audio'
  size       Int      // розмір в байтах
  createdAt  DateTime @default(now()) @map("created_at")

  @@map("media")
}

model Folder {
  id         String   @id @default(uuid())
  title      String
  parentId   String?  @map("parent_id")
  parent     Folder?  @relation("SubFolders", fields: [parentId], references: [id])
  subFolders Folder[] @relation("SubFolders")
  campaignId String   @map("campaign_id")
  campaign   Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  assets     Asset[]

  @@map("folders")
}

model Asset {
  id          String       @id @default(uuid())
  title       String
  content     Json?        // TipTap JSON (вікі опис)
  coverId     String?      @map("cover_id") // → Media.id
  campaignId  String       @map("campaign_id")
  campaign    Campaign     @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  folderId    String       @map("folder_id")
  folder      Folder       @relation(fields: [folderId], references: [id], onDelete: Cascade)
  assetTraits AssetTrait[]
  entities    Entity[]
  actions     Action[]

  @@map("assets")
}

model MechanicInstance {
  id           String        @id @default(uuid())
  key          String        // 'values-v1' | 'sheet-v1' | 'effects-v1'
  name         String        // назва від майстра: 'core-stats', 'health', 'combat'
  /// [MechanicInstanceConfig]
  config       Json
  campaignId   String        @map("campaign_id")
  campaign     Campaign      @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  assetTraits  AssetTrait[]
  entityTraits EntityTrait[]

  @@unique([campaignId, name])
  @@map("mechanic_instances")
}

model AssetTrait {
  id                 String           @id @default(uuid())
  assetId            String           @map("asset_id")
  asset              Asset            @relation(fields: [assetId], references: [id], onDelete: Cascade)
  mechanicInstanceId String           @map("mechanic_instance_id")
  mechanicInstance   MechanicInstance @relation(fields: [mechanicInstanceId], references: [id], onDelete: Cascade)
  /// [AssetTraitData]
  data               Json

  @@unique([assetId, mechanicInstanceId])
  @@map("asset_traits")
}

model Entity {
  id            String           @id @default(uuid())
  assetId       String           @map("asset_id")
  asset         Asset            @relation(fields: [assetId], references: [id], onDelete: Cascade)
  campaignId    String           @map("campaign_id")
  campaign      Campaign         @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  entityTraits  EntityTrait[]
  relationsFrom EntityRelation[] @relation("RelationSource")
  relationsTo   EntityRelation[] @relation("RelationTarget")

  @@map("entities")
}

model EntityTrait {
  id                 String           @id @default(uuid())
  entityId           String           @map("entity_id")
  entity             Entity           @relation(fields: [entityId], references: [id], onDelete: Cascade)
  mechanicInstanceId String           @map("mechanic_instance_id")
  mechanicInstance   MechanicInstance @relation(fields: [mechanicInstanceId], references: [id], onDelete: Cascade)
  /// [EntityTraitData]
  data               Json             // зберігає ТІЛЬКИ відхилення від дефолту (Lazy Init)

  @@unique([entityId, mechanicInstanceId])
  @@map("entity_traits")
}

model EntityRelation {
  id       String  @id @default(uuid())
  sourceId String  @map("source_id")
  source   Entity  @relation("RelationSource", fields: [sourceId], references: [id], onDelete: Cascade)
  targetId String  @map("target_id")
  target   Entity  @relation("RelationTarget", fields: [targetId], references: [id], onDelete: Cascade)
  key      String  // визначає механіка: 'inventory' | 'active_effect' | 'equipped'
  /// [EntityRelationData]
  data     Json?

  @@index([sourceId, key])
  @@index([targetId, key])
  @@map("entity_relations")
}

model Action {
  id      String @id @default(uuid())
  assetId String @map("asset_id")
  asset   Asset  @relation(fields: [assetId], references: [id], onDelete: Cascade)
  title   String
  /// [ActionConfig]
  config  Json

  @@map("actions")
}
```

---

## Порядок міграцій

```bash
# Вже існує: User, Campaign, Folder, Asset (базові)
prisma migrate dev --name add_campaign_status    # + enum CampaignStatus + поле status
prisma migrate dev --name add_media              # + Media модель
prisma migrate dev --name add_mechanic_engine    # + MechanicInstance + AssetTrait
prisma migrate dev --name add_entity_system      # + Entity + EntityTrait + EntityRelation
prisma migrate dev --name add_actions            # + Action
```

---

## Майбутні таблиці (відкладено)

```prisma
// Відкладено — індекс залежностей між формулами
model FieldReference {
  id               String @id
  sourceType       String // 'formula' | 'action'
  sourceId         String
  targetInstanceId String
  targetFieldKey   String
  @@index([targetInstanceId, targetFieldKey])
}

// Відкладено — VTT (Етап 6)
// Scene, SceneEntity, SceneDecoration
```
