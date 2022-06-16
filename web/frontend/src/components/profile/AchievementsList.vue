<template>
  <div class="container mx-auto flex justify-center">
    <div class="flex flex-wrap justify-center">
      <div v-for="(achievement, index) in achievements" :key="achievement" class="flex childFlex m-2 mb-1 p-6 myshadowInner rounded-md items-center" :class="!achievement.is_achieved ? 'opacity70' : ''">
        <img :src="achievement.trophy" :alt="'Avatar Achievement ' + index" class="w-16 h-16">
        <div class="ml-6">
          <div class="flex flex-col justify-center">
            <h1 class="text-lg"> {{ achievement.title}} </h1>
            <p class="mt-1 color-tertiary text-opacity-70 text-base">{{ achievement.text }}</p>
          </div>
          <div class="mt-2 flex text-base items-center">
              <div class="relative shadow-md w-6 h-6 rounded-full mr-2" v-if="achievement.is_achieved">
				<font-awesome-icon icon="check" class="absolute myPosition color-green" />
              </div>
              <span v-if="achievement.is_achieved" class="pt-1"> Unlocked</span>
              <span v-else > Locked</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as axios from "axios";
import { useStore } from '../store/store'

export default {
	name: "AchievementsList",
	props: {
    	user: Object,
	},
	setup() {
		useStore()
	},
	data() {
		return {
    		achievements: []
		}
	},
	methods: {
    	getAchievementsByUser() {
			axios.get(`http://${this.$store.state.BASE_URL}:3000/api/achievement/getAchievementsOfUser/` + this.user.username).then((res) => {
        		this.achievements = res.data;
        		for(let i = 0 ; i < this.achievements.length ; i++) {
        	    	this.achievements[i].trophy = require("@/assets/trophy/" + this.achievements[i].trophy + "_trophy.svg");
    			}
    		}).catch(() => {
				console.log("Couldn't load achievements");
			})
		},
	},
	mounted() {
		this.getAchievementsByUser()
	}	
}
</script>

<style scoped lang="scss">
.opacity70 {
  opacity: 0.3;
}

.myPosition {
  top: 20%;
  left: 25%;
}

.myshadowInner {
  -webkit-box-shadow: inset 0px 0px 5px 0px rgba(0, 0, 0, 0.16);
  -moz-box-shadow: inset 0px 0px 5px 0px rgba(0, 0, 0, 0.16);
  box-shadow: inset 0px 0px 5px 0px rgba(0, 0, 0, 0.16);
}

@media screen and (min-width: 768px) {
  .childFlex {
    flex: 0 0 30%;
    max-width: 30%;
  }

}
@media screen and (max-width: 767px) {
  .childFlex {
    flex: 0 0 90%;
  }
}
.titleAchievement {
  font-weight: bold;
  font-size: 1.2em;
}
</style>