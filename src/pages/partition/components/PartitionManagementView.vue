<template>
    <view class="partition">
        <!-- 分区 -->
		<view class="partition-layout">

			
			<!-- 分区树 -->
			<view class="tree-panel">
				<!-- 分区搜索 -->
				<view class="tree-search">
					<input class="form-input" placeholder="输入节点名称模糊搜索" placeholder-class="input-placeholder"/>
				</view>
				<!-- 树内容 -->
				<view class="tree-content">
					<view 
					  v-for="item in partitionList" 
					  :key="item.id" 
					  class="tree-node" 
					  :class="{ 'tree-node--active': currentPartitionId === item.id }"
					  @click="handlePartitionClick(item)"
					>
						{{ item.deptName }}
					</view>
				</view>
				<view class="tree-actions">
				  <button class="secondary-button" @click="handleCreatePartition">
				    新增
				  </button>
				  
				  <button
				    class="secondary-button"
				    :disabled="!currentPartitionId"
				    @click="handleEditPartition"
				  >
				    编辑
				  </button>
				
				  <button
				    class="danger-button"
				    :disabled="!currentPartitionId"
				    @click="handleDeletePartition"
				  >
				    删除
				  </button>
				</view>
			</view>
		</view>

		<!-- 设备 -->
		<view class="dev-layout">
			<!-- 设备查询区域 -->
			<view class="toolbar-panel">
				<!-- 左侧查询 -->
				  <view class="toolbar-left">			
				    <input
				      v-model="deviceKeyword"
				      class="toolbar-input"
				      placeholder="请输入设备编号"
				      placeholder-class="input-placeholder"
				    />
					<button class="primary-button" @click="handleDeviceSearch">
					  查询
					</button>
					<button class="secondary-button" @click="handleDeviceRefresh">
					  刷新
					</button>
				  </view>
				
				  <!-- 右侧功能按钮 -->
				  <view class="toolbar-right">
					<button class="secondary-button" @click="handleBatchAction">
					  批量操作
					</button>
					<button class="secondary-button" @click="handleImportDevice">
					  导入
					</button>
					<button class="secondary-button" @click="handleExportDevice">
					  导出
					</button>
					<button class="primary-button" @click="handleCreateDevice">
					  新增设备
					</button>
					<button class="danger-button" @click="handleDeleteSelectedDevice">
					  删除
					</button>
				  </view>

			</view>

			<!-- 设备列表 -->
			<view class="table-panel">
				<view class="section-head">
					<text class="section-title">
					设备列表
					</text>
				</view>

				<view class="device-table">
					<!-- 表头 -->
					<view class="table-row table-row--header">
						
					  <view class="col-checkbox">
						<checkbox-group>
						  <checkbox
						    :checked="isAllSelected"
						    @click="handleSelectAll"
						  />
						</checkbox-group>
					  </view>
					  
					  <view class="col-index">序号</view>
					  <view class="col-device-number">设备编号</view>	  
					  <view class="col-device-type">设备类型</view>
					  <view class="col-status">启用状态</view>
					  <view class="col-status">安装状态</view>
					  <view class="col-status">安装模式</view>
					  <view class="col-address">安装地址</view>
					  <view class="col-group">管组编号</view>
					  <view class="col-status">渗漏状态</view>
					  <view class="col-time">最后采样时间</view>
					  <view class="col-status">在线状态</view>
					  <view class="col-action">操作</view>
					</view>
					
				    <!-- 数据 -->
					<view
					  v-for="(item,index) in deviceList"
					  :key="item.id"
					  class="table-row"
					>
									
					  <view class="col-checkbox">
						<checkbox
						  :checked="selectedIds.includes(item.id)"
						  @click.stop="handleSelectDevice(item.id)"
						/>
					  </view>
									
					  <view class="col-index">
						{{ index + 1 }}
					  </view>
									
					  <view class="col-device-number">
						{{ item.deviceNumber }}
					  </view>
									
					  <view class="col-device-type">
						{{ item.deviceType }}
					  </view>
									
					  <view class="col-status">
						{{ item.enableState == 1 ? '启用' : '禁用' }}
					  </view>
									
					  <view class="col-status">
						{{ item.installState == 1 ? '已安装' : '未安装' }}
					  </view>
									
					  <view class="col-status">
						{{ item.installMode == 1 ? '地面' : '井下' }}
					  </view>
									
					  <view class="col-address">
						{{ item.installAddress }}
					  </view>
									
					  <view class="col-group">
						{{ item.tubeGroup }}
					  </view>
									
					  <view class="col-status">
						{{ getLeakText(item.leakStatus) }}
					  </view>
									
					  <view class="col-time">
						{{ item.lastSamplingTime || '-' }}
					  </view>
									
					  <view class="col-status">
						{{ item.onlineStatus == 1 ? '在线' : '离线' }}
					  </view>
					  
					  <view class="col-action">
					      <button
					        class="table-action-btn"
					        @click.stop="handleEditDevice(item)"
					      >
					        编辑
					      </button>
					    </view>
							  
					</view>
					
				    
				</view>
				
				<view class="pagination-bar">
				  <button class="page-btn" :disabled="pagination.current <= 1" @click="handlePageChange(pagination.current - 1)">
				    上一页
				  </button>
				  <text class="page-info">第 {{ pagination.current }}  /  {{ Math.ceil(pagination.total / pagination.size) || 1 }} 页</text>
				  <button class="page-btn" :disabled="pagination.current >= Math.ceil(pagination.total / pagination.size)" @click="handlePageChange(pagination.current + 1)">
				    下一页
				  </button>
				</view>

				
			</view>

			<!-- 分区管理 -->
			<view class="area-panel">
			  <view class="section-head">
			    <text class="section-title">分区管理</text>
			  </view>
			
			  <view class="partition-form ">
			    <view class="form-field--name">
			      <text class="form-label">分区名称</text>
				  <input
				    v-model="partitionForm.deptName"
				    class="form-input"
				    :disabled="!isPartitionEditing"
				    placeholder="请输入分区"
				    placeholder-class="input-placeholder"
				  />
			    </view>
			
			    <view class="form-field--admin">
			      <text class="form-label">管理员</text>
			      <input
			        v-model="partitionForm.administrator"
			        class="form-input"
			        :disabled="!isPartitionEditing"
			        placeholder="管理员"
			        placeholder-class="input-placeholder"
			      />
			    </view>

			    <view class="form-field--desc">
			        <text class="form-label">描述</text>
				    <input
				        v-model="partitionForm.description"
				        class="form-input"
				        :disabled="!isPartitionEditing"
				        placeholder="请输入描述"
				        placeholder-class="input-placeholder"
				    />
				</view>
				
				<button
				  class="primary-button"
				  :disabled="!isPartitionEditing"
				  @click="handleSavePartition"
				>
				  保存
				</button>
			  </view>
			</view>
		</view>  
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from "vue";
import { 
	getPartitionList, 
	getPartitionDevicePage,
	createPartition,
	updatePartition,
	deletePartition
} from "@/services/partition/partition";




interface PartitionItem {
  id: number;
  deptName: string;
  administrator?: string;
  description?: string;
  createdAt?: string;
  parentId: number;
  sort?: number;
  status?: number;
}

interface DevicePageResult {
  current: number;
  pages: number;
  size: number;
  total: number;
  records: any[];
}

interface DeviceItem {
  id: number;
  deviceNumber: string;
  deviceType: string;
  enableState: number;
  installState: number;
  installMode: number;
  installAddress: string;
  tubeGroup: string;
  leakStatus: number;
  onlineStatus: number;
  lastSamplingTime: string | null;
}

const partitionList = ref<PartitionItem[]>([]);
const currentPartitionId = ref<number>();

const loadPartitionTree = async () => {
  try {
    const res = await getPartitionList();

    console.log("分区列表", res);

    partitionList.value = (res.data as PartitionItem[]) || [];
  } catch (e) {
    console.error(e);
  }
};
 
const handlePartitionClick = async (item: PartitionItem) => {
  fillPartitionForm(item);
  currentPartitionId.value = item.id;
  isPartitionEditing.value = false;
  pagination.current = 1;
  const res = await getPartitionDevicePage(item.id, {
    pageNum:1,
    pageSize:pagination.size
  });
  const pageData = res.data as DevicePageResult;
  deviceList.value = pageData.records || [];
  console.log(deviceList.value);
  pagination.total = pageData.total || 0;
};

const loadPartitionList = async () => {
	const res = await getPartitionList();
	partitionList.value =(res.data as PartitionItem[]) || [];
};

const deviceList = ref<DeviceItem[]>([]);
const deviceKeyword = ref("");
const selectedIds = ref<number[]>([]);

const handleSelectDevice = (id: number) => {
  const index = selectedIds.value.indexOf(id);

  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

const handleDeviceSearch = async () => {
  if (currentPartitionId.value === undefined) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }

  const keyword = deviceKeyword.value.trim();

  const res = await getPartitionDevicePage(currentPartitionId.value, {
    current: pagination.current,
    size: pagination.size,
    deviceNumber: keyword,
  });

  const pageData = res.data as DevicePageResult;
  deviceList.value = pageData.records || [];
  pagination.total = pageData.total || 0;
};

const handleDeviceRefresh = async () => {
  if (currentPartitionId.value === undefined) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }

  deviceKeyword.value = "";
  selectedIds.value = [];

  const res = await getPartitionDevicePage(currentPartitionId.value, {
    current: pagination.current,
    size: pagination.size,
  });

  const pageData = res.data as DevicePageResult;
  deviceList.value = pageData.records || [];
  pagination.total = pageData.total || 0;

  uni.showToast({ title: "刷新成功", icon: "success" });
};

const getLeakText = (status:number) => {
  switch(status){
    case 0:
      return "正常";
    case 1:
      return "疑似渗漏";
    case 2:
      return "确认渗漏";
    case 3:
      return "设备异常";
    default:
      return "-";
  }
};

const isAllSelected = computed(() => {
  if (deviceList.value.length === 0) {
    return false;
  }

  return deviceList.value.every(item => selectedIds.value.includes(item.id));
});

const handleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = deviceList.value.map(item => item.id);
  }
};
 
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

const handlePageChange = async (page:number) => {

  pagination.current = page;
  if (currentPartitionId.value === undefined) {
      return;
    }
  const res = await getPartitionDevicePage(
  currentPartitionId.value,
    {
      pageNum: page,
      pageSize: pagination.size
    }
  );

  const pageData = res.data as any;

  deviceList.value = pageData.records || [];
  pagination.total = pageData.total || 0;

};

const isPartitionEditing = ref(false);
const isPartitionCreating = ref(false);

const partitionForm = reactive({
  id: undefined as number | undefined,
  deptName: "",
  administrator: "",
  description: "",
  parentId: 0,
  sort: 10,
  status: 1,
});

const fillPartitionForm = (item: PartitionItem) => {
  partitionForm.id = item.id;
  partitionForm.deptName = item.deptName || "";
  partitionForm.administrator = item.administrator || "";
  partitionForm.description = item.description || "";
  partitionForm.parentId = item.parentId ?? 0;
  partitionForm.sort = item.sort ?? 10;
  partitionForm.status = item.status ?? 1;
};

const resetPartitionForm = () => {
  partitionForm.id = undefined;
  partitionForm.deptName = "";
  partitionForm.administrator = "";
  partitionForm.description = "";
  partitionForm.parentId = 0;
  partitionForm.sort = 10;
  partitionForm.status = 1;
};

const handleCreatePartition = () => {
  currentPartitionId.value = undefined;
  isPartitionCreating.value = true;
  isPartitionEditing.value = true;
  resetPartitionForm();
};

const handleEditDevice = (item: any) => {
  console.log("编辑设备", item);
  uni.showToast({
    title: `编辑设备：${item.deviceNumber}`,
    icon: "none"
  });
};

const handleEditPartition = () => {
  if (currentPartitionId.value === undefined) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }

  isPartitionEditing.value = true;
};

const handleSavePartition = async () => {
  if (!isPartitionEditing.value) {
    uni.showToast({ title: "请先点击新增或编辑", icon: "none" });
    return;
  }

  if (!partitionForm.deptName.trim()) {
    uni.showToast({ title: "请输入分区名称", icon: "none" });
    return;
  }

  const payload = {
    deptName: partitionForm.deptName.trim(),
    administrator: partitionForm.administrator?.trim(),
    description: partitionForm.description?.trim(),
    parentId: partitionForm.parentId ?? 0,
    sort: partitionForm.sort ?? 10,
    status: partitionForm.status ?? 1,
  };

  if (isPartitionCreating.value) {
    await createPartition(payload);
    uni.showToast({ title: "新增成功", icon: "success" });
  } else {
    if (!partitionForm.id) {
      uni.showToast({ title: "请先选择分区", icon: "none" });
      return;
    }

    await updatePartition(partitionForm.id, payload);
    uni.showToast({ title: "保存成功", icon: "success" });
  }

  isPartitionCreating.value = false;
  isPartitionEditing.value = false;
  resetPartitionForm();
  await loadPartitionTree();
};

const handleDeletePartition = async () => {
  if (currentPartitionId.value === undefined) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }

  await deletePartition(currentPartitionId.value);
  uni.showToast({ title: "删除成功", icon: "success" });

  currentPartitionId.value = undefined;
  isPartitionEditing.value = false;
  resetPartitionForm();
  await loadPartitionTree();
};

const handleBatchAction = () => {
  if (selectedIds.value.length === 0) {
    uni.showToast({ title: "请先选择设备", icon: "none" });
    return;
  }

  uni.showToast({ title: "批量操作待接入", icon: "none" });
};

const handleImportDevice = () => {
  uni.showToast({ title: "导入功能待接入", icon: "none" });
};

const handleExportDevice = () => {
  if (currentPartitionId.value === undefined) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }

  uni.showToast({ title: "导出功能待接入", icon: "none" });
};

const handleCreateDevice = () => {
  if (currentPartitionId.value === undefined) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }

  uni.showToast({ title: "新增设备待接入", icon: "none" });
};

const handleDeleteSelectedDevice = () => {
  if (selectedIds.value.length === 0) {
    uni.showToast({ title: "请先选择设备", icon: "none" });
    return;
  }

  uni.showModal({
    title: "删除确认",
    content: `确认删除选中的 ${selectedIds.value.length} 个设备吗？`,
    success: async (res) => {
      if (!res.confirm) return;

      uni.showToast({
        title: "删除接口待接入",
        icon: "none",
      });

      selectedIds.value = [];
    },
  });
};


onMounted(async () => {
  await loadPartitionTree();
});

</script>


<style scoped lang="scss">
.partition {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: #eef4f8;
}

.primary-button,
.secondary-button,
.danger-button {
  display: flex;
  align-items: center;
  justify-content: center;

  min-width: 50px;
  height: 36px;
  padding: 0 12px;
  margin: 0;

  font-size: 14px;
  font-weight: 700;
  border-radius: 4px;
}

.primary-button::after,
.secondary-button::after,
.danger-button::after {
  border: 0;
}

/* =========================
   主按钮（蓝色）
   ========================= */
.primary-button {
  color: #ffffff;
  line-height: 36px;
  background: #0d82ee;
  border: 1px solid #0d82ee;
  max-width: 100px;
}

.primary-button--hover {
  background: #0674d8;
  border-color: #0674d8;
}

.primary-button[disabled] {
  color: #dbeafe;
  background: #82b9ec;
  border-color: #82b9ec;
}

/* =========================
   次按钮（白色）
   ========================= */
.secondary-button {
  color: #31506d;
  line-height: 36px;
  background: #f6fbff;
  border: 1px solid #cbdced;
}

.secondary-button--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

/* =========================
   危险按钮（红色）
   ========================= */
.danger-button {
  color: #ffffff;
  background: #ef4444;
  border: 1px solid #ef4444;
}

.danger-button:hover {
  background: #dc2626;
  border-color: #dc2626;
}

/* 区域标题栏 */
.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 11px;
  padding-bottom: 9px;
  border-bottom: 1px solid #eef4fa;
}

/* 标题文字 */
.section-title {
  position: relative;
  padding-left: 10px;
  color: #183755;
  font-size: 16px;
  font-weight: 900;
}

.section-title::before {
  position: absolute;
  top: 50%;
  left: 0;
  width: 3px;
  height: 16px;
  content: "";
  background: #0d82ee;
  border-radius: 999px;
  transform: translateY(-50%);
}

/* 输入框 */
.form-input {
  box-sizing: border-box;
  // width: 100%;
  height: 38px;
  padding: 0 12px;
  color: #172033;
  font-size: 14px;
  line-height: 38px;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background-color 0.16s ease;
}

.form-input:focus {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

/* placeholder */
.input-placeholder {
  color: #9aa9b8;
}

.form-label {
  display: block;
  margin-bottom: 5px;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
}

.partition-layout {
  width: 260px;
  min-width: 260px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
}

.dev-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
  padding: 12px 12px 12px 0;
}

.tree-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 12px;
  background: #fff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  overflow: hidden;
}

.tree-search {
  padding: 12px;
}

.tree-content {
  flex: 1;
  padding: 12px;
  min-height: 0;
  overflow-y: auto;
}

.tree-actions {
  display: flex;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid #eef4fa;
}

.form-input[disabled]{
  color: #64748b;
  background: #f3f7fb;
}

.tree-node {
  height: 36px;
  line-height: 36px;
  padding: 0 12px;
  cursor: pointer;
  border-radius: 4px;
}

.tree-node:hover {
  background: #edf7ff;
}

.tree-node--active {
  color: #0d82ee;
  background: #edf7ff;
  font-weight: 700;
}

.toolbar-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #ffffff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  justify-content: space-between;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.toolbar-input {
  width: 260px;
  height: 38px;
  padding: 0 12px;
  font-size: 14px;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.table-panel {
  flex: 1;
  min-height: 0px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  overflow: hidden;
}

.device-table {
  flex: 1;
  min-height: 0px;
  overflow: auto;
}

.table-row {
  display: flex;
  min-width: 1760px;
  min-height: 42px;
  width:max-content;
  border-bottom: 1px solid #edf1f5;
}

.table-row--header {
  position: sticky;
  top: 0;
  z-index: 20;
  min-height: 44px;
  background: #f6f9fc;
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 1px 0 #dbe7f0;
}

.table-row:hover {
  background: #f8fbff;
}

.table-row > view {
  display: flex;
  align-items: center;
  padding: 0 12px;
  box-sizing: border-box;
}

.table-action-btn {
  min-width: 56px;
  height: 28px;
  padding: 0 10px;
  margin: 0;
  color: #0d82ee;
  font-size: 13px;
  line-height: 28px;
  background: #edf7ff;
  border: 1px solid #b9dcfb;
  border-radius: 4px;
}

.table-action-btn::after {
  border: 0;
}

.col-checkbox {
  width: 60px;
  flex-shrink: 0;
}

.col-index {
  width: 80px;
  flex-shrink: 0;
}

.col-device-number {
  width: 180px;
  flex-shrink: 0;
}

.col-device-type {
  width: 180px;
  flex-shrink: 0;
}

.col-status {
  width: 120px;
  flex-shrink: 0;
}

.col-group {
  width: 120px;
  flex-shrink: 0;
}

.col-address {
  width: 260px;
  flex-shrink: 0;
}

.col-time {
  width: 180px;
  flex-shrink: 0;
}

.col-action {
  width: 100px;
  flex-shrink: 0;
  justify-content: center;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;

}

.page-info {
  color: #64748b;
  font-size: 13px;
}

.page-btn {
  height: 30px;
  color: #31506d;
  font-size: 13px;
  margin: 0;
  padding: 0 12px;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.page-btn::after {
  border: none;
}

.page-btn[disabled] {
  opacity: 0.5;
}

.area-panel {
  min-height: 140px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  overflow: hidden;
}

.partition-form {
  display: grid;
  grid-template-columns: 220px 120px 400px 100px;
  gap: 12px;
  align-items: end;
}

.partition-form .form-input {
  width: 100%;
}

.form-field--name,
.form-field--admin,
.form-field--desc {
  min-width: 0;
  width: 100%
}
</style>