import AlarmProcessingView from "@/pages/alarm/components/AlarmProcessingView.vue";
import AlarmStrategyView from "@/pages/alarm/components/AlarmStrategyView.vue";
import CommandConfigurationView from "@/pages/command/components/CommandConfigurationView.vue";
import CommandManageView from "@/pages/command/components/CommandManageView.vue";
import DataAnalysisSheetView from "@/pages/data-analysis/components/DataAnalysisSheetView.vue";
import DataReceiveView from "@/pages/data-receive/components/DataReceiveView.vue";
import DeviceManagementView from "@/pages/device/components/DeviceManagementView.vue";
import DeviceParameterView from "@/pages/device/parameter/components/DeviceParameterView.vue";
import ValveView from "@/pages/device/valve/components/ValveView.vue";
import HistoryOverviewView from "@/pages/leak-report/components/HistoryOverviewView.vue";
import LeakAnalysisView from "@/pages/leak-report/components/LeakAnalysisView.vue";
import LeakManagementView from "@/pages/leak-report/components/LeakManagementView.vue";
import SuspectManagementView from "@/pages/leak-report/components/SuspectManagementView.vue";
import SuspectTableView from "@/pages/leak-report/components/SuspectTableView.vue";
import PartitionManagementView from "@/pages/partition/components/PartitionManagementView.vue";
import SearchTemplateView from "@/pages/system/search/components/SearchTemplateView.vue";
import SystemManagementView from "@/pages/system/components/SystemManagementView.vue";
import WorkOrderCreateView from "@/pages/work-order/components/WorkOrderCreateView.vue";
import WorksheetTableView from "@/pages/work-order/components/WorksheetTableView.vue";
import type { AppShellModules } from "./appShellModules.types";

const appShellModules = {
  localized: false,
  views: {
    AlarmProcessingView,
    AlarmStrategyView,
    CommandConfigurationView,
    CommandManageView,
    DataAnalysisSheetView,
    DataReceiveView,
    DeviceManagementView,
    DeviceParameterView,
    HistoryOverviewView,
    LeakAnalysisView,
    LeakManagementView,
    PartitionManagementView,
    SearchTemplateView,
    SuspectManagementView,
    SuspectTableView,
    SystemManagementView,
    ValveView,
    WorkOrderCreateView,
    WorksheetTableView,
  },
} satisfies AppShellModules;

export default appShellModules;
