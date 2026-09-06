# Lightweight Built-in PowerShell HTTP Server with Real Email OTP Dispatch
$port = 8080
$folder = $PSScriptRoot
if (-not $folder) { $folder = Get-Location }

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host " Aegis AI Interview Portal is LIVE at: http://localhost:$port/" -ForegroundColor Green
    Write-Host " Real Email OTP Dispatcher & Anti-Extension Guard Active" -ForegroundColor Yellow
    Write-Host "==========================================================" -ForegroundColor Cyan
} catch {
    Write-Host "Could not start server on port $port, may already be in use: $_" -ForegroundColor Red
    exit 1
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Enable CORS
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.OutputStream.Close()
            continue
        }

        # API: Send Real Email OTP
        if ($request.HttpMethod -eq "POST" -and $request.Url.LocalPath -eq "/api/send-otp") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $postData = $reader.ReadToEnd()
            $json = $postData | ConvertFrom-Json

            $toEmail = $json.email
            $otpCode = $json.otp
            $smtpConfigPath = Join-Path $folder "smtp_config.json"

            $sent = $false
            $errorMsg = ""

            if (Test-Path $smtpConfigPath) {
                try {
                    $cfg = Get-Content $smtpConfigPath -Raw | ConvertFrom-Json
                    if ($cfg.username -and $cfg.password -and $cfg.host) {
                        $smtp = New-Object System.Net.Mail.SmtpClient($cfg.host, [int]$cfg.port)
                        $smtp.EnableSsl = [bool]$cfg.enableSsl
                        $smtp.Credentials = New-Object System.Net.NetworkCredential($cfg.username, $cfg.password)

                        $mailFrom = $cfg.username
                        $msg = New-Object System.Net.Mail.MailMessage
                        $msg.From = New-Object System.Net.Mail.MailAddress($mailFrom, "Aegis AI Interview Portal")
                        $msg.To.Add($toEmail)
                        $msg.Subject = "[$otpCode] - Your Aegis Interview OTP Verification Code"
                        $msg.IsBodyHtml = $true
                        $htmlBody = '<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0f172a;border-radius:16px;border:1px solid #334155;">' +
                            '<div style="text-align:center;margin-bottom:24px;">' +
                            '<h2 style="color:#7c3aed;margin:8px 0;">Aegis Interview Portal</h2>' +
                            '<p style="color:#94a3b8;font-size:14px;">Your Identity Verification Code</p></div>' +
                            '<div style="background:#1e293b;border-radius:12px;padding:24px;text-align:center;margin:20px 0;">' +
                            '<p style="color:#94a3b8;font-size:13px;margin-bottom:8px;">Your One-Time Verification Code</p>' +
                            '<div style="font-size:40px;font-weight:900;letter-spacing:12px;color:#a78bfa;font-family:monospace;">' + $otpCode + '</div>' +
                            '<p style="color:#64748b;font-size:12px;margin-top:12px;">Valid for 10 minutes only</p></div>' +
                            '<p style="color:#94a3b8;font-size:13px;text-align:center;">Enter this code in the interview portal to verify your identity and begin your proctored session.</p>' +
                            '<p style="color:#475569;font-size:11px;text-align:center;margin-top:24px;">If you did not request this code, please ignore this email. | Aegis Interview Team</p></div>'
                        $msg.Body = $htmlBody
                        $smtp.Send($msg)
                        $sent = $true
                        Write-Host "[OTP SENT] Real email dispatched to $toEmail - Code: $otpCode" -ForegroundColor Green
                    }
                } catch {
                    $errorMsg = $_.Exception.Message
                    Write-Host "[SMTP ERROR] $errorMsg" -ForegroundColor Red
                    Write-Host "[HINT] If 535 Auth error: Gmail needs App Password, not regular password." -ForegroundColor Yellow
                    Write-Host "[HINT] Go to: myaccount.google.com/apppasswords - Create 16-char App Password" -ForegroundColor Yellow
                }
            }

            $respObj = @{
                success = $true
                sentViaSmtp = $sent
                email = $toEmail
                smtpConfigured = (Test-Path $smtpConfigPath)
                otpForDisplay = $otpCode
                error = $errorMsg
                note = if ($sent) { "Email dispatched to $toEmail" } else { "SMTP not configured or failed. Alternate OTP shown on portal screen." }
            }

            $respBytes = [System.Text.Encoding]::UTF8.GetBytes(($respObj | ConvertTo-Json))
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $respBytes.Length
            $response.OutputStream.Write($respBytes, 0, $respBytes.Length)
            $response.OutputStream.Close()
            continue
        }

        # API: Save SMTP Configuration
        if ($request.HttpMethod -eq "POST" -and $request.Url.LocalPath -eq "/api/save-smtp") {
            $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
            $postData = $reader.ReadToEnd()
            $smtpConfigPath = Join-Path $folder "smtp_config.json"
            [System.IO.File]::WriteAllText($smtpConfigPath, $postData)

            $respObj = @{ success = $true; message = "SMTP credentials saved successfully" }
            $respBytes = [System.Text.Encoding]::UTF8.GetBytes(($respObj | ConvertTo-Json))
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $respBytes.Length
            $response.OutputStream.Write($respBytes, 0, $respBytes.Length)
            $response.OutputStream.Close()
            continue
        }

        # Static file delivery
        $urlPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($urlPath) -or $urlPath -eq "/") {
            $urlPath = "index.html"
        }

        $safePath = [System.IO.Path]::GetFullPath((Join-Path $folder $urlPath))
        $rootPath = [System.IO.Path]::GetFullPath($folder)

        if ($safePath.StartsWith($rootPath) -and (Test-Path $safePath -PathType Leaf)) {
            $ext = [System.IO.Path]::GetExtension($safePath).ToLower()
            $contentType = if ($mimeTypes.ContainsKey($ext)) { $mimeTypes[$ext] } else { "application/octet-stream" }
            $response.ContentType = $contentType

            $bytes = [System.IO.File]::ReadAllBytes($safePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.OutputStream.Close()
    } catch {
        # continue on connection reset
    }
}
