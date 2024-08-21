<script setup lang="ts">
import { NMessageProvider, NTabs, NTabPane } from "naive-ui";
import KPIFactor from "./KPIFactor.vue";
</script>
<template>
  <NMessageProvider>
    <n-tabs type="line" default-value="info">
      <n-tab-pane name="info" tab="信息" display-directive="show">
        <KPIFactor></KPIFactor>
      </n-tab-pane>
    </n-tabs>
  </NMessageProvider>
</template>
