<template>
    <view class="dept">
        <!-- 分区树 -->
		<view class="dept-layout">
			<view class="tree-panel">
				<view class="section-head">
				  <text class="section-title">分区结构</text>
				  <button class="icon-button" hover-class="icon-button--hover" aria-label="刷新" @click="deptRefresh">
				    <text class="icon-refresh"></text>
				  </button>
				</view>
				<!-- 树内容 -->
				<view class="tree-content">
					<view 
					  v-for="item in deptTreeList" 
					  :key="item.id" 
					  class="tree-node" 
					  :class="{ 'tree-node--active': currentDeptId === item.id }"
					  :title="item.deptName"
					  @click="handleDeptClick(item)"
					>
						<text class="text-hidden">{{ item.deptName }}</text>
					</view>
				</view>
				
			</view>
		</view>

		<!-- 分区信息 -->
		<view class="dev-layout">
			<!-- 分区信息 -->
			<view class="table-panel">
				<view class="section-head">
					<text class="section-title"> 分区信息 </text>
					<view class="toolbar-panel">
						  <button class="secondary-button" @click="handleCreateDept"> 新增 </button>
						  <button class="secondary-button" :disabled="!currentDeptId || currentDeptId === 0" @click="handleEditDept">
						    编辑
						  </button>

						  <button
						    class="danger-button"
						    :disabled="!currentDeptId || currentDeptId === 0"
						    @click="handleDeleteDept"
						  >
						    删除
						  </button>
					</view>
				</view>

				<view class="table">
					<!-- 表头 -->
					<view class="table-row table-row--header dept-table-row">
					  <view
					    v-for="column in deptColumns" 
					    :key="column.key"
						:class="[column.className, 'col-center']" >
					    <!-- 普通列 -->
					    <text>{{ column.label }}</text>
					  </view>
					</view>
					
					<view v-if="loading" class="table-state col-center">加载中...</view>
					<view v-else-if="deptTableList.length === 0" class="table-state">暂无分区信息</view>
					
				    <!-- 数据 -->
					<view v-else>
						<view v-for="(item,index) in deptTableList" 
						:key="item.id" 
						class="table-row dept-table-row"
						:class="{ 'table-row--action': currentDeptId === item.id}"
						@click="handleDeptTableRowClick(item)"
						>
						  <view class="col-index col-center" > {{ index + 1 }} </view>
						  <view class="col-dept-name col-center" :title="item.deptName"> {{ item.deptName }} </view>
						  <view class="col-dept-type col-center" :title="item.deptType"> {{ item.deptType || '-' }} </view>
						  <view class="col-min-level col-center"> {{ item.gisMinLevel || '-' }} </view>
						  <view class="col-max-level col-center"> {{ item.gisMaxLevel || '-' }} </view>
						  <view class="col-dept-id col-center"> {{ item.id || '-' }} </view>
						  <view class="col-sort col-center"> {{ item.sort || '-' }} </view>
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
		</view> 
		
		<!-- 设备 -->
		<view class="dev-layout">
			<!-- 设备列表 -->
			<view class="table-panel">
				<view class="section-head">
					<text class="section-title"> 设备列表 </text>
					<view class="toolbar-panel">
						<view class="toolbar-left">
							<!-- 左侧查询 -->
							<input
							  v-model="deviceKeyword"
							  class="toolbar-input"
							  placeholder="请输入设备编号"
							  placeholder-class="input-placeholder"
							/>
							<button class="primary-button" @click="handleDeviceSearch"> 查询 </button>
							<button class="secondary-button" @click="handleDeviceRefresh"> 刷新 </button>
						</view>
								
						<view class="toolbar-right">
							<!-- 右侧功能按钮 -->
							<button class="secondary-button" @click="handleBatchAction"> 批量移动 </button>
							<button class="secondary-button" @click="handleImportDevice"> 导入 </button>
							<button class="secondary-button" @click="handleExportDevice"> 导出 </button>
							<button class="primary-button" @click="handleCreateDevice"> 新增设备 </button>
							<button class="danger-button" @click="handleDeleteSelectedDevice"> 删除 </button>
						</view>
					</view>
				</view>

				<view class="table">
					<!-- 表头 -->
					<view class="table-row table-row--header device-table-row">
<!-- 排序					  <view
						:class="[column.className, { 'table-header-cell': column.sortable, 'table-header-cell--active': sortState.field === column.key }]"
						@click="column.sortable && toggleSort(column.key as SortField)"
					  > -->
					  <view
						v-for="column in deptDeviceColumns"
						:key="column.key"
						:class="[column.className, 'col-center']" >
						<!-- 全选框 -->
						<checkbox-group v-if="column.key === 'checkbox'">
						  <checkbox
						    :checked="isAllSelected"
						    @click.stop="handleSelectAll"
						  />
						</checkbox-group>
						<!-- 普通列 -->
						<text>{{ column.label }}</text>
					  </view>
					</view>
					
					<view v-if="loading" class="table-state">加载中...</view>
					<view v-else-if="deptDeviceList.length === 0" class="table-state">暂无设备数据</view>
					
					<!-- 数据 -->
					<view v-else>
						<view
						  v-for="(item,index) in deptDeviceList" :key="item.id" class="table-row device-table-row" >	
						  <view class="col-checkbox col-center">
							<checkbox
							  :checked="selectedIds.includes(item.id)"
							  @click.stop="handleSelectDevice(item.id)"
							/>
						  </view>			
						  <view class="col-index col-center"> {{ index + 1 }} </view>			
						  <view class="col-dept-name col-center"> {{ getDeptName(item.deptId) }} </view>
						  <view class="col-device-id col-center"> {{ item.deviceId }} </view>
						  <view class="col-min-level col-center"> {{ item.gisMinLevel || '-' }} </view>
						  <view class="col-max-level col-center"> {{ item.gisMaxLevel || '-' }} </view>
						  <view class="col-action col-center">
							  <button class="table-action-btn" @click.stop="handleCheckDevice(item)" >
								设备详情
							  </button>
							</view>		  
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
		</view>
		
		<view v-if="deptDialogVisible" class="dialog-mask" @click="closeDeptDialog">
			<view class="dialog-panel" @click.stop>
			 <view class="dialog-head">
			   <view>
				 <text class="dialog-title">
				   {{ isDeptCreating ? "新增分区" : "编辑分区" }}
				 </text>
				 <text class="dialog-subtitle">维护分区信息</text>
			   </view>
			   <button class="icon-button" hover-class="icon-button--hover" aria-label="关闭" @click="closeDeptDialog">
				 <text class="close-icon"></text>
			   </button>
			 </view>
		
			 <view class="dialog-body">
			   <view class="dept-dialog-form">
				 <view class="form-field">
				   <text class="form-label">分区类型</text>
				   <picker class="form-picker" mode="selector" :range="deptTypeOptions" range-key="label"
				     :value="deptTypeIndex" @change="handleDeptTypeChange">
				     <view class="form-input picker-input">
				 		<text class="picker-text">{{ getDeptTypeLabel() }}</text>
				        <text class="picker-arrow"></text>
				     </view>
				   </picker>
				 </view>
				 
				 <view class="form-field">
				     <text class="form-label">分区名称</text>
				     <input v-model="deptForm.deptName" class="form-input" placeholder="请输入分区名称" />
				   </view>
				 		 
				   <view class="form-field">
				     <text class="form-label">分区代码</text>
				     <input v-model="deptForm.deptCode" class="form-input" placeholder="请输入分区代码" />
				   </view>
				 		 
				   <view class="form-field">
				     <text class="form-label">所属组织</text>
				     <input v-model="deptForm.orgId" class="form-input" placeholder="请输入所属组织" />
				   </view>
				 		 
				   <view class="form-field form-field--wide">
				     <text class="form-label">分区范围</text>
				     <textarea v-model="deptForm.deptRange" class="form-textarea" placeholder="请输入分区范围" />
				   </view>
				 		 
				   <view class="form-field">
				     <text class="form-label">排序</text>
				     <input v-model="deptForm.sort" type="number" class="form-input" placeholder="请输入排序" />
				   </view>
				 		 
				   <view class="form-field">
				     <text class="form-label">分区颜色</text>
				     <input v-model="deptForm.deptColor" class="form-input" placeholder="请输入分区颜色" />
				   </view>
				 		 
				   <view class="form-field">
				     <text class="form-label">分区中心</text>
				     <input v-model="deptForm.deptCenter" class="form-input" placeholder="请输入分区中心" />
				   </view>
				 		 
				   <view class="form-field">
				     <text class="form-label">缩放层级</text>
				     <input v-model="deptForm.zoomLevel" type="number" class="form-input" placeholder="请输入缩放层级" />
				   </view>
				 		 
				   <view class="form-field">
				     <text class="form-label">GIS显示</text>
				     <input v-model="deptForm.gisVisible" class="form-input" placeholder="请输入GIS显示" />
				   </view>
				 		 
				   <view class="form-field">
				     <text class="form-label">GIS最小级别</text>
				     <input v-model="deptForm.gisMinLevel" type="number" class="form-input" placeholder="请输入GIS最小级别" />
				   </view>
				 		 
				   <view class="form-field">
				     <text class="form-label">GIS最大级别</text>
				     <input v-model="deptForm.gisMaxLevel" type="number" class="form-input" placeholder="请输入GIS最大级别" />
				   </view>
				 		 
				   <view class="form-field">
				     <text class="form-label">分区图标</text>
				     <input v-model="deptForm.deptIcon" class="form-input" placeholder="请输入分区图标" />
				   </view>
				 
			   </view>
			 </view>
		
			 <view class="dialog-actions">
			   <button class="secondary-button" @click="closeDeptDialog">取消</button>
			   <button class="primary-button" @click="handleSaveDept">保存</button>
			 </view>
			</view>
		</view> 
    </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from "vue";
import { 
	getDeptList, 
	getDeptDetail,
	getDeptPage,
	createDept,
	updateDept,
	deleteDept,
	getPartitionDevicePage,
	getDeptDeviceList,
	getDeptDevicePage,
	getDeptDeviceDetail,
} from "@/services/partition/partition";

interface DeptApiItem {
  id: number;
  deptName: string;
  deptType?: string;
  deptCode?: number;
  deptRange?: string;
  sort?: number;
  deptColor?: string;
  deptCenter?: string;
  zoomLevel?: number;
  gisVisible: number;
  gisMinLevel?: number;
  gisMaxLevel?: number;
  deptIcon?: string;
  orgId?: number;
  created?: string;
  updatedAt?: string
  parentId?: number;
}

type DeptTableItem = Pick<
	DeptApiItem,
	| "id"
	| "deptName"
	| "deptType"
	| "gisMinLevel"
	| "gisMaxLevel"
	| "sort"
	>;

type DeptKey =
	| "index"
	| "id"
	| "deptName"
	| "deptType"
	| "gisMinLevel"
	| "gisMaxLevel"
	| "sort";

type DeptForm = Pick<
	DeptApiItem,
	| "deptName"
	| "deptType"
	| "deptCode"
	| "deptRange"
	| "sort"
	| "deptColor"
	| "deptCenter"
	| "zoomLevel"
	| "gisVisible"
	| "gisMinLevel"
	| "gisMaxLevel"
	| "deptIcon"
	| "orgId"
  > & {
	id?: number;
  };

interface DeptTreeItem {
  id: number;
  deptName: string;
  parentId?: number;
  isAll?: boolean;
}

const deptList = ref<DeptApiItem[]>([]);
const allDeptTableList =  computed<DeptTableItem[]>(() =>
  deptList.value.map(item => ({
    id: item.id,
    deptName: item.deptName,
    deptType: item.deptType,
    gisMinLevel: item.gisMinLevel,
    gisMaxLevel: item.gisMaxLevel,
    sort: item.sort,
  }))
);

const deptTableList = computed<DeptTableItem[]>(() => {
  if (currentDeptId.value === undefined || currentDeptId.value === 0) {
    return allDeptTableList.value;
  }

  return allDeptTableList.value.filter(item => item.id === currentDeptId.value);
});

const deptTreeList = computed<DeptTreeItem[]>(() => [
  {
    id: 0,
    deptName: "所有分区",
    parentId: 0,
    isAll: true,
  },
  ...deptList.value.map(item => ({
    id: item.id,
    deptName: item.deptName,
    parentId: item.parentId,
  })),
]);

const loadDeptList = async () => {
  try {
    const res = await getDeptList();
    deptList.value = (res.data as DeptApiItem[]) || [];
	// console.log("分区列表", deptList.value);
  } catch (e:any) {
    console.error("获取分区列表失败",e);
  }
};

const loadDeptDeviceList = async (page = 1) => {
  loading.value = true;

  try {
    const params: any = {
      pageNum: page,
      pageSize: pagination.size,
    };

    if (currentDeptId.value !== undefined && currentDeptId.value !== 0) {
      params.deptId = currentDeptId.value;
    }
	
    const res = await getDeptDevicePage(params);
	// console.log("设备列表", res)
    const pageData = res.data as {
      records: DeptDeviceItem[];
      total: number;
    };

    deptDeviceList.value = pageData.records || [];
    pagination.total = pageData.total || 0;
    pagination.current = page;
  } finally {
    loading.value = false;
  }
};

const deptRefresh = async () => {
  const currentId = currentDeptId.value;
  await loadDeptList();
  await loadDeptDeviceList(1);
  if (currentId != undefined) {
    const current = deptTreeList.value.find(item => item.id === currentId);

    if (current) {
      await handleDeptClick(current);
    }
  }
}; 

onMounted(async () => {
  currentDeptId.value = 0;
  await deptRefresh();
});

type DeptColumn = {
  key: DeptKey;
  label: string;
  className: string;
};

type DeptDeviceKey =
	| "checkbox"
	| "index"
	| "deptId"
	| "deviceId"
	| "gisMinLevel"
	| "gisMaxLevel"
	| "detail"
	| "operation";

type DeptDeviceColumn = {
  key: DeptDeviceKey;
  label: string;
  className: string;
};

interface DeptDeviceItem {
  id: number;
  deptId: number;
  deviceId: string;
  gisMinLevel?: number;
  gisMaxLevel?: number;
}

interface DevicePageResult {
  current: number;
  pages: number;
  size: number;
  total: number;
  records: any[];
}

const fillDeptForm = (item: DeptApiItem) => {
  Object.assign(deptForm,{
	deptTypt: item.deptType,
	deptName: item.deptName,
	deptCode: item.deptCode,
	deptRange: item.deptRange,
	sort: item.sort,
	deptColor: item.deptColor,
	deptCenter: item.deptCenter,
	zoomLevel: item.zoomLevel,
	gisVisible: item.gisVisible,
	gisMinLevel: item.gisMinLevel,
	gisMaxLevel: item.gisMaxLevel,
	deptIcon: item.deptIcon,
	orgId: item.orgId,
  });
};

const currentDeptId = ref<number>();
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
});
const deptDialogVisible = ref(false);
const isDeptCreating = ref(false);
const loading = ref(false);
const deptDeviceList = ref<DeptDeviceItem[]>([]);
const deviceKeyword = ref("");
const selectedIds = ref<number[]>([]);
const DeptKeyword = ref("");

const openDeptDialog = () => {
  deptDialogVisible.value = true;
};

const deptColumns: DeptColumn[] = [
  { key: "index", label: "序号", className: "col-index" },
  { key: "deptName", label: "分区名称", className: "col-dept-name" },
  { key: "deptType", label: "分区类型", className: "col-dept-type" },
  { key: "gisMinLevel", label: "GIS最小级别", className: "col-min-level" },
  { key: "gisMaxLevel", label: "GIS最大级别", className: "col-max-level" },
  { key: "id", label: "分区ID", className: "col-dept-id" },
  { key: "sort", label: "排序", className: "col-sort" },
];

const deptDeviceColumns: DeptDeviceColumn[] = [
  { key: "checkbox", label: "", className: "col-checkbox" },
  { key: "index", label: "序号", className: "col-index" },
  { key: "deptId", label: "所属分区", className: "col-dept-name" },
  { key: "deviceId", label: "设备编号", className: "col-device-id" },
  { key: "gisMinLevel", label: "GIS最小级别", className: "col-min-level" },
  { key: "gisMaxLevel", label: "GIS最大级别", className: "col-max-level" },
  { key: "detail", label: "详细信息", className: "col-detail" },
];

const handleDeptClick = async (item: DeptTreeItem) => {
	if(!item.isAll){
		fillDeptForm(item as DeptApiItem);
	}else{
		resetDeptForm(); //所有分区
	}
	selectedIds.value = [];
	currentDeptId.value = item.id;
	pagination.current = 1; //重置到第一页
	deptDeviceList.value = [];
	await loadDeptDeviceList(1);
};

const getDeptById = (id: number): DeptApiItem | undefined => {
  return deptList.value.find(item => item.id === id);
};

const handleDeptTableRowClick = async (item: DeptTableItem) => {
  currentDeptId.value = item.id;
  selectedIds.value = [];
  pagination.current = 1;
  deptDeviceList.value = [];

  const dept = getDeptById(item.id);
  if (dept) {
    fillDeptForm(dept);
  }
  await loadDeptDeviceList(1);
};

const handleSelectDevice = (id: number) => {
  const index = selectedIds.value.indexOf(id);

  if (index > -1) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
};

const handleDeviceSearch = async () => {
  if (currentDeptId.value === undefined) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }
  const keyword = deviceKeyword.value.trim();
  pagination.current = 1;
  deptDeviceList.value = [];
  loading.value = true;
  try{
	const res = await getPartitionDevicePage(currentDeptId.value, {
	  pageNum: pagination.current,
	  pageSize: pagination.size,
	  deviceNumber: keyword,
	});
	const pageData = res.data as DevicePageResult;
	deptDeviceList.value = pageData.records || [];
	pagination.total = pageData.total || 0;
  }finally{
	loading.value = false;
  }
};

const handleDeviceRefresh = async () => {
  if (currentDeptId.value === undefined) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }
  deviceKeyword.value = "";
  selectedIds.value = [];
  deptDeviceList.value = [];
  loading.value = true;
  
  try{
	const res = await getPartitionDevicePage(currentDeptId.value, {
	  pageNum: pagination.current,
	  pageSize: pagination.size,
	});
	
	const pageData = res.data as DevicePageResult;
	deptDeviceList.value = pageData.records || [];
	pagination.total = pageData.total || 0;
	
	uni.showToast({ title: "刷新成功", icon: "success" });
	  
  }finally{
	loading.value = false;
  }
};

const getDeptName = (deptId: number): string => {
  const dept = deptList.value.find(item => item.id === deptId);
  return dept ? dept.deptName : "-";
};

const isAllSelected = computed(() => {
  if (deptDeviceList.value.length === 0) {
    return false;
  }

  return deptDeviceList.value.every(item => selectedIds.value.includes(item.id));
});

const handleSelectAll = () => {
  if (isAllSelected.value) {
    selectedIds.value = [];
  } else {
    selectedIds.value = deptDeviceList.value.map(item => item.id);
  }
};


const handlePageChange = async (page:number) => {

  pagination.current = page;
  if (currentDeptId.value === undefined) {
    return;
  }
  await loadDeptDeviceList(1);
};

const deptForm = reactive<DeptForm>({
  deptType: "",
  deptName: "",
  deptCode: undefined,
  deptRange: "",
  sort: undefined,
  deptColor: "",
  deptCenter: "",
  zoomLevel: undefined,
  gisVisible: 1,
  gisMinLevel: undefined,
  gisMaxLevel: undefined,
  deptIcon: "",
  orgId: undefined,
});

const resetDeptForm = () => {
  Object.assign(deptForm,{
	deptType: "",
	deptName: "",
	deptCode: undefined,
	deptRange: "",
	sort: undefined,
	deptColor: "",
	deptCenter: "",
	zoomLevel: undefined,
	gisVisible: 1,
	gisMinLevel: undefined,
	gisMaxLevel: undefined,
	deptIcon: "",
	orgId: undefined,
  });
};

const handleCreateDept = () => {
  currentDeptId.value = undefined;
  isDeptCreating.value = true;
  resetDeptForm();
  openDeptDialog();
};

const handleCheckDevice = (item: any) => {
  // console.log("编辑设备", item);
  uni.showToast({
    title: `编辑设备：${item.deviceId}`,
    icon: "none"
  });
};

const handleEditDept = () => {
  if (currentDeptId.value === undefined) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }
  isDeptCreating.value = false;
  openDeptDialog();
};

const closeDeptDialog = () => {
  deptDialogVisible.value = false;
};

const deptTypeOptions = [
  { label: "漏水噪音监测终端", value: "0" },
  { label: "测压点", value: "1" },
  { label: "测流点", value: "2" },
  { label: "消火栓", value: "3" },
  { label: "水锤", value: "4" },
  { label: "温振", value: "5" },
  { label: "取水栓", value: "6" },
  { label: "远控蝶阀", value: "7" },
  { label: "智能井盖", value: "8" },
  { label: "电子界桩", value: "9" },
  { label: "超级水表", value: "10" },
  { label: "H86Q", value: "11" },
];

const deptTypeIndex = computed(() => {
	const index = deptTypeOptions.findIndex(
		item => item.value === deptForm.deptType);
    return index === -1 ? 0 : index;
});

const handleDeptTypeChange = (e: any) => {
  const index = Number(e.detail.value);
  deptForm.deptType = deptTypeOptions[index].value;
};

const getDeptTypeLabel = () => {
  const item = deptTypeOptions.find(item => item.value === deptForm.deptType);
  return item?.label || "请选择分区类型";
};

const handleSaveDept = async () => {
  if (!deptForm.deptName.trim()) {
    uni.showToast({ title: "请输入分区名称", icon: "none" });
    return;
  }

  const payload = {
    ...deptForm,
  };

  try {
      if (isDeptCreating.value) {
        await createDept(payload);
        uni.showToast({ title: "新增成功", icon: "success" });
      } else {
		if (!deptForm.id) {
		  uni.showToast({ title: "请先选择分区", icon: "none" });
		  return;
		}
        await updateDept(deptForm.id, payload);
  
        uni.showToast({ title: "保存成功", icon: "success" });
      }
	  isDeptCreating.value = false;
      closeDeptDialog();
	  resetDeptForm();
      await loadDeptList();
  
    } catch (e) {
      uni.showToast({
        title: "保存失败",
        icon: "none"
      });
    }
};

const handleDeleteDept = async () => {
  if (currentDeptId.value === undefined) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }
  uni.showModal({
      title: "删除确认",
      content: "确认删除当前分区吗？",
      success: async (res) => {
        if (!res.confirm) return;
		try{
			await deleteDept(currentDeptId.value!);
			uni.showToast({ title: "删除成功", icon: "success" });
			
			currentDeptId.value = undefined;
			deptDeviceList.value = [];
			selectedIds.value = [];
			resetDeptForm();
			await loadDeptList();
		}catch{
			uni.showToast({ title: "删除失败", icon: "none" });
		}
	  },
  });
};

const handleBatchAction = () => {
  if (selectedIds.value.length === 0) {
    uni.showToast({ title: "请先选择设备", icon: "none" });
    return;
  }

  uni.showToast({ title: "批量操作待接入", icon: "none" });
};

const handleImportDevice = () => {
  if (currentDeptId.value === undefined || currentDeptId.value === 0) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }
  uni.showToast({ title: "导入功能待接入", icon: "none" });
};

const handleExportDevice = () => {
  if (currentDeptId.value === undefined || currentDeptId.value === 0) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }

  uni.showToast({ title: "导出功能待接入", icon: "none" });
};

const handleCreateDevice = () => {
  if (currentDeptId.value === undefined || currentDeptId.value === 0) {
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

</script>


<style scoped lang="scss">
.dept {
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
  flex: none;
  min-width: 40px;
  height: 30px;
  padding: 0 5px;
  margin: 0;

  font-size: 12px;
  font-weight: 700;
  border-radius: 4px;
  max-width: 100px;
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
  gap: 10px;
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
  flex-shrink: 0;
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

.text-hidden{
	flex: 1;
	overflow: hidden;
	white-space: nowrap;
	text-overflow: ellipsis;
}

/* placeholder */
.input-placeholder {
  color: #9aa9b8;
}

.dept-layout {
  min-width: 200px;
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
  justify-content: space-between;
}

// 分区刷新
.icon-refresh {
  position: relative;
  width: 15px;
  height: 15px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
}

.icon-refresh::after {
  position: absolute;
  top: -4px;
  right: -2px;
  width: 6px;
  height: 6px;
  content: "";
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: rotate(25deg);
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

.tree-node {
  display: flex;
  align-items: center;
  min-height: 36px;
  padding: 0 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
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
  gap: 10px;
  justify-content: space-between;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.toolbar-input {
  width: 120px;
  height: 30px;
  padding: 0 12px;
  font-size: 12px;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.sort-indicator {
  position: relative;
  flex: none;
  width: 12px;
  height: 14px;
  color: #9cafc1;
}

.sort-indicator::before,
.sort-indicator::after {
  position: absolute;
  left: 3px;
  width: 0;
  height: 0;
  content: "";
  border-right: 3px solid transparent;
  border-left: 3px solid transparent;
}

.sort-indicator::before {
  top: 1px;
  border-bottom: 4px solid currentColor;
}

.sort-indicator::after {
  bottom: 1px;
  border-top: 4px solid currentColor;
}

.sort-indicator--asc::before,
.sort-indicator--desc::after {
  color: #0d82ee;
}

.sort-indicator--asc::after,
.sort-indicator--desc::before,
.sort-indicator--idle {
  opacity: 0.46;
}

.table {
  flex: 1;
  width: 100%;
  min-height: 0px;
  font-size: 12px;
  overflow: auto;
}

.table-panel {
  flex: 1;
  min-height: 0px;
  padding: 5px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  overflow: hidden;
}

.table-header-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-weight: 700;
  cursor: pointer;
}

.table-header-cell:hover {
	background: #edf7ff;
	color: #0d82ee;
}

.table-header-cell--active {
  color: #0d82ee !important;
  background: #eaf5ff;
}

.table-header-cell text {
  white-space: nowrap;
}

.table-row {
  display: grid;
  min-width: 700px;
  width: 100%;
  min-height: 42px;
  border-bottom: 1px solid #edf1f5;
}

.dept-table-row{
	grid-template-columns: 50px 180px 100px 110px 110px 180fr 60px;
}

.device-table-row{
	grid-template-columns: 50px 50px 180px 80px 110px 110px 100px;
}

.table-row:not(.table-row--header):nth-child(odd) {
  background: #ffffff;
}

.table-row:not(.table-row--header):nth-child(even) {
  background: #fbfdff;
}

.table-row:not(.table-row--header):hover {
  background: #edf7ff;
}

.table-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 44px;
  background: #f6f9fc;
  font-size: 12px;
  font-weight: 800;
  box-shadow: 0 1px 0 #dbe7f0;
}

.table-row > view {
  display: flex;
  align-items: center;
  padding: 0 5px;
  box-sizing: border-box;
}

.table-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 100%;
  height: 120px;
  height: 180px;
  color: #7c8da1;
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}

.table-action-btn {
  min-width: 56px;
  height: 28px;
  padding: 0 10px;
  margin: 0;
  color: #0d82ee;
  font-size: 12px;
  line-height: 28px;
  background: #edf7ff;
  border: 1px solid #b9dcfb;
  border-radius: 4px;
}

.table-action-btn::after {
  border: 0;
}

.col-center{
	justify-content: center;
	flex-shrink: 0;
}

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;

}

.page-info {
  color: #64748b;
  font-size: 13px;
  padding: 10px;
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

.dept-dialog-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px 18px;
}

.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: rgba(15, 35, 55, 0.36);
}

.dialog-panel {
  width: 560px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  box-shadow: 0 18px 46px rgba(15, 35, 55, 0.2);
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  background: #f8fbfe;
  border-bottom: 1px solid #edf3f8;
}

.dialog-title {
  display: block;
  color: #183755;
  font-size: 20px;
  font-weight: 900;
}

.dialog-subtitle {
  display: block;
  margin-top: 4px;
  color: #5f7188;
  font-size: 13px;
}

.dialog-body {
  padding: 18px 24px;
  background: #ffffff;
}

.form-field {
  align-items: center;
  margin-bottom: 16px;
}

.form-field--wide {
  grid-column: span 2;
}

.form-textarea {
  box-sizing: border-box;
  width: 100%;
  height: 90px;
  padding: 9px 12px;
  color: #172033;
  font-size: 14px;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 22px;
  background: #ffffff;
  border-top: 1px solid #edf3f8;
}

.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  
  width: 32px;
  height: 32px;
  padding: 0;
  margin: 0;
  flex-shrink: 0;
  color: #64748b;
  background: #f6fbff;
  border: 1px solid #d9e7f3;
  border-radius: 4px;
}

.icon-button::after {
	border: 0;
}

.icon-button--hover {
  color: #0d82ee;
  background: #edf7ff;
}

.close-icon {
  position: relative;
  width: 14px;
  height: 14px;
}

.close-icon::before,
.close-icon::after {
  position: absolute;
  top: 6px;
  left: 0px;
  width: 14px;
  height: 2px;
  content: "";
  background: currentColor;
  border-radius: 2px;
}

.close-icon::before {
  transform: rotate(45deg);
}

.close-icon::after {
  transform: rotate(-45deg);
}

/* 输入框 */
.form-input {
  box-sizing: border-box;
  height: 38px;
  padding: 0 12px;
  color: #172033;
  font-size: 12px;
  line-height: 38px;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background-color 0.16s ease;
}
.form-picker{
	flex: 1;
	width: 100%;
	display: block;
}
.form-input:focus {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.form-label {
  display: block;
  margin-bottom: 5px;
  color: #34495e;
  font-size: 12px;
  font-weight: 700;
}

.form-input[disabled]{
  color: #64748b;
  background: #f3f7fb;
}

.picker-input {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.picker-text {
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-sizing: border-box;
  width: 100%;
  color: #172033;
  font-size: 14px;
  background: #f9fcff;
  border-radius: 4px;
  height: 27px;
  line-height: 27px;
}

.picker-arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

</style>