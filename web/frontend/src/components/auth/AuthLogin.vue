<template>
	  <Doublefa v-if="doublefa" :id="id"></Doublefa>
  		<div class="all" v-else>
   		 <h1 class="loading absolute textLoading">
		    Loading
     	 <div class="dots">
       	 <span class="dot z"></span>
       	 <span class="dot f"></span>
       	 <span class="dot s"></span>
       	 <span class="dot t">
			 <span class="dot l"></span>
          </span>
      </div>
	    </h1>
	  </div>
</template>

<script>
import axios from "axios";
import { useStore } from '../store/store';
import Doublefa from "./2fa.vue";

export default {
	name: "AuthLogin",
	setup() {
      useStore()
    },
	components: {Doublefa},
	data(){
		return {
			doublefa: false,
			id: undefined
		}
	},
	methods: {
		switchToConnected: function () {
			this.$store.commit('switchIsConnectedState', true)
      		axios.get(`http://${this.$store.state.BASE_URL}:3000/api/auth/getUserBySessionId/` + this.$cookies.get("session_id")).then((res) => {
        	if (!(res.data == "not found" || res.data == "")) {
				this.$store.commit('addUserInformation', res.data)
        }
      })
	},
   },
   mounted() {
		let $ = (e) => document.querySelector(e);
		let dots = $(".dots");
		function animate(element, className) {
			element.classList.add(className);
			setTimeout(() => {
	   			element.classList.remove(className);
	   			setTimeout(() => {
	   				animate(element, className);
	   			}, 1000);
	   		}, 2500);
		}

    	animate(dots, "dots--animate");
		axios.get(`http://${this.$store.state.BASE_URL}:3000/api/auth/login`, {
			params: {code: this.$route.query.code},
		}).then((res) => {
			setTimeout(() => {
				if (res.data === '') {
					this.$router.push({name: 'home'});
					this.switchToConnected();
				} else if (res.data.doublefa) {
					this.doublefa = true;
					this.id = res.data.id;
				}
			}, 1500)
		});
	}
}
</script>

<style scoped lang="scss">
.all {
	padding: 0;
	margin: 0;
	width: 100%;
	height: 100vh;
	background-color: black;
	display: flex;
	align-items: center;
	justify-content: center;
}

h1.loading {
	font-size: 50px;
	font-weight: bold;
	color: white;
	box-sizing: border-box;
}

.dots {
	display: inline-flex;

	&--animate .dot {
		&.z {
			animation: scale .8s .2s forwards;
		}

		&.f,
		&.s {
			animation: right .5s forwards;
		}

		&.l {
			animation: rightDown .4s .1s forwards linear, drop 2s .4s forwards linear;
		}
	}
}

.dot {
	& {
		display: inline-block;
		width: 10px;
		height: 10px;
		background-color: #ffffff;
		border-radius: 10px;
		position: relative;
		margin-left: 6px;
	}

	&.z {
		position: absolute;
		transform: scale(0);

		@keyframes scale {
			100% {
				transform: scale(1);
			}
		}
	}

	&.f,
	&.s {
		transform: translateX(0px);

		@keyframes right {
			100% {
				transform: translateX(16px);
			}
		}
	}

	&.t {
		background: transparent;
	}

	.l {
		margin-left: 0;
		position: absolute;
		top: 0;
		left: 0;

		@keyframes rightDown {
			50% {
				top: 10px;
				left: 16px;
			}

			100% {
				top: 75px;
				left: 24px;
			}
		}

		@keyframes drop {
			100% {
				transform: translate(70px, calc(35px + (100vh/2)));
			}
		}
	}
}
</style>