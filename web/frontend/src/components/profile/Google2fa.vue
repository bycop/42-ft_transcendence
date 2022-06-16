<template>
	<div class="absolute bg-black bg-opacity-60 background-blur-lg flex items-center justify-center w-screen h-screen top-0 left-0 z-[99]">
		<div class="w-[85%] sm:w-[55%] lg:w-[40%] bg-white h-auto mt-24 opacity-100 relative">
			<button class="absolute top-0 right-0 pr-1" @click="quit">
				<font-awesome-icon icon="circle-xmark" class="" />
			</button>
  			<div class="content">
    			<div class="flex my-3 header w-full justify-center">
      				<h1 class="text-2xl mt-4">Set Up Google Authenticator</h1>
				</div>
				<hr class="mb-4">
    			<component v-if="component !== 'CheckCode'" :is="component" :user="user"/>
    			<CheckCode v-else @filled="childData($event)"/>
				<br>
				<div class=" -mb-6">
					<button v-if="component !== 'Scan' && component !== 'Success'" @click="BackComponent" class="buttonBack mb-10">Back</button>
		 	 		<button v-if="component !== 'Success' && component !== 'Fail'" @click="NextComponent" class="buttonNext mb-10">Next</button>
					<div v-if="component === 'Success'" class="mb-10">
						<button v-if="component === 'Success'" class="buttonEnd inline-block" @click="end">End</button>
					</div>
	  			</div>
	  		</div>
		</div>
	</div>
</template>

<script>
import Scan from "./GoogleScan.vue";
import CheckCode from "./GoogleCheckCode.vue";
import Success from "./GoogleSuccess";
import Fail from "./GoogleFail";
import axios from 'axios';
import { useStore } from '../store/store'

export default {
  name: "Google2fa",
  components: {
    Scan,
    CheckCode,
    Success,
    Fail
  },
	setup() {
		useStore()
	},
	props: {
	  user: Object
	},
  data () {
    return {
      component: "Scan",
      Code: ''
    }
  },
  methods: {
    childData(googleCode){
      this.Code = googleCode;
    },
    async CheckCode() {
      if (this.Code === '') {
        this.component = "Fail";
        return;
      }
      let result = await axios.get(`http://${this.$store.state.BASE_URL}:3000/api/profile/verif/${this.Code}/${this.user.id}`);
      if (result.data)
        this.component = "Success";
      else
        this.component = "Fail";
    },
    NextComponent(){
      if (this.component === "Scan") {
        this.component = "CheckCode";
      } else if(this.component === "CheckCode") {
        this.CheckCode();
      }
    },
    BackComponent(){
      if (this.component === "CheckCode")
        this.component = "Scan";
      else
        this.component = "CheckCode";
    },
	  quit() {
		  this.$emit('quit', true);
	  },
	  end(){
		  this.$emit('quit', false);
		  axios.post(`http://${this.$store.state.BASE_URL}:3000/api/profile/Switch2fa`, {
			  user: this.user,
		  }).then((resp) => {
			  return resp.data;
		  }).catch((error) => {
			  console.log(error);
		  });
	  }
  }
}
</script>

<style lang="scss">
.custom {
	padding-left: -10px;
}
.content{
  text-align: center;
  font-weight: bold;
  margin-right: 48px;
  margin-left:  48px;
}
.header{
  font-weight: normal;
}
hr{
  border-top: 2px solid #ff5500;
}
.buttonNext{
  background-color: #ff5500;
  border-radius: 10px;
  width: 90px;
  color: white;
}
.buttonBack{
  border-radius: 10px;
  width: 90px;
  color: #ABB4BC;
}
.buttonEnd{
	background-color: #ff5500;
	border-radius: 10px;
	width: 90px;
	font-weight: normal;
	color: white;
}
</style>