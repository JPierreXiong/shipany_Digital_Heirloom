# 构建验证脚本

Write-Host "🔍 检查 TypeScript 类型错误..." -ForegroundColor Cyan

# 运行 TypeScript 类型检查
npx tsc --noEmit

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TypeScript 类型检查通过！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 准备构建..." -ForegroundColor Yellow
    Write-Host "请手动运行: pnpm build" -ForegroundColor Yellow
} else {
    Write-Host "❌ TypeScript 类型检查失败" -ForegroundColor Red
    Write-Host "请修复上述错误后再构建" -ForegroundColor Red
}






