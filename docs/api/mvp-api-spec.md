# 凡人・遨遊天地：第一階段 MVP API 文件

## 1. 文件資訊

| 項目         | 內容                                          |
| ------------ | --------------------------------------------- |
| API Base URL | `/api/v1`                                     |
| 資料格式     | `application/json`                            |
| 驗證方式     | `Authorization: Bearer <accessToken>`         |
| ID 格式      | UUID 字串                                     |
| 時間格式     | 世界時間使用遊戲內結構；系統時間使用 ISO 8601 |
| 錯誤格式     | `{ "message": "錯誤說明" }`                   |

本文件定義第一階段 MVP 的遊歷、戰鬥、閉關、角色與儲物袋 API。戰鬥第一階段由固定 JSON Provider 回傳推演結果，未來切換成 LLM Provider；兩者必須遵守相同的 `BattleSimulationResult` contract，因此前端 API 不因 Provider 替換而改變。

## 2. API 清單

| 編號    | Method | Path                                        | 用途               |
| ------- | ------ | ------------------------------------------- | ------------------ |
| CHR-001 | GET    | `/api/v1/characters/me`                     | 取得目前角色資料   |
| INV-001 | GET    | `/api/v1/inventory`                         | 取得角色儲物袋     |
| ADV-001 | GET    | `/api/v1/adventure/current`                 | 取得目前遊歷劇情   |
| ADV-002 | POST   | `/api/v1/adventure/actions`                 | 執行遊歷行動       |
| BTL-001 | GET    | `/api/v1/battles/{battleId}`                | 取得戰鬥狀態       |
| BTL-002 | POST   | `/api/v1/battles/{battleId}/turns`          | 執行並結算戰鬥回合 |
| CUL-001 | GET    | `/api/v1/cultivation`                       | 取得閉關修煉資料   |
| CUL-002 | POST   | `/api/v1/cultivation/previews`              | 試算閉關結果       |
| CUL-003 | POST   | `/api/v1/cultivation/sessions`              | 執行閉關或療傷     |
| CUL-004 | POST   | `/api/v1/cultivation/breakthrough-attempts` | 嘗試境界突破       |

## 3. 共用規格

### 3.1 共用 Request Headers

| Header            | 必填               | 說明                                      |
| ----------------- | ------------------ | ----------------------------------------- |
| `Authorization`   | 是                 | Bearer access token                       |
| `Content-Type`    | POST 必填          | 固定為 `application/json`                 |
| `Idempotency-Key` | 狀態異動 POST 必填 | 前端產生 UUID；避免重送造成重複扣除或結算 |

`Idempotency-Key` 適用於 BTL-002、CUL-003、CUL-004。相同使用者、相同 API 與相同 key 的重送，後端必須回傳第一次成功結果，不得再次執行副作用。

### 3.2 共用錯誤格式

```json
{
  "message": "目前角色狀態已更新，請重新載入後再操作。"
}
```

### 3.3 主要 HTTP Status

| Status                      | 使用情境                                                      |
| --------------------------- | ------------------------------------------------------------- |
| `200 OK`                    | 查詢成功、遊歷行動成功、試算成功                              |
| `201 Created`               | 成功建立並結算戰鬥回合、閉關紀錄或突破紀錄                    |
| `400 Bad Request`           | JSON 格式錯誤、缺少必填欄位、欄位型別或 enum 錯誤             |
| `401 Unauthorized`          | 未登入、access token 無效或已過期                             |
| `404 Not Found`             | 角色、戰鬥或指定資源不存在，或不屬於目前使用者                |
| `409 Conflict`              | `stateVersion` 過期、狀態不允許操作、重複／衝突請求           |
| `422 Unprocessable Entity`  | 格式正確，但不符合遊戲規則，例如物品不足或行動不可用          |
| `500 Internal Server Error` | 未預期的伺服器錯誤；不得回傳 stack trace 或內部例外內容       |
| `502 Bad Gateway`           | 戰鬥 Provider 回傳不符合 `BattleSimulationResult` contract    |
| `503 Service Unavailable`   | 未來 LLM Provider 暫時無法服務；固定 JSON Provider 通常不使用 |

### 3.4 狀態版本

所有會修改角色、背包、劇情、戰鬥或世界時間的 Request 都必須提供目前畫面的 `stateVersion`。成功修改後，Response 回傳新的 `stateVersion`。

若版本不一致：

```http
409 Conflict
```

```json
{
  "message": "目前遊戲狀態已更新，請重新載入後再操作。"
}
```

### 3.5 共用資料結構

#### WorldTime

```json
{
  "year": 1,
  "season": "SPRING",
  "day": 12
}
```

`season` 可用值：`SPRING`、`SUMMER`、`AUTUMN`、`WINTER`。

#### CharacterSummary

```json
{
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
}
```

精確的 `accuracy`、`evasion`、`critRate`、`critDamage` 與 `damageReduction` 不屬於角色永久 API 欄位。命中、閃避、會心等表現由功法、效果、裝備、地形與戰鬥上下文提供給推演 Provider。

---

## 4. CHR-001｜取得目前角色資料

```http
GET /api/v1/characters/me
```

### 前端提供參數

除共用 `Authorization` Header 外，不需提供 Path、Query 或 Body。

### 成功回傳

```http
200 OK
```

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

### 主要狀態

| Status | 情境                |
| ------ | ------------------- |
| `200`  | 成功取得角色        |
| `401`  | 未登入或 token 過期 |
| `404`  | 使用者尚未建立角色  |
| `500`  | 伺服器錯誤          |

---

## 5. INV-001｜取得角色儲物袋

```http
GET /api/v1/inventory
```

### 前端提供參數

#### Query Parameters

| 欄位            | 型別   | 必填 | 說明                                                            |
| --------------- | ------ | ---- | --------------------------------------------------------------- |
| `category`      | string | 否   | 物品分類：`PILL`、`SPIRIT_STONE`、`MATERIAL`、`WEAPON`、`OTHER` |
| `usableContext` | string | 否   | 使用情境：`ADVENTURE`、`BATTLE`、`CULTIVATION`、`HEALING`       |

範例：

```http
GET /api/v1/inventory?usableContext=BATTLE
```

### 成功回傳

```http
200 OK
```

```json
{
  "containers": [
    {
      "containerId": "6ca6d21f-ccbf-4db2-a6c3-650576071d5e",
      "name": "下品儲物袋",
      "grade": "LOW",
      "capacitySlots": 20,
      "usedSlots": 4,
      "slotNo": 1,
      "items": [
        {
          "inventoryItemId": "39afd082-81af-478a-85de-93994bde770e",
          "itemCode": "yellow_dragon_pill",
          "name": "黃龍丹",
          "category": "PILL",
          "quantity": 2,
          "description": "閉關時提高修練速度，不直接增加修為。",
          "usableContexts": ["CULTIVATION"],
          "effects": [
            {
              "effectCode": "cultivation_speed_up",
              "description": "修練速度提高 25%。"
            }
          ]
        }
      ]
    }
  ],
  "stateVersion": 4
}
```

### 主要狀態

| Status | 情境                                 |
| ------ | ------------------------------------ |
| `200`  | 成功取得儲物袋；沒有物品時回傳空陣列 |
| `400`  | Query enum 不合法                    |
| `401`  | 未登入或 token 過期                  |
| `404`  | 角色不存在                           |
| `500`  | 伺服器錯誤                           |

---

## 6. ADV-001｜取得目前遊歷劇情

```http
GET /api/v1/adventure/current
```

### 前端提供參數

除共用 `Authorization` Header 外，不需提供其他參數。

### 成功回傳

```http
200 OK
```

```json
{
  "storyCode": "novice_mo_doctor",
  "currentNodeCode": "back_mountain_footprints",
  "chapterTitle": "主線章節 01・墨大夫的試煉",
  "sceneTitle": "竹林深處，傳來一陣急促腳步聲",
  "narrative": "霧氣從竹林間慢慢散開。你握緊手中的短劍，看見前方石階旁留有新鮮足跡。",
  "worldTime": {
    "year": 1,
    "season": "SPRING",
    "day": 12
  },
  "location": {
    "locationCode": "seven_mysteries_back_mountain",
    "name": "七玄門後山"
  },
  "scene": {
    "imageCode": "back_mountain_bamboo_forest",
    "characterName": "韓立",
    "interactions": [
      {
        "interactionCode": "stone_steps_footprints",
        "label": "石階足跡"
      },
      {
        "interactionCode": "dropped_medicine_pouch",
        "label": "掉落的藥囊"
      }
    ]
  },
  "availableActions": [
    {
      "actionCode": "inspect_footprints",
      "label": "查看石階上的足跡",
      "inputMode": "PRESET"
    },
    {
      "actionCode": "pick_up_pouch",
      "label": "撿起掉落的藥囊",
      "inputMode": "PRESET"
    }
  ],
  "character": {
    "characterId": "8df3127c-6f77-4d21-b672-357b4d63f93e",
    "name": "韓立",
    "realm": "練氣三層",
    "currentHp": 86,
    "maxHp": 100,
    "currentMana": 42,
    "maxMana": 60,
    "cultivationExp": 620,
    "nextLevelExp": 900
  },
  "stateVersion": 4
}
```

### 主要狀態

| Status | 情境                                   |
| ------ | -------------------------------------- |
| `200`  | 成功取得目前劇情節點                   |
| `401`  | 未登入或 token 過期                    |
| `404`  | 角色或劇情進度不存在                   |
| `409`  | 目前角色正在戰鬥，不能載入一般遊歷操作 |
| `500`  | 伺服器錯誤                             |

---

## 7. ADV-002｜執行遊歷行動

```http
POST /api/v1/adventure/actions
```

### 前端提供參數

#### Request Body

| 欄位           | 型別           | 必填     | 說明                                              |
| -------------- | -------------- | -------- | ------------------------------------------------- |
| `actionCode`   | string 或 null | 條件必填 | 預設行動代碼；與 `actionText` 二擇一              |
| `actionText`   | string 或 null | 條件必填 | 玩家輸入文字；與 `actionCode` 二擇一，長度 1～500 |
| `stateVersion` | integer        | 是       | ADV-001 回傳的版本                                |

```json
{
  "actionCode": "inspect_footprints",
  "actionText": null,
  "stateVersion": 4
}
```

第一階段的 `actionText` 只交給固定 JSON Adventure Provider。Provider 可依測試案例回傳固定結果；無對應案例時回傳 `422`。未來接入 LLM 時不改變此 API contract。

### 成功回傳

```http
200 OK
```

```json
{
  "actionResult": "SUCCESS",
  "narrative": "你蹲下查看足跡，發現痕跡一路延伸到竹林深處，一名黑衣人突然現身。",
  "story": {
    "storyCode": "novice_mo_doctor",
    "previousNodeCode": "back_mountain_footprints",
    "currentNodeCode": "black_clothed_enemy_appears"
  },
  "worldTime": {
    "year": 1,
    "season": "SPRING",
    "day": 12
  },
  "characterChanges": [],
  "inventoryChanges": [],
  "trigger": {
    "type": "BATTLE",
    "resourceId": "cfd3a94b-03ab-4228-af9f-da1584fa3a25"
  },
  "stateVersion": 5
}
```

`trigger.type` 可用值：`NONE`、`BATTLE`、`CULTIVATION`、`STORY_COMPLETE`。

### 主要狀態

| Status | 情境                                                 |
| ------ | ---------------------------------------------------- |
| `200`  | 行動成功並完成劇情狀態更新                           |
| `400`  | `actionCode`／`actionText` 未二擇一，或欄位格式錯誤  |
| `401`  | 未登入或 token 過期                                  |
| `404`  | 角色或目前劇情節點不存在                             |
| `409`  | `stateVersion` 過期、角色正在戰鬥或劇情狀態已改變    |
| `422`  | 行動不在目前節點的允許範圍，或固定 JSON 沒有對應案例 |
| `500`  | 伺服器錯誤                                           |

---

## 8. BTL-001｜取得戰鬥狀態

```http
GET /api/v1/battles/{battleId}
```

### 前端提供參數

#### Path Parameters

| 欄位       | 型別        | 必填 | 說明                                                |
| ---------- | ----------- | ---- | --------------------------------------------------- |
| `battleId` | UUID string | 是   | 戰鬥識別碼，由 ADV-002 的 `trigger.resourceId` 取得 |

### 成功回傳

```http
200 OK
```

```json
{
  "battleId": "cfd3a94b-03ab-4228-af9f-da1584fa3a25",
  "battleCode": "novice_black_clothed_enemy",
  "status": "ACTIVE",
  "roundNo": 1,
  "player": {
    "name": "韓立",
    "realm": "練氣三層",
    "hp": { "current": 86, "max": 100 },
    "mana": { "current": 42, "max": 60 },
    "attributes": {
      "attack": 18,
      "spellPower": 24,
      "defense": 12,
      "speed": 31,
      "spiritualSense": 8
    },
    "skills": [],
    "effects": [
      {
        "effectCode": "body_protection",
        "name": "護體術",
        "remainingRounds": 2,
        "description": "靈力形成護體屏障。"
      }
    ]
  },
  "enemy": {
    "enemyCode": "black_clothed_enemy",
    "name": "黑衣人",
    "realm": "未知",
    "statusLabel": "警戒",
    "hp": { "current": 54, "max": 54 },
    "mana": { "current": 23, "max": 23 },
    "attributes": {
      "attack": 16,
      "spellPower": 12,
      "defense": 10,
      "speed": 24,
      "spiritualSense": 5
    },
    "effects": []
  },
  "environment": {
    "terrainCode": "bamboo_forest",
    "terrainName": "竹林",
    "description": "竹林狹窄且帶有薄霧。"
  },
  "recentTurns": [],
  "availableActions": [
    {
      "type": "ATTACK",
      "actionCode": "basic_attack",
      "label": "攻擊"
    },
    {
      "type": "USE_ITEM",
      "actionCode": "use_item",
      "label": "使用道具"
    },
    {
      "type": "CUSTOM",
      "actionCode": "custom_action",
      "label": "自行輸入行動"
    }
  ],
  "stateVersion": 5
}
```

`status` 可用值：`ACTIVE`、`VICTORY`、`DEFEAT`、`ESCAPED`。

### 主要狀態

| Status | 情境                                 |
| ------ | ------------------------------------ |
| `200`  | 成功取得戰鬥狀態；已結束戰鬥仍可查詢 |
| `400`  | `battleId` 不是合法 UUID             |
| `401`  | 未登入或 token 過期                  |
| `404`  | 戰鬥不存在或不屬於目前角色           |
| `500`  | 伺服器錯誤                           |

---

## 9. BTL-002｜執行並結算戰鬥回合

```http
POST /api/v1/battles/{battleId}/turns
```

### 前端提供參數

#### Headers

| Header            | 必填 | 說明                                    |
| ----------------- | ---- | --------------------------------------- |
| `Authorization`   | 是   | Bearer access token                     |
| `Content-Type`    | 是   | `application/json`                      |
| `Idempotency-Key` | 是   | 前端產生 UUID，每次新的回合操作使用新值 |

#### Path Parameters

| 欄位       | 型別        | 必填 | 說明           |
| ---------- | ----------- | ---- | -------------- |
| `battleId` | UUID string | 是   | 目前戰鬥識別碼 |

#### Request Body

| 欄位                     | 型別                | 必填     | 說明                                                   |
| ------------------------ | ------------------- | -------- | ------------------------------------------------------ |
| `action.type`            | string              | 是       | `ATTACK`、`USE_ITEM`、`CUSTOM`                         |
| `action.actionCode`      | string 或 null      | 條件必填 | `ATTACK` 時必填；由 BTL-001 的 `availableActions` 取得 |
| `action.actionText`      | string 或 null      | 條件必填 | `CUSTOM` 時必填，長度 1～500                           |
| `action.inventoryItemId` | UUID string 或 null | 條件必填 | `USE_ITEM` 時必填                                      |
| `stateVersion`           | integer             | 是       | BTL-001 或上一回合回傳的版本                           |

攻擊：

```json
{
  "action": {
    "type": "ATTACK",
    "actionCode": "basic_attack",
    "actionText": null,
    "inventoryItemId": null
  },
  "stateVersion": 5
}
```

使用道具：

```json
{
  "action": {
    "type": "USE_ITEM",
    "actionCode": "use_item",
    "actionText": null,
    "inventoryItemId": "39afd082-81af-478a-85de-93994bde770e"
  },
  "stateVersion": 5
}
```

自行輸入：

```json
{
  "action": {
    "type": "CUSTOM",
    "actionCode": "custom_action",
    "actionText": "我退到竹影之間，以石階遮擋身形後再伺機出手。",
    "inventoryItemId": null
  },
  "stateVersion": 5
}
```

### 成功回傳

```http
201 Created
```

```json
{
  "turnId": "1e6ff86b-85d4-4799-84da-c1f9996354f1",
  "roundNo": 1,
  "narrative": "韓立借竹影掩護側身避開短刃，趁黑衣人重心不穩時一劍刺向其肩頭。",
  "playerState": {
    "hp": { "current": 82, "max": 100 },
    "mana": { "current": 42, "max": 60 },
    "effects": [
      {
        "effectCode": "body_protection",
        "name": "護體術",
        "remainingRounds": 1,
        "description": "靈力形成護體屏障。"
      }
    ]
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
  "availableActions": [
    {
      "type": "ATTACK",
      "actionCode": "basic_attack",
      "label": "攻擊"
    },
    {
      "type": "USE_ITEM",
      "actionCode": "use_item",
      "label": "使用道具"
    },
    {
      "type": "CUSTOM",
      "actionCode": "custom_action",
      "label": "自行輸入行動"
    }
  ],
  "stateVersion": 6
}
```

戰鬥勝利時，`battleStatus` 為 `VICTORY`，`rewards` 回傳已由後端放入儲物袋的戰利品；前端不需再呼叫領取 API。

### 主要狀態

| Status | 情境                                                                      |
| ------ | ------------------------------------------------------------------------- |
| `201`  | Provider 推演成功、驗證通過且結算完成                                     |
| `400`  | Action 欄位組合錯誤、UUID 或型別錯誤                                      |
| `401`  | 未登入或 token 過期                                                       |
| `404`  | 戰鬥、道具或角色不存在，或不屬於目前使用者                                |
| `409`  | 戰鬥已結束、`stateVersion` 過期，或同一回合狀態發生衝突                   |
| `422`  | 行動目前不可用、物品不足、法力不足，或固定 JSON 無對應案例                |
| `502`  | 固定 JSON／LLM 回傳資料不符合 Simulation contract，且沒有寫入任何遊戲狀態 |
| `503`  | 未來 LLM Provider 暫時無法服務，且沒有寫入任何遊戲狀態                    |
| `500`  | 結算或交易失敗；不得留下部分寫入                                          |

### Provider 邊界

前端不得直接呼叫固定 JSON 或 LLM。後端流程為：

```text
驗證玩家行動
→ 讀取角色、敵人、功法、效果、物品與地形
→ 建立 BattleSimulationContext
→ 呼叫 JsonBattleSimulationProvider（MVP）或 LlmBattleSimulationProvider（未來）
→ 驗證 BattleSimulationResult
→ 後端套用合法狀態變化
→ transaction 寫入 battle turn、角色、背包與戰利品
→ 回傳前端 API Response
```

---

## 10. CUL-001｜取得閉關修煉資料

```http
GET /api/v1/cultivation
```

### 前端提供參數

除共用 `Authorization` Header 外，不需提供其他參數。

### 成功回傳

```http
200 OK
```

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
    "pillToxicity": 0,
    "ageMonths": 216
  },
  "cultivationRate": {
    "basePerYear": 100,
    "modifiers": [
      {
        "sourceCode": "yellow_dragon_pill",
        "name": "黃龍丹",
        "percentage": 25
      },
      {
        "sourceCode": "current_cave",
        "name": "目前洞府",
        "percentage": 15
      }
    ]
  },
  "worldTime": {
    "year": 1,
    "season": "SPRING",
    "day": 12
  },
  "remainingLifespanMonths": 732,
  "availableDurations": [1, 6, 12],
  "availableActivities": ["CULTIVATE", "HEAL"],
  "availablePills": [
    {
      "inventoryItemId": "39afd082-81af-478a-85de-93994bde770e",
      "itemCode": "yellow_dragon_pill",
      "name": "黃龍丹",
      "quantity": 2,
      "description": "閉關時提高修練速度，不直接增加修為。"
    }
  ],
  "spiritStones": [
    {
      "inventoryItemId": "1c2200bb-0813-49e1-8613-f607945c23e4",
      "itemCode": "low_grade_spirit_stone",
      "name": "下品靈石",
      "quantity": 128,
      "manaRestoredPerItem": 10
    }
  ],
  "breakthrough": {
    "eligible": false,
    "type": "MINOR_REALM",
    "targetLevel": 4,
    "targetRealm": "練氣四層",
    "baseSuccessRate": 0.9,
    "requirements": [
      {
        "code": "CULTIVATION_EXP_NOT_ENOUGH",
        "description": "尚缺 280 修為。",
        "met": false
      }
    ],
    "failureRisk": "小境界突破失敗不扣除修為。"
  },
  "stateVersion": 6
}
```

### 主要狀態

| Status | 情境                           |
| ------ | ------------------------------ |
| `200`  | 成功取得閉關資料               |
| `401`  | 未登入或 token 過期            |
| `404`  | 角色不存在                     |
| `409`  | 角色正在戰鬥，不能進入閉關流程 |
| `500`  | 伺服器錯誤                     |

---

## 11. CUL-002｜試算閉關結果

```http
POST /api/v1/cultivation/previews
```

### 前端提供參數

#### Request Body

| 欄位                             | 型別        | 必填 | 說明                                        |
| -------------------------------- | ----------- | ---- | ------------------------------------------- |
| `activity`                       | string      | 是   | `CULTIVATE` 或 `HEAL`                       |
| `durationMonths`                 | integer     | 是   | 必須是 CUL-001 的 `availableDurations` 之一 |
| `pills`                          | array       | 是   | 不使用丹藥時傳空陣列                        |
| `pills[].inventoryItemId`        | UUID string | 是   | 丹藥的背包項目 ID                           |
| `pills[].quantity`               | integer     | 是   | 使用數量，大於 0                            |
| `spiritStones`                   | array       | 是   | 不使用靈石時傳空陣列                        |
| `spiritStones[].inventoryItemId` | UUID string | 是   | 靈石的背包項目 ID                           |
| `spiritStones[].quantity`        | integer     | 是   | 投入數量，大於 0                            |
| `stateVersion`                   | integer     | 是   | CUL-001 回傳的版本                          |

```json
{
  "activity": "CULTIVATE",
  "durationMonths": 6,
  "pills": [
    {
      "inventoryItemId": "39afd082-81af-478a-85de-93994bde770e",
      "quantity": 1
    }
  ],
  "spiritStones": [
    {
      "inventoryItemId": "1c2200bb-0813-49e1-8613-f607945c23e4",
      "quantity": 12
    }
  ],
  "stateVersion": 6
}
```

### 成功回傳

試算本身成功但遊戲條件不成立時，仍回傳 `200`，並以 `valid: false` 和 `validationErrors` 告知前端；試算不修改資料。

```http
200 OK
```

```json
{
  "previewToken": "f8dbfa85-a784-45d4-b5cb-f00b21067516",
  "expiresAt": "2026-09-02T09:05:00.000Z",
  "valid": true,
  "validationErrors": [],
  "activity": "CULTIVATE",
  "durationMonths": 6,
  "estimatedEndTime": {
    "year": 1,
    "season": "AUTUMN",
    "day": 12
  },
  "estimatedCultivationExp": 682,
  "estimatedHp": 86,
  "estimatedMana": 60,
  "estimatedRemainingLifespanMonths": 726,
  "resourceCosts": [
    {
      "inventoryItemId": "39afd082-81af-478a-85de-93994bde770e",
      "itemCode": "yellow_dragon_pill",
      "name": "黃龍丹",
      "quantity": 1
    },
    {
      "inventoryItemId": "1c2200bb-0813-49e1-8613-f607945c23e4",
      "itemCode": "low_grade_spirit_stone",
      "name": "下品靈石",
      "quantity": 12
    }
  ],
  "effectsToConsume": ["yellow_dragon_pill_cultivation_speed"],
  "breakthroughAvailableAfterSession": false,
  "warnings": ["世界時間將推進 6 個月。", "丹藥效果將於結算時消耗。", "結算後仍未達突破條件。"],
  "stateVersion": 6
}
```

### 主要狀態

| Status | 情境                                       |
| ------ | ------------------------------------------ |
| `200`  | 試算完成；規則不成立時使用 `valid: false`  |
| `400`  | 欄位格式錯誤、期間不是合法整數或 enum 錯誤 |
| `401`  | 未登入或 token 過期                        |
| `404`  | 角色或指定物品不存在                       |
| `409`  | `stateVersion` 過期或角色正在戰鬥          |
| `500`  | 試算程序錯誤                               |

---

## 12. CUL-003｜執行閉關或療傷

```http
POST /api/v1/cultivation/sessions
```

### 前端提供參數

#### Headers

| Header            | 必填 | 說明                                        |
| ----------------- | ---- | ------------------------------------------- |
| `Authorization`   | 是   | Bearer access token                         |
| `Content-Type`    | 是   | `application/json`                          |
| `Idempotency-Key` | 是   | 前端產生 UUID，每次新的正式閉關操作使用新值 |

#### Request Body

| 欄位           | 型別        | 必填 | 說明                           |
| -------------- | ----------- | ---- | ------------------------------ |
| `previewToken` | UUID string | 是   | CUL-002 回傳且尚未過期的 token |
| `stateVersion` | integer     | 是   | CUL-002 回傳的版本             |

```json
{
  "previewToken": "f8dbfa85-a784-45d4-b5cb-f00b21067516",
  "stateVersion": 6
}
```

後端不得直接採信預覽值；必須重新檢查角色狀態、資源數量、效果與時間，再以 transaction 完成所有寫入。

### 成功回傳

```http
201 Created
```

```json
{
  "sessionId": "c97fa66c-c715-4ca9-8edc-0ed8b2c058ad",
  "activity": "CULTIVATE",
  "elapsedMonths": 6,
  "cultivationGained": 62,
  "hpRecovered": 0,
  "manaRecovered": 18,
  "resourcesConsumed": [
    {
      "inventoryItemId": "39afd082-81af-478a-85de-93994bde770e",
      "itemCode": "yellow_dragon_pill",
      "name": "黃龍丹",
      "quantity": 1
    },
    {
      "inventoryItemId": "1c2200bb-0813-49e1-8613-f607945c23e4",
      "itemCode": "low_grade_spirit_stone",
      "name": "下品靈石",
      "quantity": 12
    }
  ],
  "effectsApplied": [],
  "events": [
    {
      "eventCode": "cultivation_session_completed",
      "summary": "韓立閉關六個月，修為增加 62。"
    }
  ],
  "character": {
    "level": 3,
    "realm": "練氣三層",
    "cultivationExp": 682,
    "nextLevelExp": 900,
    "currentHp": 86,
    "maxHp": 100,
    "currentMana": 60,
    "maxMana": 60,
    "pillToxicity": 5,
    "ageMonths": 222
  },
  "worldTime": {
    "year": 1,
    "season": "AUTUMN",
    "day": 12
  },
  "breakthrough": {
    "eligible": false,
    "targetLevel": 4,
    "targetRealm": "練氣四層"
  },
  "stateVersion": 7
}
```

### 主要狀態

| Status | 情境                                             |
| ------ | ------------------------------------------------ |
| `201`  | 正式結算完成                                     |
| `400`  | `previewToken` 或 `stateVersion` 格式錯誤        |
| `401`  | 未登入或 token 過期                              |
| `404`  | 角色或 preview 不存在                            |
| `409`  | Preview 過期、已使用、版本過期，或角色狀態已改變 |
| `422`  | 預覽後資源不足、效果失效或其他遊戲條件不再成立   |
| `500`  | 交易失敗；不得留下部分扣除或部分時間推進         |

---

## 13. CUL-004｜嘗試境界突破

```http
POST /api/v1/cultivation/breakthrough-attempts
```

突破由後端遊戲規則判定，不交給戰鬥 LLM。失敗是合法的遊戲結果，因此突破失敗仍回傳 `201`，不是 HTTP 錯誤。

### 前端提供參數

#### Headers

| Header            | 必填 | 說明                                    |
| ----------------- | ---- | --------------------------------------- |
| `Authorization`   | 是   | Bearer access token                     |
| `Content-Type`    | 是   | `application/json`                      |
| `Idempotency-Key` | 是   | 前端產生 UUID，每次新的突破嘗試使用新值 |

#### Request Body

| 欄位                             | 型別        | 必填 | 說明                          |
| -------------------------------- | ----------- | ---- | ----------------------------- |
| `supportItems`                   | array       | 是   | 不使用輔助物品時傳空陣列      |
| `supportItems[].inventoryItemId` | UUID string | 是   | 輔助物品的背包項目 ID         |
| `supportItems[].quantity`        | integer     | 是   | 使用數量，大於 0              |
| `stateVersion`                   | integer     | 是   | CUL-001 或 CUL-003 回傳的版本 |

```json
{
  "supportItems": [],
  "stateVersion": 7
}
```

MVP 小境界突破可傳空陣列。保留 `supportItems` 是為了後續大境界突破所需的築基丹等資源，不需要另開 API。

### 成功回傳：突破成功

```http
201 Created
```

```json
{
  "attemptId": "f688b45e-f15c-4912-8dba-07b472b38779",
  "success": true,
  "breakthroughType": "MINOR_REALM",
  "previousLevel": 3,
  "currentLevel": 4,
  "previousRealm": "練氣三層",
  "currentRealm": "練氣四層",
  "successRate": 0.9,
  "cultivationExpBefore": 900,
  "cultivationExpAfter": 0,
  "resourcesConsumed": [],
  "losses": [],
  "effectsApplied": [],
  "retryAllowed": false,
  "narrative": "靈力衝破瓶頸，在經脈中形成更穩定的循環。韓立成功踏入練氣四層。",
  "stateVersion": 8
}
```

### 成功回傳：突破失敗

```http
201 Created
```

```json
{
  "attemptId": "f688b45e-f15c-4912-8dba-07b472b38779",
  "success": false,
  "breakthroughType": "MINOR_REALM",
  "previousLevel": 3,
  "currentLevel": 3,
  "previousRealm": "練氣三層",
  "currentRealm": "練氣三層",
  "successRate": 0.9,
  "cultivationExpBefore": 900,
  "cultivationExpAfter": 900,
  "resourcesConsumed": [],
  "losses": [],
  "effectsApplied": [],
  "retryAllowed": true,
  "narrative": "靈力在瓶頸前震盪片刻後重新平復。此次突破失敗，但修為並未損失。",
  "stateVersion": 8
}
```

### 主要狀態

| Status | 情境                                                |
| ------ | --------------------------------------------------- |
| `201`  | 突破嘗試已結算；以 `success` 表示遊戲結果           |
| `400`  | Request 格式、UUID 或數量錯誤                       |
| `401`  | 未登入或 token 過期                                 |
| `404`  | 角色或輔助物品不存在                                |
| `409`  | `stateVersion` 過期、角色正在戰鬥／閉關，或重複結算 |
| `422`  | 尚未達突破條件、輔助物品不足或不適用目前突破        |
| `500`  | 突破結算交易失敗；不得留下部分消耗                  |

---

## 14. Server 內部戰鬥推演 Contract

本節不是前端 API。它定義固定 JSON Provider 與未來 LLM Provider 必須共同輸出的資料格式。

### 14.1 BattleSimulationContext

Server 傳入 Provider 的上下文至少包含：

```json
{
  "battleId": "cfd3a94b-03ab-4228-af9f-da1584fa3a25",
  "battleCode": "novice_black_clothed_enemy",
  "roundNo": 1,
  "playerAction": {
    "type": "CUSTOM",
    "actionCode": "custom_action",
    "actionText": "我退到竹影之間，以石階遮擋身形後再伺機出手。",
    "item": null
  },
  "player": {
    "name": "韓立",
    "realm": "練氣三層",
    "hp": { "current": 86, "max": 100 },
    "mana": { "current": 42, "max": 60 },
    "attributes": {
      "attack": 18,
      "spellPower": 24,
      "defense": 12,
      "speed": 31,
      "spiritualSense": 8
    },
    "skills": [],
    "effects": []
  },
  "enemy": {
    "enemyCode": "black_clothed_enemy",
    "name": "黑衣人",
    "realm": "未知",
    "hp": { "current": 54, "max": 54 },
    "mana": { "current": 23, "max": 23 },
    "attributes": {
      "attack": 16,
      "spellPower": 12,
      "defense": 10,
      "speed": 24,
      "spiritualSense": 5
    },
    "effects": []
  },
  "environment": {
    "terrainCode": "bamboo_forest",
    "terrainName": "竹林",
    "description": "竹林狹窄且帶有薄霧。"
  },
  "recentTurns": []
}
```

### 14.2 BattleSimulationResult

```json
{
  "narrative": "韓立借竹影掩護側身避開短刃，趁黑衣人重心不穩時一劍刺向其肩頭。",
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

### 14.3 Provider 規則

- Provider 只能提出結果，不可直接寫入資料庫。
- Server 必須用 Zod 或等價 schema 驗證完整結果。
- Server 必須限制 HP／Mana 最終值在合法範圍內。
- `itemsToConsume` 必須是本回合合法選擇且玩家確實持有的物品。
- `rewards` 只能來自後端允許的敵人掉落池；不得接受 LLM 任意產生物品。
- `VICTORY`、`DEFEAT`、`ESCAPED` 必須符合結算後狀態。
- Provider 驗證失敗時回傳 `502`，不得寫入 battle turn、角色、背包或時間線。
- 固定 JSON Provider 應以 `battleCode + roundNo + action.type + action.actionCode` 尋找 fixture。

### 14.4 MVP 固定 JSON Fixture 範例

```json
{
  "battleCode": "novice_black_clothed_enemy",
  "roundNo": 1,
  "actionType": "ATTACK",
  "actionCode": "basic_attack",
  "result": {
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
}
```

未來接入 LLM 時只替換 Provider 實作，不修改 BTL-001、BTL-002、`BattleSimulationContext` 或 `BattleSimulationResult` 的公開語意。

## 15. MVP 不納入範圍

- 前端直接呼叫 LLM。
- LLM 直接寫入角色、戰鬥、儲物袋或時間線資料。
- 自由世界地圖、NPC 關係與宗門系統。
- 功法施放、逃跑與完整裝備系統；資料結構可預留，但第一階段不必開放操作。
- 煉丹、煉器、符籙、陣法與法寶製作 API。
- 額外的戰利品領取 API；勝利結算直接放入儲物袋。

## 16. 實作時的 Contract 原則

- `packages/contracts` 的 Zod schema 是 Request／Response 唯一資料來源。
- DTO 必須由 Zod schema 推導，不重複建立前端 interface 或後端 DTO。
- OpenAPI path、method、request、response 與 status code 必須與本文件一致。
- Express Route、前端呼叫與 Swagger 都使用同一份 contracts。
- Server 不得將資料庫 Entity、Provider 原始錯誤、Prompt、stack trace 或未驗證的 LLM 原始輸出直接回傳前端。
