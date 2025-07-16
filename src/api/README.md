# DeepSeek API 集成说明

本项目已集成 DeepSeek API，为 AI 聊天功能提供真实的人工智能对话能力。

## 🚀 快速开始

### 1. 获取 API 密钥

1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册账号并登录
3. 在控制台中创建 API 密钥
4. 复制您的 API 密钥

### 2. 配置环境变量

1. 复制 `.env.example` 文件并重命名为 `.env`
2. 在 `.env` 文件中设置您的 API 密钥：

```env
VITE_DEEPSEEK_API_KEY=your-actual-api-key-here
VITE_DEEPSEEK_API_BASE=https://api.deepseek.com/v1
```

### 3. 启动应用

```bash
npm run dev
```

## 🤖 支持的 AI 助手类型

### 1. 通用助手 🤖
- **模型**: `deepseek-chat`
- **功能**: 智能对话和问答，帮助解决各种问题
- **适用场景**: 日常咨询、知识问答、创意讨论

### 2. 翻译助手 🌐
- **模型**: `deepseek-chat`
- **功能**: 多语言翻译服务，支持100+种语言
- **适用场景**: 文本翻译、语言学习、跨语言交流

## 🔧 技术特性

### API 调用功能
- ✅ 真实 AI 对话
- ✅ 上下文记忆（最近10条消息）
- ✅ 不同 AI 类型的专业化 System Prompt
- ✅ 自动重试机制
- ✅ 错误处理和降级
- ✅ 流式响应支持（可选）

### 配置管理
- ✅ 环境变量配置
- ✅ API 状态监控
- ✅ 配置验证
- ✅ 开发/生产环境适配

### 错误处理
- ✅ 网络错误重试
- ✅ API 限流处理
- ✅ 用户友好的错误提示
- ✅ 降级到本地模拟回复

## 📁 文件结构

```
src/
├── api/
│   ├── deepseek.js          # DeepSeek API 主要接口
│   └── README.md            # API 使用说明
├── utils/
│   └── apiConfig.js         # API 配置管理
├── store/
│   └── ai.js               # AI 状态管理
└── components/
    └── aiArea.vue          # AI 聊天界面组件
```

## 🛠️ API 接口说明

### `callDeepSeekAPI(aiType, messages, userMessage)`

标准 API 调用，一次性返回完整回复。

**参数:**
- `aiType`: AI 助手类型（'通用助手', '翻译助手'）
- `messages`: 历史消息数组
- `userMessage`: 用户当前输入

**返回:** Promise<string> - AI 回复内容

### `callDeepSeekAPIStream(aiType, messages, userMessage, onChunk)`

流式 API 调用，实时返回回复片段。

**参数:**
- `aiType`: AI 助手类型
- `messages`: 历史消息数组
- `userMessage`: 用户当前输入
- `onChunk`: 接收回复片段的回调函数

**返回:** Promise<string> - 完整的 AI 回复内容

### `validateAPIKey()`

验证 API 密钥是否有效。

**返回:** Promise<boolean> - 是否有效

### `getAvailableModels()`

获取可用的模型列表。

**返回:** Promise<Array> - 模型列表

## ⚙️ 配置选项

### 环境变量

| 变量名 | 说明 | 默认值 | 必需 |
|--------|------|--------|------|
| `VITE_DEEPSEEK_API_KEY` | DeepSeek API 密钥 | - | ✅ |
| `VITE_DEEPSEEK_API_BASE` | API 基础 URL | `https://api.deepseek.com/v1` | ❌ |
| `VITE_APP_NAME` | 应用名称 | `ChatSpace` | ❌ |
| `VITE_APP_VERSION` | 应用版本 | `1.0.0` | ❌ |

### API 参数

| 参数 | 说明 | 默认值 |
|------|------|--------|
| `temperature` | 回复创造性 (0-1) | `0.7` |
| `max_tokens` | 最大回复长度 | `2048` |
| `top_p` | 核采样参数 | `0.9` |
| `timeout` | 请求超时时间 | `30000ms` |
| `maxRetries` | 最大重试次数 | `3` |

## 🚨 注意事项

### 安全性
- ❗ **不要将 API 密钥提交到版本控制系统**
- ❗ **使用 `.env` 文件存储敏感信息**
- ❗ **生产环境中确保 API 密钥安全**

### 性能优化
- 💡 历史消息限制为最近 10 条，避免 token 过多
- 💡 使用流式响应提升用户体验
- 💡 实现自动重试机制处理网络问题

### 成本控制
- 💰 监控 API 使用量
- 💰 合理设置 `max_tokens` 参数
- 💰 考虑实现用户使用限制

## 🔍 故障排除

### 常见问题

**Q: API 调用失败，提示密钥无效？**
A: 检查 `.env` 文件中的 `VITE_DEEPSEEK_API_KEY` 是否正确设置。

**Q: 网络连接失败？**
A: 检查网络连接，确认 API 服务可访问。

**Q: 请求频率过高？**
A: DeepSeek API 有频率限制，请适当降低请求频率。

**Q: 回复内容为空？**
A: 检查 API 响应格式，确认模型返回了有效内容。

### 调试模式

在开发环境中，可以通过浏览器控制台查看详细的 API 调用日志：

```javascript
// 查看 API 状态
console.log(apiStatus.getStatus())

// 查看配置信息
console.log(getAPIConfig())
```

## 📞 技术支持

如果遇到问题，请：
1. 查看浏览器控制台的错误信息
2. 检查网络连接和 API 配置
3. 参考 [DeepSeek 官方文档](https://platform.deepseek.com/docs)
4. 联系开发团队获取支持

---

**祝您使用愉快！** 🎉