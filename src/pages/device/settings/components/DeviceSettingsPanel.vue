<template>
  <view v-if="visible" class="detail-panel">
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
      <view v-if="!settingData.deviceNumber" class="detail-panel__empty">
        {{ t('common.table.empt') }}
      </view>

      <view v-else>
        <view class="detail-panel__summary">
          <view class="detail-panel__summary-main">
            <text class="detail-panel__summary-label">
              {{ t('deviceSetting.settingInfo.title') }}
            </text>

            <text class="detail-panel__summary-number">
              {{ settingData.deviceNumber || '--' }}
            </text>
          </view>

          <view class="detail-panel__summary-badges">
            <text
                class="detail-panel__summary-badge detail-panel__tag"
                :class="settingData.enabledControl?'detail-panel__tag--online':'detail-panel__tag--offline'"
            >
              {{ settingData.enabledControl?t('deviceSetting.settingTable.enabled'):t('deviceSetting.settingTable.disabled') }}
            </text>

            <text class="detail-panel__summary-badge detail-panel__tag detail-panel__tag--level">
              {{ workModeLabel }}
            </text>
          </view>
        </view>

        <view class="detail-panel__timeline">
          <view
              v-for="section in currentSections"
              :key="section.key"
              class="detail-panel__timeline-section"
          >

            <view class="detail-panel__grid detail-panel__grid--base">
              <view
                  v-for="item in section.fields"
                  :key="item.key"
                  class="detail-panel__item detail-panel__item--base"
              >
                <text class="detail-panel__item-label">
                  {{ t(item.labelKey) }}
                </text>

                <text class="detail-panel__item-value">
                  {{ item.value || '--' }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
<script setup lang="ts">
import {computed,ref} from 'vue';
import type {DeviceSetting} from '@/services/device/types';
import {createScopedT} from '@/i18n';
import {formatDate} from '@/utils/time';

const t=createScopedT('devicePage');

interface Props{
  visible:boolean;
  settingData:Partial<DeviceSetting>;
}

const props=withDefaults(defineProps<Props>(),{
  visible:false,
  settingData:()=>({})
});

const emit=defineEmits<{
  (e:'update:visible',value:boolean):void;
  (e:'edit',data:Partial<DeviceSetting>):void;
}>();

const activeTab=ref('basic');


interface FieldConfig{
  key:keyof DeviceSetting;
  labelKey:string;
  type:'text'|'dict'|'date';
  dict?:string;
}

interface SectionConfig{
  key:string;
  title:string;
  fields:FieldConfig[];
}


const DICT_MAPS=computed<Record<string,Record<string|number,string>>>(()=>({
  enabledControl:{
    true:t('deviceSetting.settingInfo.dict.enabledControl.true'),
    false:t('deviceSetting.settingInfo.dict.enabledControl.false')
  },
  inspectionControl:{
    true:t('deviceSetting.settingInfo.dict.inspectionControl.true'),
    false:t('deviceSetting.settingInfo.dict.inspectionControl.false')
  },
  workMode:{
    0:t('deviceSetting.settingInfo.dict.workMode.0'),
    1:t('deviceSetting.settingInfo.dict.workMode.1'),
    2:t('deviceSetting.settingInfo.dict.workMode.2'),
    3:t('deviceSetting.settingInfo.dict.workMode.3')
  },
  filterMethod:{
    0:t('deviceSetting.settingInfo.dict.filterMethod.0'),
    1:t('deviceSetting.settingInfo.dict.filterMethod.1'),
    2:t('deviceSetting.settingInfo.dict.filterMethod.2'),
    3:t('deviceSetting.settingInfo.dict.filterMethod.3')
  },
  measureGainMode:{
    0:t('deviceSetting.settingInfo.dict.measureGainMode.0'),
    1:t('deviceSetting.settingInfo.dict.measureGainMode.1')
  },
  audioRule:{
    0:t('deviceSetting.settingInfo.dict.audioRule.0'),
    1:t('deviceSetting.settingInfo.dict.audioRule.1')
  },
  isDeleted:{
    true:t('deviceSetting.settingInfo.dict.isDeleted.true'),
    false:t('deviceSetting.settingInfo.dict.isDeleted.false')
  }
}));


const detailTabs=computed(()=>[
  {label:t('deviceSetting.settingInfo.tabs.basic'),value:'basic'},
  {label:t('deviceSetting.settingInfo.tabs.measure'),value:'measure'},
  {label:t('deviceSetting.settingInfo.tabs.filter'),value:'filter'},
  {label:t('deviceSetting.settingInfo.tabs.communication'),value:'communication'},
  {label:t('deviceSetting.settingInfo.tabs.system'),value:'system'}
]);


const detailSectionsConfig=computed<SectionConfig[]>(()=>[
  {
    key:'basic',
    title:t('deviceSetting.settingInfo.section.basic'),
    fields:[
      {key:'deviceNumber',labelKey:'deviceSetting.settingInfo.fields.basic.deviceNumber',type:'text'},
      {key:'enabledControl',labelKey:'deviceSetting.settingInfo.fields.basic.enabledControl',type:'dict',dict:'enabledControl'},
      {key:'inspectionControl',labelKey:'deviceSetting.settingInfo.fields.basic.inspectionControl',type:'dict',dict:'inspectionControl'},
      {key:'workMode',labelKey:'deviceSetting.settingInfo.fields.basic.workMode',type:'dict',dict:'workMode'},
      {key:'onceMeasureLength',labelKey:'deviceSetting.settingInfo.fields.basic.onceMeasureLength',type:'text'},
      {key:'signalLevel',labelKey:'deviceSetting.settingInfo.fields.basic.signalLevel',type:'text'},
      {key:'signalChannel',labelKey:'deviceSetting.settingInfo.fields.basic.signalChannel',type:'text'}
    ]
  },
  {
    key:'measure',
    title:t('deviceSetting.settingInfo.section.measure'),
    fields:[
      {key:'measureGainMode',labelKey:'deviceSetting.settingInfo.fields.measure.measureGainMode',type:'dict',dict:'measureGainMode'},
      {key:'benchmarkValue',labelKey:'deviceSetting.settingInfo.fields.measure.benchmarkValue',type:'text'},
      {key:'noiseBenchmarkValue',labelKey:'deviceSetting.settingInfo.fields.measure.noiseBenchmarkValue',type:'text'},
      {key:'gainValue',labelKey:'deviceSetting.settingInfo.fields.measure.gainValue',type:'text'},
      {key:'samplingWeekday',labelKey:'deviceSetting.settingInfo.fields.measure.samplingWeekday',type:'text'},
      {key:'samplingTime',labelKey:'deviceSetting.settingInfo.fields.measure.samplingTime',type:'text'},
      {key:'syncSamplingNumber',labelKey:'deviceSetting.settingInfo.fields.measure.syncSamplingNumber',type:'text'},
      {key:'syncSamplingTime',labelKey:'deviceSetting.settingInfo.fields.measure.syncSamplingTime',type:'text'},
      {key:'samplingPeriodTime',labelKey:'deviceSetting.settingInfo.fields.measure.samplingPeriodTime',type:'text'},
      {key:'samplingCount',labelKey:'deviceSetting.settingInfo.fields.measure.samplingCount',type:'text'},
      {key:'leakThreshold',labelKey:'deviceSetting.settingInfo.fields.measure.leakThreshold',type:'text'}
    ]
  },
  {
    key:'filter',
    title:t('deviceSetting.settingInfo.section.filter'),
    fields:[
      {key:'filterMethod',labelKey:'deviceSetting.settingInfo.fields.filter.filterMethod',type:'dict',dict:'filterMethod'},
      {key:'filterLowFrequency',labelKey:'deviceSetting.settingInfo.fields.filter.filterLowFrequency',type:'text'},
      {key:'filterHighFrequency',labelKey:'deviceSetting.settingInfo.fields.filter.filterHighFrequency',type:'text'},
      {key:'audioRule',labelKey:'deviceSetting.settingInfo.fields.filter.audioRule',type:'dict',dict:'audioRule'}
    ]
  },
  {
    key:'communication',
    title:t('deviceSetting.settingInfo.section.communication'),
    fields:[
      {key:'loraPower',labelKey:'deviceSetting.settingInfo.fields.communication.loraPower',type:'text'},
      {key:'loraSignalFrequency',labelKey:'deviceSetting.settingInfo.fields.communication.loraSignalFrequency',type:'text'},
      {key:'loraOpenDay',labelKey:'deviceSetting.settingInfo.fields.communication.loraOpenDay',type:'text'},
      {key:'loraOpenDate',labelKey:'deviceSetting.settingInfo.fields.communication.loraOpenDate',type:'text'},
      {key:'nb4gTrigger',labelKey:'deviceSetting.settingInfo.fields.communication.nb4gTrigger',type:'text'},
      {key:'nb4gTransferSet',labelKey:'deviceSetting.settingInfo.fields.communication.nb4gTransferSet',type:'text'},
      {key:'nb4gOpenTimeSet',labelKey:'deviceSetting.settingInfo.fields.communication.nb4gOpenTimeSet',type:'text'},
      {key:'reportInterval',labelKey:'deviceSetting.settingInfo.fields.communication.reportInterval',type:'text'}
    ]
  },
  {
    key:'system',
    title:t('deviceSetting.settingInfo.section.system'),
    fields:[
      {key:'commandAccount',labelKey:'deviceSetting.settingInfo.fields.system.commandAccount',type:'text'},
      {key:'orderTime',labelKey:'deviceSetting.settingInfo.fields.system.orderTime',type:'date'},
      {key:'createdAt',labelKey:'deviceSetting.settingInfo.fields.system.createdAt',type:'date'},
      {key:'updatedAt',labelKey:'deviceSetting.settingInfo.fields.system.updatedAt',type:'date'},
      {key:'isDeleted',labelKey:'deviceSetting.settingInfo.fields.system.isDeleted',type:'dict',dict:'isDeleted'}
    ]
  }
]);


function resolveValue(field:FieldConfig){
  let value:any=props.settingData[field.key];

  if(field.type==='date'){
    return value?formatDate(value as string):'--';
  }

  if(field.type==='dict'&&field.dict){
    return DICT_MAPS.value[field.dict]?.[String(value)]??'--';
  }

  return value!==undefined&&value!==null&&value!==''?value:'--';
}


function resolveSections(config:SectionConfig[]){
  return config.map(section=>({
    key:section.key,
    title:section.title,
    fields:section.fields.map(field=>({
      key:field.key,
      labelKey:field.labelKey,
      value:resolveValue(field)
    }))
  }));
}


const currentSections=computed(()=>{
  const map:Record<string,string>={
    basic:'basic',
    measure:'measure',
    filter:'filter',
    communication:'communication',
    system:'system'
  };

  return resolveSections(
      detailSectionsConfig.value.filter(
          item=>item.key===map[activeTab.value]
      )
  );
});


const workModeLabel=computed(()=>{
  const mode=props.settingData.workMode;
  return mode===undefined||mode===null
      ? '--'
      : DICT_MAPS.value.workMode[mode]??'--';
});
</script>

<style scoped lang="scss">
@import "@/pages/device/components/x/detail-panel.css";
</style>
