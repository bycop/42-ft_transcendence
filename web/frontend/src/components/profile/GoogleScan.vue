<template>
  <p class="mb-1">Scan the QR Code below or type the secret key into the app.</p>
  <div>
    <img :src="codeQR" class="qr -mb-6">
    <br>
  </div>
  <div>
    <span>Secret key: </span><span class="w-[50%] break-words text-gray-600 text-sm break-word">{{secretKey}}</span>
  </div>
</template>

<script>
import axios from 'axios';
import { useStore } from '../store/store'

export default {
  name: "Scan",
	props: {
	  user: Object
	},
	setup() {
		useStore()
	},
  data() {
    return {
		codeQR: null,
		secretKey: null
    };
  },
  methods: {
  },
  async mounted(){
		await axios.post(`http://${this.$store.state.BASE_URL}:3000/api/profile/scan`, {
			user: this.user
		}).then(response => {
        	this.codeQR = response.data.img;
        	this.secretKey = response.data.secretKey;
    	}).catch(error => {
    		return error;
		})
	}
}
</script>

<style>
.qr{
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 40%;
}
</style>