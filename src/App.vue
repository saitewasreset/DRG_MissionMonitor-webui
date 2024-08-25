<script setup lang="ts">
import { ref, watch } from "vue";
import {
  NAlert,
  NIcon,
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NLayoutFooter,
  NSpace,
  NFlex,
  NButton,
} from "naive-ui";
import { mappingError } from "./mapping";
import { TaskAssetView, FavoriteFilled, LogoGithub } from "@vicons/carbon";
import NavBar from "./components/NavBar.vue";

import { RouterView, useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();
const currentSelectComponentKey = ref("general");

watch(
  () => route.name,
  () => {
    if (route.name != null) {
      if (typeof route.name === "string") {
        currentSelectComponentKey.value = route.name;
      }
    }
  },
);

watch(currentSelectComponentKey, (value) => {
  if (value != null) {
    router.push({ name: value });
  }
});
</script>

<template>
  <n-space vertical size="large">
    <n-layout position="absolute">
      <n-layout-header bordered style="height: 64px">
        <div class="title">
          <n-icon size="1.2rem">
            <TaskAssetView />
          </n-icon>
          Mission Monitor WebUI
        </div>
        <n-alert class="alert-box" v-if="mappingError != null" type="error">
          无法加载Mapping：{{ mappingError }}
        </n-alert>
        <div></div>
        <div></div>
      </n-layout-header>
      <n-layout has-sider position="absolute" style="top: 64px; bottom: 64px">
        <n-layout-sider
          bordered
          collapse-mode="width"
          :width="200"
          :collapsed-width="50"
          show-trigger="arrow-circle"
        >
          <NavBar v-model="currentSelectComponentKey"></NavBar>
        </n-layout-sider>
        <n-layout-content>
          <RouterView></RouterView>
        </n-layout-content>
      </n-layout>
      <n-layout-footer bordered position="absolute" style="height: 64px; padding: 10px">
        <n-flex align="center" vertical>
          <p class="footer-p">同舟共济，绝不放弃！</p>
          <p class="footer-p">
            made by <span class="admin">saitewasreset</span> with
            <n-icon color="red" size="8"><FavoriteFilled /></n-icon>
            &ensp;

            <n-button
              text
              tag="a"
              target="_blank"
              href="https://github.com/saitewasreset/DRG_MissionMonitor-webui"
              ><n-icon size="10"><LogoGithub /></n-icon>Source</n-button
            >
          </p>
        </n-flex>
      </n-layout-footer>
    </n-layout>
  </n-space>
</template>

<style scoped>
.n-layout-header {
  display: grid;
  grid-template-columns: 2fr 5fr 5fr 5fr;
  max-height: 10%;
}

.title {
  font-size: 1.2rem;
  text-align: center;
  max-width: 200px;
}

.footer-p {
  text-align: center;
  margin: auto;
  font-size: 0.8rem;
}
</style>
