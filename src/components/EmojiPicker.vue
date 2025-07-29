<template>
  <div class="emoji-picker" v-if="visible">
    <div class="emoji-header">
      <div class="emoji-categories">
        <button 
          v-for="category in categories" 
          :key="category.name"
          :class="['category-btn', { active: selectedCategory === category.name }]"
          @click="selectCategory(category.name)"
          :title="category.name"
        >
          {{ category.icon }}
        </button>
      </div>
      <div class="search-container">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="搜索表情..." 
          class="emoji-search"
        />
      </div>
    </div>
    
    <div class="emoji-content" ref="emojiContent">
      <div class="emoji-grid">
        <button 
          v-for="emoji in filteredEmojis" 
          :key="emoji.codes"
          class="emoji-item"
          @click="selectEmoji(emoji)"
          :title="emoji.name"
        >
          {{ emoji.char }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import emojiData from '../utils/emoji.js'

// Props
const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['select', 'close'])

// 响应式数据
const searchQuery = ref('')
const selectedCategory = ref('Smileys & Emotion')
const emojiContent = ref(null)

// 表情分类
const categories = ref([
  { name: 'Smileys & Emotion', icon: '😀' },
  { name: 'People & Body', icon: '👋' },
  { name: 'Animals & Nature', icon: '🐶' },
  { name: 'Food & Drink', icon: '🍎' },
  { name: 'Activities', icon: '⚽' },
  { name: 'Travel & Places', icon: '🚗' },
  { name: 'Objects', icon: '💡' },
  { name: 'Symbols', icon: '❤️' },
  { name: 'Flags', icon: '🏁' }
])

// 计算属性：过滤后的表情 
const filteredEmojis = computed(() => {
  let emojis = emojiData
  
  // 按分类过滤
  if (selectedCategory.value && selectedCategory.value !== 'All') {
    emojis = emojis.filter(emoji => emoji.group === selectedCategory.value)
  }
  
  // 按搜索关键词过滤
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    emojis = emojis.filter(emoji => 
      emoji.name.toLowerCase().includes(query) ||
      emoji.category.toLowerCase().includes(query)
    )
  }
  
  return emojis.slice(0, 200) // 限制显示数量以提高性能
})

// 方法
function selectCategory(category) {
  selectedCategory.value = category
  searchQuery.value = ''
  // 滚动到顶部
  if (emojiContent.value) {
    emojiContent.value.scrollTop = 0
  }
}

function selectEmoji(emoji) {
  emit('select', emoji)
}

// 监听可见性变化，重置状态
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    searchQuery.value = ''
    selectedCategory.value = 'Smileys & Emotion'
  }
})
</script>

<style scoped>
.emoji-picker {
  position: absolute;
  bottom: 60px;
  left: 0;
  width: 350px;
  height: 400px;
  background: white;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
}

.emoji-header {
  padding: 12px;
  border-bottom: 1px solid #e1e5e9;
}

.emoji-categories {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  overflow-x: auto;
  padding: 2px;
}

.category-btn {
  min-width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.category-btn:hover {
  background: #f1f5f9;
}

.category-btn.active {
  background: #667eea;
  color: white;
}

.search-container {
  position: relative;
}

.emoji-search {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e1e5e9;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.emoji-search:focus {
  border-color: #667eea;
}

.emoji-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.emoji-item {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 20px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-item:hover {
  background: #f1f5f9;
  transform: scale(1.1);
}

.emoji-item:active {
  transform: scale(0.95);
}

/* 滚动条样式 */
.emoji-categories::-webkit-scrollbar,
.emoji-content::-webkit-scrollbar {
  width: 4px;
  height: 4px;
}

.emoji-categories::-webkit-scrollbar-track,
.emoji-content::-webkit-scrollbar-track {
  background: transparent;
}

.emoji-categories::-webkit-scrollbar-thumb,
.emoji-content::-webkit-scrollbar-thumb {
  background: rgba(102, 126, 234, 0.3);
  border-radius: 2px;
}

.emoji-categories::-webkit-scrollbar-thumb:hover,
.emoji-content::-webkit-scrollbar-thumb:hover {
  background: rgba(102, 126, 234, 0.5);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .emoji-picker {
    width: 300px;
    height: 350px;
  }
  
  .emoji-grid {
    grid-template-columns: repeat(7, 1fr);
  }
}
</style>