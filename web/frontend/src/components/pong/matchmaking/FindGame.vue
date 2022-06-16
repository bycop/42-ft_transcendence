<template>
  <div class="w-full h-screen flex justify-center items-center bg-primary">
    <div class="flex flex-col items-center">
      <h1 class="color-secondary text-2xl text-center">
        <span v-if="error !== null" class="color-red"> {{ error }}</span>
        <span v-else-if="friend == null || friend === ''">Finding game</span>
        <span v-else>Waiting {{friend.username}}</span>
        ...
      </h1>
      <div class="w-2/3 h-2 rounded-lg bg-secondary mt-6"></div>
      <div class="h-32 w-2/3 flex justify-center">
        <svg height="20" width="20" class="flex justify-center translateCircle">
          <circle cx="10" cy="10" r="8" stroke="white" stroke-width="3" fill="white" class="color-accent-circle "/>
        </svg>
      </div>
      <div class="w-2/3 h-2 rounded-lg bg-secondary mb-6"></div>
      <div class="w-2/3 flex justify-center">
        <button  @click="this.$router.push({name: 'home'})" class="bg-red rounded-xl px-6 py-1 text-white">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script>
import * as axios from "axios";
import {MatchmakingStatus} from "../../../../../shared/pong/matchmaking";
import {useStore} from '../../store/store.ts'

export default {
  name: "FindGame",
  setup() {
    useStore()
  },
  data() {
    return {
      gameFound: false,
      pause: false,
      error: null,
      friend: null,
      mode: null
    };
  },
  methods: {
    cancelMatchmaking(answer) {
      this.pause = true;
      if (answer) {
        if (this.$store.state.friend) {
        //   console.log("decline invite")
          axios.get(`http://${this.$store.state.BASE_URL}:3000/api/chat/deleteInvite/${this.$store.state.friend.id}`);
          this.$store.state.friend = null;
          this.$store.state.mode = 0;
        }
        else
        //   console.log("leave matchmaking")
          axios.get(`http://${this.$store.state.BASE_URL}:3000/api/matchmaking/leave`);
          window.removeEventListener( 'unload', () => {});
        }
      else {
        this.pause = false;
        if (this.$store.state.friend)
          this.statusFriend();
        else
          this.statusMatchmaking();
        return false;
      }
      return true;
    },
    statusMatchmaking() {
      if (this.pause)
        return;
      axios.get(`http://${this.$store.state.BASE_URL}:3000/api/matchmaking/status`).then((res) => {
        if (res.data.Status === MatchmakingStatus.Found)
        {
          this.$store.commit("setServerPort", res.data.ServerPort);
          this.$store.state.user.game = 1;
          setTimeout( () => {this.$router.push({name: 'pong-game'})}, 1000);
        }
        else if (res.data.Status === MatchmakingStatus.Searching)
        {
          window.setTimeout(() => {
            this.statusMatchmaking()
          }, 1000);
        }
      }).catch((err) => {
          console.log(err);
      })
    },
    statusFriend() {
      axios.get(`http://${this.$store.state.BASE_URL}:3000/api/chat/statusInviteToPlay/${this.friend.username}`).then((res) => {
        if (res.data.error) {
          this.error = res.data.error;
          window.setTimeout(() => {
            this.$router.push({name: 'home'})
          }, 3000);
        }
        else if (res.data === "Waiting" && !this.pause) {
          window.setTimeout(() => {
            this.statusFriend()
          }, 3000);
        } else {
          this.$store.state.serverPort = res.data;
          this.$store.state.user.game = 1;
          this.$router.push({name: 'pong-game'})
        }
      }).catch((err) => {
		  console.log(err);
	  })
    }

  },
  mounted() {
    window.addEventListener('unload', (event) => {
      event.preventDefault();
      this.cancelMatchmaking(true);
    });
    this.friend = this.$store.state.friend;
    this.mode = this.$store.state.mode;
    if (this.friend == null || this.friend === "")
    {
      this.statusMatchmaking();
    } else {
      this.statusFriend();
    }
  },
  beforeRouteLeave(to, from) {
    if (to.name !== "pong-game") {
      let answer = ''
      if (this.$store.state.friend)
        answer = window.confirm('Do you really want to cancel invitation ?');
      else
        answer = window.confirm('Do you really want to leave matchmaking ?');
      return this.cancelMatchmaking(answer);
    }
  }
}
</script>

<style scoped lang="scss">
.color-accent-circle {
  stroke: $accent;
  fill: $accent;
}
.translateCircle {
  animation: animTranslate 1s linear infinite;
}
@keyframes animTranslate {
  0% {}
  50% { transform: translateY(108px); }
  100% {}
}
</style>