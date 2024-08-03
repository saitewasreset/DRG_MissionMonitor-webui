<script setup lang="ts">
import { NButton, NIcon, NCard, NTabs, NH2, NTabPane, NMessageProvider } from "naive-ui";
import { formatMissionDate } from "@/formatter";

import { ArrowLeft } from "@vicons/carbon";

import MissionGeneral from "./MissionGeneral.vue";
import MissionDamage from "./MissionDamage.vue";
import MissionPick from "./MissionPick.vue";
import MissionKPI from "./MissionKPI.vue";

const props = defineProps<{
  missionId?: number;
  missionInvalid?: boolean;
  missionInvalidReason?: string;
  missionBeginTimestamp?: number;
}>();
</script>

<template>
  <n-h2 style="padding: 10px; margin: 0px">
    <n-button text style="font-size: 24px" @click="$emit('back')">
      <template #icon>
        <n-icon><ArrowLeft /></n-icon>
      </template>
    </n-button>
    {{ formatMissionDate(props.missionBeginTimestamp) }}
  </n-h2>
  <n-card>
    <n-tabs type="line" default-value="general" display-directive="show-lazy">
      <n-tab-pane name="general" tab="概览">
        <n-message-provider>
          <MissionGeneral
            :mission-id="props.missionId"
            :mission-invalid="missionInvalid"
            :mission-invalid-reason="missionInvalidReason"
          />
        </n-message-provider>
      </n-tab-pane>
      <n-tab-pane name="damage" tab="伤害">
        <n-message-provider>
          <MissionDamage :mission-id="props.missionId" />
        </n-message-provider>
      </n-tab-pane>
      <n-tab-pane name="pick" tab="采集">
        <n-message-provider>
          <MissionPick :mission-id="props.missionId" />
        </n-message-provider>
      </n-tab-pane>
      <n-tab-pane name="kpi" tab="KPI">
        <n-message-provider>
          <MissionKPI :mission-id="props.missionId" />
        </n-message-provider>
      </n-tab-pane>
    </n-tabs>
  </n-card>
</template>
