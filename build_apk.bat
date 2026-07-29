@echo off
echo Starting RoadRescue APK Build (Force Reset)...

:: Set Java Home
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"

cd /d %~dp0android

echo.
echo Step 1: Stopping background processes...
call gradlew --stop

echo.
echo Step 2: Deleting corrupted build caches...
if exist .gradle (
    echo Deleting .gradle cache folder...
    rmdir /s /q .gradle
)
if exist app\build (
    echo Deleting app build folder...
    rmdir /s /q app\build
)

echo.
echo Step 3: Starting FRESH build (this may take longer as it downloads Gradle 8.8)...
call gradlew assembleDebug --no-daemon

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Build Successful!
    echo APK: android\app\build\outputs\apk\debug\app-debug.apk
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Build Failed! If error persists, please run:
    echo npm install expo-modules-core@latest
    echo ========================================
)
pause
