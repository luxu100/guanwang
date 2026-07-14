<template>
  <view class="form-photo-area">

    <view v-if="photos.length" class="photo-preview-list">
      <view v-for="(p,i) in photos" :key="i" class="photo-preview-item">
        <image :src="p.url" class="photo-thumb" mode="aspectFill" @click.stop="preview(i)"/>
        <button class="photo-remove-btn" hover-class="photo-remove-btn--hover" @click.stop="remove(i)">
          <text class="photo-remove-icon"></text>
        </button>
      </view>
    </view>

    <view v-if="photos.length < max" class="photo-add-box" @click="choose">
      <text class="photo-add-icon">+</text>
      <text class="photo-add-label">{{photos.length?t("formDialog.photo.continueAddPhoto"):t("formDialog.photo.uploadPhoto")}}</text>
    </view>

    <input
        :value="ids"
        class="form-input form-input--hidden-id"
        :placeholder="t('formDialog.photo.photoIdPlaceholder')"
        placeholder-class="input-placeholder"
        disabled
    />
  </view>
</template>

<script setup lang="ts">
import {ref,watch,onUnmounted} from "vue";
import {uploadImageT,getFileDetail} from "@/services/device/sysFile";

const BASE_URL=import.meta.env.VITE_API_BASE_URL||import.meta.env.VITE_DEV_PROXY_TARGET||"";

import {createScopedT} from "@/i18n";
const t = createScopedT("devicePage");

const props=defineProps({
  modelValue:{type:String,default:""},
  max:{type:Number,default:9}
});

const emit=defineEmits(["update:modelValue"]);

const photos=ref<any[]>([]);
const ids=ref("");
const uploading=ref(false);


watch(()=>props.modelValue,async val=>{
  if(!val){
    photos.value=[];
    ids.value="";
    return;
  }

  if(ids.value===val)return;

  ids.value=val;
  photos.value=[];

  for(const id of val.split(",")){
    if(!id)continue;

    const r=await getFileDetail(Number(id));

    if(r.data){
      photos.value.push({
        id:r.data.id,
        url:r.data.filePath.startsWith("http")
            ? r.data.filePath
            : BASE_URL+r.data.filePath
      });
    }
  }
},{immediate:true});


function choose(){
  if(uploading.value)return;

  uni.chooseImage({
    count:props.max-photos.value.length,
    sizeType:["compressed"],
    sourceType:["album","camera"],

    success:async res=>{
      uploading.value=true;
      uni.showLoading({title:"上传中"});

      try{
        for(const path of res.tempFilePaths){
          const r=await uploadImageT(path);

          if(r.data){
            photos.value.push({
              id:r.data.id,
              url:r.data.filePath.startsWith("http")
                  ? r.data.filePath
                  : BASE_URL+r.data.filePath
            });
          }
        }

        update();
      }finally{
        uploading.value=false;
        uni.hideLoading();
      }
    }
  });
}


function remove(i:number){
  photos.value.splice(i,1);
  update();
}


function update(){
  ids.value=photos.value.map(p=>p.id).join(",");
  emit("update:modelValue",ids.value);
}

function preview(i:number){
  uni.previewImage({
    current:i,
    urls:photos.value.map(p=>p.url),
    indicator:"number"
  });
}

onUnmounted(() => {
  if(uploading.value){
    uploading.value=false;
    uni.hideLoading();
  }
});

</script>
<style scoped lang="scss">
.form-photo-area { display: flex; flex-wrap: wrap; gap: 10px; }
.photo-preview-list { display: flex; flex-wrap: wrap; gap: 10px; }
.photo-preview-item { position: relative; width: 88px; height: 88px; border-radius: 6px; overflow: hidden; }
.photo-thumb { width: 100%; height: 100%; }
.photo-remove-btn { position: absolute; top: 2px; right: 2px; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; padding: 0; margin: 0; background: rgba(0,0,0,0.55); border: 0; border-radius: 50%; cursor: pointer; &--hover { background: rgba(0,0,0,0.75); } }
.photo-remove-icon { position: relative; width: 10px; height: 10px; &::before, &::after { position: absolute; top: 4px; left: 0; width: 10px; height: 2px; content: ""; background: #fff; border-radius: 1px; } &::before { transform: rotate(45deg); } &::after { transform: rotate(-45deg); } }
.photo-add-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 88px; height: 88px; border: 2px dashed #c5d2e2; border-radius: 6px; background: #fbfdff; cursor: pointer; transition: border-color 0.16s ease, background 0.16s ease; &:hover { border-color: #3b82f6; background: #eff6ff; } }
.photo-add-icon { font-size: 26px; font-weight: 300; color: #94a3b8; line-height: 1; }
.photo-add-label { font-size: 11px; color: #94a3b8; }
.form-input{ box-sizing: border-box; min-width: 0; width: 100%; max-width: 100%; height: 38px; padding: 0 12px; overflow: hidden; color: #172033; font-size: 14px; line-height: 38px; text-overflow: ellipsis; background: #fbfdff; border: 1px solid #d5e2ee; border-radius: 4px; transition: border-color 0.16s ease, box-shadow 0.16s ease; &--flex { flex: 1; } }
.form-input--hidden-id { margin-top: 10px; height: 32px; font-size: 12px; color: #94a3b8; background: #f9fafb; }
.input-placeholder { color: #9aa9b8; font-size: 13px; }
</style>