import { Store } from 'vuex'

declare module '@vue/runtime-core' {
	interface State {
		isConnected: boolean,
		user: any,
		serverPort: number;
		BASE_URL: string,
		REDIRECT_URI: string,
		ChatError: string,
		friend: string,
		mode: number
	}

	interface ComponentCustomProperties {
		$store: Store<State>
	}
}