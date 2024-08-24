<script setup lang="ts">
import { useMessage, NDataTable, NCard, NFlex, NSelect, type DataTableColumns } from "naive-ui";
import { ref, h } from "vue";
import { translate } from "@/mapping";
import { generateCharacterClass, formatMissionDate } from "@/formatter";
import { characterFilterOptions } from "@/tool";

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
  for (const [playerName, playerInfo] of Object.entries(playerKPIData)) {
    playerKPIInfoTableData.value[playerName] = [];
    for (const characterInfo of Object.values(playerInfo.byCharacter)) {
      for (const missionKPIInfo of characterInfo.missionKPIList) {
        playerKPIInfoTableData.value[playerName].push({
          missionBeginTimestamp: missionKPIInfo.beginTimestamp,
          characterGameId: characterInfo.characterGameId,
          characterSubtype: characterInfo.characterSubtype,
          playerIndex: missionKPIInfo.playerIndex,
          rawKPI: missionKPIInfo.rawKPI,
          characterFactor: missionKPIInfo.characterFactor,
          KPI: missionKPIInfo.rawKPI * missionKPIInfo.characterFactor,
        });
      }
    }
  }
}

const message = useMessage();

const playerKPIData = ref<PlayerKPIInfo>({});
const overallKPIInfoTableData = ref<OverallKPIInfoRow[]>([]);
const playerSelected = ref<string>("");
const playerSelectOptions = ref<{ label: string; value: string }[]>([]);
const playerKPIInfoTableData = ref<Record<string, PlayerKPIInfoRow[]>>({});

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
        style="width: fit-content"
      ></n-data-table>
    </n-flex>
  </n-card>
</template>
