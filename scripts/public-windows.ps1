$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/windows-env.ps1"
$recordPath = Join-Path $Toolchain 'public-server.json'
$cloudflared = Join-Path $Toolchain 'cloudflared/cloudflared.exe'
if (!(Test-Path $cloudflared)) { throw 'Falta .toolchain/cloudflared/cloudflared.exe.' }
if (Test-Path $recordPath) {
    $previous = Get-Content $recordPath -Raw | ConvertFrom-Json
    if (Get-Process -Id $previous.tunnel -ErrorAction SilentlyContinue) {
        Write-Output "Acceso publico activo: $($previous.url)/?seed=42&lang=es"
        exit 0
    }
    & "$PSScriptRoot/stop-public-windows.ps1"
}
$node = (Get-Command node.exe).Source
$server = Start-Process -FilePath $node -ArgumentList ('"' + (Join-Path $Root 'scripts/serve.mjs') + '" 8081') -WorkingDirectory $Root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $Toolchain 'public-server.log') -RedirectStandardError (Join-Path $Toolchain 'public-server-error.log')
try {
    Start-Sleep -Seconds 1
    if ($server.HasExited) { throw 'No pudo iniciarse el servidor en el puerto 8081.' }
    $null = Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:8081/'
    $tunnelLog = Join-Path $Toolchain 'public-tunnel.log'
    $tunnel = Start-Process -FilePath $cloudflared -ArgumentList 'tunnel --no-autoupdate --edge-ip-version 4 --protocol http2 --url http://127.0.0.1:8081' -WorkingDirectory $Root -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $Toolchain 'public-tunnel-output.log') -RedirectStandardError $tunnelLog
    @{server=$server.Id; tunnel=$tunnel.Id; url=$null} | ConvertTo-Json | Set-Content $recordPath
    for ($attempt = 0; $attempt -lt 45; $attempt++) {
        Start-Sleep -Seconds 1
        if ($tunnel.HasExited) { throw "Fallo cloudflared. Revisar $tunnelLog" }
        $log = Get-Content $tunnelLog -Raw -ErrorAction SilentlyContinue
        if ($log -match 'Registered tunnel connection' -and $log -match 'https://[a-z0-9-]+\.trycloudflare\.com') {
            $publicUrl = $Matches[0]
            @{server=$server.Id; tunnel=$tunnel.Id; url=$publicUrl} | ConvertTo-Json | Set-Content $recordPath
            Write-Output "Abrir desde el celular: $publicUrl/?seed=42&lang=es"
            Write-Output 'Para cerrar el acceso publico: Cerrar-publico.cmd'
            exit 0
        }
    }
    throw "No se obtuvo un enlace. Revisar $tunnelLog"
} catch {
    if (Test-Path $recordPath) { & "$PSScriptRoot/stop-public-windows.ps1" }
    elseif (!$server.HasExited) { Stop-Process -Id $server.Id }
    throw
}
