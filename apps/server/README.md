# 後端開發說明

「凡人・遨遊天地」後端目前使用 Express 與 TypeScript，提供 REST API。

共同安裝、啟動與品質檢查指令請閱讀 [repository 根 README](../../README.md)。

## 目前結構

後端仍在最小開發環境階段，目前只有應用入口、健康檢查 API 與 Swagger UI：

```text
apps/server/
├─ src/
│  └─ index.ts          # Express 初始化、middleware 與啟動入口
├─ .env.example         # 環境變數範例
├─ eslint.config.js
├─ package.json
└─ tsconfig.json
```

`GET /api/health` 可用來確認服務是否正常啟動。

## API 文件與 Contracts

啟動後端後，可使用下列網址：

- Swagger UI：[http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- OpenAPI JSON：[http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

前後端共用的 schema、DTO 與 OpenAPI 定義都位於 [`packages/contracts`](../../packages/contracts/README.md)。Swagger UI 直接讀取該 package 產生的 `openApiDocument`，因此後端不得複製或維護另一份 OpenAPI JSON/YAML。

後端使用 contracts 的方式：

```ts
import { HealthResponseSchema } from '@mortal-journey/contracts'
import { openApiDocument } from '@mortal-journey/contracts/openApi'

const responseBody = HealthResponseSchema.parse({ status: 'ok' })
```

`@mortal-journey/contracts` 只匯出前後端共用的 schema 與 DTO；`@mortal-journey/contracts/openApi` 只供後端取得 OpenAPI document 與 registry。前端不得匯入 `openApi` subpath。

新增 request 的 `params`、`query` 或 `body` 時，也要在 route 邊界使用對應 schema 驗證；不要另建重複的後端 DTO 或 schema。

## 遊戲規則

純遊戲領域規則位於 [`packages/gameRules`](../../packages/gameRules/README.md)，目前只由後端相依：

```ts
import { qiRefiningRule } from '@mortal-journey/game-rules'
```

server 的 service 負責取得玩家資料、安排流程，並將必要資料交給規則函式判斷。`gameRules` 不負責 HTTP、Express、資料庫或玩家狀態；單純規則放 package，涉及 request、持久化或流程協調則留在 server。

## 模組增加後的目標結構

業務功能出現時，以領域模組分層。沒有實際程式碼的資料夾不需要預先建立。

```text
src/
├─ index.ts                         # 程序啟動入口
├─ app.ts                           # Express app 與 middleware 組裝，需要時建立
├─ config/                          # 環境與外部服務設定
├─ middleware/                      # 跨模組 middleware
├─ modules/
│  └─ cultivation/
│     ├─ cultivation.routes.ts      # 路由與 middleware 串接
│     ├─ cultivation.controller.ts  # HTTP 輸入、輸出與 status code
│     ├─ cultivation.service.ts     # 業務規則與流程
│     ├─ cultivation.repository.ts  # 資料庫存取，需要時建立
└─ shared/                          # 無領域歸屬的後端共用程式
   ├─ errors/
   ├─ types/
   └─ utils/
```

這是模組成長時的放置規則，不代表所有資料夾現在都必須存在。

## 各層責任

| 層級         | 責任                                             |
| ------------ | ------------------------------------------------ |
| `routes`     | 宣告 URL、HTTP method 與 middleware 順序         |
| `controller` | 解析 HTTP 輸入並回傳 HTTP response               |
| `service`    | 執行業務規則，不依賴 Express request／response   |
| `repository` | 封裝資料庫查詢與持久化                           |
| `contracts`  | 透過 `packages/contracts` 提供共用 schema 與 DTO |

## 依賴方向

```text
route → controller → service → repository
```

- 下層不得引用 Express 的 request 或 response。
- controller 不直接撰寫資料庫查詢。
- repository 不處理 HTTP status code 或 UI 文案。
- 模組之間不得直接讀取對方的 repository 實作。
- 跨模組 contract 應透過清楚的 service 或共用 DTO，而不是複製型別。

## 新增 API 的基本流程

1. 在 `modules/<module>` 建立或找到對應領域模組。
2. 在 `packages/contracts` 定義輸入與輸出 schema、DTO 與 OpenAPI path。
3. 在 service 實作業務規則。
4. 有資料庫需求時，透過 repository 存取資料。
5. controller 將 HTTP request 轉成 service 輸入並回傳結果。
6. routes 宣告 endpoint 與 middleware 順序。
7. 完成後回到 repository 根目錄執行 lint 與 build。

## 環境變數

複製 `.env.example` 為 `.env`，再依實際環境填入設定：

```powershell
Copy-Item .env.example .env
```

目前支援：

```text
PORT=3000
```

`.env` 不得提交至版本控制；新增環境變數時必須同步更新 `.env.example`，但不得放入密碼或 token。
