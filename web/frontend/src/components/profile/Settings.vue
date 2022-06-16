<template>
  <div>
    <HeaderProfile :user="user" settings.type="true"></HeaderProfile>
    <div class="mx-auto w-[85%] lg:w-[60%] sm:w-[55%]">
		<div class="flex-wrap lg:flex justify-around">
			<div class="relative"> 
			<h2 class="font-bold text-lg mb-14">Edit Profile</h2>
			<div class="relative">
				<input v-model="username" type="text" class="border-current border-2 rounded-xl p-3 pl-4 w-full" name="Username" :placeholder="user.username" required>
          		<p class="absolute overlayBorder absolute">Username</p>
			</div>
			<div class="text-red-600 text-xs absolute">
			<p v-if="this.badUsername">Username must be 15 characters or less and contain only letters and numbers with no spaces.</p>
				<p v-if="this.alreadyExist">This username already exist.</p>
			</div>
			<div class="relative  outline-dashed outline-offset-[-3px] rounded-xl w-full  p-10 text-center my-16">
				<div v-if="!image">
					<font-awesome-icon icon="upload" class="text-xl" /><br>
					<label for="my-file" class="text-orange-600 font-medium cursor-pointer">Browse files</label>
					<input @change="onFileChange" type="file" id="my-file" style="display:none;" class="h-6"
						   accept=".jpg,.jpeg,.png">
				</div>
				<div v-else class="flex-col flex items-center">
					<img :src="image" class="mt-2 w-32" />
					<div class="flex items-center justify-center mt-2">
						<font-awesome-icon icon="ban" class="text-xl text-red-500 m-2" />
						<button @click="removeImage">Remove image</button>
					</div>
				</div>
				<p class="absolute overlayBorder ">Avatar</p>
			</div>
			<div class="buttonSave">
				<button class="buttonSave" @click="save">Save</button>
			</div>
			<p v-if="error === 'empty'" class="text-red-600 text-xs">You need to fill the form</p>
		</div>
        <div class="my-14 lg:my-0">
			<div>
				<p class="font-bold flex relative my-2 lg:mt-0 justify-start text-sm ">Security</p>
			</div>
			<div>
				<button v-if="!auth" class="rounded-xl p-2 bg-black text-white inline-block" @click="Popup">Activate 2fa Authentication</button>
				<button v-else class="rounded-xl p-2 bg-black text-white inline-block" @click="Switch2fa">Deactivate 2fa Authentication</button>
			</div>
			<Google2fa v-if="popup === true" @quit="quit($event)" :user="user"></Google2fa>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import HeaderProfile from "./Header";
import Google2fa from "./Google2fa";
import axios from "axios";
import { useStore } from '../store/store'

export default {
  name: "Settings",
	setup() {
		useStore()
	},
  data() {
	  return {
		  username: "",
		  file: undefined,
		  user: {},
		  popup: false,
		  auth: false,
		  badUsername: false,
		  alreadyExist: false,
		  image: '',
		  error: ""
    }
  },
	setup () {
		useStore()
	},
	methods: {
		removeImage: function (e) {
			this.image = '';
		},
		onFileChange(e) {
			let files = e.target.files || e.dataTransfer.files;
			if (!files.length)
				return;
			if (files[0].size > 10000000)
				return this.confirmation = "Error: File too big (10mb)";
			this.file = files[0];
			this.createImage(files[0]);
		},
		createImage(file) {
			let reader = new FileReader();
			let vm = this;
			reader.onload = (e) => {
				vm.image = e.target.result;
			};
			reader.readAsDataURL(file);
		},
	  Popup(){
		  if (this.popup === false)
			  this.popup = true;
		  else
			  this.popup = false;
	  },
		async Switch2fa(){
			await axios.post(`http://${this.$store.state.BASE_URL}:3000/api/profile/Switch2fa/` ,{
				user: this.user
			});
			this.auth = false;
		},
		quit(quitConfig) {
		  this.popup = false;
		  this.auth = !quitConfig;
		},
		async save() {
			if (this.checkUsername()) {
				// Si les deux champs sont vides on return
				if (this.username === '' && !this.file) {
					this.error = "empty";
					return ;
				}
				let formData = new FormData();
				formData.append('newUsername', this.username);
				formData.append('session', this.$cookies.get("session_id")),
				formData.append('avatar', this.file);
				let result = await axios({
					method: "post",
					url: `http://${this.$store.state.BASE_URL}:3000/api/profile/Save`,
					data: formData,
					headers: { "Content-Type": "multipart/form-data" },
				});
				if (result.data.error === "usernameAlreadyTaken") {
					this.alreadyExist = true;
					this.badUsername = false;
				}
				else {
					// Si on a changé de pseudo
					if (this.username)
						this.$store.state.user.username = this.username;
					// Si on a changé d'avatar //
					if (result.data)
						this.$store.state.user.avatar = result.data;
					await this.$router.push({path: '/profile/' + this.$store.state.user.username})
				}
			}
		},
		checkUsername(){
			// Si on ne change pas de username on garde l'ancien
			if (this.username === '')
				return true;
		  let goodPattern = /^[A-Za-z0-9-]{1,15}$/;
		  if (this.username.match(goodPattern))
			  return true;
		  this.badUsername = true;
		  this.alreadyExist = false;
		  return false;
		}
	},
  components: {HeaderProfile, Google2fa},
  mounted() {
    axios.get(`http://${this.$store.state.BASE_URL}:3000/api/auth/getUserBySessionId/` +  this.$cookies.get("session_id")).then((res) => {
      if (!(res.data == "not found" || res.data == "")) {
		  this.user = res.data;
		  this.auth = this.user.doublefa;
	  }
    }).catch((err) => {
		console.log(err);
	})
  }
}
</script>

<style scoped>
.overlayBorder {
  left: 20px;
  top: -10px;
  background-color: white;
  padding-left: 10px;
  padding-right: 10px;
}
.buttonSave{
	background-color: #ff5500;
	border-radius: 10px;
	width: 90px;
	color: white;
}
</style>

