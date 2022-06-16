<template>
  <p>To confirm the third party app is set up correctly, enter the security code that appears on your phone.</p>
  <br>
  <br>
  <input class="code" v-model="Code" placeholder="Security Code" @input="send">
  <br>
  <br>
</template>

<script>
export default {
  name: "CheckCode",
  data() {
    return {
      Code: ''
    };
  },
  emits: ['filled'],
  methods: {
    send(){
      if(this.Code.length === 6)
        this.$emit('filled', this.Code);
    }
  }
}
</script>

<style scoped>
p{
  font-weight: normal;
}
.code{
  text-align: center;
  color: #ff5500;
  box-shadow:0 0 2px 1px black;
}
</style>