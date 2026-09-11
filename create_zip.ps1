$desktop = [System.Environment]::GetFolderPath('Desktop')
$outZip = Join-Path $desktop "prode-liga-codigo.zip"
$sourceDir = $PSScriptRoot

if (Test-Path $outZip) {
    Remove-Item $outZip -Force
}

$items = Get-ChildItem -Path $sourceDir | Where-Object { $_.Name -notin @('node_modules', 'dist', '.git') } | ForEach-Object { $_.FullName }

Compress-Archive -Path $items -DestinationPath $outZip -Force
Get-Item $outZip | Select-Object FullName, Length, LastWriteTime

(New-Object System.Media.SoundPlayer 'C:\Windows\Media\Windows Proximity Notification.wav').PlaySync()
