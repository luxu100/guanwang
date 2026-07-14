<template>
	<view class="dept-view">
	  <view class="toolbar-panel">
		<view class="dept-toolbar">
			<view class="filter-group">
			  <text class="filter-label">分区名称</text>
			  <input v-model="filters.deptName" class="filter-input" placeholder="请输入分区名称" placeholder-class="input-placeholder" />
			</view>
			
			<view class="filter-group">
			  <text class="filter-label">分区类型</text>
			  <picker :range="deptTypeOptions" range-key="label" :value="currentTypeIndex" @change="handleTypeChange">
			    <view class="filter-select">
			      <!-- <text>{{ currentTypeLabel }}</text> -->
				  <text>{{ getDeptTypeLabel(filters.regionType, "不限") }}</text>
				  
			      <text class="filter-select__arrow"></text>
			    </view>
			  </picker>
			</view>
			
			<view class="toolbar-actions">
				  <button class="primary-button "  @click="searchDept">查询</button>
				  <button class="secondary-button"  @click="resetFilters">重置</button>
				  <button class="secondary-button" aria-label="刷新" @click="deptRefresh">
				    <text class="icon-refresh"></text>
				  </button>
				  <button class="secondary-button" @click="handleCreateDept"> 新增分区 </button>
				  <button class="secondary-button" :disabled="!currentDeptId || currentDeptId === 0" @click="handleEditDept"> 编辑分区 </button>
				  <button class="danger-button" :disabled="!currentDeptId || currentDeptId === 0" @click="handleDeleteDept"> 删除分区 </button>
			</view>
		</view>
		
		<view class="dept-toolbar">
			<view class="filter-group">
			  <text class="filter-label">设备编号</text>
			  <input v-model="deviceKeyword" class="filter-input" placeholder="请输入设备编号" placeholder-class="input-placeholder"/>
			</view>
			<view class="toolbar-actions">
			  <button class="primary-button" @click="handleDeviceSearch"> 查询 </button>
			</view>
		</view>
		  
		  
		  
		  
<!-- 		  <view class="filter-group">
		    <text class="filter-label">gis显示</text>
		    <picker :range="worksheetStatusOptions" range-key="label" :value="currentStatusIndex" @change="handleStatusChange">
		      <view class="filter-select">
		        <text>{{ currentStatusLabel }}</text>
		        <text class="filter-select__arrow"></text>
		      </view>
		    </picker>
		  </view> -->
	  </view>
      <view class="dept">
		<!-- 分区信息 -->
		<view class="dept-layout">
			<view class="table-head">
				<text> 分区信息 </text>
				<text class="table-head__meta">共 {{ deptPagination.total }} 条</text>
			</view>

			<scroll-view class="table-scroll" scroll-x scroll-y>
				<view class="table">
					<!-- 表头 -->
					<view class="table-row table-row--header dept-table-row">
					  <view
						v-for="column in deptColumns" 
						:key="column.key"
						class="table-cell table-header-cell"
						:class="column.className" >
						<!-- 普通列 -->
						<text>{{ column.label }}</text>
					  </view>
					</view>
					
					<view v-if="deptLoading" class="table-state ">加载中...</view>
					<view v-else-if="deptTableList.length === 0" class="table-state">暂无分区信息</view>
					
					<!-- 数据 -->
					<view v-for="(item,index) in deptTableList" 
					v-else
					:key="item.id" 
					class="dept-table-row table-row"
					:class="{ 'table-row--active': currentDeptId === item.id}"
					@click="handleDeptTableRowClick(item)"
					>
					  <text class="table-cell col-index " > {{ (deptPagination.current - 1) * deptPagination.size + index + 1 }} </text>
					  <text class="table-cell col-dept-name " :title="item.deptName"> {{ item.deptName }} </text>
					  <text class="table-cell col-region-type " :title="item.regionType"> {{ getDeptTypeLabel(item.regionType, "-") }} </text>
					  <text class="table-cell col-region-color " :title="item.regionType"> 
						<view v-if="item.regionColor !== null && item.regionColor !== '' " class="color-preview" :style="{ backgroundColor: item.regionColor }"></view>
						<text v-else>-</text>
					  </text>
					  <text class="table-cell col-min-level "> {{ item.gisMinLevel || '-' }} </text>
					  <text class="table-cell col-max-level "> {{ item.gisMaxLevel || '-' }} </text>
					  <text class="table-cell col-dept-id "> {{ item.id || '-' }} </text>
					  <text class="table-cell col-sort "> {{ item.sort || '-' }} </text>
					</view>
				</view>
						
			</scroll-view>
			
			<view class="pagination-bar">
			  <button class="page-btn" :disabled="deptPagination.current <= 1" @click="handlePageChange(deptPagination, deptPagination.current - 1)">
				上一页
			  </button>
			  <text class="page-info">第 {{ deptPagination.current }}  /  {{ Math.ceil(deptPagination.total / deptPagination.size) || 1 }} 页</text>
			  <button class="page-btn" :disabled="deptPagination.current >= Math.ceil(deptPagination.total / deptPagination.size)" @click="handlePageChange(deptPagination, deptPagination.current + 1)">
				下一页
			  </button>
			  <text class="page-info">到第</text>
			    <input class="page-input" type="number" v-model.number="jumpDeptPage" @keyup.enter="handlePageChange(deptPagination,jumpDeptPage)" />
			    <text class="page-info">页</text>
			    <button class="page-btn" :disabled="jumpDeptPage === null || jumpDeptPage < 1 || jumpDeptPage > Math.ceil(deptPagination.total / deptPagination.size) " @click="handlePageChange(deptPagination,jumpDeptPage)">跳转</button>
			</view>
		</view> 
		
		<!-- 设备 -->
		<view class="device-layout">
			<view class="table-head">
				<text> 设备列表 </text>
				<text class="table-head__meta">共 {{ deptDevicePagination.total }} 条</text>
			</view>

			<scroll-view class="table-scroll" scroll-x scroll-y>
				<view class="table">
					<!-- 表头 -->
					<view class="table-row table-row--header device-table-row">
					  <view
						v-for="column in deptDeviceColumns"
						:key="column.key"
						class="table-cell table-header-cell"
						:class="column.className" >
						<!-- 普通列 -->
						<text>{{ column.label }}</text>
					  </view>
					</view>
					
					<view v-if="deptDeviceLoading" class="table-state">加载中...</view>
					<view v-else-if="deptDeviceList.length === 0" class="table-state">暂无设备数据</view>
					
					<!-- 数据 -->
					<view v-for="(item,index) in deptDeviceList" v-else :key="item.id" class="table-row device-table-row" >				
					  <view class="table-cell col-index "> {{ (deptDevicePagination.current - 1) * deptDevicePagination.size + index + 1 }} </view>			
					  <view class="table-cell col-dept-name "> {{ getDeptName() }} </view>
					  <view class="table-cell col-device-number "> {{ item.deviceNumber }} </view>
					  <view class="table-cell col-device-alias "> {{ item.deviceAlias || '-' }} </view>
					  <view class="table-cell col-state "> 
						<text class="status-pill" :class="getStatusClass(item.enableState)">
							{{ getEnableStateText(item.enableState) }}
						</text> 
					  </view>
					  <view class="table-cell col-state "> 
						<text class="status-pill" :class="getStatusClass(item.installState)">
							{{ getInstallStateText(item.installState) }}
						</text> 
					  </view>
					  <view class="table-cell col-action ">
						  <button class="table-action-btn"  @click.stop="handleCheckDevice(item)" > 查看详情 </button>
					  </view>		  
					</view>
					
				</view>
			</scroll-view>
			
		
			<view class="pagination-bar">
			  <button class="page-btn" :disabled="deptDevicePagination.current <= 1" @click="handlePageChange(deptDevicePagination,deptDevicePagination.current - 1)">
				上一页
			  </button>
			  <text class="page-info">第 {{ deptDevicePagination.current }}  /  {{ Math.ceil(deptDevicePagination.total / deptDevicePagination.size) || 1 }} 页</text>
			  <button class="page-btn" :disabled="deptDevicePagination.current >= Math.ceil(deptDevicePagination.total / deptDevicePagination.size)" @click="handlePageChange(deptDevicePagination, deptDevicePagination.current + 1)">
				下一页
			  </button>
			  <text class="page-info">到第</text>
			  <input class="page-input" type="number" v-model.number="jumpDevicePage" @keyup.enter="handlePageChange(deptDevicePagination,jumpDevicePage)" />
			  <text class="page-info">页</text>
			  <button class="page-btn" :disabled="jumpDevicePage === null || jumpDevicePage < 1 || jumpDevicePage > Math.ceil(deptDevicePagination.total / deptDevicePagination.size) " @click="handlePageChange(deptDevicePagination,jumpDevicePage)">跳转</button>
			</view>
		</view>
		
		<view v-if="deptDialogVisible" class="dialog-mask" @click="closeDeptDialog">
			<view class="dialog-panel" @click.stop="closeSelect">
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
					    <view class="form-select form-select--dropdown" :class="{ 'form-select--open': activeSelect }" @click.stop="toggleSelect">
						   <text :class="{ 'select-placeholder': deptForm.regionType === '' || deptForm.regionType === null}">{{getDeptTypeLabel(deptForm.regionType, "请选择分区类型") }}</text>
						   <text class="select-arrow"></text>
					    </view>
					    <view v-if="activeSelect" class="select-menu" >
						   <view v-for="item in deptTypeOptions.slice(1)" :key="item.value" class="select-option" 
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
					<checkbox :checked="deptForm.gisVisible === true" @click="deptForm.gisVisible = !deptForm.gisVisible" />
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
						 <input v-model="regionIconFileName" class="form-input form-input-icon" placeholder="请输入分区图标" placeholder-class="input-placeholder" />
						 <button v-if="regionIconFileName" class="field-clear" hover-class="field-clear--hover" @click.stop="removeRegionIcon">
							<view class="clear-icon"></view>
						 </button>
						 <button class="icon-button input-icon-button" @click="handleChooseRegionIcon" >
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
		
		<view v-if="deviceDialogVisible" class="dialog-mask" @click="closeDeviceDialog">
			<view class="dialog-panel" @click.stop>
			    <view class="dialog-head">
			      <view>
			        <text class="dialog-title">设备详细信息</text>
			        <text class="dialog-subtitle">查看当前设备的完整信息</text>
			      </view>
			
			      <button class="icon-button" hover-class="icon-button--hover" aria-label="关闭" @click="closeDeviceDialog">
			        <text class="close-icon"></text>
			      </button>
			    </view>
			
			    <view class="dialog-body" scroll-y>
				  <view class="device-dialog-form">
					<view class="form-section">
						<view class="table-head">
							<text class="section-title">基础信息</text>
						</view>
						<view class="form-grid">
							<view class="detail-item">
							  <text class="detail-label">设备编号</text>
							  <text class="detail-value"> {{ deviceDetail.deviceNumber || "-" }} </text>
							</view>
										
							<view class="detail-item">
							  <text class="detail-label">设备名称</text>
							  <text class="detail-value"> {{ deviceDetail?.deviceAlias ?? "-" }} </text>
							</view>
							
							<view class="detail-item">
							  <text class="detail-label">所属分区</text>
							  <text class="detail-value"> {{ getDeptName() }} </text>
							</view>
							
							<view class="detail-item">
							  <text class="detail-label">设备类型</text>
							  <text class="detail-value"> {{ deviceDetail?.deviceType ?? "-" }} </text>
							</view>
						</view>
					</view>
			        
					<view class="form-section">
						<view class="table-head">
							<text class="section-title">安装信息</text>
						</view>
						<view class="form-grid">
							<view class="detail-item">
							  <text class="detail-label">安装状态</text>
							  <text class="detail-value"> {{ getInstallStateText(deviceDetail?.installState) }} </text>
							</view>
										
							<view class="detail-item">
							  <text class="detail-label">安装模式</text>
							  <text class="detail-value"> {{ getInstallMode(deviceDetail?.installMode) }} </text>
							</view>
							
							<view class="detail-item">
							  <text class="detail-label">安装地址</text>
							  <text class="detail-value"> {{ deviceDetail?.installAddress ?? "-" }} </text>
							</view>
							
							<view class="detail-item">
							  <text class="detail-label">地理位置</text>
							  <text class="detail-value"> {{ deviceDetail.installLongitude && deviceDetail.installLatitude ? `${deviceDetail.installLongitude}, ${deviceDetail.installLatitude}` : '-'}} </text>
							</view>
						</view>
					</view>
			
					<view class="form-section">
						<view class="table-head">
							<text class="section-title">状态信息</text>
						</view>
						<view class="form-grid">
							<view class="detail-item">
							  <text class="detail-label">启用状态</text>
							  <text class="detail-value"> {{ getEnableStateText(deviceDetail?.enableState) }} </text>
							</view>
										
							<view class="detail-item">
							  <text class="detail-label">在线状态</text>
							  <text class="detail-value"> {{ getOnlineStatusText(deviceDetail?.onlineStatus) }} </text>
							</view>
							
							<view class="detail-item">
							  <text class="detail-label">渗漏状态</text>
							  <text class="detail-value"> {{ deviceDetail?.leakStatus ?? "-" }} </text>
							</view>
							
							<view class="detail-item">
							  <text class="detail-label">最后采样时间</text>
							  <text class="detail-value"> {{ deviceDetail?.lastSamplingTime ?? "-" }} </text>
							</view>
						</view>
					</view>
			
			        <view class="detail-item">
			          <text class="detail-label">管段编号</text>
			          <text class="detail-value">
			            {{ deviceDetail?.tubeNumber ?? "-" }}
			          </text>
			        </view>
					
			      </view>
			    </view>
			
			    <view class="dialog-actions">
			      <button class="primary-button" @click="closeDeviceDialog"> 确定 </button>
			    </view>
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
	getDeptDeviceBindingList,
	updateDeptDeviceBinding,
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
	| "regionColor"
	| "gisMinLevel"
	| "gisMaxLevel"
	| "sort"
	>;

type DeptKey =
	| "index"
	| "id"
	| "deptName"
	| "regionType"
	| "regionColor"
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
    regionType: item.regionType,
	regionColor: item.regionColor,
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
	jumpDeptPage.value = null;
	
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

    if (currentDeptId.value === undefined) {
		deptDeviceList.value = [];
		deptDevicePagination.total = 0;
		deptDevicePagination.current = page;
		jumpDevicePage.value = null;
      return;
	}
    const res = await getDeptDevicePage(currentDeptId.value, params) as ApiResponseLike;
	assertSuccessResponse(res);
    const pageData = res.data as {
      records: DeptDeviceItem[];
      total: number;
    };

    deptDeviceList.value = pageData.records || [];
	console.log("设备列表",deptDeviceList.value);
    deptDevicePagination.total = pageData.total || 0;
    deptDevicePagination.current = page;
	jumpDevicePage.value = null;
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
	| "index"
	| "deptName"
	| "deviceNumber"
	| "deviceAlias"
	| "enableState"
	| "installState"
	| "detail";

type DeptDeviceColumn = {
  key: DeptDeviceKey;
  label: string;
  className: string;
};

interface DeptDeviceItem {
  id: number;
  deviceNumber: string;
  deviceAlias?: string;
  deviceType?: string;
  enableState: number
  installState: number;
  installMode?: number;
  installAddress?: string;
  installLongitude?: number;
  installLatitude?: number;
  tubeNumber?: string;
  tubeBore?: string;
  leakStatus?: number;
  lastSamplingTime?: string;
  onlineStatus?: number;
}

const fillDeptForm = (item: DeptApiItem) => {
  Object.assign(deptForm,{
	id: item.id,
	regionType: item.regionType,
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
  clearDeptIconTempFile();
  regionIconFileName.value = getFileName(item.regionIcon);
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
const jumpDeptPage = ref<number | null>(null);
const jumpDevicePage = ref<number | null>(null);

const openDeptDialog = () => {
  activeSelect.value = false;
  deptDialogVisible.value = true;
};

const openDeviceDialog = () => {
  deviceDialogVisible.value = true;
};

const deptColumns: DeptColumn[] = [
  { key: "index", label: "序号", className: "col-index" },
  { key: "deptName", label: "分区名称", className: "col-dept-name" },
  { key: "regionType", label: "分区类型", className: "col-region-type" },
  { key: "regionColor", label: "分区颜色", className: "col-region-color" },
  { key: "gisMinLevel", label: "GIS最小级别", className: "col-min-level" },
  { key: "gisMaxLevel", label: "GIS最大级别", className: "col-max-level" },
  { key: "id", label: "分区ID", className: "col-dept-id" },
  { key: "sort", label: "排序", className: "col-sort" },
];

const deptDeviceColumns: DeptDeviceColumn[] = [
  { key: "index", label: "序号", className: "col-index" },
  { key: "deptName", label: "所属分区", className: "col-dept-name" },
  { key: "deviceNumber", label: "设备编号", className: "col-device-number" },
  { key: "deviceAlias", label: "设备别名", className: "col-device-alias" }, 
  { key: "enableState", label: "启用状态", className: "col-state" },
  { key: "installState", label: "安装状态", className: "col-state" },
  { key: "detail", label: "详细信息", className: "col-detail" },
];

const filters = reactive({
  deptName: "",
  regionType: "" as string,
  gisVisible: "" as number | "",
});

const getDeptById = (id: number): DeptApiItem | undefined => {
  return deptList.value.find(item => item.id === id);
};

function handleTypeChange(event: { detail: { value: number } }) {
  filters.regionType = deptTypeOptions[event.detail.value]?.value ?? "";
}

const searchDept = async () => {
  deptLoading.value = true;
  deptPagination.current = 1;
  
  const params: any = {
	  pageNum: 1,
	  pageSize: deptPagination.size,
  };
  
  const deptName = filters.deptName.trim();
  if(deptName){
	  params.deptName = deptName;
  }
  if(filters.regionType != undefined) {
	  params.regionType = filters.regionType;
  }
  
  try{
	const res = await getDeptPage(params) as ApiResponseLike;
	assertSuccessResponse(res);
	const pageData = res.data as {
		records: DeptApiItem[];
		total: number;
	};
	console.log("sous", res);
	deptList.value = pageData.records || [];
	deptPagination.total = pageData.total || 0;
	loadDeptDeviceList(1);
	jumpDeptPage.value = null;
  }catch (error){
	uni.showToast({
		title: (error as {msg?: string })?.msg || "查询分区失败", 
		icon: "none",
	});
  }finally{
	deptLoading.value = false;
  }
};

const resetFilters = async () => {
  filters.deptName = "";
  filters.regionType = "";
  filters.gisVisible = "";
  searchDept();
};

const handleDeptTableRowClick = async (item: DeptTableItem) => {
  currentDeptId.value = item.id;
  deptDevicePagination.current = 1;
  deptDeviceList.value = [];

  const dept = getDeptById(item.id);
  if (dept) {
    fillDeptForm(dept);
  }
  await loadDeptDeviceList(1);
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
	  deviceNumber: keyword,
	};
	
	const res = await getDeptDevicePage(currentDeptId.value, params) as ApiResponseLike;
	assertSuccessResponse(res);
	const pageData = res.data as {
		records: DeptDeviceItem[];
		total: number;
	};
	deptDeviceList.value = pageData.records || [];
	deptDevicePagination.current = 1;
	deptDevicePagination.total = pageData.total || 0;
	jumpDevicePage.value = null;
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
  loadDeptDeviceList(1);
};

const getDeptName = () => {
	const dept = getDeptById(currentDeptId.value!);
	return dept ? dept.deptName : "-";
};

const handlePageChange = async (pagination: any, page:number) => {
	pagination.current = page;
	console.log("current", deptPagination.current);
	if(pagination == deptPagination){
		await loadDeptList(deptPagination.current);
		jumpDeptPage.value = null;
	}else if(pagination == deptDevicePagination){
		await loadDeptDeviceList(deptDevicePagination.current);
		jumpDevicePage.value = null;
	}
};

type ValidationKey =
  | "deptName"
  | "sort";

// type OptionValue = number | string;
type SelectOption = {
  label: string;
  value: string;
};

const deptTypeOptions: SelectOption[] = [
  { label: "不限", value: "" },	
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

const deviceDialogVisible = ref(false);
const deptDialogVisible = ref(false);
const submitting = ref(false);
const activeSelect = ref(false);
const isDeptCreating = ref(false);
const firstDeptFormError = computed(() => Object.values(validationErrors).find(Boolean) || "");
const validationErrors = reactive<Record<ValidationKey, string>>(getEmptyValidationErrors());
const currentTypeIndex = computed(() => getOptionIndex(deptTypeOptions, filters.regionType));

function getOptionIndex(options: SelectOption[], value: unknown) {
  const normalized = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return Math.max(0, options.findIndex((item) => item.value === normalized));
}

function getOptionLabel(options: SelectOption[], value: unknown, fallback: string) {
  const normalized = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return options.find((item) => item.value === normalized)?.label || fallback;
}

const defaultDeptForm: DeptForm =  {
	regionType: "",
	deptName: "",
	regionCode: "",
	regionScope: "",
	sort: undefined,
	regionColor: "",
	regionCenter: "",
	zoomLevel: undefined,
	gisVisible: true,
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
	activeSelect.value = false;
	clearErrors();
};

const handleCreateDept = () => {
  currentDeptId.value = undefined;
  loadDeptDeviceList(1);
  isDeptCreating.value = true;
  resetDeptForm();
  clearDeptIconTempFile();
  regionIconFileName.value = "";
  openDeptDialog();
};

const handleEditDept = () => {
  if (currentDeptId.value === undefined) {
    uni.showToast({ title: "请先选择分区", icon: "none" });
    return;
  }else{
	isDeptCreating.value = false;
	const dept = getDeptById(currentDeptId.value);
	fillDeptForm(dept!);
	openDeptDialog();
  }
};

function toggleSelect() {
  activeSelect.value = !activeSelect.value;
}

function selectDeptType(value: string) {
  deptForm.regionType = value;
  activeSelect.value = false;
}

const closeSelect = () => {
  activeSelect.value = false;
};

const closeDeptDialog = () => {
  if (submitting.value) {
    return;
  }
  deptDialogVisible.value = false;
  activeSelect.value = false;
  clearErrors();
};

const closeDeviceDialog = () => {
	deviceDialogVisible.value = false;
}

const getDeptTypeLabel = (value: any, fallback:string) => {
  if(value === ""){
	  return fallback;
  }
  return deptTypeOptions.find((item) => item.value === value)?.label || fallback;
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


interface UploadItem {
  url: string;
  id: string;
  file?: File;
}

const regionIconFileName = ref("");
const regionIconFile = ref<UploadItem | null>(null);

const clearDeptIconTempFile = () => {
  // #ifdef H5
  if (regionIconFile.value?.url.startsWith("blob:")) {
    URL.revokeObjectURL(regionIconFile.value.url);
  }
  // #endif

  regionIconFile.value = null;
};

const removeRegionIcon = () => {
  clearDeptIconTempFile();

  regionIconFileName.value = "";

};

const getFileName = (url?: string) => {
  if (!url) return "";

  const cleanUrl = url.split("?")[0];
  return decodeURIComponent(cleanUrl.split("/").pop() || "");
};

/** 选择图片（仅本地预览，不上传） */
const handleChooseRegionIcon = () => {
  // #ifdef H5
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = false;
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
	//释放上一次创建的临时预览地址
	if(regionIconFile.value?.url && regionIconFile.value.url.startsWith("blob:")){
		URL.revokeObjectURL(regionIconFile.value.url);
	}
	regionIconFile.value = {
		url: URL.createObjectURL(file),
		id: "",
		file: file,
	};
	regionIconFileName.value = file.name;
  };
  input.click();
  // #endif
  // #ifndef H5
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
	  const filePath = res.tempFilePaths[0];
	  if(!filePath) return;
	  regionIconFile.value = {
		  url: filePath,
		  id: "",
		  file: undefined,
	  }
	  //从临时路径中提取文件名
	  regionIconFileName.value = filePath.split("/").pop() || filePath.split("\\").pop() || "图标";
    },
    fail: () => uni.showToast({ title: "取消选择", icon: "none" }),
  });
  // #endif
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
  
  // 用户本次重新选择了图片,或取消了图片
      // if (regionIconFile.value) {
      //   const uploadedUrl = await uploadDeptIcon(regionIconFile.value);
      //   deptForm.regionIcon = uploadedUrl;
      // }

  
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
		  return;
		}
        res = await updateDept(deptForm.id, payload) as ApiResponseLike;
        uni.showToast({ title: "保存成功", icon: "success" });
      }
	  assertSuccessResponse(res);
	  await loadDeptList(1);
	  deptDialogVisible.value = false;
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
			await deleteDept(currentDeptId.value!);
			uni.showToast({ title: "删除成功", icon: "success" });
			
			currentDeptId.value = undefined;
			deptDeviceList.value = [];
			resetDeptForm();
			await loadDeptList(1);
		}catch{
			uni.showToast({ title: "删除失败", icon: "none" });
		}
	  },
  });
};

const deviceDetail = ref<DeptDeviceItem | null>(null);

const handleCheckDevice = (item: DeptDeviceItem) => {
  deviceDialogVisible.value = true;
  deviceDetail.value = item;
  console.log("查看设备", item);
};

const getEnableStateText = (status: number): string => {
  switch(status) {
    case 0:
      return '停用';
    case 1:
      return '启用';
    default:
      return '-';
  }
};

const getInstallStateText = (status: number): string => {
  switch(status) {
    case 0:
      return '未安装';
    case 1:
      return '已安装';
    default:
      return '-';
  }
};


const getInstallMode = (status: number): string => {
  switch(status) {
    case 0:
      return '固定点';
    case 1:
      return '流动点';
    default:
      return '-';
  }
};

const getOnlineStatusText = (status: number): string => {
  switch(status) {
    case 0:
      return '离线';
    case 1:
      return '在线';
    default:
      return '-';
  }
};

const getLeakStatusText = (status: number): string => {
  switch(status) {
    case 0:
      return '渗漏';
    case 1:
      return '正常';
	case 2:
	  return '疑似';
	case 3:
	  return '未知';
    default:
      return '-';
  }
};

function getStatusClass(value: number) {
  if (value === 1) {
    return "status-pill--open";
  }
  return "status-pill--close";
}
</script>

<style scoped lang="scss">

.primary-button,
.secondary-button,
.danger-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  min-width: 64px;
  height: 36px;
  padding: 0 12px;
  margin: 0;

  font-size: 13px;
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

.primary-button:hover {
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

.secondary-button:hover {
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

.icon-refresh {
  position: relative;
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
}

.icon-refresh::after {
  position: absolute;
  top: -3px;
  right: -2px;
  width: 0;
  height: 0;
  content: "";
  border: 4px solid transparent;
  border-left-color: currentColor;
  transform: rotate(-20deg);
}

/* 区域标题栏 */
.table-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex: none;
  height: 50px;
  padding: 0 20px;
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
  background: #ffffff;
  border-bottom: 1px solid #edf3ed;
}

.pagination-bar,
.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.table-head__meta {
  padding: 4px 10px;
  color: #6a7f94;
  font-size: 13px;
  font-weight: 800;
  background: #f7fafc;
  border: 1px solid #e3ebf2;
  border-radius: 999px;
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

.dept-view{
	display: flex;
	flex-direction: column;
	box-sizing: border-box;
	height: 100%;
	min-height: 0;
	padding: 0 14px 14px;
	overflow: hidden;
	background: #eef4f8;
}

.dept {
  display: grid;
  grid-template-columns: 66% 34%;
  flex: 1;
  gap: 14px;
  margin-top: 14px;
  min-height: 0;
}

.toolbar-panel{
	flex: none;
	display: flex;
	gap: 12px;
	min-height: 0;
	padding: 14px;
	overflow: visible;
	justify-content: space-between;
	background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.toolbar-panel,
.dept-layout,
.device-layout{
	background: #ffffff;
	border: 1px solid #d8e6f2;
	border-radius: 6px;
	box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
}

.dept-layout,
.device-layout{
	display: flex;
	flex-direction: column;
	min-height: 0;
	min-width: 0;
	overflow: hidden;
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

.dept-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 10px;
  flex-wrap: wrap;
}

.filter-group {
  display: grid;
  align-content: start;
  gap: 6px;
  flex: 0 0 136px;
  min-width: 0;
}

.dept-toolbar .filter-group:first-child {
  flex-basis: 236px;
}

.filter-label {
  color: #52677b;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
}

.filter-input {
  box-sizing: border-box;
  width: 100%;
  color: #172033;
  font-size: 13px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  height: 27px;
  padding: 0 10px;
  line-height: 27px;
}

.filter-input,
.filter-select {
  box-sizing: border-box;
  width: 100%;
  color: #172033;
  font-size: 14px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.filter-input,
.filter-select {
  height: 34px;
  padding: 0 10px;
  line-height: 34px;
}

.filter-input,
.filter-select {
  height: 30px;
  font-size: 13px;
  font-weight: 600;
  line-height: 30px;
}

.dept-toolbar .filter-input,
.dept-toolbar .filter-select {
  height: 28px;
  line-height: 28px;
}

.dept-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
  min-width: 0;
}

.device-toolbar {
  display: flex;
  align-items: end;
  gap: 12px;
  width: 100%;
}

.filter-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.filter-select__arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 0 0 auto;
  justify-content: flex-start;
  width: auto;
  margin-left: 0;
}

.toolbar-actions {
  align-self: end;
}

.table-scroll {
  flex: 1;
  height: auto;
  min-height: 0;
  background: #ffffff;
}

.table-scroll :deep(.uni-scroll-view),
.detail-body :deep(.uni-scroll-view) {
  scrollbar-color: #9fb4c8 #edf3f8;
  scrollbar-width: thin;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar),
.detail-body::-webkit-scrollbar {
  width: 9px;
  height: 9px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-track),
.detail-body::-webkit-scrollbar-track {
  background: #edf3f8;
  border-radius: 999px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb),
.detail-body::-webkit-scrollbar-thumb {
  background: linear-gradient(90deg, #9fb4c8, #6f8ba8);
  border: 2px solid #edf3f8;
  border-radius: 999px;
}

.table-scroll :deep(.uni-scroll-view::-webkit-scrollbar-thumb:hover),
.detail-body::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(90deg, #7f9ab4, #4d6f91);
}

.table {
  width: 100%;
  background: #ffffff;
  font-size: 12px;
}

.table-row{
	display: grid;
	width: 100%;
	min-height: 42px;
	border-bottom: 1px solid #edf1f5;
	transition:
	  background 0.18s ease,
	  box-shadow 0.18s ease;
}

.dept-table-row{
	min-width: 920px;
	cursor: pointer;
	grid-template-columns: 54px minmax(180px, 1.5fr) minmax(110px, 0.82fr) minmax(110px, 0.82fr) minmax(110px, 0.8fr) minmax(110px, 0.8fr) minmax(180px, 1.5fr) minmax(60px, 1fr);
}

.device-table-row{
	min-width: 750px;
	grid-template-columns: 54px minmax(180px, 1.5fr) minmax(80px, 0.82fr) minmax(150px, 1fr) minmax(80px, 0.82fr) minmax(80px, 0.82fr) minmax(110px, 1fr);
}

.table-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  color: #20384f;
  min-height: 44px;
  font-weight: 800;
  background: #f6f9fc;
  cursor: default;
  box-shadow: 0 1px 0 #dbe7f0;
}

.table-row:not(.table-row--header):nth-child(odd) {
  background: #ffffff;
}

.table-row:not(.table-row--header):nth-child(even) {
  background: #fbfdff;
}

.table-row:not(.table-row--header):hover {
  background: #edf7ff;
  box-shadow: inset 0 0 0 1px #d7ebfb;
}

.table-row--active {
	position: relative;
	background: #e7f3ff !important;
	box-shadow: inset 0 0 0 1px #b9dcff;
}

.table-row--active::before {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  width: 3px;
  content: "";
  background: #0d82ee;
  border-radius: 0 999px 999px 0;
}

.table-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 12px;
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  border-right: 1px solid #edf1f5;
}

.table-row--header .table-cell {
	color: #415a73;
	font-size: 12px;
	letter-spacing: 0;
}

.table-cell:last-child {
  border-right: 0;
}

.col-index{
	justify-content: center;
	color: #64748b;
}

.col-enable-state{
	
}

.table-header-cell {
  gap: 5px;
  user-select: none;
}

.table-state {
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

.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-right: 5px;
  flex-shrink: 0;
}

.page-info {
  color: #64748b;
  font-size: 13px;
  padding: 10px;
}

.page-input {
  width: 40px;
  height: 30px;
  color: #31506d;
  font-size: 13px;
  padding: 0 6px;
  text-align: center;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  outline: none;
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

.device-dialog-form {
	display: flex;
	flex-direction: column;
	gap: 14px;
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

.field-clear {
  position: absolute;
  right: 46px;
  
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 30px;
  height: 30px;
  margin-left: 8px;
  color: #8b95a3;
  background: transparent;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
}

.field-clear--hover {
  background: rgba(24, 105, 227, 0.08);
  color: var(--login-primary);
}

.clear-icon {
  position: relative;
  width: 18px;
  height: 12px;
}

.clear-icon::before,
.clear-icon::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 2px;
  content: "";
  background: currentColor;
  border-radius: 2px;
  transform-origin: center;
}

.clear-icon::before { transform: translate(-50%, -50%) rotate(45deg); }
.clear-icon::after { transform: translate(-50%, -50%) rotate(-45deg); }

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
	position: relative;
	display: flex;
	flex-wrap: nowrap;
	align-items: center;
}

.form-input-icon {
  flex: 1;
  margin-right: 5px;
  padding-right:34px;
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

.status-pill{
	display: inline-flex;
	align-items: center;
	justify-content: center;
	min-width: 54px;
	height: 24px;
	padding: 0 9px;
	border: 1px solid transparent;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 800;
	line-height: 24px;
}

.status-pill--open {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.status-pill--close {
  color: #5f7186;
  background: #f3f6f9;
  border-color: #dbe4ec;
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
  width: 50px;
  height: 30px;
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

.form-section {
  padding: 0;
  background: #ffffff;
  border: 0;
  border-radius: 0;
}

.form-grid {
  display: grid;
  gap: 12px 18px;
  grid-template-columns: repeat(2, 305px);
  justify-content: start;
}

.detail-item {
  display: flex;
  min-height: 42px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.detail-label {
  width: 120px;
  flex-shrink: 0;
  font-size: 15px;
  padding: 10px 12px;
  background-color: #f5f7fa;
  color: #606266;
  box-sizing: border-box;
}

.detail-value {
  flex: 1;
  padding: 10px 12px;
  font-size: 15px;
  color: #303133;
  word-break: break-all;
  box-sizing: border-box;
}

@media (max-width: 1280px) {
  .dept-toolbar {
    gap: 10px;
  }
  
  .toolbar-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 760px) {
  .toolbar-panel {
    padding: 12px;
  }

  .dept-toolbar {
    display: grid;
  }

  .filter-group,
  .filter-group:first-child {
    flex-basis: auto;
  }

  // .date-range {
  //   display: grid;
  //   grid-template-columns: 1fr;
  // }

  // .filter-datetime {
  //   flex-basis: auto;
  //   width: 100%;
  // }

  // .filter-separator {
  //   display: none;
  // }

  .toolbar-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 980px) {
  .dept-table-row {
	min-width: 790px;
    grid-template-columns: 46px minmax(150px, 1.3fr) minmax(100px, 0.78fr) minmax(100px, 0.78fr) minmax(110px, 0.72fr) minmax(110px, 0.72fr) minmax(110px, 1.3fr) minmax(60px, 0.92fr);
  }
  
  .device-table-row {
	min-width: 670px;
    grid-template-columns: 46px minmax(150px, 1.3fr) minmax(75px, 0.78fr) minmax(130px, 0.78fr) minmax(75px, 0.78fr) minmax(75px, 0.78fr) minmax(110px, 0.78fr);
  }
}

@media (max-height: 960px) and (min-width: 981px) {
  .dept-view {
	  padding: 0 10px 10px;
  }

  // .stats-grid {
  //   gap: 8px;
  //   margin-bottom: 8px;
  // }

  // .stat-card {
  //   padding: 9px 12px 8px;
  // }

  // .stat-card::after {
  //   right: -24px;
  //   bottom: -30px;
  //   width: 76px;
  //   height: 76px;
  // }

  // .stat-card__body {
  //   margin-top: 7px;
  // }

  // .stat-card__value {
  //   font-size: 21px;
  // }

  // .stat-card__progress {
  //   height: 5px;
  //   margin-top: 8px;
  // }

  // .global-breakdown {
  //   padding: 10px 12px;
  //   margin-bottom: 10px;
  // }

  // .global-breakdown__head {
  //   margin-bottom: 8px;
  // }

  // .global-breakdown__content {
  //   gap: 10px;
  // }

  // .breakdown-section {
  //   padding: 9px 10px;
  // }

  // .breakdown-section::before {
  //   top: 9px;
  //   bottom: 9px;
  // }

  // .breakdown-section__head {
  //   margin-bottom: 7px;
  // }

  // .breakdown-list {
  //   gap: 6px 10px;
  // }

  // .breakdown-row {
  //   gap: 5px;
  //   padding: 7px 9px;
  // }

  .toolbar-panel {
    gap: 8px;
    padding: 10px 12px;
  }

  .dept-toolbar {
    gap: 8px 10px;
  }

  .filter-group {
    gap: 4px;
  }

  .filter-label {
    font-size: 11px;
  }

  .filter-input,
  .filter-select,
  .dept-toolbar .filter-input,
  .dept-toolbar .filter-select{
    height: 27px;
    font-size: 12px;
    line-height: 27px;
  }

  // .filter-datetime {
  //   flex-basis: 184px;
  //   width: 184px;
  // }

  // .filter-datetime :deep(.datetime-picker__control) {
  //   height: 28px;
  //   font-size: 12px;
  //   line-height: 28px;
  // }

  .primary-button,
  .secondary-button,
  .danger-button{
    height: 34px;
  }

  .dept {
    gap: 10px;
	margin-top: 10px;
  }

  .table-head {
    height: 42px;
    padding: 0 14px;
    font-size: 15px;
  }

  .table-row {
    min-height: 36px;
  }

  .table-row--header {
    min-height: 38px;
  }

  .table-cell {
    padding: 0 10px;
    font-size: 12px;
  }

  .status-pill, {
    min-width: 50px;
    height: 22px;
    padding: 0 8px;
    font-size: 11px;
    line-height: 22px;
  }

  // .pagination-bar {
  //   height: 42px;
  // }

  // .detail-tabs {
  //   gap: 4px;
  //   height: 40px;
  //   padding: 4px;
  // }

  // .detail-tab {
  //   font-size: 12px;
  // }

  // .detail-body {
  //   padding: 8px;
  // }

  // .detail-base-panel,
  // .detail-grid,
  // .detail-time-panel {
  //   gap: 6px;
  // }

  // .detail-summary {
  //   gap: 6px;
  //   padding: 9px 12px;
  // }

  // .detail-summary__label {
  //   font-size: 11px;
  // }

  // .detail-summary__number {
  //   margin-top: 4px;
  //   font-size: 15px;
  // }

  // .detail-summary__badges {
  //   gap: 5px;
  // }

  // .detail-summary__badge {
  //   min-width: 56px;
  //   height: 22px;
  //   line-height: 22px;
  // }

  // .detail-summary__meta {
  //   gap: 6px;
  //   padding-top: 7px;
  // }

  // .detail-summary__meta-value {
  //   margin-top: 2px;
  //   font-size: 12px;
  // }

  // .detail-item--base {
  //   grid-template-columns: 78px minmax(0, 1fr);
  //   min-height: 34px;
  //   padding: 5px 10px;
  // }

  // .detail-item__label {
  //   font-size: 11px;
  // }

  // .detail-item__value {
  //   font-size: 12px;
  //   line-height: 1.28;
  // }

  // .detail-grid--content {
  //   gap: 6px;
  // }

  // .detail-grid--content .detail-item {
  //   grid-template-columns: 74px minmax(0, 1fr);
  // }

  // .detail-grid--content .detail-item__value {
  //   min-height: 34px;
  //   padding: 9px 10px;
  //   font-size: 12px;
  //   line-height: 1.32;
  // }

  // .detail-item--note .detail-item__label {
  //   padding: 0 9px;
  // }

  // .time-section {
  //   padding: 8px 10px;
  // }

  // .detail-section-title {
  //   margin-bottom: 6px;
  //   font-size: 13px;
  // }

  // .time-list::before {
  //   top: 11px;
  //   bottom: 11px;
  //   left: 5px;
  // }

  // .time-row {
  //   grid-template-columns: 15px minmax(0, 1fr);
  //   gap: 6px;
  //   padding: 4px 0;
  // }

  // .time-row__marker {
  //   width: 8px;
  //   height: 8px;
  //   margin-top: 3px;
  //   border-width: 2px;
  // }

  // .time-row__content {
  //   grid-template-columns: 58px minmax(0, 1fr);
  //   gap: 6px;
  // }

  // .time-row__label {
  //   font-size: 11px;
  // }

  // .time-row__value {
  //   font-size: 12px;
  //   line-height: 1.28;
  // }

  // .location-row {
  //   grid-template-columns: 42px minmax(0, 1fr);
  //   gap: 7px;
  //   padding: 6px 0;
  // }

  // .location-row__label,
  // .location-row__value {
  //   font-size: 12px;
  //   line-height: 1.3;
  // }

  // .process-box__title {
  //   margin-bottom: 7px;
  //   font-size: 14px;
  // }

  // .process-box .form-field {
  //   margin-bottom: 6px;
  // }

  // .process-form-grid {
  //   gap: 6px;
  // }

  // .process-more-toggle {
  //   min-height: 28px;
  //   margin-bottom: 6px;
  //   font-size: 12px;
  // }

  // .process-more-panel {
  //   padding: 7px 7px 1px;
  //   margin-bottom: 6px;
  // }

  // .form-label {
  //   margin-bottom: 3px;
  //   font-size: 12px;
  // }

  // .form-input,
  // .form-select {
  //   height: 28px;
  //   padding: 0 8px;
  //   font-size: 12px;
  //   line-height: 28px;
  // }

  // .process-select {
  //   min-height: 28px;
  // }

  // .form-textarea {
  //   height: 44px;
  //   padding: 6px 8px;
  //   font-size: 12px;
  //   line-height: 1.3;
  // }

  // .form-textarea--compact {
  //   height: 34px;
  // }

  // .process-actions {
  //   gap: 6px;
  // }

  // .process-action {
  //   height: 28px;
  //   font-size: 12px;
  //   line-height: 28px;
  // }
}

@media (max-width: 520px) {
  // .detail-grid--base {
  //   grid-template-columns: 1fr;
  // }

  // .detail-item--base {
  //   grid-template-columns: 78px minmax(0, 1fr);
  // }

  // .detail-grid--content .detail-item {
  //   grid-template-columns: 1fr;
  // }

  // .detail-grid--content .detail-item__value {
  //   border-top: 1px solid #edf3f8;
  //   border-left: 0;
  // }

  // .detail-item--note .detail-item__label {
  //   min-height: 38px;
  // }

  // .time-row__content,
  // .location-row {
  //   grid-template-columns: 1fr;
  //   gap: 5px;
  // }
}

.dept-icon-preview {
  width: 80px;
  height: 80px;
  margin-top: 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
}

</style>