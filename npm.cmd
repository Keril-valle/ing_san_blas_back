@echo off
setlocal

if "%~1"=="" (
  pnpm
  goto :eof
)

if /I "%~1"=="run" (
  pnpm run %2 %3 %4 %5 %6 %7 %8 %9
  goto :eof
)

if /I "%~1"=="install" goto :install
if /I "%~1"=="i" goto :install
if /I "%~1"=="add" goto :add
if /I "%~1"=="uninstall" goto :remove
if /I "%~1"=="rm" goto :remove
if /I "%~1"=="update" goto :update

pnpm %*
goto :eof

:install
if "%~2"=="" (
  pnpm install
) else (
  pnpm add %2 %3 %4 %5 %6 %7 %8 %9
)
goto :eof

:add
pnpm add %2 %3 %4 %5 %6 %7 %8 %9
goto :eof

:remove
pnpm remove %2 %3 %4 %5 %6 %7 %8 %9
goto :eof

:update
pnpm update %2 %3 %4 %5 %6 %7 %8 %9
goto :eof