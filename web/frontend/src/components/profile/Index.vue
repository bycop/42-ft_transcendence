<template>
  <HeaderProfile :user="user"/>
  <LinksMenu :indexActive="active" @categoryButton="buttonCategoryClicked" />
  <MatchHistory v-if="active == 0"/>
  <FriendsList :user="user" v-if="active == 1"/>
  <AchievementsList :user="user" v-if="active == 2"/>
</template>

<script>
import * as axios from 'axios';
import { useStore } from '../store/store'

import HeaderProfile from "@/components/profile/Header";
import LinksMenu from "@/components/profile/LinksMenu";
import MatchHistory from "@/components/profile/MatchHistory";
import FriendsList from "@/components/profile/FriendsList";
import AchievementsList from "@/components/profile/AchievementsList";

export default {
  name: "ProfileIndex",
	setup() {
		useStore()
	},
  data() {
		return {
			active: 0,
    		user: {}
		}
  },
  components: {
    AchievementsList,
    FriendsList,
    MatchHistory,
    HeaderProfile,
    LinksMenu,
   },
   methods: {
		buttonCategoryClicked(number_active) {
      if (number_active == 0 || number_active == 1 || number_active == 2)
        this.active = number_active;
		},
   },
   mounted() {
    if (this.$route.params.username) {
        axios.get(`http://${this.$store.state.BASE_URL}:3000/api/chat/getUserFromUsername/` + this.$route.params.username).then((res) => {
          if (!(res.data == "not found" || res.data == "")) {
            this.user = res.data;
          }
		}).catch((err) => {
			console.log(err);
		});
      }
      else {
       axios.get(`http://${this.$store.state.BASE_URL}:3000/api/auth/getUserBySessionId/` +  this.$cookies.get("session_id")).then((res) => {
          if (!(res.data == "not found" || res.data == ""))
            this.user = res.data;
        }).catch((err) => {
			console.log(err);
		})
      }
   }
};
</script>

<style scoped>
</style>