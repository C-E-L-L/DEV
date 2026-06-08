# SSL certificate renewal for cell.cbnu.ac.kr
# Runs certbot standalone (needs port 80 free), copies certs, reloads nginx

$DEV_DIR    = "C:\DEV"
$SSL_DIR    = "$DEV_DIR\ssl"
$LE_DIR     = "$DEV_DIR\letsencrypt"
$DOMAIN     = "cell.cbnu.ac.kr"
$EMAIL      = "rlawngns1530@gmail.com"
$COMPOSE    = "docker compose -f `"$DEV_DIR\docker-compose.yml`""
$LOG_FILE   = "$DEV_DIR\ssl-renew.log"

function Log($msg) {
    $ts = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    "$ts  $msg" | Tee-Object -FilePath $LOG_FILE -Append
}

Log "=== SSL renewal started ==="

# Ensure letsencrypt dir exists
New-Item -ItemType Directory -Force -Path $LE_DIR | Out-Null

# Stop frontend to free port 80
Log "Stopping frontend container..."
Invoke-Expression "$COMPOSE stop frontend"
Start-Sleep -Seconds 3

Log "Running certbot standalone..."
docker run --rm `
    -p 80:80 `
    -v "${LE_DIR}:/etc/letsencrypt" `
    certbot/certbot certonly `
    --standalone `
    --non-interactive `
    --agree-tos `
    --email $EMAIL `
    -d $DOMAIN

if ($LASTEXITCODE -ne 0) {
    Log "ERROR: certbot failed (exit $LASTEXITCODE). Restarting frontend without cert update."
    Invoke-Expression "$COMPOSE start frontend"
    exit 1
}

# Copy renewed certs
$CERT_SRC = "$LE_DIR\live\$DOMAIN\fullchain.pem"
$KEY_SRC  = "$LE_DIR\live\$DOMAIN\privkey.pem"

if (-not (Test-Path $CERT_SRC)) {
    Log "ERROR: Cert file not found at $CERT_SRC"
    Invoke-Expression "$COMPOSE start frontend"
    exit 1
}

Copy-Item $CERT_SRC "$SSL_DIR\cert.pem" -Force
Copy-Item $KEY_SRC  "$SSL_DIR\key.pem"  -Force
Log "Certs copied to $SSL_DIR"

# Restart frontend with new certs
Log "Restarting frontend..."
Invoke-Expression "$COMPOSE start frontend"

Log "=== SSL renewal complete ==="
