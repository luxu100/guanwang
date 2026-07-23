<template>
  <view
      v-if="visible"
      id="x-tooltip"
      class="x-tooltip"
      :class="`x-tooltip--${direction}`"
      :style="{ left: position.x + 'px', top: position.y + 'px' }"
  >
    {{ text }}
  </view>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

const props = defineProps<{
  visible:boolean;
  text:string;
  x:number;
  y:number;
}>();

const direction = ref<'top'|'bottom'>('bottom');
const position = ref({x:0,y:0});

const updatePosition = async () => {
  await nextTick();

  const {windowWidth,windowHeight} = uni.getSystemInfoSync();

  uni.createSelectorQuery()
      .select('#x-tooltip')
      .boundingClientRect((rect:any)=>{
        if(!rect) return;

        direction.value =
            props.y + rect.height + 10 > windowHeight
                ? 'top'
                : 'bottom';


        position.value = {
          x: Math.min(
              props.x,
              windowWidth - rect.width - 10
          ),
          y: direction.value === 'top'
              ? props.y - rect.height - 10
              : props.y + 10
        };

      })
      .exec();
};


watch(
    () => props.visible,
    value => {
      if(value){
        updatePosition();
      }
    }
);


watch(
    () => [props.x,props.y,props.text],
    () => {
      if(props.visible){
        updatePosition();
      }
    }
);

</script>

<style scoped lang="scss">

.x-tooltip {
  position:fixed;
  z-index:9999;

  max-width:360px;
  padding:8px 12px;

  color:#24384d;
  font-size:13px;
  line-height:20px;

  background:#fff;

  border:1px solid #d8e5ef;
  border-radius:6px;

  box-shadow:0 8px 20px rgba(35,72,104,.15);

  white-space:pre-wrap;
  overflow-wrap:break-word;

  pointer-events:none;

  animation:tooltip-show .15s ease-out;
}


.x-tooltip::before {
  content:"";

  position:absolute;

  width:10px;
  height:10px;

  background:#fff;
}


.x-tooltip--bottom::before {
  top:-6px;
  left:18px;

  border-left:1px solid #d8e5ef;
  border-top:1px solid #d8e5ef;

  transform:rotate(45deg);
}


.x-tooltip--top::before {
  bottom:-6px;
  left:18px;

  border-right:1px solid #d8e5ef;
  border-bottom:1px solid #d8e5ef;

  transform:rotate(45deg);
}


@keyframes tooltip-show {
  from {
    opacity:0;
  }
  to {
    opacity:1;
  }
}

</style>