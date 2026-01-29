$baseUrl = "http://localhost:4321"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Testing POST /api/sessions endpoint" -ForegroundColor Cyan
Write-Host "Development Mode (No Auth Required)" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Test 1: Create session with context" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sessions" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"context": "E-commerce platform using React and Node.js"}'

    Write-Host "✅ SUCCESS (201)" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    $_.Exception.Message
}
Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

Write-Host "Test 2: Create session with null context" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sessions" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"context": null}'

    Write-Host "✅ SUCCESS (201)" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    $_.Exception.Message
}
Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

Write-Host "Test 3: Create session without context (empty body)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sessions" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{}'

    Write-Host "✅ SUCCESS (201)" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ FAILED" -ForegroundColor Red
    $_.Exception.Message
}
Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

Write-Host "Test 4: Invalid payload - context as number" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sessions" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"context": 123}' `
        -ErrorAction Stop

    Write-Host "❌ Should have failed with 400" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ SUCCESS (400 - validation error as expected)" -ForegroundColor Green
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        $errorResponse | ConvertTo-Json -Depth 10
    } else {
        Write-Host "❌ FAILED - Wrong status code" -ForegroundColor Red
        $_.Exception.Message
    }
}
Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

Write-Host "Test 5: Invalid payload - context as array" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sessions" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"context": ["test"]}' `
        -ErrorAction Stop

    Write-Host "❌ Should have failed with 400" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ SUCCESS (400 - validation error as expected)" -ForegroundColor Green
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        $errorResponse | ConvertTo-Json -Depth 10
    } else {
        Write-Host "❌ FAILED - Wrong status code" -ForegroundColor Red
        $_.Exception.Message
    }
}
Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

Write-Host "Test 6: Invalid payload - context as boolean" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/sessions" `
        -Method Post `
        -ContentType "application/json" `
        -Body '{"context": true}' `
        -ErrorAction Stop

    Write-Host "❌ Should have failed with 400" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "✅ SUCCESS (400 - validation error as expected)" -ForegroundColor Green
        $errorResponse = $_.ErrorDetails.Message | ConvertFrom-Json
        $errorResponse | ConvertTo-Json -Depth 10
    } else {
        Write-Host "❌ FAILED - Wrong status code" -ForegroundColor Red
        $_.Exception.Message
    }
}
Write-Host ""
Write-Host "---" -ForegroundColor Gray
Write-Host ""

Write-Host "=========================================" -ForegroundColor Green
Write-Host "All tests completed!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Check Supabase Dashboard → Table Editor → sessions" -ForegroundColor White
Write-Host "2. Verify all sessions have user_id = '00000000-0000-0000-0000-000000000001'" -ForegroundColor White
Write-Host "3. Check created_at and updated_at timestamps" -ForegroundColor White
