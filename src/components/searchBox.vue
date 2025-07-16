<template>
  <div class="search-box">
    <input 
      :value="modelValue" 
      @input="$emit('update:modelValue', $event.target.value)"
      type="text" 
      :placeholder="placeholder" 
      class="search-input" 
    />
    <button class="search-icon" @click="handleSearch">🔍</button>
  </div>
</template>

<script setup>
// Props
defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: '搜索...'
  }
})

// Emits
defineEmits(['update:modelValue', 'search'])

// Methods
function handleSearch() {
  console.log("子组件handle")
}
</script>

<style scoped>
.search-box {
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 15px;
  border: 2px solid transparent;
  border-radius: 25px;
  background: rgba(240, 240, 240, 0.8);
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: #667eea;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
}

.search-icon {
  position: absolute;
  right: 15px;
  top: 45%;
  transform: translateY(-40%);
  color: #999;
  font-size: 16px;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.search-icon:hover {
  color: #667eea;
  transform: translateY(-40%) scale(1.1);
}
</style>
