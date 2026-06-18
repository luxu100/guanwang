<!-- 
注意：这个页面作为切换页面在AppShell中使用DeviceManagementView组件，传入不同的mode参数来切换不同的页面内容。
-->
<!-- 
代码在AppShell的shellContentDefinitions中：  
"/pages/device/info/info": { component: DeviceManagementView, props: { mode: "info" } },
"/pages/device/maintenance/maintenance": { component: DeviceManagementView, props: { mode: "maintenance" } },
"/pages/device/status/status": { component: DeviceManagementView, props: { mode: "status" } }, 
-->
<template>
  <div class="device-management">
  </div>
</template>