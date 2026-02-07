@echo off
echo Installing Ollama via winget...
winget install Ollama.Ollama -e --silent --accept-package-agreements --accept-source-agreements

echo.
echo waiting for Ollama to install...
timeout /t 10

echo.
echo Pulling Gemma2:2b model...
ollama pull gemma2:2b

echo.
echo Done! Please restart your terminal/VSCode if 'ollama' command is not found.
pause
