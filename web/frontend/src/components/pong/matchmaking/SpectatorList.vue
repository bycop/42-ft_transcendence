<template>
  <div class="border-accent border-4 border-t-2 w-[35rem] color-secondary rounded-b-lg">
    <div class="h-[26rem] overflow-y-scroll">
      <div v-for="game in games" :key="game.id" class="border-b flex flex-row justify-around py-4 hover:bg-gray-800 cursor-pointer  items-center" @click="goToPort(game.match.port)">
        <div class="flex flex-row w-[270px]">
          <AvatarUtility :avatar-link="game.user_1.avatar" :size="8" />
          <p class="px-3 truncate w-28 ">{{ game.user_1.username }}</p>
          <p>-</p>
          <p class="px-3 truncate w-28 flex justify-end">{{ game.user_2.username }}</p>
          <AvatarUtility :avatar-link="game.user_2.avatar" :size="8" />
        </div>
        <div class="flex flex-col">
          <p>{{ game.match.score_1 }} - {{ game.match.score_2 }}</p>
          <p class="text-xs" v-if="game.match.is_classic === true">Classic</p>
          <p class="text-xs" v-else>Custom</p>
        </div>
        <font-awesome-icon icon="eye" class="" />
      </div>
    </div>
  </div>
</template>

<script>
import * as axios from "axios";
import AvatarUtility from "@/components/utilities/Avatar";
import {useStore} from "../../store/store";

export default {
  name: "SpectatorList",
  setup() {
    useStore();
  },
  data() {
    return {
      games: []
    }
  },
  methods: {
    goToPort(port) {
      this.$store.state.serverPort = port;
      this.$router.push({name: 'pong-game'})
    }
  },
  components: {
    AvatarUtility
  },
  mounted() {
    axios.get(`http://${this.$store.state.BASE_URL}:3000/api/pong/getCurrentGames`)
        .then((resp) => {
          return resp.data;
        }).then((body) => {
      this.games = body ? body : [];
    }).catch((error) => {
      console.log(error);
    });
  }
}
</script>

<style scoped>

</style>