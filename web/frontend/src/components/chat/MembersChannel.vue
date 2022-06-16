<template>
  <div :style="[this.widthtDiv < 768 ? 'height:' + this.heightDiv + 'px;' : 'height:' + this.heightMd + 'px;']">
    <div v-if="sanction.type !== ''"
      class="absolute h-full w-full bg-black/60 md:rounded-t-xl top-0 left-0 flex items-center justify-center myzindex">
      <div class="rounded-lg border w-60 bg-white pb-5">
        <div class="flex justify-between items-center p-3">
          <p class="font-medium">{{ sanction.type === 'ban' ? 'Ban ' : 'Mute ' }} {{ sanction.user.username }}</p>
          <button @click="this.sanction.type = ''; this.sanction.user = {}">
            <font-awesome-icon icon="circle-xmark" />
          </button>
        </div>
        <div class="relative text-center">
          <input
            v-on:keyup.enter="setSanction(channel, this.sanction.user, this.sanction.type, true, $event.target.value); alert = 1"
            type="text" class="border-current border-2 rounded-xl p-3 mt-2" id="searchMembers"
            placeholder="30m,1h,3d...">
          <p class="absolute overlayBorder font-medium">Duration</p>
          <p class="absolute font-light">Empty = Permanent sanction</p>
        </div>
      </div>
    </div>
    <div class="text-left relative h-full overflow-y-scroll" :style="[this.widthtDiv < 768 ? 'height:' + this.heightDiv + 'px;' : 'height:' + this.heightMd + 'px;']">
      <!-- <in-conversation v-if="privateMsg" :userObj="msgTarget"></in-conversation> -->
      <div v-if="!privateMsg">
        <h2 class="font-semibold mt-2 ml-3">Members --</h2>
        <div v-for="member in members" :key="member.username">
          <div class="flex justify-between items-center">
            <router-link :to="{ name: 'profile', params: { username: member.username } }"
              @click="this.$store.state.ChatOpen = false">
              <div class="flex items-center">
                <AvatarUtility
                  :avatar-link="member.avatar ? member.avatar : 'https://png.pngtree.com/png-vector/20191104/ourlarge/pngtree-businessman-avatar-cartoon-style-png-image_1953664.jpg'"
                  :size="11" class="m-1" :status="member.status" />
                <p class="my-7 font-medium">{{ member.username }}</p>
              </div>
            </router-link>
            <div class="text-xl mt-3" v-if="member.username != mySession.username">
              <button @click="settingsMembers(member.username)">
                <font-awesome-icon icon="ellipsis" class="mr-7" />
              </button>
            </div>
          </div>
          <div v-if="inSettings && target === member.username"
            class="shadow-lg flex-col w-48 text-left right-2 bg-white absolute">
            <p class="border-b text-center p-1">Members Settings</p>
            <div class="hover:bg-slate-200 p-0.5" v-if="member.relation !== 'friend'">
              <button @click="setRelation(target, 'friend', true); inSettings = 0; alert = 1">
                <font-awesome-icon icon="user-check" class="text-green-600 mx-1" />
                Add friend
              </button>
            </div>
            <div class="hover:bg-slate-200 p-0.5" v-if="member.relation === 'friend'">
              <button @click="setRelation(target, 'friend', false); inSettings = 0; alert = 1">
                <font-awesome-icon icon="user-xmark" class="text-red-600 mx-1" />
                Remove friend
              </button>
            </div>
            <div class="hover:bg-slate-200 p-0.5" v-if="member.role !== 'owner' && role === 'owner'">
              <!-- <div class="hover:bg-slate-200" v-if="member.role !== 'admin' && mySession.username == member.username && member.role !== undefined"> -->
              <button @click="setToMod(channel, target, 'owner', true); inSettings = 0; alert = 1">
                <font-awesome-icon icon="user-gear" class="mx-1" />
                Set to owner
              </button>
            </div>
            <div class="hover:bg-slate-200 p-0.5" v-if="member.role !== 'admin' && role">
              <!-- <div class="hover:bg-slate-200" v-if="member.role !== 'admin' && mySession.username == member.username && member.role !== undefined"> -->
              <button @click="setToMod(channel, target, 'admin', true); inSettings = 0; alert = 1">
                <font-awesome-icon icon="user-gear" class="mx-1" />
                Set to administrator
              </button>
            </div>
            <div class="hover:bg-slate-200 p-0.5" v-if="member.role === 'admin' && role">
              <button @click="setToMod(channel, target, 'admin', false); inSettings = 0; alert = 1">
                <font-awesome-icon icon="user-gear" class="mx-1" />
                Remove admin rights
              </button>
            </div>
            <div class="hover:bg-slate-200 p-0.5" v-if="member.sanction !== 'mute' && role">
              <button @click="this.sanction.type = 'mute'; this.sanction.user = member; inSettings = 0">
                <font-awesome-icon icon="comment-slash" class="mx-1" />
                Mute {{ member.username }}
              </button>
            </div>
            <div class="hover:bg-slate-200 p-0.5" v-if="member.sanction === 'mute' && role">
              <button @click="setSanction(channel, member, 'mute', false); inSettings = 0; alert = 1">
                <font-awesome-icon icon="comment-slash" class="mx-1" />
                Unmute {{ member.username }}
              </button>
            </div>
            <div class="hover:bg-slate-200 p-0.5" v-if="role">
              <button @click="this.sanction.type = 'ban'; this.sanction.user = member; inSettings = 0">
                <font-awesome-icon icon="comment-slash" class="text-red-600 mx-1" />
                Ban {{ member.username }}
              </button>
            </div>
            <div class="hover:bg-slate-200 p-0.5" v-if="member.relation === 'block'">
              <button @click="setRelation(target, 'block', false); inSettings = 0; alert = 1">
                <font-awesome-icon icon="ban" class="mx-1.5" />
                Unblock {{ member.username }}
              </button>
            </div>
            <div class="hover:bg-slate-200 p-0.5" v-if="member.relation !== 'block'">
              <button @click="setRelation(target, 'block', true); inSettings = 0; alert = 1">
                <font-awesome-icon icon="ban" class="mx-1.5" />
                Block {{ member.username }}
              </button>
            </div>
            <div class="hover:bg-slate-200 p-0.5" v-if="role">
              <button @click="leaveChannel(channel, member); inSettings = 0">
                <font-awesome-icon icon="door-open" class="text-red-600 mx-1" />
                Remove from chan
              </button>
            </div>
          </div>
        </div>
        <h2 class="font-semibold mt-1 ml-3">Banned Users --</h2>
        <div v-for="ban in bans" :key="ban.username">
          <div class="flex justify-between items-center">
            <div class="flex items-center">
              <img class="h-auto rounded-full border-6 border-white h-11 w-11 m-4"
                :src="ban.avatar ? ban.avatar : 'https://png.pngtree.com/png-vector/20191104/ourlarge/pngtree-businessman-avatar-cartoon-style-png-image_1953664.jpg'"
                alt="profil picture" />
              <p class="my-7 font-medium">{{ ban.username }}</p>
            </div>
            <div class="text-l mt-3 mr-6">
              <button @click="setSanction(channel, ban, 'ban', false)">
                Unban
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>
</template>

<script>
import * as axios from "axios";
import inConversation from './inConversation.vue';
import { useStore } from '../store/store'
import AvatarUtility from "@/components/utilities/Avatar";
import _ from 'lodash';


export default {
  components: {
    inConversation,
    AvatarUtility
  },
  props: {
    channel: Object
  },
  setup() {
    useStore()
  },
  data() {
    return {
      inSettings: 0,
      members: [],
      bans: [],
      target: "",
      alert: 0,
      confirmation: "",
      mySession: {},
      role: "",
      privateMsg: 0,
      sanction: {
      user: {},
      type: ""
      },
      heightDiv: 0,
      heightMd: 0,
      widthtDiv: 0
      // msgTarget: {}
    }
  },
  methods: {
    settingsMembers(target) {
      this.inSettings = !this.inSettings;
      this.target = target;
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
          if (!body.success) return;
          let relations = ["friend", "block"];
          for (let j = 0; relations[j]; j++) {
            if (type == relations[j] && status) {
              for (let i = 0; i < this.members.length; i++) {
                if (this.members[i].username == target) {
                  this.members[i].relation = relations[j];
                  break;
                }
              }
            }
            else if (type == relations[j] && !status) {
              for (let i = 0; i < this.members.length; i++) {
                if (this.members[i].username == target) {
                  this.members[i].relation = undefined;
                  break;
                }
              }
            }
          }
        })
        .catch((error) => {
          console.log(error);
        });
    },
    leaveChannel(channelName, user) {
      axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/leaveChannel`, {
        session: this.$cookies.get("session_id"),
        channelName: channelName.name,
        target: user.username,
		session: this.$cookies.get("session_id")
      }).then((resp) => {
          this.$store.state.ChatError = resp?.data?.success ? "Success" : "Error: " + resp?.data?.error;
        if (!resp?.data?.success) return;
       		this.members = this.members.filter(function (el) { return el.username != user.username; });
        return resp.data;
      }).catch((error) => {
        console.log(error);
      });
    },
    setSanction(channelName, user, type, status, duration = undefined) {
      axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/setSanction`, {
        channelName: channelName.name,
        target: user.username,
        session: this.$cookies.get("session_id"),
        type: type,
        status: status,
        duration: duration,
      })
        .then((resp) => {
          return resp.data;
        })
        .then((body) => {
          this.sanction = {
            user: {},
            type: "",
          };
          this.$store.state.ChatError = body.success ? "Success" : "Error: " + body.error;
          if (!body.success) return;
          if (type == "ban" && status) {
            this.bans.push({ username: user.username, avatar: user.avatar })
            this.members = this.members.filter(function (el) { return el.username != user.username; });
          }
          else if (type == "ban" && !status) {
            this.bans = this.bans.filter(function (el) { return el.username != user.username; });
          }
          else if (type == "mute" && status) {
            for (let i = 0; i < this.members.length; i++) {
              if (this.members[i].username == user.username) {
                this.members[i].sanction = "mute";
                break;
              }
            }
          }
          else if (type == "mute" && !status) {
            for (let i = 0; i < this.members.length; i++) {
              if (this.members[i].username == user.username) {
                this.members[i].sanction = undefined;
                break;
              }
            }
          }
        })
        .catch((error) => {
          console.log(error);
        });
    },
    setToMod(channelName, target, roleUser, status) {
      axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/setToMod`, {
        session: this.$cookies.get("session_id"),
        channelName: channelName.name,
        target: target,
        roleUser: roleUser,
        status: status
      })
        .then((resp) => {
          return resp.data;
        })
        .then((body) => {
          this.$store.state.ChatError = body.success ? "Success" : "Error: " + body.error;
          if (!body.success) return;
          if (status) {
            for (let i = 0; i < this.members.length; i++) {
              if (this.members[i].username == target) {
                this.members[i].role = roleUser;
                if (roleUser == 'owner')
                  this.role = null;
                break;
              }
            }
          }
          else if (!status) {
            for (let i = 0; i < this.members.length; i++) {
              if (this.members[i].username == target) {
                this.members[i].role = undefined;
                break;
              }
            }
          }
        })
        .catch((error) => {
          console.log(error);
        })
    },
    delayCloseAlert() {
      setTimeout(() => {
        this.alert = 0;
      }, 2000);
    },
    myRole(memb) {
      for (let i = 0; memb[i]; i++) {
        if (memb[i].username === this.mySession.username) {
          this.role = memb[i].role;
        }
      }
    },
    myEventHandler() {
			this.heightDiv = window.innerHeight;
			this.heightDiv = this.heightDiv - 170;
			this.heightDiv = Math.round(this.heightDiv);

      this.heightMd = window.innerHeight;
			this.heightMd = this.heightMd / 3;
			this.heightMd = (this.heightMd * 2) - 60;
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
    axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/mySession/`, {
      session: this.$cookies.get("session_id")
    }).then((resp) => {
      this.mySession = resp.data;
    })
      .catch((error) => {
        console.log(error);
      });

    axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/getMembers/`, {
      channelName: this.channel.name,
      session: this.$cookies.get("session_id")
    })
      .then((resp) => {
        return resp.data;
      })
      .then((body) => {
        this.members = body;
        this.myRole(body);
      })
      .catch((error) => {
        console.log(error);
      });
      
      axios.get(`http://${this.$store.state.BASE_URL}:3000/api/chat/getBanMembers/` + this.channel.name)
      .then((resp) => {
        return resp.data;
      })
      .then((body) => {
        this.bans = body;
      })
      .catch((error) => {
        console.log(error);
      });
      this.myEventHandler();
  },
};
</script>

<style>
  .myzindex {
    z-index: 99;
  }
</style>