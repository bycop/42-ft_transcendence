<template>
    <div :class="toConv ? 'h-full' : ''">
        <in-conversation :socket="socket" v-if="toConv" @returnMenu="returnFriendsMenu($event)" :userObj="focus"
            @reloadPage="reloadPage" />
        <div v-if="!toConv" class="relative  overflow-y-scroll" :style="[this.widthtDiv < 768 ? 'height:' + this.heightDiv + 'px;' : 'height:' + this.heightMd + 'px;']">
            <div class="border-t">
                <button @click="addFriends" class="text-left flex justify-start w-full">
                    <font-awesome-icon icon="circle-plus" class="text-5xl m-4" />
                    <p class="my-7 font-medium">Add friend</p>
                </button>
            </div>
            <div v-for="friend in friends" :key="friend.username">
                <div class="flex justify-between items-center ">
                    <router-link :to="{ name: 'profile', params: { username: friend.username } }"
                        @click="this.$store.state.ChatOpen = false">
                        <div class="flex items-center">
                            <AvatarUtility :avatar-link="friend.avatar" :size="11" :status="friend.status"
                                class="m-4" />
                            <p class="my-7 font-medium">{{ friend.username }}</p>
                        </div>
                    </router-link>
                    <div class="text-xl mt-3">
                        <font-awesome-icon icon="ban" class="mr-5" v-if="friend.type === 'block'" />
                        <button @click="toConversation(friend)" v-else-if="friend.type !== 'block'">
                            <font-awesome-icon icon="message" class="mr-5" />
                        </button>
                        <button @click="settingsFriend(friend)">
                            <font-awesome-icon icon="ellipsis" class="mr-7" />
                        </button>
                    </div>
                </div>
                <div v-if="inSettings && focus.username == friend.username"
                    class="shadow-lg flex-col w-48 absolute text-left bg-white right-2">
                    <p class="border-b text-center p-1">Friends Settings</p>
                    <div class="hover:bg-slate-200 p-0.5" v-if="focus.type !== 'block'">
                        <button @click="setRelation(focus.username, 'block', true)">
                            <font-awesome-icon icon="ban" class="mx-1.5" />
                            Block {{ focus.username }}
                        </button>
                    </div>
                    <div class="hover:bg-slate-200 p-0.5" v-if="focus.type === 'block'">
                        <button @click="setRelation(focus.username, 'block', false)">
                            <font-awesome-icon icon="ban" class="mx-1.5" />
                            Unblock {{ focus.username }}
                        </button>
                    </div>
                    <div class="hover:bg-slate-200 p-0.5" v-if="focus.type === 'friend'">
                        <button @click="setRelation(focus.username, 'friend', false)">
                            <font-awesome-icon icon="user-minus" class="text-red-600 mx-1" />
                            Remove friend
                        </button>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="addFriend" class="absolute h-full w-full bg-black/60 md:rounded-t-xl top-0 left-0 flex items-center justify-center">
            <div class="rounded-lg border w-60 bg-white pb-5">
                <div class="flex justify-between items-center p-3">
                    <font-awesome-icon icon="user-plus" />
                    <p class="font-medium">Add Friends</p>
                    <button @click="addFriends">
                        <font-awesome-icon icon="circle-xmark" />
                    </button>
                </div>
                <div class="relative text-center">
                    <input v-on:keyup.enter="setRelation($event.target.value, 'friend', true)" type="text"
                        class="border-current border-2 rounded-xl p-3 mt-2" id="searchFriend" placeholder="Search...">
                    <p class="absolute overlayBorder font-medium">Friend(s)</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import inConversation from './inConversation.vue';
import * as axios from 'axios';
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
    data() {
        return {
            focus: {},
            inSettings: 0,
            addFriend: 0,
            toConv: 0,
            friends: [],
            heightDiv: 0,
            heightMd: 0,
			widthtDiv: 0
        };
    },
    setup() {
        useStore()
    },
    methods: {
        setRelation(target, type, status) {
            axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/setRelation`, {
                session: this.$cookies.get("session_id"),
                target: target,
                type: type,
                status: status
            }).then((resp) => {
                return resp.data;
            }).then((body) => {
                this.$store.state.ChatError = (body.success ? "Success" : "Error: " + body.error);
                if (body.success) {
                    this.$emit('reloadPage', 1)
                }
            }).catch((error) => {
                console.log(error);
            });
        },
        settingsFriend(id) {
            this.inSettings = !this.inSettings;
            this.focus = id;
        },
        addFriends() {
            this.addFriend = !this.addFriend;
            this.inSettings = 0;
        },
        toConversation(id) {
            this.toConv = 1;
            this.focus = id;
            this.inSettings = 0;
            this.$emit("toConversation", this.toConv);
        },
        returnFriendsMenu(e, type) {
            this.toConv = e;
            this.focus.type = type;
            this.$emit('reloadPage', 1);
        },
        reloadPage(e) {
            this.$emit('reloadPage', e);
        },
        myEventHandler() {
			this.heightDiv = window.innerHeight;
			this.heightDiv = this.heightDiv - 225;
			this.heightDiv = Math.round(this.heightDiv);

            this.heightMd = window.innerHeight;
			this.heightMd = this.heightMd / 3;
			this.heightMd = (this.heightMd * 2) - 142;
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
        axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/getFriends/`, {
            session: this.$cookies.get("session_id")
        }).then((resp) => {
            return resp.data;
        }).then((body) => {
            this.friends = body;
        }).catch((error) => {
            console.log(error);
        });

		this.myEventHandler();
        
    }
}
</script>

<style>
.overlayBorder {
    left: 35px;
    top: -5px;
    background-color: white;
    padding-left: 10px;
    padding-right: 10px;
}

/*.fade-enter-active, .fade-leave-active {
  transition: opacity 5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}*/
</style>