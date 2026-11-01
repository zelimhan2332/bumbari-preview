$ErrorActionPreference = 'Stop'
$source = Join-Path $PSScriptRoot 'index.html'
$chrome = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
if (!(Test-Path $source)) { throw 'Не найден файл приложения.' }
if (!(Test-Path $chrome)) { throw 'Не найден Google Chrome.' }
$url = ([System.Uri]$source).AbsoluteUri
$shortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) 'Мюллер — лекала.lnk'
$wsh = New-Object -ComObject WScript.Shell
$link = $wsh.CreateShortcut($shortcut)
$link.TargetPath = $chrome
$link.Arguments = '--app=' + $url
$link.WorkingDirectory = Split-Path -Parent $source
$link.IconLocation = $chrome + ',0'
$link.Description = 'Мюллер — лекала по вашим меркам (Chrome)'
$link.Save()
Write-Output "Ярлык обновлён: $shortcut"
Write-Output "Адрес: $url"
