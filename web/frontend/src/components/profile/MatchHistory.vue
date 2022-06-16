<template>
  <div class="container mx-auto flex justify-center">
    <p v-if="matchesHistory.length === 0" class="text-center mt-3">
      You have never played to pong. Invite your friends to play with you
    </p>
    <div v-else class="flex flex-wrap justify-center">
      <div v-for="match in matchesHistory" :key="match" class="flex justify-between m-2 mb-1 p-6 myshadowInner rounded-md">
        <router-link :to="{name: 'profile', params: {username: match.opponent_username}}" class="flex flex-col justify-center items-center">
          <AvatarUtility :avatar-link="match.opponent_avatar" style="width: 4rem; height: 4rem;"/>
          <p class="mt-1 text-base">{{match.opponent_username }}</p>
        </router-link>
        <div class="flex flex-col justify-center items-center pl-12 pr-12 text-center">
          <p :class="match.score < match.score_opponent ? 'color-red' : 'color-green'" class="text-lg">
			<span v-if="match.created_at === match.end_at" class="text-gray-500">Cancelled</span>
        	<span v-else>{{ match.score < match.score_opponent ? 'Defeat' : 'Victory' }}</span>
          </p>
          <p class=" color-tertiary text-base ">
            {{ match.is_classic ? 'Classic Game' : 'Custom Game' }}
          </p>
        </div>
        <div class="flex flex-col justify-center items-center text-center">
          <p class="seven-segment text-2xl">{{ match.score }} - {{ match.score_opponent}}</p>
          <p class="max-w-[5rem] text-base "> {{getTimeAgo(match.created_at)}}</p>
          <p v-if="match.time !== 0" class="text-base color-tertiary"> {{getMinutesSec(match.time)}}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AvatarUtility from "@/components/utilities/Avatar";
import * as axios from "axios";
import * as moment from "moment-timezone";
import { useStore } from '../store/store'

export default {
  name: "MatchHistory",
  components: {AvatarUtility},
	setup() {
		useStore()
	},
  data() {
    return {
      matchesHistory: []
    }
  },
  methods: {
    getMatch(user) {
      if (user.username != undefined) {
        axios.get(`http://${this.$store.state.BASE_URL}:3000/api/pong/get-match/` + user.username).then((res) => {
          if (res.data["error"] === undefined && !(res.data == "user not found" || res.data == "")) {
            this.matchesHistory = res.data
          }
        }).catch((err) => {
			console.log(err);
		})
      }
    },
    getMinutesSec(millisecond) {
      let seconds = Math.round(millisecond / 1000 % 60)
      let min = Math.floor(millisecond / 1000 / 60);
      let stringTime = ""

      if (min !== 0)
        stringTime += min + "min "
      stringTime += seconds + "s"
      return stringTime
    },
    getTimeAgo(created_at) {
		  return (moment(created_at).fromNow())
    }
  },
  mounted() {
    axios.get(`http://${this.$store.state.BASE_URL}:3000/api/chat/getUserFromUsername/` + this.$route.params.username).then((res) => {
      if (!(res.data == "not found" || res.data == "")) {
        this.getMatch(res.data);
    }});
  }
}
</script>

<style scoped lang="scss">
.myshadowInner {
  -webkit-box-shadow: inset 0px 0px 5px 0px rgba(0, 0, 0, 0.16);
  -moz-box-shadow: inset 0px 0px 5px 0px rgba(0, 0, 0, 0.16);
  box-shadow: inset 0px 0px 5px 0px rgba(0, 0, 0, 0.16);
}

@font-face {
  font-family: 'Seven Segment';
  src: url('../../assets/fonts/seven_segment.ttf');
}

// FONT FAMILY
.seven-segment {
  font-family: "Seven Segment", sans-serif;
}

</style>