# Logo替换问题排查指南

## 问题诊断

### 当前状态
- ✅ **配置文件**：已正确设置 `/logo.png` 路径
- ✅ **文件存在**：`public/logo.png` 存在（1.4MB）
- ✅ **组件配置**：BrandLogo组件正确读取logo配置
- ⚠️ **可能问题**：浏览器缓存或文件未实际替换

---

## 可能的原因

### 1. 浏览器缓存问题 ⚠️ **最常见**

**症状**：
- 配置已更新，但浏览器仍显示旧logo
- 刷新页面后logo不变

**解决方案**：
1. **硬刷新浏览器**：
   - Windows: `Ctrl + Shift + R` 或 `Ctrl + F5`
   - Mac: `Cmd + Shift + R`
2. **清除浏览器缓存**：
   - Chrome: 设置 → 隐私和安全 → 清除浏览数据 → 选择"缓存的图片和文件"
   - Firefox: 设置 → 隐私与安全 → Cookie和网站数据 → 清除数据
3. **无痕模式测试**：
   - 在无痕/隐私模式下打开网站，查看logo是否正确

---

### 2. Next.js静态文件缓存

**症状**：
- 文件已替换，但开发服务器仍显示旧logo

**解决方案**：
```bash
# 停止开发服务器
# 清除Next.js缓存
rm -rf .next
# 或 Windows PowerShell
Remove-Item -Recurse -Force .next

# 重启开发服务器
npm run dev
```

---

### 3. 文件格式问题

**检查项**：
- ✅ 文件格式：必须是PNG格式
- ✅ 文件大小：建议小于2MB
- ✅ 背景：建议使用透明背景（适合dark模式）
- ✅ 文件名：必须是 `logo.png`（小写）

**推荐规格**：
- **格式**：PNG（支持透明）
- **尺寸**：512x512px 或更高（保持宽高比）
- **颜色**：Indigo紫色 (#6366F1) 或白色（适合dark背景）
- **背景**：透明

---

### 4. 文件路径问题

**检查清单**：
- [ ] 文件位置：`public/logo.png`（不是 `public/imgs/logo.png`）
- [ ] 文件名：`logo.png`（不是 `Logo.png` 或 `LOGO.PNG`）
- [ ] 文件权限：文件可读

---

## 替换步骤

### 方法1：直接替换文件（推荐）

1. **备份旧文件**（可选）：
   ```bash
   copy public\logo.png public\logo.png.backup
   ```

2. **替换文件**：
   - 将新的紫色logo文件复制到 `public/logo.png`
   - 确保文件名完全一致：`logo.png`

3. **清除缓存**：
   ```bash
   # 清除Next.js缓存
   Remove-Item -Recurse -Force .next
   
   # 重启开发服务器
   npm run dev
   ```

4. **硬刷新浏览器**：
   - 按 `Ctrl + Shift + R` 强制刷新

---

### 方法2：使用不同的文件名（测试用）

如果直接替换不生效，可以先用新文件名测试：

1. **添加新logo文件**：
   - 将新logo保存为 `public/logo-new.png`

2. **临时修改配置**（测试用）：
   ```json
   // src/config/locale/messages/en/landing.json
   "logo": {
     "src": "/logo-new.png",
     "alt": "Afterglow Digital Heirloom Logo"
   }
   ```

3. **测试新logo是否显示**：
   - 如果新logo显示，说明是缓存问题
   - 如果新logo也不显示，检查文件格式或路径

4. **测试完成后**：
   - 将配置改回 `/logo.png`
   - 替换 `public/logo.png` 文件

---

## 验证步骤

### 1. 检查文件是否正确替换

```bash
# 查看文件信息
Get-Item public\logo.png | Select-Object Name, Length, LastWriteTime
```

### 2. 检查浏览器网络请求

1. 打开浏览器开发者工具（F12）
2. 切换到"Network"标签
3. 刷新页面（Ctrl+R）
4. 搜索 `logo.png`
5. 查看请求状态：
   - **200 OK**：文件加载成功
   - **304 Not Modified**：浏览器使用缓存
   - **404 Not Found**：文件不存在

### 3. 检查实际加载的图片

1. 在Network标签中找到 `logo.png` 请求
2. 点击查看预览
3. 确认显示的是新logo还是旧logo

---

## 快速修复命令

### Windows PowerShell

```powershell
# 1. 清除Next.js缓存
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# 2. 重启开发服务器（需要手动执行）
# npm run dev
```

### 验证配置

```powershell
# 检查logo配置
Get-Content src\config\locale\messages\en\landing.json | Select-String "logo"

# 检查文件是否存在
Test-Path public\logo.png
```

---

## 常见问题解答

### Q: 为什么配置改了但logo没变？

**A**: 最常见的原因是浏览器缓存。尝试硬刷新（Ctrl+Shift+R）或清除缓存。

### Q: 文件已替换，但开发服务器仍显示旧logo？

**A**: Next.js缓存了静态文件。清除 `.next` 文件夹并重启服务器。

### Q: Logo显示但颜色不对？

**A**: 检查：
1. Logo文件本身是否是正确的紫色
2. CSS是否有filter或invert效果
3. 是否需要在dark模式下使用不同的logo

### Q: Logo不显示（显示为破损图标）？

**A**: 检查：
1. 文件路径是否正确：`/logo.png`
2. 文件格式是否正确：PNG
3. 文件是否损坏：尝试用图片查看器打开

---

## 推荐操作流程

1. ✅ **替换文件**：将新logo复制到 `public/logo.png`
2. ✅ **清除缓存**：删除 `.next` 文件夹
3. ✅ **重启服务器**：`npm run dev`
4. ✅ **硬刷新浏览器**：`Ctrl + Shift + R`
5. ✅ **验证显示**：检查logo是否正确显示

---

## 如果问题仍然存在

请提供以下信息：
1. 浏览器控制台是否有错误信息？
2. Network标签中logo.png的请求状态是什么？
3. 新logo文件的格式和大小是什么？
4. 是否尝试过无痕模式？
