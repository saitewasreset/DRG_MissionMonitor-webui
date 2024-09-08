<script setup lang="ts">
import {
  NCard,
  NGrid,
  NDataTable,
  NStatistic,
  NGi,
  NFlex,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import type { Response } from "@/type";
import { ref } from "vue";

import { formatMissionTime, formatMissionDateRelative, formatPercent } from "@/formatter";

interface OverallBrothersInfo {
  playerCount: number;
  playerSpotPercent: number;
  playerAvgSpot: number;
  playerGeTwoPercent: number;
}

interface BrotherInfo {
  count: number;
  presenceTime: number;
  lastSpot: number;
  spotCount: number;
  timestampList: number[];
}

interface BrothersData {
  overall: OverallBrothersInfo;
  player: Record<string, BrotherInfo>;
}

interface BrothersTableRow {
  playerName: string;
  count: number;
  spotCount: number;
  presenceTime: number;
  lastSpot: number;
}

function createBrothersTableColumns(): DataTableColumns<BrothersTableRow> {
  return [
    {
      title: "玩家",
      key: "playerName",
      align: "center",
    },
    {
      title: "游戏局数",
      key: "count",
      align: "center",
      sorter(a, b) {
        return a.count - b.count;
      },
    },
    {
      title: "再相遇次数",
      key: "spotCount",
      align: "center",
      sorter(a, b) {
        return a.spotCount - b.spotCount;
      },
    },
    {
      title: "总计相遇时间",
      key: "presenceTime",
      align: "center",
      defaultSortOrder: "descend",
      sorter(a, b) {
        return a.presenceTime - b.presenceTime;
      },
      render(row) {
        return formatMissionTime(row.presenceTime);
      },
    },
    {
      title: "上次相遇",
      key: "lastSpot",
      align: "center",
      sorter(a, b) {
        return a.lastSpot - b.lastSpot;
      },
      render(row) {
        return formatMissionDateRelative(row.lastSpot);
      },
    },
  ];
}

function generateBrothersTableData(playerData: Record<string, BrotherInfo>): BrothersTableRow[] {
  let result = [];
  for (const [playerName, data] of Object.entries(playerData)) {
    result.push({
      playerName,
      count: data.count,
      spotCount: data.spotCount,
      presenceTime: data.presenceTime,
      lastSpot: data.lastSpot,
    });
  }

  return result;
}

const message = useMessage();
const brothersTableData = ref<BrothersTableRow[]>([]);

const overallBrothersInfo = ref<OverallBrothersInfo>({
  playerCount: 0,
  playerSpotPercent: 0,
  playerAvgSpot: 0,
  playerGeTwoPercent: 0,
});

fetch("./api/info/brothers")
  .then((response) => response.json())
  .then((data: Response<BrothersData>) => {
    if (data.code !== 200) {
      message.error(`API error while fetching brothers data: ${data.code} ${data.message}`);
    } else {
      overallBrothersInfo.value = data.data.overall;
      brothersTableData.value = generateBrothersTableData(data.data.player);
    }
  })
  .catch((error) => {
    message.error("HTTP error while fetching brothers data: " + error);
  });
</script>
<template>
  <n-card title="总览">
    <n-grid :cols="4">
      <n-gi>
        <n-statistic label="路人玩家数" :value="overallBrothersInfo.playerCount"></n-statistic>
      </n-gi>
      <n-gi>
        <n-statistic label="再相遇概率">{{
          formatPercent(overallBrothersInfo.playerSpotPercent)
        }}</n-statistic>
      </n-gi>
      <n-gi>
        <n-statistic label="平均再相遇次数">{{
          overallBrothersInfo.playerAvgSpot.toFixed(2)
        }}</n-statistic>
      </n-gi>
      <n-gi>
        <n-statistic label="多于一局概率">{{
          formatPercent(overallBrothersInfo.playerGeTwoPercent)
        }}</n-statistic>
      </n-gi>
    </n-grid>
  </n-card>
  <n-card title="按玩家">
    <n-flex justify="center">
      <n-data-table
        :columns="createBrothersTableColumns()"
        :data="brothersTableData"
        :pagination="{ pageSize: 10 }"
        :row-key="(row: BrothersTableRow) => row.playerName"
        style="width: fit-content"
      ></n-data-table>
    </n-flex>
  </n-card>
</template>
