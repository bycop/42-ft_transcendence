<template>
  <div :class="inConv ? 'h-full' : ''">
    <div v-if="!inConv" class="relative overflow-y-scroll" :style="[this.widthtDiv < 768 ? 'height:' + this.heightDiv + 'px;' : 'height:' + this.heightMd + 'px;']">
      <button @click="inSettings = 0, searchUser = 1" class="text-left flex justify-start w-full">
        <font-awesome-icon icon="circle-plus" class="text-5xl m-4" />
        <p class="my-7 font-medium">New conversation</p>
      </button>
      <div v-for="target in targets" :key="target.creator_id">
        <div class="flex justify-between items-center" v-if="target.type !== 'block'">
          <div @click="inConversation(target)" class="flex items-center cursor-pointer">
            <AvatarUtility :avatar-link="target.avatar" :size="11" class="m-4" :status="target.status" />
            <div class="flex flex-col space-y-1 ">
              <div class="font-medium">{{ target.username }}</div>
              <div class="text-xs	font-light">{{ target.lastmsg }}</div>
            </div>
          </div>
          <div class="text-xl mt-3">
            <button @click="settingsFriend(target)">
              <font-awesome-icon icon="ellipsis" class="mr-7" />
            </button>
          </div>
        </div>
      </div>
      <div v-if="inSettings" class="shadow-lg flex-col w-48  text-left bg-white absolute right-2">
        <p class="border-b text-center p-0.5">Message Settings</p>
        <div class="hover:bg-slate-200 p-0.5">
          <button @click="deleteAlert = 1">
            <font-awesome-icon icon="trash" class="mx-1.5" />
            Delete conversation
          </button>
        </div>
        <div class="hover:bg-slate-200 p-0.5" v-if="userConv.type !== 'block'">
          <button @click="setRelation(userConv.username, 'block', true);">
            <font-awesome-icon icon="ban" class="mx-1.5" />
            Block {{ userConv.username }}
          </button>
        </div>
        <div class="hover:bg-slate-200 p-0.5" v-if="userConv.type === 'block'">
          <button @click="setRelation(userConv.username, 'block', false)">
            <font-awesome-icon icon="ban" class="mx-2" />
            Unblock {{ userConv.username }}
          </button>
        </div>
        <div class="hover:bg-slate-200 p-0.5" v-if="userConv.type !== 'friend' && userConv.type !== 'block'">
          <button @click="setRelation(userConv.username, 'friend', true)">
            <font-awesome-icon icon="user-check" class="text-green-600 mx-1" />
            Add friend
          </button>
        </div>
        <div class="hover:bg-slate-200 p-0.5" v-if="userConv.type === 'friend'">
          <button @click="setRelation(userConv.username, 'friend', false)">
            <font-awesome-icon icon="user-minus" class="text-red-600 mx-1.5" />
            Remove friend
          </button>
        </div>
      </div>
    </div>
      <div v-if="deleteAlert" class="absolute h-full w-full bg-black/60 md:rounded-t-xl top-0 left-0 flex items-center justify-center">
        <div class="rounded-lg border w-50 bg-white p-3">
          <p class="italic mb-2">Are you sure ?</p>
          <button @click="deleteConversation(userConv.username)" class="p-2">Yes</button>
          <button @click="deleteAlert = 0" class="px-1.5 py-1 font-medium bg-red-600 text-white rounded-lg">No</button>
        </div>
      </div>
    <in-conversation :socket="socket" @returnMenu="returnConversation($event)" v-if="inConv" :userObj="userConv" />
    <div v-if="searchUser" class="absolute h-full w-full bg-black/60 md:rounded-t-xl top-0 left-0 flex items-center justify-center">
      <div class="rounded-lg border w-60 bg-white pb-5">
        <div class="flex justify-between items-center p-3">
          <font-awesome-icon icon="message" />
          <p class="font-medium">Search user</p>
          <button @click="searchUser = 0">
            <font-awesome-icon icon="circle-xmark" />
          </button>
        </div>
        <div class="relative text-center">
          <input v-on:keyup.enter="getUser($event.target.value)" type="text"
            class="border-current border-2 rounded-xl p-3 mt-2" id="searchUser" placeholder="Search...">
          <p class="absolute overlayBorder font-medium">Users</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import inConversation from "./inConversation.vue";
import axios from 'axios';
import AvatarUtility from "@/components/utilities/Avatar";
import { useStore } from '../store/store'


export default {
  props: {
    socket: Object
  },
  components: {
    inConversation,
    AvatarUtility
  },
  setup() {
    useStore()
  },
  data() {
    return {
      inSettings: 0,
      addFriend: 0,
      inConv: 0,
      targets: [],
      userConv: {},
      deleteAlert: 0,
      searchUser: 0,
      heightDiv: 0,
      heightMd: 0,
			widthtDiv: 0
    };
  },
  methods: {
    settingsFriend(target) {
      this.inSettings = !this.inSettings;
      this.userConv = target;
    },
    addFriends() {
      this.addFriend = !this.addFriend;
    },
    returnConversation(e) {
      this.inConv = e;
      this.listConversation();
      this.$emit("displayConv", this.inConv);
    },
    inConversation(userConv) {
      this.userConv = userConv;
      this.inConv = 1;
      this.$emit("displayConv", this.inConv);
    },
    setRelation(target, type, status) {
      axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/setRelation`, {
        session: this.$cookies.get("session_id"),
        target: target,
        type: type,
        status: status
      }).then((resp) => {
        return resp.data;
      }).then((body) => {
        this.inSettings = 0;
        this.$store.state.ChatError = (body.success ? "Success" : "Error: " + body.error);
        if (!body.success) return;
        let relations = ["friend", "block"];
        for (let j = 0; relations[j]; j++) {
          if (type == relations[j] && status) {
            for (let i = 0; i < this.targets.length; i++) {
              if (this.targets[i].username == target) {
                this.targets[i].type = relations[j];
                break;
              }
            }
          }
          else if (type == relations[j] && !status) {
            for (let i = 0; i < this.targets.length; i++) {
              if (this.targets[i].username == target) {
                this.targets[i].type = undefined;
                break;
              }
            }
          }
        }
      }).catch((error) => {
        console.log(error);
      });
    },
    deleteConversation(userConv) {
      axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/deleteConversation`, {
        session: this.$cookies.get("session_id"),
        target: userConv
      }).then((resp) => {
        return resp.data;
      }).then((body) => {
        this.deleteAlert = 0;
        this.$store.state.ChatError = (body.success ? "Success" : "Error: " + body.error);
        this.$emit('reloadPage', 1);
      }).catch((error) => {
        console.log(error);
      });
    },
    getUser(user) {
        axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/getUserwithRelation`, {
        session: this.$cookies.get("session_id"),
        target: user
      }).then((resp) => {
          return resp.data;
        })
        .then((body) => {
          if (body?.error) {
            this.$store.state.ChatError = (!body.error ? "Success" : "Error: " + body.error);
            return;
          }
          this.searchUser = 0;
          this.inConversation(body);
        })
        .catch((error) => {
          console.log(error);
        });
    },
    listConversation() {
      axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/listConversation`, {
        session: this.$cookies.get("session_id")
      }).then((resp) => {
        this.targets = resp.data;
      }).catch((error) => {
        console.log(error);
      })
    },
     myEventHandler() {
			this.heightDiv = window.innerHeight;
			this.heightDiv = this.heightDiv - 225;
			this.heightDiv = Math.round(this.heightDiv);

            this.heightMd = window.innerHeight;
			this.heightMd = this.heightMd / 3;
			this.heightMd = (this.heightMd * 2) - 140;
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
    this.listConversation();
	if (this.socket == null)
		return ;
    this.socket.on("refresh", (data) => {
      this.listConversation();
    });
		this.myEventHandler();
  }
};
</script>

<style>
.overlayBorder {
  left: 35px;
  top: -5px;
  background-color: white;
  padding-left: 10px;
  padding-right: 10px;
}
</style>