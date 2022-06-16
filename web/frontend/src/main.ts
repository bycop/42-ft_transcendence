import { createApp } from 'vue';
import { store, key } from './components/store/store'
import App from './App.vue';
import router from './router';
import VueCookies from 'vue3-cookies';
import './index.css';
import 'animate.css';
import FontAwesomeIcon from "./fontawesome-icons";
import Vue from 'vue';

createApp(App)
.component("font-awesome-icon", FontAwesomeIcon)
	.use(router)
	.use(store, key)
	.use(VueCookies)
	.mount('#app');

