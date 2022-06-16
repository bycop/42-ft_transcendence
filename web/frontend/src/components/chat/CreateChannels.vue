<template>
	<main class="text-left relative h-[80%]">
		<div class="ml-4 mr-4 overflow-y-scroll" :style="[this.widthtDiv > 768 ? 'height:' + this.heightDiv + 'px;' : '']">
			<div class="flex justify-between">
				<h3 class="title text-2xl font-bold mb-7 mt-7 text-left">Create channel</h3>
				<button @click="returnMenu">
					<font-awesome-icon icon="reply" class="text-2xl mr-4" />
				</button>
			</div>
			<div class="relative mt-2">
				<input v-model="name" type="text" class="border-current border-2 rounded-xl w-full p-4 mb-9"
					name="name" placeholder="La zone" required>
				<p class="absolute overlayBorder">Name</p>
			</div>
			<div class="relative border-current border-2 rounded-xl w-full p-4 mb-9">
				<select v-model="right" name="type" id="choose-rights">
					<option value="public">Public</option>
					<option value="private">Private</option>
					<option value="protected">Protected</option>
				</select>
				<p class="absolute overlayBorder ">Rights</p>
			</div>
			<div v-if="right === 'protected'" class="relative">
				<input v-model="password" type="password" class="border-current border-2 rounded-xl w-full p-4 mb-9"
					name="password" placeholder="********" required>
				<p class="absolute overlayBorder ">Password</p>
			</div>
			<div class="relative outline-dashed outline-offset-[-3px] rounded-xl w-full p-4 text-center mb-9">
				<div v-if="!image">
					<font-awesome-icon icon="upload" class="text-xl" /><br>
					<label for="my-file" class="text-orange-600 font-medium">Browse files</label>
					<input @change="onFileChange" type="file" id="my-file" style="display:none;" class="h-6"
						accept=".jpg,.jpeg,.png">
				</div>
				<div v-else>
					<img :src="image" class="mt-2" />
					<div class="flex items-center justify-center mt-2">
						<font-awesome-icon icon="ban" class="text-xl text-red-500 m-2" />
						<button @click="removeImage">Remove image</button>
					</div>
				</div>
				<p class="absolute overlayBorder ">Avatar</p>
			</div>
			<input type="hidden" v-model="user_id" name="session">
			<button @click="submitForm" class="ml-1 bg-orange-600 rounded-xl px-6 py-1 text-white font-medium">Submit</button>
		</div>
		<!-- <p class="mt-3" v-if="confirmation != 1">{{ confirmation }}</p> -->
		<!-- <div v-if="confirmation === 1"> {{ newChannel() }}</div> -->
		<!-- <p class="mt-3" v-if="confirmation != 1">{{ confirmation }}</p>
			<div v-if="confirmation === 1" class="absolute bg-black/60 w-full top-20 flex items-center justify-center">
				<div class="bg-orange-600 rounded-xl p-2 text-white">
					<p>Channel created</p>
				</div>
			</div> -->
	</main>
</template>

<script >
import axios from 'axios';
import { useStore } from '../store/store'

export default {
	data() {
		return {
			returnButton: 0,
			right: "public",
			name: "",
			password: "",
			user_id: "",
			image: '',
			file: undefined,
			heightDiv: 0,
			widthtDiv: 0
		};
	},
	setup() {
		useStore()
	},
	methods: {
		returnMenu() {
			this.returnButton = 0;
			this.$emit("createChan", this.returnButton);
		},
		onFileChange(e) {
			let files = e.target.files || e.dataTransfer.files;
			if (!files.length)
				return;
			if (files[0].size > 10000000)
				return this.$store.state.ChatError = "Error: File too big (10mb)";
			this.file = files[0];
			this.createImage(files[0]);
		},
		createImage(file) {
			let image = new Image();
			let reader = new FileReader();
			let vm = this;

			reader.onload = (e) => {
				vm.image = e.target.result;
			};
			reader.readAsDataURL(file);
		},
		removeImage: function (e) {
			this.image = '';
		},
		submitForm() {
			let formData = new FormData();
			formData.append('name', this.name);
			formData.append('type', this.right);
			formData.append('password', this.password);
			formData.append('avatar', this.file);
			formData.append('session', this.user_id);
 
			let regexPassword = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
			let regexChannelName = new RegExp("[a-zA-Z0-9 ]");
			// let regexChannelName = /[\W\s]/g;

			if (this.name.length < 1 || this.name.length > 20)
				this.$store.state.ChatError = "Error: 1 character minimun and 20 characters maximun";
			else if (!regexChannelName.test(this.name))
				this.$store.state.ChatError = "Error: only uppercase, lowercase, spaces and number";
			else if (this.right === 'protected' && !this.password.match(regexPassword))
				this.$store.state.ChatError = "Error: At least 1 uppercase, 1 lowercase, 1 number and 1 special character. Minimun 8 characters";
			else {
				axios({
					method: "post",
					url: `http://${this.$store.state.BASE_URL}:3000/api/chat/createChannel`,
					data: formData,
					headers: { "Content-Type": "multipart/form-data" },
				})
					.then((resp) => {
						let body = resp.data;
						// this.$store.state.ChatError = (body.success ? "Channel created" : "Error: " + body.error);
						this.$store.state.ChatError = (body.success ? "" : "Error: " + body.error);
						if (this.$store.state.ChatError === "")
							this.$emit("channelCreated", 1, this.name, this.file);
					}).catch((error) => {
						console.log(error);
					});
			}
		},
		delayCloseAlert() {
            setTimeout(() => {
                this.$store.state.ChatError = "";
            }, 2000);
            if (this.$store.state.ChatError === 'Success')
                this.$emit('reloadPage', 1);
        },
		myEventHandler() {
			this.heightDiv = window.innerHeight;
			this.heightDiv = this.heightDiv / 3;
			this.heightDiv = this.heightDiv * 2 - 140;
			this.heightDiv = Math.round(this.heightDiv);

			this.widthtDiv = window.innerWidth;
			this.widthtDiv = Math.round(this.widthtDiv);
		}
	},
	created() {
 		window.addEventListener("resize", this.myEventHandler);
	},
	destroyed() {
	  window.removeEventListener("resize", this.myEventHandler);
	},
	mounted() {
		this.user_id = this.$cookies.get("session_id");
		this.myEventHandler();
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

</style>