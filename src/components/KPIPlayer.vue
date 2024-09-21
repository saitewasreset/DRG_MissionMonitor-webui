<script setup lang="ts">
import {
  useMessage,
  NDataTable,
  NCard,
  NFlex,
  NSelect,
  NModal,
  type DataTableColumns,
} from "naive-ui";
import { ref, h } from "vue";
import { translate } from "@/mapping";
import { generateCharacterClass, formatMissionDate } from "@/formatter";
import { characterFilterOptions } from "@/tool";

import MissionDetails from "./MissionDetails.vue";

import type { Response } from "@/type";

interface MissionKPIInfo {
  missionId: number;
  beginTimestamp: number;
  presentTime: number;
  playerIndex: number;
  characterFactor: number;
  rawKPI: number;
}

interface PlayerCharacterKPIInfo {
  count: number;
  KPI: number;
  characterGameId: string;
  characterSubtype: string;
  missionKPIList: MissionKPIInfo[];
}

type PlayerKPIInfo = Record<
  string,
  { count: number; KPI: number; byCharacter: Record<string, PlayerCharacterKPIInfo> }
>;

interface OverallKPIInfoRow {
  playerName: string;
  totalCount: number;
  playerKPI: number;
  children?: OverallKPIInfoRow[];
}

interface PlayerKPIInfoRow {
  missionId: number;
  missionBeginTimestamp: number;
  characterGameId: string;
  characterSubtype: string;
  playerIndex: number;
  rawKPI: number;
  characterFactor: number;
  KPI: number;
}

function createOverallKPIInfoTableColumns(): DataTableColumns<OverallKPIInfoRow> {
  return [
    {
      title: "玩家",
      key: "playerName",
      align: "center",
      render(row) {
        return h(
          "span",
          { class: generateCharacterClass(row.playerName) },
          translate(row.playerName).value,
        );
      },
    },
    {
      title: "总玩家指数",
      key: "totalCount",
      align: "center",
      render(row) {
        return row.totalCount.toFixed(2);
      },
    },
    {
      title: "KPI",
      key: "playerKPI",
      align: "center",
      defaultSortOrder: "descend",
      sorter: (a, b) => a.playerKPI - b.playerKPI,
      render(row) {
        return (row.playerKPI * 100).toFixed(2);
      },
    },
  ];
}

function generateOverallKPIInfoTableData(playerKPIData: PlayerKPIInfo) {
  overallKPIInfoTableData.value = [];
  for (const [playerName, playerInfo] of Object.entries(playerKPIData)) {
    const row: OverallKPIInfoRow = {
      playerName,
      totalCount: playerInfo.count,
      playerKPI: playerInfo.KPI,
      children: [],
    };
    for (const characterInfo of Object.values(playerInfo.byCharacter)) {
      row.children?.push({
        playerName: characterInfo.characterGameId,
        totalCount: characterInfo.count,
        playerKPI: characterInfo.KPI,
      });
    }
    overallKPIInfoTableData.value.push(row);
  }
}

function generatePlayerSelectOptions(playerKPIData: PlayerKPIInfo) {
  for (const playerName of Object.keys(playerKPIData)) {
    playerSelectOptions.value.push({ label: translate(playerName).value, value: playerName });
  }
  playerSelected.value = playerSelectOptions.value[0].value;
}

function createPlayerKPIInfoTableColumns(): DataTableColumns<PlayerKPIInfoRow> {
  return [
    {
      title: "时间",
      key: "missionBeginTimestamp",
      align: "center",
      defaultSortOrder: "descend",
      sortOrder: "descend",
      sorter(a, b) {
        return a.missionBeginTimestamp - b.missionBeginTimestamp;
      },
      render(row) {
        return formatMissionDate(row.missionBeginTimestamp);
      },
    },
    {
      title: "角色",
      key: "characterGameId",
      align: "center",
      render(row) {
        return h(
          "span",
          { class: generateCharacterClass(row.characterGameId) },
          translate(row.characterGameId).value,
        );
      },
      filterOptions: characterFilterOptions,
      filter(value, row) {
        return row.characterGameId === value;
      },
    },
    {
      title: "子类型",
      key: "characterSubtype",
      align: "center",
    },
    {
      title: "玩家指数",
      key: "playerIndex",
      align: "center",
      render(row) {
        return row.playerIndex.toFixed(2);
      },
    },
    {
      title: "原始KPI",
      key: "rawKPI",
      align: "center",
      render(row) {
        return (row.rawKPI * 100).toFixed(2);
      },
      sorter(a, b) {
        return a.rawKPI - b.rawKPI;
      },
    },
    {
      title: "修正因子",
      key: "characterFactor",
      align: "center",
      render(row) {
        return row.characterFactor.toFixed(3);
      },
    },
    {
      title: "修正KPI",
      key: "KPI",
      align: "center",
      render(row) {
        return (row.KPI * 100).toFixed(2);
      },
      sorter(a, b) {
        return a.KPI - b.KPI;
      },
    },
  ];
}

function generatePlayerKPIInfoTableData(playerKPIData: PlayerKPIInfo) {
  playerKPIInfoTableData.value = {};
  for (const [playerName, playerInfo] of Object.entries(playerKPIData)) {
    playerKPIInfoTableData.value[playerName] = [];
    for (const characterInfo of Object.values(playerInfo.byCharacter)) {
      for (const missionKPIInfo of characterInfo.missionKPIList) {
        let KPI;
        if (missionKPIInfo.rawKPI < 0) {
          KPI = missionKPIInfo.rawKPI / missionKPIInfo.characterFactor;
        } else {
          KPI = missionKPIInfo.rawKPI * missionKPIInfo.characterFactor;
          if (KPI > 1) {
            KPI = 1;
          }
        }
        playerKPIInfoTableData.value[playerName].push({
          missionId: missionKPIInfo.missionId,
          missionBeginTimestamp: missionKPIInfo.beginTimestamp,
          characterGameId: characterInfo.characterGameId,
          characterSubtype: characterInfo.characterSubtype,
          playerIndex: missionKPIInfo.playerIndex,
          rawKPI: missionKPIInfo.rawKPI,
          characterFactor: missionKPIInfo.characterFactor,
          KPI: KPI,
        });
      }
    }
  }
}

const message = useMessage();
const showModal = ref(false);
const showMissionId = ref(1);

const playerKPIData = ref<PlayerKPIInfo>({});
const overallKPIInfoTableData = ref<OverallKPIInfoRow[]>([]);
const playerSelected = ref<string>("");
const playerSelectOptions = ref<{ label: string; value: string }[]>([]);
const playerKPIInfoTableData = ref<Record<string, PlayerKPIInfoRow[]>>({});

const playerKPIInfoTableRowProps = (row: PlayerKPIInfoRow) => {
  return {
    style: "cursor: pointer;",
    onClick: () => {
      showMissionId.value = row.missionId;
      showModal.value = true;
    },
  };
};

fetch("./api/kpi/player_kpi")
  .then((response) => response.json())
  .then((data: Response<PlayerKPIInfo>) => {
    if (data.code !== 200) {
      message.error(`API error while fetching player KPI data: ${data.code} ${data.message}`);
    } else {
      playerKPIData.value = data.data;
      generateOverallKPIInfoTableData(playerKPIData.value);
      generatePlayerSelectOptions(playerKPIData.value);
      generatePlayerKPIInfoTableData(playerKPIData.value);
    }
  })
  .catch((error) => {
    message.error("HTTP error while fetching player KPI data: " + error);
  });
</script>

<template>
  <n-card title="总览">
    <n-flex justify="center">
      <n-data-table
        :columns="createOverallKPIInfoTableColumns()"
        :data="overallKPIInfoTableData"
        :pagination="false"
        :row-key="(row: OverallKPIInfoRow) => row.playerName"
        style="width: fit-content"
      ></n-data-table>
    </n-flex>
  </n-card>
  <n-card title="按玩家">
    <n-select
      v-model:value="playerSelected"
      :options="playerSelectOptions"
      style="max-width: 250px"
    ></n-select>
    <n-flex justify="center">
      <n-data-table
        :columns="createPlayerKPIInfoTableColumns()"
        :data="playerKPIInfoTableData[playerSelected]"
        :pagination="{ pageSize: 10 }"
        :row-props="playerKPIInfoTableRowProps"
        :row-key="(row: PlayerKPIInfoRow) => row.missionId"
        style="width: fit-content"
      ></n-data-table>
    </n-flex>
  </n-card>
  <n-modal v-model:show="showModal">
    <n-card
      style="width: 80%"
      display-directive="show"
      title="任务信息"
      :bordered="false"
      size="huge"
      role="card"
      aria-modal="true"
      closable
      :on-close="() => (showModal = false)"
    >
      <MissionDetails :mission-id="showMissionId" style="width: 600px"></MissionDetails>
    </n-card>
  </n-modal>
</template>
