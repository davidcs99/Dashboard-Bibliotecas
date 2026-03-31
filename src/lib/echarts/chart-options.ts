import type { EChartsOption, LineSeriesOption, ScatterSeriesOption } from "echarts";

type NamedSeries = {
  key: string;
  name: string;
};

type ScatterChartDatum = {
  name: string;
  users: number;
  events: number;
};

const numberFormatter = new Intl.NumberFormat("es-EC");
const axisLineColor = "#d3dbe6";
const axisLabelColor = "#5b6472";
const primarySeriesColor = "#5C6F8E";
const chartPalette = ["#5C6F8E", "#118DFF", "#E66C37", "#E3D040", "#94F8FD", "#991012"];

function extractNumericValue(parameters: { value?: unknown }): number {
  const rawValue = parameters.value;

  if (Array.isArray(rawValue)) {
    return Number(rawValue[0] ?? 0);
  }

  return Number(rawValue ?? 0);
}

function createSeriesLabelFormatter() {
  return (parameters: { value?: unknown }) => formatChartValue(extractNumericValue(parameters));
}

function formatChartValue(value: number | string): string {
  return numberFormatter.format(Number(value));
}

function formatCategoryLabel(value: string): string {
  return value
    .replace(/^UNIDAD ACADEMICA DE /i, "")
    .replace(/^UNIDAD ACADEMICA DEL /i, "")
    .replace(/^UNIDAD ACADEMICA /i, "");
}

export function buildBarChartOptions<T extends Record<string, string | number>>(
  data: T[],
  categoryKey: keyof T,
  valueKey: keyof T,
  seriesName: string,
  orientation: "vertical" | "horizontal" = "vertical",
  invertCategoryAxis?: boolean
): EChartsOption {
  const safeData = data ?? [];
  const isHorizontal = orientation === "horizontal";
  const categoryValues = safeData.map((item) => String(item[categoryKey]));
  const numericValues = safeData.map((item) => Number(item[valueKey]));
  const shouldInvertCategoryAxis = invertCategoryAxis ?? isHorizontal;

  return {
    color: chartPalette,
    tooltip: {
      trigger: "axis"
    },
    xAxis: isHorizontal
      ? {
          type: "value",
          splitLine: {
            lineStyle: {
              color: "rgba(211, 219, 230, 0.58)"
            }
          },
          axisLine: {
            lineStyle: {
              color: axisLineColor
            }
          },
          axisLabel: {
            color: axisLabelColor,
            formatter: (value: number) => formatChartValue(value)
          }
        }
      : {
          type: "category",
          data: categoryValues,
          axisLine: {
            lineStyle: {
              color: axisLineColor
            }
          },
          axisLabel: {
            color: axisLabelColor,
            interval: 0,
            rotate: 25
          }
        },
    yAxis: isHorizontal
      ? {
          type: "category",
          data: categoryValues,
          inverse: shouldInvertCategoryAxis,
          axisLine: {
            lineStyle: {
              color: axisLineColor
            }
          },
          axisLabel: {
            color: axisLabelColor,
            width: 220,
            overflow: "break",
            formatter: (value: string) => formatCategoryLabel(value)
          }
        }
      : {
          type: "value",
          splitLine: {
            lineStyle: {
              color: "rgba(211, 219, 230, 0.58)"
            }
          },
          axisLine: {
            lineStyle: {
              color: axisLineColor
            }
          },
          axisLabel: {
            color: axisLabelColor,
            formatter: (value: number) => formatChartValue(value)
          }
        },
    grid: {
      left: isHorizontal ? 220 : 56,
      right: isHorizontal ? 64 : 20,
      top: 20,
      bottom: isHorizontal ? 30 : 80,
      containLabel: true
    },
    series: [
      {
        name: seriesName,
        type: "bar",
        data: numericValues,
        itemStyle: {
          color: primarySeriesColor,
          borderRadius: isHorizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]
        },
        barMaxWidth: isHorizontal ? 28 : 42,
        label: {
          show: true,
          position: isHorizontal ? "right" : "top",
          color: axisLabelColor,
          formatter: createSeriesLabelFormatter()
        }
      }
    ]
  };
}

export function buildLineChartOptions<T extends Record<string, string | number>>(
  data: T[],
  categoryKey: keyof T,
  primaryValueKey: keyof T,
  primarySeriesName: string,
  additionalSeries: NamedSeries[] = []
): EChartsOption {
  const lineSeries: LineSeriesOption[] = [
    {
      name: primarySeriesName,
      type: "line",
      smooth: true,
      data: data.map((item) => Number(item[primaryValueKey])),
      lineStyle: {
        width: 3,
        color: primarySeriesColor
      },
      itemStyle: {
        color: primarySeriesColor
      },
      label: {
        show: true,
        position: "top",
        color: axisLabelColor,
        formatter: createSeriesLabelFormatter()
      },
      areaStyle: {
        color: "rgba(92, 111, 142, 0.12)"
      }
    },
    ...additionalSeries.map<LineSeriesOption>((series) => ({
      name: series.name,
      type: "line",
      smooth: true,
      data: data.map((item) => Number(item[series.key])),
      lineStyle: {
        width: 2
      },
      itemStyle: {
        color: "#118DFF"
      },
      label: {
        show: true,
        position: "top",
        color: axisLabelColor,
        formatter: createSeriesLabelFormatter()
      }
    }))
  ];

  return {
    color: chartPalette,
    tooltip: {
      trigger: "axis"
    },
    legend: {
      top: 0,
      textStyle: {
        color: axisLabelColor
      }
    },
    xAxis: {
      type: "category",
      data: data.map((item) => String(item[categoryKey])),
      axisLine: {
        lineStyle: {
          color: axisLineColor
        }
      },
      axisLabel: {
        color: axisLabelColor
      }
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: {
          color: "rgba(211, 219, 230, 0.58)"
        }
      },
      axisLine: {
        lineStyle: {
          color: axisLineColor
        }
      },
      axisLabel: {
        color: axisLabelColor,
        formatter: (value: number) => formatChartValue(value)
      }
    },
    grid: {
      left: 56,
      right: 20,
      top: 50,
      bottom: 40,
      containLabel: true
    },
    series: lineSeries
  };
}

export function buildDonutChartOptions<T extends Record<string, string | number>>(
  data: T[],
  labelKey: keyof T,
  valueKey: keyof T
): EChartsOption {
  return {
    color: chartPalette,
    tooltip: {
      trigger: "item"
    },
    legend: {
      orient: "vertical",
      right: 0,
      top: "middle",
      textStyle: {
        color: axisLabelColor
      }
    },
    series: [
      {
        type: "pie",
        radius: ["60%", "84%"],
        center: ["38%", "50%"],
        avoidLabelOverlap: false,
        label: {
          show: true,
          color: axisLabelColor,
          formatter: createSeriesLabelFormatter()
        },
        data: data.map((item) => ({
          name: String(item[labelKey]),
          value: Number(item[valueKey])
        }))
      }
    ]
  };
}

export function buildGroupedBarChartOptions<T extends Record<string, string | number>>(
  data: T[],
  categoryKey: keyof T,
  seriesDefinitions: Array<{
    key: keyof T;
    name: string;
    color: string;
  }>,
  orientation: "vertical" | "horizontal" = "vertical",
  invertCategoryAxis?: boolean
): EChartsOption {
  const safeData = data ?? [];
  const isHorizontal = orientation === "horizontal";
  const categoryValues = safeData.map((item) => String(item[categoryKey]));
  const shouldInvertCategoryAxis = invertCategoryAxis ?? isHorizontal;

  return {
    color: chartPalette,
    tooltip: {
      trigger: "axis"
    },
    legend: {
      top: 0,
      textStyle: {
        color: axisLabelColor
      }
    },
    xAxis: isHorizontal
      ? {
          type: "value",
          splitLine: {
            lineStyle: {
              color: "rgba(211, 219, 230, 0.58)"
            }
          },
          axisLine: {
            lineStyle: {
              color: axisLineColor
            }
          },
          axisLabel: {
            color: axisLabelColor,
            formatter: (value: number) => formatChartValue(value)
          }
        }
      : {
          type: "category",
          data: categoryValues,
          axisLine: {
            lineStyle: {
              color: axisLineColor
            }
          },
          axisLabel: {
            color: axisLabelColor
          }
        },
    yAxis: isHorizontal
      ? {
          type: "category",
          data: categoryValues,
          inverse: shouldInvertCategoryAxis,
          axisLine: {
            lineStyle: {
              color: axisLineColor
            }
          },
          axisLabel: {
            color: axisLabelColor,
            width: 220,
            overflow: "break"
          }
        }
      : {
          type: "value",
          splitLine: {
            lineStyle: {
              color: "rgba(211, 219, 230, 0.58)"
            }
          },
          axisLine: {
            lineStyle: {
              color: axisLineColor
            }
          },
          axisLabel: {
            color: axisLabelColor,
            formatter: (value: number) => formatChartValue(value)
          }
        },
    grid: {
      left: isHorizontal ? 220 : 56,
      right: isHorizontal ? 64 : 20,
      top: 50,
      bottom: isHorizontal ? 30 : 40,
      containLabel: true
    },
    series: seriesDefinitions.map((seriesDefinition) => ({
      name: seriesDefinition.name,
      type: "bar" as const,
      data: safeData.map((item) => Number(item[seriesDefinition.key])),
      itemStyle: {
        color: seriesDefinition.color,
        borderRadius: isHorizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]
      },
      label: {
        show: true,
        position: isHorizontal ? "right" : "top",
        color: axisLabelColor,
        formatter: createSeriesLabelFormatter()
      }
    }))
  };
}

export function buildScatterChartOptions(data: ScatterChartDatum[]): EChartsOption {
  const scatterSeries: ScatterSeriesOption = {
    type: "scatter",
    symbolSize: 16,
    itemStyle: {
      color: primarySeriesColor
    },
    data: data.map((item) => [item.users, item.events, item.name])
  };

  return {
    color: chartPalette,
    tooltip: {
      trigger: "item",
      formatter: (parameters) => {
        const tooltipParameters = Array.isArray(parameters) ? parameters[0] : parameters;
        const scatterData = Array.isArray(tooltipParameters?.data) ? tooltipParameters.data : [];
        const users = Number(scatterData[0] ?? 0);
        const resourceAccesses = Number(scatterData[1] ?? 0);
        const name = String(scatterData[2] ?? "");
        return `${name}<br/>Usuarios únicos: ${formatChartValue(users)}<br/>Accesos URL: ${formatChartValue(resourceAccesses)}`;
      }
    },
    xAxis: {
      type: "value",
      name: "Usuarios únicos",
      nameLocation: "middle",
      nameGap: 34,
      nameTextStyle: {
        color: axisLabelColor
      },
      splitLine: {
        lineStyle: {
          color: "rgba(211, 219, 230, 0.58)"
        }
      },
      axisLine: {
        lineStyle: {
          color: axisLineColor
        }
      },
      axisLabel: {
        color: axisLabelColor,
        formatter: (value: number) => formatChartValue(value)
      }
    },
    yAxis: {
      type: "value",
      name: "Accesos URL",
      nameLocation: "middle",
      nameGap: 52,
      nameTextStyle: {
        color: axisLabelColor
      },
      splitLine: {
        lineStyle: {
          color: "rgba(211, 219, 230, 0.58)"
        }
      },
      axisLine: {
        lineStyle: {
          color: axisLineColor
        }
      },
      axisLabel: {
        color: axisLabelColor,
        formatter: (value: number) => formatChartValue(value)
      }
    },
    grid: {
      left: 72,
      right: 32,
      top: 36,
      bottom: 72,
      containLabel: true
    },
    series: [scatterSeries]
  };
}
