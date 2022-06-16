<template>
  <div :class="inChannel ? 'h-full' : ''" class="" :style="[this.widthtDiv < 768 ? 'height:' + this.heightDiv + 'px;' : 'height:' + this.heightMd + 'px;']">
        <create-channel v-if="channel && !inChannel" @createChan="createChannel($event)" @channelCreated="chanCreated"/>
        <in-channel :socket="socket" @returnMenu="displayConversation" :focus="focus" v-if="inChannel" :channel="focus.name" @reloadPage="reloadPage" @actionSettings="actionSettings"/>
        <div v-if="!channel && !inChannel && action != 'inMembers'" class="relative overflow-y-scroll" :style="[this.widthtDiv < 768 ? 'height:' + this.heightDiv + 'px;' : 'height:' + this.heightMd + 'px;']">
            <div class="border-t">
                <button @click="channel = 1; inSettings = 0" class="text-left flex justify-start w-full">
                    <font-awesome-icon icon="circle-plus" class="text-5xl m-4" />
                    <p class="my-7 font-medium">Create a channel</p>
                </button>
            </div>
            <div>
                <button @click="listChan = 1; inSettings = 0" class="text-left flex justify-start w-full">
                    <font-awesome-icon icon="magnifying-glass" class="text-5xl m-4" />
                    <p class="my-7 font-medium">Search channels</p>
                </button>
            </div>
            <div v-for="channel in channels" :key="channel.name">
                <div class="flex justify-between items-center">
                    <div @click="displayConversation2(channel)" class="flex items-center cursor-pointer">
                        <img class="h-auto rounded-full border-6 border-white h-11 w-11 m-4"
                            :src="channel.avatar ? channel.avatar : 'https://png.pngtree.com/png-vector/20191104/ourlarge/pngtree-businessman-avatar-cartoon-style-png-image_1953664.jpg'"
                            alt="profil picture" />
                        <p class="my-7 font-medium">{{ channel.name }}</p>
                    </div>
                    <div class="text-xl mt-3">
                        <button @click="settingsChannel(channel.name, channel)">
                            <font-awesome-icon icon="ellipsis" class="mr-7" />
                        </button>
                    </div>
                </div>
                <channel-settings :focus="channel" @actionSettings="actionSettings"
                    v-if="inSettings && action != 'inMembers' && focus.name == channel.name" />
            </div>
        </div>
        <div v-if="deleteAlert"
            class="absolute h-full w-full bg-black/60 md:rounded-t-xl top-0 left-0 flex items-center justify-center">
            <div class="rounded-lg border w-50 bg-white p-3">
                <p class="italic mb-2">Are you sure ?</p>
                <button @click="deleteChannel(focus.name)" class="p-2">Yes</button>
                <button @click="deleteAlert = 0"
                    class="px-1.5 py-1 font-medium bg-red-600 text-white rounded-lg">No</button>
            </div>
        </div>
        <!-- <div v-if="action === 'inMembers'" class="md:border-t md:rounded-t-xl md:border-r md:w-96 relative">
            <header class="p-1 border-b bg-white flex justify-between items-center shadow-b  md:rounded-t-xl"> -->
        <div v-if="action === 'inMembers'" class="md:border-t md:rounded-t-xl md:border-r w-full absolute">
            <header class="p-1 border-b bg-white flex justify-between items-center shadow-b md:rounded-t-xl">
                <div class="bg-white flex items-center ">
                    <img class="rounded-full border-6 border-white h-8 w-8 m-2"
                        :src="focus.avatar ? focus.avatar : 'https://png.pngtree.com/png-vector/20191104/ourlarge/pngtree-businessman-avatar-cartoon-style-png-image_1953664.jpg'"
                        alt="profil picture" />
                    <div class="ml-2">
                        <h2 class="name text-lg font-medium text-black text-left"> {{ focus.name }} </h2>
                    </div>
                </div>
                <div>
                    <button @click="returnChanMenu">
                        <font-awesome-icon icon="reply" class="text-xl mr-4" />
                    </button>
                    <button @click="this.$store.state.ChatOpen = false">
                        <font-awesome-icon icon="circle-xmark" class="text-xl mr-4" />
                    </button>
                </div>
            </header>
            <members-channel :channel="focus" @reloadPage="reloadPage" />
        </div>
        <div v-if="action === 'inviteMembers'"
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
                    <input v-on:keyup.enter="inviteMembers(this.focus.name, $event.target.value)" type="text"
                        class="border-current border-2 rounded-xl p-3 mt-2" id="searchMembers" placeholder="Search...">
                    <p class="absolute overlayBorder absolute font-medium">User</p>
                </div>
            </div>
        </div>
        <div v-if="listChan" class="absolute h-full w-full bg-black/60 md:rounded-t-xl top-0 left-0 flex items-center justify-center ">
            <div v-if="this.allChannels.length !== 0" class="rounded-lg border w-80 bg-white flex-col"> 
                <div class="flex justify-between items-center p-3 border-b-2">
                    <font-awesome-icon icon="magnifying-glass" class="text-xl m-2" />
                    <p class="font-medium">Channels</p>
                    <font-awesome-icon icon="reply" v-if="pass" class="text-xl m-2 cursor-pointer" @click="pass = 0" />
                    <font-awesome-icon icon="circle-xmark" class="text-xl m-2 cursor-pointer" v-if="!pass" @click="listChan = 0"/>
                </div>
                <div class="overflow-y-scroll h-52">
                <div  v-for="allChannel in allChannels" :key="allChannel.name" class="flex items-center" :class="pass === 1 ? 'justify-center' : 'justify-between'">
                    <!-- <div  > -->
                    <div class="flex items-center justify-between" v-if="pass !== 1">
                        <img class="h-auto rounded-full border-6 border-white h-11 w-11 m-4"
                            :src="allChannel.avatar ? allChannel.avatar : 'https://png.pngtree.com/png-vector/20191104/ourlarge/pngtree-businessman-avatar-cartoon-style-png-image_1953664.jpg'"
                            alt="profil picture" />
                        <p class="my-7 font-medium truncate w-44">{{ allChannel.name }}</p>
                    </div>
                    <!-- </div> -->
                    <div v-if="!allChannel.isMember && allChannel.type === 'protected'" @click="pass = 1">
                        <font-awesome-icon icon="plus" v-if="!pass" class="mr-5" />
                        <div v-if="pass" class="flex flex-col items-center pt-10">
                            <p class="font-semibold">Channel protected: </p>
                            <p>enter the password</p>
                            <input v-on:keyup.enter="getPassword(allChannel, $event.target.value)" type="password"
                                class="border-current border-2 rounded-xl p-3 my-2" id="password" placeholder="*******">
                        </div>
                    </div>
                    <button v-if="!allChannel.isMember && allChannel.type !== 'protected'"
                        @click="joinChannel(allChannel, null); listChan = 0"
                        class="mr-5">
                        <font-awesome-icon icon="plus" class="cursor-pointer" v-if="!pass" />
                    </button>
                </div>
                </div>
            </div>
            <div v-else class="rounded-lg border w-60 bg-white flex flex-row justify-between items-center">
                <p class="text-center ml-2">No Channels</p>
                <font-awesome-icon icon="circle-xmark" class="text-xl m-2" v-if="!pass" @click="listChan = 0"/>
            </div>
        </div>
        <div v-if="action === 'changeRights'"
            class="absolute h-full w-full bg-black/60 md:rounded-t-xl top-0 left-0 flex items-center justify-center flex-col">
            <div class="rounded-lg border w-60 bg-white p-3">
                <div class="flex justify-between items-center border-b-2 pb-2">
                    <font-awesome-icon icon="unlock-keyhole" class="text-xl m-2"/>
                    <p class="font-medium">Change rights</p>
                    <font-awesome-icon icon="circle-xmark" class="text-xl m-2 cursor-pointer" @click="action = ''" />
                </div>
                <div class="relative border-current border-2 rounded-xl w-full p-4 mb-3 mt-4">
                    <select v-model="rightsType" name="type" id="choose-rights">
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="protected">Protected</option>
                    </select>
                    <p class="absolute overlayBorder ">Rights</p>
                </div>
                <div v-if="rightsType === 'protected'" class="relative">
                    <input v-model="changePassword" type="password"
                     class="border-current border-2 rounded-xl w-full p-4" name="password" placeholder="********" >
                    <p class="absolute overlayBorder ">Password</p>
                </div>
                <button @click="changeRights()"
                    class="ml-1 bg-orange-600 rounded-xl px-6 py-1 text-white font-medium mt-3">Submit</button>
            </div>
        </div>
    </div>
</template>

<script>
import CreateChannel from './CreateChannels.vue';
import ChannelSettings from './ChannelSettings.vue';
import InChannel from './inChannel.vue';
import MembersChannel from './MembersChannel.vue';
import * as axios from 'axios';
import { useStore } from '../store/store'

export default {
    props: {
        socket: Object
    },
    components: {
        CreateChannel,
        ChannelSettings,
        InChannel,
        MembersChannel
    },
    setup() {
        useStore()
    },
    data() {
        return {
            inSettings: 0,
            channel: 0,
            channels: [],
            action: "",
            inChannel: 0,
            inviteMember: 0,
            deleteAlert: 0,
            focus: {},
            listChan: 0,
            allChannels: [],
            pass: 0,
            rights: 0,
            changePassword: "",
            rightsType: "public",
            heightDiv: 0,
            heightMd: 0,
			widthtDiv: 0
        };
    },
    methods: {
        joinChannel(channel, password) {
            axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/joinChannel`, {
                channelName: channel.name,
                session: this.$cookies.get("session_id"),
                password: password
            }).then((resp) => {
                return resp.data;
            }).then((body) => {
                this.$store.state.ChatError = (body.success ? "Success" : "Error: " + body.error);
                if (body.success)
                    this.displayConversation2(channel);
                return (body.success ? true : false)
            }).catch((error) => {
                console.log(error);
            });
        },
        getPassword(channel, password) {
            this.joinChannel(channel, password)
            this.listChan = 0;
            this.pass = 0;
        },
        settingsChannel(channelName, focus = undefined) {
            this.action = "inSettings";
            this.focus = focus;
            this.focus.name = channelName;
            this.inSettings = !this.inSettings;
        },
        createChannel(e) {
            this.channel = e;
        },
        displayConversation2(channel) {
            this.focus = channel;
            this.inChannel = 1;
            this.focus.name = channel.name;
            this.inSettings = 0;
            this.$emit("displayConversation", this.inChannel);
        },
        displayConversation(e, name) {
            this.getChannels()
            this.channel = 0;
            this.inChannel = e;
            this.focus.name = name;
            this.$emit("displayConversation", this.inChannel);
        },
        chanCreated(e, name, file) {
            this.focus.role = 'owner';
            this.focus.avatar = file;
            this.displayConversation(e, name);
        },
        returnChanMenu() {
            if (this.action === "inMembers")
                this.$emit("showMembers", 0);
            this.action = "";
        },
        reloadPage(e) {
            this.$emit('reloadPage', e);
        },
        actionSettings(e, channelName) {
            this.action = e;
            this.channelName = channelName;
            this.inSettings = 0;
            if (this.action === "inMembers")
                this.$emit("showMembers", 1);
            if (this.action === "deleteChannel")
                this.deleteAlert = 1;
            if (this.action === "quitChannel")
                this.leaveChannel(this.channelName);
        },
        deleteChannel(channelName) {
            axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/deleteChannel`, {
                channelName: channelName,
                session: this.$cookies.get("session_id")
            }).then((resp) => {
                if (resp?.data.success) {
                    this.$emit('reloadPage', 1);
                }
                return resp.data;
            }).catch((error) => {
                console.log(error);
            });
            this.action = "";
            this.channelName = "";
        },
        leaveChannel(channelName) {
            axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/leaveChannel`, {
                session: this.$cookies.get("session_id"),
                channelName: channelName,
            }).then((resp) => {
                if (resp?.data.success)
                    this.$emit('reloadPage', 1);
                this.$store.state.ChatError = (resp.data.success ? "Success" : "Error: " + resp.data.error);
                return resp.data;
            }).catch((error) => {
                console.log(error);
            });
            this.action = "";
            this.channelName = "";
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
                this.channelName = "";
            }
        },
        inviteMembers(channelName, target) {
            this.inviteMember = 1;
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
        delayCloseAlert() {
            setTimeout(() => {
                this.$store.state.ChatError = "";
                this.inviteMember = 0;
            }, 2000);
            if (this.$store.state.ChatError === 'Success')
                this.$emit('reloadPage', 1);
        },
        getChannels() {
            axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/getChannels/`, {
                session: this.$cookies.get("session_id")
            }).then((resp) => {
                return resp.data;
            }).then((body) => {
                this.channels = body ? body : [];
            }).catch((error) => {
                console.log(error);
            });

            axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/getAllChannels`, {
                session: this.$cookies.get("session_id")
            }).then((resp) => {
                return resp.data;
            }).then((body) => {
                this.allChannels = body;
            }).catch((error) => {
                console.log(error);
            });
        },
         myEventHandler() {
			this.heightDiv = window.innerHeight;
			this.heightDiv = this.heightDiv - 250;
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
		if (this.socket == null)
			return ;
        this.socket.on("clientBannedFromRoom", (data) => {
            this.getChannels();
        });
        this.socket.on("refresh", (data) => {
            this.getChannels();
        });
        this.getChannels();

		this.myEventHandler();
    }
}
</script>

<style>
.overlayBorder {
    left: 20px;
    top: -10px;
    background-color: white;
    padding-left: 10px;
    padding-right: 10px;
}
</style>