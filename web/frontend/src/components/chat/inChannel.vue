<template>
  <div class="md:border-t md:rounded-t-xl md:border-r md:w-full h-full ">
    <div class="p-1 border-b bg-white flex justify-between items-center shadow-b md:rounded-t-xl">
      <div class="bg-white flex items-center ">
        <img class="rounded-full border-6 border-white h-8 w-8 m-2"
          :src="focus.avatar ? focus.avatar : 'https://png.pngtree.com/png-vector/20191104/ourlarge/pngtree-businessman-avatar-cartoon-style-png-image_1953664.jpg'"
          alt="profil picture" />
        <div class="ml-2">
          <h2 class="name text-lg font-medium text-black text-left truncate w-52"> {{ focus.name }} </h2>
        </div>
      </div>
      <div>
        <button v-if="!inMembers" @click="settingsChannel()">
          <font-awesome-icon icon="ellipsis" class="text-xl mr-4" />
        </button>
        <button @click="returnMenuChan()">
          <font-awesome-icon icon="reply" class="text-xl mr-4" />
        </button>
        <button @click="this.$store.state.ChatOpen = false">
          <font-awesome-icon icon="circle-xmark" class="text-xl mr-4" />
        </button>
      </div>
    </div>
        <channel-settings :focus="focus" v-if="inSettings && !inMembers" @click="inSettings = 0"
          @actionSettings="actionSettings" class="z-50" />
     <div v-if="!inMembers">
      <div class="overflow-y-scroll" id="msgs2" :style="[this.widthtDiv < 768 ? 'height:' + this.heightDiv + 'px;' : 'height:' + this.heightMd + 'px;']">
       <div v-for="oldMessage in oldMessages" :key="oldMessage.text" class="flex justify-end mb-2"
          :class="oldMessage.creator_id === mySession.username ? 'ml-16' : 'mr-16 flex-row-reverse'">
          <div
          :class="[oldMessage.creator_id === mySession.username ? 'bg-neutral-300 md:w-60 w-[90%] p-2 rounded-xl' : 'bg-orange-600 text-white md:w-64 w-[90%] p-2 rounded-xl']">
            <div class="flex justify-between">
              <p class="font-medium text-sm">{{ oldMessage.creator_id }}</p>
              <p class="text-right text-xs">{{ getDate(oldMessage.created_at) }}</p>
            </div>
            <p class="text-left text">{{ oldMessage.text }}</p>
          </div>
          <div class='img-box' :class="oldMessage.creator_id === mySession.username ? 'ml-2 mt-2' : 'mr-2 mt-2'">
            <AvatarUtility :avatar-link="oldMessage.avatar" :size="8" />
          </div>
        </div>
      </div>
      <form @click="inSettings = 0; " id="form" action="">
        <input v-model="input" v-on:keyup.enter="sendMessage" type="text" id="input" autocomplete="off"
          placeholder="Message" required class="p-1 bg-neutral-300 w-full" />
        <button @click="sendMessage"
          class="bg-orange-600 text-white font-medium rounded-full px-2 m-2 hidden">Send</button>
      </form>
    </div>
    <members-channel v-if="inMembers" :channel="focus" class="h-full" />
    <div v-if="action === 'inviteMembers' && !inMembers"
      class="absolute h-full w-full bg-black/60 md:rounded-t-xl top-0 left-0 flex items-center justify-center">
      <div class="rounded-lg border w-60 bg-white pb-5">
        <div class="flex justify-between items-center p-3">
          <font-awesome-icon icon="user-plus" />
          <p class="font-medium">Invite Members</p>
          <button @click="this.action = ''; this.inSettings = 0">
            <font-awesome-icon icon="circle-xmark" />
          </button>
        </div>
        <div class="relative text-center">
          <input v-on:keyup.enter="inviteMembers(this.channel, $event.target.value)" type="text"
            class="border-current border-2 rounded-xl p-3 mt-2" id="searchMembers" placeholder="Search...">
          <p class="absolute overlayBorder absolute font-medium">User</p>
        </div>
      </div>
    </div>
    <div v-if="action === 'changeRights'"
      class="absolute h-full w-full bg-black/60 md:rounded-t-xl top-0 left-0 flex items-center justify-center flex-col">
      <font-awesome-icon icon="circle-xmark" class="text-xl m-2" @click="action = ''" />
      <div class="rounded-lg border w-60 bg-white p-3 pt-">
        <div class="relative border-current border-2 rounded-xl w-full p-4 mb-3">
          <select v-model="rightsType" name="type" id="choose-rights">
            <option value="public">Public</option>
            <option value="private">Private</option>
            <option value="protected">Protected</option>
          </select>
          <p class="absolute overlayBorder ">Rights</p>
        </div>
        <div v-if="rightsType === 'protected'" class="relative">
          <input v-model="changePassword" type="password" class="border-current border-2 rounded-xl w-full p-4"
            name="password" placeholder="********">
          <p class="absolute overlayBorder ">Password</p>
        </div>
        <button @click="changeRights()"
          class="ml-1 bg-orange-600 rounded-xl px-6 py-1 text-white font-medium mt-3">Submit</button>
      </div>
    </div>
  </div>
</template>

<script>
import ChannelSettings from './ChannelSettings.vue';
import MembersChannel from './MembersChannel.vue';
import * as axios from 'axios';
import moment from 'moment';
import AvatarUtility from "@/components/utilities/Avatar";
import { useStore } from '../store/store'
import {nextTick} from "vue";

export default {
  components: {
    ChannelSettings,
    MembersChannel,
    AvatarUtility,
  },
  props: {
    channel: String,
    focus: Object,
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
      inChannel: 1,
      inMembers: 0,
      action: "",
      date: 0,
      oldMessages: [],
	  blocks: [],
      mySession: {},
      inConv: 0,
      targetConv: {},
      avatar: "",
      rights: 0,
      changePassword: "",
      rightsType: "public",
      heightDiv: 0,
      heightMd: 0,
			widthtDiv: 0
    };
  },
  methods: {
    getDate(value) {
      return moment.utc(value).format('LT');
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
        session: this.$cookies.get("session_id")
      });
      this.input = "";
    },
    async receiveMessage(msg, name, img, date) {
		if (this.blocks.includes(name)) return;
      this.oldMessages.push({
        text: msg,
        creator_id: name,
        avatar: img,
        created_at: date,
      });
      await this.scrollToTheBottom();
    },
    async scrollToTheBottom() {
      await nextTick();
      if (document.getElementById("msgs2"))
        document.getElementById("msgs2").scrollTop = document.getElementById("msgs2").scrollHeight;
    },
    settingsChannel() {
      this.inSettings = !this.inSettings;
    },
    returnMenuChan() {
      if (this.inMembers === 1) {
        this.inSettings = 0;
        this.inMembers = 0;
      }
      else {
        this.inChannel = 0;
        this.$emit("returnMenu", this.inChannel);
      }
    },
    actionSettings(e, channelName) {
      this.action = e;
      this.inSettings = 0;
      if (this.action === "inMembers")
        this.inMembers = 1;
      if (this.action === "deleteChannel")
        this.$emit("actionSettings", "deleteChannel", channelName);
      if (this.action === "quitChannel") {
        this.$emit("actionSettings", "quitChannel", channelName);
        this.returnMenuChan();
      }
    },
    inviteMembers(channelName, target) {
      axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/inviteMember`, {
        channelName: channelName,
        session: this.$cookies.get("session_id"),
        target: target
      }).then((resp) => {
        return resp.data;
      }).then((body) => {
        this.$store.state.ChatError = (body.success ? "Success" : "Error: " + body.error);
      }).catch((error) => {
        console.log(error);
      });
      this.action = "";
    },
    changeRights() {
      let regexPassword = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");

      if (this.rightsType === 'protected' && !this.changePassword.match(regexPassword))
        this.$store.state.ChatError = "Error: At least 1 uppercase, 1 lowercase, 1 number and 1 special character. Minimun 8 characters";
      else {
        axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/changeRights`, {
          session: this.$cookies.get("session_id"),
          channelName: this.focus.name,
          type: this.rightsType,
          password: this.changePassword
        }).then((resp) => {
          this.$store.state.ChatError = (resp.data.success ? "Success" : "Error: " + resp.data.error);
          this.changePassword = "";
          return resp.data;
        }).catch((error) => {
          console.log(error);
        });
        this.action = "";
      }
    },
    myEventHandler() {
			this.heightDiv = window.innerHeight;
			this.heightDiv = this.heightDiv - 170;
			this.heightDiv = Math.round(this.heightDiv);

      this.heightMd = window.innerHeight;
			this.heightMd = this.heightMd / 3;
			this.heightMd = (this.heightMd * 2) - 92;
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
		let ref = this;
		this.socket.on("clientBannedFromRoom", (data) => {
		if (data === this.focus.name) {
			this.$store.state.ChatError = "Error: You are banned from this channel";
			this.returnMenuChan();
		}
		});
		this.socket.emit("joinChannel", {
		channel: this.focus.name,
		session: this.$cookies.get("session_id")
		});
	}
    axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/getChanMessages`, {
      channelName: this.focus.name,
      isChannel: true,
      session: this.$cookies.get("session_id")
    }).then(async (resp) => {
      this.oldMessages = resp.data;
      await this.scrollToTheBottom();
    }).catch((error) => {
      console.log(error);
    });

    axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/mySession/`, {
      session: this.$cookies.get("session_id")
    }).then((resp) => {
      this.mySession = resp.data;
    })
      .catch((error) => {
        console.log(error);
      });

    axios.get(`http://${this.$store.state.BASE_URL}:3000/api/chat/getChannel/` + this.focus.name)
      .then((resp) => {
        return resp.data;
      })
      .then((body) => {
        this.focus.avatar = body.avatar;
      })
      .catch((error) => {
        console.log(error);
      });


    axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/getFriends/`, {
        session: this.$cookies.get("session_id")
    }).then((resp) => {
        return resp.data;
    }).then((body) => {
        this.blocks = body.filter(usr => usr.type === "block").map(usr => { return usr.username });
    }).catch((error) => {
        console.log(error);
    });

		this.myEventHandler();
  },
  beforeDestroy() {

  }
}
</script>

<style>
#msgbox::-webkit-scrollbar {
  display: none;
  /* for Chrome, Safari, and Opera */
}

.right {
  display: flex;
  justify-content: right;
}

.left {
  display: flex;
  justify-content: left;
}

.text {
  overflow-wrap: break-word;
}

::-webkit-scrollbar {
  width: 1px;
}

::-moz-scrollbar {
  width: 1px;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #ffffff
}
</style>

