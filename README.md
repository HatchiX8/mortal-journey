# 凡人・遨遊天地

文字修仙網頁遊戲 Monorepo。前端與後端保留獨立的應用設定、啟動方式與部署入口，並在 repository 根目錄共用套件管理與品質檢查指令。

## Repository 結構

```text
mortal-journey/
├─ apps/
│  ├─ web/       # Vue 前端
│  └─ server/    # Express API
├─ packages/
│  ├─ contracts/ # 共用 Zod schema、DTO 與 OpenAPI document
│  └─ gameRules/ # 後端使用的純遊戲領域規則
├─ package.json  # Monorepo scripts 與 npm workspaces
└─ README.md     # 專案介紹與共同開發入口
```

各應用的內部結構與開發規範請閱讀：

- [前端開發說明](apps/web/README.md)
- [後端開發說明](apps/server/README.md)

## 技術選型

### 前端

- Vue 3、Vite、TypeScript
- Vue Router、Pinia
- Naive UI（元件明確按需匯入）
- Tailwind CSS
- Axios、Zod

### 後端

- Node.js、Express、TypeScript
- CORS、dotenv
- tsx 開發執行環境

### 前後端共用契約

- `@mortal-journey/contracts`
- Zod schema 推導 TypeScript DTO
- OpenAPI document 與 Swagger UI

### 遊戲規則

- `@mortal-journey/game-rules`：純領域規則與規則型別
- 目前只由 `apps/server` 相依；`apps/web` 不得直接匯入，僅顯示後端計算結果

### 共用品質工具

- ESLint
- Prettier
- Tailwind CSS class 自動排序

## 環境需求

- Node.js 20 以上
- npm 10 以上

## 安裝

在 repository 根目錄執行：

```powershell
npm install
```

CI 或乾淨安裝環境使用：

```powershell
npm ci
```

只維護 repository 根目錄的 `package-lock.json`；不要在 `apps/*` 或 `packages/*` 個別執行安裝或提交子目錄 lockfile。

## 啟動開發環境

使用一個終端機同步啟動前端與後端：

```powershell
npm run dev
```

需要單獨啟動時：

```powershell
npm run dev:web
npm run dev:server
```

- 前端預設由 Vite 顯示實際開發網址。
- 後端預設為 `http://localhost:3000`。
- 健康檢查端點為 `GET /api/health`。
- Swagger UI 為 [http://localhost:3000/api-docs](http://localhost:3000/api-docs)。

## 共同指令

```powershell
# 自動格式化前後端
npm run format

# 檢查格式
npm run format:check

# 檢查程式碼品質
npm run lint

# 建置前端並檢查後端 TypeScript
npm run build
```

提交變更前至少執行：

```powershell
npm run format:check
npm run lint
npm run build
```

## Git 分支與 Pull Request 流程

`main` 是前端、後端與共用 packages 的共同穩定分支。開發者不得直接在 `main` 開發、解衝突或 push。每項工作從最新的 `main` 建立一條包含開發者名稱與工作內容的短期功能分支：

```text
main
└─ feature/hatchi-web-home-layout
```

分支命名格式為 `feature/<developer>-<scope>-<description>`；修正問題時使用 `fix/<developer>-<scope>-<description>`：

```text
feature/hatchi-web-home-layout
feature/hatchi-server-player-api
fix/hatchi-web-header-spacing
```

開始工作前，先更新 `main`，再建立短期功能分支：

```powershell
git switch main
git pull
git switch -c feature/hatchi-web-home-layout
```

所有開發與 commit 都在該短期功能分支進行：

```powershell
git add .
git commit -m "feat: complete home layout"
```

準備交付時，在短期功能分支同步最新的 `main`。所有衝突都在短期功能分支解決，不直接修改 `main`：

```powershell
git fetch origin
git switch feature/hatchi-web-home-layout
git merge origin/main
```

完成衝突處理後執行驗證：

```powershell
npm run format:check
npm run lint
npm run build
```

確認功能與驗證均正常後，push 短期功能分支：

```powershell
git push -u origin feature/hatchi-web-home-layout
```

接著在 GitHub 建立由 `feature/hatchi-web-home-layout` 合併至 `main` 的 Pull Request（PR）。開發者不得自行將分支直接 merge 至 `main`；由指定維護者 review 程式碼與驗證結果，確認無誤後執行 merge。PR 合併後刪除短期功能分支，下次工作重新從最新的 `main` 建立分支。

## 開發原則

- 前後端內部架構由各自的 README 定義，根 README 不重複維護細節。
- 共用 DTO、enum 與 API contract 放入 `packages/contracts`，前端與後端不得反向引用另一個應用的原始碼。
- 遊戲規則放入 `packages/gameRules`，保持純領域邏輯；後端負責玩家狀態、HTTP 與資料存取流程。
- `package.json`、lockfile、workspace 與 migration 相關變更需要人工 review。
