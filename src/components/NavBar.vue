<script setup lang="ts">
import { h, type Component } from "vue";

import { ReportData, List } from "@vicons/carbon";

import { NMenu, NIcon, type MenuOption } from "naive-ui";

const selectedKey = defineModel<string>({
  default: "general",
});

function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon) });
}

const menuOptions: MenuOption[] = [
  {
    label: "概览",
    key: "general",
    icon: renderIcon(ReportData),
  },
  {
    label: "任务",
    key: "mission",
    icon: renderIcon(List),
  },
];
</script>
<template>
  <n-menu :options="menuOptions" v-model:value="selectedKey"></n-menu>
</template>
