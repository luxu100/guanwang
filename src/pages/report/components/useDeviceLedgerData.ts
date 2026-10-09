import { ref } from 'vue';
import {
  getDeviceLedgerPage,
  getDeviceLedgerDetail,
  getDeviceLedgerInstallDetail,
  getDeviceLedgerRelationInfo,
  getDeviceLedgerValveDetail,
  getDeviceMaintenancePage,
} from '@/services/report/device-resume';
import type { DeviceId, DeviceLedgerItem, DeviceLedgerQuery } from '@/services/report/device-resume';

export interface LedgerLifecycleRecord {
  id: DeviceId;
  eventName: string;
  eventTime: string;
  operatorName?: string;
  beforeStatus?: string;
  afterStatus?: string;
  address?: string;
  description?: string;
}

export interface LedgerPartition {
  id?: DeviceId;
  deptName: string;
  deptAdministrator: string;
  description: string;
}

export interface LedgerDevice {
  id: DeviceId;
  number: string;
  details: Record<string, string | number | undefined>;
  area: string;
  partitions: LedgerPartition[];
  online: boolean | null;
  lifecycle: number[];
  lifecycleRecords: LedgerLifecycleRecord[];
  changes: { time: string; operator: string; field: string; before: string; after: string; type: string; isMock?: boolean }[];
}

type DataObject = Record<string, unknown>;

function unwrap<T>(response: { code?: number; msg?: string; data?: T }): T {
  if (response.code !== undefined && response.code !== 0 && response.code !== 200) {
    throw new Error(response.msg || '查询失败');
  }
  if (response.data == null) throw new Error('接口未返回数据');
  return response.data;
}

export function formatLedgerField(
  key: string,
  value: string | number | undefined,
  translate: (zh: string, en: string) => string,
): string {
  if (value === undefined || value === '') return '--';
  const options: Record<string, Record<string, [string, string]>> = {
    enableState: { '0': ['禁用', 'Disabled'], '1': ['启用', 'Enabled'] },
    onlineStatus: { '0': ['离线', 'Offline'], '1': ['在线', 'Online'] },
    leakStatus: { '0': ['渗漏', 'Leak'], '1': ['正常', 'Normal'], '2': ['疑似', 'Suspected'], '3': ['未知', 'Unknown'] },
    installState: { '0': ['未安装', 'Not Installed'], '1': ['已安装', 'Installed'] },
    installMode: { '0': ['固定点', 'Fixed'], '1': ['流动点', 'Mobile'] },
  };
  const label = options[key]?.[String(value)];
  return label ? translate(...label) : String(value);
}

function asObject(value: unknown): DataObject {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as DataObject : {};
}

function asText(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function firstText(...values: unknown[]): string {
  return values.map(asText).find(Boolean) || '';
}

function putFields(target: LedgerDevice['details'], source: DataObject) {
  for (const key of [
    'deviceNumber', 'deviceAlias', 'deviceType', 'nbNumber', 'hardwareVersion',
    'softwareVersion', 'algorithmType', 'algorithmVersion', 'pressureSensorModel',
    'pressureSensorSerialNumber', 'enableState', 'onlineStatus', 'leakStatus',
    'lastSamplingTime', 'installState', 'installMode', 'installAddress',
    'installLongitude', 'installLatitude', 'wifiName', 'wifiMac', 'serverIp',
    'serverPort', 'tcpSessionId', 'tcpLastSeenAt', 'aepProtocol', 'productName',
    'productCode', 'protocolVersion', 'tubeName', 'tubeMaterial', 'tubeBore',
    'tubeNumber', 'tubeAdministrator', 'valveNumber', 'valveName', 'deptName',
    'deptAdministrator', 'description',
  ]) {
    const value = source[key];
    if (typeof value === 'string' || typeof value === 'number') target[key] = value;
  }
  if (source.pressureSensorSerial != null) target.pressureSensorSerialNumber = asText(source.pressureSensorSerial);
  if (source.administrator != null) target.tubeAdministrator = asText(source.administrator);
}

function mapDevice(row: DeviceLedgerItem, areaById: Map<string, string>): LedgerDevice {
  const source = row as DataObject;
  const details: LedgerDevice['details'] = {};
  putFields(details, source);
  const area = firstText(
    source.deptNames, source.regionNames, source.deptName, source.regionName,
    areaById.get(asText(source.deptId)), areaById.get(asText(source.regionId)),
  );
  if (area) details.deptName = area;
  return {
    id: row.id,
    number: row.deviceNumber,
    details,
    area,
    partitions: [],
    online: source.onlineStatus === 1 ? true : source.onlineStatus === 0 ? false : null,
    lifecycle: [],
    lifecycleRecords: [],
    changes: [
      {
        time: '2026-09-18 14:35',
        operator: '示例操作员',
        field: '所属分区',
        before: '示例分区 A',
        after: '示例分区 B',
        type: '分区变更',
        isMock: true,
      },
      {
        time: '2026-09-12 10:20',
        operator: '示例操作员',
        field: '安装地址',
        before: '原安装地址（示例）',
        after: '新安装地址（示例）',
        type: '拆装信息变更',
        isMock: true,
      },
      {
        time: '2026-09-05 09:10',
        operator: '示例操作员',
        field: '设备别名',
        before: '原别名（示例）',
        after: '新别名（示例）',
        type: '基础信息变更',
        isMock: true,
      },
      {
        time: '2026-08-28 16:45',
        operator: '示例操作员',
        field: '启用状态',
        before: '停用（示例）',
        after: '启用（示例）',
        type: '状态信息变更',
        isMock: true,
      },
    ],
  };
}

export function useDeviceLedgerData() {
  const devices = ref<LedgerDevice[]>([]);
  const loading = ref(false);
  const listError = ref('');
  const detailLoading = ref(false);
  const detailError = ref('');
  let listRequest = 0;
  let detailRequest = 0;
  let disposed = false;

  function dispose() {
    disposed = true;
    ++listRequest;
    ++detailRequest;
  }

  async function loadDeviceDetails(device: LedgerDevice) {
    const request = ++detailRequest;
    detailLoading.value = true;
    detailError.value = '';
    try {
      const results = await Promise.allSettled([
        getDeviceLedgerDetail(device.id),
        getDeviceLedgerInstallDetail(device.id),
        getDeviceLedgerRelationInfo(device.id),
      ]);
      if (disposed || request !== detailRequest) return;
      if (results[0].status === 'rejected') throw results[0].reason;
      const primary = asObject(unwrap(results[0].value));
      const optionalData = (result: PromiseSettledResult<{ code?: number; msg?: string; data?: unknown }>): DataObject => {
        if (result.status !== 'fulfilled') return {};
        try { return asObject(unwrap(result.value)); } catch { return {}; }
      };
      const install = optionalData(results[1]);
      const relation = optionalData(results[2]);
      const product = asObject(relation.product);
      const tube = asObject(relation.tube);
      const departments = Array.isArray(relation.depts) ? relation.depts : [];
      const partitions: LedgerPartition[] = departments.map(entry => {
        const department = asObject(entry);
        const id = department.id;
        return {
          id: typeof id === 'string' || typeof id === 'number' ? id : undefined,
          deptName: asText(department.deptName ?? department.regionName ?? department.name),
          deptAdministrator: asText(department.administrator),
          description: asText(department.description),
        };
      }).filter(partition => partition.id != null || partition.deptName);
      const details = { ...device.details };
      for (const source of [primary, install, product, tube]) putFields(details, source);
      const valveId = primary.valveId ?? install.valveId;
      if (valveId != null && valveId !== '') {
        try {
          const valve = asObject(unwrap(await getDeviceLedgerValveDetail(valveId as DeviceId)));
          if (disposed || request !== detailRequest) return;
          putFields(details, valve);
        } catch {
          // A missing valve detail must not hide the device record.
        }
      }
      const area = partitions.map(partition => partition.deptName).filter(Boolean).join('、')
        || firstText(details.deptName, primary.deptNames, primary.regionNames, device.area);
      if (area) details.deptName = area;
      if (partitions.length === 1) {
        details.deptAdministrator = partitions[0].deptAdministrator;
        details.description = partitions[0].description;
      }
      const onlineStatus = details.onlineStatus;
      const updated: LedgerDevice = {
        ...device,
        details,
        area,
        partitions,
        online: onlineStatus === 1 ? true : onlineStatus === 0 ? false : null,
      };
      devices.value = devices.value.map(item => item.id === device.id ? updated : item);
      void loadLifecycle(updated, request);
    } catch (error) {
      if (!disposed && request === detailRequest) {
        detailError.value = error instanceof Error ? error.message : '设备详情加载失败';
      }
    } finally {
      if (!disposed && request === detailRequest) detailLoading.value = false;
    }
  }

  async function loadLifecycle(device: LedgerDevice, request: number) {
    const query = { deviceNumber: device.number, pageNum: 1, pageSize: 1 };
    const results = await Promise.allSettled([
      getDeviceMaintenancePage({ ...query, pageSize: 2, sortField: 'maintainTime', sortOrder: 'desc' }),
      ...[1, 0, 2, 3].map(maintainType => getDeviceMaintenancePage({ ...query, maintainType })),
    ]);
    if (disposed || request !== detailRequest) return;
    const pages = results.map(result => {
      if (result.status !== 'fulfilled') return null;
      try { return unwrap(result.value); } catch { return null; }
    });
    const latest = pages[0]?.records || [];
    const names: Record<number, string> = { 0: '拆卸', 1: '安装', 2: '维护', 3: '巡检' };
    const lifecycleRecords: LedgerLifecycleRecord[] = latest.map(record => ({
      id: record.id,
      eventName: record.maintainType == null ? '' : names[record.maintainType] || '',
      eventTime: record.maintainTime || record.createdAt || '',
      operatorName: record.maintainAccount,
      afterStatus: record.installState == null ? undefined : record.installState === 1 ? '已安装' : '未安装',
      address: record.maintainAddress,
      description: record.maintainFeedback || record.remark,
    }));
    const lifecycle = pages.slice(1).every(Boolean)
      ? pages.slice(1).map(page => page!.total ?? 0)
      : [];
    devices.value = devices.value.map(item => item.id === device.id
      ? { ...item, lifecycle, lifecycleRecords }
      : item);
  }

  async function loadDevices(filters: Pick<DeviceLedgerQuery, 'deviceNumber' | 'deptId'>, areaById: Map<string, string>) {
    const request = ++listRequest;
    ++detailRequest;
    loading.value = true;
    listError.value = '';
    detailError.value = '';
    devices.value = [];
    try {
      const pageSize = 200;
      const all: DeviceLedgerItem[] = [];
      let pageNum = 1;
      let total = Number.POSITIVE_INFINITY;
      while (all.length < total) {
        const result = unwrap(await getDeviceLedgerPage({ ...filters, pageNum, pageSize }));
        if (disposed || request !== listRequest) return;
        if (!Array.isArray(result.records)) throw new Error('设备列表格式不正确');
        all.push(...result.records);
        total = typeof result.total === 'number' ? result.total : all.length;
        if (!result.records.length) break;
        ++pageNum;
      }
      devices.value = all.filter(row => row && row.id != null && row.deviceNumber).map(row => mapDevice(row, areaById));
      if (devices.value[0]) void loadDeviceDetails(devices.value[0]);
    } catch (error) {
      if (!disposed && request === listRequest) {
        listError.value = error instanceof Error ? error.message : '设备列表加载失败';
      }
    } finally {
      if (!disposed && request === listRequest) loading.value = false;
    }
  }

  return { devices, loading, listError, detailLoading, detailError, loadDevices, loadDeviceDetails, dispose };
}
