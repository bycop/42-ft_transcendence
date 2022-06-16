<template>
	<!-- <div class="bg-primary flex shadow-inner p-4"> -->
	<div class="bg-primary flex flex-col w-screen h-screen items-center justify-center">
		<video autoplay muted loop id="homeVideo" class="flex order-last absolute sm:visible invisible">
			<source src="../assets/video_pong.mp4" type="video/mp4">
		</video>
		<img alt="Vue logo" src="../assets/logo_solo.png" class="sm:max-w-screen-sm w-11/12 sm:relative" />
		<p class="text-white w-2/3 text-center sm:mt-20 mt-10 sm:relative">
			Challenge your friends at Pong.<br/><br/>
      Chat with them,
      play classic and custom game,
      win achievements and level, be the best of your friends and enjoy !
		</p>
		<div class="flex sm:flex-row flex-col w-full justify-evenly sm:mt-20 mt-10 items-center sm:relative">
			<button @click="joinMatchmaking(true)" class="bg-accent text-white font-medium rounded-full px-4 p-3 sm:mb-0 mb-5 sm:relative">
				<font-awesome-icon icon="gamepad" class="mr-1.5" />
				Play Classic Pong
			</button>
			<button @click="joinMatchmaking(false)" class="bg-accent2 text-black font-medium rounded-full px-4 p-3 sm:relative">
				<font-awesome-icon icon="skull" class="mr-1.5" />
				Play Custom Pong
			</button>
		</div>
	</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import axios from "axios";

export default defineComponent({
	methods: {
		joinMatchmaking(mode: boolean) {
			axios.post(`http://${this.$store.state.BASE_URL}:3000/api/matchmaking/join`, {isclassic: mode}).then((res) => {
				if (res.data == "success")
     		    	this.$router.push({name: 'findGame'})
     		}).catch((e) => {
				 console.log(e)
     		})	
		}
	}
})
</script>

<style lang="scss">
// html, body {
// 	overflow: hidden;
// }
</style>