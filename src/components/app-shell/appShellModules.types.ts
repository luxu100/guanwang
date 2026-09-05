import type { Component } from "vue";
import type { LocalizedModuleKey } from "@/i18n/moduleLocales";
import BurstIdentification from "@/pages/leak-burst/burst-identification/burst-identification.vue";
import MeasurementAnalysis from "@/pages/leak-burst/measurement-analysis/measurement-analysis.vue";
import LossReport from "@/pages/leak-burst/loss-report/loss-report.vue";

export interface AppShellModuleViews {
  AlarmProcessingView: Component;
  AlarmStrategyView: Component;
  CommandConfigurationView: Component;
  CommandManageView: Component;
  DataAnalysisSheetView: Component;
  DataReceiveView: Component;
  DeviceManagementView: Component;
  DeviceParameterView: Component;
  HistoryOverviewView: Component;
  LeakAnalysisView: Component;
  LeakManagementView: Component;
  PartitionManagementView: Component;
  SearchTemplateView: Component;
  SuspectManagementView: Component;
  SuspectTableView: Component;
  SystemManagementView: Component;
  ValveView: Component;
  WorkOrderCreateView: Component;
  WorksheetTableView: Component;
  BurstIdentificationView: Component;
  MeasurementAnalysisView: Component;
  LossReportView: Component;
}

export interface AppShellModules {
  localized: boolean;
  views: AppShellModuleViews;
}

export function getAppShellModuleKey(path: string): LocalizedModuleKey | undefined {
  if (path.startsWith("/pages/partition/")) return "partition";
  if (path.startsWith("/pages/command/")) return "command";
  if (path.startsWith("/pages/data-analysis/")) return "dataAnalysis";
  if (path.startsWith("/pages/work-order/")) return "workOrder";
  if (path.startsWith("/pages/alarm/")) return "alarm";
  if (path.startsWith("/pages/leak-report/")) return "leakReport";
  if (path.startsWith("/pages/system/")) return "system";
  if (path.startsWith("/pages/data-receive/")) return "dataReceive";
  return undefined;
}
