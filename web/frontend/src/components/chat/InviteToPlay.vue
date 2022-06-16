<template>
	<div alt="invite to play notif" class="bg-white flex h-24 fixed right-0 top-1/4" v-if="!accepted && !declined && this.$route.path !== '/pong-game'">
		<img :src="friend.avatar" alt="" class="h-24 w-auto">
		<div class="pl-4 pt-1 pb-1 pr-1">
			<p class="text-center">
				{{ friend.username }} invited you to play {{ invite.is_classic ? "classic" : "advanced"}} game
			</p>
			<p class="text-center text-zinc-400 mb-1">
				Click to join
			</p>
			<div class="space-x-8 flex justify-between">
				<button @click="accept"
					class="bg-green-700 text-white font-medium rounded-full w-24 h-8 sm:mb-0 mb-5 sm:relative">
					Accept
				</button>
				<button @click="decline"
					class="bg-red-700 text-white font-medium rounded-full w-24 h-8 sm:mb-0 mb-5 sm:relative">
					Decline
				</button>
			</div>
		</div>
	</div>
</template>

<script>
import axios from 'axios'
import { useStore } from '../store/store'

export default {
	name: "InviteToPlay",
	props: {
		invite: Object
	},
	setup() {
		useStore()
	},
	data() {
		return {
			accepted: false,
			declined: false,
      friend: {}
		}
	},
	methods: {
    getFriendInfo() {
      axios.get(`http://${this.$store.state.BASE_URL}:3000/api/chat/getFriendInvitation`).then((res)=> {
        if (res.data)
          this.friend = res.data;
      }).catch(() => {})
    },
		accept() {
      axios.get(`http://${this.$store.state.BASE_URL}:3000/api/chat/acceptedInvite`).then((res) => {
        if (!res.data.error)
        {
          this.$store.state.serverPort = res.data;
          setTimeout(() => {
            this.$store.state.user.game = 1;
            this.$router.push({name: 'pong-game'});
          }, 1000)
          this.accepted = true;
        } else {
          console.log(res.data.error);
        }
      }).catch(() => {})
		},
		decline() {
			axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/declineInvite`, {
				session: this.$cookies.get("session_id"),
				invite: this.invite
			}).then((resp) => {
				this.targets = resp.data;
			}).catch((error) => {
				console.log(error);
			});
			this.declined = true;
		}
	},
	mounted() {
    	this.getFriendInfo();
	}
}
</script>
