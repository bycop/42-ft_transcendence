import { InjectionKey } from "vue";
import { createStore, useStore as baseUseStore, Store } from "vuex";
import {PlayerSide} from "../../../../shared/pong/pong";

export interface State {
	isConnected: boolean,
	user: any,
	serverPort: number,
	BASE_URL: string,
	REDIRECT_URI: string,
	ChatOpen: boolean,
	ChatError: string,
	friend: string,
	mode: number
}

export const key: InjectionKey<Store<State>> = Symbol()

let baseurl = "localhost";

export const store = createStore<State>({
	state: {
		isConnected: undefined,
		user: {},
		serverPort: 0,
		BASE_URL: baseurl,
		ChatOpen: false,
		REDIRECT_URI: "https://api.intra.42.fr/oauth/authorize?client_id=9ebe7bf30820b2f7bc4a0170865712eac619958cfa6d31caa2ac18077920bd9c&redirect_uri=http%3A%2F%2F" + baseurl + "%2Flogin&response_type=code",
		ChatError: "",
		friend: "",
		mode: 0,
	},
	mutations: {
		switchIsConnectedState (state, value) {
			state.isConnected = value
		},
		addUserInformation (state, value) {
			state.user = value
		},
		setServerPort(state, port)
		{
			state.serverPort = port
		}
	},
})

export function useStore () {
	return baseUseStore(key)
}