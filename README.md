# Edge Notes

一个基于 Cloudflare Workers 的极简备忘录应用。部署在自己的域名上，支持多页笔记管理、管理员后台编辑、自定义背景图片、磨砂玻璃效果和实时透明度调整。

## ✨ 功能特性

- **多页面笔记管理**：支持创建、编辑、删除多个笔记页面，快速切换
- **管理员认证**：使用密码保护的后台管理界面，只有授权用户能编辑
- **自定义背景图**：支持 PC 和手机端分别设置不同的背景图片 URL
- **磨砂玻璃效果**：半透明卡片 + 背景模糊，UI 界面简约不突兀
- **实时透明度调整**：后台可直接调整卡片、文章、侧边栏、编辑区的透明度，即时预览
- **实时保存**：支持 Ctrl/Cmd+S 快捷键保存，自动提示保存状态
- **极简部署**：完全基于 Cloudflare Workers，无需自建服务器
- **全球加速**：利用 Cloudflare 边缘节点分发，访问速度快
- **数据持久化**：使用 Workers KV 存储笔记内容、配置和透明度设置

## 🚀 快速开始

### 前置要求

- Cloudflare 账号（免费账户即可）
- 一个托管在 Cloudflare 的域名（可选，Worker 自带子域名）
- 浏览器访问 Cloudflare Dashboard

### 部署步骤

#### 1. 创建 KV 命名空间

登录 [Cloudflare Dashboard](https://dash.cloudflare.com)：

- 左侧菜单 → **Workers & Pages** → **KV** → **Create a namespace**
- 命名为 `NOTES`（重要：必须这个名字）
- 记下 **ID** 和 **Preview ID**（稍后用）

#### 2. 创建 Worker

- **Workers & Pages** → **Overview** → **Create application** → **Workers** → **Deploy**
- 输入 Worker 名称（如 `edge-notes`）
- 点击 **Create** 进入编辑器

#### 3. 粘贴代码

- 编辑器中删除默认代码
- 复制本项目中的完整代码到编辑器
- 点击右上角 **Save and Deploy**

#### 4. 配置 KV 绑定

在 Worker 设置页面：

- 左侧 **Settings** → **Variables** → **KV namespace bindings** → **Add binding**
- Variable name: `NOTES`
- KV namespace: 选择刚才创建的 `NOTES`
- 点击 **Save**

#### 5. 设置环境变量（Secrets）

仍在 **Settings** → **Variables**，点 **Add variable**（或 Encrypted）：

- **Variable name**: `ADMIN_PASSWORD`
  - **Value**: 输入你的管理员密码（如 `mypassword123`）
  - 点 **Encrypt** → **Save**

- **Variable name**: `SECRET_KEY`
  - **Value**: 输入一个随机强密码（如 `tyreamon2099` 或更复杂的字符串）
  - 点 **Encrypt** → **Save**

#### 6. 绑定自定义域名（可选）

- 左侧 **Triggers** → **Add Custom Domain**
- 输入你的域名（如 `notes.yourdomain.com`）
- Cloudflare 会自动添加 DNS 记录
- 等待 5-10 分钟 DNS 生效

#### 7. 测试

访问 Worker URL 或你的域名：

- 首页 `/` 显示笔记内容
- `/admin` 输入管理员密码登录后台
- 后台可以编辑笔记、添加新页面、设置背景图、调整透明度

## 📝 使用指南

### 首页（公开阅读）

- 显示当前笔记内容
- 点击标签栏切换不同页面
- 点击"管理"按钮进入后台
- 背景图自动根据设备屏幕比例切换（PC 用横屏背景，手机用竖屏背景）

### 后台管理（`/admin`）

#### 认证

- 输入管理员密码登录
- 登录后的 Cookie 有效期 30 天

#### 页面管理（左侧边栏 - 上部分）

- **页面列表**：显示所有笔记页面，点击切换编辑
- **新建页面**：输入页面名称，点"新建"创建新页面
- **删除页面**：点击页面后的"删"按钮删除（首页 `page1` 无法删除）

#### 编辑笔记（中间编辑区）

- **大文本框**：输入或编辑笔记内容
- **保存**：点"保存"按钮或按 **Ctrl+S**（Mac: **Cmd+S**）
- **状态提示**：保存成功会显示"已保存"

#### 背景图设置（左侧边栏 - 中部分）

- **PC 背景图 URL**：输入电脑端背景图的完整 URL
- **手机背景图 URL**：输入手机端背景图的完整 URL
- **保存背景图**：点击后保存，页面自动刷新显示效果

#### 透明度调整（左侧边栏 - 下部分）⭐ 新增

- **卡片透明度**：调整主卡片的半透明程度
- **文章透明度**：调整首页文章区域的透明度
- **侧边栏透明度**：调整后台左侧边栏的透明度
- **编辑区透明度**：调整编辑文本框所在区域的透明度
- **滑块范围**：0.05（高透明，背景清晰）~ 0.95（低透明，偏黑）
- **实时显示**：拖动滑块时，右侧实时显示当前透明度数值（如 0.28）
- **保存透明度**：点击后保存到 KV，刷新页面自动加载

### 快捷键

- **Ctrl/Cmd+S**：快速保存当前编辑的笔记

## 🎨 自定义配置

### 修改管理员密码

1. 登录 Cloudflare Dashboard
2. 进入 Worker → **Settings** → **Variables**
3. 找到 `ADMIN_PASSWORD`，点编辑
4. 修改密码值，保存
5. 重新部署（点 **Deploy**）

### 通过后台调整透明度（推荐）⭐

**无需修改代码，直接在后台调整！**

1. 登录后台 `/admin`
2. 左侧边栏最下方 → "透明度调整"
3. 拖动 4 个滑块调整透明度
4. 点"保存透明度"
5. 页面自动刷新，效果即时生效
6. 刷新后透明度不会丢失（已保存到 KV）

### 调整默认透明度值（代码级别）

如果想改代码中的默认值，找到 Worker 代码中的这一行：

```javascript
async function getOpacitySettings(env) {
  const settings = {
    card: parseFloat((await env.NOTES.get("opacity:card")) || "0.28"),
    article: parseFloat((await env.NOTES.get("opacity:article")) || "0.28"),
    sidebar: parseFloat((await env.NOTES.get("opacity:sidebar")) || "0.22"),
    editor: parseFloat((await env.NOTES.get("opacity:editor")) || "0.25"),
  };
  return settings;
}
```

修改 `|| "0.XX"` 后的数值即可改变默认透明度。

### 调整模糊强度

找到 CSS 中的 `backdrop-filter: blur(10px)` 修改 `10px`：

- `5px`：轻微模糊
- `10px`：中等模糊（推荐）
- `15px`：强模糊（可能影响性能）

## 📊 数据存储结构

所有数据存储在 Workers KV 中，键名规范：

| 键名 | 用途 | 示例 |
|------|------|------|
| `pages:list` | 页面 ID 列表（逗号分隔） | `page1,page_1731234567890` |
| `note:page1` | 页面内容 | `这是第一个页面的内容` |
| `title:page1` | 页面标题 | `首页` |
| `bg:pc` | PC 端背景图 URL | `https://example.com/bg-pc.jpg` |
| `bg:mobile` | 手机端背景图 URL | `https://example.com/bg-mobile.jpg` |
| `opacity:card` | 卡片透明度 | `0.28` |
| `opacity:article` | 文章透明度 | `0.28` |
| `opacity:sidebar` | 侧边栏透明度 | `0.22` |
| `opacity:editor` | 编辑区透明度 | `0.25` |

## 🔐 安全性说明

- **ADMIN_PASSWORD**：用于登录认证，明文存储在 Worker Secrets（加密）
- **SECRET_KEY**：用于签名 Cookie，防止被篡改
- **Cookie**：使用 HttpOnly + Secure + SameSite=Strict，防止 XSS 攻击
- **CSP 头**：限制脚本和资源加载来源
- **透明度设置**：仅登录用户可修改，防止未授权访问

## 🌍 响应式设计

- **PC 端**（宽屏）：左侧边栏 + 中间编辑区的两栏布局
- **手机端**（竖屏）：自动切换为单栏，编辑区全宽，侧边栏上滑查看
- **背景图**：自动根据屏幕比例切换（横屏用 PC 背景，竖屏用手机背景）

## 📱 背景图建议

- **格式**：JPG（推荐，文件小）、PNG、WebP
- **尺寸**：
  - PC 端：1920×1080 或 2560×1440
  - 手机端：1080×1920 或 1440×2560
- **文件大小**：单个不超过 5MB（加载快）
- **推荐来源**：
  - 免费图片：Unsplash、Pexels、Pixabay、Unsplash API
  - 对象存储：阿里云 OSS、腾讯 COS、又拍云、Cloudflare Image
  - 图片 CDN：Cloudflare Image Optimization

## 🎛️ 透明度调整示例

| 透明度值 | 效果 | 推荐场景 |
|---------|------|---------|
| 0.05 ~ 0.15 | 很透明，背景清晰可见 | 喜欢看背景图的用户 |
| 0.20 ~ 0.35 | 中等透明，平衡观感 | 日常使用（推荐默认值） |
| 0.40 ~ 0.60 | 较深，背景模糊 | 长时间编辑，减少视觉干扰 |
| 0.70 ~ 0.95 | 很深，接近完全不透明 | 不想看背景图 |

## 🐛 常见问题

### Q: 透明度设置不生效

**A:** 
- 确认已点击"保存透明度"按钮
- 页面自动刷新后查看效果
- 如果仍未生效，检查浏览器控制台是否有错误信息
- 尝试手动刷新页面（F5 或 Cmd+R）

### Q: 保存笔记时提示"保存失败"

**A:** 检查以下几点：
- 是否成功登录（Cookie 未过期）
- KV 绑定是否正确（Settings → KV namespace bindings）
- 管理员密码是否正确设置
- 查看浏览器开发者工具 Console 是否有错误信息

### Q: 背景图不显示

**A:** 
- 检查图片 URL 是否正确（复制到浏览器地址栏测试）
- 确认图片允许跨域访问（CORS）
- 尝试用其他图片 URL 测试
- 清除浏览器缓存重新加载
- 检查图片文件大小（不要超过 10MB）

### Q: 登录后仍然无法编辑

**A:**
- 检查 Cookie 是否有效（F12 → Application → Cookies）
- Cookie 名称应为 `edgenote`
- 尝试清除 Cookie 重新登录

### Q: Worker 返回 "Internal Error"

**A:**
- 检查代码是否完整复制（没有遗漏或多余空行）
- 确认 KV 和 Secrets 都已正确配置
- 查看 Worker 的日志（Dashboard → Logs）
- 尝试重新部署一次

### Q: 透明度滑块无法拖动

**A:**
- 确保已登录后台
- 刷新页面重新加载 JavaScript
- 检查浏览器是否支持 `<input type="range">`（所有现代浏览器都支持）

### Q: 多个设备上的透明度设置不同步

**A:** 这是正常的，因为透明度设置会动态应用到 CSS，但不影响实际保存的数据。如果要在所有设备上统一透明度：
- 在一个设备上调整完后，将滑块值记录下来
- 在其他设备上手动设置相同的值并保存

## 📦 部署到其他域名

如果要在多个域名使用同一个 Worker：

1. 在 Worker 的 **Triggers** 中添加多个 Custom Domain
2. 或者在 Zone 的 Page Rules 中创建转发规则
3. 每个域名都会访问同一个 Worker，共享相同的 KV 数据（包括透明度设置）

## 🔄 更新代码

部署新版本代码：

1. 进入 Worker 编辑器
2. 替换代码内容
3. 点击 **Save and Deploy**
4. 无需重新配置 KV、Secrets、背景图和透明度设置（会自动保留）

## 📈 性能优化

- Cloudflare Workers 在全球 200+ 个数据中心运行，访问速度快
- KV 数据自动在边缘节点缓存，多次访问无延迟
- 建议背景图片托管在 CDN（如 Cloudflare Image Optimization）
- 透明度和背景图设置都缓存在 KV，不会重复计算

## 🚢 生产部署建议

- ✅ 使用强管理员密码（12+ 字符，包含大小写字母、数字和特殊符号）
- ✅ 定期备份 KV 中的重要数据（通过 Cloudflare API）
- ✅ 为背景图设置启用 CDN 加速
- ✅ 启用 Cloudflare 的 DDoS 防护和速率限制
- ✅ 监控 Worker 的请求日志和错误率

## 📄 许可证

MIT License - 自由使用、修改和分发

## 🤝 贡献

欢迎提交 Issue 和 Pull Request

## 📞 支持

遇到问题？检查以下内容：

1. 重新阅读本 README 中的"常见问题"部分
2. 查看 Cloudflare 官方文档：https://developers.cloudflare.com/workers/
3. 检查浏览器控制台（F12）是否有错误信息
4. 在 GitHub 提交 Issue

## 🎯 功能规划

- [ ] 笔记搜索功能
- [ ] Markdown 支持
- [ ] 定时自动保存
- [ ] 笔记导出（PDF/Markdown）
- [ ] 分享笔记链接（只读模式）
- [ ] 多管理员支持
- [ ] 笔记版本历史

---

**最后更新**：2025-11-05

**版本**：2.0.0（含透明度控制面板）

**开发者**：Edge Notes Team

祝你使用愉快！🎉

如有建议或问题，欢迎反馈！💬