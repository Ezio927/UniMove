@echo off
chcp 65001 > nul
echo.
echo ===================================
echo   UniMove 项目本地打包脚本
echo ===================================
echo.

echo [1/4] 清理之前的构建产物...
if exist "backend\dist" rd /s /q "backend\dist"
if exist "frontend\dist" rd /s /q "frontend\dist"
if exist "deploy" rd /s /q "deploy"
echo ✓ 清理完成

echo.
echo [2/4] 构建后端项目...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 后端构建失败
    pause
    exit /b 1
)
echo ✓ 后端构建完成
cd ..

echo.
echo [3/4] 构建前端项目...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 前端构建失败
    pause
    exit /b 1
)
echo ✓ 前端构建完成
cd ..

echo.
echo [4/4] 创建部署包...
if not exist "deploy" mkdir deploy
if not exist "deploy\backend" mkdir deploy\backend
if not exist "deploy\frontend" mkdir deploy\frontend

echo 正在复制文件...
xcopy "backend\dist" "deploy\backend\dist\" /E /I /Q
copy "backend\package.json" "deploy\backend\"
copy "backend\.env.production" "deploy\backend\.env"
xcopy "frontend\dist" "deploy\frontend\dist\" /E /I /Q
copy "docker-compose.yml" "deploy\"
if exist "init-mongo.js" copy "init-mongo.js" "deploy\"

echo 创建运行脚本...
(
echo @echo off
echo echo 启动 UniMove 项目...
echo echo.
echo echo 请确保 MongoDB 正在运行 (端口 27017^)
echo echo 或使用命令: docker run -d --name mongodb -p 27017:27017 mongo:7.0
echo echo.
echo cd backend
echo npm install --production
echo start /b node dist/index.js
echo cd ..
echo echo 后端已启动 (端口 3001^)
echo echo 前端请使用 Web 服务器提供 frontend/dist 目录
echo echo 建议使用: npx serve frontend/dist -p 80
echo pause
) > "deploy\start.bat"

echo 创建 README...
(
echo # UniMove 部署说明
echo.
echo ## 环境要求
echo - Node.js >= 16.0.0
echo - MongoDB >= 4.4
echo.
echo ## 部署步骤
echo.
echo ### 1. 启动 MongoDB
echo ```bash
echo # 使用 Docker (推荐^)
echo docker run -d --name mongodb -p 27017:27017 ^
echo   -e MONGO_INITDB_ROOT_USERNAME=admin ^
echo   -e MONGO_INITDB_ROOT_PASSWORD=replace-with-a-strong-password ^
echo   mongo:7.0
echo ```
echo.
echo ### 2. 启动后端
echo ```bash
echo cd backend
echo npm install --production
echo node dist/index.js
echo ```
echo.
echo ### 3. 提供前端服务
echo ```bash
echo # 使用 serve (推荐^)
echo npx serve frontend/dist -p 80
echo.
echo # 或使用 Python
echo cd frontend/dist
echo python -m http.server 80
echo.
echo # 或使用 nginx
echo # 将 frontend/dist 目录配置为 nginx 根目录
echo ```
echo.
echo ## 访问地址
echo - 前端: http://localhost
echo - 后端 API: http://localhost:3001
echo.
echo ## 数据库配置
echo 连接密码请使用启动 MongoDB 时设置的 MONGO_INITDB_ROOT_PASSWORD
) > "deploy\README.md"

echo.
echo ===================================
echo        🎉 打包完成！
echo ===================================
echo.
echo 📦 部署包位置：deploy\ 目录
echo.
echo 📁 包含文件：
echo   - backend\dist\     (后端构建产物)
echo   - frontend\dist\    (前端构建产物)
echo   - start.bat         (启动脚本)
echo   - README.md         (部署说明)
echo.
echo 🚀 部署方式：
echo   1. 复制 deploy\ 目录到目标服务器
echo   2. 运行 start.bat 启动服务
echo   3. 或参考 README.md 手动部署
echo.
echo ✨ 访问地址：
echo   - 前端：http://localhost
echo   - 后端 API：http://localhost:3001
echo.
pause
