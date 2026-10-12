@echo off
echo Memulai proses Build e-RTS (e-Rapor Tengah Semester)...
echo Proses ini mungkin memakan waktu beberapa menit.
echo.

call npm run build

echo.
echo Proses build selesai! 
echo Installer dapat ditemukan di folder "dist".
pause

