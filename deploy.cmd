@echo off
REM GitHub Pages 배포 스크립트
REM public/ 내용을 gh-pages 브랜치로 푸시하고 Pages를 활성화합니다.
setlocal
cd /d "%~dp0"

echo [1/3] 번들 빌드 중...
call npm.cmd run build
if errorlevel 1 exit /b 1

echo [2/3] gh-pages 브랜치 준비 중...
git subtree split --prefix public -b gh-pages
git push origin gh-pages --force

echo [3/3] GitHub Pages 활성화 중...
for /f "delims=" %%i in ('git config --get remote.origin.url') do set REPO_URL=%%i
echo 완료: %REPO_URL%
echo Pages 설정은 GitHub 저장소 Settings - Pages 에서 확인하세요.
endlocal
