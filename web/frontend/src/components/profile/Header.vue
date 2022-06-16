<template>
  <header class="pt-20">
    <img src="@/assets/profile/header_profile.png" alt="Header" class="w-full">
    <div class="flex info ml-20 h-full">
      <div class="w-28 h-28 mr-3 relative">
        <router-link :to="{name: 'settings'}" class="bg-white absolute rounded-full shadow-xl left-1 bottom-1 w-7 h-7 flex items-center justify-center z-10"  v-if="this.user.username === this.$store.state.user.username">
			    <font-awesome-icon icon="pen" class="text-sm " />
        </router-link>
        <AvatarUtility :avatar-link="user.avatar" :size="28" style="border-width: 6px;" />
      </div>
      <div class="flex justify-center flex-col mt-7">
        <p class="color-primary text-xl">{{ user.username }}</p>
        <p class="color-tertiary text-sm"> Level {{ user.ladder }}</p>
      </div>
    </div>
  </header>
</template>

<script>
import AvatarUtility from "@/components/utilities/Avatar";
import {useStore} from "../store/store";

export default {
  name: "HeaderProfile",
  components: {AvatarUtility},
  props: {
    user: Object,
  },
  setup () {
    useStore()
  },
}
</script>

<style scoped lang="scss">
  .info {
    position: relative;
    top: -35px;
  }
  i.fa-solid.fa-pen:hover {
    color: $tertiary;
    cursor: pointer;
  }


</style>