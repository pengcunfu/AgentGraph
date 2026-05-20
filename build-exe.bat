@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo 正在打包 Windows 安装程序，请稍候...
call npm run dist:win
if %ERRORLEVEL% equ 0 (
  echo.
  echo 打包完成！
  echo 安装包: dist\AgentGraph DrawIO-Setup-1.0.0.exe
  echo 绿色版: dist\win-unpacked\AgentGraphDrawIO.exe
  explorer dist
) else (
  echo 打包失败，错误码 %ERRORLEVEL%
)
pause
