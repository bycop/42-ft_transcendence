<template>
	<div class="flex justify-center bg-black items-center w-screen h-screen top-0 left-0">
	<div class="w-[85%] sm:w-[55%] lg:w-[40%] bg-white h-auto opacity-100 relative text-center">
	<h1 class="flex mb-3 header w-full justify-center text-2xl my-3">Please enter 2FA code</h1>
		<hr class="mb-4">
		<div class="">
			<p class="mb-1 font-bold ">Two-factor authentication (2FA) is enabled for your account.</p>
			<p  class="mb-1 font-bold ">Please enter the code to login.</p>
			<input class="code my-8" v-model="Code" placeholder="Security code">
			<div v-if="badCode" class="text-red-600 text-xs relative -mt-6">
				<p>The code is invalid.</p>
			</div>
			<br>
			<button class="buttonVerify mb-4" @click="checkCode">Verify</button>
		</div>
	</div>
	</div>
</template>

<script>
import axios from 'axios'
import {useStore} from "../store/store";

export default {
	name: "Doublefa",
	data() {
		return {
			Code: '',
			badCode: false
		};
	},
	props: {
		id: Number
	},
	setup() {
		const store = useStore()
		store.state.isConnected;
	},
	methods: {
		switchToConnected() {
			this.$store.commit('switchIsConnectedState', true)
			axios.get(`http://${this.$store.state.BASE_URL}:3000/api/auth/getUserBySessionId/` + this.$cookies.get("session_id")).then((res) => {
				if (!(res.data == "not found" || res.data == "")) {
					this.$store.commit('addUserInformation', res.data)
				}
			})
		},
		checkCode() {
			axios.get(`http://${this.$store.state.BASE_URL}:3000/api/profile/verif/${this.Code}/${this.id}`).then(async result => {
				if (result.data) {
					axios.get(`http://${this.$store.state.BASE_URL}:3000/api/auth/createCookieById/${this.id}`, {
						withCredentials: true
					}).then((res) => {
						if (res.data === '') {
							this.$router.push(`http://${process.env.BASE_URL}/`)
							this.switchToConnected()
						} else
							window.alert("Error: Auth Login")
					})
				} else
					this.badCode = true;
			})
		}
	}
}
</script>

<style scoped>
hr{
	border-top: 2px solid #ff5500;
	margin-right: 50px;
	margin-left:  50px;
}
.buttonVerify{
	background-color: #ff5500;
	border-radius: 10px;
	width: 90px;
	color: white;
}
.code{
	text-align: center;
	color: #ff5500;
	box-shadow:0 0 2px 1px black;
}
</style>