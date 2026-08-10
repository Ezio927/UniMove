# 使用官方 Node.js 镜像
FROM node:22-alpine AS build

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖（包括开发依赖，用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建 TypeScript 项目
RUN npm run build

RUN npm prune --omit=dev

FROM node:22-alpine AS runtime

WORKDIR /app

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# 暴露端口
EXPOSE 3001

# 设置环境变量
ENV NODE_ENV=production

# 启动命令（使用构建后的 JS 文件）
CMD ["node", "dist/index.js"]
