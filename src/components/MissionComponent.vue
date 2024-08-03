<script setup lang="ts">
import { ref } from "vue";
import { NMessageProvider } from "naive-ui";
import MissionList from "./MissionList.vue";
import MissionDetails from "./MissionDetails.vue";

const currentSelectedMission = ref<number | null>(null);
const currentSelectedMissionInvalid = ref<boolean>(false);
const currentSelectedMissionInvalidReason = ref<string>("");
const currentSelectedMissionBeginTimestamp = ref<number>(0);

function processSelectMission(missionInfo: any) {
  currentSelectedMission.value = missionInfo.missionId;
  currentSelectedMissionInvalid.value = missionInfo.missionInvalid;
  currentSelectedMissionInvalidReason.value = missionInfo.missionInvalidReason;
  currentSelectedMissionBeginTimestamp.value = missionInfo.missionBeginTimestamp;
}
</script>

<template>
  <n-message-provider>
    <KeepAlive include="MissionList">
      <component
        :is="currentSelectedMission === null ? MissionList : MissionDetails"
        :missionId="currentSelectedMission"
        :missionInvalid="currentSelectedMissionInvalid"
        :missionInvalidReason="currentSelectedMissionInvalidReason"
        :missionBeginTimestamp="currentSelectedMissionBeginTimestamp"
        @selectedMission="processSelectMission"
        @back="
          () => {
            currentSelectedMission = null;
          }
        "
      ></component>
    </KeepAlive>
  </n-message-provider>
</template>
