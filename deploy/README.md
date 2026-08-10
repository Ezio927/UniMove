# UniMove 部署说明

## 环境要求

## 部署步骤

### 1. 启动 MongoDB
```bash
# 使用 Docker (推荐)
docker run -d --name mongodb -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=replace-with-a-strong-password mongo:7.0
```

### 2. 启动后端
```bash
cd backend
npm install --production
node dist/index.js
```

### 3. 提供前端服务
```bash
# 使用 serve (推荐)
npx serve frontend/dist -p 80

# 或使用 Python
cd frontend/dist
python -m http.server 80

# 或使用 nginx
# 将 frontend/dist 目录配置为 nginx 根目录
```

## 访问地址
- 前端: http://localhost
- 后端 API: http://localhost:3001

## 数据库配置
连接密码必须与启动 MongoDB 时设置的 `MONGO_INITDB_ROOT_PASSWORD` 一致。
