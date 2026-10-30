@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\start-local.ps1" -OpenBrowser
if errorlevel 1 (
  echo Khong mo duoc LifeHub. Hay xem thong bao ben tren.
  pause
)
