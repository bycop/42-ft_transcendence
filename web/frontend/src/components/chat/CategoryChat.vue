<template>
    <div class="flex shadow-inner p-4 shadow justify-around">
            <button @click="onClick('buttonMessages')" id="buttonMessages" class="px-4 py-1 font-medium">Messages</button>
            <button @click="onClick('buttonChannels')" id="buttonChannels" class="px-4 py-1 font-medium text-black">Channels</button>
            <button @click="onClick('buttonFriends')" id="buttonFriends" class="px-4 py-1 font-medium text-black">Friends</button>
      </div>
</template>

<script>
export default {
  name: "CategoryBase",
  props: [
    'oldCategory'
  ],
  data() {
    return {
        category: this.oldCategory
    };
  },
  methods: {
    onClick(id) {
      const buttons = ["buttonMessages", "buttonChannels", "buttonFriends"];
      this.category = id;
      for(let i = 0; buttons[i]; i++) {
        if (buttons[i] != id) {
          document.getElementById(buttons[i]).classList.add("text-black");
          document.getElementById(buttons[i]).classList.remove("bg-orange-600", "rounded-full", "text-white");
        } else {
          document.getElementById(buttons[i]).classList.remove("text-black");
          document.getElementById(buttons[i]).classList.add("bg-orange-600", "rounded-full", "text-white");
        }
      }
      this.$emit("categoryButton", this.category);
    }
  },
  mounted() {
    this.onClick(this.category);
  }
};
</script>

<style scoped>
.shadow {
  -moz-box-shadow: inset 0 -10px 10px -20px #000000;
  -webkit-box-shadow: inset 0 -10px 10px -20px #000000;
  box-shadow: inset 0 -10px 10px -18px #000000;
}
</style>