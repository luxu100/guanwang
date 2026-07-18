<template>
  <view v-if="visible" class="detail-panel__layout">
    <view class="detail-panel__tabs">
      <view
          v-for="tab in detailTabs"
          :key="tab.value"
          class="detail-panel__tab"
          :class="{ 'detail-panel__tab--active': activeTab===tab.value }"
          @click="activeTab=tab.value"
      >
        {{ tab.label }}
      </view>
    </view>

    <view class="detail-panel__body">
      <view v-if="!deviceData.id" class="detail-panel__empty">
        {{ ti('empty') }}
      </view>

      <view v-else>
          <view
              v-if="activeTab !== 'relation'"
              class="detail-panel__summary"
          >
            <view class="detail-panel__summary-main">
              <text class="detail-panel__summary-label">{{ ti('title') }}</text>
              <text class="detail-panel__summary-number">{{ deviceData.deviceNumber || '--' }}</text>
            </view>

            <view class="detail-panel__summary-badges">
              <text class="detail-panel__summary-badge detail-panel__tag detail-panel__tag--status" :class="statusClass">
                {{ getDeviceStatusLabel }}
              </text>
              <text class="detail-panel__summary-badge detail-panel__tag detail-panel__tag--level">
                {{ getDeviceTypeLabel }}
              </text>
            </view>
        </view>

        <view class="detail-panel__timeline">
          <view
              v-for="section in currentSections"
              :key="section.key"
              class="detail-panel__timeline-section"
              :class="{
                'detail-panel__timeline-section--flat': !section.title
              }"
          >
            <text class="detail-panel__timeline-title">{{ section.title }}</text>

            <view class="detail-panel__grid detail-panel__grid--base">
              <view
                  v-for="item in section.fields"
                  :key="item.key"
                  class="detail-panel__item detail-panel__item--base"
                  :class="{
                     'detail-panel__item--half': item.span==='half'
                   }"
              >
                <text class="detail-panel__item-label">{{ item.label }}</text>
                <text class="detail-panel__item-value">{{ item.value || '--' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Device, DeviceProduct, Dept, TubeNetwork } from '@/services/device/types';
import {
  getDeviceProductByIdT,
  getDeptByIdT,
  getTubeNetworkListT,
  getDeviceRelationInfoT
} from '@/services/device/info.typed';
import { createScopedT } from '@/i18n';
import { formatDate } from '@/utils/time';

const ti=createScopedT('devicePage.info');
const ts=createScopedT('devicePage.status');

const props = withDefaults(
    defineProps<{
      visible:boolean;
      deviceData:Partial<Device>;
    }>(),
    {
      visible:false,
      deviceData:()=>({})
    }
);

const emit=defineEmits<{
  (e:'update:visible',v:boolean):void;
  (e:'edit',data:Partial<Device>):void;
}>();

const activeTab=ref('base');

const detailTabs = computed(() => [
  {
    label: ti('tabs.base'),
    value: 'base'
  },
  {
    label: ti('tabs.status'),
    value: 'status'
  },
  {
    label: ti('tabs.install'),
    value: 'install'
  },
  {
    label: ti('tabs.communication'),
    value: 'communication'
  },
  {
    label: ti('tabs.relation'),
    value: 'relation'
  }
]);

const DICT_MAPS: Record<string, Record<string, string>> = {
  enableState: {
    '0': 'status.disabled',
    '1': 'status.enabled'
  },
  onlineStatus: {
    '0': 'online.offline',
    '1': 'online.online'
  },
  installState: {
    '0': 'install.uninstalled',
    '1': 'install.installed'
  },
  installMode: {
    '0': 'installMode.fixed',
    '1': 'installMode.mobile'
  },
  leakStatus: {
    '0': 'leak.leak',
    '1': 'leak.normal',
    '2': 'leak.suspected',
    '3': 'leak.unknown'
  },
  algorithmType: {
    'RN-3H': 'addSchema.option.algorithmType.Hydrophone',
    '': 'addSchema.option.algorithmType.NoiseMeter'
  }
};

interface FieldConfig{
  key:string;
  label:string;
  type:'text'|'dict'|'date';
  dict?:string;
  span?: 'full' | 'half';
}

interface SectionConfig{
  key:string;
  title:string;
  fields:FieldConfig[];
}


const detailTabConfig = computed<Record<string,SectionConfig[]>>(()=>({
  base:[
    {
      key:'base',
      title:'',
      fields:[
        {
          key:'deviceNumber',
          label:ti('fields.device.deviceNumber'),
          type:'text'
        },
        {
          key:'deviceAlias',
          label:ti('fields.device.deviceAlias'),
          type:'text'
        },
        {
          key:'deviceType',
          label:ti('fields.device.deviceType'),
          type:'text'
        },
        {
          key:'nbNumber',
          label:ti('fields.device.nbNumber'),
          type:'text'
        },
        {
          key:'deviceImei',
          label:ti('fields.device.deviceImei'),
          type:'text'
        },
        {
          key:'deviceImsi',
          label:ti('fields.device.deviceImsi'),
          type:'text'
        },
        {
          key:'serialNumber',
          label:ti('fields.device.serialNumber'),
          type:'text'
        },
        {
          key:'hardwareVersion',
          label:ti('fields.device.hardwareVersion'),
          type:'text'
        },
        {
          key:'softwareVersion',
          label:ti('fields.device.softwareVersion'),
          type:'text'
        },
        {
          key:'algorithmType',
          label:ti('fields.device.algorithmType'),
          type:'dict',
          dict:'algorithmType'
        },
        {
          key:'algorithmVersion',
          label:ti('fields.device.algorithmVersion'),
          type:'text'
        },
        {
          key: 'pressureSensorModel',
          label: ti('fields.device.pressureSensorModel'),
          type: 'text'
        },
        {
          key: 'pressureSensorSerialNumber',
          label: ti('fields.device.pressureSensorSerialNumber'),
          type: 'text'
        }
      ]
    }
  ],


  status:[
    {
      key:'status',
      title:'',
      fields:[
        {
          key:'enableState',
          label:ti('fields.device.enableState'),
          type:'dict',
          dict:'enableState'
        },
        {
          key:'onlineStatus',
          label:ti('fields.device.onlineStatus'),
          type:'dict',
          dict:'onlineStatus'
        },
        {
          key:'leakStatus',
          label:ti('fields.device.leakStatus'),
          type:'dict',
          dict:'leakStatus'
        },
        {
          key:'lastSamplingTime',
          label:ti('fields.device.lastSamplingTime'),
          type:'date'
        }
      ]
    }
  ],


  install:[
    {
      key:'install',
      title:'',
      fields:[
        {
          key:'installState',
          label:ti('fields.device.installState'),
          type:'dict',
          dict:'installState'
        },
        {
          key:'installMode',
          label:ti('fields.device.installMode'),
          type:'dict',
          dict:'installMode'
        },
        {
          key:'installAddress',
          label:ti('fields.device.installAddress'),
          type:'text'
        },
        {
          key:'installLongitude',
          label:ti('fields.device.installLongitude'),
          type:'text'
        },
        {
          key:'installLatitude',
          label:ti('fields.device.installLatitude'),
          type:'text'
        }
      ]
    }
  ],


  communication:[
    {
      key:'communication',
      title:'',
      fields:[
        {
          key:'wifiName',
          label:ti('fields.communication.wifiName'),
          type:'text'
        },
        {
          key:'wifiMac',
          label:ti('fields.communication.wifiMac'),
          type:'text'
        },
        {
          key:'serverIp',
          label:ti('fields.communication.serverIp'),
          type:'text'
        },
        {
          key:'serverPort',
          label:ti('fields.communication.serverPort'),
          type:'text'
        },
        {
          key:'tcpSessionId',
          label:ti('fields.communication.tcpSessionId'),
          type:'text'
        },
        {
          key:'tcpLastSeenAt',
          label:ti('fields.communication.tcpLastSeenAt'),
          type:'date'
        },
        {
          key:'aepProtocol',
          label:ti('fields.communication.aepProtocol'),
          type:'text'
        }
      ]
    }
  ],


  relation:relationSectionsConfig.value
}));

const relationSectionsConfig = computed<SectionConfig[]>(()=>[
  {
    key:'product',
    title:ti('section.product'),
    fields:[
      {key:'productName',label:ti('fields.product.productName'),type:'text'},
      {key:'productCode',label:ti('fields.product.productCode'),type:'text'},
      {key:'protocolVersion',label:ti('fields.product.protocolVersion'),type:'text'},
      {key:'aepProtocol',label:ti('fields.product.aepProtocol'),type:'text'}
    ]
  },
  {
    key:'tube',
    title:ti('section.tube'),
    fields:[
      {key:'tubeName',label:ti('fields.tube.tubeName'),type:'text'},
      {key:'tubeMaterial',label:ti('fields.tube.tubeMaterial'),type:'text'},
      {key:'tubeBore',label:ti('fields.tube.tubeBore'),type:'text'},
      {key:'tubeNumber',label:ti('fields.tube.tubeNumber'),type:'text'},
      {key:'administrator',label:ti('fields.tube.administrator'),type:'text'}
    ]
  },
  {
    key:'dept',
    title:ti('section.dept'),
    fields:[
      {key:'deptName',label:ti('fields.dept.deptName'),type:'text'},
      {key:'administrator',label:ti('fields.dept.administrator'),type:'text'},
      {key:'description',label:ti('fields.dept.description'),type:'text'}
    ]
  }
]);

function resolveValue(field:FieldConfig){
  let value:any;

  if(field.key==='productName') value=product.value?.productName;
  else if(field.key==='tubeName') value=tube.value?.tubeName;
  else if(field.key==='deptName') value=dept.value?.deptName;
  else value=props.deviceData[field.key as keyof Device];

  if(field.type==='date') return formatDate(value);

  if(field.type==='dict'&&field.dict){
    const key=DICT_MAPS[field.dict]?.[value as number];
    return key?ts(key):'--';
  }

  return value??'--';
}


function resolveSections(config:SectionConfig[]){
  return config.map(section=>({
    key:section.key,
    title:section.title,
    fields:section.fields.map(field=>({
      key:field.key,
      label:field.label,
      value:resolveValue(field),
      span:field.span || 'full'
    }))
  }));
}


const currentSections=computed(()=>{
  const sections =
      detailTabConfig.value[activeTab.value];
  if(!sections){
    return [];
  }
  return resolveSections(sections);
});


const getDeviceStatusLabel=computed(()=>{
  const s=props.deviceData.onlineStatus;
  return s===1?ts('online.online'):s===0?ts('online.offline'):ts('online.unknown');
});


const statusClass=computed(()=>{
  const s=props.deviceData.onlineStatus;
  return s===1?'detail-panel__tag--online':s===0?'detail-panel__tag--offline':'detail-panel__tag--unknown';
});


const getDeviceTypeLabel=computed(()=>props.deviceData.deviceType||'--');


watch(()=>props.deviceData.id,async id=>{
  if(!id)return;
  await loadRelationData(props.deviceData);
},{immediate:true});

const product=ref<DeviceProduct>();
const tube=ref<TubeNetwork>();
const dept=ref<Dept>();

async function loadRelationData(device: Partial<Device>) {
  if (!device.id) return;

  const res = await getDeviceRelationInfoT(device.id);

  product.value = res.data?.product;
  tube.value = res.data?.tube;
  dept.value = res.data?.dept;
}
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/dialog/styles/detail-panel.css";
</style>
