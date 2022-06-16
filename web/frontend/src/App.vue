<template>
	<NavBar />
	<router-view :key="$route.fullPath" />
	<InviteToPlay :key="invite" v-if="invite" :invite="invite" class="z-50" />
	<chat-base :key="$route.fullPath" />
</template>

<script lang="ts">
import NavBar from "./components/utilities/NavBar.vue";
import { defineComponent, toRaw } from 'vue'
import axios from 'axios';
import ChatBase from "./components/chat/ChatBase.vue";
import InviteToPlay from "./components/chat/InviteToPlay.vue";

export default defineComponent({
	name: "App" as string,
	components: { NavBar, ChatBase, InviteToPlay },
	data() {
		return {
			invite: null,
		}
	},
	methods: {
		clear() {
			this.$store.commit('switchIsConnectedState', false);
			localStorage.clear();
			(this as any).$cookies.remove("session_id");
			this.$router.push({ name: 'home' });
		},
	},
	mounted() {
		setInterval(() => {
			if ((this as any).$cookies.get("session_id")) {
				axios.post(`http://${this.$store.state.BASE_URL}:3000/api/alive`, {
					session: (this as any).$cookies.get("session_id")
				}).then(response => {
					if (response?.data?.invite?.id !== this.invite?.id)
						this.invite = response?.data?.invite;
					if (response?.data?.error === "user not found with this SessionID")
						this.clear();
				}).catch((error) => {
					if (error?.response?.status === 403)
						this.clear();
				});

				if (this.$store.state.isConnected && !(this as any).$cookies.get("session_id"))
					this.clear();

				axios.get(`http://${this.$store.state.BASE_URL}:3000/api/pong/get-port-by-token`).then(resp => {
					if(resp.data.port == 0)
					{
						this.$store.state.user.game = 0;
					}
					else {
						this.$store.state.user.game = 1;
					}
					
				}).catch(() => {
					console.log("Unable to get port by token in alive !");
				});
			}
		}, 2500);
	},
});
</script>

<style scoped lang="scss">
html {
	height: 100vh;
	font-family: 'Roboto', sans-serif;
}

body {
	height: 100vh;
}

#app {
	height: 100vh;
	background-color: $primary;
}
</style>

