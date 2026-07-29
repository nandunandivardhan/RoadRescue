# RoadRescue Signed Release Rebuild Script
$ErrorActionPreference = "Stop"

echo "=== Step 1: Deleting old APK copies ==="
Remove-Item -Path "E:\RR\RoadRescue-StarSummit.apk" -ErrorAction SilentlyContinue
Remove-Item -Path "E:\RR\RoadRescue-StarSummit-v2.apk" -ErrorAction SilentlyContinue
Remove-Item -Path "E:\RR\RoadRescue-StarSummit-v3.apk" -ErrorAction SilentlyContinue
Remove-Item -Path "E:\RR\roadrescue-web\public\RoadRescue-StarSummit.apk" -ErrorAction SilentlyContinue
Remove-Item -Path "E:\RR\roadrescue-web\public\RoadRescue-StarSummit-v3.apk" -ErrorAction SilentlyContinue
Remove-Item -Path "E:\RR\roadrescue-web\dist\RoadRescue-StarSummit.apk" -ErrorAction SilentlyContinue
Remove-Item -Path "E:\RR\roadrescue-web\dist\RoadRescue-StarSummit-v3.apk" -ErrorAction SilentlyContinue
Remove-Item -Path "E:\RR\android\app\build\outputs\apk\release\app-release.apk" -ErrorAction SilentlyContinue
Remove-Item -Path "E:\RR\android\app\build\outputs\apk\debug\app-debug.apk" -ErrorAction SilentlyContinue

echo "=== Step 2: Stopping background gradle daemons ==="
$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
$env:ORG_GRADLE_PROJECT_reactNativeArchitectures="arm64-v8a" # Speed up compilation by compiling only active ARM64 ABI natively if possible
cd E:\RR\android
.\gradlew --stop

echo "=== Step 3: Deleting gradle and build caches ==="
Remove-Item -Recurse -Force ".gradle" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "app\build" -ErrorAction SilentlyContinue

echo "=== Step 4: Running gradlew clean ==="
.\gradlew clean

echo "=== Step 5: Generating FRESH Signed Production Release APK ==="
.\gradlew assembleRelease --no-daemon

echo "=== Step 6: Renaming and copying new APK ==="
if (Test-Path "app\build\outputs\apk\release\app-release.apk") {
    # Copy versioned APK
    Copy-Item -Path "app\build\outputs\apk\release\app-release.apk" -Destination "E:\RR\RoadRescue-StarSummit-v3.apk" -Force
    Copy-Item -Path "app\build\outputs\apk\release\app-release.apk" -Destination "E:\RR\roadrescue-web\public\RoadRescue-StarSummit-v3.apk" -Force
    Copy-Item -Path "app\build\outputs\apk\release\app-release.apk" -Destination "E:\RR\roadrescue-web\dist\RoadRescue-StarSummit-v3.apk" -Force
    
    # Copy fallback unversioned APK
    Copy-Item -Path "app\build\outputs\apk\release\app-release.apk" -Destination "E:\RR\RoadRescue-StarSummit.apk" -Force
    Copy-Item -Path "app\build\outputs\apk\release\app-release.apk" -Destination "E:\RR\roadrescue-web\public\RoadRescue-StarSummit.apk" -Force
    Copy-Item -Path "app\build\outputs\apk\release\app-release.apk" -Destination "E:\RR\roadrescue-web\dist\RoadRescue-StarSummit.apk" -Force
    
    echo "=== Rebuild Successful! ==="
    echo "APK saved to E:\RR\RoadRescue-StarSummit-v3.apk and distribution paths."
} else {
    throw "Build failed: app-release.apk was not generated!"
}
