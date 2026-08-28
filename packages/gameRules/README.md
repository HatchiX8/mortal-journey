# 遊戲規則套件

`@mortal-journey/game-rules` 是遊戲領域規則的唯一來源。目前只有後端使用它，但規則屬於整個遊戲核心，因此獨立於 Express 應用，未來可供其他非前端的執行端重用。

套件目錄使用 camelCase：`packages/gameRules`；npm 套件名稱則遵循 scoped package 慣例：`@mortal-journey/game-rules`。

## 責任邊界

- 可放：純靜態規則資料、無副作用的規則判斷函式、領域型別。
- 不可放：Express、HTTP request／response、資料庫、環境變數、玩家目前狀態、API DTO、UI 或任何副作用。
- `packages/contracts` 專責 schema、DTO 與 OpenAPI，不包含遊戲規則。
- 後端取得玩家資料與流程狀態後，才將必要資料傳入本套件進行規則判斷。

前端不得直接匯入本套件；畫面只顯示後端計算後的結果，且前端的 disabled 狀態不能取代後端驗證。

## 目前結構

```text
src/
├─ realms/
│  ├─ realm.types.ts       # 境界規則共用型別
│  ├─ qiRefining.rule.ts   # 煉氣期最小範本
│  └─ index.ts
└─ index.ts                # package 公開入口
```

## 新增規則

1. 在對應領域資料夾新增 TypeScript 規則檔，不使用 JSON、JSONC 或 YAML。
2. 使用明確型別描述規則資料；若有判斷函式，必須保持純函式與無副作用。
3. 由該資料夾的 `index.ts` 與 `src/index.ts` 明確匯出。
4. 僅在後端 service 或其他合法的非前端執行端匯入使用。

後端的匯入範例：

```ts
import { qiRefiningRule } from '@mortal-journey/game-rules'
```
