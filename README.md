# ykf-storage 存取系统（Vue 3 + Vite）

一个简单的本地存取登记系统，提供登录、登记与列表功能；使用浏览器 `localStorage` 作为轻量数据库。

## 预置用户
- 用户名：`姚凯峰`，密码：`root`
- 用户名：`笑笑`，密码：`5555`

## 字段说明
- 日期（必填）
- 品名（必填）
- 数量（必填）
- 客户名（可空）
- 电话后四位（可空）
- 登记人（必填，登录后默认填当前用户）

## 本地开发
```bash
npm install
npm run dev
```

## 构建
```bash
npm run build
npm run preview
```

## 部署到 GitHub Pages
1. 仓库设置（建议新建仓库并推送本项目）：
   - 分支：`main`
2. 按你的 GitHub 用户名和仓库名设置 `base`：
   - 方式一：临时命令行变量
     ```bash
     set VITE_BASE=/你的仓库名/
     npm run build
     ```
   - 方式二：在仓库根目录新建 `.env.production` 写入：
     ```
     VITE_BASE=/你的仓库名/
     ```
3. 自动部署（推荐）：
   - 使用内置的 GitHub Actions 工作流：`.github/workflows/pages.yml`
   - 将代码推送到 `main` 分支后会自动构建并发布到 GitHub Pages
   
   手动部署（可选）：
   ```bash
   npm run deploy
   ```
4. 在 GitHub 仓库 -> Settings -> Pages：
   - 若使用 Actions：将 Source 设置为 `GitHub Actions`
   - 若使用手动部署：将 Source 指向 `gh-pages` 分支。

完成后访问 `https://<你的GitHub用户名>.github.io/<你的仓库名>/`。

