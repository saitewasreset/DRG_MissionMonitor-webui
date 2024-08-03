<script setup lang="ts">
import {
  NCard,
  NDataTable,
  NGrid,
  NGridItem,
  NStatistic,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import { ref, h } from "vue";

import DeltaView from "./DeltaView.vue";

import { formatMissionTime, formatPercent, nFormatter, generateCharacterClass } from "@/formatter";

import Plotly, { type Data } from "plotly.js-basic-dist";

interface DeltaData {
  prev: number;
  recent: number;
  total: number;
}

interface GeneralInfo {
  gameCount: number;
  validRate: number;
  totalMissionTime: number;
  averageMissionTime: DeltaData;
  uniquePlayerCount: number;
  openRoomRate: DeltaData;
  passRate: DeltaData;
  averageDifficulty: DeltaData;
  averageKillNum: DeltaData;
  averageDamage: DeltaData;
  averageDeathNumPerPlayer: DeltaData;
  averageMineralsMined: DeltaData;
  averageSupplyCountPerPlayer: DeltaData;
  averageRewardCredit: DeltaData;
}

interface MissionTypeInfo {
  averageDifficulty: number;
  averageMissionTime: number;
  averageRewardCredit: number;
  creditPerMinute: number;
  missionCount: number;
  passRate: number;
}

interface MissionInfo {
  missionTypeMap: Record<string, string>;
  missionTypeData: Record<string, MissionTypeInfo>;
}

interface PlayerInfo {
  averageDeathNum: number;
  averageMineralsMined: number;
  averageReviveNum: number;
  averageSupplyCount: number;
  averageSupplyEfficiency: number;
  characterInfo: Record<string, number>;
  validMissionCount: number;
}

interface PlayerData {
  characterMap: Record<string, string>;
  playerData: Record<string, PlayerInfo>;
}

interface Response<T> {
  code: number;
  message: string;
  data: T;
}

interface MissionTypeInfoTableRow extends MissionTypeInfo {
  missionType: string;
  mappedType: string;
}

interface PlayerInfoTableRow extends PlayerInfo {
  playerName: string;
  characterMapping: Record<string, string>;
}

function createMissionTypeTableColumns(): DataTableColumns<MissionTypeInfoTableRow> {
  return [
    {
      title: "任务类型",
      key: "missionType",
      render: (row) => row.mappedType,
      align: "center",
    },
    {
      title: "有效局数",
      key: "missionCount",
      sorter: (a, b) => a.missionCount - b.missionCount,
      align: "center",
    },
    {
      title: "通过率",
      key: "passRate",
      render: (row) => formatPercent(row.passRate),
      sorter: (a, b) => a.passRate - b.passRate,
      align: "center",
    },
    {
      title: "平均难度",
      key: "averageDifficulty",
      render: (row) => row.averageDifficulty.toFixed(2),
      sorter: (a, b) => a.averageDifficulty - b.averageDifficulty,
      align: "center",
    },
    {
      title: "平均任务时长",
      key: "averageMissionTime",
      render: (row) => formatMissionTime(row.averageMissionTime),
      sorter: (a, b) => a.averageMissionTime - b.averageMissionTime,
      align: "center",
    },
    {
      title: "平均奖励代币",
      key: "averageRewardCredit",
      render: (row) => nFormatter(row.averageRewardCredit, 2),
      sorter: (a, b) => a.averageRewardCredit - b.averageRewardCredit,
      align: "center",
    },
    {
      title: "代币效率",
      key: "creditPerMinute",
      render: (row) => row.creditPerMinute.toFixed(0),
      sorter: (a, b) => a.creditPerMinute - b.creditPerMinute,
      defaultSortOrder: "descend",
      align: "center",
    },
  ];
}

function createMissionTypeTableData(missionInfo: MissionInfo) {
  for (const [missionTypeId, missionTypeInfo] of Object.entries(missionInfo.missionTypeData)) {
    missionTypeTableData.value.push({
      missionType: missionTypeId,
      mappedType:
        missionInfo.missionTypeMap[missionTypeId] === undefined
          ? missionTypeId
          : missionInfo.missionTypeMap[missionTypeId],
      ...missionTypeInfo,
    });
  }
}

function createMissionTypePlot(missionInfo: MissionInfo) {
  const plotLayout: Partial<Plotly.Layout> = {
    width: 600,
    height: 400,
    grid: {
      rows: 1,
      columns: 1,
    },
  };

  let plotLabels: string[] = [];
  let missionCountList: number[] = [];

  for (const [missionTypeId, missionTypeInfo] of Object.entries(missionInfo.missionTypeData)) {
    plotLabels.push(missionInfo.missionTypeMap[missionTypeId]);
    missionCountList.push(missionTypeInfo.missionCount);
  }

  let data: Data[] = [
    {
      values: missionCountList,
      labels: plotLabels,
      type: "pie",
      name: "任务数",
      domain: {
        row: 0,
        column: 0,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "任务数",
      },
    },
  ];

  Plotly.newPlot("mission-type-plot", data, plotLayout);
}

function createPlayerInfoSubTable(outerRow: PlayerInfoTableRow) {
  interface SubTableRow {
    characterGameId: string;
    characterCount: number;
  }
  const columns: DataTableColumns<SubTableRow> = [
    {
      title: "角色",
      key: "characterName",
      align: "center",
      render: (row) =>
        h(
          "span",
          { class: generateCharacterClass(row.characterGameId) },
          outerRow.characterMapping[row.characterGameId],
        ),
    },
    {
      title: "次数",
      key: "characterCount",
      align: "center",
      sorter: (a, b) => a.characterCount - b.characterCount,
      defaultSortOrder: "descend",
    },
  ];

  let data: SubTableRow[] = [];
  for (const [characterGameId, characterCount] of Object.entries(outerRow.characterInfo)) {
    data.push({
      characterGameId,
      characterCount,
    });
  }

  return h(NDataTable, {
    columns,
    data,
    pagination: false,
    style: "width: fit-content",
  });
}

function createPlayerInfoTableColumns(): DataTableColumns<PlayerInfoTableRow> {
  return [
    {
      type: "expand",
      renderExpand: (rowData) => createPlayerInfoSubTable(rowData),
    },
    {
      title: "玩家",
      key: "playerName",
      render: (row) => {
        let mostcharaterGameId = "";
        let mostCharacterCount = 0;
        for (const [charaterGameId, characterCount] of Object.entries(row.characterInfo)) {
          if (characterCount > mostCharacterCount) {
            mostcharaterGameId = charaterGameId;
            mostCharacterCount = characterCount;
          }
        }

        return h("span", { class: generateCharacterClass(mostcharaterGameId) }, row.playerName);
      },
      align: "center",
    },
    {
      title: "有效局数",
      key: "validMissionCount",
      sorter: (a, b) => a.validMissionCount - b.validMissionCount,
      defaultSortOrder: "descend",
      align: "center",
    },
    {
      title: "平均救人数",
      key: "averageReviveNum",
      render: (row) => row.averageReviveNum.toFixed(2),
      sorter: (a, b) => a.averageReviveNum - b.averageReviveNum,
      align: "center",
    },
    {
      title: "平均倒地数",
      key: "averageDeathNum",
      render: (row) => row.averageDeathNum.toFixed(2),
      sorter: (a, b) => a.averageDeathNum - b.averageDeathNum,
      align: "center",
    },
    {
      title: "平均采集量",
      key: "averageMineralsMined",
      render: (row) => nFormatter(row.averageMineralsMined, 2),
      sorter: (a, b) => a.averageMineralsMined - b.averageMineralsMined,
      align: "center",
    },
    {
      title: "平均补给份数",
      key: "averageSupplyCount",
      render: (row) => row.averageSupplyCount.toFixed(2),
      sorter: (a, b) => a.averageSupplyCount - b.averageSupplyCount,
      align: "center",
    },
    {
      title: "平均补给效率",
      key: "averageSupplyEfficiency",
      render: (row) => formatPercent(row.averageSupplyEfficiency),
      sorter: (a, b) => a.averageSupplyEfficiency - b.averageSupplyEfficiency,
      align: "center",
    },
  ];
}

function createPlayerInfoTableData(playerData: PlayerData) {
  for (const [playerName, playerInfo] of Object.entries(playerData.playerData)) {
    playerInfoTableData.value.push({
      playerName,
      characterMapping: playerData.characterMap,
      ...playerInfo,
    });
  }
}

function createPlayerInfoPlot(playerData: PlayerData) {
  const plotLayout: Partial<Plotly.Layout> = {
    width: 600,
    height: 400,
    grid: {
      rows: 2,
      columns: 2,
    },
  };

  let characterLabels: string[] = [];
  let characterColorList: string[] = [];
  let playerLabels: string[] = [];
  let characterCountList: number[] = [];
  let playerMineralsMinedList: number[] = [];
  let playerDeathNumList: number[] = [];
  let playerSupplyCountList: number[] = [];

  let characterCountMap: Record<string, number> = {};

  const characterToColor: Record<string, string> = {
    SCOUT: "#00BFFF",
    DRILLER: "#DAA520",
    ENGINEER: "#FF0000",
    GUNNER: "#008000",
  };

  for (const playerInfo of Object.values(playerData.playerData)) {
    for (const [characterGameId, characterCount] of Object.entries(playerInfo.characterInfo)) {
      if (characterCountMap[characterGameId] === undefined) {
        characterCountMap[characterGameId] = characterCount;
      } else {
        characterCountMap[characterGameId] += characterCount;
      }
    }
  }

  for (const [characterGameId, characterCount] of Object.entries(characterCountMap)) {
    characterLabels.push(playerData.characterMap[characterGameId]);
    characterColorList.push(characterToColor[characterGameId]);
    characterCountList.push(characterCount);
  }

  for (const [playerName, playerInfo] of Object.entries(playerData.playerData)) {
    playerLabels.push(playerName);
    playerMineralsMinedList.push(playerInfo.averageMineralsMined);
    playerDeathNumList.push(playerInfo.averageDeathNum);
    playerSupplyCountList.push(playerInfo.averageSupplyCount);
  }

  let data: Data[] = [
    {
      values: characterCountList,
      labels: characterLabels,
      type: "pie",
      name: "角色选择次数",
      marker: {
        colors: characterColorList,
      },
      domain: {
        row: 0,
        column: 0,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "角色选择次数",
      },
    },
    {
      values: playerMineralsMinedList,
      labels: playerLabels,
      type: "pie",
      name: "采集量",
      domain: {
        row: 0,
        column: 1,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "采集量",
      },
    },
    {
      values: playerDeathNumList,
      labels: playerLabels,
      type: "pie",
      name: "倒地数",
      domain: {
        row: 1,
        column: 0,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "倒地数",
      },
    },
    {
      values: playerSupplyCountList,
      labels: playerLabels,
      type: "pie",
      name: "补给数",
      domain: {
        row: 1,
        column: 1,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "补给数",
      },
    },
  ];

  Plotly.newPlot("player-info-plot", data, plotLayout);
}

const message = useMessage();
const generalInfoData = ref<GeneralInfo>();
const MissionInfoData = ref<MissionInfo>();
const PlayerInfoData = ref<PlayerData>();

const missionTypeTableData = ref<MissionTypeInfoTableRow[]>([]);
const playerInfoTableData = ref<PlayerInfoTableRow[]>([]);

fetch("./api/general")
  .then((res) => res.json())
  .then((res: Response<GeneralInfo>) => {
    if (res.code !== 200) {
      message.error(`API Error: ${res.code} ${res.message}`);
    } else {
      generalInfoData.value = res.data;
    }
  })
  .catch((err) => {
    message.error(`HTTP Error: ${err}`);
  });

fetch("./api/general/mission_type")
  .then((res) => res.json())
  .then((res: Response<MissionInfo>) => {
    if (res.code !== 200) {
      message.error(`API Error: ${res.code} ${res.message}`);
    } else {
      MissionInfoData.value = res.data;
      createMissionTypeTableData(res.data);
      createMissionTypePlot(res.data);
    }
  })
  .catch((err) => {
    message.error(`HTTP Error: ${err}`);
  });

fetch("./api/general/player")
  .then((res) => res.json())
  .then((res: Response<PlayerData>) => {
    if (res.code !== 200) {
      message.error(`API Error: ${res.code} ${res.message}`);
    } else {
      PlayerInfoData.value = res.data;
      createPlayerInfoTableData(res.data);
      createPlayerInfoPlot(res.data);
    }
  })
  .catch((err) => {
    message.error(`HTTP Error: ${err}`);
  });
</script>
<template>
  <n-card title="任务">
    <n-grid :cols="4">
      <n-grid-item>
        <n-statistic label="游戏局数">{{ generalInfoData?.gameCount }}</n-statistic>
      </n-grid-item>
      <n-grid-item>
        <n-statistic label="有效率">{{ formatPercent(generalInfoData?.validRate) }}</n-statistic>
      </n-grid-item>
      <n-grid-item>
        <n-statistic label="总任务时长">{{
          formatMissionTime(generalInfoData?.totalMissionTime)
        }}</n-statistic>
      </n-grid-item>
      <n-grid-item>
        <DeltaView
          label="平均任务时长"
          :delta="generalInfoData?.averageMissionTime"
          :formatter="formatMissionTime"
          :reverse="true"
        ></DeltaView>
      </n-grid-item>
      <n-grid-item>
        <n-statistic label="独立玩家数">{{ generalInfoData?.uniquePlayerCount }}</n-statistic>
      </n-grid-item>
      <n-grid-item>
        <DeltaView
          label="野房率"
          :delta="generalInfoData?.openRoomRate"
          :formatter="formatPercent"
        ></DeltaView>
      </n-grid-item>
      <n-grid-item>
        <DeltaView
          label="通过率"
          :delta="generalInfoData?.passRate"
          :formatter="formatPercent"
        ></DeltaView>
      </n-grid-item>
      <n-grid-item>
        <DeltaView
          label="平均难度"
          :delta="generalInfoData?.averageDifficulty"
          :formatter="(total) => total.toFixed(2)"
        ></DeltaView>
      </n-grid-item>
      <n-grid-item>
        <DeltaView
          label="平均击杀数"
          :delta="generalInfoData?.averageKillNum"
          :formatter="(total) => total.toFixed(0)"
        ></DeltaView>
      </n-grid-item>
      <n-grid-item>
        <DeltaView
          label="平均伤害"
          :delta="generalInfoData?.averageDamage"
          :formatter="(total) => nFormatter(total, 2)"
        ></DeltaView>
      </n-grid-item>
      <n-grid-item>
        <DeltaView
          label="平均每人倒地数"
          :delta="generalInfoData?.averageDeathNumPerPlayer"
          :formatter="(total) => total.toFixed(2)"
          :reverse="true"
        ></DeltaView>
      </n-grid-item>
      <n-grid-item>
        <DeltaView
          label="平均采集量"
          :delta="generalInfoData?.averageMineralsMined"
          :formatter="(total) => nFormatter(total, 2)"
        ></DeltaView>
      </n-grid-item>
      <n-grid-item>
        <DeltaView
          label="平均每人补给份数"
          :delta="generalInfoData?.averageSupplyCountPerPlayer"
          :formatter="(total) => total.toFixed(2)"
          :reverse="true"
        ></DeltaView>
      </n-grid-item>
      <n-grid-item>
        <DeltaView
          label="平均奖励代币"
          :delta="generalInfoData?.averageRewardCredit"
          :formatter="(total) => nFormatter(total, 2)"
        ></DeltaView>
      </n-grid-item>
    </n-grid>
  </n-card>
  <n-card title="任务类型">
    <div class="table-plot-container">
      <n-data-table
        :columns="createMissionTypeTableColumns()"
        :data="missionTypeTableData"
        :pagination="false"
        style="width: fit-content"
      >
      </n-data-table>
      <div id="mission-type-plot"></div>
    </div>
  </n-card>
  <n-card title="玩家">
    <div class="table-plot-container">
      <n-data-table
        :columns="createPlayerInfoTableColumns()"
        :data="playerInfoTableData"
        :pagination="false"
        style="width: fit-content"
      ></n-data-table>
      <div id="player-info-plot"></div>
    </div>
  </n-card>
</template>
<style scoped>
.table-plot-container {
  display: flex;
  justify-content: space-around;
  align-items: center;
}
</style>
