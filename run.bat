@echo off
set "DOTNET_ROOT=%LOCALAPPDATA%\dotnet"
set "PATH=%LOCALAPPDATA%\dotnet;%PATH%"
echo Starting LubeLogger...
"%LOCALAPPDATA%\dotnet\dotnet.exe" run
pause
