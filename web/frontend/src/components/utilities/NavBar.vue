<template>
	<header class="fixed w-full bg-white opacity-100 z-50">
		<div class="h-20 flex justify-between items-center border-b-2 border-accent py-6 md:justify-start">
			<div class="sm:block flex-1 w-1/3 md:hidden hidden"></div>
			<nav class="hidden md:flex md:flex-1 sm:justify-center md:items-center">
				<router-link :to="{name: 'home'}" class="text-xl color-primary-hover"> Home </router-link>
				<button @click="this.$store.state.ChatOpen = !this.$store.state.ChatOpen" class="text-xl color-primary-hover sm:mx-8 lg:mx-12 xl:mx-16">Chat</button>
				<router-link :to="{name: 'pong-game'}" class="text-xl color-primary-hover flex flex-col" v-if="this.$store.state.user.game === 1">
					<font-awesome-icon icon="gamepad" class="text-sm color-accent"/>
					<p class="text-lg color-accent">In Game </p>
				</router-link>
				<router-link :to="{name: 'pong'}" class="text-xl color-primary-hover" v-else> Pong </router-link>
			</nav>
			<div class="lg:flex w-0.5 h-14 bg-primary opacity-60 hidden"></div>
			<div class="flex sm:flex-1 sm:justify-center justify-start sm:pl-0 pl-10" >
				<router-link :to="{name: 'home'}" class="">
					<span class="sr-only">Trancendence</span>
					<img class="w-64 max-w-none" src="@/assets/logo.png" alt="Logo Transcendence">
				</router-link>
			</div>
			<div class="lg:flex w-0.5 h-14 bg-primary opacity-60 hidden"></div>
			<div v-if="isConnected === false" class="flex sm:flex-1 sm:justify-center justify-end sm:pr-0 pr-5">
				<a  :href="this.$store.state.REDIRECT_URI">
					<button class="md:px-10 px-4 md:py-2 py-2 rounded-lg text-xl text-white bg-accent">
						<div class="uppercase font-black">
							Login
						</div>
					</button>
				</a>
			</div>
			<Menu as="div" v-else-if="isConnected === true" class="md:block hidden md:flex-col md:flex-1 md:w-1/3 md:truncate" style="margin-left: 0">
				<div class="flex justify-end pr-8">
					<MenuButton class="flex relative items-center cursor-pointer color-primary-hover">
						<p class="text-xl md:ml-4 md:mr-4 lg:ml-8 lg:mr-8 truncate cursor-pointer">{{user.username}}</p>
						<AvatarUtility :avatar-link="user.avatar" class="inline-flex" :size="16" />
					</MenuButton>
				</div>
				<transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform opacity-100 scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform opacity-100 scale-100" leave-to-class="transform opacity-0 scale-95">
					<MenuItems class="origin-top-right absolute right-0 mt-2 w-44 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 focus:outline-none">
						<div class="py-1">
							<MenuItem v-slot="{ active }">
								<router-link :to="{name: 'profile', params: { username: user.username }}" :class="[active ? 'bg-gray-100 text-gray-900' : 'text-gray-700', 'block px-4 py-2 text-sm']">
									<font-awesome-icon icon="user" class="mr-2" />
									Profile
								</router-link>
							</MenuItem>
							<MenuItem v-slot="{ active }">
								<router-link :to="{name: 'settings'}" :class="[active ? 'bg-gray-100 text-gray-900' : 'text-gray-700', 'block px-4 py-2 text-sm']">
									<font-awesome-icon icon="gear" class="mr-2" />
									Settings
								</router-link>
							</MenuItem>
							<MenuItem v-slot="{ active }" @click="logout" class="cursor-pointer">
								<button :class="[active ? 'bg-gray-100 text-gray-900' : 'text-gray-700', 'block px-4 py-2 text-sm']">
									<font-awesome-icon icon="door-open" class="mr-2" />
									Logout
								</button>
							</MenuItem>
						</div>
					</MenuItems>
				</transition>
			</Menu>
			<div v-else class="md:flex flex-1 hidden"></div>
			<div v-if="isConnected" class="md:hidden flex flex-1 justify-end toggleHamburger">
				<div id="hamburger" ref="hamburger" @click="showNavbar" class="flex justify-end toggleHamburger">
					<span></span>
					<span></span>
					<span></span>
					<span></span>
				</div>
			</div>
		</div>
		<div ref="navScroll" class="hidden md:hidden w-screen h-screen items-start fixed px-6 pt-10 bg-white bg-opacity-80 backdrop-blur-lg">
		<!-- <div ref="navScroll" class=""> -->
			<ul class="font-black text-xl uppercase">
				<li class="border-b border-black border-opacity-10">
					<router-link :to="{name: 'home'}" @click="showNavbar" class="py-3 w-full items-center block relative flex color-primary-hover toggleHamburger">
						Home
					</router-link>
				</li>
				<li class="border-b border-black border-opacity-10">
					<button @click="this.$store.state.ChatOpen = !this.$store.state.ChatOpen, showNavbar()" class="py-3 w-full items-center block relative flex color-primary-hover toggleHamburger md:hidden font-black text-xl uppercase">
						Chat
					</button>
				</li>
				<li class="border-b border-black border-opacity-10">
					<router-link :to="{name: 'pong'}" @click="showNavbar" class="py-3 w-full items-center block relative flex color-primary-hover toggleHamburger" v-if="this.$store.state.user.game !== 0">
						<p class="mr-3 color-accent">In Game </p>
						<font-awesome-icon icon="gamepad" class="color-accent"/>
					</router-link>
					<router-link :to="{name: 'pong'}" @click="showNavbar" class="py-3 w-full items-center block relative flex color-primary-hover toggleHamburger" v-else>
						Pong
					</router-link>
				</li>
				<li class="border-b border-black border-opacity-10">
					<router-link :to="{name: 'profile', params: { username: user.username }}" @click="showNavbar" class="py-3 w-full items-center block relative flex color-primary-hover toggleHamburger">
						Profile
						<font-awesome-icon icon="user" class="ml-auto fill-current stroke-current h-4 w-4" />
					</router-link>
				</li>
				<li class="border-b border-black border-opacity-10">
					<router-link :to="{name: 'settings'}" @click="showNavbar" class="py-3 w-full items-center block relative flex color-primary-hover toggleHamburger">
						Settings
						<font-awesome-icon icon="gear" class="ml-auto fill-current stroke-current h-4 w-4" />
					</router-link>
				</li>
				<li class="border-b border-black border-opacity-10">
					<div class="py-3 w-full block relative flex">
						<button  @click="[logout(),showNavbar()]" class="px-4 py-2 rounded-lg text-xl text-white bg-primary color-secondary-hover uppercase font-black">
							Logout
						</button>
					</div>
				</li>
			</ul>
			<p class="mt-6 opacity-80 text-left uppercase footerMobileVersion pb-4 color-primary">
				Groupe2Six, Inc © 2022 
				<br>
				Made in Charbo
				<br>
				Play your favorite game
				<!-- Send crypto to this ETH wallet : <button class="uppercase footerMobileVersion color-primary-hover" @click="copyText" id="wallet">0x75D21642122cfAdbb1b2C34965ca59719Dcb2534</button> -->
			</p>
		</div>
	</header>
</template>

<script>
import * as axios from 'axios';
import AvatarUtility from "@/components/utilities/Avatar.vue";
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import $ from 'jquery'
import { useStore } from '../store/store'
import {io} from "socket.io-client"

export default {
	name: "NavBar",
	components: {
		AvatarUtility,
		Menu,
		MenuButton,
		MenuItem,
		MenuItems,
	},
	
	setup () {
		useStore()
	},
	data() {
		return {
			}
	},
	mounted() {
		this.m_isConnected();
		if (this.$cookies.get("session_id"))
	    	this.getUser();
	},
	methods: {
		m_isConnected(){
			axios.get(`http://${this.$store.state.BASE_URL}:3000/api/auth/isConnected`).then((res) => {
        		this.$store.commit('switchIsConnectedState', res.data);
			}).catch(() => {});
		},
    	getUser() {
    		axios.get(`http://${this.$store.state.BASE_URL}:3000/api/auth/getUserBySessionId/` + this.$cookies.get("session_id")).then((res) => {
    			if (!(res.data == "not found" || res.data == "")) {
        			this.$store.commit('addUserInformation', res.data);
    			}
    		}).catch(() => {});
		},
		showNavbar() {
			if (this.scroll) {
				this.$refs.navScroll.classList.add("hidden");
				this.$refs.hamburger.classList.remove("open");
			}
			else {
				this.$refs.navScroll.classList.remove("hidden");
				this.$refs.hamburger.classList.add("open");
			}
			this.scroll = !this.scroll;
		},
		logout() {
			axios.get(`http://${this.$store.state.BASE_URL}:3000/api/auth/signout`).then((resp) => {
				if (resp?.data.success)
				{
					this.$store.commit('switchIsConnectedState', false);
					localStorage.clear();
					this.$router.push({name: 'home'});
				}
			}).catch(() => {});
		}
	},
	computed: {
		user() {
    		return this.$store.state.user;
		},
		isConnected() {
    		return this.$store.state.isConnected;
		}
	}
};

</script>

<style scoped lang="scss">
	.footerMobileVersion {
		font-size: .7rem;
		font-weight: 300;
	}
	#hamburger {
	  width: 60px;
	  height: 45px;
	  position: relative;
	  -webkit-transform: rotate(0deg);
	  -moz-transform: rotate(0deg);
	  -o-transform: rotate(0deg);
	  transform: rotate(0deg);
	  -webkit-transition: .5s ease-in-out;
	  -moz-transition: .5s ease-in-out;
	  -o-transition: .5s ease-in-out;
	  transition: .5s ease-in-out;
	  cursor: pointer;
	}

	#hamburger span {
	  display: block;
	  position: absolute;
	  height: 4px;
	  width: 50%;
	  background: #151515;
	  border-radius: 9px;
	  opacity: 1;
	  left: 0;
	  -webkit-transform: rotate(0deg);
	  -moz-transform: rotate(0deg);
	  -o-transform: rotate(0deg);
	  transform: rotate(0deg);
	  -webkit-transition: .25s ease-in-out;
	  -moz-transition: .25s ease-in-out;
	  -o-transition: .25s ease-in-out;
	  transition: .25s ease-in-out;
	}

	/* Icon 3 */
	// Position des traits (span)
	#hamburger span:nth-child(1) {
	  top: 11px;

	}

	#hamburger span:nth-child(2),#hamburger span:nth-child(3) {
	  top: 20px;
	}

	#hamburger span:nth-child(4) {
	  top: 29px;
	}

	#hamburger.open span:nth-child(1) {
	  top: 20px;
	  width: 0%;
	  left: 25%;
	}

	#hamburger.open span:nth-child(2) {
	  -webkit-transform: rotate(45deg);
	  -moz-transform: rotate(45deg);
	  -o-transform: rotate(45deg);
	  transform: rotate(45deg);
	}

	#hamburger.open span:nth-child(3) {
	  -webkit-transform: rotate(-45deg);
	  -moz-transform: rotate(-45deg);
	  -o-transform: rotate(-45deg);
	  transform: rotate(-45deg);
	}

	#hamburger.open span:nth-child(4) {
	  top: 20px;
	  width: 0%;
	  left: 25%;
	}
</style>