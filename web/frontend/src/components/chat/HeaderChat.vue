<template>
    <header class="p-2 border-b bg-white flex justify-between items-center shadow-b md:rounded-t-xl">
        <div class="bg-white flex items-center ">
            <AvatarUtility :avatar-link="mySession.avatar" :size="11" class="m-1"/>
            <div class="ml-2">
                <router-link :to="{name: 'profile', params: { username: mySession.username }}" @click="this.$store.state.ChatOpen = false">
                    <h2 class="name text-lg font-medium text-black text-left"> {{ mySession.username }} </h2>
                    <p class="level text-left text-sm">Level {{mySession.ladder}}</p>
                </router-link>
            </div>
        </div>
        <div>
            <button>
				<font-awesome-icon icon="circle-xmark" @click="this.$store.state.ChatOpen = false" class="text-2xl mr-4" />
            </button>
        </div> 
    </header>
</template>

<script>
import * as axios from "axios";
import AvatarUtility from "@/components/utilities/Avatar";
import { useStore } from '../store/store'


export default {
  components: {  
	  AvatarUtility
    },
	setup() {
		useStore()
	},
    data() {
        return {
            mySession: {}
        };
    },
    mounted() {
    	axios.post(`http://${this.$store.state.BASE_URL}:3000/api/chat/mySession/`, {
        	session: this.$cookies.get("session_id")
		}).then((resp) => {
    		this.mySession = resp.data;
    	}).catch((error) => {
    		console.log(error);
    	});
    
    }
}
</script>

<style scoped>
.shadow-b {
  -moz-box-shadow: inset 0 -10px 10px -20px #000000;
  -webkit-box-shadow: inset 0 -10px 10px -20px #000000;
  box-shadow: inset 0 -10px 10px -18px #000000;
}
</style>