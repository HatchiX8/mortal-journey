# 凡人・遨遊天地：第一階段 MVP API 文件（API Doc Context 版）

## 文件來源

- 類型與位置：
  - Notion：[凡人・遨遊天地](https://app.notion.com/p/3b460fc2bcd780548acaccf5d804affe)
  - Notion：[8/10 MVP 會議記錄](https://app.notion.com/p/3b560fc2bcd780799cfdedefe57f8b30)
  - Notion：[API 溝通文件資料庫](https://app.notion.com/p/5ac60fc2bcd78299878501d36e1bfd67)
  - Miro：[遊歷線稿](https://miro.com/app/board/uXjVH0TP-KI=/?moveToWidget=3458764680187424134)
  - Miro：[新戰鬥線稿](https://miro.com/app/board/uXjVH0TP-KI=/?moveToWidget=3458764681985903008)
  - Miro：[閉關線稿](https://miro.com/app/board/uXjVH0TP-KI=/?moveToWidget=3458764681349488435)
  - Miro：[資料表 Schema](https://miro.com/app/board/uXjVH0TP-KI=/?moveToWidget=3458764681362140426)
  - Repository：`packages/contracts`、`apps/server` 與既有 `docs/api/mvp-api-spec.md`
- 文件版本或更新資訊：
  - Notion 專案頁讀取版本：2026-09-01 06:48 UTC。
  - 8/10 會議頁最後更新：2026-08-13，早於新版使用者故事；衝突時以新版使用者故事及本次使用者決策為準。
  - Miro 未提供正式版本號；本文件以目前讀取到的指定 frame/item 為準。
  - 本文件狀態：`Draft v0.2`，尚未建立至 Notion，也尚未實作成 OpenAPI／Zod contract。
- 適用範圍：第一階段 MVP 的角色、儲物袋、固定劇情遊歷、JSON 模擬戰鬥、閉關、療傷與練氣期小境界突破。

## 證據與決策標記

| 標記          | 定義                                      |
| ------------- | ----------------------------------------- |
| 已確認需求    | Notion、Miro 或使用者明確決策已有依據     |
| 本次 Contract | 為滿足已確認需求而在本文件定義的 API 規格 |
| 未確認        | 來源未定義，實作前仍需產品或技術確認      |

本文件中的 Method、Path、DTO 欄位、nullable 與 HTTP status，除非特別註明，屬於「本次 Contract」。範例值只用來說明格式，不代表固定遊戲數值。

## API Contract 摘要

| 編號    | Method | Path                                        | 狀態          | 已確認需求                           |
| ------- | ------ | ------------------------------------------- | ------------- | ------------------------------------ |
| CHR-001 | GET    | `/api/v1/characters/me`                     | 本次 Contract | 顯示角色卡                           |
| INV-001 | GET    | `/api/v1/inventory`                         | 本次 Contract | 查看儲物袋與物品說明                 |
| ADV-001 | GET    | `/api/v1/adventure/current`                 | 本次 Contract | 顯示固定劇情、場景與預設行動         |
| ADV-002 | POST   | `/api/v1/adventure/actions`                 | 本次 Contract | 執行預設或文字行動並推進劇情         |
| BTL-001 | GET    | `/api/v1/battles/{battleId}`                | 本次 Contract | 顯示敵我狀態、環境與戰鬥內容         |
| BTL-002 | POST   | `/api/v1/battles/{battleId}/turns`          | 本次 Contract | 攻擊、使用物品、自訂行動與戰利品結算 |
| CUL-001 | GET    | `/api/v1/cultivation`                       | 本次 Contract | 顯示修為、資源、預估與突破提示       |
| CUL-002 | POST   | `/api/v1/cultivation/previews`              | 本次 Contract | 閉關前試算與有效性檢查               |
| CUL-003 | POST   | `/api/v1/cultivation/sessions`              | 本次 Contract | 執行修煉／療傷並推進世界時間         |
| CUL-004 | POST   | `/api/v1/cultivation/breakthrough-attempts` | 本次 Contract | 進行 Lv4 MAX → Lv5 小境界突破        |

## 共用 Contract

### 環境與版本

| 項目              | Contract                                  |
| ----------------- | ----------------------------------------- |
| Base Path         | `/api/v1`                                 |
| Content Type      | `application/json`                        |
| ID                | UUID string                               |
| 系統時間          | ISO 8601 UTC                              |
| 世界時間          | `WorldTime` object                        |
| Response envelope | 不使用 envelope，直接回傳 response object |

### Authentication／Headers

| Header                                | 必填 | 適用 API                  | 說明                                             |
| ------------------------------------- | ---- | ------------------------- | ------------------------------------------------ |
| `Authorization: Bearer <accessToken>` | 是   | 全部                      | JWT Bearer 為本次 Contract；實際登入流程尚未確認 |
| `Content-Type: application/json`      | 是   | POST                      | Request body 格式                                |
| `Idempotency-Key`                     | 是   | BTL-002、CUL-003、CUL-004 | 前端每次新操作產生 UUID，重送沿用同一值          |

### 共用錯誤 Response

Repository 目前的 `ApiErrorSchema` 只定義 `message: string`，因此本文件延續該格式，不自行加入尚未實作的 `code` 或 `details`。

```json
{
  "message": "目前遊戲狀態已更新，請重新載入後再操作。"
}
```

### HTTP Status 語意

| Status                      | 語意                                               | 前端預期處理                     |
| --------------------------- | -------------------------------------------------- | -------------------------------- |
| `200 OK`                    | 查詢、遊歷行動或試算成功                           | 更新畫面資料                     |
| `201 Created`               | 回合、閉關 session 或突破 attempt 已建立並完成結算 | 以 response 更新狀態，不自行重算 |
| `400 Bad Request`           | JSON、型別、required、UUID 或 enum 錯誤            | 顯示輸入錯誤；不自動重送         |
| `401 Unauthorized`          | 未登入、token 無效或過期                           | 清除登入狀態並導向登入           |
| `404 Not Found`             | 資源不存在或不屬於使用者                           | 返回安全頁面並重新載入           |
| `409 Conflict`              | `stateVersion` 過期、狀態不允許或重複衝突          | 重新 GET 最新狀態後再操作        |
| `422 Unprocessable Entity`  | 格式正確但不符合遊戲規則                           | 顯示 `message`，保留目前畫面     |
| `500 Internal Server Error` | 未預期錯誤                                         | 顯示通用錯誤，不顯示內部例外     |
| `502 Bad Gateway`           | Battle Provider 輸出不符合 contract                | 戰鬥狀態不得改變；允許稍後重試   |
| `503 Service Unavailable`   | 未來 LLM Provider 暫時不可用                       | 戰鬥狀態不得改變；延遲重試       |

### State Version

- 所有會修改遊戲狀態的 body 都帶 `stateVersion: integer`。
- 成功 response 回傳新的 `stateVersion`。
- 版本衝突回傳 `409`，後端不得部分寫入。

### WorldTime

| 欄位     | 型別    | Nullable | 說明                                   |
| -------- | ------- | -------- | -------------------------------------- |
| `year`   | integer | 否       | 大於等於 1                             |
| `season` | enum    | 否       | `SPRING`、`SUMMER`、`AUTUMN`、`WINTER` |
| `day`    | integer | 否       | 遊戲季節內日數                         |

```json
{
  "year": 1,
  "season": "SPRING",
  "day": 12
}
```

### CharacterSummary

依使用者本次對話決策，永久角色戰鬥屬性收斂為攻擊、法術威力、防禦、遁速與神識；命中、閃避、會心與固定減傷率改由功法、效果及戰鬥上下文表達。此決策與 Notion 尚未更新的舊角色卡欄位存在差異。

| 欄位                     | 型別        | Nullable | 說明                      |
| ------------------------ | ----------- | -------- | ------------------------- |
| `characterId`            | UUID string | 否       | 角色 ID                   |
| `name`                   | string      | 否       | 1～50 字                  |
| `level`                  | integer     | 否       | 修煉層級                  |
| `realm`                  | string      | 否       | 顯示用境界名稱            |
| `cultivationExp`         | integer     | 否       | 當層目前修為              |
| `nextLevelExp`           | integer     | 否       | 當層修滿所需修為          |
| `currentHp`／`maxHp`     | integer     | 否       | 氣血，`0 ≤ current ≤ max` |
| `currentMana`／`maxMana` | integer     | 否       | 法力，`0 ≤ current ≤ max` |
| `baseAttack`             | integer     | 否       | 基礎攻擊                  |
| `baseSpellPower`         | integer     | 否       | 基礎法術威力              |
| `baseDefense`            | integer     | 否       | 基礎防禦；取代固定減傷率  |
| `baseSpeed`              | integer     | 否       | 基礎遁速                  |
| `spiritualSense`         | integer     | 否       | 神識                      |
| `pillToxicity`           | integer     | 否       | 丹毒，大於等於 0          |
| `ageMonths`              | integer     | 否       | 角色月齡                  |
| `spiritualRootRevealed`  | boolean     | 否       | 靈根是否已揭露            |

---

## CHR-001｜取得目前角色資料

### Method／Path

```http
GET /api/v1/characters/me
```

### Authentication／Headers

- `Authorization`：必填。

### Request

無 Path、Query、Body。

### Success Response

```http
200 OK
```

| 欄位           | 型別             | Nullable | 說明         |
| -------------- | ---------------- | -------- | ------------ |
| `character`    | CharacterSummary | 否       | 完整角色卡   |
| `stateVersion` | integer          | 否       | 目前狀態版本 |

```json
{
  "character": {
    "characterId": "8df3127c-6f77-4d21-b672-357b4d63f93e",
    "name": "韓立",
    "level": 3,
    "realm": "練氣三層",
    "cultivationExp": 620,
    "nextLevelExp": 900,
    "currentHp": 86,
    "maxHp": 100,
    "currentMana": 42,
    "maxMana": 60,
    "baseAttack": 18,
    "baseSpellPower": 24,
    "baseDefense": 12,
    "baseSpeed": 31,
    "spiritualSense": 8,
    "pillToxicity": 0,
    "ageMonths": 216,
    "spiritualRootRevealed": false
  },
  "stateVersion": 4
}
```

### Error Response

| Status | 情境                |
| ------ | ------------------- |
| `401`  | 未登入或 token 過期 |
| `404`  | 使用者尚未建立角色  |
| `500`  | 伺服器錯誤          |

### 商業規則與相容性

- 第一階段不可回傳未揭露的實際靈根內容。
- Notion 尚列出命中、閃避、會心等舊欄位；本文件依使用者最新決策移除，建立 Notion 文件時需同步更新角色卡需求。

---

## INV-001｜取得角色儲物袋

### Method／Path

```http
GET /api/v1/inventory
```

### Authentication／Headers

- `Authorization`：必填。

### Request

| Query           | 型別 | 必填 | 預設 | 說明                                                  |
| --------------- | ---- | ---- | ---- | ----------------------------------------------------- |
| `category`      | enum | 否   | 無   | `PILL`、`SPIRIT_STONE`、`MATERIAL`、`WEAPON`、`OTHER` |
| `usableContext` | enum | 否   | 無   | `ADVENTURE`、`BATTLE`、`CULTIVATION`、`HEALING`       |

### Success Response

```http
200 OK
```

| 欄位                         | 型別            | Nullable | 說明                 |
| ---------------------------- | --------------- | -------- | -------------------- |
| `containers`                 | array           | 否       | 可為空陣列           |
| `containers[].containerId`   | UUID string     | 否       | 儲物袋 ID            |
| `containers[].name`          | string          | 否       | 顯示名稱             |
| `containers[].grade`         | enum            | 否       | `LOW`、`MID`、`HIGH` |
| `containers[].capacitySlots` | integer         | 否       | 容量                 |
| `containers[].usedSlots`     | integer         | 否       | 已使用格數           |
| `containers[].slotNo`        | integer 或 null | 是       | 未裝備時為 null      |
| `containers[].items`         | array           | 否       | 物品清單，可為空     |
| `items[].inventoryItemId`    | UUID string     | 否       | 背包項目 ID          |
| `items[].itemCode`           | string          | 否       | 後端物品代碼         |
| `items[].name`               | string          | 否       | 物品名稱             |
| `items[].category`           | enum            | 否       | 物品分類             |
| `items[].quantity`           | integer         | 否       | 大於 0               |
| `items[].description`        | string          | 否       | 物品說明             |
| `items[].usableContexts`     | enum[]          | 否       | 可用情境             |
| `items[].effects`            | array           | 否       | 顯示用效果，可為空   |
| `stateVersion`               | integer         | 否       | 目前狀態版本         |

### Error Response

| Status | 情境                |
| ------ | ------------------- |
| `400`  | Query enum 不合法   |
| `401`  | 未登入或 token 過期 |
| `404`  | 角色不存在          |
| `500`  | 伺服器錯誤          |

### 商業規則與相容性

- 物品列表直接回傳說明，MVP 不另建 item detail API。
- 篩選只影響回傳內容，不得改變背包狀態。

---

## ADV-001｜取得目前遊歷劇情

### Method／Path

```http
GET /api/v1/adventure/current
```

### Authentication／Headers

- `Authorization`：必填。

### Request

無 Path、Query、Body。

### Success Response

```http
200 OK
```

| 欄位                            | 型別           | Nullable | 說明                 |
| ------------------------------- | -------------- | -------- | -------------------- |
| `storyCode`                     | string         | 否       | 固定劇本代碼         |
| `currentNodeCode`               | string         | 否       | 當前節點代碼         |
| `chapterTitle`                  | string         | 否       | 章節標題             |
| `sceneTitle`                    | string         | 否       | 場景標題             |
| `narrative`                     | string         | 否       | 當前敘事             |
| `worldTime`                     | WorldTime      | 否       | 世界時間             |
| `location.locationCode`         | string         | 否       | 地點代碼             |
| `location.name`                 | string         | 否       | 地點名稱             |
| `scene.imageCode`               | string 或 null | 是       | 無圖片時為 null      |
| `scene.characterName`           | string 或 null | 是       | 無人物時為 null      |
| `scene.interactions`            | array          | 否       | 可互動點，可為空     |
| `availableActions`              | array          | 否       | 當前允許行動，可為空 |
| `availableActions[].actionCode` | string         | 否       | 行動代碼             |
| `availableActions[].label`      | string         | 否       | 前端顯示文字         |
| `availableActions[].inputMode`  | enum           | 否       | MVP 為 `PRESET`      |
| `character`                     | object         | 否       | 畫面所需角色摘要     |
| `stateVersion`                  | integer        | 否       | 目前狀態版本         |

### Error Response

| Status | 情境                               |
| ------ | ---------------------------------- |
| `401`  | 未登入或 token 過期                |
| `404`  | 角色或劇情進度不存在               |
| `409`  | 角色正在戰鬥，無法操作一般遊歷流程 |
| `500`  | 伺服器錯誤                         |

### 商業規則與相容性

- MVP 為固定新手劇本，範圍到墨大夫劇情結束。
- Miro 顯示互動點與文字輸入框；第一階段自然語言理解不視為已完成能力。

---

## ADV-002｜執行遊歷行動

### Method／Path

```http
POST /api/v1/adventure/actions
```

### Authentication／Headers

- `Authorization`、`Content-Type`：必填。

### Request

| Body           | 型別    | 必填     | Nullable | 限制                                       |
| -------------- | ------- | -------- | -------- | ------------------------------------------ |
| `actionCode`   | string  | 條件必填 | 是       | 與 `actionText` 恰好一個非 null            |
| `actionText`   | string  | 條件必填 | 是       | 與 `actionCode` 恰好一個非 null；1～500 字 |
| `stateVersion` | integer | 是       | 否       | 大於等於 0                                 |

```json
{
  "actionCode": "inspect_footprints",
  "actionText": null,
  "stateVersion": 4
}
```

### Success Response

```http
200 OK
```

| 欄位                     | 型別                | Nullable | 說明                                      |
| ------------------------ | ------------------- | -------- | ----------------------------------------- |
| `actionResult`           | enum                | 否       | `SUCCESS`、`FAILED`                       |
| `narrative`              | string              | 否       | 結果敘事                                  |
| `story.previousNodeCode` | string              | 否       | 原節點                                    |
| `story.currentNodeCode`  | string              | 否       | 新節點                                    |
| `worldTime`              | WorldTime           | 否       | 更新後世界時間                            |
| `characterChanges`       | array               | 否       | 可為空                                    |
| `inventoryChanges`       | array               | 否       | 可為空                                    |
| `trigger`                | object 或 null      | 是       | 無轉場時為 null                           |
| `trigger.type`           | enum                | 否       | `BATTLE`、`CULTIVATION`、`STORY_COMPLETE` |
| `trigger.resourceId`     | UUID string 或 null | 是       | 有對應資源時提供                          |
| `stateVersion`           | integer             | 否       | 新版本                                    |

### Error Response

| Status | 情境                                 |
| ------ | ------------------------------------ |
| `400`  | Action 欄位組合或型別錯誤            |
| `401`  | 未登入或 token 過期                  |
| `404`  | 角色或劇情節點不存在                 |
| `409`  | 版本過期、角色正在戰鬥或劇情狀態衝突 |
| `422`  | 行動不允許或固定 JSON 沒有對應案例   |
| `500`  | 伺服器錯誤                           |

### 商業規則與相容性

- 第一階段 `actionText` 只由固定 JSON／規則 Provider 處理；沒有對應案例時不得假裝成功。
- 未來可替換成 LLM Provider，但不得改變前端 Request／Response 的既有欄位語意。

---

## BTL-001｜取得戰鬥狀態

### Method／Path

```http
GET /api/v1/battles/{battleId}
```

### Authentication／Headers

- `Authorization`：必填。

### Request

| Path       | 型別        | 必填 | 說明                            |
| ---------- | ----------- | ---- | ------------------------------- |
| `battleId` | UUID string | 是   | ADV-002 的 `trigger.resourceId` |

### Success Response

```http
200 OK
```

| 欄位               | 型別        | Nullable | 說明                                     |
| ------------------ | ----------- | -------- | ---------------------------------------- |
| `battleId`         | UUID string | 否       | 戰鬥 ID                                  |
| `battleCode`       | string      | 否       | 固定戰鬥代碼                             |
| `status`           | enum        | 否       | `ACTIVE`、`VICTORY`、`DEFEAT`、`ESCAPED` |
| `roundNo`          | integer     | 否       | 目前回合，大於等於 1                     |
| `player`           | Combatant   | 否       | 玩家戰鬥快照                             |
| `enemy`            | Combatant   | 否       | 敵方戰鬥快照                             |
| `environment`      | object      | 否       | 地形與描述                               |
| `recentTurns`      | array       | 否       | 最近回合，可為空                         |
| `availableActions` | array       | 否       | 目前可用行動                             |
| `stateVersion`     | integer     | 否       | 目前版本                                 |

#### Combatant

| 欄位                        | 型別    | Nullable | 說明                                  |
| --------------------------- | ------- | -------- | ------------------------------------- |
| `name`                      | string  | 否       | 顯示名稱                              |
| `realm`                     | string  | 否       | 顯示境界；未知時使用「未知」而非 null |
| `hp.current`／`hp.max`      | integer | 否       | 氣血                                  |
| `mana.current`／`mana.max`  | integer | 否       | 法力                                  |
| `attributes.attack`         | integer | 否       | 綜合後攻擊                            |
| `attributes.spellPower`     | integer | 否       | 綜合後法術威力                        |
| `attributes.defense`        | integer | 否       | 綜合後防禦                            |
| `attributes.speed`          | integer | 否       | 綜合後遁速                            |
| `attributes.spiritualSense` | integer | 否       | 綜合後神識                            |
| `skills`                    | array   | 否       | MVP 可為空                            |
| `effects`                   | array   | 否       | 當前效果，可為空                      |

### Error Response

| Status | 情境                       |
| ------ | -------------------------- |
| `400`  | `battleId` 非合法 UUID     |
| `401`  | 未登入或 token 過期        |
| `404`  | 戰鬥不存在或不屬於目前角色 |
| `500`  | 伺服器錯誤                 |

### 商業規則與相容性

- Combatant 是每場戰鬥快照，不等同資料庫 Character entity。
- MVP 可顯示遁速，但會心與遁速機率影響屬於後續戰鬥擴充。

---

## BTL-002｜執行並結算戰鬥回合

### Method／Path

```http
POST /api/v1/battles/{battleId}/turns
```

### Authentication／Headers

- `Authorization`、`Content-Type`、`Idempotency-Key`：必填。

### Request

| 位置 | 欄位                     | 型別        | 必填     | Nullable | 限制                                      |
| ---- | ------------------------ | ----------- | -------- | -------- | ----------------------------------------- |
| Path | `battleId`               | UUID string | 是       | 否       | 目前戰鬥 ID                               |
| Body | `action.type`            | enum        | 是       | 否       | `ATTACK`、`USE_ITEM`、`CUSTOM`            |
| Body | `action.actionCode`      | string      | 條件必填 | 是       | `ATTACK` 必填；由 `availableActions` 取得 |
| Body | `action.actionText`      | string      | 條件必填 | 是       | `CUSTOM` 必填；1～500 字                  |
| Body | `action.inventoryItemId` | UUID string | 條件必填 | 是       | `USE_ITEM` 必填                           |
| Body | `stateVersion`           | integer     | 是       | 否       | 最新版本                                  |

```json
{
  "action": {
    "type": "CUSTOM",
    "actionCode": null,
    "actionText": "我退到竹影之間，以石階遮擋身形後再伺機出手。",
    "inventoryItemId": null
  },
  "stateVersion": 5
}
```

### Success Response

```http
201 Created
```

| 欄位               | 型別        | Nullable | 說明                                     |
| ------------------ | ----------- | -------- | ---------------------------------------- |
| `turnId`           | UUID string | 否       | 已建立的回合 ID                          |
| `roundNo`          | integer     | 否       | 已結算回合                               |
| `narrative`        | string      | 否       | Provider 敘事                            |
| `playerState`      | object      | 否       | 結算後 HP、Mana、Effects                 |
| `enemyState`       | object      | 否       | 結算後 HP、Mana、狀態與 Effects          |
| `resourceChanges`  | array       | 否       | 消耗／取得資源，可為空                   |
| `appliedEffects`   | array       | 否       | 新增效果，可為空                         |
| `removedEffects`   | array       | 否       | 移除效果，可為空                         |
| `battleStatus`     | enum        | 否       | `ACTIVE`、`VICTORY`、`DEFEAT`、`ESCAPED` |
| `rewards`          | array       | 否       | 已入袋戰利品，可為空                     |
| `availableActions` | array       | 否       | 下一回合可用行動；戰鬥結束時為空         |
| `stateVersion`     | integer     | 否       | 新版本                                   |

```json
{
  "turnId": "1e6ff86b-85d4-4799-84da-c1f9996354f1",
  "roundNo": 1,
  "narrative": "韓立借竹影掩護側身避開短刃，趁黑衣人重心不穩時一劍刺向其肩頭。",
  "playerState": {
    "hp": { "current": 82, "max": 100 },
    "mana": { "current": 42, "max": 60 },
    "effects": []
  },
  "enemyState": {
    "hp": { "current": 41, "max": 54 },
    "mana": { "current": 23, "max": 23 },
    "statusLabel": "輕傷",
    "effects": []
  },
  "resourceChanges": [],
  "appliedEffects": [],
  "removedEffects": [],
  "battleStatus": "ACTIVE",
  "rewards": [],
  "availableActions": [],
  "stateVersion": 6
}
```

### Error Response

| Status | 情境                                                            |
| ------ | --------------------------------------------------------------- |
| `400`  | Action 欄位組合、UUID 或型別錯誤                                |
| `401`  | 未登入或 token 過期                                             |
| `404`  | 戰鬥、道具或角色不存在／不屬於使用者                            |
| `409`  | 戰鬥已結束、版本過期或回合衝突                                  |
| `422`  | 行動不可用、物品／法力不足或固定 JSON 無案例                    |
| `502`  | JSON／LLM Provider 輸出不符合 Simulation contract；不得寫入狀態 |
| `503`  | 未來 LLM Provider 暫時不可用；不得寫入狀態                      |
| `500`  | 結算 transaction 失敗；不得部分寫入                             |

### 商業規則與相容性

- MVP 使用固定 JSON Provider；未來只替換為 LLM Provider。
- Provider 只提出結果，Server 驗證並決定實際寫入。
- 勝利時 `rewards` 已寫入儲物袋，不另建領取 API。
- 前端不得取得 Prompt、Provider 原始輸出或內部錯誤。

---

## CUL-001｜取得閉關修煉資料

### Method／Path

```http
GET /api/v1/cultivation
```

### Authentication／Headers

- `Authorization`：必填。

### Request

無 Path、Query、Body。

### Success Response

```http
200 OK
```

| 欄位                          | 型別      | Nullable | 說明                           |
| ----------------------------- | --------- | -------- | ------------------------------ |
| `character`                   | object    | 否       | 閉關所需角色狀態               |
| `cultivationRate.basePerYear` | integer   | 否       | 基礎年修為                     |
| `cultivationRate.modifiers`   | array     | 否       | 靈根、洞府、丹藥等加成，可為空 |
| `worldTime`                   | WorldTime | 否       | 目前世界時間                   |
| `remainingLifespanMonths`     | integer   | 否       | 剩餘壽元月數                   |
| `availableDurations`          | integer[] | 否       | Miro 顯示 1、6、12 個月        |
| `availableActivities`         | enum[]    | 否       | MVP：`CULTIVATE`、`HEAL`       |
| `availablePills`              | array     | 否       | 可用丹藥，可為空               |
| `spiritStones`                | array     | 否       | 可投入靈石，可為空             |
| `breakthrough`                | object    | 否       | 突破資格、目標與風險           |
| `stateVersion`                | integer   | 否       | 目前版本                       |

#### breakthrough

| 欄位              | 型別    | Nullable | 說明                                                |
| ----------------- | ------- | -------- | --------------------------------------------------- |
| `eligible`        | boolean | 否       | 是否可突破                                          |
| `type`            | enum    | 是       | 無適用突破時可為 null；`MINOR_REALM`、`MAJOR_REALM` |
| `targetLevel`     | integer | 是       | 無目標時為 null                                     |
| `targetRealm`     | string  | 是       | 無目標時為 null                                     |
| `baseSuccessRate` | number  | 是       | 0～1；無可用判定時為 null                           |
| `requirements`    | array   | 否       | 條件與是否達成                                      |
| `failureRisk`     | string  | 是       | 無風險資訊時為 null                                 |

### Error Response

| Status | 情境                   |
| ------ | ---------------------- |
| `401`  | 未登入或 token 過期    |
| `404`  | 角色不存在             |
| `409`  | 角色正在戰鬥，不能閉關 |
| `500`  | 伺服器錯誤             |

### 商業規則與相容性

- 丹藥加速修練，不直接增加修為。
- 閉關會推進世界時間並消耗壽元。
- 一般修煉可由 Lv3 累積修為升到 Lv4；Lv4 修滿後才進行小境界突破至 Lv5。

---

## CUL-002｜試算閉關結果

### Method／Path

```http
POST /api/v1/cultivation/previews
```

### Authentication／Headers

- `Authorization`、`Content-Type`：必填。

### Request

| Body                             | 型別        | 必填 | 限制                                    |
| -------------------------------- | ----------- | ---- | --------------------------------------- |
| `activity`                       | enum        | 是   | `CULTIVATE`、`HEAL`                     |
| `durationMonths`                 | integer     | 是   | 必須存在於 CUL-001 `availableDurations` |
| `pills`                          | array       | 是   | 不使用時傳 `[]`                         |
| `pills[].inventoryItemId`        | UUID string | 是   | 丹藥背包項目                            |
| `pills[].quantity`               | integer     | 是   | 大於 0                                  |
| `spiritStones`                   | array       | 是   | 不使用時傳 `[]`                         |
| `spiritStones[].inventoryItemId` | UUID string | 是   | 靈石背包項目                            |
| `spiritStones[].quantity`        | integer     | 是   | 大於 0                                  |
| `stateVersion`                   | integer     | 是   | 最新版本                                |

### Success Response

```http
200 OK
```

| 欄位                                | 型別            | Nullable | 說明                     |
| ----------------------------------- | --------------- | -------- | ------------------------ |
| `previewToken`                      | UUID string     | 是       | `valid: false` 時為 null |
| `expiresAt`                         | ISO 8601 string | 是       | 無 token 時為 null       |
| `valid`                             | boolean         | 否       | 是否可正式執行           |
| `validationErrors`                  | string[]        | 否       | valid 時為空             |
| `activity`                          | enum            | 否       | 試算活動                 |
| `durationMonths`                    | integer         | 否       | 試算期間                 |
| `estimatedEndTime`                  | WorldTime       | 否       | 預估結束時間             |
| `estimatedCultivationExp`           | integer         | 否       | 預估結算後修為           |
| `estimatedHp`／`estimatedMana`      | integer         | 否       | 預估結算後狀態           |
| `estimatedRemainingLifespanMonths`  | integer         | 否       | 預估剩餘壽元             |
| `resourceCosts`                     | array           | 否       | 預計消耗資源             |
| `effectsToConsume`                  | string[]        | 否       | 預計消耗效果             |
| `breakthroughAvailableAfterSession` | boolean         | 否       | 結算後是否達突破條件     |
| `warnings`                          | string[]        | 否       | 前端確認提示             |
| `stateVersion`                      | integer         | 否       | 試算依據版本，不遞增     |

### Error Response

| Status | 情境                              |
| ------ | --------------------------------- |
| `400`  | 欄位、期間、UUID 或 enum 格式錯誤 |
| `401`  | 未登入或 token 過期               |
| `404`  | 角色或物品不存在                  |
| `409`  | 版本過期或角色正在戰鬥            |
| `500`  | 試算錯誤                          |

### 商業規則與相容性

- 結構合法但規則不成立時回 `200`、`valid: false`，讓前端顯示原因。
- Preview 不修改角色、背包、效果或世界時間。

---

## CUL-003｜執行閉關或療傷

### Method／Path

```http
POST /api/v1/cultivation/sessions
```

### Authentication／Headers

- `Authorization`、`Content-Type`、`Idempotency-Key`：必填。

### Request

| Body           | 型別        | 必填 | 說明                         |
| -------------- | ----------- | ---- | ---------------------------- |
| `previewToken` | UUID string | 是   | CUL-002 回傳且尚未使用／過期 |
| `stateVersion` | integer     | 是   | CUL-002 的依據版本           |

### Success Response

```http
201 Created
```

| 欄位                | 型別        | Nullable | 說明                 |
| ------------------- | ----------- | -------- | -------------------- |
| `sessionId`         | UUID string | 否       | 閉關紀錄 ID          |
| `activity`          | enum        | 否       | `CULTIVATE`、`HEAL`  |
| `elapsedMonths`     | integer     | 否       | 經過月數             |
| `cultivationGained` | integer     | 否       | 增加修為；療傷可為 0 |
| `hpRecovered`       | integer     | 否       | 恢復 HP；修煉可為 0  |
| `manaRecovered`     | integer     | 否       | 恢復 Mana，可為 0    |
| `resourcesConsumed` | array       | 否       | 實際消耗資源         |
| `effectsApplied`    | array       | 否       | 新效果，可為空       |
| `events`            | array       | 否       | 結算事件，可為空     |
| `character`         | object      | 否       | 最新角色修煉狀態     |
| `worldTime`         | WorldTime   | 否       | 最新世界時間         |
| `breakthrough`      | object      | 否       | 最新突破狀態         |
| `stateVersion`      | integer     | 否       | 新版本               |

### Error Response

| Status | 情境                                         |
| ------ | -------------------------------------------- |
| `400`  | Token／版本格式錯誤                          |
| `401`  | 未登入或 token 過期                          |
| `404`  | 角色或 preview 不存在                        |
| `409`  | Preview 過期、已使用、版本過期或角色狀態改變 |
| `422`  | 資源或效果已不足，無法依預覽執行             |
| `500`  | Transaction 失敗；不得部分扣除或推進時間     |

### 商業規則與相容性

- Server 必須重新計算，不可信任 Preview 回傳的預估值。
- 資源扣除、角色更新、世界時間、效果與事件必須在同一 transaction 完成。

---

## CUL-004｜嘗試境界突破

### Method／Path

```http
POST /api/v1/cultivation/breakthrough-attempts
```

### Authentication／Headers

- `Authorization`、`Content-Type`、`Idempotency-Key`：必填。

### Request

MVP 只處理練氣前期 Lv4 MAX → Lv5 的小境界突破；來源沒有要求輔助物品，因此本版不把 `supportItems` 設成必填欄位。未來大境界可向下相容新增 optional 欄位。

| Body           | 型別    | 必填 | 說明                            |
| -------------- | ------- | ---- | ------------------------------- |
| `stateVersion` | integer | 是   | CUL-001／CUL-003 回傳的最新版本 |

```json
{
  "stateVersion": 12
}
```

### Success Response：突破成功

遊戲結果失敗不是 HTTP 錯誤；只要 attempt 成功建立並完成結算，一律回 `201`。

```http
201 Created
```

```json
{
  "attemptId": "f688b45e-f15c-4912-8dba-07b472b38779",
  "success": true,
  "breakthroughType": "MINOR_REALM",
  "previousLevel": 4,
  "currentLevel": 5,
  "previousRealm": "練氣四層",
  "currentRealm": "練氣五層",
  "previousStage": "EARLY",
  "currentStage": "MIDDLE",
  "successRate": 0.9,
  "cultivationExpBefore": 1100,
  "cultivationExpAfter": 0,
  "resourcesConsumed": [],
  "losses": [],
  "effectsApplied": [],
  "retryAllowed": false,
  "narrative": "靈力衝破小境界瓶頸，韓立成功踏入練氣中期。",
  "stateVersion": 13
}
```

### Success Response：突破失敗

```http
201 Created
```

```json
{
  "attemptId": "f688b45e-f15c-4912-8dba-07b472b38779",
  "success": false,
  "breakthroughType": "MINOR_REALM",
  "previousLevel": 4,
  "currentLevel": 4,
  "previousRealm": "練氣四層",
  "currentRealm": "練氣四層",
  "previousStage": "EARLY",
  "currentStage": "EARLY",
  "successRate": 0.9,
  "cultivationExpBefore": 1100,
  "cultivationExpAfter": 1100,
  "resourcesConsumed": [],
  "losses": [],
  "effectsApplied": [],
  "retryAllowed": true,
  "narrative": "靈力在瓶頸前重新平復，此次突破失敗，但修為並未損失。",
  "stateVersion": 13
}
```

### Response 欄位

| 欄位                            | 型別        | Nullable | 說明                      |
| ------------------------------- | ----------- | -------- | ------------------------- |
| `attemptId`                     | UUID string | 否       | 突破紀錄 ID               |
| `success`                       | boolean     | 否       | 遊戲結果                  |
| `breakthroughType`              | enum        | 否       | MVP 為 `MINOR_REALM`      |
| `previousLevel`／`currentLevel` | integer     | 否       | 前後層級                  |
| `previousRealm`／`currentRealm` | string      | 否       | 前後顯示名稱              |
| `previousStage`／`currentStage` | enum        | 否       | `EARLY`、`MIDDLE`、`LATE` |
| `successRate`                   | number      | 否       | 最終使用機率，0～1        |
| `cultivationExpBefore`／`After` | integer     | 否       | 前後修為                  |
| `resourcesConsumed`             | array       | 否       | MVP 小境界為空            |
| `losses`                        | array       | 否       | 小境界失敗為空            |
| `effectsApplied`                | array       | 否       | 可為空                    |
| `retryAllowed`                  | boolean     | 否       | 是否可再次嘗試            |
| `narrative`                     | string      | 否       | 結果敘事                  |
| `stateVersion`                  | integer     | 否       | 新版本                    |

### Error Response

| Status | 情境                                       |
| ------ | ------------------------------------------ |
| `400`  | 版本格式錯誤                               |
| `401`  | 未登入或 token 過期                        |
| `404`  | 角色不存在                                 |
| `409`  | 版本過期、角色正在戰鬥／閉關或重複結算     |
| `422`  | 不是 Lv4 MAX、修為未滿或目前沒有可突破瓶頸 |
| `500`  | 規則判定或 transaction 失敗                |

### 商業規則與相容性

- 已確認：Lv1～Lv4 為練氣前期，Lv4 MAX 才觸發小瓶頸。
- 已確認：Lv4 MAX → Lv5 的基礎成功率為 90%，再依靈根加成。
- 已確認：小境界突破失敗不扣修為，可再次嘗試。
- 突破由後端規則判定，不交給戰鬥 LLM。
- 成功率範例 `0.9` 只代表未套用其他加成的基礎值；實際 response 必須回傳本次最終值。

---

## Server 內部 Battle Provider Contract

本節不是前端 API，但它是「固定 JSON 先跑流程，未來替換 LLM」的相容性邊界。

### BattleSimulationContext

| 欄位           | 型別        | 必填 | 說明                             |
| -------------- | ----------- | ---- | -------------------------------- |
| `battleId`     | UUID string | 是   | 戰鬥 ID                          |
| `battleCode`   | string      | 是   | 固定戰鬥代碼                     |
| `roundNo`      | integer     | 是   | 回合                             |
| `playerAction` | object      | 是   | 已通過 API validation 的玩家行動 |
| `player`       | Combatant   | 是   | 玩家戰鬥快照                     |
| `enemy`        | Combatant   | 是   | 敵方戰鬥快照                     |
| `environment`  | object      | 是   | 地形與環境                       |
| `recentTurns`  | array       | 是   | 近期回合，可為空                 |

### BattleSimulationResult

```json
{
  "narrative": "韓立架開短刃，反手一劍劃傷黑衣人的肩頭。",
  "playerChanges": {
    "hpDelta": -4,
    "manaDelta": 0
  },
  "enemyChanges": {
    "hpDelta": -13,
    "manaDelta": 0,
    "statusLabel": "輕傷"
  },
  "effectsToApply": [],
  "effectsToRemove": [],
  "itemsToConsume": [],
  "battleStatus": "ACTIVE",
  "rewards": []
}
```

| 欄位                                 | 型別    | 必填 | 限制                                     |
| ------------------------------------ | ------- | ---- | ---------------------------------------- |
| `narrative`                          | string  | 是   | 不得為空                                 |
| `playerChanges.hpDelta`／`manaDelta` | integer | 是   | 可正可負                                 |
| `enemyChanges.hpDelta`／`manaDelta`  | integer | 是   | 可正可負                                 |
| `enemyChanges.statusLabel`           | string  | 是   | 顯示用狀態                               |
| `effectsToApply`                     | array   | 是   | 可為空                                   |
| `effectsToRemove`                    | array   | 是   | 可為空                                   |
| `itemsToConsume`                     | array   | 是   | 只能包含本次合法行動允許的物品           |
| `battleStatus`                       | enum    | 是   | `ACTIVE`、`VICTORY`、`DEFEAT`、`ESCAPED` |
| `rewards`                            | array   | 是   | 只能引用後端敵人掉落池物品               |

### Provider 相容性規則

- `JsonBattleSimulationProvider` 與未來 `LlmBattleSimulationProvider` 實作同一 interface。
- Provider 不得存取或寫入資料庫，只回傳 `BattleSimulationResult`。
- Server 使用 Zod 驗證 Provider output，再驗證資源、上下限與合法狀態轉換。
- Provider validation 失敗回 `502`，且不得建立 turn 或修改角色、背包、戰鬥、時間線。
- 固定 JSON fixture 建議以 `battleCode + roundNo + action.type + action.actionCode` 尋找；`CUSTOM` 測試案例另以 fixture case code 映射，不把玩家原文當檔名。

## Repository 比對

### 一致項目

- Repository 已使用 Express、TypeScript、Zod 與 OpenAPI registry。
- `packages/contracts` 已明確規定 schema 是 DTO 與 OpenAPI 的唯一資料來源。
- 既有健康檢查使用直接 response object，沒有通用 data envelope。
- 既有 `ApiErrorSchema` 只有 `message`，本文件延續相同錯誤格式。
- Miro schema 已有角色、儲物袋、劇情進度、角色效果、功法、時間線與 battle session 的資料方向。

### 衝突或差異

- Repository 目前只有 `GET /api/health`；本文件 10 支 API 尚未實作或註冊至 OpenAPI。
- Notion API 資料庫目前只看到既有 Google 登入項目，沒有本文件 10 支遊戲 API。
- Notion 最新角色卡仍列出減傷、命中、閃避、會心、會心效果；使用者最新決策已改成較精簡的角色永久屬性。
- 舊版 `docs/api/mvp-api-spec.md` 將 Lv3 → Lv4 寫成突破；Notion 境界規則顯示真正的小境界突破是 Lv4 MAX → Lv5，本文件已修正。
- 舊版突破 Request 預留必填 `supportItems`；MVP 來源沒有此要求，本文件移除，未來可新增 optional 欄位。

### 本次影響

- 本次只新增第二份 Markdown contract，未修改舊文件、程式碼、Zod schema、OpenAPI 或資料庫。
- 後續實作應以確認後的單一版本為準，不應讓兩份 Markdown 同時成為正式 contract。

## 未確認事項

| 項目                           | 原因                                                                               | 需要的確認                                            |
| ------------------------------ | ---------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Authentication                 | Notion 技術選型提到 JWT／第三方登入，但目前遊戲 API 尚無已實作 middleware contract | 是否所有遊戲 API 統一使用 Bearer JWT                  |
| Error code                     | Repository 只有 `message`，沒有機器可讀 `code`                                     | MVP 是否維持只靠 HTTP status，或先擴充 ApiErrorSchema |
| Preview token 保存方式與效期   | Miro／Notion沒有定義                                                               | 是否採伺服器端短期資料及預設效期                      |
| `stateVersion` 範圍            | 來源沒有定義是角色級、存檔級或 aggregate 級                                        | 建議採角色遊戲狀態 aggregate version，需確認          |
| 世界時間日曆                   | 線稿只有季節與日數，沒有每季天數規則                                               | 確認季節長度與跨年換算                                |
| 自訂文字在 JSON MVP 的案例策略 | 已確認先用 JSON 跑流程，但沒有定義未知文字如何映射                                 | 建議無 fixture 時回 `422`，需確認                     |
| 戰鬥 Provider timeout／retry   | 未來 LLM 行為尚未定義                                                              | 實作 LLM 前決定 timeout、retry 與 circuit breaker     |
| 敵人可見屬性                   | Miro 顯示 HP、Mana、遁速，Notion部分內容把敵人狀態放在後續範圍                     | 確認 MVP 實際顯示欄位                                 |
| 突破靈根加成公式               | Notion只說依靈根加成，未完整定義每種靈根的小境界加成                               | 補齊規則後才能實作最終成功率                          |
