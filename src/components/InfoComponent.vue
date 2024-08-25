<script setup lang="ts">
import { NCard, NTabs, NTabPane, NMessageProvider } from "naive-ui";
import InfoBrothers from "./InfoBrothers.vue";
</script>
<template>
  <NMessageProvider>
    <n-card>
      <n-tabs type="line" default-value="brothers">
        <n-tab-pane name="brothers" tab="素不相识的矮人们" display-directive="show:lazy">
          <InfoBrothers></InfoBrothers>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </NMessageProvider>
</template>
