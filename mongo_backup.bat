@echo off
:: Set the MongoDB path and backup directory
set MONGO_PATH=D:\coding\24\vue\moms\mongo_db 
set BACKUP_DIR=D:\coding\24\vue\moms\mongo_db\mongo_backups

:: Get the current date in YYYY-MM-DD format
for /f "tokens=1-3 delims=-/ " %%a in ("%date%") do set CUR_DATE=%%c-%%a-%%b

:: Create a folder with today's date
set BACKUP_PATH=%BACKUP_DIR%\%CUR_DATE%
if not exist %BACKUP_PATH% mkdir %BACKUP_PATH%

:: Run the MongoDB backup command
%MONGO_PATH%\mongodump --db moms --out %BACKUP_PATH%

echo Backup completed for database 'moms' on %CUR_DATE%.
pause