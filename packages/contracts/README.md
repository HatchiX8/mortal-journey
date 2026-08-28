# API Contracts 開發說明

`@mortal-journey/contracts` 是前端與後端共用的 API 契約 workspace。它不依賴任何應用程式，並集中管理 Zod schema、由 schema 推導的 DTO，以及 OpenAPI document。

## 先記住這件事

日常開發只需要在 `packages/contracts` 維護 API 契約：

- `*.schema.ts`：資料欄位與 runtime 驗證規則，是資料結構的唯一來源。
- `*.dto.ts`：使用 `z.infer` 從 schema 推導 TypeScript type，不重複宣告欄位。
- `*.openApi.ts`：描述 API path、HTTP method、request、response 與 status code。

後端會匯入 contracts 產生的 `openApiDocument`：

- `/api-docs.json` 直接回傳 OpenAPI JSON。
- `/api-docs` 由 Swagger UI 讀取同一份 OpenAPI document，產生可閱讀及發送測試請求的網頁。

不需要手寫 Swagger 頁面，也不要另外維護 `openapi.yaml` 或另一份 API 文件。

## 實際運作流程

```text
*.schema.ts（唯一資料結構）
├─ z.infer → TypeScript DTO
├─ 前端 → 型別與外部資料驗證
├─ 後端 → request／response 驗證
└─ *.openApi.ts → openApiRegistry
                         ↓
                  openApiDocument
                    ├─ /api-docs.json
                    └─ Swagger UI /api-docs
```

Swagger UI 不會掃描 Express route，也不會自行猜測 API。每個 API 仍要同時完成兩件事：

1. 在後端建立實際執行的 Express route。
2. 在 contracts 的 `*.openApi.ts` 註冊對應文件。

schema 欄位修改後，DTO 與 OpenAPI schema 會同步更新；API path、method、status code 或說明有變更時，必須同步修改 `*.openApi.ts`。

## 結構

```text
src/
├─ common/
│  ├─ schemas/                  # 跨模組 runtime schema
│  └─ types/                    # 從 schema 推導的共用 DTO
├─ modules/
│  └─ system/                   # 已存在的健康檢查 API 契約
│     ├─ health.schema.ts
│     ├─ health.dto.ts
│     └─ health.openApi.ts
├─ openApi/
│  ├─ registry.ts               # 收集 component 與 API path
│  └─ document.ts               # 產生完整 OpenAPI document
├─ index.ts                     # contracts 對外匯出入口
└─ zod.ts                       # 已掛載 OpenAPI 擴充的共用 Zod 入口
```

所有目錄使用小駝峰命名，例如 `openApi`。

## 新增或修改 API

### 只修改資料欄位

例如新增 response 欄位，只修改對應 `*.schema.ts`。DTO 由 `z.infer` 推導，OpenAPI schema 也使用同一份 Zod schema，不需要再重寫欄位。

### 新增 API

1. 在 `src/modules/<module>` 新增 request 與 response schema。
2. 在相鄰的 `*.dto.ts` 使用 `z.infer<typeof XXXSchema>` 匯出 DTO type。
3. 在 `*.openApi.ts` 使用 `openApiRegistry.registerPath` 註冊 path、method、參數、request body、response 與 status code。
4. 在模組 `index.ts` 匯出 schema 與 DTO，並確認 OpenAPI document 載入該模組的 `*.openApi.ts`。
5. 在後端建立實際 route，使用相同 schema 驗證 request／response。
6. 前端只需要型別時使用 `import type`；需要 runtime validation 時才匯入 schema。
7. 啟動後端，前往 `/api-docs` 確認文件與測試請求是否正確。

新增 API 時只修改此 package 的契約，不要另外建立或同步維護 Swagger、OpenAPI YAML、前端 interface 或後端 DTO。

## 最小範例

### Schema

所有會提供給 OpenAPI 的 schema 必須使用 contracts 已初始化的 Zod，不要直接從 `zod` 建立：

```ts
import { z } from '../../zod.js'

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
})
```

`src/zod.ts` 會先掛載 OpenAPI 擴充。繞過這個入口可能使 OpenAPI registry 在 runtime 無法處理 schema。

### DTO

```ts
import type { z } from 'zod'

import type { HealthResponseSchema } from './health.schema.js'

export type HealthResponseDto = z.infer<typeof HealthResponseSchema>
```

### 前後端共用引用

```ts
import { HealthResponseSchema } from '@mortal-journey/contracts'
import type { HealthResponseDto } from '@mortal-journey/contracts'
```

### 僅後端的 OpenAPI 引用

```ts
import { openApiDocument } from '@mortal-journey/contracts/openApi'
```

`openApiDocument` 只由後端匯入，用於 `/api-docs.json` 與 Swagger UI。前端不需要、也不得匯入 `@mortal-journey/contracts/openApi`。

## 完成前檢查

- schema 是否只有一份，DTO 是否由 `z.infer` 推導。
- `*.openApi.ts` 的 path、method、request、response 與實際 Express route 是否一致。
- 新模組的 `*.openApi.ts` 是否已由 `openApi/document.ts` 載入。
- schema 與 DTO 是否已從模組及 package 的 `index.ts` 匯出。
- `/api-docs.json` 是否包含新增或修改的 API。
- `/api-docs` 是否能正確顯示並發送測試請求。
- `npm run format:check`、`npm run lint` 與 `npm run build` 是否通過。
