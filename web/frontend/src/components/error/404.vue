<template>
  <div class="all">
    <div class="wrapper flex flex-col justify-around h-56">
      <div class="background"></div>
      <h1 class="text-9xl h-24">404</h1>
      <p class="color-accent">The page you are looking for does not exist.</p>
      <router-link :to="{name: 'home'}"  class="cursor-pointer mt-2 relative opacity-90r">
        <span class="rounded-full py-3 px-8 bg-accent color-secondary text-xl">Go to home</span>
      </router-link>
    </div>

  </div>
</template>

<script>
export default {
  // eslint-disable-next-line vue/multi-word-component-names
  name: "404"
}
</script>

<style scoped>
.all {
  font-family: 'Inter', sans-serif;
  display: grid;
  place-content: center;
  height: 100vh;
  text-align: center;
}

.wrapper {
  overflow: hidden;
  position: relative;
  background: white;
}


.background {
  position: absolute;
  top: -100px;
  left: -100px;
  background: url('~@/assets/gradient.png') no-repeat black;
  background-size: cover;
  animation: 8s background infinite linear;
  width: 860px;
  height: 860px;
  mix-blend-mode: screen;
}

h1 {
  margin: 0;
  font-size: 102px;
  font-weight: 400;
}

@keyframes background {
  to {
    transform: rotate(3turn);
  }
}
</style>