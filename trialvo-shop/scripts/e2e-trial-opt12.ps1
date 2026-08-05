# Thorough Opt1/Opt2 trial E2E for Lifestyle, Fashion, Tech - one product at a time.
# Report: %TEMP%\trialvo-e2e-report.txt (passwords not logged in full)

$ErrorActionPreference = 'Continue'
$CP = 'http://127.0.0.1:5000'
$Report = Join-Path $env:TEMP 'trialvo-e2e-report.txt'
$Results = New-Object System.Collections.Generic.List[string]

function Log([string]$msg) {
  $line = '[' + (Get-Date -Format 'HH:mm:ss') + '] ' + $msg
  Write-Host $line
  [void]$Results.Add($line)
}
function Pass([string]$msg) { Log ('PASS  ' + $msg) }
function Fail([string]$msg) { Log ('FAIL  ' + $msg) }
function Info([string]$msg) { Log ('INFO  ' + $msg) }

function HttpCode([string]$url) {
  try {
    return [int](Invoke-WebRequest -Uri $url -UseBasicParsing -Method Head -TimeoutSec 15).StatusCode
  } catch {
    if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
    try { return [int](Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 15).StatusCode }
    catch {
      if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
      return 0
    }
  }
}

function ApiJson($method, $url, $token = $null, $body = $null) {
  $headers = @{ Accept = 'application/json' }
  if ($token) { $headers.Authorization = ('Bearer ' + $token) }
  $params = @{
    Uri = $url
    Method = $method
    Headers = $headers
    ContentType = 'application/json'
    TimeoutSec = 90
  }
  if ($null -ne $body) { $params.Body = ($body | ConvertTo-Json -Depth 6) }
  return Invoke-RestMethod @params
}

Log '===== PREFLIGHT ====='
$pre = @(
  @{ n='CP FE'; u='http://127.0.0.1:8000/' },
  @{ n='CP API'; u=($CP + '/api/trial/config') },
  @{ n='Lifestyle shop'; u='http://127.0.0.1:5100/' },
  @{ n='Fashion shop'; u='http://127.0.0.1:5101/' },
  @{ n='Tech shop'; u='http://127.0.0.1:5102/' },
  @{ n='Shared admin'; u='http://127.0.0.1:5174/' },
  @{ n='Shared API'; u='http://127.0.0.1:9100/api/v1/delivery-areas' }
)
foreach ($p in $pre) {
  $c = HttpCode $p.u
  if ($c -ge 200 -and $c -lt 400) { Pass ($p.n + ' HTTP ' + $c) } else { Fail ($p.n + ' HTTP ' + $c) }
}

Log '===== CP ADMIN LOGIN ====='
$login = ApiJson POST ($CP + '/api/auth/login') $null @{ email='admin@trialvo.com'; password='Antor@123' }
if (-not $login.token) { throw 'CP admin login failed' }
$TOKEN = $login.token
Pass ('CP admin login role=' + $login.admin.role)

$products = @(
  @{ slug='lifestyle-ecommerce'; expectShop='http://localhost:5100'; name='Lifestyle'; imgPrefix='lifestyle-' },
  @{ slug='fashion-ecommerce'; expectShop='http://localhost:5101'; name='Fashion'; imgPrefix='fashion-' },
  @{ slug='tech-shop-ecommerce'; expectShop='http://localhost:5102'; name='Tech'; imgPrefix='techshop-' }
)

$stamp = Get-Date -Format 'yyyyMMddHHmmss'
Add-Type -AssemblyName System.IO.Compression.FileSystem

foreach ($prod in $products) {
  Log ('===== PRODUCT ' + $prod.name + ' / ' + $prod.slug + ' OPTION1 hosted =====')
  $email1 = 'e2e.opt1.' + $prod.slug + '.' + $stamp + '@trialvo.test'

  try {
    $req1 = ApiJson POST ($CP + '/api/trial/requests') $null @{
      productSlug = $prod.slug
      trialType = 'hosted'
      name = ('E2E Opt1 ' + $prod.name)
      email = $email1
      phone = '01700000001'
      company = 'E2E Test Co'
      useCase = 'Automated thorough test Opt1'
      requestedDays = 7
    }
  } catch {
    Fail ('Opt1 request create: ' + $_.Exception.Message)
    continue
  }
  if (-not $req1.requestId) { Fail ('Opt1 request create empty ' + $prod.slug); continue }
  Pass ('Opt1 request created id=' + $req1.requestId)

  try {
    $approve1 = ApiJson POST ($CP + '/api/admin/trial-requests/' + $req1.requestId + '/approve') $TOKEN @{ days = 7; notes = 'E2E approve Opt1' }
  } catch {
    Fail ('Opt1 approve: ' + $_.Exception.Message)
    continue
  }
  if (-not $approve1.instanceId) { Fail 'Opt1 approve missing instanceId'; continue }
  Pass ('Opt1 approved instanceId=' + $approve1.instanceId + ' shop=' + $approve1.shopUrl)

  if ($approve1.shopUrl -eq $prod.expectShop) { Pass ('Opt1 shop URL correct: ' + $approve1.shopUrl) }
  else { Fail ('Opt1 shop URL expected ' + $prod.expectShop + ' got ' + $approve1.shopUrl) }

  if ($approve1.adminUrl -match '5174') { Pass ('Opt1 admin URL ' + $approve1.adminUrl) }
  else { Fail ('Opt1 admin URL unexpected: ' + $approve1.adminUrl) }

  Start-Sleep -Seconds 1
  try {
    $st1 = ApiJson GET ($CP + '/api/trial/status/' + $req1.statusToken) $null $null
    Info ('Opt1 status=' + $st1.status + ' shop=' + $st1.shopUrl)
    if ($st1.status -eq 'active') { Pass 'Opt1 public status active' } else { Fail ('Opt1 public status=' + $st1.status) }
  } catch { Fail ('Opt1 status: ' + $_.Exception.Message) }

  $sc = HttpCode $prod.expectShop
  if ($sc -ge 200 -and $sc -lt 400) { Pass ('Opt1 browse shop HTTP ' + $sc) } else { Fail ('Opt1 browse shop HTTP ' + $sc) }

  $bffPort = ([uri]$prod.expectShop).Port
  $bff = 'http://127.0.0.1:' + $bffPort + '/api/v1/user/products?page=1&limit=1'
  try {
    $plist = Invoke-RestMethod -Uri $bff -TimeoutSec 30
    $count = 0
    if ($plist.products) { $count = @($plist.products).Count }
    elseif ($plist.data -and $plist.data.products) { $count = @($plist.data.products).Count }
    if ($count -gt 0) { Pass ('Opt1 shop catalog products=' + $count) } else { Fail ('Opt1 shop catalog empty') }
  } catch { Fail ('Opt1 shop BFF: ' + $_.Exception.Message) }

  $adminEmail = $approve1.adminEmail
  $adminPass = $approve1.adminPassword
  if ($adminEmail -and $adminPass) {
    try {
      $demoLogin = Invoke-RestMethod -Uri 'http://127.0.0.1:9100/api/v1/admin/login' -Method POST -ContentType 'application/json' -Body (@{ email=$adminEmail; password=$adminPass } | ConvertTo-Json) -TimeoutSec 30
      $hasTok = [bool]($demoLogin.token -or $demoLogin.access_token -or ($demoLogin.data -and $demoLogin.data.token))
      if ($hasTok) { Pass ('Opt1 shared-demo admin login OK') } else { Fail 'Opt1 shared-demo admin login no token' }
    } catch { Fail ('Opt1 shared-demo admin login: ' + $_.Exception.Message) }
  } else { Fail 'Opt1 approve missing admin credentials' }

  $instId = $approve1.instanceId

  try {
    $ex = ApiJson POST ($CP + '/api/admin/trial-instances/' + $instId + '/extend') $TOKEN @{ days = 3 }
    if ($ex.ok) { Pass ('Opt1 extend ok days=' + $ex.days) } else { Fail 'Opt1 extend failed' }
  } catch { Fail ('Opt1 extend: ' + $_.Exception.Message) }

  try {
    $fr = ApiJson POST ($CP + '/api/admin/trial-instances/' + $instId + '/freeze') $TOKEN @{}
    if ($fr.ok -and $fr.status -eq 'frozen') { Pass 'Opt1 freeze ok' } else { Fail 'Opt1 freeze failed' }
  } catch { Fail ('Opt1 freeze: ' + $_.Exception.Message) }

  if ($adminEmail -and $adminPass) {
    try {
      Invoke-RestMethod -Uri 'http://127.0.0.1:9100/api/v1/admin/login' -Method POST -ContentType 'application/json' -Body (@{ email=$adminEmail; password=$adminPass } | ConvertTo-Json) -TimeoutSec 20 | Out-Null
      Fail 'Opt1 freeze: demo admin still can login'
    } catch { Pass 'Opt1 freeze: demo admin login blocked' }
  }

  try {
    $uf = ApiJson POST ($CP + '/api/admin/trial-instances/' + $instId + '/unfreeze') $TOKEN @{}
    if ($uf.ok -and $uf.status -eq 'active') { Pass 'Opt1 unfreeze ok' } else { Fail 'Opt1 unfreeze failed' }
  } catch { Fail ('Opt1 unfreeze: ' + $_.Exception.Message) }

  if ($adminEmail -and $adminPass) {
    try {
      $demoLogin2 = Invoke-RestMethod -Uri 'http://127.0.0.1:9100/api/v1/admin/login' -Method POST -ContentType 'application/json' -Body (@{ email=$adminEmail; password=$adminPass } | ConvertTo-Json) -TimeoutSec 20
      $ok2 = [bool]($demoLogin2.token -or $demoLogin2.access_token -or ($demoLogin2.data -and $demoLogin2.data.token))
      if ($ok2) { Pass 'Opt1 unfreeze: demo admin login restored' } else { Fail 'Opt1 unfreeze login no token' }
    } catch { Fail ('Opt1 unfreeze login: ' + $_.Exception.Message) }
  }

  try {
    $ds = ApiJson POST ($CP + '/api/admin/trial-instances/' + $instId + '/destroy') $TOKEN @{ mode = 'soft' }
    if ($ds.ok) { Pass ('Opt1 destroy soft ok status=' + $ds.status) } else { Fail 'Opt1 destroy failed' }
  } catch { Fail ('Opt1 destroy: ' + $_.Exception.Message) }

  $stack = HttpCode $prod.expectShop
  if ($stack -ge 200 -and $stack -lt 400) { Pass ('Opt1 after destroy shared shop still up HTTP ' + $stack) }
  else { Fail ('Opt1 shared shop down after soft destroy') }

  Log ('===== PRODUCT ' + $prod.name + ' OPTION2 self_hosted =====')
  $email2 = 'e2e.opt2.' + $prod.slug + '.' + $stamp + '@trialvo.test'
  $domain2 = 'e2e-' + $prod.slug + '-' + $stamp + '.local.test'

  try {
    $req2 = ApiJson POST ($CP + '/api/trial/requests') $null @{
      productSlug = $prod.slug
      trialType = 'self_hosted'
      name = ('E2E Opt2 ' + $prod.name)
      email = $email2
      phone = '01700000002'
      company = 'E2E Test Co'
      desiredDomain = $domain2
      useCase = 'Automated thorough test Opt2'
      requestedDays = 14
    }
    Pass ('Opt2 request created id=' + $req2.requestId)
  } catch {
    Fail ('Opt2 request create: ' + $_.Exception.Message)
    continue
  }

  try {
    $approve2 = ApiJson POST ($CP + '/api/admin/trial-requests/' + $req2.requestId + '/approve') $TOKEN @{ days = 14; notes = 'E2E approve Opt2' }
    if (-not $approve2.instanceId) { Fail 'Opt2 approve missing instanceId'; continue }
    Pass ('Opt2 approved instanceId=' + $approve2.instanceId + ' installer=' + [bool]$approve2.installerUrl)
  } catch {
    Fail ('Opt2 approve: ' + $_.Exception.Message)
    continue
  }

  Start-Sleep -Seconds 1
  try {
    $st2 = ApiJson GET ($CP + '/api/trial/status/' + $req2.statusToken) $null $null
    Info ('Opt2 status=' + $st2.status + ' hasInstaller=' + [bool]$st2.installerUrl)
    if ($st2.status -eq 'provisioning' -or $st2.status -eq 'active') { Pass ('Opt2 public status=' + $st2.status) }
    else { Fail ('Opt2 unexpected status=' + $st2.status) }
  } catch { Fail ('Opt2 status: ' + $_.Exception.Message) }

  $instUrl = $CP + '/api/trial/installer/' + $req2.statusToken
  try {
    $zipPath = Join-Path $env:TEMP ('tv-opt2-' + $prod.slug + '-' + $stamp + '.zip')
    Invoke-WebRequest -Uri $instUrl -OutFile $zipPath -TimeoutSec 120
    $len = (Get-Item $zipPath).Length
    if ($len -gt 1000) { Pass ('Opt2 installer ZIP bytes=' + $len) } else { Fail ('Opt2 installer ZIP too small') }

    $zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
    try {
      $agentEnv = $zip.Entries | Where-Object { $_.FullName -like '*agent.env' } | Select-Object -First 1
      if ($agentEnv) {
        $sr = New-Object System.IO.StreamReader($agentEnv.Open())
        $txt = $sr.ReadToEnd(); $sr.Close()
        if ($txt -match [regex]::Escape($prod.imgPrefix)) { Pass ('Opt2 agent.env has image prefix ' + $prod.imgPrefix) }
        else { Fail ('Opt2 agent.env missing image prefix ' + $prod.imgPrefix) }
        Info ('Opt2 images: ' + (($txt -split "`n" | Where-Object { $_ -match 'TRIAL_IMAGE_' }) -join ' | '))
      } else { Fail 'Opt2 zip missing agent.env' }
    } finally { $zip.Dispose() }
  } catch { Fail ('Opt2 installer download: ' + $_.Exception.Message) }

  try {
    $inst = ApiJson GET ($CP + '/api/admin/trial-instances/' + $approve2.instanceId) $TOKEN $null
    Pass ('Opt2 admin instance status=' + $inst.status + ' type=' + $inst.trial_type + ' slug=' + $inst.product_slug)
  } catch { Fail ('Opt2 admin get instance: ' + $_.Exception.Message) }

  try {
    $d2 = ApiJson POST ($CP + '/api/admin/trial-instances/' + $approve2.instanceId + '/destroy') $TOKEN @{ mode = 'soft' }
    Pass ('Opt2 destroy soft accepted ok=' + $d2.ok + ' status=' + $d2.status)
  } catch { Info ('Opt2 destroy note: ' + $_.Exception.Message) }
}

Log '===== ADMIN LIST sanity ====='
try {
  $reqs = ApiJson GET ($CP + '/api/admin/trial-requests') $TOKEN $null
  $insts = ApiJson GET ($CP + '/api/admin/trial-instances?scope=trials') $TOKEN $null
  Pass ('Admin lists requests=' + @($reqs).Count + ' instances=' + @($insts).Count)
} catch { Fail ('Admin lists: ' + $_.Exception.Message) }

Log '===== SUMMARY ====='
$passN = @($Results | Where-Object { $_ -match 'PASS  ' }).Count
$failN = @($Results | Where-Object { $_ -match 'FAIL  ' }).Count
Log ('TOTAL pass=' + $passN + ' fail=' + $failN)
$Results | Set-Content -Path $Report -Encoding UTF8
Write-Host ('Report written: ' + $Report)
if ($failN -gt 0) { exit 1 } else { exit 0 }
