<template>
    <button v-if="this.$store.state.isConnected && !this.$store.state.ChatOpen"
        @click="this.$store.state.ChatOpen = true; inChannel = 0; inMembers = 0; inConv = 0"
        class="bg-orange-600 rounded-full py-2 px-3 fixed right-10 bottom-10" :key="reload">
        <font-awesome-icon icon="comment-dots" class="text-white" />
    </button>
    <div v-else-if="this.$store.state.isConnected && this.$store.state.ChatOpen"
        class="bg-white md:border-t md:border-l md:rounded-t-xl md:w-96 w-full fixed md:h-2/3 h-full pt-20 md:pt-0 top-0 left-0 md:top-auto md:left-auto md:bottom-0 md:right-0 z-40">

        <div :class="this.$store.state.ChatError === 'Success' ? 'bg-green-500' : 'bg-red-500'"
            v-if="this.$store.state.ChatError"
            class="absolute bottom-0 w-full flex items-center justify-between p-1.5 z-50">
            <p class="text-white font-medium">{{ this.$store.state.ChatError }}</p>
            {{ delayCloseAlert() }}
            <button @click="this.$store.state.ChatError = ''">
                <font-awesome-icon icon="xmark" class="text-white" />
            </button>
        </div>
        <div v-if="!inChannel && !inMembers && !inConv" class="md:rounded-t-xl h-auto">
            <header-chat />
            <category-chat @categoryButton="buttonCategoryClicked" :oldCategory="categoryButton" />
        </div>
        <!-- <div :class="inChannel || inConv || categoryButton === 'buttonChannels' ? 'h-full' : ''"> -->
        <!-- <div class="h-full"> -->
        <list-conversations :socket="socket" :key="reload" v-if="categoryButton === 'buttonMessages'"
            @displayConv="displayPrivateConversation" @reloadPage="reloadPage" />
        <channels-base :socket="socket" :key="reload" v-if="categoryButton === 'buttonChannels'"
            @reloadPage="reloadPage" @showMembers="displayMembers" @displayConversation="displayConversationChannel" />
        <friends-chat :socket="socket" :key="reload" v-if="categoryButton === 'buttonFriends'" @reloadPage="reloadPage"
            @toConversation="displayPrivateConversation" />
        <!-- </div> -->
    </div>
</template>

<script>
import HeaderChat from './HeaderChat.vue'
import CategoryChat from './CategoryChat.vue'
import ListConversations from './ListConversations.vue'
import ChannelsBase from './ChannelsBase.vue'
import FriendsChat from './FriendsChat.vue'
import io from 'socket.io-client'
import { useStore } from '../store/store'

export default {
    name: "ChatBase",
    setup() {
        useStore()
    },
    data() {
        return {
            categoryButton: "buttonMessages",
            inChannel: 0,
            inMembers: 0,
            inConv: 0,
            reload: 0,
            socket: this.$cookies.get("session_id") == null ? null : io(`${this.$store.state.BASE_URL}:3000`, { query: `session=${this.$cookies.get("session_id")}` }),
        }
    },
    components: {
        HeaderChat,
        CategoryChat,
        ChannelsBase,
        FriendsChat,
        ListConversations
    },
    methods: {
        buttonCategoryClicked(e) {
            this.categoryButton = e;
        },
        displayConversationChannel(e) {
            this.categoryButton = "buttonChannels";
            this.inChannel = e;
        },
        displayMembers(e) {
            this.inMembers = e;
        },
        displayPrivateConversation(e) {
            this.inConv = e;
        },
        currentCategory(e) {
            this.categoryButton = e;
        },
        reloadPage() {
            this.inChannel = 0;
            this.inMembers = 0;
            this.inConv = 0;
            this.reload += 1;
        },
        delayCloseAlert() {
            setTimeout(() => {
                this.$store.state.ChatError = "";
                this.inviteMember = 0;
            }, 2000);
        },
    },
    mounted() {
        let ref = this;                                     

		if (this.socket == null)
			return ;
        this.socket.on('disconnectFromRoom', function (event) {
            ref.reloadPage();
        })
        this.socket.on('update', data => {})
        this.socket.on('connect_error', err => {})
        this.socket.on('connect_failed', err => {})
        this.socket.on('disconnect', err => {})
        
    }
}
</script>
