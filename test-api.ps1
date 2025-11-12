$loginData = @{
    usernameOrEmail = "admin@inventory.com"
    password = "Admin@123"
} | ConvertTo-Json

Write-Host "Testing API Login..." -ForegroundColor Cyan
Write-Host "Sending request to http://localhost:5001/api/auth/login" -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "`nResponse:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
}
catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n`nTesting GET Products..." -ForegroundColor Cyan
try {
    $token = (Invoke-WebRequest -Uri "http://localhost:5001/api/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body $loginData).Content | ConvertFrom-Json | Select-Object -ExpandProperty data | Select-Object -ExpandProperty token
    
    $response = Invoke-WebRequest -Uri "http://localhost:5001/api/product" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $token" } `
        -ErrorAction Stop
    
    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Status Code: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "`nProducts:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10 | Write-Host
}
catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host $_.Exception.Message
}
