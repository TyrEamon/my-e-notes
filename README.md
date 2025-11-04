# Edge Notes

一个基于 Cloudflare Workers 的极简备忘录应用。部署在自己的域名上，支持多页笔记管理、管理员后台编辑、自定义背景图片和磨砂玻璃效果。

## ✨ 功能特性

- **多页面笔记管理**：支持创建、编辑、删除多个笔记页面，快速切换
- **管理员认证**：使用密码保护的后台管理界面，只有授权用户能编辑
- **自定义背景图**：支持 PC 和手机端分别设置不同的背景图片 URL
- **磨砂玻璃效果**：半透明卡片 + 背景模糊，UI 界面简约不突兀
- **实时保存**：支持 Ctrl/Cmd+S 快捷键保存，自动提示保存状态
- **极简部署**：完全基于 Cloudflare Workers，无需自建服务器
- **全球加速**：利用 Cloudflare 边缘节点分发，访问速度快
- **数据持久化**：使用 Workers KV 存储笔记内容和配置

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
- 后台可以编辑笔记、添加新页面、设置背景图

## 📝 使用指南

### 首页（公开阅读）

- 显示当前笔记内容
- 点击标签栏切换不同页面
- 点击"管理"按钮进入后台

### 后台管理（`/admin`）

#### 认证

- 输入管理员密码登录
- 登录后的 Cookie 有效期 30 天

#### 页面管理（左侧边栏）

- **页面列表**：显示所有笔记页面，点击切换编辑
- **新建页面**：输入页面名称，点"新建"创建新页面
- **删除页面**：点击页面后的"删"按钮删除（首页 `page1` 无法删除）

#### 编辑笔记（中间编辑区）

- **大文本框**：输入或编辑笔记内容
- **保存**：点"保存"按钮或按 **Ctrl+S**（Mac: **Cmd+S**）
- **状态提示**：保存成功会显示"已保存"

#### 背景图设置（侧边栏底部）

- **PC 背景图 URL**：输入电脑端背景图的完整 URL
- **手机背景图 URL**：输入手机端背景图的完整 URL
- **保存背景图**：点击后保存，页面自动刷新显示效果

### 快捷键

- **Ctrl/Cmd+S**：快速保存当前编辑的笔记

## 🎨 自定义配置

### 修改管理员密码

1. 登录 Cloudflare Dashboard
2. 进入 Worker → **Settings** → **Variables**
3. 找到 `ADMIN_PASSWORD`，点编辑
4. 修改密码值，保存
5. 重新部署（点 **Deploy**）

### 调整磨砂玻璃效果

在 Worker 代码中找到 `<style>` 部分，修改 RGBA 值：

```css
.card{background:rgba(21,24,33,0.28);...}     /* 卡片透明度 */
.read article{background:rgba(21,24,33,0.28);...}  /* 文章透明度 */
.sidebar{background:rgba(21,24,33,0.22);...}  /* 侧边栏透明度 */
.editor{background:rgba(21,24,33,0.25);...}   /* 编辑区透明度 */
```

透明度说明：
- `0.10` ~ `0.15`：很透明，背景清晰
- `0.20` ~ `0.30`：中等透明，推荐值
- `0.40` ~ `0.50`：较深，背景模糊

### 调整模糊强度

找到 `backdrop-filter: blur(10px)` 修改 `10px`：

- `5px`：轻微模糊
- `10px`：中等模糊（推荐）
- `15px`：强模糊（可能影响性能）

### 改为白色磨砂玻璃

找到所有 `rgba(21,24,33,...)` 替换为 `rgba(255,255,255,...)`，透明度改为 `0.08` ~ `0.12`：

```css
.card{background:rgba(255,255,255,0.12);...}
```

## 📊 数据存储结构

所有数据存储在 Workers KV 中，键名规范：

| 键名 | 用途 | 示例 |
|------|------|------|
| `pages:list` | 页面 ID 列表（逗号分隔） | `page1,page_1731234567890,page_1731234568000` |
| `note:page1` | 页面内容 | `这是第一个页面的内容` |
| `title:page1` | 页面标题 | `首页` |
| `bg:pc` | PC 端背景图 URL | `https://example.com/bg-pc.jpg` |
| `bg:mobile` | 手机端背景图 URL | `https://example.com/bg-mobile.jpg` |

## 🔐 安全性说明

- **ADMIN_PASSWORD**：用于登录认证，明文存储在 Worker Secrets（加密）
- **SECRET_KEY**：用于签名 Cookie，防止被篡改
- **Cookie**：使用 HttpOnly + Secure + SameSite=Strict，防止 XSS 攻击
- **CSP 头**：限制脚本和资源加载来源

## 🌍 响应式设计

- **PC 端**（宽屏）：左侧边栏 + 中间编辑区的两栏布局
- **手机端**（竖屏）：自动切换为单栏，编辑区全宽，侧边栏上滑查看

## 📱 背景图建议

- **格式**：JPG（推荐，文件小）、PNG、WebP
- **尺寸**：
  - PC 端：1920×1080 或 2560×1440
  - 手机端：1080×1920 或 1440×2560
- **文件大小**：单个不超过 5MB（加载快）
- **推荐来源**：
  - 免费图片：Unsplash、Pexels、Pixabay
  - 对象存储：阿里云 OSS、腾讯 COS、又拍云

## 🐛 常见问题

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

## 📦 部署到其他域名

如果要在多个域名使用同一个 Worker：

1. 在 Worker 的 **Triggers** 中添加多个 Custom Domain
2. 或者在 Zone 的 Page Rules 中创建转发规则
3. 每个域名都会访问同一个 Worker，共享相同的 KV 数据

## 🔄 更新代码

部署新版本代码：

1. 进入 Worker 编辑器
2. 替换代码内容
3. 点击 **Save and Deploy**
4. 无需重新配置 KV、Secrets 和域名

## 📈 性能优化

- Cloudflare Workers 在全球 200+ 个数据中心运行，访问速度快
- KV 数据自动在边缘节点缓存，多次访问无延迟
- 建议背景图片托管在 CDN（如 Cloudflare Image Optimization）

## 📄 许可证

MIT License - 自由使用、修改和分发

## 🤝 贡献

欢迎提交 Issue 和 Pull Request

## 📞 支持

遇到问题？检查以下内容：

1. 重新阅读本 README 中的"常见问题"部分
2. 查看 Cloudflare 官方文档：https://developers.cloudflare.com/workers/
3. 检查浏览器控制台（F12）是否有错误信息

---

**最后更新**：2025-11-05

**版本**：1.0.0

祝你使用愉快！ 🎉