<template>
  <div class="container mx-auto flex justify-center">
    <p v-if="friends.length === 0" class="text-center mt-3">
      You have no friend yet.
    </p>
    <div v-else class="flex flex-wrap flex-grow justify-center">
      <router-link :to="{name: 'profile', params: {username: friend.username}}" v-for="friend in friends" :key="friend" class="flex childFlex m-2 mb-1 p-6 myshadowInner rounded-md items-center">
        <AvatarUtility :avatar-link="friend.avatar" :size="16"/>
        <div class="flex flex-col justify-center ml-4">
          <p class="limitSize text-lg"> {{friend.username }} </p>
          <p class="color-tertiary text-base">Level {{friend.ladder }}</p>
        </div>
      </router-link>
    </div>
  </div>
</template>

<script>
import AvatarUtility from "@/components/utilities/Avatar";
import * as axios from "axios";
import { useStore } from '../store/store'

export default {
  name: "FriendsList",
  props: {
    user: Object,
  },
	setup() {
		useStore()
	},
  data() {
    return {
        friends : [],
    }
  },
  methods: {
    getFriends() {
      axios.get(`http://${this.$store.state.BASE_URL}:3000/api/profile/getFriends/` + this.user.username).then((res) => {
        if (res.data !== "not found")
          this.friends = res.data
      }).catch(() => {})
    }
  },
  components: {
    AvatarUtility
  },
  mounted() {
    this.getFriends()
  }
}
</script>

<style scoped lang="scss">
.myshadowInner {
  -webkit-box-shadow: inset 0px 0px 5px 0px rgba(0, 0, 0, 0.16);
  -moz-box-shadow: inset 0px 0px 5px 0px rgba(0, 0, 0, 0.16);
  box-shadow: inset 0px 0px 5px 0px rgba(0, 0, 0, 0.16);
}

@media screen and (min-width: $laptop) {
  .childFlex {
    flex: 0 0 30%;
    max-width: 30%;
  }

}
@media screen and (max-width: 767px) {
  .childFlex {
    flex: 0 0 90%;
  }
}

@media screen and (min-width: 768px) {
  .limitSize {
    width: 100px;
  }
}
</style>