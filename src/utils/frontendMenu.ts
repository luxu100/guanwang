export interface FrontendMenuItem {
  labelKey: string;
  path: string;
  icon: string;
  keywords: string[];
  permissionCode: string;
  children?: FrontendMenuItem[];
}

type PermissionResource = {
  id: string;
  permissionName: string;
  permissionCode: string;
  path: string;
  parentId: string | number;
  permissionType: number;
  status: number;
  children?: PermissionResource[];
};

// Keep existing permission codes stable so role assignments survive route updates.
export const frontendMenuItems: FrontendMenuItem[] = [
  {
    "labelKey": "favorite",
    "path": "/pages/index/index",
    "icon": "star",
    "keywords": [
      "首页",
      "收藏"
    ],
    "permissionCode": "page:favorite"
  },
  {
    "labelKey": "oneMap",
    "path": "/pages/one-map/one-map",
    "icon": "trend",
    "keywords": [
      "一张图",
      "在线监测",
      "总览"
    ],
    "permissionCode": "page:one-map"
  },
  {
    "labelKey": "leakMonitor",
    "path": "/pages/leak-monitor/leak-monitor",
    "icon": "monitor",
    "keywords": [
      "渗漏",
      "监测"
    ],
    "permissionCode": "page:leak-monitor"
  },
  {
    "labelKey": "waterHammer",
    "path": "/pages/water-hammer/water-hammer",
    "icon": "chart",
    "permissionCode": "page:water-hammer",
    "keywords": [
      "水锤",
      "波形",
      "阀门",
      "模拟"
    ]
  },
  {
    "labelKey": "partition",
    "path": "/pages/partition/partition",
    "icon": "partition",
    "keywords": [
      "分区",
      "部门",
      "管理"
    ],
    "permissionCode": "page:partition"
  },
  {
    "labelKey": "device",
    "path": "/pages/device/info/info",
    "icon": "device",
    "keywords": [
      "设备"
    ],
    "children": [
      {
        "labelKey": "deviceInfo",
        "path": "/pages/device/info/info",
        "icon": "device",
        "keywords": [
          "设备",
          "信息"
        ],
        "permissionCode": "page:device:info"
      },
      {
        "labelKey": "deviceMaintenance",
        "path": "/pages/device/maintenance/maintenance",
        "icon": "device",
        "keywords": [
          "拆装",
          "维护"
        ],
        "permissionCode": "page:device:maintenance"
      },
      {
        "labelKey": "deviceProtocol",
        "path": "/pages/device/protocol/protocol",
        "icon": "device",
        "keywords": [
          "协议"
        ],
        "permissionCode": "page:device:protocol"
      },
      {
        "labelKey": "deviceParameter",
        "path": "/pages/device/parameter/parameter",
        "icon": "device",
        "keywords": [
          "参数"
        ],
        "permissionCode": "page:device:settings"
      },
      {
        "labelKey": "deviceValve",
        "path": "/pages/device/valve/valve",
        "icon": "device",
        "keywords": [
          "阀门"
        ],
        "permissionCode": "page:device:valve"
      }
    ],
    "permissionCode": "module:device"
  },
  {
    "labelKey": "command",
    "path": "/pages/command/commandManage",
    "icon": "device",
    "permissionCode": "module:command",
    "keywords": [
      "指令"
    ],
    "children": [
      {
        "labelKey": "commandManage",
        "path": "/pages/command/commandManage",
        "icon": "device",
        "permissionCode": "page:command:manage",
        "keywords": [
          "指令",
          "管理"
        ]
      },
      {
        "labelKey": "commandConfiguration",
        "path": "/pages/command/commandConfiguration",
        "icon": "device",
        "permissionCode": "page:command:configuration",
        "keywords": [
          "指令",
          "配置"
        ]
      }
    ]
  },
  {
    "labelKey": "statistics",
    "path": "/pages/statistics/statistics",
    "icon": "trend",
    "keywords": [
      "统计"
    ],
    "children": [
      {
        "labelKey": "statisticsLeakOverview",
        "path": "/pages/leak-report/history-overview/history-overview",
        "icon": "report",
        "keywords": [
          "历史"
        ],
        "permissionCode": "page:leak-report:history-overview"
      },
      {
        "labelKey": "statisticsDataOverview",
        "path": "/pages/data-analysis/overview/overview",
        "icon": "chart",
        "keywords": [
          "系统",
          "总览"
        ],
        "permissionCode": "page:data-analysis:overview"
      }
    ],
    "permissionCode": "page:statistics"
  },
  {
    "labelKey": "dataAnalysis",
    "path": "/pages/data-analysis/overview/overview",
    "icon": "chart",
    "keywords": [
      "分析",
      "数据"
    ],
    "children": [
      {
        "labelKey": "dataAnalysisAudio",
        "path": "/pages/data-analysis/audio/audio",
        "icon": "chart",
        "keywords": [
          "音频"
        ],
        "permissionCode": "page:data-analysis:audio"
      },
      {
        "labelKey": "dataAnalysisLeakage",
        "path": "/pages/data-analysis/leakage/leakage",
        "icon": "chart",
        "keywords": [
          "渗漏"
        ],
        "permissionCode": "page:data-analysis:leakage"
      }
    ],
    "permissionCode": "module:data-analysis"
  },
  {
    "labelKey": "leakReport",
    "path": "/pages/leak-report/suspect-management/suspect-management",
    "icon": "report",
    "keywords": [
      "疑漏点",
      "上报",
      "疑点",
      "漏点"
    ],
    "children": [
      {
        "labelKey": "suspectManagement",
        "path": "/pages/leak-report/suspect-management/suspect-management",
        "icon": "report",
        "keywords": [
          "疑点"
        ],
        "permissionCode": "page:leak-report:suspect-management"
      },
      {
        "labelKey": "suspectProcessing",
        "path": "/pages/leak-report/suspect-processing/suspect-processing",
        "icon": "report",
        "keywords": [
          "处理"
        ],
        "permissionCode": "page:leak-report:suspect-processing"
      },
      {
        "labelKey": "leakManagement",
        "path": "/pages/leak-report/leak-management/leak-management",
        "icon": "report",
        "keywords": [
          "漏点"
        ],
        "permissionCode": "page:leak-report:leak-management"
      },
      {
        "labelKey": "leakAnalysis",
        "path": "/pages/leak-report/leak-analysis/leak-analysis",
        "icon": "report",
        "keywords": [
          "分析"
        ],
        "permissionCode": "page:leak-report:leak-analysis"
      }
    ],
    "permissionCode": "module:leak-report"
  },
  {
    "labelKey": "workOrder",
    "path": "/pages/work-order/create/create",
    "icon": "order",
    "keywords": [
      "工单"
    ],
    "children": [
      {
        "labelKey": "workOrderCreate",
        "path": "/pages/work-order/create/create",
        "icon": "order",
        "keywords": [
          "创建"
        ],
        "permissionCode": "page:work-order:create"
      },
      {
        "labelKey": "workOrderProcessing",
        "path": "/pages/work-order/processing/processing",
        "icon": "order",
        "keywords": [
          "处理"
        ],
        "permissionCode": "page:work-order:processing"
      }
    ],
    "permissionCode": "module:work-order"
  },
  {
    "labelKey": "report",
    "path": "/pages/report/device-resume/device-resume",
    "icon": "report",
    "keywords": [
      "运维",
      "报表"
    ],
    "children": [
      {
        "labelKey": "reportDeviceResume",
        "path": "/pages/report/device-resume/device-resume",
        "icon": "report",
        "keywords": [
          "设备",
          "履历"
        ],
        "permissionCode": "page:report:device-resume"
      },
      {
        "labelKey": "reportDeviceLedger",
        "path": "/pages/report/device-ledger/device-ledger",
        "icon": "report",
        "keywords": [
          "设备",
          "台账"
        ],
        "permissionCode": "page:report:device-ledger"
      },
      {
        "labelKey": "reportBatteryHealth",
        "path": "/pages/report/battery-health/battery-health",
        "icon": "report",
        "keywords": [
          "电池",
          "健康"
        ],
        "permissionCode": "page:report:battery-health"
      },
      {
        "labelKey": "reportOperationAnalysis",
        "path": "/pages/report/operation-analysis/operation-analysis",
        "icon": "report",
        "keywords": [
          "运行",
          "分析"
        ],
        "permissionCode": "page:report:operation-analysis"
      }
    ],
    "permissionCode": "module:report"
  },
  {
    "labelKey": "leakBurst",
    "path": "/pages/leak-burst/burst-identification/burst-identification",
    "icon": "report",
    "keywords": [
      "渗漏",
      "爆管"
    ],
    "children": [
      {
        "labelKey": "burstIdentification",
        "path": "/pages/leak-burst/burst-identification/burst-identification",
        "icon": "report",
        "keywords": [
          "爆管",
          "识别"
        ],
        "permissionCode": "page:leak-burst:identification"
      },
      {
        "labelKey": "measurementAnalysis",
        "path": "/pages/leak-burst/measurement-analysis/measurement-analysis",
        "icon": "report",
        "keywords": [
          "测点",
          "分析"
        ],
        "permissionCode": "page:leak-burst:measurement-analysis"
      },
      {
        "labelKey": "leakLocation",
        "path": "/pages/leak-burst/leak-location/leak-location",
        "icon": "report",
        "keywords": [
          "漏点",
          "定位",
          "双设备"
        ],
        "permissionCode": "page:leak-burst:leak-location"
      },
      {
        "labelKey": "lossReport",
        "path": "/pages/leak-burst/loss-report/loss-report",
        "icon": "report",
        "keywords": [
          "漏损",
          "报表"
        ],
        "permissionCode": "page:leak-burst:loss-report"
      }
    ],
    "permissionCode": "module:leak-burst"
  },
  {
    "labelKey": "alarm",
    "path": "/pages/alarm/strategy/strategy",
    "icon": "alarm",
    "keywords": [
      "告警",
      "报警"
    ],
    "children": [
      {
        "labelKey": "alarmStrategy",
        "path": "/pages/alarm/strategy/strategy",
        "icon": "alarm",
        "keywords": [
          "策略"
        ],
        "permissionCode": "page:alarm:strategy"
      },
      {
        "labelKey": "alarmProcessing",
        "path": "/pages/alarm/processing/processing",
        "icon": "alarm",
        "keywords": [
          "处理"
        ],
        "permissionCode": "page:alarm:processing"
      }
    ],
    "permissionCode": "module:alarm"
  },
  {
    "labelKey": "system",
    "path": "/pages/system/user/user",
    "icon": "setting",
    "keywords": [
      "设置",
      "用户"
    ],
    "children": [
      {
        "labelKey": "systemUser",
        "path": "/pages/system/user/user",
        "icon": "setting",
        "keywords": [
          "用户"
        ],
        "permissionCode": "page:system:user"
      },
      {
        "labelKey": "systemAuth",
        "path": "/pages/system/auth/auth",
        "icon": "setting",
        "keywords": [
          "权限"
        ],
        "permissionCode": "page:system:auth"
      },
      {
        "labelKey": "systemMenu",
        "path": "/pages/system/menu/menu",
        "icon": "setting",
        "keywords": [
          "菜单"
        ],
        "permissionCode": "page:system:menu"
      },
      {
        "labelKey": "systemDict",
        "path": "/pages/system/dict/dict",
        "icon": "setting",
        "keywords": [
          "字典"
        ],
        "permissionCode": "page:system:dict"
      },
      {
        "labelKey": "systemSearch",
        "path": "/pages/system/search/search",
        "icon": "setting",
        "keywords": [
          "模板"
        ],
        "permissionCode": "page:system:search"
      }
    ],
    "permissionCode": "module:system"
  },
  {
    "labelKey": "dataReceive",
    "path": "/pages/data-receive/access/access",
    "icon": "command",
    "keywords": [
      "数据接收",
      "解析",
      "接入"
    ],
    "permissionCode": "module:data-receive",
    "children": [
      {
        "labelKey": "dataReceiveProtocol",
        "path": "/pages/data-receive/access/access",
        "icon": "command",
        "permissionCode": "page:data-receive:protocol",
        "keywords": [
          "协议",
          "接入",
          "定义",
          "绑定"
        ]
      },
      {
        "labelKey": "dataReceiveParse",
        "path": "/pages/data-receive/parse/parse",
        "icon": "command",
        "permissionCode": "page:data-receive:parse",
        "keywords": [
          "解析"
        ]
      },
      {
        "labelKey": "dataReceiveRecord",
        "path": "/pages/data-receive/record/record",
        "icon": "command",
        "permissionCode": "page:data-receive:record",
        "keywords": [
          "记录"
        ]
      }
    ]
  }
];

export function createDefaultMenuTree(labels: Record<string, string>): PermissionResource[] {
  const build = (items: FrontendMenuItem[], parentId: string | number): PermissionResource[] => items.map(item => {
    const id = 'local-menu:' + item.permissionCode;
    return {
      id,
      permissionName: labels[item.labelKey] || item.labelKey,
      permissionCode: item.permissionCode,
      path: item.path,
      parentId,
      permissionType: 1,
      status: 1,
      ...(item.children ? { children: build(item.children, id) } : {}),
    };
  });
  return build(frontendMenuItems, 0);
}

const menuDefinitions = new Map<string, { menu: FrontendMenuItem; parentCode: string }>();
function collectMenuDefinitions(items: FrontendMenuItem[], parentCode = "") {
  for (const menu of items) {
    menuDefinitions.set(menu.permissionCode, { menu, parentCode });
    if (menu.children) collectMenuDefinitions(menu.children, menu.permissionCode);
  }
}
collectMenuDefinitions(frontendMenuItems);
export function getFrontendMenuByCode(code: string) {
  return menuDefinitions.get(code)?.menu;
}
const menuOrder = new Map([...menuDefinitions.keys()].map((code, index) => [code, index]));

type BackendMenu = { [key: string]: unknown };

export function sortFrontendMenuResources<T extends BackendMenu>(records: T[]): T[] {
  return [...records].sort((a, b) => (menuOrder.get(String(a.permissionCode ?? a.code)) ?? Number.MAX_SAFE_INTEGER)
    - (menuOrder.get(String(b.permissionCode ?? b.code)) ?? Number.MAX_SAFE_INTEGER));
}

export function getFrontendMenuAlignment(records: BackendMenu[]) {
  const byCode = new Map(records.map(item => [String(item.permissionCode ?? item.code ?? ""), item]));
  const byId = new Map(records.map(item => [String(item.id), item]));
  const missing = [...menuDefinitions].filter(([code]) => !byCode.has(code)).map(([, value]) => value.menu);
  const outdated = records.filter(item => {
    const definition = menuDefinitions.get(String(item.permissionCode ?? item.code));
    if (!definition) return false;
    const parent = byId.get(String(item.parentId));
    const parentCode = parent ? String(parent.permissionCode ?? parent.code ?? "") : "";
    return item.path !== definition.menu.path || parentCode !== definition.parentCode;
  });
  const unmatched = records.filter(item => Number(item.permissionType ?? 1) === 1
    && !menuDefinitions.has(String(item.permissionCode ?? item.code)));
  return { missing, outdated, unmatched };
}
