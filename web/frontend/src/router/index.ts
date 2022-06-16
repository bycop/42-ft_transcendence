import {createRouter, createWebHistory} from "vue-router";
import { store } from "../components/store/store";
import axios from 'axios'

const routes = [
    {
        path: '/',
        component: () => import('@/components/HomePage.vue'),
        name: "home"
    },
    {
        path: '/login',
        component: () => import('@/components/auth/AuthLogin.vue'),
        name: "login",
    },
    {
		path: '/pong',
		component: () => import('@/components/pong/matchmaking/FormPlay.vue'),
		name: "pong",
        meta: { isConnected: true }
    },
    {
        path: '/2fa',
        component: () => import('@/components/profile/Google2fa.vue'),
        name: "2fa",
		meta: { isConnected: true }
    },
    {
        path: '/settings',
        component: () => import('@/components/profile/Settings.vue'),
        name: "settings",
		meta: { isConnected: true }
    },
	{
		path: '/pong-game',
		component: () => import('@/components/pong/PongGame.vue'),
		name: "pong-game",
		meta: { isConnected: true }
	},
	{
		path: '/findGame',
		component: () => import('@/components/pong/matchmaking/FindGame.vue'),
		name: "findGame",
		meta: { isConnected: true }
	},
    {
		path: '/profile/:username?',
		component: () => import('@/components/profile/Index.vue'),
		name: "profile",
		meta: { isConnected: true }
	},
    {
        path: '/:catchAll(.*)',
        component: () => import('@/components/error/404.vue'),
        name: "error404"
    },
];

const router = createRouter({
    history:createWebHistory(process.env.BASE_URL),
    routes
});

function checkInGame(): Boolean {
	if (store.state.isConnected == true) {
		axios.get(`http://${store.state.BASE_URL}:3000/api/pong/get-port-by-token`).then(resp => {
			store.state.user.game = resp.data.port !== 0 ? 1 : 0;
		}).catch(() => {
			console.log("Unable to get port by token in alive !");
		});
		return true;
	}
	return false
}

router.beforeEach(async (to, from) => {
	await axios.get(`http://${store.state.BASE_URL}:3000/api/auth/isConnected`).then((res) => {
    		store.commit('switchIsConnectedState', res.data);
	}).catch(() => {});
	if (to.meta.isConnected && store.state.isConnected == false)
		return router.push({name: 'home'});
	checkInGame();
	return true;
})



axios.interceptors.request.use(
	function(config) {
		config.withCredentials = true;
		return config;
	},
	function(error) {
		return Promise.reject(error);
	}
);

export default router