<template>
    <div class="shadow-lg flex-col w-48 text-left bg-white absolute right-2" v-if="focus.name">
        <p class="border-b text-center p-1">Settings</p>
        <div class="hover:bg-slate-200 p-0.5">
            <button @click="this.$emit('actionSettings', 'inMembers', focus.name)">
				<font-awesome-icon icon="user-group" class="mx-1" />
                Members
            </button>
        </div>
        <div class="hover:bg-slate-200 p-0.5">
            <button @click="this.$emit('actionSettings', 'inviteMembers', focus.name); inviteMember = 1">
                <font-awesome-icon icon="user-check" class="mx-1" />
                Invite member
            </button>
        </div>
        <div v-if="focus.role === 'owner'" class="hover:bg-slate-200 p-0.5">
            <button @click="this.$emit('actionSettings', 'changeRights', focus.name)">
                <font-awesome-icon icon="unlock-keyhole" class="mx-1"/>
                Change rights
            </button>
        </div>
        <div class="hover:bg-slate-200 p-0.5">
            <button @click="this.$emit('actionSettings', 'quitChannel', focus.name)">
				<font-awesome-icon icon="door-open" class="text-red-600 mx-1" />
                Quit channel
            </button>
        </div>
        <div class="hover:bg-slate-200 p-0.5" v-if="focus.role === 'owner'">
            <button @click="this.$emit('actionSettings', 'deleteChannel', focus.name)">
				<font-awesome-icon icon="trash" class="text-red-600 mx-1.5" />
                Delete channel
            </button>
        </div>
        <div v-if="inviteMember && !inMembers" class="absolute h-full w-full bg-black/60 md:rounded-t-xl top-0 left-0 flex items-center justify-center">
            <div class="rounded-lg border w-60 bg-white pb-5">
                <div class="flex justify-between items-center p-3">
					<font-awesome-icon icon="user-plus" />
                    <p class="font-medium">Invite Members</p>
                    <button @click="this.action = ''; this.inSettings = 0">
						<font-awesome-icon icon="circle-xmark" />
                    </button>
                </div>
                <div class="relative">
                    <input v-on:keyup.enter="inviteMembers(this.channel, $event.channel.value, ''); inviteMember = 0" type="text" class="border-current border-2 rounded-xl p-3 mt-2" id="searchMembers" placeholder="Search...">
                    <p class="absolute overlayBorder absolute font-medium">User</p>
                </div>
                <p> {{ confirmation }} </p>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
      focus: Object
    },
    data() {
        return {
            inviteMember: 0
        }
    }
}
</script>
