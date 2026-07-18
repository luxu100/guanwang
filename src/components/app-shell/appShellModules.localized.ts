import CommandConfigurationView from "@/pages/command/localized/components/CommandConfigurationView.vue";
import CommandManageView from "@/pages/command/localized/components/CommandManageView.vue";
import DataAnalysisSheetView from "@/pages/data-analysis/localized/components/DataAnalysisSheetView.vue";
import DataReceiveView from "@/pages/data-receive/localized/components/DataReceiveView.vue";
import DeviceManagementView from "@/pages/device/components/DeviceManagementView.vue";
import DeviceParameterView from "@/pages/device/parameter/components/DeviceParameterView.vue";
import ValveView from "@/pages/device/valve/components/ValveView.vue";
import HistoryOverviewView from "@/pages/leak-report/localized/components/HistoryOverviewView.vue";
import LeakAnalysisView from "@/pages/leak-report/localized/components/LeakAnalysisView.vue";
import LeakManagementView from "@/pages/leak-report/localized/components/LeakManagementView.vue";
import SuspectManagementView from "@/pages/leak-report/localized/components/SuspectManagementView.vue";
import SuspectTableView from "@/pages/leak-report/localized/components/SuspectTableView.vue";
import PartitionManagementView from "@/pages/partition/localized/components/PartitionManagementView.vue";
import SearchTemplateView from "@/pages/system/localized/search/components/SearchTemplateView.vue";
import SystemManagementView from "@/pages/system/localized/components/SystemManagementView.vue";
import WorkOrderCreateView from "@/pages/work-order/localized/components/WorkOrderCreateView.vue";
import WorksheetTableView from "@/pages/work-order/localized/components/WorksheetTableView.vue";
import type { AppShellModules } from "./appShellModules.types";

const appShellModules = {
  localized: true,
  views: {
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
