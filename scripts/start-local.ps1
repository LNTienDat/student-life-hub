param([switch]$OpenBrowser)
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path $PSScriptRoot -Parent
$nodePath = (Get-Command node.exe -ErrorAction Stop).Source
$runtimeDir = Join-Path $taskRoot 'improvement-backups\local-runtime'
New-Item -ItemType Directory -Path $runtimeDir -Force | Out-Null
$url = 'http://127.0.0.1:5173'
function Test-Port([int]$Port) {
    $client = New-Object Net.Sockets.TcpClient
    try { $pending = $client.ConnectAsync('127.0.0.1', $Port); if (-not $pending.Wait(500)) { return $false }; return $client.Connected }
    catch { return $false }
    finally { $client.Dispose() }
}
function Test-Backend {
    try { return (Invoke-RestMethod 'http://127.0.0.1:5000/api/health' -TimeoutSec 3).status -eq 'ok' } catch { return $false }
}
function Test-Frontend {
    try { $page = Invoke-WebRequest "$url/login" -UseBasicParsing -TimeoutSec 3; return $page.StatusCode -eq 200 -and $page.Content.Contains('/@vite/client') } catch { return $false }
}
$mutex = New-Object Threading.Mutex($false, 'Local\LifeHubLocalLauncher')
if (-not $mutex.WaitOne(0)) { Write-Output 'LifeHub dang duoc khoi dong. Vui long cho.'; exit 0 }
try {
    if (-not (Test-Port 5432)) { throw 'PostgreSQL local chua chay. Mo dich vu PostgreSQL roi thu lai.' }
    $backendPid = $null
    $frontendPid = $null
    if (Test-Port 5000) {
        if (-not (Test-Backend)) { throw 'Cong 5000 dang duoc su dung nhung API chua san sang. Khong dung tien trinh khac.' }
    } else {
        $readLocalDatabase = "const fs=require('fs'),path=require('path'),root=process.argv[1],d=require(path.join(root,'back/node_modules/dotenv')).parse(fs.readFileSync(path.join(root,'back/.env')));const u=new URL(d.DATABASE_URL);if(!['localhost','127.0.0.1'].includes(u.hostname)||(u.port&&u.port!=='5432')||u.pathname!=='/student_life_hub')throw Error('Expected local project database');u.hostname='127.0.0.1';process.stdout.write(u.toString());"
        $env:DATABASE_URL = & $nodePath -e $readLocalDatabase $taskRoot
        if ($LASTEXITCODE -ne 0 -or -not $env:DATABASE_URL) { throw 'Khong xac nhan duoc CSDL local; chua khoi dong backend.' }
        $env:NODE_ENV='development'; $env:PORT='5000'; $env:CHATBOT_AI_ENABLED='true'; $env:ENABLE_CRON_JOBS='false'; $env:SERVE_FRONTEND='false'
        $env:FRONTEND_URL=$url; $env:ADDITIONAL_FRONTEND_URLS='http://localhost:5173'
        $process = Start-Process -FilePath $nodePath -ArgumentList 'app.js' -WorkingDirectory (Join-Path $taskRoot 'back') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'backend.out.log') -RedirectStandardError (Join-Path $runtimeDir 'backend.err.log')
        $backendPid=$process.Id
    }
    if (Test-Port 5173) {
        if (-not (Test-Frontend)) { throw 'Cong 5173 dang duoc su dung boi trang khac. Khong dung tien trinh khac.' }
    } else {
        $env:VITE_API_URL='/api'
        $process = Start-Process -FilePath $nodePath -ArgumentList @('node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5173','--strictPort') -WorkingDirectory (Join-Path $taskRoot 'front') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDir 'frontend.out.log') -RedirectStandardError (Join-Path $runtimeDir 'frontend.err.log')
        $frontendPid=$process.Id
    }
    $ready=$false
    for ($attempt=0; $attempt -lt 20; $attempt++) {
        if ((Test-Backend) -and (Test-Frontend)) { $ready=$true; break }
        Start-Sleep -Milliseconds 500
    }
    if (-not $ready) { throw "LifeHub chua san sang. Xem nhat ky trong $runtimeDir." }
    @{url=$url; backendPid=$backendPid; frontendPid=$frontendPid; started=(Get-Date).ToString('o'); aiEnabled=$true; cronEnabled=$false} | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $runtimeDir 'status.json') -Encoding UTF8
    Write-Output "LifeHub da san sang: $url"
    Write-Output 'Ban local chi chay khi may tinh dang bat. Sau khi khoi dong lai may, mo file Mo_LifeHub.cmd.'
    if ($OpenBrowser) { Start-Process $url }
}
finally { $mutex.ReleaseMutex(); $mutex.Dispose() }
