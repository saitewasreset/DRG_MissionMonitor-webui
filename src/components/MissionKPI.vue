<script setup lang="ts">
import { ref, h, watch } from "vue";
import { translate } from "@/mapping";
import { generateCharacterClass, nFormatter } from "@/formatter";
import { NAlert, NTag, useMessage, NDataTable, type DataTableColumns } from "naive-ui";

import type { Response } from "@/type";

interface CharacterSubtypeKPIInfo {
  subtypeName: string;
  priorityTable: Record<string, number>;
  weightList: number[];
}

interface KPIInfo {
  version: string;
  priorityTable: Record<string, number>;
  character: Record<string, Record<string, CharacterSubtypeKPIInfo>>;
}

interface KPIComponent {
  name: string;
  value: number;
  weight: number;
  sourceThis: number;
  sourceTotal: number;
}

interface MissionKPIInfo {
  playerName: string;
  heroGameId: string;
  subtypeId: number;
  subtypeName: string;
  weightedKill: number;
  weightedDamage: number;
  priorityDamage: number;
  reviveNum: number;
  deathNum: number;
  friendlyFire: number;
  nitra: number;
  supplyCount: number;
  resourceTotal: number;
  component: KPIComponent[];
  rawKPI: number;
}

interface KPIDataTableRow {
  playerName: string;
  heroGameId: string;
  subtypeName: string;
  weightedKill: number;
  weightedDamage: number;
  priorityDamage: number;
  reviveNum: number;
  deathNum: number;
  friendlyFire: number;
  nitra: number;
  supplyCount: number;
  resourceTotal: number;
  component: KPIComponent[];
  rawKPI: number;
}

interface KPIDataTableExpandRow {
  name: string;
  value: number;
  weight: number;
  weightValue: number;
  sourceThis: number;
  sourceTotal: number;
}

function createKPITableExpandElement(row: KPIDataTableRow) {
  const columns: DataTableColumns<KPIDataTableExpandRow> = [
    {
      title: "项目",
      key: "name",
      align: "center",
    },
    {
      title: "玩家值",
      key: "sourceThis",
      align: "center",
      render(row) {
        return nFormatter(row.sourceThis, 2);
      },
    },
    {
      title: "总值",
      key: "sourceTotal",
      align: "center",
      render(row) {
        return nFormatter(row.sourceTotal, 2);
      },
    },
    {
      title: "比值",
      key: "value",
      align: "center",
      render(row) {
        return row.value.toFixed(3);
      },
    },
    {
      title: "权重",
      key: "weight",
      align: "center",
      render(row) {
        return row.weight.toFixed(3);
      },
    },
    {
      title: "加权值",
      key: "weightValue",
      align: "center",
      render(row) {
        return (row.value * row.weight).toFixed(3);
      },
    },
  ];

  const data: KPIDataTableExpandRow[] = row.component.map((component) => {
    return {
      name: component.name,
      value: component.value,
      weight: component.weight,
      weightValue: component.value * component.weight,
      sourceThis: component.sourceThis,
      sourceTotal: component.sourceTotal,
    };
  });

  return h(NDataTable, { columns, data, style: "width: fit-content" });
}

function createKPITableColumns(): DataTableColumns<KPIDataTableRow> {
  return [
    {
      type: "expand",
      expandable: () => true,
      renderExpand: (row) => createKPITableExpandElement(row),
    },
    {
      title: "玩家",
      key: "playerName",
      align: "center",
    },
    {
      title: "角色",
      key: "heroGameId",
      align: "center",
      render(row) {
        return h(
          "span",
          { class: generateCharacterClass(row.heroGameId) },
          translate(row.heroGameId).value,
        );
      },
    },
    {
      title: "子类型",
      key: "subtypeName",
      align: "center",
    },
    {
      title: "加权伤害",
      key: "weightedDamage",
      align: "center",
      render(row) {
        return nFormatter(row.weightedDamage, 2);
      },
    },
    {
      title: "加权击杀数",
      key: "weightedKill",
      align: "center",
    },
    {
      title: "高威胁目标",
      key: "priorityDamage",
      align: "center",
      render(row) {
        return nFormatter(row.priorityDamage, 2);
      },
    },
    {
      title: "救人次数",
      key: "reviveNum",
      align: "center",
    },
    {
      title: "倒地次数",
      key: "deathNum",
      align: "center",
    },
    {
      title: "友伤",
      key: "friendlyFire",
      align: "center",
      render(row) {
        return nFormatter(row.friendlyFire, 2);
      },
    },
    {
      title: "硝石采集量",
      key: "nitra",
      align: "center",
      render(row) {
        return row.nitra.toFixed(0);
      },
    },
    {
      title: "补给份数",
      key: "supplyCount",
      align: "center",
    },
    {
      title: "资源采集量",
      key: "resourceTotal",
      align: "center",
      render(row) {
        return row.resourceTotal.toFixed(0);
      },
    },
    {
      title: "原始KPI",
      key: "rawKPI",
      align: "center",
      render(row) {
        return (row.rawKPI * 100).toFixed(2);
      },
    },
  ];
}

function generateKPITableData(missionData: MissionKPIInfo[]): KPIDataTableRow[] {
  let result = [];
  result = missionData.map((missionData) => {
    return {
      playerName: missionData.playerName,
      heroGameId: missionData.heroGameId,
      subtypeName: missionData.subtypeName,
      weightedKill: missionData.weightedKill,
      weightedDamage: missionData.weightedDamage,
      priorityDamage: missionData.priorityDamage,
      reviveNum: missionData.reviveNum,
      deathNum: missionData.deathNum,
      friendlyFire: missionData.friendlyFire,
      nitra: missionData.nitra,
      supplyCount: missionData.supplyCount,
      resourceTotal: missionData.resourceTotal,
      component: missionData.component,
      rawKPI: missionData.rawKPI,
    };
  });

  return result;
}

const props = defineProps<{
  missionId?: number;
}>();

const message = useMessage();

const kpiInfo = ref<KPIInfo>({
  version: "0.0.0",
  priorityTable: {},
  character: {},
});

const missionKpiInfo = ref<MissionKPIInfo[]>([]);

const kpiTableData = ref<KPIDataTableRow[]>([]);

watch(
  () => props.missionId,
  () => {
    fetch("./api/kpi")
      .then((response) => response.json())
      .then((data: Response<KPIInfo>) => {
        if (data.code !== 200) {
          message.error(`API Error while loading KPI Info: ${data.code} ${data.message}`);
        } else {
          kpiInfo.value = data.data;
        }
      })
      .catch((e) => {
        message.error(`HTTP Error while loading KPI Info: ${e}`);
      });

    fetch(`./api/mission/${props.missionId === undefined ? 1 : props.missionId}/kpi`)
      .then((response) => response.json())
      .then((data: Response<MissionKPIInfo[]>) => {
        if (data.code !== 200) {
          message.error(`API Error while loading Mission KPI Info: ${data.code} ${data.message}`);
        } else {
          missionKpiInfo.value = data.data;
          kpiTableData.value = generateKPITableData(data.data);
        }
      })
      .catch((e) => {
        message.error(`HTTP Error while loading Mission KPI Info: ${e}`);
      });
  },
  { immediate: true },
);
</script>
<template>
  <n-tag type="info">当前KPI版本：{{ kpiInfo.version }}</n-tag>
  <div class="warning-div">
    <n-alert title="注意" type="warning" style="width: fit-content"
      >KPI计算仍处于测试阶段！</n-alert
    >
    <n-alert title="注意" type="warning" style="width: fit-content"
      >不同角色的原始KPI没有可比性！</n-alert
    >
  </div>
  <div class="table-container">
    <n-data-table
      :columns="createKPITableColumns()"
      :data="kpiTableData"
      :pagination="false"
      :row-key="(row: KPIDataTableRow) => row.playerName + row.subtypeName"
      style="width: fit-content"
    ></n-data-table>
  </div>
</template>

<style scoped>
.table-container {
  display: flex;
  justify-content: space-around;
}
.warning-div {
  display: flex;
}
</style>
