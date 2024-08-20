<script setup lang="ts">
import { ref, watch, h } from "vue";
import { NDataTable, NCard, type DataTableColumns, type DataTableCreateSummary } from "naive-ui";
import Plotly, { type Data } from "plotly.js-basic-dist";
import type { OverallDamageInfo, WeaponDamageInfo, CharacterDamageInfo } from "./DamageViewTypes";

import { nFormatter, generateCharacterClass } from "@/formatter";
import { translate } from "@/mapping";

import { getFirstGroupInfo } from "@/tool";

interface OverallTableRow {
  playerName: string;
  validGameCount: number;
  averageKillNum: number;
  averageDamage: number;
  averageRegularSupplyCount: number;
  averageDamagePerRegularSupply: number;
}

interface WeaponTableRow {
  weaponName: string;
  weaponCharacter: string;
  validGameCount: number;
  averageDamage: number;
  averageFriendlyFire: number;
  friendlyFireRate: number;
}

interface CharacterTableRow {
  characterGameId: string;
  validGameCount: number;
  averageDamage: number;
  averageCauseDamage: number;
  averageTakeDamage: number;
  friendlyFireRate: number;
  heartbrokenRate: number;
}

interface EnemyTableRow {
  mappedEnemyName: string;
  totalKill: number;
  totalDamage: number;
}

const props = defineProps<{
  overallDamageInfo?: OverallDamageInfo;
  weaponDamageInfo?: Record<string, WeaponDamageInfo>;
  characterDamageInfo?: Record<string, CharacterDamageInfo>;
}>();

const overallTableData = ref<OverallTableRow[]>([]);
const weaponTableData = ref<WeaponTableRow[]>([]);
const characterTableData = ref<CharacterTableRow[]>([]);
const enemyTableData = ref<EnemyTableRow[]>([]);

const createOverallTableSummary: DataTableCreateSummary = (pageData) => {
  const rows = pageData as unknown as OverallTableRow[];

  let totalKill = 0;
  let totalDamage = 0.0;
  let totalRegularSupplyCount = 0;

  for (const row of rows) {
    totalKill += row.averageKillNum;
    totalDamage += row.averageDamage;
    totalRegularSupplyCount += row.averageRegularSupplyCount;
  }

  let totalDamagePerSupply = totalDamage / totalRegularSupplyCount;

  return {
    playerName: { value: "总计" },
    validGameCount: { value: "-" },
    averageKillNum: { value: totalKill.toFixed(0) },
    averageDamage: { value: nFormatter(totalDamage, 2) },
    averageRegularSupplyCount: { value: totalRegularSupplyCount.toFixed(1) },
    averageDamagePerRegularSupply: { value: nFormatter(totalDamagePerSupply, 2) },
  };
};

function createOverallTableColumns(): DataTableColumns<OverallTableRow> {
  return [
    {
      title: "玩家",
      key: "playerName",
      align: "center",
    },
    {
      title: "有效局数",
      key: "validGameCount",
      align: "center",
      sorter: (a, b) => a.validGameCount - b.validGameCount,
    },
    {
      title: "平均击杀数",
      key: "averageKillNum",
      align: "center",
      sorter: (a, b) => a.averageKillNum - b.averageKillNum,
      render(row) {
        return row.averageKillNum.toFixed(0);
      },
    },
    {
      title: "平均伤害",
      key: "averageDamage",
      align: "center",
      sorter: (a, b) => a.averageDamage - b.averageDamage,
      defaultSortOrder: "descend",
      render(row) {
        return nFormatter(row.averageDamage, 2);
      },
    },
    {
      title: "平均约化补给数",
      key: "averageRegularSupplyCount",
      align: "center",
      sorter: (a, b) => a.averageRegularSupplyCount - b.averageRegularSupplyCount,
      render(row) {
        return row.averageRegularSupplyCount.toFixed(1);
      },
    },
    {
      title: "每约化补给伤害",
      key: "averageDamagePerRegularSupply",
      align: "center",
      sorter: (a, b) => a.averageDamagePerRegularSupply - b.averageDamagePerRegularSupply,
      render(row) {
        return nFormatter(row.averageDamagePerRegularSupply, 2);
      },
    },
  ];
}

function generateOverallTableData() {
  if (props.overallDamageInfo === undefined) {
    return;
  }
  for (const [playerName, playerData] of Object.entries(props.overallDamageInfo.info)) {
    let totalDamage = 0.0;
    let totalKill = 0.0;

    for (const damage of Object.values(playerData.damage)) {
      totalDamage += damage;
    }

    for (const kill of Object.values(playerData.kill)) {
      totalKill += kill;
    }

    overallTableData.value.push({
      playerName,
      validGameCount: playerData.validGameCount,
      averageKillNum: totalKill / playerData.validGameCount,
      averageDamage: totalDamage / playerData.validGameCount,
      averageRegularSupplyCount: playerData.averageSupplyCount + 1,
      averageDamagePerRegularSupply:
        totalDamage / ((playerData.averageSupplyCount + 1) * playerData.validGameCount),
    });
  }
}

function createDamagePlot() {
  const plotLayout: Partial<Plotly.Layout> = {
    width: 600,
    height: 400,
    grid: {
      rows: 2,
      columns: 2,
    },
  };

  let plotLabels: string[] = [];
  let killDataList: number[] = [];
  let damageDataList: number[] = [];
  let supplyCountList: number[] = [];
  let damagePerRegularSupplyList: number[] = [];

  if (props.overallDamageInfo === undefined) {
    return;
  }

  for (const [playerName, playerData] of Object.entries(props.overallDamageInfo.info)) {
    plotLabels.push(playerName);

    let totalKillCount = 0;
    let totalDamage = 0.0;

    for (const killCount of Object.values(playerData.kill)) {
      totalKillCount += killCount;
    }

    for (const damage of Object.values(playerData.damage)) {
      totalDamage += damage;
    }

    killDataList.push(totalKillCount / playerData.validGameCount);
    damageDataList.push(totalDamage / playerData.validGameCount);
    supplyCountList.push(playerData.averageSupplyCount);
    damagePerRegularSupplyList.push(
      totalDamage / ((playerData.averageSupplyCount + 1) * playerData.validGameCount),
    );
  }

  let data: Data[] = [
    {
      values: killDataList,
      labels: plotLabels,
      type: "pie",
      name: "击杀数",
      domain: {
        row: 0,
        column: 0,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "击杀数",
      },
    },
    {
      values: damageDataList,
      labels: plotLabels,
      type: "pie",
      name: "伤害",
      domain: {
        row: 0,
        column: 1,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "伤害",
      },
    },
    {
      values: supplyCountList,
      labels: plotLabels,
      type: "pie",
      name: "补给数",
      domain: {
        row: 1,
        column: 0,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "补给数",
      },
    },
    {
      values: damagePerRegularSupplyList,
      labels: plotLabels,
      type: "pie",
      name: "每约化补给伤害",
      domain: {
        row: 1,
        column: 1,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "每约化补给伤害",
      },
    },
  ];

  Plotly.newPlot("overall-plot-container", data, plotLayout);
}

function createWeaponTableColumns(): DataTableColumns<WeaponTableRow> {
  return [
    {
      title: "武器",
      key: "weaponName",
      align: "center",
      render(row) {
        return h(
          "span",
          { class: generateCharacterClass(row.weaponCharacter) },
          translate(row.weaponName).value,
        );
      },
    },
    {
      title: "有效局数",
      key: "validGameCount",
      align: "center",
      sorter: (a, b) => a.validGameCount - b.validGameCount,
    },
    {
      title: "平均伤害",
      key: "averageDamage",
      align: "center",
      sorter: (a, b) => a.averageDamage - b.averageDamage,
      defaultSortOrder: "descend",
      render(row) {
        return nFormatter(row.averageDamage, 2);
      },
    },
    {
      title: "平均友伤",
      key: "averageFriendlyFire",
      align: "center",
      sorter: (a, b) => a.averageFriendlyFire - b.averageFriendlyFire,
      render(row) {
        return nFormatter(row.averageFriendlyFire, 2);
      },
    },
    {
      title: "友伤比例",
      key: "friendlyFireRate",
      align: "center",
      sorter: (a, b) => a.friendlyFireRate - b.friendlyFireRate,
      render(row) {
        return (row.friendlyFireRate * 1000).toFixed(2) + "‰";
      },
    },
  ];
}

function createWeaponTableData() {
  if (props.weaponDamageInfo === undefined) {
    return;
  }
  for (const [weaponName, weaponData] of Object.entries(props.weaponDamageInfo)) {
    weaponTableData.value.push({
      weaponName,
      weaponCharacter: weaponData.heroGameId,
      validGameCount: weaponData.validGameCount,
      averageDamage: weaponData.damage / weaponData.validGameCount,
      averageFriendlyFire: weaponData.friendlyFire / weaponData.validGameCount,
      friendlyFireRate: weaponData.friendlyFire / (weaponData.damage + weaponData.friendlyFire),
    });
  }
}

function createWeaponPlot() {
  const plotLayout: Partial<Plotly.Layout> = {
    width: 600,
    height: 400,
    grid: {
      rows: 1,
      columns: 2,
    },
  };

  if (props.weaponDamageInfo === undefined) {
    return;
  }

  let weaponDataList: WeaponDamageInfo[] = [];
  for (const weaponData of Object.values(props.weaponDamageInfo)) {
    weaponDataList.push(weaponData);
  }

  let damageGroupInfo = getFirstGroupInfo(
    weaponDataList,
    (a, b) => b.damage / b.validGameCount - a.damage / a.validGameCount,
    (a) => a.damage / a.validGameCount,
    (a) => a.mappedName,
    0.1,
  );

  let friendlyFireGroupInfo = getFirstGroupInfo(
    weaponDataList,
    (a, b) => b.friendlyFire / b.validGameCount - a.friendlyFire / a.validGameCount,
    (a) => a.friendlyFire / a.validGameCount,
    (a) => a.mappedName,
    0.1,
  );

  let data: Data[] = [
    {
      values: damageGroupInfo.dataList,
      labels: damageGroupInfo.labelList,
      type: "pie",
      name: "伤害",
      domain: {
        row: 0,
        column: 0,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "伤害",
      },
    },
    {
      values: friendlyFireGroupInfo.dataList,
      labels: friendlyFireGroupInfo.labelList,
      type: "pie",
      name: "友伤",
      domain: {
        row: 0,
        column: 1,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "友伤",
      },
    },
  ];

  Plotly.newPlot("weapon-plot-container", data, plotLayout);
}

function createCharacterTableColumns(): DataTableColumns<CharacterTableRow> {
  return [
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
    },
    {
      title: "有效数据数",
      key: "validGameCount",
      align: "center",
      render(row) {
        return row.validGameCount.toFixed(2);
      },
    },
    {
      title: "平均伤害",
      key: "averageDamage",
      align: "center",
      sorter: (a, b) => a.averageDamage - b.averageDamage,
      render(row) {
        return nFormatter(row.averageDamage, 2);
      },
    },
    {
      title: "平均造成友伤",
      key: "averageCauseDamage",
      align: "center",
      sorter: (a, b) => a.averageCauseDamage - b.averageCauseDamage,
      render(row) {
        return nFormatter(row.averageCauseDamage, 2);
      },
    },
    {
      title: "平均受到友伤",
      key: "averageTakeDamage",
      align: "center",
      sorter: (a, b) => a.averageTakeDamage - b.averageTakeDamage,
      render(row) {
        return nFormatter(row.averageTakeDamage, 2);
      },
    },
    {
      title: "友伤比例",
      key: "friendlyFireRate",
      align: "center",
      sorter: (a, b) => a.friendlyFireRate - b.friendlyFireRate,
      render(row) {
        return (row.friendlyFireRate * 1000).toFixed(2) + "‰";
      },
    },
    {
      title: "心碎值",
      key: "heartbrokenRate",
      align: "center",
      sorter: (a, b) => a.heartbrokenRate - b.heartbrokenRate,
      defaultSortOrder: "descend",
      render(row) {
        return row.heartbrokenRate.toFixed(2);
      },
    },
  ];
}

function generateCharacterTableData() {
  if (props.characterDamageInfo === undefined) {
    return;
  }
  for (const [characterGameId, characterData] of Object.entries(props.characterDamageInfo)) {
    characterTableData.value.push({
      characterGameId,
      validGameCount: characterData.validGameCount,
      averageDamage: characterData.damage / characterData.validGameCount,
      averageCauseDamage: characterData.friendlyFire.cause / characterData.validGameCount,
      averageTakeDamage: characterData.friendlyFire.take / characterData.validGameCount,
      friendlyFireRate:
        characterData.friendlyFire.cause /
        (characterData.damage + characterData.friendlyFire.cause),
      heartbrokenRate: characterData.friendlyFire.take / characterData.friendlyFire.cause,
    });
  }
}

function createCharacterPlot() {
  const plotLayout: Partial<Plotly.Layout> = {
    width: 600,
    height: 400,
    grid: {
      rows: 2,
      columns: 2,
    },
  };

  const characterToColor: Record<string, string> = {
    SCOUT: "#00BFFF",
    DRILLER: "#DAA520",
    ENGINEER: "#FF0000",
    GUNNER: "#008000",
  };

  let characterColorList: string[] = [];

  let plotLabels: string[] = [];
  let averageDamageList: number[] = [];
  let averageCauseList: number[] = [];
  let averageTakeList: number[] = [];
  let heartbrokenRateList: number[] = [];

  if (props.characterDamageInfo === undefined) {
    return;
  }

  for (const [characterGameId, characterData] of Object.entries(props.characterDamageInfo)) {
    plotLabels.push(characterData.mappedName);
    characterColorList.push(characterToColor[characterGameId]);
    averageDamageList.push(characterData.damage / characterData.validGameCount);
    averageCauseList.push(characterData.friendlyFire.cause / characterData.validGameCount);
    averageTakeList.push(characterData.friendlyFire.take / characterData.validGameCount);
    heartbrokenRateList.push(characterData.friendlyFire.take / characterData.friendlyFire.cause);
  }

  let data: Data[] = [
    {
      values: averageDamageList,
      labels: plotLabels,
      type: "pie",
      name: "平均伤害",
      domain: {
        row: 0,
        column: 1,
      },
      marker: {
        colors: characterColorList,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "平均伤害",
        position: "bottom center",
      },
    },
    {
      values: averageCauseList,
      labels: plotLabels,
      type: "pie",
      name: "平均造成友伤",
      domain: {
        row: 1,
        column: 0,
      },
      marker: {
        colors: characterColorList,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "平均造成友伤",
        position: "bottom center",
      },
    },
    {
      values: averageTakeList,
      labels: plotLabels,
      type: "pie",
      name: "平均受到友伤",
      domain: {
        row: 1,
        column: 1,
      },
      marker: {
        colors: characterColorList,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "平均受到友伤",
        position: "bottom center",
      },
    },
    {
      values: heartbrokenRateList,
      labels: plotLabels,
      type: "bar",
      name: "心碎值",
      x: heartbrokenRateList,
      y: plotLabels,
      orientation: "h",
    },
  ];

  Plotly.newPlot("character-plot-container", data, plotLayout);
}

function createEnemyTableColumns(): DataTableColumns<EnemyTableRow> {
  return [
    {
      title: "敌人",
      key: "mappedEnemyName",
      align: "center",
      render(row) {
        return h("span", row.mappedEnemyName);
      },
    },
    {
      title: "总击杀数",
      key: "totalKill",
      align: "center",
      sorter: (a, b) => a.totalKill - b.totalKill,
      render(row) {
        return nFormatter(row.totalKill, 2);
      },
    },
    {
      title: "总受到伤害",
      key: "totalDamage",
      align: "center",
      sorter: (a, b) => a.totalDamage - b.totalDamage,
      defaultSortOrder: "descend",
      render(row) {
        return nFormatter(row.totalDamage, 2);
      },
    },
  ];
}

function generateEnemyTableData() {
  if (props.overallDamageInfo === undefined) {
    return;
  }

  let enemyDamageMap: Record<string, number> = {};
  let enemyKillMap: Record<string, number> = {};

  for (const playerDamageInfo of Object.values(props.overallDamageInfo.info)) {
    for (const [enemyGameId, enemyDamage] of Object.entries(playerDamageInfo.damage)) {
      let mappedEnemyName =
        props.overallDamageInfo.entityMapping[enemyGameId] === undefined
          ? enemyGameId
          : props.overallDamageInfo.entityMapping[enemyGameId];
      if (enemyDamageMap[mappedEnemyName] === undefined) {
        enemyDamageMap[mappedEnemyName] = 0.0;
      }
      enemyDamageMap[mappedEnemyName] += enemyDamage;
    }

    for (const [enemyGameId, enemyKill] of Object.entries(playerDamageInfo.kill)) {
      let mappedEnemyName =
        props.overallDamageInfo.entityMapping[enemyGameId] === undefined
          ? enemyGameId
          : props.overallDamageInfo.entityMapping[enemyGameId];
      if (enemyKillMap[mappedEnemyName] === undefined) {
        enemyKillMap[mappedEnemyName] = 0;
      }
      enemyKillMap[mappedEnemyName] += enemyKill;
    }
  }

  for (const [mappedEnemyName, totalKill] of Object.entries(enemyKillMap)) {
    enemyTableData.value.push({
      mappedEnemyName,
      totalKill: totalKill,
      totalDamage: enemyDamageMap[mappedEnemyName],
    });
  }
}

function createEnemyPlot() {
  const plotLayout: Partial<Plotly.Layout> = {
    width: 600,
    height: 400,
    grid: {
      rows: 1,
      columns: 2,
    },
  };

  if (props.overallDamageInfo === undefined) {
    return;
  }

  let enemyDamageMap: Record<string, number> = {};
  let enemyKillMap: Record<string, number> = {};

  for (const playerDamageInfo of Object.values(props.overallDamageInfo.info)) {
    for (const [enemyGameId, enemyKill] of Object.entries(playerDamageInfo.kill)) {
      let mappedEnemyName =
        props.overallDamageInfo.entityMapping[enemyGameId] === undefined
          ? enemyGameId
          : props.overallDamageInfo.entityMapping[enemyGameId];
      if (enemyKillMap[mappedEnemyName] === undefined) {
        enemyKillMap[mappedEnemyName] = 0;
      }
      enemyKillMap[mappedEnemyName] += enemyKill;
    }

    for (const [enemyGameId, enemyDamage] of Object.entries(playerDamageInfo.damage)) {
      let mappedEnemyName =
        props.overallDamageInfo.entityMapping[enemyGameId] === undefined
          ? enemyGameId
          : props.overallDamageInfo.entityMapping[enemyGameId];
      if (enemyDamageMap[mappedEnemyName] === undefined) {
        enemyDamageMap[mappedEnemyName] = 0.0;
      }
      enemyDamageMap[mappedEnemyName] += enemyDamage;
    }
  }

  let enemyDataList = [];

  for (const [mappedEnemyName, totalKill] of Object.entries(enemyKillMap)) {
    enemyDataList.push({
      mappedName: mappedEnemyName,
      totalKill,
      totalDamage: enemyDamageMap[mappedEnemyName],
    });
  }

  let enemyKillGroupInfo = getFirstGroupInfo(
    enemyDataList,
    (a, b) => b.totalKill - a.totalKill,
    (a) => a.totalKill,
    (a) => a.mappedName,
    0.1,
  );

  let enemyDamageGroupInfo = getFirstGroupInfo(
    enemyDataList,
    (a, b) => b.totalDamage - a.totalDamage,
    (a) => a.totalDamage,
    (a) => a.mappedName,
    0.1,
  );

  let data: Data[] = [
    {
      values: enemyKillGroupInfo.dataList,
      labels: enemyKillGroupInfo.labelList,
      type: "pie",
      name: "总击杀数",
      domain: {
        row: 0,
        column: 0,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "总击杀数",
      },
    },
    {
      values: enemyDamageGroupInfo.dataList,
      labels: enemyDamageGroupInfo.labelList,
      type: "pie",
      name: "总伤害",
      domain: {
        row: 0,
        column: 1,
      },
      hoverinfo: "label+value+percent",
      title: {
        text: "总伤害",
      },
    },
  ];

  Plotly.newPlot("enemy-plot-container", data, plotLayout);
}

watch(
  () => props.overallDamageInfo,
  () => {
    generateOverallTableData();
    createDamagePlot();

    generateEnemyTableData();
    createEnemyPlot();
  },
);

watch(
  () => props.weaponDamageInfo,
  () => {
    createWeaponTableData();
    createWeaponPlot();
  },
);

watch(
  () => props.characterDamageInfo,
  () => {
    generateCharacterTableData();
    createCharacterPlot();
  },
);
</script>
<template>
  <n-card title="按玩家">
    <div class="table-plot-container">
      <n-data-table
        :columns="createOverallTableColumns()"
        :data="overallTableData"
        :pagination="false"
        :summary="createOverallTableSummary"
        style="width: fit-content"
      ></n-data-table>
      <div id="overall-plot-container"></div></div
  ></n-card>
  <n-card title="按武器">
    <div class="table-plot-container">
      <n-data-table
        :columns="createWeaponTableColumns()"
        :data="weaponTableData"
        :pagination="{ pageSize: 10 }"
        style="width: fit-content"
      ></n-data-table>
      <div id="weapon-plot-container"></div>
    </div>
  </n-card>
  <n-card title="按角色">
    <div class="table-plot-container">
      <n-data-table
        :columns="createCharacterTableColumns()"
        :data="characterTableData"
        :pagination="false"
        style="width: fit-content"
      ></n-data-table>
      <div id="character-plot-container"></div>
    </div>
  </n-card>
  <n-card title="按敌人">
    <div class="table-plot-container">
      <n-data-table
        :columns="createEnemyTableColumns()"
        :data="enemyTableData"
        :pagination="{ pageSize: 10 }"
        style="width: fit-content"
      ></n-data-table>
      <div id="enemy-plot-container"></div>
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
