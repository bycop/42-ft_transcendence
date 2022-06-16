<template>
  <div class="w-full h-screen bg-primary flex items-center justify-center flex-col truncate">
    <div class="flex w-full justify-center color-accent">
      <button @click="$event.preventDefault(); action = 0 ;" :class="action == 0 ? classActive2 : classNotActive2"
              class="w-[17.5rem] rounded-tl-lg p-2 border-t-4 border-x-4 border-accent">Play to Pong
      </button>
      <button @click="$event.preventDefault(); action = 1 ;" :class="action == 1 ? classActive2 : classNotActive2"
              class="w-[17.5rem] rounded-tr-lg p-2 border-t-4 border-x-4 border-accent">Watch a Pong
      </button>
    </div>
    <div v-if="action === 0" class="border-accent border-4 border-t-2 w-[35rem] color-secondary rounded-b-lg">
      <div>
        <h2 class="text-center text-xl pt-3">Mode</h2>
        <div class="flex w-full justify-center pb-12 pt-6">
          <button @click="$event.preventDefault(); mode = 0" :class="mode == 0 ? classActive : classNotActive"
                  class="rounded-l-lg p-1 px-8">Classic
          </button>
          <button @click="$event.preventDefault(); mode = 1" :class="mode == 1 ? classActive : classNotActive"
                  class="rounded-r-lg p-1 px-8">Custom
          </button>
        </div>
        <svg viewBox="0 0 100 0.5" xmlns="http://www.w3.org/2000/svg" class="px-2">
          <line stroke-dasharray="4, 2.3" x1="0" y1="0" x2="100" y2="0" class="color-secondary-stroke"/>
        </svg>
        <p class="relative text-center upper2"><span class="bg-primary color-secondary px-2 text-lg">(Optional)</span>
        </p>
        <div class="mt-4 mb-10 flex justify-center">
          <div class="relative w-7/12">
            <input v-model="friend" v-on:keyup.enter="$event.preventDefault(); inviteGame();" type="text"
                   class="relative border-secondary bg-primary border-current border-2 rounded-xl w-full p-3"
                   name="name" placeholder="Username" required>
            <p class="absolute overlayBorder">Invite your friend</p>
            <p v-if="error" class="text-center color-red"> {{ error }} </p>
          </div>
        </div>
        <svg viewBox="0 0 100 0.5" xmlns="http://www.w3.org/2000/svg" class="px-2">
          <line stroke-dasharray="4, 2.3" x1="0" y1="0" x2="100" y2="0" class="color-secondary-stroke"/>
        </svg>
        <div class="my-12 flex justify-center items-center">
          <button @click="friend ? inviteGame() : launchMatchmaking($event)"
                  class="bg-accent rounded-xl px-6 py-1 text-white">Submit
          </button>
        </div>
      </div>
    </div>
    <SpectatorList v-else/>
  </div>
</template>

<script>
import * as axios from "axios";
import FindGame from "./FindGame";
import {useStore} from '../../store/store.ts'
import SpectatorList from "./SpectatorList";

export default {
  name: "FormPlay",
  components: {
    FindGame,
    SpectatorList,
  },
  setup() {
    useStore()
  },
  data() {
    return {
      mode: 0,
      classActive: "bg-secondary color-primary ",
      classNotActive: "border-secondary border-2",
      classActive2: "bg-accent color-primary",
      classNotActive2: "border-accent border-2 text-white",
      friend: null,
      action: 0,
      error: "",
      findGamePopup: false
    }
  },
  methods: {
    launchMatchmaking(e) {
      e.preventDefault()
      axios.post(`http://${this.$store.state.BASE_URL}:3000/api/matchmaking/join`, {isclassic: !this.mode}).then((res) => {
        if (res.data === "success")
          this.$router.push({name: "findGame"});
      }).catch((e) => {
        console.log(e)
      })
    },

    async getUser() {
      await axios.get(`http://${this.$store.state.BASE_URL}:3000/api/chat/getUserFromUsername/${this.friend}`).then((res) => {
        this.$store.state.friend = res.data;
      }).catch((err) => {
		  console.log(err);
	  })
    },
    inviteGame() {
      if (this.friend === this.$store.state.user.username) {
        this.error = "You can't invite yourself";
        return ;
      }
      axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/inviteToPlay`, {
        session: this.$cookies.get("session_id"),
        target: this.friend,
        type: !this.mode ? "classic" : "advanced"
      }).then((resp) => {
            return resp.data;
      }).then(async (body) => {
          this.error = body.success ? "" : "Error: " + body.error;
          if (this.error === "") {
            await this.getUser();
            this.$store.state.mode = this.mode;
            await this.$router.push({name: "findGame"});
          }
      }).catch((error) => {
        console.log(error);
      });
    }
  }
}
</script>

<style scoped lang="scss">
.upper {
  top: -15px;
}

.upper2 {
  top: -18px;
}

input:focus {
  outline-width: 0;
}

.overlayBorder {
  left: 20px;
  top: -10px;
  background-color: $primary;
  padding-left: 10px;
  padding-right: 10px;
}

.color-secondary-stroke {
  stroke: $secondary;
}

::-webkit-scrollbar {
  width: 5px;
}

::-webkit-scrollbar-track {
  background: #000000;
}

::-webkit-scrollbar-thumb {
  background: $accent
}

</style>