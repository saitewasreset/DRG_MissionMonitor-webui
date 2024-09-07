<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { NConfigProvider, zhCN, dateZhCN, darkTheme, lightTheme, useOsTheme } from "naive-ui";
import {
  NAlert,
  NIcon,
  NLayout,
  NLayoutHeader,
  NLayoutSider,
  NLayoutContent,
  NLayoutFooter,
  NTooltip,
  NSpace,
  NFlex,
  NButton,
  NCheckbox,
} from "naive-ui";
import { mappingError } from "./mapping";
import { TaskAssetView, FavoriteFilled, LogoGithub, Sun, Moon } from "@vicons/carbon";
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

// get os theme
const osTheme = useOsTheme();
const userTheme = ref<null | "light" | "dark">(null);
const followSystemTheme = ref(true);

const theme = computed(() => {
  return followSystemTheme.value
    ? osTheme.value === "dark"
      ? darkTheme
      : lightTheme
    : userTheme.value === "dark"
      ? darkTheme
      : lightTheme
});

const toggleTheme = () => {
  followSystemTheme.value = false;
  userTheme.value = theme.value === darkTheme ? "light" : "dark";
};

</script>

<template>
  <n-config-provider :locale="zhCN" :date-locale="dateZhCN" :theme="theme">
    <n-space vertical size="large">
      <n-layout position="absolute" style="min-width: 1400px">
        <n-layout-header bordered style="height: 64px">
          <div class="title">
            <div>
              <n-icon size="1.2rem">
                <TaskAssetView />
              </n-icon>
              Mission Monitor
            </div>
          </div>
          <div>
            <n-alert class="alert-box" v-if="mappingError != null" type="error">
              无法加载Mapping：{{ mappingError }}
            </n-alert>
          </div>
          <div></div>
          <div></div>
          <div class="theme-switch">
            <n-tooltip trigger="hover" placement="bottom">
              <template #trigger>
                <n-checkbox v-model="followSystemTheme">
                  跟随系统
                </n-checkbox>
              </template>
              <template #default>
                <n-button text @click="toggleTheme">
                  <n-icon>
                    <template v-if="theme === darkTheme">
                      <Moon />
                    </template>
                    <template v-else>
                      <Sun />
                    </template>
                  </n-icon>
                </n-button>
              </template>
            </n-tooltip>
          </div>
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
  </n-config-provider>
</template>

<style scoped>
.n-layout-header {
  display: grid;
  grid-template-columns: 2fr 5fr 5fr 5fr 1fr;
  max-height: 10%;
}

.title {
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  text-align: center;
  max-width: 200px;
}

.footer-p {
  text-align: center;
  margin: auto;
  font-size: 0.8rem;
}

.theme-switch {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 20px;
}
</style>
