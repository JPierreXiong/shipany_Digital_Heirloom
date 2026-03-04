# 测试准备自动化脚本
# 用途: 快速配置测试环境

Write-Host "🧪 Digital Heirloom 测试环境准备脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$projectPath = "d:\AIsoftware\shipany_Digital Heirloom"
Set-Location $projectPath

# 步骤 1: 检查 .env.local 是否存在
Write-Host "📋 步骤 1: 检查环境配置文件..." -ForegroundColor Yellow
if (Test-Path ".env.local") {
    Write-Host "✅ .env.local 文件已存在" -ForegroundColor Green
    $overwrite = Read-Host "是否要重新创建? (y/N)"
    if ($overwrite -eq "y" -or $overwrite -eq "Y") {
        Remove-Item ".env.local" -Force
        Write-Host "🗑️  已删除旧文件" -ForegroundColor Yellow
    } else {
        Write-Host "⏭️  跳过创建，使用现有文件" -ForegroundColor Blue
        $skipEnvCreation = $true
    }
}

if (-not $skipEnvCreation) {
    Write-Host "📝 创建 .env.local 文件..." -ForegroundColor Yellow
    Copy-Item "env.digital-heirloom.example.txt" -Destination ".env.local"
    Write-Host "✅ .env.local 文件已创建" -ForegroundColor Green
}

# 步骤 2: 生成 AUTH_SECRET
Write-Host ""
Write-Host "🔐 步骤 2: 生成 AUTH_SECRET..." -ForegroundColor Yellow
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$authSecret = [Convert]::ToBase64String($bytes)
Write-Host "✅ AUTH_SECRET 已生成: $authSecret" -ForegroundColor Green

# 步骤 3: 更新 .env.local 文件
Write-Host ""
Write-Host "📝 步骤 3: 更新环境变量..." -ForegroundColor Yellow

$envContent = Get-Content ".env.local" -Raw

# 替换 AUTH_SECRET
$envContent = $envContent -replace 'AUTH_SECRET=your-auth-secret-key-here-generate-with-openssl-rand-base64-32', "AUTH_SECRET=$authSecret"

# 确保其他关键配置正确
$envContent = $envContent -replace 'NEXT_PUBLIC_APP_URL=http://localhost:3000', 'NEXT_PUBLIC_APP_URL=http://localhost:3000'
$envContent = $envContent -replace 'NODE_ENV=development', 'NODE_ENV=development'

# 保存更新后的内容
Set-Content ".env.local" -Value $envContent
Write-Host "✅ 环境变量已更新" -ForegroundColor Green

# 步骤 4: 检查 Creem 配置
Write-Host ""
Write-Host "💳 步骤 4: 检查 Creem 支付配置..." -ForegroundColor Yellow
Write-Host "⚠️  警告: 之前的 Creem API 密钥已泄露，需要重新生成！" -ForegroundColor Red
Write-Host ""
Write-Host "请按照以下步骤操作:" -ForegroundColor Yellow
Write-Host "1. 访问 https://www.creem.io/dashboard" -ForegroundColor White
Write-Host "2. 撤销旧密钥: creem_2HGGaY2qzPVRkCP0kESZXU" -ForegroundColor White
Write-Host "3. 生成新的 API 密钥" -ForegroundColor White
Write-Host "4. 生成新的 Webhook Secret" -ForegroundColor White
Write-Host ""

$configureCreem = Read-Host "是否现在配置 Creem? (y/N)"
if ($configureCreem -eq "y" -or $configureCreem -eq "Y") {
    Write-Host ""
    $creemApiKey = Read-Host "请输入新的 CREEM_API_KEY"
    $creemSigningSecret = Read-Host "请输入新的 CREEM_SIGNING_SECRET"
    
    # 读取当前内容
    $envContent = Get-Content ".env.local" -Raw
    
    # 添加 Creem 配置（如果不存在）
    if ($envContent -notmatch "CREEM_ENABLED") {
        $creemConfig = @"

# ============================================
# Creem 支付配置 (测试环境)
# ============================================
CREEM_ENABLED=true
CREEM_ENVIRONMENT=sandbox
CREEM_API_KEY=$creemApiKey
CREEM_SIGNING_SECRET=$creemSigningSecret
CREEM_PRODUCT_IDS={"digital-heirloom-base-annual":"prod_4oN2BFtSPSpAnYcvUN0uoi","digital-heirloom-pro-annual":"prod_4epepOcgUjSjPoWmAnBaFt"}
DEFAULT_PAYMENT_PROVIDER=creem
"@
        $envContent += $creemConfig
        Set-Content ".env.local" -Value $envContent
        Write-Host "✅ Creem 配置已添加" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Creem 配置已存在，请手动编辑 .env.local" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️  跳过 Creem 配置，请稍后手动配置" -ForegroundColor Blue
}

# 步骤 5: 清理旧的构建文件
Write-Host ""
Write-Host "🧹 步骤 5: 清理旧的构建文件..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✅ .next 目录已清理" -ForegroundColor Green
}

# 步骤 6: 停止现有的 Node 进程
Write-Host ""
Write-Host "🛑 步骤 6: 停止现有的 Node 进程..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $nodeProcesses | Stop-Process -Force
    Write-Host "✅ 已停止 $($nodeProcesses.Count) 个 Node 进程" -ForegroundColor Green
} else {
    Write-Host "ℹ️  没有运行中的 Node 进程" -ForegroundColor Blue
}

# 步骤 7: 创建测试文件
Write-Host ""
Write-Host "📄 步骤 7: 创建测试文件..." -ForegroundColor Yellow
$testFileContent = @"
This is a test document for encryption testing.
这是一个加密测试文档。

Test Data:
- Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- Purpose: Encryption/Decryption Testing
- Expected: File should be encrypted on upload and decrypted on view

测试数据:
- 日期: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
- 目的: 加密/解密功能测试
- 预期: 文件应该在上传时加密，查看时解密
"@

Set-Content "test-document.txt" -Value $testFileContent
Write-Host "✅ 测试文件已创建: test-document.txt" -ForegroundColor Green

# 步骤 8: 显示配置摘要
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📊 配置摘要" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ .env.local 文件: 已配置" -ForegroundColor Green
Write-Host "✅ AUTH_SECRET: 已生成" -ForegroundColor Green
Write-Host "✅ 测试文件: test-document.txt" -ForegroundColor Green
Write-Host "✅ 构建缓存: 已清理" -ForegroundColor Green
Write-Host "✅ Node 进程: 已停止" -ForegroundColor Green

if ($configureCreem -eq "y" -or $configureCreem -eq "Y") {
    Write-Host "✅ Creem 配置: 已配置" -ForegroundColor Green
} else {
    Write-Host "⚠️  Creem 配置: 需要手动配置" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 下一步操作" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if ($configureCreem -ne "y" -and $configureCreem -ne "Y") {
    Write-Host "1. 手动编辑 .env.local 文件，配置 Creem 支付" -ForegroundColor Yellow
    Write-Host "   - CREEM_API_KEY" -ForegroundColor White
    Write-Host "   - CREEM_SIGNING_SECRET" -ForegroundColor White
    Write-Host ""
}

Write-Host "2. 启动开发服务器:" -ForegroundColor Yellow
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""

Write-Host "3. 等待服务器启动完成（约 1-2 分钟）" -ForegroundColor Yellow
Write-Host ""

Write-Host "4. 访问测试页面:" -ForegroundColor Yellow
Write-Host "   http://localhost:3000" -ForegroundColor White
Write-Host ""

Write-Host "5. 开始测试流程:" -ForegroundColor Yellow
Write-Host "   - 用户注册" -ForegroundColor White
Write-Host "   - 购买 Base Plan" -ForegroundColor White
Write-Host "   - 验证有效期显示 ⭐" -ForegroundColor White
Write-Host "   - 创建保险箱" -ForegroundColor White
Write-Host "   - 上传并加密文件" -ForegroundColor White
Write-Host "   - 解密并查看文件" -ForegroundColor White
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "📚 参考文档" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "- REAL_USER_TESTING_PREPARATION.md - 完整测试准备清单" -ForegroundColor White
Write-Host "- USER_TESTING_REPORT.md - 测试报告模板" -ForegroundColor White
Write-Host "- CREEM_SETUP_SECURITY_GUIDE.md - Creem 配置指南" -ForegroundColor White
Write-Host "- SECURITY_AUDIT_REPORT.md - 安全审计报告" -ForegroundColor White
Write-Host ""

$startServer = Read-Host "是否现在启动开发服务器? (y/N)"
if ($startServer -eq "y" -or $startServer -eq "Y") {
    Write-Host ""
    Write-Host "🚀 启动开发服务器..." -ForegroundColor Green
    Write-Host ""
    npm run dev
} else {
    Write-Host ""
    Write-Host "✅ 准备完成！请手动运行 'npm run dev' 启动服务器" -ForegroundColor Green
    Write-Host ""
}




