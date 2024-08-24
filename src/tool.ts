interface GroupInfo {
  labelList: string[];
  dataList: number[];
}

export const characterFilterOptions = [
  { label: "钻机", value: "DRILLER" },
  { label: "枪手", value: "GUNNER" },
  { label: "工程", value: "ENGINEER" },
  { label: "侦察", value: "SCOUT" },
];

export function getFirstGroupInfo<T>(
  objectList: T[],
  compar: (a: T, b: T) => number,
  objKey: (a: T) => number,
  objLabel: (a: T) => string,
  otherPercentLimit: number,
): GroupInfo {
  objectList.sort(compar);

  let totalValue = 0.0;
  let countedValue = 0.0;

  for (const objectElement of objectList) {
    totalValue += objKey(objectElement);
  }

  const labelList: string[] = [];
  const dataList: number[] = [];

  for (const objectElement of objectList) {
    const countedPercent = countedValue / totalValue;
    if (countedPercent >= 1 - otherPercentLimit) {
      break;
    }

    labelList.push(objLabel(objectElement));
    dataList.push(objKey(objectElement));
    countedValue += objKey(objectElement);
  }

  labelList.push("其它");
  dataList.push(totalValue - countedValue);

  return {
    labelList,
    dataList,
  };
}
