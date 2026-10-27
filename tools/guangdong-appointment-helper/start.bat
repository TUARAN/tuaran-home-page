@echo off
cd /d "%~dp0"
py -3 appointment_helper.py
if errorlevel 1 pause
