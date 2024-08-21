<script setup lang="ts">
type KPIFactorData = Record<
  number,
  Record<
    number,
    {
      data: number[];
      factor: number;
      median: number;
      average: number;
      std: number;
    }
  >
>;

type GammaInnerInfo = Record<
  string,
  {
    gameCount: number;
    value: number;
    avg: number;
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
  scoutA: number;
  scoutB: number;
}

interface Response<T> {
  code: number;
  message: string;
  data: T;
}

interface KPIFactorInfoRow {
  promotionRangeId: number;
  validCount: number;
  median: number;
  average: number;
  std: number;
  factor: number;
}

interface GammaRow {
  characterGameId: string;
  gameCount: number;
  average: number;
  ratio: number;
}

function createKPIFactorTableColumns(): DataTableColumns<KPIFactorInfoRow> {
  return [
    {
      title: "头衔",
      key: "promotionRangeId",
      align: "center",
      render(row) {
        const promotionRangeIdToClass = [
          "",
          "bronze",
          "silver",
          "gold",
          "platinum",
          "diamond",
          "legendary",
        ];
        const promotionRangeIdToName = [
          "None",
          "Bronze",
          "Silver",
          "Gold",
          "Platinum",
          "Diamond",
          "Legendary",
        ];
        return h(
          "span",
          { class: promotionRangeIdToClass[row.promotionRangeId] },
          promotionRangeIdToName[row.promotionRangeId],
        );
      },
    },
    {
      title: "有效数据量",
      key: "validCount",
      align: "center",
    },
    {
      title: "平均数",
      key: "median",
      align: "center",
      render(row) {
        if (row.average === 0.0) {
          return "-";
        } else {
          return (row.average * 100).toFixed(2);
        }
      },
    },
    {
      title: "中位数",
      key: "median",
      align: "center",
      render(row) {
        if (row.median === 0.0) {
          return "-";
        } else {
          return (row.median * 100).toFixed(2);
        }
      },
    },
    {
      title: "标准差",
      key: "median",
      align: "center",
      render(row) {
        if (row.std === 0.0) {
          return "-";
        } else {
          return (row.std * 100).toFixed(2);
        }
      },
    },
    {
      title: "修正因子",
      key: "factor",
      align: "center",
      render(row) {
        if (row.factor === 0.0) {
          return "-";
        } else {
          return row.factor.toFixed(3);
        }
      },
    },
  ];
}

function generateKPIFactorTableData(factorData: KPIFactorData, characterType: number) {
  const kpiFactorInfoRows: KPIFactorInfoRow[] = [];
  for (const promotionRangeId in factorData[characterType]) {
    const promotionRangeIdNum = parseInt(promotionRangeId);
    const factorInfo = factorData[characterType][promotionRangeIdNum];
    kpiFactorInfoRows.push({
      promotionRangeId: promotionRangeIdNum,
      validCount: factorInfo.data.length,
      median: factorInfo.median,
      factor: factorInfo.factor,
      average: factorInfo.average,
      std: factorInfo.std,
    });
  }
  factorTableData.value[characterType] = kpiFactorInfoRows;
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
      key: "scoutA",
      align: "center",
      sorter(a, b) {
        return a.scoutA - b.scoutA;
      },
    },
    {
      title: "侦察：输出型",
      key: "scoutB",
      align: "center",
      sorter(a, b) {
        return a.scoutB - b.scoutB;
      },
    },
  ];
}

function createGammaTableColumns(): DataTableColumns<GammaRow> {
  return [
    {
      title: "角色",
      key: "characterGameId",
      align: "center",
      render(row) {
        return translate(row.characterGameId).value;
      },
    },
    {
      title: "有效数据数量",
      key: "gameCount",
      align: "center",
      render(row) {
        return row.gameCount.toFixed(2);
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

  for (const [characterGameId, characterData] of Object.entries(gammaData[element])) {
    gammaRows.push({
      characterGameId: characterGameId,
      gameCount: characterData.gameCount,
      average: characterData.avg,
      ratio: characterData.ratio,
    });
  }

  return gammaRows;
}

import { ref, h } from "vue";
import { NGrid, NGi, NFlex, NCard, NDataTable, useMessage, type DataTableColumns } from "naive-ui";

import { translate } from "@/mapping";

const message = useMessage();

const factorData = ref<KPIFactorData>({});
const factorTableData = ref<Record<number, KPIFactorInfoRow[]>>([]);

const weightTableData = ref<WeightTableData[]>([]);

const GammaData = ref<GammaInfo>({ kill: {}, damage: {}, nitra: {}, minerals: {} });

fetch("./api/kpi/raw_data_by_promotion")
  .then((res) => res.json())
  .then((res: Response<KPIFactorData>) => {
    if (res.code !== 200) {
      message.error(`API Error while getting raw data by promotion: ${res.message}`);
    } else {
      factorData.value = res.data;
      for (let i = 0; i <= 4; i++) {
        generateKPIFactorTableData(factorData.value, i);
      }
    }
  })
  .catch((err) => {
    message.error(`HTTP Error while getting raw data by promotion: ${err}`);
  });

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
            style="width: fit-content"
          ></n-data-table>
        </n-card>
      </n-gi>
    </n-grid>
  </n-card>
  <n-card title="原始KPI修正因子">
    <n-grid :cols="3">
      <n-gi>
        <n-card title="钻机">
          <n-data-table
            :columns="createKPIFactorTableColumns()"
            :data="factorTableData[0]"
            :pagination="false"
            style="width: fit-content"
          ></n-data-table>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="枪手">
          <n-data-table
            :columns="createKPIFactorTableColumns()"
            :data="factorTableData[1]"
            :pagination="false"
            style="width: fit-content"
          ></n-data-table>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="工程">
          <n-data-table
            :columns="createKPIFactorTableColumns()"
            :data="factorTableData[2]"
            :pagination="false"
            style="width: fit-content"
          ></n-data-table>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="侦察：辅助型">
          <n-data-table
            :columns="createKPIFactorTableColumns()"
            :data="factorTableData[3]"
            :pagination="false"
            style="width: fit-content"
          ></n-data-table>
        </n-card>
      </n-gi>
      <n-gi>
        <n-card title="侦察：输出型">
          <n-data-table
            :columns="createKPIFactorTableColumns()"
            :data="factorTableData[4]"
            :pagination="false"
            style="width: fit-content"
          ></n-data-table>
        </n-card>
      </n-gi>
    </n-grid>
  </n-card>
</template>
