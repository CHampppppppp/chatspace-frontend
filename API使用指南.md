# API 使用指南

本项目提供了多种方式来调用API，您可以根据需要选择最适合的方式。

## 方式一：使用 useApi Composable（推荐）

### 在组合式API中使用

```javascript
<script setup>
import { useApi } from '@/composables/useApi.js'

// 获取API函数
const { postKeyValueRequest, postRequest, getRequest, putRequest, deleteRequest } = useApi()

// 使用示例
const login = async () => {
  try {
    const response = await postKeyValueRequest('/login', {
      username: 'user',
      password: 'password'
    })
    console.log('登录成功:', response)
  } catch (error) {
    console.error('登录失败:', error)
  }
}
</script>
```

### 优点
- 只需要导入一次 `useApi`
- 支持所有API方法
- 类型安全（如果使用TypeScript）
- 统一的错误处理

## 方式二：使用简化的 api 对象

```javascript
<script setup>
import { api } from '@/composables/useApi.js'

// 直接使用
const fetchData = async () => {
  const users = await api.get('/users')
  const newUser = await api.post('/users', { name: 'John' })
  const loginResult = await api.login('/login', { username, password })
}
</script>
```

### 优点
- 更简洁的语法
- 语义化的方法名
- 无需解构

## 方式三：全局属性（已配置）

在 `main.js` 中已经配置了全局属性，您也可以通过以下方式使用：

```javascript
<script setup>
import { getCurrentInstance } from 'vue'

const instance = getCurrentInstance()
const $api = instance.appContext.config.globalProperties

// 使用全局属性
const login = () => {
  $api.$postKeyValueRequest('/login', data)
}
</script>
```

### 注意
- 需要确保在组件挂载后使用
- 可能在某些情况下返回 null

## 方式四：直接导入（传统方式）

```javascript
<script setup>
import { postKeyValueRequest, postRequest } from '@/api/api.js'

// 直接使用导入的函数
const login = () => {
  postKeyValueRequest('/login', data)
}
</script>
```

## 推荐使用方式

### 对于新项目或新组件
推荐使用 **方式一（useApi Composable）**，因为：
- 提供了统一的API接口
- 更好的代码组织
- 便于维护和测试
- 支持未来的功能扩展

### 对于简单的API调用
可以使用 **方式二（api 对象）**，语法更简洁。

## 错误处理最佳实践

```javascript
<script setup>
import { useApi } from '@/composables/useApi.js'
import { ElMessage } from 'element-plus'

const { postRequest } = useApi()

const handleApiCall = async () => {
  try {
    const response = await postRequest('/api/data', payload)
    ElMessage.success('操作成功')
    return response
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
    throw error
  }
}
</script>
```

## 类型定义（TypeScript 支持）

如果您使用 TypeScript，可以为 API 响应定义类型：

```typescript
interface LoginResponse {
  token: string
  user: {
    id: number
    username: string
    email: string
  }
}

const { postKeyValueRequest } = useApi()

const login = async (): Promise<LoginResponse> => {
  return await postKeyValueRequest<LoginResponse>('/login', credentials)
}
```

## 总结

- **useApi Composable** 是最推荐的方式，提供了最好的开发体验
- **api 对象** 适合简单快速的API调用
- **全局属性** 作为备用方案
- **直接导入** 适合特殊情况或迁移现有代码

选择适合您项目需求的方式，保持代码的一致性和可维护性。