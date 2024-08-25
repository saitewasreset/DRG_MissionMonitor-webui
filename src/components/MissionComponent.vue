<script setup lang="ts">
import { ref } from "vue";
import { NMessageProvider } from "naive-ui";
import { RouterView } from "vue-router";
import { useRoute, useRouter } from "vue-router";
</script>

<template>
  <router-view v-slot="{ Component }">
    <n-message-provider>
      <KeepAlive include="MissionList">
        <component :is="Component"></component>
      </KeepAlive>
    </n-message-provider>
  </router-view>
</template>
