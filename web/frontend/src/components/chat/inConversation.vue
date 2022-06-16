<template>
  <div class="md:border-t md:rounded-t-xl md:border-r md:w-full relative h-full">
    <header class="p-1 border-b bg-white flex justify-between items-center md:rounded-t-xl shadow-b">
      <router-link :to="{ name: 'profile', params: { username: user.username } }"
        @click="this.$store.state.ChatOpen = false">
        <div class="bg-white flex items-center">
          <AvatarUtility :avatar-link="user.avatar" :size="8" class="m-2" :status="user.status" />
          <div class="ml-2">
            <h2 class="name text-lg font-medium text-black text-left">
              {{ user.username }}
            </h2>
          </div>
        </div>
      </router-link>
      <div>
        <button @click="settingsConversation()">
          <font-awesome-icon icon="ellipsis" class="text-xl mr-4" />
        </button>
        <button @click="returnMenu()">
          <font-awesome-icon icon="reply" class="text-xl mr-4" />
        </button>
        <button @click="this.$store.state.ChatOpen = false">
          <font-awesome-icon icon="circle-xmark" class="text-xl mr-4" />
        </button>
      </div>
    </header>
    <div class="relative z-50" @click="inSettingsFct()" v-if="inSettings" id="box">
      <!-- <p v-if="addFriend === 1" class="text-left">You are now friends</p> -->
      <div class="shadow-lg flex flex-col w-48 text-left bg-white absolute top-2 right-2">
        <p class="border-b text-center p-1">Discussion Settings</p>
        <div class="hover:bg-slate-200 p-0.5">
          <button @click="inviteGame()">
            <font-awesome-icon icon="gamepad" class="mx-1" />
            Invite to play
          </button>
        </div>
        <div class="hover:bg-slate-200 p-0.5">
          <button @click="deleteConversation()">
            <font-awesome-icon icon="trash" class="mx-1.5" />
            Delete conversation
          </button>
        </div>
        <div class="hover:bg-slate-200 p-0.5" v-if="user.type !== 'block'">
          <button @click="setRelation(user.username, 'block', true);">
            <font-awesome-icon icon="ban" class="mx-1.5" />
            Block {{ user.username }}
          </button>
        </div>
        <div class="hover:bg-slate-200 p-0.5" v-if="user.type === 'block'">
          <button @click="setRelation(user.username, 'block', false)">
            <font-awesome-icon icon="ban" class="mx-1" />
            Unblock {{ user.username }}
          </button>
        </div>
        <div class="hover:bg-slate-200 p-0.5" v-if="user.type !== 'friend'">
          <button @click="setRelation(user.username, 'friend', true); addFriend = 1; inSettings = 0;">
            <font-awesome-icon icon="user-check" class="text-green-600 mx-1" />
            Add friend
          </button>
        </div>
        <div class="hover:bg-slate-200 p-0.5" v-if="user.type === 'friend'">
          <button @click="setRelation(user.username, 'friend', false);">
            <font-awesome-icon icon="user-xmark" class="text-red-600 mx-1" />
            Remove friend
          </button>
        </div>
      </div>
    </div>

    <!-- <div :style="[this.widthtDiv < 768 ? 'height:' + this.heightDiv + 'px;' : 'height:' + this.heightMd + 'px;']"> -->
      <div class="overflow-y-scroll" id="msgs" :style="[this.widthtDiv < 768 ? 'height:' + this.heightDiv + 'px;' : 'height:' + this.heightMd + 'px;']">
        <div v-for="oldMessage in oldMessages" class="amsg flex justify-end mb-2" :class="oldMessage.creator_id === mySession.username ? 'ml-16' : 'mr-16 flex-row-reverse'" :key="oldMessage.text">
          <div :class="[oldMessage.creator_id === mySession.username ? 'bg-neutral-300 md:w-60 w-[90%] p-2 rounded-xl' : 'bg-orange-600 text-white md:w-64 w-[90%] p-2 rounded-xl']">
            <div class="flex justify-between">
              <p class="font-medium text-sm">{{ oldMessage.creator_id }}</p>
              <p class="text-right text-xs">
                {{ getDate(oldMessage.created_at) }}
              </p>
            </div>
            <p class="text-left text">{{ oldMessage.text }}</p>
          </div>
          <div class="img-box" :class="oldMessage.creator_id === mySession.username ? 'ml-2 mt-2' : 'mr-2 mt-2'">
            <AvatarUtility :avatar-link="oldMessage.avatar" :size="8" />
          </div>
        </div>
      </div>
      <form v-if="user.type !== 'block'" @click="inSettings = 0" id="form">
        <input v-model="input" v-on:keyup.enter="sendMessage" type="text" id="input" autocomplete="off"
          placeholder="Message" required class="p-1 bg-neutral-300 w-full" />
        <button @click="sendMessage" class="bg-orange-600 text-white font-medium rounded-full px-2 m-2 hidden">
          Send
        </button>
      </form>
    <!-- </div> -->
  </div>
</template>

<script>
import moment from "moment";
import * as axios from "axios";
import AvatarUtility from "@/components/utilities/Avatar";
import $ from "jquery";
import { useStore } from '../store/store'
import {nextTick} from "vue";

export default {
  components: {
    AvatarUtility,
  },
  props: {
    userObj: Object,
    socket: Object
  },
  setup() {
    useStore()
  },
  data() {
    return {
      name: "",
      input: "",
      img: "",
      inSettings: 0,
      inConversation: 1,
      date: 0,
      addFriend: 0,
      user: this.userObj,
      oldMessages: [],
      mySession: {},
      heightDiv: 0,
      heightMd: 0,
      widthtDiv: 0,
    };
  },
  methods: {
    getDate(value) {
      return moment.utc(value).format("LT");
    },
    sendMessage(e) {
      if (!this.input) {
        return;
      }
      e.preventDefault();
	  if (this.socket == null)
	  	return ;
      this.socket.emit("clientToServerMsg", {
        msg: this.input,
        img: this.img,
        date: this.date,
        session: this.$cookies.get("session_id"),
      });
      this.input = "";
    },
    async receiveMessage(msg, name, img, date) {
		if (this.user.type === "block") return;
      this.oldMessages.push({
        text: msg,
        creator_id: name,
        avatar: img,
        created_at: date,
      });
      await this.scrollToTheBottom2();
    },
    async scrollToTheBottom2() {
      await nextTick();
      if (document.getElementById("msgs"))
        document.getElementById("msgs").scrollTop = document.getElementById("msgs").scrollHeight;
    },
    settingsConversation() {
      this.inSettings = !this.inSettings;
    },
    returnMenu() {
      this.inConversation = 0;
      this.$emit("returnMenu", this.inConversation, this.user.type);
    },
    setRelation(target, type, status) {
      axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/setRelation`, {
        session: this.$cookies.get("session_id"),
        target: target,
        type: type,
        status: status,
      })
        .then((resp) => {
          return resp.data;
        })
        .then((body) => {
          this.$store.state.ChatError = body.success ? "Success" : "Error: " + body.error;
          if (type == "block" && status) return this.returnMenu();
          else if (type == "block" && !status) this.user.type = undefined;
          else if (type == "friend" && status) this.user.type = "friend";
          else if (type == "friend" && !status) return this.returnMenu();
        })
        .catch((error) => {
          console.log(error);
        });
    },
    inSettingsFct() {
      this.inSettings = 0;
      $("#box").toggleClass("hidden");
    },
    deleteConversation() {
      axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/deleteConversation`, {
        session: this.$cookies.get("session_id"),
        target: this.user.username,
      })
        .then((resp) => {
          return resp.data;
        })
        .then((body) => {
          this.$store.state.ChatError = body.success ? "Success" : "Error: " + body.error;
          this.returnMenu();
        })
        .catch((error) => {
          console.log(error);
        });
    },
    inviteGame() {
      axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/inviteToPlay`, {
        session: this.$cookies.get("session_id"),
        target: this.user.username,
        type: "classic"
      })
        .then((resp) => {
          return resp.data;
        })
        .then((body) => {
          this.$store.state.ChatError = body.success ? "Success" : "Error: " + body.error;
          if (body.success) {
            this.$store.state.friend = this.user;
            this.$store.state.mode = 0;
            this.$router.push({name: "findGame"});
          }
          this.returnMenu();
        })
        .catch((error) => {
          console.log(error);
        });
    },
    myEventHandler() {
			this.heightDiv = window.innerHeight;
			this.heightDiv = this.heightDiv - 170;
			this.heightDiv = Math.round(this.heightDiv);

      this.heightMd = window.innerHeight;
			this.heightMd = this.heightMd / 3;
			this.heightMd = (this.heightMd * 2) - 95;
			this.heightMd = Math.round(this.heightMd);

      this.widthtDiv = window.innerWidth;
      this.widthtDiv = Math.round(this.widthtDiv);
    }
  },
  created() {
    window.addEventListener("resize", this.myEventHandler);
  },
  destroyed() {
    window.removeEventListener("resize", this.myEventHandler);
  },
  mounted() {
	if (this.socket != null) {
		this.socket.on("serverToClientMsg", this.receiveMessage);
		this.socket.emit("joinChannel", {
		user: this.user.username,
		session: this.$cookies.get("session_id"),
		});
	}

    axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/mySession/`, {
      session: this.$cookies.get("session_id"),
    })
      .then((resp) => {
        this.mySession = resp.data;
      })
      .catch((error) => {
        console.log(error);
      });

    axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/getPrivateMessages`, {
      session: this.$cookies.get("session_id"),
      userTarget: this.user.username,
    })
      .then(async (resp) => {
        this.oldMessages = resp.data;
        await this.scrollToTheBottom2();
      })
      .catch((error) => {
        console.log(error);
      });

		this.myEventHandler();
  },
};
</script>

<style>
/* #msgbox::-webkit-scrollbar {
  display: none;
} */

.right {
  display: flex;
  justify-content: right;
}

.left {
  display: flex;
  justify-content: left;
}

.allmsgs {
  height: 500px;
  padding: 5px;
  overflow: scroll;
}

.text {
  overflow-wrap: break-word;
}
</style>

