# 前端開發說明

「凡人・遨遊天地」前端使用 Vue 3、Vite 與 TypeScript，並採用以功能為優先的模組化結構。

共同安裝、啟動與品質檢查指令請閱讀 [repository 根 README](../../README.md)。

## 資料夾結構

`pages` 是路由入口；頁面專用內容與頁面放在同一個模組，跨頁功能才提升至 `features` 或 `shared`。

```text
src/
├─ app/                         # 應用初始化與全域基礎設施
│  ├─ config/                  # Naive UI、Tailwind 等全域設定
│  └─ router/                  # Vue Router 設定
├─ pages/                       # 路由頁面模組
│  └─ home/
│     └─ HomePage.vue          # 路由入口元件
├─ features/                    # 跨頁面的業務功能，需要時建立
├─ shared/                      # 無業務歸屬的共用程式，需要時建立
│  ├─ api/                     # Axios instance、interceptors
│  ├─ components/              # 跨頁共用 UI 元件
│  ├─ composables/             # 跨頁共用組合式函式
│  ├─ schemas/                 # 共用 Zod schemas
│  ├─ types/                   # 共用 TypeScript 型別
│  ├─ constants/               # 共用常數
│  └─ utils/                   # 無副作用的純函式
├─ layouts/                     # 跨頁共用版型，需要時建立
├─ assets/                      # 靜態資源
├─ App.vue                      # 根元件與全域 Provider
├─ main.ts                      # Vue 應用啟動入口
└─ style.css                    # 全域 CSS 入口
```

未使用的資料夾不需要預先建立；第一次出現實際程式碼時再新增。

## 頁面模組規格

每個路由使用一個具名資料夾與明確的 `*Page.vue` 入口。不要使用 `page1`、`page2` 等無法表達用途的名稱。

```text
pages/cultivation/
├─ CultivationPage.vue          # 組裝頁面，不放複雜業務邏輯
├─ api/                         # 僅此頁使用的 API 函式
├─ components/                  # 僅此頁使用的 UI 元件
├─ composables/                 # 此頁可重用的流程與狀態邏輯
├─ stores/                      # 此頁多個元件共享的 Pinia 狀態
├─ schemas/                     # Zod runtime validation
├─ types/                       # TypeScript 型別
├─ constants/                   # 固定選項、狀態與對照資料
└─ utils/                       # 僅此頁使用的純函式
```

這些子資料夾也是按需建立。單一型別或單一 API 可以先用具名檔案；內容增加後再拆成資料夾。

## 程式碼應該放哪裡

| 情況                               | 放置位置                                         |
| ---------------------------------- | ------------------------------------------------ |
| Vue Router 直接載入的頁面          | `pages/<module>/*Page.vue`                       |
| 只有一個頁面使用                   | 該頁面的 `components`、`api`、`types` 等子資料夾 |
| 同一業務功能跨越多個頁面           | `features/<feature>`                             |
| 與業務無關且跨模組共用             | `shared`                                         |
| 全域初始化、Provider、Router、主題 | `app`                                            |
| 多個頁面共用的外框                 | `layouts`                                        |

不要因為「以後可能共用」就提前放進 `shared`。確認第二個使用端出現，再提升到共用層。

## 依賴方向

```text
app → pages → features → shared
```

- 下層不得反向引用上層。
- `pages` 之間不得直接互相引用。
- 頁面共用的業務邏輯移至 `features`。
- 共用 UI 或純工具移至 `shared`。
- UI 元件不直接呼叫 API；資料流由 page 組裝，透過 composable 或 store 呼叫 API。

建議資料流：

```text
Page → composable/store → page api or feature → shared api client
```

## 前端工具規範

### Naive UI

- 一般元件必須在使用它的 `.vue` 檔明確 import，例如 `import { NButton } from 'naive-ui'`。
- 全域 Provider、語系與主題設定集中在 `app/config/naive-ui.ts`，由 `main.ts` 掛載。
- 頁面元件不得自行建立另一套全域 Provider。

### Tailwind CSS

- 優先使用 Tailwind utility class 切版。
- 共用色彩 token 位於 `app/config/tailwind-theme.css`。
- 可直接使用 `text-primary`、`bg-primary`、`text-danger` 等語意化 class。
- 儲存時由 Prettier 自動排序 Tailwind class。

### TypeScript 與狀態

- props、API payload、store 與共用資料結構應有明確型別。
- 不使用 `any` 掩蓋尚未確認的資料。
- API request／response 的 schema 與 DTO 從 [`packages/contracts`](../../packages/contracts/README.md) 匯入，不在前端重複宣告相同 interface。
- 只使用型別時採用 `import type`；需要 runtime validation 時匯入對應 Zod schema。
- 前端不得匯入 `@mortal-journey/game-rules`；遊戲規則由後端驗證，畫面只顯示後端計算結果，disabled 狀態不能取代後端驗證。
- 只有多個元件需要共享狀態時才建立 Pinia store。
- 元件透過 store action 修改狀態，不直接繞過 action 改寫共享資料。

## 新增頁面的基本流程

1. 建立 `pages/<module>/<Name>Page.vue`。
2. 在 `app/router/index.ts` 新增路由。
3. 先在頁面內完成簡單畫面；內容有清楚責任後再拆成 `components` 或 `composables`。
4. 只有跨頁共用時才移至 `features` 或 `shared`。
5. 完成後回到 repository 根目錄執行格式、lint 與 build 檢查。
