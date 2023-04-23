<template>
  <div class="context-menu" :style="{ top: top + 'px', left: left + 'px' }">
    <ul>
      <li v-for="(item, index) in items" :key="index" @click="handleItemClick(item)">
        {{ item }}
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: 'ContextMenu',
  props: {
    top: {
      type: Number,
      default: 0
    },
    left: {
      type: Number,
      default: 0
    },
    items: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    handleItemClick(item) {
      this.$emit('item-click', item)
    }
  }
}
</script>

<style scoped>
.context-menu {
  position: fixed;
  z-index: 100;
  background: white;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.2);
}

.context-menu ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.context-menu li {
  padding: 5px 10px;
  cursor: pointer;
}

.context-menu li:hover {
  background: #f5f5f5;
}
</style>
