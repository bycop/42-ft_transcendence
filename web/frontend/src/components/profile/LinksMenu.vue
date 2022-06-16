<template>
  <nav class="mb-6">
    <ul class="flex justify-evenly">
      <li v-for="(link, index) in links" :key="link" class="text-lg cursor-pointer" @click="changeCategory(index)">
        <div v-if="index == indexActive" class="color-primary">
          {{ link }}
          <img src="@/assets/line_more_thick.svg" alt="Line" class="w-8 lineThick">
        </div>
        <div v-else class="color-tertiary">
          {{ link }}
        </div>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: "LinksMenu",
  data() {
    return {
      links: [
        "Match History",
        "Friend(s)",
        "Achievement(s)"
      ]
    }
  },
  methods: {
    changeCategory: function(index) {
      this.$emit("categoryButton", index);
    }
  },
  props: {
    indexActive: Number,
  }
}
</script>

<style scoped lang="scss">
.lineThick {
  padding-top: 3px;
}
</style>