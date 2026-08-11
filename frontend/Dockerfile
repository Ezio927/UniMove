# 多阶段构建：第一阶段 - 构建应用
FROM node:22-alpine AS build

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建生产版本
RUN npm run build

# 第二阶段 - 运行时环境（使用 nginx 提供静态文件服务）
FROM nginx:alpine

# 删除默认的 nginx 静态文件
RUN rm -rf /usr/share/nginx/html/*

# 复制构建产物到 nginx 静态文件目录
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/health || exit 1

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
