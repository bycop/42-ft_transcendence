<template>
  <div class="relative flex justify-center items-center">
    <img :src="avatarLink" alt="Avatar" class="rounded-full border-white" :class="'w-' + size + ' h-' + size" :style="style">
      <font-awesome-icon v-if="status" icon="circle" class="absolute bottom-0 right-0" :class="[status === 'online' ? 'text-green-700' : status === 'offline' ? 'text-red-500' : 'text-yellow-500']"/>
  </div>
</template>

<script>
export default {
  name: "AvatarUtility",
  props: {
    avatarLink: String,
    size: Number | String,
    status: String,
    style: String | Object
  }
}
</script>