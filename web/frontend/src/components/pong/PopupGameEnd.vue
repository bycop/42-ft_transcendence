<template>
  <div class="w-full h-screen bg-primary flex items-center justify-center">
    <div class="border-accent border-2 w-[35rem] h-[25rem] color-secondary">
    	<h1 class="text-center relative upper">
    		<span class="bg-primary px-4 text-xl pt-8">End Game</span>
    	</h1>
		<p class="flex flex-col items-center text-3xl mt-8 uppercase font-extrabold">
      <span v-if="isWin == null">Game end</span>
			<span class="color-green" v-else-if="isWin">
				Victory
			</span>
			<span class="color-red" v-else>
				Defeat
			</span>
			<span class="mt-6 border-b-2 border-accent w-2/3"></span>
		</p>
		<div class="flex items-center justify-center mt-8 px-10">
			<div class="flex w-1/3 items-center justify-start">
				<AvatarUtility :avatar-link="this.players[0].avatar" size="11" />
				<p class="text-xl ml-4 truncate">{{this.players[0].name}}</p>
			</div>
			<div class="flex flex-col w-1/3 text-2xl items-center justify-end relative">
				<p class="text-2xl">{{this.score[0]}} - {{this.score[1]}}</p>
				<p class="text-sm absolute myposition">{{this.game ? "Classic" : "Custom"}}</p>
			</div>
			<div class="flex w-1/3 items-center justify-end">
				<p class="text-xl mr-4 truncate">{{this.players[1].name}}</p>
				<AvatarUtility :avatar-link="this.players[1].avatar" size="11"/>
			</div>
		</div>
		<div>
			<p class="flex justify-center text-md my-8">
				<span v-if="isWin != null">
          XP : {{ this.isWin ? "+0.5" : "-0.25" }}
        </span>
			</p>
		</div>
		<div class="flex justify-evenly mt-5">
			<button @click="PlayGame" class="py-2 rounded-lg text-xl text-white bg-accent w-40 text-center">
				Play (matchmaking)
			</button>
			<button @click="this.$router.push({name: 'home'})" class="py-2 rounded-lg text-xl text-black bg-secondary w-40 text-center">
				Leave
			</button>
		</div>
    </div>
  </div>
</template>

<script>
	import AvatarUtility from "@/components/utilities/Avatar.vue";
	import { useStore } from '../store/store';
	import {PlayerSide, Role} from '../../../../shared/pong/pong';
	import axios from "axios";
	
	export default {
		name: "PopupGameEnd",
		components: {
			AvatarUtility,
		},
		data() {
			return {
				isWin: this.isWinner()
			}
		},
		setup() {
			useStore();
		},
		mounted() {
			this.$store.state.friend = undefined;
			this.$store.state.mode = 0;
			this.$store.state.user.game = 0;
		},
		props: {
			winner: PlayerSide,
			players: Array,
			score: Array,
			game: Boolean,
			role: Role
		},
		methods: {
			isWinner() {
        if (this.role === Role.Spectator)
          return null;
				return ((this.players[0].name === this.$store.state.user.username) && (this.winner === PlayerSide.Left) ||
            (this.players[1].name === this.$store.state.user.username) && (this.winner === PlayerSide.Right));
			},
      PlayGame() {
        axios.post(`http://${this.$store.state.BASE_URL}:3000/api/matchmaking/join`, {isclassic: this.game}).then((res) => {
          if (res.data === "success")
            this.$router.push({name: 'findGame'})
          else
            console.log(res.data)
        }).catch((e) => {
          console.log(e)
        })
      }
		},
}
</script>

<style scoped lang="scss">
.upper {
  top: -15px;
}

.myposition {
	bottom: -20px;
}
</style>