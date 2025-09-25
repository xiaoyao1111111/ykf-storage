# TiDB Cloud 部署指南

## 当前状态

由于 Vercel API 部署遇到问题，系统目前使用 **Firebase + 本地存储** 的智能回退机制。

## 部署步骤

### 1. 部署 API 服务到 Vercel（可选）

如果你想使用 TiDB Cloud，需要正确部署 API 服务：

1. 访问 [https://vercel.com](https://vercel.com)
2. 用 GitHub 账号登录
3. 点击 "New Project"
4. 选择你的 `ykf-storage` 仓库
5. 在项目设置中：
   - Framework Preset: `Other`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. 确保 `api/` 文件夹在根目录
7. 点击 "Deploy"

### 2. 验证 API 部署

部署完成后，访问：
- `https://你的域名.vercel.app/api/test` - 应该返回 JSON 响应
- 如果返回 404，说明 API 路由没有正确部署

### 2. 获取 API 地址

部署完成后，你会得到一个 Vercel 域名，例如：
`https://ykf-storage-xxx.vercel.app`

### 3. 更新前端 API 地址

在 `src/tidb-api.js` 文件中，更新 `API_BASE_URL`：

```javascript
const API_BASE_URL = 'https://你的vercel域名.vercel.app/api'
```

### 4. 重新部署前端

```bash
git add .
git commit -m "更新 TiDB API 地址"
git push
```

## 系统架构

```
前端 (GitHub Pages) 
    ↓ HTTP API
Vercel API 服务
    ↓ MySQL 连接
TiDB Cloud 数据库
```

## 功能特性

- ✅ **TiDB Cloud 优先**：数据存储在 TiDB Cloud
- ✅ **智能回退**：API 不可用时回退到 Firebase 或本地存储
- ✅ **数据备份**：同时保存到本地存储作为备份
- ✅ **跨设备同步**：通过 TiDB Cloud 实现数据同步
- ✅ **国内访问**：TiDB Cloud 在国内访问稳定

## 测试步骤

1. 访问前端网站
2. 登录系统（用户名：姚凯峰，密码：root）
3. 添加一条记录
4. 检查页面显示 "TiDB 云端"
5. 用另一个设备访问，应该能看到相同的数据

## 故障排除

如果显示 "本地存储" 而不是 "TiDB 云端"：
1. 检查 Vercel API 服务是否正常运行
2. 检查 API 地址是否正确
3. 查看浏览器控制台是否有错误信息
