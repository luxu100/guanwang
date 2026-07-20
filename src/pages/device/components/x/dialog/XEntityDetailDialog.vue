<template>
  <view v-if="visible" class="detail-mask" @click="close">
    <view class="detail-dialog" @click.stop>
      <view class="detail-header">
        <view>
          <text class="detail-title">{{ title }}</text>
          <text v-if="subtitle" class="detail-subtitle">{{ subtitle }}</text>
        </view>
        <button class="close-btn" @click="close">
          <text class="close-icon"/>
        </button>
      </view>

      <scroll-view class="detail-body" scroll-y>
        <view class="detail-content">
          <view v-for="(section,index) in schema" :key="index" class="detail-section">
            <view class="section-title">{{ t(section.titleKey || '--') }}</view>

            <view class="detail-grid">
              <view v-for="field in section.fields" :key="field.key" class="detail-item" :class="{'detail-item--full':field.layout==='full'||field.type==='image'}">
                <text class="detail-label">{{ t(field.labelKey || '--') }}</text>

                <view
                    v-if="field.type==='image'"
                    class="image-list"
                >
                  <image
                      v-for="url in imageValues[field.key]"
                      :key="url"
                      class="detail-image"
                      mode="aspectFill"
                      :src="url"
                  />
                </view>

                <text v-else-if="field.type==='tag'" class="detail-tag" :class="field.tagClass">
                  {{ getDisplayValue(field) }}
                </text>

                <text v-else class="detail-value">
                  {{ getDisplayValue(field) }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </scroll-view>

      <view class="detail-footer">
        <button class="close-action" @click="close">
          {{ t('formDialog.close') }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import {computed,watch,ref} from "vue";
import {createScopedT} from "@/i18n";
import type {FormSection,FormField} from "@/pages/device/components/x/types";
import {formatDate} from "@/utils/time";

const t=createScopedT("devicePage");

interface Props{
  visible:boolean;
  modelValue:any;
  schema:FormSection[];
  asideSchema?:FormSection;
  title?:string;
  subtitle?:string;
}

const props=withDefaults(defineProps<Props>(),{
  title:"",
  subtitle:"",
  asideSchema:undefined
});

const emit=defineEmits<{
  (e:"update:visible",value:boolean):void;
}>();

const visible=computed({
  get:()=>props.visible,
  set:(v)=>emit("update:visible",v)
});

function close(){
  visible.value=false;
}

function getValue(key:string){
  return props.modelValue?.[key] ?? "";
}

function getDisplayValue(field:FormField){
  const value=getValue(field.key);

  if(value===undefined||value===null||value===""){
    return "-";
  }

  if(field.options){
    const option=field.options.find(item=>item.value===value);
    return option?.labelKey ? t(option.labelKey) : value;
  }

  if(field.formatter){
    return field.formatter(value,props.modelValue);
  }

  if(field.type==="datetime"){
    return formatDate(value);
  }

  return value;
}

const imageValues = ref<Record<string,string[]>>({});

watch(
    ()=>props.modelValue,
    async(data)=>{
      if(!data) return;
      for(const section of props.schema){
        for(const field of section.fields){
          if(
              field.type==="image" &&
              field.imageResolver
          ){
            imageValues.value[field.key]=
                await field.imageResolver(
                    data[field.key],
                    data
                );
          }
        }
      }
    },
    {
      immediate:true,
      deep:true
    }
);

defineExpose({close});
</script>


<style scoped lang="scss">

.detail-mask{
  position:fixed;
  inset:0;
  z-index:100;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:20px;
  background:rgba(15,35,55,.35);
}

.detail-dialog{
  width:min(980px,calc(100vw - 40px));
  height:min(680px,calc(100vh - 40px));
  display:flex;
  flex-direction:column;
  overflow:hidden;
  background:#fff;
  border:1px solid #d8e6f2;
  border-radius:10px;
  box-shadow:0 18px 50px rgba(15,35,55,.18);
}

.detail-header{
  flex:none;
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:18px 24px;
  background:#f8fbfe;
  border-bottom:1px solid #edf3f8;
}

.detail-title{
  display:block;
  color:#183755;
  font-size:22px;
  font-weight:900;
}

.detail-subtitle{
  display:block;
  margin-top:5px;
  color:#64748b;
  font-size:13px;
}

.close-btn{
  width:32px;
  height:32px;
  padding:0;
  margin:0;

  display:flex;
  align-items:center;
  justify-content:center;

  line-height:1;

  background:#fff;
  border:1px solid #d8e6f2;
  border-radius:6px;
}

.close-btn::after{
  border:0;
}

.close-icon{
  width:14px;
  height:14px;
  display:block;
  position:relative;
}

.close-icon:before,
.close-icon:after{
  content:"";
  position:absolute;
  left:0;
  top:6px;

  width:14px;
  height:2px;

  background:#64748b;
}

.close-icon:before{
  transform:rotate(45deg);
}

.close-icon:after{
  transform:rotate(-45deg);
}

.detail-body{
  flex:1;
  min-height:0;
  overflow:hidden;
  padding:22px 24px;
}

.detail-section{
  margin-bottom:26px;
}

.section-title{
  position:relative;
  margin-bottom:16px;
  padding-left:10px;
  color:#183755;
  font-size:16px;
  font-weight:900;
}

.section-title:before{
  content:"";
  position:absolute;
  left:0;
  top:50%;
  width:3px;
  height:16px;
  transform:translateY(-50%);
  background:#0d82ee;
  border-radius:10px;
}

.detail-grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:18px 28px;
}

.detail-item{
  min-height:42px;
}

.detail-item--full{
  grid-column:1/-1;
}

.detail-label{
  display:block;
  margin-bottom:5px;
  color:#64748b;
  font-size:13px;
}

.detail-value{
  display:block;
  color:#172033;
  font-size:14px;
  font-weight:600;
  line-height:22px;
  word-break:break-all;
}

.detail-image{
  width:180px;
  height:120px;
  border-radius:6px;
  border:1px solid #dbe7f2;
}

.detail-tag{
  display:inline-flex;
  padding:4px 10px;
  border-radius:20px;
  color:#0d82ee;
  background:#edf7ff;
  font-size:13px;
  font-weight:700;
}

.detail-footer{
  flex:none;

  display:flex;
  justify-content:flex-end;
  align-items:center;

  padding:12px 24px;

  border-top:1px solid #edf3f8;
}

.close-action{
  margin:0;
  padding:0;

  min-width:90px;
  height:36px;

  line-height:36px;

  color:#31506d;

  background:#f6fbff;

  border:1px solid #cbdced;

  border-radius:5px;
}
.close-action::after{
  border:0;
}

@media(max-width:900px){
  .detail-grid{
    grid-template-columns:1fr;
  }
}

button::after{
  border:0;
}
</style>