<script setup lang="ts">
type GammaInnerInfo = Record<
  string,
  {
    playerIndex: number;
    value: number;
    ratio: number;
  }
>;

type GammaInfo = Record<string, GammaInnerInfo>;

interface WeightTableData {
  entityGameId: string;
  priority: number;
  driller: number;
  gunner: number;
  engineer: number;
  scout: number;
  scoutSpecial: number;
}

interface Response<T> {
  code: number;
  message: string;
  data: T;
}

interface GammaRow {
  kpiCharacterType: string;
  playerIndex: number;
  average: number;
  ratio: number;
}

function createWeightTableDataColumns(): DataTableColumns<WeightTableData> {
  return [
    {
      title: "敌人",
      key: "entityGameId",
      align: "center",
      render(row) {
        return translate(row.entityGameId).value;
      },
    },
    {
      title: "高威胁目标",
      key: "priority",
      align: "center",
      defaultSortOrder: "descend",
      sorter(a, b) {
        return a.priority - b.priority;
      },
    },
    {
      title: "钻机",
      key: "driller",
      align: "center",
      sorter(a, b) {
        return a.driller - b.driller;
      },
    },
    {
      title: "枪手",
      key: "gunner",
      align: "center",
      sorter(a, b) {
        return a.gunner - b.gunner;
      },
    },
    {
      title: "工程",
      key: "engineer",
      align: "center",
      sorter(a, b) {
        return a.engineer - b.engineer;
      },
    },
    {
      title: "侦察：辅助型",
      key: "scout",
      align: "center",
      sorter(a, b) {
        return a.scout - b.scout;
      },
    },
    {
      title: "侦察：输出型",
      key: "scoutSpecial",
      align: "center",
      sorter(a, b) {
        return a.scoutSpecial - b.scoutSpecial;
      },
    },
  ];
}

function createGammaTableColumns(): DataTableColumns<GammaRow> {
  return [
    {
      title: "角色",
      key: "kpiCharacterType",
      align: "center",
      render(row) {
        return h(
          "span",
          { class: generateKPICharacterClass(row.kpiCharacterType) },
          getKPICharacterName(row.kpiCharacterType),
        );
      },
    },
    {
      title: "总计玩家指数",
      key: "playerIndex",
      align: "center",
      render(row) {
        return row.playerIndex.toFixed(2);
      },
    },
    {
      title: "平均值",
      key: "average",
      align: "center",
      render(row) {
        return row.average.toFixed(0);
      },
      defaultSortOrder: "descend",
      sorter(a, b) {
        return a.average - b.average;
      },
    },
    {
      title: "修正指标",
      key: "ratio",
      align: "center",
      render(row) {
        return row.ratio.toFixed(3);
      },
    },
  ];
}

function generateGammaTableData(gammaData: GammaInfo, element: string): GammaRow[] {
  const gammaRows: GammaRow[] = [];

  for (const [kpiCharacterType, characterData] of Object.entries(gammaData[element])) {
    gammaRows.push({
      kpiCharacterType: kpiCharacterType,
      playerIndex: characterData.playerIndex,
      average: characterData.value,
      ratio: characterData.ratio,
    });
  }

  return gammaRows;
}

import { translate } from "@/mapping";
import { ref, h } from "vue";
import { NGrid, NGi, NFlex, NCard, NDataTable, useMessage, type DataTableColumns } from "naive-ui";

import { generateKPICharacterClass, getKPICharacterName } from "@/formatter";

const message = useMessage();

const weightTableData = ref<WeightTableData[]>([]);

const GammaData = ref<GammaInfo>({ kill: {}, damage: {}, nitra: {}, minerals: {} });

fetch("./api/kpi/weight_table")
  .then((res) => res.json())
  .then((res: Response<WeightTableData[]>) => {
    if (res.code !== 200) {
      message.error(`API Error while getting weight table data by promotion: ${res.message}`);
    } else {
      weightTableData.value = res.data;
    }
  })
  .catch((err) => {
    message.error(`HTTP Error while getting weight table data by promotion: ${err}`);
  });

fetch("./api/kpi/gamma")
  .then((res) => res.json())
  .then((res: Response<GammaInfo>) => {
    if (res.code !== 200) {
      message.error(`API Error while getting gamma data by promotion: ${res.message}`);
    } else {
      GammaData.value = res.data;
    }
  })
  .catch((err) => {
    message.error(`HTTP Error while getting gamma data by promotion: ${err}`);
  });
</script>
<template>
  <n-card title="权值表">
    <n-flex justify="center">
      <n-data-table
        :columns="createWeightTableDataColumns()"
        :data="weightTableData"
        :pagination="{ pageSize: 10 }"
        :row-key="(row: WeightTableData) => row.entityGameId"
        style="width: fit-content"
      ></n-data-table>
    </n-flex>
  </n-card>
  <n-card title="数据修正指标">
    <n-grid :cols="4">
      <n-gi>
        <n-card title="击杀数">
          <n-data-table
            :columns="createGammaTableColumns()"
            :data="generateGammaTableData(GammaData, 'kill')"
            :pagination="false"
            :row-key="(row: GammaRow) => row.kpiCharacterType"
            style="width: fit-content"
          ></n-data-table>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="输出">
          <n-data-table
            :columns="createGammaTableColumns()"
            :data="generateGammaTableData(GammaData, 'damage')"
            :pagination="false"
            :row-key="(row: GammaRow) => row.kpiCharacterType"
            style="width: fit-content"
          ></n-data-table>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="硝石采集量">
          <n-data-table
            :columns="createGammaTableColumns()"
            :data="generateGammaTableData(GammaData, 'nitra')"
            :pagination="false"
            :row-key="(row: GammaRow) => row.kpiCharacterType"
            style="width: fit-content"
          ></n-data-table>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="矿石采集量">
          <n-data-table
            :columns="createGammaTableColumns()"
            :data="generateGammaTableData(GammaData, 'minerals')"
            :pagination="false"
            :row-key="(row: GammaRow) => row.kpiCharacterType"
            style="width: fit-content"
          ></n-data-table>
        </n-card>
      </n-gi>
    </n-grid>
  </n-card>
</template>
