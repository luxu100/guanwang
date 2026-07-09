<template>
    <view class="dept">
		<!-- 分区信息 -->
		<view class="dev-layout">
			<!-- 分区信息 -->
			<view class="table-panel">
				<view class="section-head">
					<text class="section-title"> 分区信息 </text>
					<view class="toolbar-panel">
						  <button class="secondary-button" @click="deptRefresh"> 刷新 </button>
						  <button class="secondary-button" @click="handleCreateDept"> 新增 </button>
						  <button class="secondary-button" :disabled="!currentDeptId || currentDeptId === 0" @click="handleEditDept"> 编辑 </button>
						  <button class="danger-button" :disabled="!currentDeptId || currentDeptId === 0" @click="handleDeleteDept"> 删除 </button>
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
					
					<view v-if="deptLoading" class="table-state col-center">加载中...</view>
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
						  <view class="col-dept-type col-center" :title="item.regionType"> {{ item.regionType || '-' }} </view>
						  <view class="col-min-level col-center"> {{ item.gisMinLevel || '-' }} </view>
						  <view class="col-max-level col-center"> {{ item.gisMaxLevel || '-' }} </view>
						  <view class="col-dept-id col-center"> {{ item.id || '-' }} </view>
						  <view class="col-sort col-center"> {{ item.sort || '-' }} </view>
						</view>
					</view>	
				</view>
			
				<view class="pagination-bar">
				  <button class="page-btn" :disabled="deptPagination.current <= 1" @click="handlePageChange(deptPagination, deptPagination.current - 1)">
				    上一页
				  </button>
				  <text class="page-info">第 {{ deptPagination.current }}  /  {{ Math.ceil(deptPagination.total / deptPagination.size) || 1 }} 页</text>
				  <button class="page-btn" :disabled="deptPagination.current >= Math.ceil(deptPagination.total / deptPagination.size)" @click="handlePageChange(deptPagination, deptPagination.current + 1)">
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
					
					<view v-if="deptDeviceLoading" class="table-state">加载中...</view>
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
				  <button class="page-btn" :disabled="deptDevicePagination.current <= 1" @click="handlePageChange(deptDevicePagination,deptDevicePagination.current - 1)">
					上一页
				  </button>
				  <text class="page-info">第 {{ deptDevicePagination.current }}  /  {{ Math.ceil(deptDevicePagination.total / deptDevicePagination.size) || 1 }} 页</text>
				  <button class="page-btn" :disabled="deptDevicePagination.current >= Math.ceil(deptDevicePagination.total / deptDevicePagination.size)" @click="handlePageChange(deptDevicePagination, deptDevicePagination.current + 1)">
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
		
			<view v-if="firstDeptFormError" class="error-summary">{{ firstDeptFormError }}</view>
		
			 <view class="dialog-body">
			   <view class="dept-dialog-form">
				  <view class="form-field">
				    <text class="form-label">分区类型</text>
				    <view class="select-field">
					    <view class="form-select form-select--dropdown" :class="{ 'form-select--open': activeSelect === 'deptType'}" @click.stop="toggleSelect('deptType')">
						   <text :class="{ 'select-placeholder': deptForm.regionType === ''}">{{getDeptTypeLabel()}}</text>
						   <text class="select-arrow"></text>
					    </view>
					    <view v-if="activeSelect === 'deptType'" class="select-menu">
						   <view v-for="item in deptTypeOptions" :key="item.value" class="select-option" 
						   :class="{ 'select-option--active': deptForm.regionType === item.value}" @click.stop="selectDeptType(item.value)">{{item.label}}</view>
					    </view>
				    </view>
				  </view>
				 
				  <view class="form-field">
				    <text class="form-label form-label--required">分区名称</text>
				    <input v-model="deptForm.deptName" class="form-input" :class="{ 'form-control--error': validationErrors.deptName }" placeholder="请输入分区名称" placeholder-class="input-placeholder" @input="clearError('deptName')"/>
					<text v-if="validationErrors.deptName" class="form-error">{{ validationErrors.deptName }}</text>
				  </view>
				 		 
				  <view class="form-field">
				    <text class="form-label">分区代码</text>
				    <input v-model="deptForm.regionCode" class="form-input" placeholder="请输入分区代码" placeholder-class="input-placeholder" />
				  </view>
				 		 
				  <view class="form-field">
				    <text class="form-label">分区范围</text>
					<view class="input-icon">
						 <input v-model="deptForm.regionScope" class="form-input form-input-icon" placeholder="请选择分区范围" placeholder-class="input-placeholder" />
						 <button class="icon-button input-icon-button" @click="openRangeDialog" >
							<text>...</text>
						 </button>
					</view>
				  </view>
				 		 
				  <view class="form-field">
				    <text class="form-label form-label--required">排序</text>
				    <input v-model="deptForm.sort" type="number" class="form-input" :class="{ 'form-control--error': validationErrors.sort }" placeholder="请输入排序" placeholder-class="input-placeholder" @input="clearError('sort')" />
					<text v-if="validationErrors.sort" class="form-error">{{ validationErrors.sort }}</text>
				  </view>
				 		 
				  <view class="form-field">
				    <text class="form-label">分区颜色</text>
					<view class="input-icon">
						 <input v-model="deptForm.regionColor" class="form-input form-input-icon" placeholder="请选择分区颜色，如#ff0000" placeholder-class="input-placeholder" />
						 <button class="icon-button input-icon-button" @click="openColorDialog" >
							<text>...</text>
						 </button>
					</view>
				  </view>
				 		 
				  <view class="form-field">
				    <text class="form-label">分区中心</text>
					<view class="input-icon">
						 <input v-model="deptForm.regionCenter" class="form-input form-input-icon" placeholder="请选择分区中心" placeholder-class="input-placeholder" />
						 <button class="icon-button input-icon-button" @click="openCenterDialog" >
							<text>...</text>
						 </button>
					</view>
				  </view>
				 		 
				  <view class="form-field">
				    <text class="form-label">缩放层级</text>
				    <input v-model="deptForm.zoomLevel" type="number" class="form-input" placeholder="请输入缩放层级" placeholder-class="input-placeholder" />
				  </view>
				 		 
				  <view class="form-field">
				    <text class="form-label">GIS显示</text>
					<checkbox :checked="deptForm.gisVisible === 1" @click="deptForm.gisVisible = !deptForm.gisVisible" />
				  </view>
				  
				  <view class="form-field">
				    <text class="form-label">GIS最小级别</text>
				    <input v-model="deptForm.gisMinLevel" type="number" class="form-input" placeholder="请输入GIS最小级别" placeholder-class="input-placeholder" />
				  </view>
				 		 
				  <view class="form-field">
				    <text class="form-label">GIS最大级别</text>
				    <input v-model="deptForm.gisMaxLevel" type="number" class="form-input" placeholder="请输入GIS最大级别" placeholder-class="input-placeholder" />
				  </view>
				 		 
				  <view class="form-field">
				    <text class="form-label">分区图标</text>
					<view class="input-icon">
						 <input v-model="deptForm.regionIcon" class="form-input form-input-icon" placeholder="请输入分区图标" placeholder-class="input-placeholder" />
						 <button class="icon-button input-icon-button" @click="handleChooseDeptIcon" >
							<text>...</text>
						 </button>
					</view>
				  </view>
				 
				  <view class="form-field">
				    <text class="form-label">所属组织</text>
					<!-- <view class="org-select-wrap" @click="openOrgDialog">
					    <input
					      class="form-input org-select-input"
					     :value="selectedOrgName"
					      placeholder="请选择所属组织"
					      disabled
					    />
					</view> -->
				    <input v-model="deptForm.organizationId" class="form-input" placeholder="请输入所属组织" />
				  </view>
				 
			   </view>
			 </view>
		
			 <view class="dialog-actions">
			   <button class="secondary-button" hover-class="secondary-button--hover" @click="closeDeptDialog">取消</button>
			   <button class="secondary-button" hover-class="secondary-button--hover" @click="resetDeptForm">清空表单</button>
			   <button class="primary-button" :disabled="submitting" hover-class="primary-button--hover" @click="handleSaveDept">{{ submitting? "保存中..." : "保存" }}</button>
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
	getDeptDeviceList,
	getDeptDevicePage,
	getDeptDeviceDetail,
} from "@/services/partition/partition";

interface DeptApiItem {
  id: number;
  deptName: string;
  regionType?: string;
  regionCode?: string;
  regionScope?: string;
  sort?: number;
  regionColor?: string;
  regionCenter?: string;
  zoomLevel?: number;
  gisVisible: boolean;
  gisMinLevel?: number;
  gisMaxLevel?: number;
  regionIcon?: string;
  organizationId?: number;
  parentId?: number;
}

type DeptTableItem = Pick<
	DeptApiItem,
	| "id"
	| "deptName"
	| "regionType"
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
	| "regionType"
	| "regionCode"
	| "regionScope"
	| "sort"
	| "regionColor"
	| "regionCenter"
	| "zoomLevel"
	| "gisVisible"
	| "gisMinLevel"
	| "gisMaxLevel"
	| "regionIcon"
	| "organizationId"
  > & {
	id?: number;
  };

interface ApiResponseLike {
  code?: number;
  msg?: string;
  data?: unknown;
}

const deptList = ref<DeptApiItem[]>([]);
const deptTableList =  computed<DeptTableItem[]>(() =>
  deptList.value.map(item => ({
    id: item.id,
    deptName: item.deptName,
    deptType: item.regionType,
    gisMinLevel: item.gisMinLevel,
    gisMaxLevel: item.gisMaxLevel,
    sort: item.sort,
  }))
);

const loadDeptList = async (page: number) => {
  deptLoading.value = true;
  
  try {
	const params: any = {
		pageNum: page,
		pageSize: deptPagination.size,
	};
    const res = await getDeptPage(params) as ApiResponseLike;
	assertSuccessResponse(res);
	
	const pageData = res.data as {
	  records: DeptApiItem[];
	  total: number;
	};
	
    deptList.value = pageData.records || [];
	console.log("分区列表", deptList.value);
	deptPagination.current = page;
	deptPagination.total = pageData.total || 0;
	
	if(currentDeptId.value == null && deptList.value.length){
		currentDeptId.value = deptList.value[0].id;
	}
  } catch (error) {
	uni.showToast({
		title: (error as {msg?: string })?.msg || "加载分区列表失败", 
		icon: "none",
	});
  } finally {
	deptLoading.value = false;
  }
};

const loadDeptDeviceList = async (page = 1) => {
  deptDeviceLoading.value = true;
  try {
    const params: any = {
      pageNum: page,
      pageSize: deptDevicePagination.size,
    };

    if (currentDeptId.value !== undefined && currentDeptId.value !== 0) {
      params.deptId = currentDeptId.value;
    }else{
		uni.showToast({ title: "请先选择分区", icon: "none" });
		return;
	}
    const res = await getDeptDevicePage(params) as ApiResponseLike;
	assertSuccessResponse(res);
    const pageData = res.data as {
      records: DeptDeviceItem[];
      total: number;
    };

    deptDeviceList.value = pageData.records || [];
	console.log("设备列表",deptDeviceList.value);
    deptDevicePagination.total = pageData.total || 0;
    deptDevicePagination.current = page;
  } catch (error){
	  uni.showToast({
	  	title: (error as {msg?: string })?.msg || "加载设备列表失败", 
	  	icon: "none",
	  });
  } finally {
    deptDeviceLoading.value = false;
  }
};

const deptRefresh = async () => {
  await loadDeptList(1);
  const currentId = currentDeptId.value;
  await loadDeptDeviceList(1);
  if (currentId != undefined) {
    const current = deptList.value.find(item => item.id === currentId);

    if (current) {
      await handleDeptTableRowClick(current);
    }
  }
};

onMounted(async () => {
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
  deviceId: number;
  gisMinLevel?: number;
  gisMaxLevel?: number;
}

const fillDeptForm = (item: DeptApiItem) => {
  Object.assign(deptForm,{
	regionTypt: item.regionType,
	deptName: item.deptName,
	regionCode: item.regionCode,
	regionScope: item.regionScope,
	sort: item.sort,
	regionColor: item.regionColor,
	regionCenter: item.regionCenter,
	zoomLevel: item.zoomLevel,
	gisVisible: item.gisVisible,
	gisMinLevel: item.gisMinLevel,
	gisMaxLevel: item.gisMaxLevel,
	regionIcon: item.regionIcon,
	organizationId: item.organizationId,
  });
};

const currentDeptId = ref<number>();
const deptPagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

const deptDevicePagination = reactive({
  current: 1,
  size: 10,
  total: 0
});

const deptLoading = ref(false);
const deptDeviceLoading = ref(false);
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

const getDeptById = (id: number): DeptApiItem | undefined => {
  return deptList.value.find(item => item.id === id);
};

const handleDeptTableRowClick = async (item: DeptTableItem) => {
  currentDeptId.value = item.id;
  selectedIds.value = [];
  deptDevicePagination.current = 1;
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
  deptDeviceLoading.value = true;
  try{
	const params: any = {
	  pageNum: 1,
	  pageSize: deptDevicePagination.size,
	  deviceId: keyword,
	  deptId: currentDeptId.value,
	};
	
	const res = await getDeptDevicePage(params) as ApiResponseLike;
	assertSuccessResponse(res);
	const pageData = res.data as {
		records: DeptDeviceItem[];
		total: number;
	};
	deptDeviceList.value = pageData.records || [];
	deptDevicePagination.current = 1;
	deptDevicePagination.total = pageData.total || 0;
  }catch (error){
	uni.showToast({
		title: (error as {msg?: string })?.msg || "搜索失败", 
		icon: "none",
	});
  }finally{
	deptDeviceLoading.value = false;
  }
};

const handleDeviceRefresh = async () => {
  if (currentDeptId.value === undefined) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }
  deviceKeyword.value = "";
  selectedIds.value = [];
  loadDeptDeviceList(1);
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

const handlePageChange = async (pagination: any, page:number) => {
	pagination.current = page;
	console.log("current", deptPagination.current);
	if(pagination == deptPagination){
		await loadDeptList(deptPagination.current);
		console.log("cuurent", deptPagination.current);
	}else if(pagination == deptDevicePagination){
		await loadDeptDeviceList(deptDevicePagination.current);
	}
};


type SelectKey = "deptType" | "" ;
type ValidationKey =
  | "deptName"
  | "sort";
  
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

const deptDialogVisible = ref(false);
const submitting = ref(false);
const isDeptCreating = ref(false);
const activeSelect = ref<SelectKey | "">("");
const firstDeptFormError = computed(() => Object.values(validationErrors).find(Boolean) || "");
const validationErrors = reactive<Record<ValidationKey, string>>(getEmptyValidationErrors());

const defaultDeptForm: DeptForm =  {
	regionType: "",
	deptName: "",
	regionCode: "",
	regionScope: "",
	sort: undefined,
	regionColor: "",
	regionCenter: "",
	zoomLevel: undefined,
	gisVisible: false,
	gisMinLevel: undefined,
	gisMaxLevel: undefined,
	regionIcon: "",
	organizationId: undefined,
};

const deptForm = reactive<DeptForm>({ ...defaultDeptForm });

function getEmptyValidationErrors(): Record<ValidationKey, string> {
  return {
    deptName: "",
    sort: "",
  };
}

const resetDeptForm = () => {
	Object.assign(deptForm, defaultDeptForm);
	clearErrors();
	activeSelect.value = "";
};

const handleCreateDept = () => {
  currentDeptId.value = undefined;
  isDeptCreating.value = true;
  resetDeptForm();
  clearErrors();
  activeSelect.value = "";
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

function toggleSelect(key: SelectKey) {
  activeSelect.value = activeSelect.value === key ? "" : key;
}

function selectDeptType(value: string) {
  deptForm.regionType = value;
  activeSelect.value = "";
}

const closeDeptDialog = () => {
  if (submitting.value) {
    return;
  }
  activeSelect.value = "";
  deptDialogVisible.value = false;
};

const getDeptTypeLabel = () => {
  const item = deptTypeOptions.find(item => item.value === deptForm.regionType);
  return item?.label || "请选择分区类型";
};

const openRangeDialog = () => {
  uni.showToast({ title: "范围选择待接入", icon: "none" });
  // rangeDialogVisible.value = true;
};

const openColorDialog = () => {
  uni.showToast({ title: "颜色选择待接入", icon: "none" });
};

const openCenterDialog = () => {
  uni.showToast({ title: "分区中心待接入", icon: "none" });
};

const handleChooseDeptIcon = () => {
  uni.chooseImage({
    count: 1,
    sizeType: ["original", "compressed"],
    sourceType: ["album", "camera"],
    success: async (res) => {
      const filePath = res.tempFilePaths[0];
	  const fileName = filePath.split("/").pop() || "";
	  
	        // input 显示文件名
	        deptForm.regionIcon = fileName;
      // uni.uploadFile({
      //   url: "你的上传接口地址",
      //   filePath,
      //   name: "file",
      //   success: (uploadRes) => {
      //     const data = JSON.parse(uploadRes.data);

      //     // 假设后端返回图片地址 data.url
      //     deptForm.deptIcon = data.url;

      //     uni.showToast({
      //       title: "上传成功",
      //       icon: "success",
      //     });
      //   },
      //   fail: () => {
      //     uni.showToast({
      //       title: "上传失败",
      //       icon: "none",
      //     });
      //   },
      // });
    },
  });
  uni.showToast({ title: "图标上传待接入", icon: "none" });
};

const openOrgDialog = () => {
  uni.showToast({ title: "所属组织待接入", icon: "none" });
};



function validateCreateForm() {
  clearErrors();
  if (deptForm.deptName === "") {
    return setError("deptName", "请输入分区名称");
  }

  if (deptForm.sort === undefined) {
    return setError("sort", "请输入排序");
  }
  return true;
}

function clearError(key: ValidationKey) {
  validationErrors[key] = "";
}

function clearErrors() {
  (Object.keys(validationErrors) as ValidationKey[]).forEach((key) => {
    validationErrors[key] = "";
  });
}

function setError(key: ValidationKey, message: string) {
  validationErrors[key] = message;
  uni.showToast({ title: message, icon: "none" });
  return false;
}

const handleSaveDept = async () => {
  if (!validateCreateForm()) {
    return;
  }
  
  submitting.value = true;
  const payload = {
    ...deptForm,
  };

  try {
	  let res;
      if (isDeptCreating.value) {
        res = await createDept(payload) as ApiResponseLike;
        uni.showToast({ title: "新增成功", icon: "success" });
      } else {
		if (!deptForm.id) {
		  uni.showToast({ title: "请先选择分区", icon: "none" });
		  return;
		}
        res = await updateDept(deptForm.id, payload) as ApiResponseLike;
        uni.showToast({ title: "保存成功", icon: "success" });
      }
	  assertSuccessResponse(res);
	  isDeptCreating.value = false;
      closeDeptDialog();
	  resetDeptForm();
      await loadDeptList(1);
  
    } catch (error) {
      uni.showToast({
        title: (error as {msg?: string })?.msg || "保存失败",
        icon: "none"
      });
    }finally{
	  submitting.value = false;
	}
};

function assertSuccessResponse(response: ApiResponseLike | undefined) {
  const code = response?.code;
  if (code === undefined || code === 0 || code === 200) {
    return;
  }

  throw {
    code,
    msg: response?.msg || "请求失败",
    data: response?.data,
  };
}

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
			await deleteDept(currentDeptId.value!, true);
			uni.showToast({ title: "删除成功", icon: "success" });
			
			currentDeptId.value = undefined;
			deptDeviceList.value = [];
			selectedIds.value = [];
			resetDeptForm();
			await loadDeptList(1);
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

.dev-layout {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  min-height: 0;
  padding: 12px 10px 12px 0;
  justify-content: space-between;
}

.toolbar-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  justify-content: space-between;
  flex-wrap: wrap;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 10px;
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

.table-row--action {
	color: #0d82ee;
	font-weight: 700;
	position: relative;
	background: #e7f3ff !important;
	box-shadow: inset 0 0 0 1px #b9dcff;
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
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 14px;
  background: rgba(15, 35, 55, 0.36);
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  // width: min(1120px, calc(100vw - 44px));
  // height: min(730px, calc(100vh - 28px));
  // max-height: calc(100vh - 28px);
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
  flex: none;
  padding: 18px 24px;
  background: #f8fbfe;
  border-bottom: 1px solid #edf3f8;
}

.dialog-title {
  display: block;
  color: #183755;
  font-size: 22px;
  font-weight: 900;
}

.dialog-subtitle {
  display: block;
  margin-top: 4px;
  color: #5f7188;
  font-size: 13px;
}

.dialog-body {
  flex: 1;
  min-height: 0;
  max-height: none;
  padding: 18px 24px 16px;
  background: #ffffff;
}

.error-summary {
  flex: none;
  margin: 12px 24px 0;
  padding: 9px 12px;
  color: #b42318;
  font-size: 13px;
  font-weight: 800;
  background: #fff5f3;
  border: 1px solid #ffc9c0;
  border-radius: 4px;
}

.form-field {
  position: relative;
  align-items: center;
  min-width: 0;
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

.input-icon-button {
  width: 38px;
  height: 38px;
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

.form-label {
  display: block;
  margin-bottom: 5px;
  color: #34495e;
  font-size: 13px;
  font-weight: 700;
}

.form-label--required::after {
  margin-left: 4px;
  color: #ef4444;
  content: "*";
}

.form-input[disabled]{
  color: #64748b;
  background: #f3f7fb;
}

.form-input,
.form-select {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  height: 38px;
  line-height: 38px;
  padding: 0 12px;
  overflow: hidden;
  color: #172033;
  font-size: 14px;
  text-overflow: ellipsis;
  background: #fbfdff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
  transition:
    border-color 0.16s ease,
    box-shadow 0.16s ease,
    background-color 0.16s ease;
}

.input-icon {
	display: flex;
	flex-wrap: nowrap;
}

.form-input-icon {
  margin-right: 5px;
  width: 82%;
}

.form-input:focus {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.form-select--dropdown {
  background: #f7fbff;
  box-shadow: inset 0 -1px 0 rgba(13, 130, 238, 0.03);
  cursor: pointer;
}

.form-select--open {
  background: #ffffff;
  border-color: #8fc8f8;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.1);
}

.form-control--error,
.form-control--error:focus {
  background: #fffafa;
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.form-error {
  display: block;
  margin-top: 5px;
  color: #d92d20;
  font-size: 12px;
  font-weight: 700;
  line-height: 1.35;
}

.select-field {
  position: relative;
}

.select-arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.select-menu {
  position: absolute;
  right: 0;
  left: 0;
  z-index: 20;
  margin-top: 4px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  box-shadow: 0 14px 28px rgba(15, 35, 55, 0.16);
  max-height: 250px;
  overflow-y: auto;
}

.select-option {
  min-height: 36px;
  padding: 0 12px;
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  line-height: 36px;
  cursor: pointer;
  border-bottom: 1px solid #edf3f8;
}

.select-option:last-child {
  border-bottom: 0;
}

.select-option:hover,
.select-option--active {
  color: #0d82ee;
  background: #edf7ff;
}

.select-placeholder {
  color: #9aa9b8;
}

.input-placeholder {
  color: #9aa9b8;
}

.color-dialog {
  width: 460px;
  background: #fff;
  border-radius: 6px;
}

.color-dialog-body {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.native-color-picker {
  width: 120px;
  height: 80px;
  padding: 0;
  border: none;
}

.color-preview {
  width: 60px;
  height: 36px;
  border: 1px solid #dcdfe6;
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

</style>