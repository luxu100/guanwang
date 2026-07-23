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
				  <button class="secondary-button" @click="handleCreateDept"> {{ localeText("新增", "Add") }} </button>
				  <button class="secondary-button" :disabled="!currentDeptId || currentDeptId === 0" @click="handleEditDept"> {{ localeText("编辑", "Edit") }} </button>
				  <button class="danger-button" :disabled="!currentDeptId || currentDeptId === 0" @click="handleDeleteDept"> {{ localeText("删除", "Delete") }} </button>
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
				<text class="table-head__meta">{{ localizedTotal(deptPagination.total) }}</text>
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
				{{ localeText("上一页", "Previous") }}
			  </button>
			  <text class="page-info">{{ localizedPageInfo(deptPagination.current, Math.ceil(deptPagination.total / deptPagination.size) || 1) }}</text>
			  <button class="page-btn" :disabled="deptPagination.current >= Math.ceil(deptPagination.total / deptPagination.size)" @click="handlePageChange(deptPagination, deptPagination.current + 1)">
				{{ localeText("下一页", "Next") }}
			  </button>
			  <text class="page-info">{{ localeText("到第", "Go to") }}</text>
			    <input class="page-input" type="number" v-model.number="jumpDeptPage" @keyup.enter="handlePageChange(deptPagination,jumpDeptPage)" />
			    <text class="page-info">{{ localeText("页", "page") }}</text>
			    <button class="page-btn" :disabled="jumpDeptPage === null || jumpDeptPage < 1 || jumpDeptPage > Math.ceil(deptPagination.total / deptPagination.size) " @click="handlePageChange(deptPagination,jumpDeptPage)">{{ localeText("跳转", "Go") }}</button>
			</view>
		</view> 
		
		<!-- 设备 -->
		<view class="device-layout">
			<view class="table-head">
				<text> 设备列表 </text>
				<text class="table-head__meta">{{ localizedTotal(deptDevicePagination.total) }}</text>
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
						  <button class="table-action-btn"  @click.stop="handleCheckDevice(item)" > {{ localeText("查看详情", "View") }} </button>
					  </view>		  
					</view>
					
				</view>
			</scroll-view>
			
		
			<view class="pagination-bar">
			  <button class="page-btn" :disabled="deptDevicePagination.current <= 1" @click="handlePageChange(deptDevicePagination,deptDevicePagination.current - 1)">
				{{ localeText("上一页", "Previous") }}
			  </button>
			  <text class="page-info">{{ localizedPageInfo(deptDevicePagination.current, Math.ceil(deptDevicePagination.total / deptDevicePagination.size) || 1) }}</text>
			  <button class="page-btn" :disabled="deptDevicePagination.current >= Math.ceil(deptDevicePagination.total / deptDevicePagination.size)" @click="handlePageChange(deptDevicePagination, deptDevicePagination.current + 1)">
				{{ localeText("下一页", "Next") }}
			  </button>
			  <text class="page-info">{{ localeText("到第", "Go to") }}</text>
			  <input class="page-input" type="number" v-model.number="jumpDevicePage" @keyup.enter="handlePageChange(deptDevicePagination,jumpDevicePage)" />
			  <text class="page-info">{{ localeText("页", "page") }}</text>
			  <button class="page-btn" :disabled="jumpDevicePage === null || jumpDevicePage < 1 || jumpDevicePage > Math.ceil(deptDevicePagination.total / deptDevicePagination.size) " @click="handlePageChange(deptDevicePagination,jumpDevicePage)">{{ localeText("跳转", "Go") }}</button>
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
						 <input v-model="deptForm.regionCenter" class="form-input form-input-icon" disabled placeholder="请选择分区中心" placeholder-class="input-placeholder" />
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
					<view v-if="regionIconPreviewVisible" class="region-icon-preview">
					  <image
					    class="region-icon-preview__image"
					    :src="regionIconPreviewUrl"
					    mode="aspectFit"
					    @load="handleRegionIconPreviewLoad"
					    @error="handleRegionIconPreviewError"
					  />
					</view>
				  </view>
				 
				  <view class="form-field">
				    <text class="form-label">所属组织</text>
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

	  <view v-if="colorDialogVisible" class="dialog-mask" @click="closeColorDialog">
	    <view class="dialog-panel color-picker-panel" @click.stop>
	      <view class="dialog-head">
	        <text class="dialog-title">选择分区颜色</text>
			<button class="icon-button" hover-class="icon-button--hover" aria-label="关闭" @click="closeColorDialog">
				<text class="close-icon"></text>
			</button>
	      </view>

	      <view class="dialog-body color-picker-body">
	        <view class="color-picker-content">
	          <view
	            id="partition-color-board"
	            ref="colorBoardRef"
	            class="color-board"
	            :style="{ backgroundColor: colorHueBase }"
	            @click.stop="handleColorBoardClick"
	            @tap.stop="handleColorBoardTap"
	            @mousedown="handleColorBoardMouseDown"
	            @touchstart.stop.prevent="handleColorBoardTouch"
	            @touchmove.stop.prevent="handleColorBoardTouch"
	          >
	            <view class="color-board__white"></view>
	            <view class="color-board__black"></view>
	            <view
	              class="color-board__cursor"
	              :style="{ left: `${colorSaturation}%`, top: `${100 - colorValue}%` }"
	            ></view>
	          </view>
	
	          <view
	            id="partition-color-hue"
	            ref="colorHueRef"
	            class="color-hue-slider"
	            @click.stop="handleColorHueClick"
	            @tap.stop="handleColorHueTap"
	            @mousedown="handleColorHueMouseDown"
	            @touchstart.stop.prevent="handleColorHueTouch"
	            @touchmove.stop.prevent="handleColorHueTouch"
	          >
	            <view
	              class="color-hue-slider__cursor"
	              :style="{ top: `${(colorHue / 360) * 100}%` }"
	            ></view>
	          </view>
	
	          <view class="color-control-panel">
	            <view class="color-current" :style="{ backgroundColor: colorTempHex }"></view>
	
	            <view class="color-input-list">
	              <view class="color-input-row">
	                <text class="color-input-label">R</text>
	                <input
	                  class="color-number-input"
	                  type="number"
	                  :value="colorRgb.r"
	                  @input="handleColorRgbInput('r', $event)"
	                />
	              </view>
	              <view class="color-input-row">
	                <text class="color-input-label">G</text>
	                <input
	                  class="color-number-input"
	                  type="number"
	                  :value="colorRgb.g"
	                  @input="handleColorRgbInput('g', $event)"
	                />
	              </view>
	              <view class="color-input-row">
	                <text class="color-input-label">B</text>
	                <input
	                  class="color-number-input"
	                  type="number"
	                  :value="colorRgb.b"
	                  @input="handleColorRgbInput('b', $event)"
	                />
	              </view>
	              <view class="color-input-row color-input-row--hex">
	                <text class="color-input-label">#</text>
	                <input
	                  class="color-hex-input"
	                  type="text"
	                  maxlength="6"
	                  :value="colorHexInput"
	                  @input="handleColorHexInput"
	                  @blur="normalizeColorHexInput"
	                />
	              </view>
	            </view>
	          </view>
	        </view>
	      </view>

	      <view class="dialog-actions">
	        <button class="primary-button" @click="confirmColor">确定</button>
	        <button class="secondary-button" @click="closeColorDialog">取消</button>
	      </view>
	    </view>
	  </view>

	  <view v-if="rangeDialogVisible" class="dialog-mask" @click="closeRangeDialog">
	    <view class="range-dialog" @click.stop>
	      <view class="dialog-head">
	        <view>
	          <text class="dialog-title">选择分区范围</text>
	        </view>
	        <button class="icon-button" hover-class="icon-button--hover" aria-label="关闭" @click="closeRangeDialog">
	          <text class="close-icon"></text>
	        </button>
	      </view>

	      <view class="range-dialog-body">
	        <view ref="rangeMapWrapRef" class="range-map-wrap" :class="{ 'range-map-wrap--drawing': rangeDrawing }">
	          <!-- #ifdef H5 -->
	          <div ref="rangeNativeMapRef" class="range-native-map"></div>
	          <view v-if="rangePointPositions.length > 0" class="range-marker-layer">
	            <view
	              v-for="(point, index) in rangePointPositions"
	              :key="point.id"
	              class="range-point-marker"
	              :class="{ 'range-point-marker--active': selectedRangePointId === point.id }"
	              :style="{ left: `${point.x}px`, top: `${point.y}px` }"
	              @pointerdown.stop.prevent="startRangePointDrag(point.id, $event)"
	            >
	              <text>{{ index + 1 }}</text>
	            </view>
	          </view>
	          <view v-if="rangeMapError" class="range-map-error">{{ rangeMapError }}</view>
	          <!-- #endif -->
	          <!-- #ifndef H5 -->
	          <view class="center-map-fallback">地图绘制仅支持 H5 端</view>
	          <!-- #endif -->
	        </view>

	        <view class="range-coordinate-form">
	          <view class="form-field range-coordinate-form__location">
	            <text class="form-label">位置</text>
	            <input
	              v-model="rangeLocationText"
	              class="form-input"
	              confirm-type="search"
	              placeholder="请输入地点或公司名称"
	              placeholder-class="input-placeholder"
	              @input="markRangeLocationEdited"
	              @confirm="searchRangeLocation"
	            />
	          </view>
	          <view class="form-field">
	            <text class="form-label">经度</text>
	            <input
	              v-model="rangeLngText"
	              class="form-input"
	              confirm-type="search"
	              @input="markRangeCoordinateEdited"
	              @confirm="searchRangeLocation"
	            />
	          </view>
	          <view class="form-field">
	            <text class="form-label">纬度</text>
	            <input
	              v-model="rangeLatText"
	              class="form-input"
	              confirm-type="search"
	              @input="markRangeCoordinateEdited"
	              @confirm="searchRangeLocation"
	            />
	          </view>
	          <view class="form-field">
	            <text class="form-label">&nbsp;</text>
	            <button
	              class="secondary-button range-search-button"
	              :disabled="rangeSearchDisabled"
	              hover-class="secondary-button--hover"
	              @click="searchRangeLocation"
	            >
	              {{ rangeSearching ? "搜索中" : "搜索" }}
	            </button>
	          </view>
	        </view>
	      </view>

	      <view class="dialog-actions">
	        <button
	          class="secondary-button"
	          :class="{ 'secondary-button--active': rangeDrawing }"
	          :disabled="rangeDrawDisabled"
	          hover-class="secondary-button--hover"
	          @click="startRangeDrawing"
	        >
	          {{ rangeDrawing ? "绘制中" : "绘制" }}
	        </button>
	        <button
	          class="danger-button"
	          :disabled="rangePoints.length === 0"
	          hover-class="danger-button--hover"
	          @click="deleteRangeDrawing"
	        >
	          删除
	        </button>
	        <button class="primary-button" hover-class="primary-button--hover" @click="confirmRangePick">确定</button>
	        <button class="secondary-button" hover-class="secondary-button--hover" @click="closeRangeDialog">取消</button>
	      </view>
	    </view>
	  </view>

	  <view v-if="centerDialogVisible" class="dialog-mask" @click="closeCenterDialog">
	    <view class="center-dialog" @click.stop>
	      <view class="dialog-head">
	        <view>
	          <text class="dialog-title">选择分区中心</text>
	        </view>
	        <button class="icon-button" hover-class="icon-button--hover" aria-label="关闭" @click="closeCenterDialog">
	          <text class="close-icon"></text>
	        </button>
	      </view>

	      <view class="center-dialog-body">
	        <view class="center-map-wrap" :class="{ 'center-map-wrap--drawing': centerDrawing }">
	          <!-- #ifdef H5 -->
	          <LocaleCoordinateMap
	            :key="centerMapKey"
	            :lng="centerMapCoordinate.lng"
	            :lat="centerMapCoordinate.lat"
	            :selectable="centerDrawing"
	            @pick="handleCenterPick"
	          />
	          <!-- #endif -->
	          <!-- #ifndef H5 -->
	          <view class="center-map-fallback">地图选点仅支持 H5 端</view>
	          <!-- #endif -->
	        </view>

	        <view class="center-coordinate-form">
	          <view class="form-field center-coordinate-form__location">
	            <text class="form-label">位置</text>
	            <input
	              v-model="centerLocationText"
	              class="form-input"
	              confirm-type="search"
	              placeholder="请输入地点或公司名称"
	              placeholder-class="input-placeholder"
	              @input="markCenterLocationEdited"
	              @confirm="searchCenterLocation"
	            />
	          </view>
	          <view class="form-field">
	            <text class="form-label">经度</text>
	            <input
	              v-model="centerLngText"
	              class="form-input"
	              confirm-type="search"
	              @input="markCenterCoordinateEdited"
	              @confirm="searchCenterLocation"
	            />
	          </view>
	          <view class="form-field">
	            <text class="form-label">纬度</text>
	            <view class="center-search-row">
	              <input
	                v-model="centerLatText"
	                class="form-input center-search-row__input"
	                confirm-type="search"
	                @input="markCenterCoordinateEdited"
	                @confirm="searchCenterLocation"
	              />
	              <button
	                class="secondary-button center-search-button"
	                :disabled="centerSearchDisabled"
	                hover-class="secondary-button--hover"
	                @click="searchCenterLocation"
	              >
	                {{ centerSearching ? "搜索中" : "搜索" }}
	              </button>
	            </view>
	          </view>
	        </view>
	      </view>

	      <view class="dialog-actions">
	        <button class="secondary-button" hover-class="secondary-button--hover" @click="startCenterDrawing">绘制</button>
	        <button class="primary-button" :disabled="centerConfirmDisabled" hover-class="primary-button--hover" @click="confirmCenterPick">确定</button>
	        <button class="secondary-button" hover-class="secondary-button--hover" @click="closeCenterDialog">取消</button>
	      </view>
	    </view>
	  </view>
    </view>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeUnmount, reactive } from "vue";
import LocaleCoordinateMap from "@/components/map/LocaleCoordinateMap.vue";
import { useI18n } from "@/i18n";
import { useLocaleText, useLocalizedPageInfo, useLocalizedTotal } from "@/i18n/localeText";
import { getMapProvider, MAP_CONFIG } from "@/services/map/map";
import { loadGoogleMaps } from "@/utils/googleMapsLoader";
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
import { uploadFile } from "@/services/leak-report/file-upload";
import { getFileDetail } from "@/services/device/sysFile";
import { normalizeUrl } from "@/utils/request";

const localeText = useLocaleText();
const localizedPageInfo = useLocalizedPageInfo();
const localizedTotal = useLocalizedTotal();

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
  organizationId?: number | null;
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

interface UploadImageResponseLike extends ApiResponseLike {
  data?: {
    id?: string | number;
    filePath?: string;
    file_path?: string;
    url?: string;
  };
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
	// console.log("设备列表",deptDeviceList.value);
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
  void loadRegionIconDetail(item.regionIcon);
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
  enLabel: string;
  value: string;
};

const deptTypeOptions: SelectOption[] = [
  { label: "不限", enLabel: "Unlimited", value: "" },
  { label: "漏水噪音监测终端", enLabel: "Water Leakage Noise Monitoring Terminal", value: "0" },
  { label: "测压点", enLabel: "Pressure Measurement Points", value: "1" },
  { label: "测流点", enLabel: "Flow Measurement Points", value: "2" },
  { label: "消火栓", enLabel: "Fire hydrant", value: "3" },
  { label: "水锤", enLabel: "Water Hammer", value: "4" },
  { label: "温振", enLabel: "Warm vibration", value: "5" },
  { label: "取水栓", enLabel: "Faucet", value: "6" },
  { label: "远控蝶阀", enLabel: "Remote control butterfly valve", value: "7" },
  { label: "智能井盖", enLabel: "Smart Manhole Cover", value: "8" },
  { label: "电子界桩", enLabel: "Electronic Pillar", value: "9" },
  { label: "超级水表", enLabel: "Super Water Meter", value: "10" },
  { label: "H86Q", enLabel: "H86Q", value: "11" },
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
	clearDeptIconTempFile();
	clearRegionIconPreviewState();
	regionIconFileName.value = "";
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
  const normalized = String(value);
  const option = deptTypeOptions.find((item) => item.value === normalized);
  
  return option ? localeText(option.label, option.enLabel) : fallback;
};

const colorDialogVisible = ref(false);
const colorBoardRef = ref<HTMLElement | null>(null);
const colorHueRef = ref<HTMLElement | null>(null);
const colorHue = ref(0);
const colorSaturation = ref(100);
const colorValue = ref(100);
const colorTempHex = ref("#ff0000");
const colorHexInput = ref("ff0000");
const activeColorDrag = ref<"board" | "hue" | null>(null);
const activeColorRect = ref<ColorRect | null>(null);

type ColorChannel = "r" | "g" | "b";
type ColorAreaType = "board" | "hue";

type ColorPointerEvent = Event & {
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
  offsetX?: number;
  offsetY?: number;
  touches?: ArrayLike<ColorTouchPoint>;
  changedTouches?: ArrayLike<ColorTouchPoint>;
  detail?: unknown;
};

interface ColorPointerDetail {
  x?: number;
  y?: number;
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
}

interface ColorTouchPoint {
  clientX?: number;
  clientY?: number;
  pageX?: number;
  pageY?: number;
}

interface ColorRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
}

interface HsvColor {
  h: number;
  s: number;
  v: number;
}

const colorHueBase = computed(() => hsvToHex(colorHue.value, 100, 100));
const colorRgb = computed(() => hexToRgb(colorTempHex.value));

const openColorDialog = () => {
  setColorFromHex(deptForm.regionColor || "#000000", false);
  colorDialogVisible.value = true;
};

const confirmColor = () => {
  deptForm.regionColor = normalizeHexColor(colorTempHex.value);
  closeColorDialog();
};

const closeColorDialog = () => {
  colorDialogVisible.value = false;
  stopColorDrag();
};

const handleColorBoardClick = (event: ColorPointerEvent) => {
  updateColorByPointer("board", event);
};

const handleColorHueClick = (event: ColorPointerEvent) => {
  updateColorByPointer("hue", event);
};

const handleColorBoardTap = (event: ColorPointerEvent) => {
  updateColorByPointer("board", event);
};

const handleColorHueTap = (event: ColorPointerEvent) => {
  updateColorByPointer("hue", event);
};

const handleColorBoardMouseDown = (event: ColorPointerEvent) => {
  startColorDrag("board", event);
};

const handleColorHueMouseDown = (event: ColorPointerEvent) => {
  startColorDrag("hue", event);
};

const handleColorBoardTouch = (event: ColorPointerEvent) => {
  updateColorByPointer("board", event, getColorRect(event, "board"));
};

const handleColorHueTouch = (event: ColorPointerEvent) => {
  updateColorByPointer("hue", event, getColorRect(event, "hue"));
};

const handleColorMouseMove = (event: MouseEvent) => {
  if (activeColorDrag.value) {
    updateColorByPointer(activeColorDrag.value, event, activeColorRect.value);
  }
};

function startColorDrag(type: ColorAreaType, event: ColorPointerEvent) {
  event.preventDefault();
  activeColorDrag.value = type;
  activeColorRect.value = getColorRect(event, type);
  updateColorByPointer(type, event, activeColorRect.value);

  if (typeof document !== "undefined") {
    document.addEventListener("mousemove", handleColorMouseMove);
    document.addEventListener("mouseup", stopColorDrag);
  }
}

function stopColorDrag() {
  activeColorDrag.value = null;
  activeColorRect.value = null;

  if (typeof document !== "undefined") {
    document.removeEventListener("mousemove", handleColorMouseMove);
    document.removeEventListener("mouseup", stopColorDrag);
  }
}

function updateColorByPointer(type: ColorAreaType, event: ColorPointerEvent, rect: ColorRect | null = null) {
  const point = getPointerPoint(event);
  const offset = point ? null : getPointerOffset(event);
  const targetRect = rect || getColorRect(event, type);

  if ((!point && !offset) || !targetRect || targetRect.width <= 0 || targetRect.height <= 0) {
    return;
  }

  const localX = point ? point.x - targetRect.left : offset!.x;
  const localY = point ? point.y - targetRect.top : offset!.y;

  if (type === "board") {
    const nextSaturation = clamp((localX / targetRect.width) * 100, 0, 100);
    const nextValue = clamp(100 - (localY / targetRect.height) * 100, 0, 100);
    setColorFromHsv(colorHue.value, nextSaturation, nextValue);
    return;
  }

  const nextHue = clamp((localY / targetRect.height) * 360, 0, 360);
  setColorFromHsv(nextHue, colorSaturation.value, colorValue.value);
}

function getColorRect(event: ColorPointerEvent, type: ColorAreaType): ColorRect | null {
  const target = event.currentTarget as (Element & { $el?: Element }) | null;
  const targetElement = target?.$el || target;
  const targetRect = targetElement?.getBoundingClientRect?.();

  if (targetRect && targetRect.width > 0 && targetRect.height > 0) {
    return {
      left: targetRect.left,
      top: targetRect.top,
      width: targetRect.width,
      height: targetRect.height,
    };
  }

  const selector = type === "board" ? "#partition-color-board" : "#partition-color-hue";
  const domElement = typeof document !== "undefined" ? document.querySelector(selector) : null;
  const domRect = domElement?.getBoundingClientRect?.();

  if (domRect && domRect.width > 0 && domRect.height > 0) {
    return {
      left: domRect.left,
      top: domRect.top,
      width: domRect.width,
      height: domRect.height,
    };
  }

  const fallbackElement = type === "board" ? colorBoardRef.value : colorHueRef.value;
  const fallbackRect = fallbackElement?.getBoundingClientRect?.();

  if (!fallbackRect || fallbackRect.width <= 0 || fallbackRect.height <= 0) {
    return null;
  }

  return {
    left: fallbackRect.left,
    top: fallbackRect.top,
    width: fallbackRect.width,
    height: fallbackRect.height,
  };
}

function getPointerPoint(event: ColorPointerEvent) {
  const touch = event.touches?.[0] || event.changedTouches?.[0];

  if (touch) {
    const x = touch.clientX ?? touch.pageX;
    const y = touch.clientY ?? touch.pageY;

    return Number.isFinite(x) && Number.isFinite(y) ? { x: Number(x), y: Number(y) } : null;
  }

  const detail = isColorPointerDetail(event.detail) ? event.detail : null;
  const detailX = detail?.clientX ?? detail?.x ?? detail?.pageX;
  const detailY = detail?.clientY ?? detail?.y ?? detail?.pageY;

  if (Number.isFinite(detailX) && Number.isFinite(detailY)) {
    return { x: Number(detailX), y: Number(detailY) };
  }

  const eventX = event.clientX ?? event.pageX;
  const eventY = event.clientY ?? event.pageY;

  return Number.isFinite(eventX) && Number.isFinite(eventY)
    ? { x: Number(eventX), y: Number(eventY) }
    : null;
}

function isColorPointerDetail(value: unknown): value is ColorPointerDetail {
  return value !== null && typeof value === "object";
}

function getPointerOffset(event: ColorPointerEvent) {
  return Number.isFinite(event.offsetX) && Number.isFinite(event.offsetY)
    ? { x: Number(event.offsetX), y: Number(event.offsetY) }
    : null;
}

function handleColorRgbInput(channel: ColorChannel, event: Event) {
  const current = colorRgb.value;
  const nextValue = clamp(parseInt(getInputValue(event), 10) || 0, 0, 255);
  const nextRgb = { ...current, [channel]: nextValue };
  setColorFromRgb(nextRgb);
}

function handleColorHexInput(event: Event) {
  const nextValue = getInputValue(event).replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
  colorHexInput.value = nextValue;

  if (nextValue.length === 3 || nextValue.length === 6) {
    setColorFromHex(`#${nextValue}`);
  }
}

function normalizeColorHexInput() {
  colorHexInput.value = normalizeHexColor(colorTempHex.value).slice(1);
}

function getInputValue(event: Event) {
  const detailValue = (event as { detail?: { value?: string | number } }).detail?.value;
  const targetValue = (event.target as HTMLInputElement | null)?.value;
  return String(detailValue ?? targetValue ?? "");
}

function setColorFromHsv(h: number, s: number, v: number) {
  colorHue.value = clamp(h, 0, 360);
  colorSaturation.value = clamp(s, 0, 100);
  colorValue.value = clamp(v, 0, 100);
  syncColorTempFromHsv();
}

function syncColorTempFromHsv() {
  const nextHex = hsvToHex(colorHue.value, colorSaturation.value, colorValue.value);
  colorTempHex.value = nextHex;
  colorHexInput.value = nextHex.slice(1);
}

function setColorFromRgb(rgb: RgbColor) {
  const normalizedRgb = {
    r: clamp(rgb.r, 0, 255),
    g: clamp(rgb.g, 0, 255),
    b: clamp(rgb.b, 0, 255),
  };
  const hsv = rgbToHsv(normalizedRgb);
  colorHue.value = hsv.s === 0 ? colorHue.value : hsv.h;
  colorSaturation.value = hsv.s;
  colorValue.value = hsv.v;
  colorTempHex.value = rgbToHex(normalizedRgb);
  colorHexInput.value = colorTempHex.value.slice(1);
}

function setColorFromHex(value: string, preserveGrayHue = true) {
  const nextHex = normalizeHexColor(value);
  const rgb = hexToRgb(nextHex);
  const hsv = rgbToHsv(rgb);

  colorHue.value = hsv.s === 0 && preserveGrayHue ? colorHue.value : hsv.h;
  colorSaturation.value = hsv.s;
  colorValue.value = hsv.v;
  colorTempHex.value = nextHex;
  colorHexInput.value = nextHex.slice(1);
}

function normalizeHexColor(value?: string, fallback = "#000000") {
  const rawValue = String(value || "").trim().replace(/^#/, "");
  const fallbackValue = String(fallback || "#000000").trim().replace(/^#/, "");
  const normalizedFallback = /^[0-9a-fA-F]{6}$/.test(fallbackValue) ? fallbackValue : "000000";

  if (/^[0-9a-fA-F]{3}$/.test(rawValue)) {
    return `#${rawValue.split("").map((item) => item + item).join("").toLowerCase()}`;
  }

  if (/^[0-9a-fA-F]{6}$/.test(rawValue)) {
    return `#${rawValue.toLowerCase()}`;
  }

  return `#${normalizedFallback.toLowerCase()}`;
}

function hexToRgb(value: string): RgbColor {
  const normalized = normalizeHexColor(value).slice(1);
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

function rgbToHex(rgb: RgbColor) {
  const toHex = (value: number) => clamp(Math.round(value), 0, 255).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function hsvToHex(h: number, s: number, v: number) {
  return rgbToHex(hsvToRgb({ h, s, v }));
}

function hsvToRgb(hsv: HsvColor): RgbColor {
  const h = ((hsv.h % 360) + 360) % 360;
  const s = clamp(hsv.s, 0, 100) / 100;
  const v = clamp(hsv.v, 0, 100) / 100;
  const c = v * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;

  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHsv(rgb: RgbColor): HsvColor {
  const r = clamp(rgb.r, 0, 255) / 255;
  const g = clamp(rgb.g, 0, 255) / 255;
  const b = clamp(rgb.b, 0, 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === r) {
      h = 60 * (((g - b) / delta) % 6);
    } else if (max === g) {
      h = 60 * ((b - r) / delta + 2);
    } else {
      h = 60 * ((r - g) / delta + 4);
    }
  }

  return {
    h: h < 0 ? h + 360 : h,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

onBeforeUnmount(() => {
  stopColorDrag();
  stopRangePointDrag();
  destroyRangeNativeMap();
});

interface CoordinateValue {
  lng: number;
  lat: number;
}

const defaultMapCoordinate: CoordinateValue = {
  lng: 121.4737,
  lat: 31.2304,
};

const { locale } = useI18n();
const rangeMapProvider = computed(() => getMapProvider(locale.value));

type RangePoint = CoordinateValue & {
  id: string;
};

const RANGE_MAP_ZOOM = 15;
const RANGE_DRAG_THRESHOLD = 3;

const rangeDialogVisible = ref(false);
const rangeDrawing = ref(false);
const rangeMapCenter = ref<CoordinateValue>({ ...defaultMapCoordinate });
const rangeMapZoom = ref(RANGE_MAP_ZOOM);
const rangePoints = ref<RangePoint[]>([]);
const selectedRangePointId = ref("");
const rangeLocationText = ref("");
const rangeLngText = ref("");
const rangeLatText = ref("");
const rangeSearching = ref(false);
const rangeLastEdited = ref<"location" | "coordinate" | "">("");
const rangeMapWrapRef = ref<HTMLElement | null>(null);
const rangeNativeMapRef = ref<HTMLElement | null>(null);
const rangeMapError = ref("");
const activeRangePointDragId = ref("");

const rangeInputCoordinate = computed(() => parseRangeCoordinateInputs());

const rangeHasSearchText = computed(() => rangeLocationText.value.trim() !== "");

const rangeHasCoordinateText = computed(() => {
  return rangeLngText.value.trim() !== "" || rangeLatText.value.trim() !== "";
});

const rangeSearchDisabled = computed(() => {
  return (
    rangeSearching.value ||
    (!rangeHasSearchText.value && !rangeHasCoordinateText.value)
  );
});

const rangeDrawDisabled = computed(() => rangeDrawing.value || rangePoints.value.length >= 3);

const rangePointPositions = computed(() => {
  return rangePoints.value
    .map((point) => {
      const position = projectRangeCoordinateToScreen(point);

      if (!position) {
        return null;
      }

      return {
        id: point.id,
        x: position.x,
        y: position.y,
      };
    })
    .filter((point): point is { id: string; x: number; y: number } => point !== null);
});

interface TencentLatLngValue {
  getLat?: () => number;
  getLng?: () => number;
  lat?: number;
  lng?: number;
}

interface TencentMapInstance {
  destroy?: () => void;
  easeTo?: (options: { center: TencentLatLngValue; zoom?: number }) => void;
  getCenter?: () => TencentLatLngValue;
  getZoom?: () => number;
  setCenter?: (center: TencentLatLngValue) => void;
  on?: (event: string, handler: (event: TencentMapEvent) => void) => void;
  off?: (event: string, handler: (event: TencentMapEvent) => void) => void;
}

interface TencentMapEvent {
  latLng?: TencentLatLngValue;
  geometry?: {
    id?: string;
    position?: TencentLatLngValue;
  };
}

interface TencentLayerInstance {
  setMap?: (map: TencentMapInstance | null) => void;
  setGeometries?: (geometries: unknown[]) => void;
  on?: (event: string, handler: (event: TencentMapEvent) => void) => void;
}

interface TencentMapApi {
  LatLng: new (lat: number, lng: number) => TencentLatLngValue;
  Map: new (
    container: HTMLElement,
    options: {
      center: TencentLatLngValue;
      zoom: number;
      pitch: number;
      rotation: number;
    },
  ) => TencentMapInstance;
  MultiMarker?: new (options: Record<string, unknown>) => TencentLayerInstance;
  MultiPolyline?: new (options: Record<string, unknown>) => TencentLayerInstance;
  MultiPolygon?: new (options: Record<string, unknown>) => TencentLayerInstance;
  PolylineStyle?: new (options: Record<string, unknown>) => unknown;
  PolygonStyle?: new (options: Record<string, unknown>) => unknown;
}

type TencentRuntimeWindow = Window & {
  TMap?: TencentMapApi;
};

let tencentRangeMap: TencentMapInstance | null = null;
let tencentRangeMarkers: TencentLayerInstance | null = null;
let tencentRangePolyline: TencentLayerInstance | null = null;
let tencentRangePolygon: TencentLayerInstance | null = null;
let tencentRangeLoadingPromise: Promise<TencentMapApi> | null = null;

let googleRangeMap: google.maps.Map | null = null;
let googleRangeClickListener: google.maps.MapsEventListener | null = null;
let googleRangeIdleListener: google.maps.MapsEventListener | null = null;
let googleRangeMarkers: google.maps.Marker[] = [];
let googleRangePolyline: google.maps.Polyline | null = null;
let googleRangePolygon: google.maps.Polygon | null = null;
let googleRangeDblClickListener: google.maps.MapsEventListener | null = null;
let lastRangeMarkerDragEndTime = 0;
let lastRangeMarkerClickTime = 0;
let rangePointDragStartedAt: { x: number; y: number } | null = null;
let rangePointDragMoved = false;
let rangePointDragPointerId: number | null = null;
let rangePointDragTarget:
  | (EventTarget & {
      setPointerCapture?: (pointerId: number) => void;
      releasePointerCapture?: (pointerId: number) => void;
    })
  | null = null;

const openRangeDialog = () => {
  activeSelect.value = false;

  const savedPoints = parseRangeScope(deptForm.regionScope);
  const fallbackCenter =
    savedPoints[0] ||
    parseCoordinateText(deptForm.regionCenter);

  rangePoints.value = savedPoints.map((point, index) => createRangePoint(point, index));
  selectedRangePointId.value =
    rangePoints.value[rangePoints.value.length - 1]?.id || "";
  rangeMapCenter.value = fallbackCenter
    ? { ...fallbackCenter }
    : { ...defaultMapCoordinate };
  rangeMapZoom.value = RANGE_MAP_ZOOM;
  rangeLocationText.value = "";
  rangeLastEdited.value = "";
  rangeDrawing.value = false;
  rangeSearching.value = false;
  syncRangeCoordinateInputs(fallbackCenter || null);
  rangeDialogVisible.value = true;
  void nextTick(initRangeNativeMap);
};

const closeRangeDialog = () => {
  rangeDialogVisible.value = false;
  rangeDrawing.value = false;
  rangeSearching.value = false;
  rangeLastEdited.value = "";
  selectedRangePointId.value = "";
  stopRangePointDrag();
  destroyRangeNativeMap();
};

const startRangeDrawing = () => {
  if (rangeDrawDisabled.value) {
    uni.showToast({ title: "请先删除已有范围后再重新绘制", icon: "none" });
    return;
  }

  rangeDrawing.value = true;
  uni.showToast({ title: "点击地图添加点，双击地图结束绘制", icon: "none" });
  void nextTick(initRangeNativeMap);
};

const markRangeLocationEdited = () => {
  rangeLastEdited.value = "location";
};

const markRangeCoordinateEdited = () => {
  rangeLastEdited.value = "coordinate";
};

const selectRangePoint = (id: string) => {
  selectedRangePointId.value = id;

  const point = rangePoints.value.find((item) => item.id === id);
  if (point) {
    syncRangeCoordinateInputs(point);
  }
};

const handleRangeMapPick = (coordinate: CoordinateValue) => {
  if (!rangeDrawing.value) {
    return;
  }

  addRangePoint(coordinate);
};

const handleRangePointClick = (id: string) => {
  lastRangeMarkerClickTime = Date.now();

  if (Date.now() - lastRangeMarkerDragEndTime < 260) {
    return;
  }

  const index = rangePoints.value.findIndex((point) => point.id === id);

  if (index < 0) {
    return;
  }

  if (rangePoints.value.length < 3) {
    selectRangePoint(id);
    uni.showToast({ title: "至少三个点时可编辑范围点", icon: "none" });
    return;
  }

  const points = rangePoints.value;
  const point = points[index];
  const previousPoint = points[(index - 1 + points.length) % points.length];
  const nextPoint = points[(index + 1) % points.length];

  if (areRangePointsCollinear(previousPoint, point, nextPoint)) {
    const previousMiddlePoint = createRangePoint(getRangeMidpoint(previousPoint, point));
    const nextMiddlePoint = createRangePoint(getRangeMidpoint(point, nextPoint));
    rangePoints.value = [
      ...points.slice(0, index),
      previousMiddlePoint,
      point,
      nextMiddlePoint,
      ...points.slice(index + 1),
    ];
    selectedRangePointId.value = point.id;
    syncRangeCoordinateInputs(point);
    renderRangeOverlays();
    return;
  }

  const middlePoint = getRangeMidpoint(previousPoint, nextPoint);
  const nextPoints = points.map((item) => {
    if (item.id !== id) {
      return item;
    }

    return {
      ...item,
      ...middlePoint,
    };
  });
  rangePoints.value = nextPoints;
  selectedRangePointId.value = id;
  syncRangeCoordinateInputs(middlePoint);
  renderRangeOverlays();
};

function startRangePointDrag(id: string, event: PointerEvent) {
  event.preventDefault();
  event.stopPropagation();

  const startPoint = getRangeScreenPointFromPointer(event);

  if (!startPoint) {
    return;
  }

  selectRangePoint(id);
  activeRangePointDragId.value = id;
  rangePointDragStartedAt = startPoint;
  rangePointDragMoved = false;
  rangePointDragPointerId = event.pointerId;
  rangePointDragTarget = event.currentTarget as typeof rangePointDragTarget;
  rangePointDragTarget?.setPointerCapture?.(event.pointerId);

  if (typeof document !== "undefined") {
    document.addEventListener("pointermove", handleRangePointDragMove, { passive: false });
    document.addEventListener("pointerup", stopRangePointDrag, { passive: false });
    document.addEventListener("pointercancel", stopRangePointDrag, { passive: false });
  }
}

function handleRangePointDragMove(event: PointerEvent) {
  if (!activeRangePointDragId.value) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const screenPoint = getRangeScreenPointFromPointer(event);

  if (!screenPoint) {
    return;
  }

  if (!rangePointDragMoved && rangePointDragStartedAt) {
    const distance = Math.hypot(
      screenPoint.x - rangePointDragStartedAt.x,
      screenPoint.y - rangePointDragStartedAt.y,
    );

    if (distance < RANGE_DRAG_THRESHOLD) {
      return;
    }

    rangePointDragMoved = true;
  }

  const coordinate = projectRangeScreenToCoordinate(screenPoint);

  if (coordinate) {
    updateRangePoint(activeRangePointDragId.value, coordinate);
  }
}

function stopRangePointDrag(event?: PointerEvent) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const clickedPointId = activeRangePointDragId.value;
  const wasDragging = rangePointDragMoved;
  const shouldHandleClick = event?.type === "pointerup";

  if (rangePointDragTarget && rangePointDragPointerId !== null) {
    rangePointDragTarget.releasePointerCapture?.(rangePointDragPointerId);
  }

  if (typeof document !== "undefined") {
    document.removeEventListener("pointermove", handleRangePointDragMove);
    document.removeEventListener("pointerup", stopRangePointDrag);
    document.removeEventListener("pointercancel", stopRangePointDrag);
  }

  activeRangePointDragId.value = "";
  rangePointDragStartedAt = null;
  rangePointDragMoved = false;
  rangePointDragPointerId = null;
  rangePointDragTarget = null;

  if (wasDragging) {
    lastRangeMarkerDragEndTime = Date.now();
    return;
  }

  if (clickedPointId && shouldHandleClick) {
    handleRangePointClick(clickedPointId);
  }
}

function addRangePoint(coordinate: CoordinateValue) {
  syncRangeMapViewportFromMap();
  const point = createRangePoint(coordinate);
  rangePoints.value = [...rangePoints.value, point];
  selectedRangePointId.value = point.id;
  syncRangeCoordinateInputs(point);
  renderRangeOverlays();
}

function finishRangeDrawing() {
  if (!rangeDrawing.value) {
    return;
  }

  if (rangePoints.value.length < 3) {
    uni.showToast({ title: "至少需要三个范围点", icon: "none" });
    return;
  }

  rangeDrawing.value = false;
  uni.showToast({ title: "绘制已结束", icon: "success" });
}

const searchRangeLocation = async () => {
  const coordinate = rangeInputCoordinate.value;
  const keyword = rangeLocationText.value.trim();

  if (rangeLastEdited.value === "location" && keyword) {
    await searchRangeByKeyword(keyword);
    return;
  }

  if (coordinate) {
    updateRangeMapCenter(coordinate);
    uni.showToast({ title: "已定位到输入坐标", icon: "success" });
    return;
  }

  if (rangeHasCoordinateText.value) {
    uni.showToast({ title: "请输入有效经纬度", icon: "none" });
    return;
  }

  if (!keyword) {
    uni.showToast({ title: "请输入位置或经纬度", icon: "none" });
    return;
  }

  await searchRangeByKeyword(keyword);
};

const searchRangeByKeyword = async (keyword: string) => {
  rangeSearching.value = true;

  try {
    const result = await searchTencentPlace(keyword);

    updateRangeMapCenter(result.coordinate);
    rangeLocationText.value = result.title;
    uni.showToast({ title: "已定位到搜索结果", icon: "success" });
  } catch (error) {
    uni.showToast({
      title: (error as Error)?.message || "地点搜索失败",
      icon: "none",
    });
  } finally {
    rangeSearching.value = false;
  }
};

const deleteRangeDrawing = () => {
  if (rangePoints.value.length === 0) {
    uni.showToast({ title: "暂无绘制内容", icon: "none" });
    return;
  }

  uni.showModal({
    title: "删除确认",
    content: "确认删除已绘制的分区范围吗？",
    confirmText: "删除",
    confirmColor: "#ef4444",
    success: (res) => {
      if (!res.confirm) {
        return;
      }

      rangePoints.value = [];
      selectedRangePointId.value = "";
      rangeDrawing.value = false;
      renderRangeOverlays();
      uni.showToast({ title: "绘制内容已删除", icon: "success" });
    },
  });
};

const confirmRangePick = () => {
  deptForm.regionScope = formatRangeScope(rangePoints.value);
  closeRangeDialog();
};

function parseRangeCoordinateInputs(): CoordinateValue | null {
  const lngText = rangeLngText.value.trim();
  const latText = rangeLatText.value.trim();

  if (!lngText || !latText) {
    return null;
  }

  const lng = Number(lngText);
  const lat = Number(latText);

  if (!isValidCoordinate(lng, lat)) {
    return null;
  }

  return normalizeCoordinate({ lng, lat });
}

function syncRangeCoordinateInputs(coordinate: CoordinateValue | null) {
  rangeLngText.value = coordinate ? coordinate.lng.toFixed(6) : "";
  rangeLatText.value = coordinate ? coordinate.lat.toFixed(6) : "";
}

function updateRangeMapCenter(coordinate: CoordinateValue) {
  const nextCoordinate = normalizeCoordinate(coordinate);

  rangeMapCenter.value = nextCoordinate;
  rangeMapZoom.value = RANGE_MAP_ZOOM;
  rangeLastEdited.value = "coordinate";
  syncRangeCoordinateInputs(nextCoordinate);
  focusRangeNativeMap(nextCoordinate);
}

function createRangePoint(
  coordinate: CoordinateValue,
  index = Date.now(),
): RangePoint {
  const point = normalizeCoordinate(coordinate);

  return {
    id: `range-point-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
    ...point,
  };
}

function getRangeMidpoint(firstPoint: CoordinateValue, secondPoint: CoordinateValue): CoordinateValue {
  return normalizeCoordinate({
    lng: (firstPoint.lng + secondPoint.lng) / 2,
    lat: (firstPoint.lat + secondPoint.lat) / 2,
  });
}

function areRangePointsCollinear(
  firstPoint: CoordinateValue,
  middlePoint: CoordinateValue,
  lastPoint: CoordinateValue,
) {
  const first = toLocalMeterPoint(firstPoint, middlePoint);
  const middle = { x: 0, y: 0 };
  const last = toLocalMeterPoint(lastPoint, middlePoint);
  const baseLength = Math.hypot(last.x - first.x, last.y - first.y);

  if (baseLength < 0.001) {
    return true;
  }

  const areaTwice = Math.abs(
    (last.x - first.x) * (middle.y - first.y) -
      (middle.x - first.x) * (last.y - first.y),
  );
  const distanceToLine = areaTwice / baseLength;

  return distanceToLine <= 1.5;
}

function toLocalMeterPoint(coordinate: CoordinateValue, origin: CoordinateValue) {
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng =
    metersPerDegreeLat * Math.cos((origin.lat * Math.PI) / 180);

  return {
    x: (coordinate.lng - origin.lng) * metersPerDegreeLng,
    y: (coordinate.lat - origin.lat) * metersPerDegreeLat,
  };
}

function getRangeMapRect(): DOMRect | null {
  const element = getElement(rangeMapWrapRef.value) || getElement(rangeNativeMapRef.value);

  if (!element) {
    return null;
  }

  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return rect;
}

function getRangeScreenPointFromPointer(event: PointerEvent) {
  const rect = getRangeMapRect();

  if (!rect) {
    return null;
  }

  return {
    x: clamp(event.clientX - rect.left, 0, rect.width),
    y: clamp(event.clientY - rect.top, 0, rect.height),
  };
}

function projectRangeCoordinateToScreen(coordinate: CoordinateValue) {
  const rect = getRangeMapRect();

  if (!rect) {
    return null;
  }

  const zoom = rangeMapZoom.value;
  const centerWorld = getMercatorWorldPoint(rangeMapCenter.value, zoom);
  const coordinateWorld = getMercatorWorldPoint(coordinate, zoom);

  return {
    x: rect.width / 2 + coordinateWorld.x - centerWorld.x,
    y: rect.height / 2 + coordinateWorld.y - centerWorld.y,
  };
}

function projectRangeScreenToCoordinate(point: { x: number; y: number }): CoordinateValue | null {
  const rect = getRangeMapRect();

  if (!rect) {
    return null;
  }

  const zoom = rangeMapZoom.value;
  const centerWorld = getMercatorWorldPoint(rangeMapCenter.value, zoom);
  const worldPoint = {
    x: centerWorld.x + point.x - rect.width / 2,
    y: centerWorld.y + point.y - rect.height / 2,
  };
  const coordinate = getCoordinateFromMercatorWorldPoint(worldPoint, zoom);

  if (!isValidCoordinate(coordinate.lng, coordinate.lat)) {
    return null;
  }

  return normalizeCoordinate(coordinate);
}

function getMercatorWorldPoint(coordinate: CoordinateValue, zoom: number) {
  const scale = 256 * 2 ** zoom;
  const sinLat = Math.sin((clamp(coordinate.lat, -85.05112878, 85.05112878) * Math.PI) / 180);

  return {
    x: ((coordinate.lng + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function getCoordinateFromMercatorWorldPoint(
  point: { x: number; y: number },
  zoom: number,
): CoordinateValue {
  const scale = 256 * 2 ** zoom;
  const lng = (point.x / scale) * 360 - 180;
  const radians = Math.PI - (2 * Math.PI * point.y) / scale;
  const lat = (Math.atan(Math.sinh(radians)) * 180) / Math.PI;

  return {
    lng: clamp(lng, -180, 180),
    lat: clamp(lat, -90, 90),
  };
}

function parseRangeScope(value?: string): CoordinateValue[] {
  const text = String(value || "").trim();

  if (!text) {
    return [];
  }

  try {
    const parsed = JSON.parse(text) as unknown;
    const jsonPoints = collectRangeCoordinates(parsed);

    if (jsonPoints.length > 0) {
      return jsonPoints;
    }
  } catch {
    // 非 JSON 格式继续按普通坐标串解析。
  }

  const numbers = text.match(/-?\d+(?:\.\d+)?/g);

  if (!numbers || numbers.length < 2) {
    return [];
  }

  const points: CoordinateValue[] = [];

  for (let index = 0; index < numbers.length - 1; index += 2) {
    const lng = Number(numbers[index]);
    const lat = Number(numbers[index + 1]);

    if (isValidCoordinate(lng, lat)) {
      points.push(normalizeCoordinate({ lng, lat }));
    }
  }

  return points;
}

function collectRangeCoordinates(value: unknown): CoordinateValue[] {
  const points: CoordinateValue[] = [];

  appendRangeCoordinates(value, points);

  return points;
}

function appendRangeCoordinates(value: unknown, points: CoordinateValue[]) {
  if (Array.isArray(value)) {
    const lng = toCoordinateNumber(value[0]);
    const lat = toCoordinateNumber(value[1]);

    if (isValidCoordinate(lng, lat)) {
      points.push(normalizeCoordinate({ lng, lat }));
      return;
    }

    value.forEach((item) => appendRangeCoordinates(item, points));
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;
  const lng = pickCoordinateNumber(record.lng, record.longitude, record.x);
  const lat = pickCoordinateNumber(record.lat, record.latitude, record.y);

  if (isValidCoordinate(lng, lat)) {
    points.push(normalizeCoordinate({ lng, lat }));
    return;
  }

  ["points", "coordinates", "path", "range", "regionScope"].forEach((key) => {
    appendRangeCoordinates(record[key], points);
  });
}

function toCoordinateNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    return Number(value);
  }

  return Number.NaN;
}

function pickCoordinateNumber(...values: unknown[]) {
  const result = values
    .map((value) => toCoordinateNumber(value))
    .find((value) => Number.isFinite(value));

  return result ?? Number.NaN;
}

function formatRangeScope(points: CoordinateValue[]) {
  return points.map((point) => formatCoordinate(point)).join(";");
}

async function initRangeNativeMap() {
  const mapElement = getElement(rangeNativeMapRef.value);

  if (!rangeDialogVisible.value || !mapElement) {
    return;
  }

  rangeMapError.value = "";

  try {
    if (rangeMapProvider.value === "tencent") {
      destroyGoogleRangeMap();
      if (!tencentRangeMap) {
        await initTencentRangeMap(mapElement);
      }
    } else {
      destroyTencentRangeMap();
      if (!googleRangeMap) {
        await initGoogleRangeMap(mapElement);
      }
    }

    focusRangeNativeMap(rangeMapCenter.value);
    renderRangeOverlays();
  } catch (error) {
    console.error("Range map initialization failed:", error);
    rangeMapError.value = "地图加载失败，请检查 Key、域名限制和网络";
  }
}

async function initTencentRangeMap(mapElement: HTMLElement) {
  const api = await loadRangeTencentMaps();
  const center = createTencentLatLng(api, rangeMapCenter.value);

  tencentRangeMap = new api.Map(mapElement, {
    center,
    zoom: RANGE_MAP_ZOOM,
    pitch: 0,
    rotation: 0,
  });

  tencentRangeMap.on?.("click", handleTencentRangeMapClick);
  tencentRangeMap.on?.("dblclick", handleTencentRangeMapDoubleClick);
  tencentRangeMap.on?.("idle", handleTencentRangeMapIdle);
  syncTencentRangeMapViewport();
}

async function initGoogleRangeMap(mapElement: HTMLElement) {
  const { Map } = await loadGoogleMaps();

  googleRangeMap = new Map(mapElement, {
    center: toGoogleCoordinate(rangeMapCenter.value),
    zoom: RANGE_MAP_ZOOM,
    mapTypeControl: true,
    streetViewControl: false,
    fullscreenControl: true,
    disableDoubleClickZoom: true,
  });

  googleRangeClickListener = googleRangeMap.addListener(
    "click",
    (event: google.maps.MapMouseEvent) => {
      if (!rangeDrawing.value || !event.latLng) {
        return;
      }

      if (Date.now() - lastRangeMarkerClickTime < 160) {
        return;
      }

      addRangePoint({
        lng: event.latLng.lng(),
        lat: event.latLng.lat(),
      });
    },
  );
  googleRangeDblClickListener = googleRangeMap.addListener(
    "dblclick",
    () => finishRangeDrawing(),
  );
  googleRangeIdleListener = googleRangeMap.addListener("idle", syncGoogleRangeMapViewport);
  syncGoogleRangeMapViewport();
}

function loadRangeTencentMaps(): Promise<TencentMapApi> {
  const runtimeWindow = window as TencentRuntimeWindow;

  if (runtimeWindow.TMap) {
    return Promise.resolve(runtimeWindow.TMap);
  }

  if (tencentRangeLoadingPromise) {
    return tencentRangeLoadingPromise;
  }

  if (!MAP_CONFIG.tencentKey) {
    return Promise.reject(new Error("VITE_TENCENT_MAP_KEY is empty"));
  }

  tencentRangeLoadingPromise = new Promise((resolve, reject) => {
    const scriptId = "shared-tencent-map-sdk";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    const handleLoaded = () => {
      if (runtimeWindow.TMap) {
        resolve(runtimeWindow.TMap);
      } else {
        reject(new Error("Tencent Maps API is unavailable"));
      }
    };

    if (existing) {
      existing.addEventListener("load", handleLoaded, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Tencent Maps script failed")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.charset = "utf-8";
    script.src = `https://map.qq.com/api/gljs?v=1.exp&key=${MAP_CONFIG.tencentKey}&libraries=tools`;
    script.addEventListener("load", handleLoaded, { once: true });
    script.addEventListener(
      "error",
      () => reject(new Error("Tencent Maps script failed")),
      { once: true },
    );
    document.head.appendChild(script);
  });

  return tencentRangeLoadingPromise;
}

function handleTencentRangeMapClick(event: TencentMapEvent) {
  if (!rangeDrawing.value) {
    return;
  }

  if (Date.now() - lastRangeMarkerClickTime < 160) {
    return;
  }

  const coordinate = getTencentCoordinate(event.latLng);

  if (coordinate) {
    addRangePoint(coordinate);
  }
}

function handleTencentRangeMapDoubleClick() {
  finishRangeDrawing();
}

function handleTencentRangeMapIdle() {
  syncTencentRangeMapViewport();
}

function syncRangeMapViewportFromMap() {
  if (rangeMapProvider.value === "tencent") {
    syncTencentRangeMapViewport();
    return;
  }

  syncGoogleRangeMapViewport();
}

function syncTencentRangeMapViewport() {
  const coordinate = getTencentCoordinate(tencentRangeMap?.getCenter?.());
  const zoom = tencentRangeMap?.getZoom?.();

  if (coordinate) {
    rangeMapCenter.value = coordinate;
  }

  if (Number.isFinite(zoom)) {
    rangeMapZoom.value = Number(zoom);
  }
}

function syncGoogleRangeMapViewport() {
  const center = googleRangeMap?.getCenter();
  const zoom = googleRangeMap?.getZoom();

  if (center) {
    rangeMapCenter.value = normalizeCoordinate({
      lng: center.lng(),
      lat: center.lat(),
    });
  }

  if (Number.isFinite(zoom)) {
    rangeMapZoom.value = Number(zoom);
  }
}

function renderRangeOverlays() {
  if (rangeMapProvider.value === "tencent") {
    renderTencentRangeOverlays();
  } else {
    renderGoogleRangeOverlays();
  }
}

function renderTencentRangeOverlays() {
  const api = (window as TencentRuntimeWindow).TMap;

  if (!api || !tencentRangeMap) {
    return;
  }

  clearTencentRangeMarkers();
  renderTencentRangePolyline(api);
  renderTencentRangePolygon(api);
}

function clearTencentRangeMarkers() {
  tencentRangeMarkers?.setMap?.(null);
  tencentRangeMarkers = null;
}

function renderTencentRangePolyline(api: TencentMapApi) {
  tencentRangePolyline?.setMap?.(null);
  tencentRangePolyline = null;

  if (!api.MultiPolyline || !tencentRangeMap || rangePoints.value.length < 2) {
    return;
  }

  const paths = rangePoints.value.map((point) => createTencentLatLng(api, point));

  tencentRangePolyline = new api.MultiPolyline({
    map: tencentRangeMap,
    styles: {
      "range-line": api.PolylineStyle
        ? new api.PolylineStyle({
            color: "#ef4444",
            width: 3,
            borderWidth: 0,
          })
        : undefined,
    },
    geometries: [
      {
        id: "range-line",
        styleId: "range-line",
        paths,
      },
    ],
  });
}

function renderTencentRangePolygon(api: TencentMapApi) {
  tencentRangePolygon?.setMap?.(null);
  tencentRangePolygon = null;

  if (!api.MultiPolygon || !tencentRangeMap || rangePoints.value.length < 3) {
    return;
  }

  const paths = rangePoints.value.map((point) => createTencentLatLng(api, point));

  tencentRangePolygon = new api.MultiPolygon({
    map: tencentRangeMap,
    styles: {
      "range-polygon": api.PolygonStyle
        ? new api.PolygonStyle({
            color: "rgba(239,68,68,0.22)",
            showBorder: true,
            borderColor: "#ef4444",
            borderWidth: 2,
          })
        : undefined,
    },
    geometries: [
      {
        id: "range-polygon",
        styleId: "range-polygon",
        paths,
      },
    ],
  });
}

function renderGoogleRangeOverlays() {
  if (!googleRangeMap || typeof google === "undefined") {
    return;
  }

  clearGoogleRangeMarkers();

  googleRangePolyline?.setMap(null);
  googleRangePolyline = null;

  if (rangePoints.value.length > 1) {
    googleRangePolyline = new google.maps.Polyline({
      map: googleRangeMap,
      path: rangePoints.value.map(toGoogleCoordinate),
      strokeColor: "#ef4444",
      strokeOpacity: 0.95,
      strokeWeight: 3,
    });
  }

  googleRangePolygon?.setMap(null);
  googleRangePolygon = null;

  if (rangePoints.value.length > 2) {
    googleRangePolygon = new google.maps.Polygon({
      map: googleRangeMap,
      paths: rangePoints.value.map(toGoogleCoordinate),
      strokeColor: "#ef4444",
      strokeOpacity: 0.95,
      strokeWeight: 2,
      fillColor: "#ef4444",
      fillOpacity: 0.22,
    });
  }
}

function updateRangePoint(id: string, coordinate: CoordinateValue) {
  const nextCoordinate = normalizeCoordinate(coordinate);

  rangePoints.value = rangePoints.value.map((point) => {
    if (point.id !== id) {
      return point;
    }

    return {
      ...point,
      ...nextCoordinate,
    };
  });
  selectedRangePointId.value = id;
  syncRangeCoordinateInputs(nextCoordinate);
  renderRangeOverlays();
}

function focusRangeNativeMap(coordinate: CoordinateValue) {
  rangeMapCenter.value = normalizeCoordinate(coordinate);
  rangeMapZoom.value = RANGE_MAP_ZOOM;

  if (rangeMapProvider.value === "tencent") {
    const api = (window as TencentRuntimeWindow).TMap;

    if (!api || !tencentRangeMap) {
      return;
    }

    const center = createTencentLatLng(api, coordinate);
    tencentRangeMap.easeTo?.({ center, zoom: RANGE_MAP_ZOOM });
    tencentRangeMap.setCenter?.(center);
    return;
  }

  if (!googleRangeMap) {
    return;
  }

  googleRangeMap.panTo(toGoogleCoordinate(coordinate));
  googleRangeMap.setZoom(RANGE_MAP_ZOOM);
}

function destroyRangeNativeMap() {
  destroyTencentRangeMap();
  destroyGoogleRangeMap();
  rangeMapError.value = "";
}

function destroyTencentRangeMap() {
  tencentRangeMap?.off?.("click", handleTencentRangeMapClick);
  tencentRangeMap?.off?.("dblclick", handleTencentRangeMapDoubleClick);
  tencentRangeMap?.off?.("idle", handleTencentRangeMapIdle);
  clearTencentRangeMarkers();
  tencentRangePolyline?.setMap?.(null);
  tencentRangePolygon?.setMap?.(null);
  tencentRangePolyline = null;
  tencentRangePolygon = null;
  tencentRangeMap?.destroy?.();
  tencentRangeMap = null;
}

function destroyGoogleRangeMap() {
  googleRangeClickListener?.remove();
  googleRangeDblClickListener?.remove();
  googleRangeIdleListener?.remove();
  googleRangeClickListener = null;
  googleRangeDblClickListener = null;
  googleRangeIdleListener = null;
  clearGoogleRangeMarkers();
  googleRangePolyline?.setMap(null);
  googleRangePolygon?.setMap(null);
  googleRangePolyline = null;
  googleRangePolygon = null;

  if (googleRangeMap && typeof google !== "undefined") {
    google.maps.event.clearInstanceListeners(googleRangeMap);
  }

  googleRangeMap = null;
}

function clearGoogleRangeMarkers() {
  if (typeof google !== "undefined") {
    googleRangeMarkers.forEach((marker) => {
      google.maps.event.clearInstanceListeners(marker);
      marker.setMap(null);
    });
  }

  googleRangeMarkers = [];
}

function createTencentLatLng(api: TencentMapApi, coordinate: CoordinateValue) {
  return new api.LatLng(coordinate.lat, coordinate.lng);
}

function getTencentCoordinate(value?: TencentLatLngValue): CoordinateValue | null {
  if (!value) {
    return null;
  }

  const lng = value.getLng?.() ?? value.lng;
  const lat = value.getLat?.() ?? value.lat;

  if (!isValidCoordinate(Number(lng), Number(lat))) {
    return null;
  }

  return normalizeCoordinate({
    lng: Number(lng),
    lat: Number(lat),
  });
}

function toGoogleCoordinate(coordinate: CoordinateValue) {
  return {
    lat: coordinate.lat,
    lng: coordinate.lng,
  };
}

function getElement(value: unknown): HTMLElement | null {
  if (!value) {
    return null;
  }

  const maybeElement = value as HTMLElement;

  if (typeof maybeElement.getBoundingClientRect === "function") {
    return maybeElement;
  }

  const proxyElement = (value as { $el?: HTMLElement }).$el;

  if (proxyElement && typeof proxyElement.getBoundingClientRect === "function") {
    return proxyElement;
  }

  return null;
}

const centerDialogVisible = ref(false);
const centerDrawing = ref(false);
const centerMapCoordinate = ref<CoordinateValue>({ ...defaultMapCoordinate });
const centerPickedCoordinate = ref<CoordinateValue | null>(null);
const centerLocationText = ref("");
const centerLngText = ref("");
const centerLatText = ref("");
const centerSearching = ref(false);
const centerLastEdited = ref<"location" | "coordinate" | "">("");
const centerMapKey = computed(() => {
  const mode = centerDrawing.value ? "select" : "preview";
  const coordinate = centerMapCoordinate.value;
  return `${mode}-${coordinate.lng}-${coordinate.lat}`;
});
const centerInputCoordinate = computed(() => parseCoordinateInputs());
const centerHasSearchText = computed(() => centerLocationText.value.trim() !== "");
const centerHasCoordinateText = computed(() => {
  return centerLngText.value.trim() !== "" || centerLatText.value.trim() !== "";
});
const centerSearchDisabled = computed(() => {
  return (
    centerSearching.value ||
    (!centerHasSearchText.value && !centerHasCoordinateText.value)
  );
});
const centerConfirmDisabled = computed(() => !centerInputCoordinate.value);

const openCenterDialog = () => {
  activeSelect.value = false;
  const currentCoordinate = parseCoordinateText(deptForm.regionCenter);

  centerPickedCoordinate.value = currentCoordinate;
  centerMapCoordinate.value = currentCoordinate
    ? { ...currentCoordinate }
    : { ...defaultMapCoordinate };
  centerLocationText.value = "";
  centerLastEdited.value = "";
  syncCenterCoordinateInputs(currentCoordinate || null);
  centerDrawing.value = false;
  centerDialogVisible.value = true;
};

const closeCenterDialog = () => {
  centerDialogVisible.value = false;
  centerDrawing.value = false;
  centerPickedCoordinate.value = null;
  centerSearching.value = false;
  centerLastEdited.value = "";
};

const startCenterDrawing = () => {
  centerDrawing.value = true;
};

const markCenterLocationEdited = () => {
  centerLastEdited.value = "location";
};

const markCenterCoordinateEdited = () => {
  centerLastEdited.value = "coordinate";
};

const handleCenterPick = (coordinate: CoordinateValue) => {
  const nextCoordinate = normalizeCoordinate(coordinate);

  updateCenterMapCoordinate(nextCoordinate);
};

const confirmCenterPick = () => {
  const coordinate = centerInputCoordinate.value;

  if (!coordinate) {
    uni.showToast({ title: "请先填写有效经纬度", icon: "none" });
    return;
  }

  deptForm.regionCenter = formatCoordinate(coordinate);
  closeCenterDialog();
};

const searchCenterLocation = async () => {
  const coordinate = centerInputCoordinate.value;
  const keyword = centerLocationText.value.trim();

  if (centerLastEdited.value === "location" && keyword) {
    await searchCenterByKeyword(keyword);
    return;
  }

  if (coordinate) {
    updateCenterMapCoordinate(coordinate);
    uni.showToast({ title: "已定位到输入坐标", icon: "success" });
    return;
  }

  if (centerHasCoordinateText.value) {
    uni.showToast({ title: "请输入有效经纬度", icon: "none" });
    return;
  }

  if (!keyword) {
    uni.showToast({ title: "请输入位置或经纬度", icon: "none" });
    return;
  }

  await searchCenterByKeyword(keyword);
};

const searchCenterByKeyword = async (keyword: string) => {
  centerSearching.value = true;

  try {
    const result = await searchTencentPlace(keyword);

    updateCenterMapCoordinate(result.coordinate);
    uni.showToast({ title: "已定位到搜索结果", icon: "success" });
  } catch (error) {
    uni.showToast({
      title: (error as Error)?.message || "地点搜索失败",
      icon: "none",
    });
  } finally {
    centerSearching.value = false;
  }
};

function parseCoordinateText(value?: string): CoordinateValue | null {
  if (!value) {
    return null;
  }

  const matchedValues = value.match(/-?\d+(?:\.\d+)?/g);

  if (!matchedValues || matchedValues.length < 2) {
    return null;
  }

  const lng = Number(matchedValues[0]);
  const lat = Number(matchedValues[1]);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

  return normalizeCoordinate({ lng, lat });
}

function normalizeCoordinate(coordinate: CoordinateValue): CoordinateValue {
  return {
    lng: Number(coordinate.lng.toFixed(6)),
    lat: Number(coordinate.lat.toFixed(6)),
  };
}

function formatCoordinate(coordinate: CoordinateValue) {
  return `${coordinate.lng.toFixed(6)},${coordinate.lat.toFixed(6)}`;
}

function parseCoordinateInputs(): CoordinateValue | null {
  const lngText = centerLngText.value.trim();
  const latText = centerLatText.value.trim();

  if (!lngText || !latText) {
    return null;
  }

  const lng = Number(lngText);
  const lat = Number(latText);

  if (!isValidCoordinate(lng, lat)) {
    return null;
  }

  return normalizeCoordinate({ lng, lat });
}

function isValidCoordinate(lng: number, lat: number) {
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    lng >= -180 &&
    lng <= 180 &&
    lat >= -90 &&
    lat <= 90
  );
}

function syncCenterCoordinateInputs(coordinate: CoordinateValue | null) {
  centerLngText.value = coordinate ? coordinate.lng.toFixed(6) : "";
  centerLatText.value = coordinate ? coordinate.lat.toFixed(6) : "";
}

function updateCenterMapCoordinate(coordinate: CoordinateValue) {
  const nextCoordinate = normalizeCoordinate(coordinate);

  centerPickedCoordinate.value = nextCoordinate;
  centerMapCoordinate.value = nextCoordinate;
  centerLastEdited.value = "coordinate";
  syncCenterCoordinateInputs(nextCoordinate);
}

interface TencentPlaceSearchResponse {
  status: number;
  message?: string;
  data?: Array<{
    title?: string;
    address?: string;
    location?: {
      lng?: number;
      lat?: number;
    };
  }>;
}

function searchTencentPlace(keyword: string): Promise<{
  coordinate: CoordinateValue;
  title: string;
}> {
  if (typeof document === "undefined") {
    return Promise.reject(new Error("地点搜索仅支持 H5 端"));
  }

  if (!MAP_CONFIG.tencentKey) {
    return Promise.reject(new Error("地图 Key 未配置"));
  }

  return new Promise((resolve, reject) => {
    const callbackName = `__partitionCenterSearch_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}`;
    const script = document.createElement("script");
    const runtimeWindow = window as unknown as Record<string, unknown>;
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("地点搜索超时"));
    }, 10000);

    const cleanup = () => {
      window.clearTimeout(timeout);
      delete runtimeWindow[callbackName];
      script.remove();
    };

    runtimeWindow[callbackName] = (
      response: TencentPlaceSearchResponse,
    ) => {
      cleanup();

      const firstPlace = response.data?.find((item) => {
        const lng = item.location?.lng;
        const lat = item.location?.lat;
        return lng !== undefined && lat !== undefined && isValidCoordinate(lng, lat);
      });

      if (response.status !== 0 || !firstPlace?.location) {
        reject(new Error(response.message || "未搜索到地点"));
        return;
      }

      resolve({
        coordinate: normalizeCoordinate({
          lng: firstPlace.location.lng!,
          lat: firstPlace.location.lat!,
        }),
        title: firstPlace.title || firstPlace.address || keyword,
      });
    };

    const params = new URLSearchParams({
      keyword,
      boundary: "region(全国,0)",
      key: MAP_CONFIG.tencentKey,
      output: "jsonp",
      callback: callbackName,
    });

    script.src = `https://apis.map.qq.com/ws/place/v1/search?${params.toString()}`;
    script.onerror = () => {
      cleanup();
      reject(new Error("地点搜索失败"));
    };

    document.head.appendChild(script);
  });
}


interface UploadItem {
  url: string;
  id: string;
  file?: File;
}

const regionIconFileName = ref("");
const regionIconFile = ref<UploadItem | null>(null);
const regionIconDetailPath = ref("");
const regionIconPreviewLoadFailed = ref(false);
let regionIconDetailRequestSeq = 0;

const clearDeptIconTempFile = () => {
  // #ifdef H5
  if (regionIconFile.value?.url.startsWith("blob:")) {
    URL.revokeObjectURL(regionIconFile.value.url);
  }
  // #endif

  regionIconFile.value = null;
};

const clearRegionIconPreviewState = () => {
  regionIconDetailRequestSeq += 1;
  regionIconDetailPath.value = "";
  regionIconPreviewLoadFailed.value = false;
};

const removeRegionIcon = () => {
  clearDeptIconTempFile();
  clearRegionIconPreviewState();

  regionIconFileName.value = "";
  deptForm.regionIcon = "";

};

const getFileName = (url?: string) => {
  if (!url) return "";

  const cleanUrl = url.split("?")[0];
  return decodeURIComponent(cleanUrl.split("/").pop() || "");
};

const normalizePreviewUrl = (url?: string) => {
  if (!url) return "";

  if (/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return url;
  }

  return normalizeUrl(url);
};

const getRegionIconFileId = (value?: string) => {
  const firstValue = String(value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean)[0];

  if (!firstValue || !/^\d+$/.test(firstValue)) {
    return 0;
  }

  return Number(firstValue);
};

const loadRegionIconDetail = async (value?: string) => {
  const requestSeq = ++regionIconDetailRequestSeq;
  regionIconDetailPath.value = "";
  regionIconPreviewLoadFailed.value = false;

  const fileId = getRegionIconFileId(value);
  if (!fileId) {
    return;
  }

  try {
    const response = await getFileDetail(fileId) as {
      data?: {
        fileName?: string;
        filePath?: string;
      };
    };

    if (requestSeq !== regionIconDetailRequestSeq) {
      return;
    }

    const filePath = String(response.data?.filePath || "");
    regionIconDetailPath.value = filePath;

    const fileName = response.data?.fileName;
    if (fileName && (!regionIconFileName.value || regionIconFileName.value === String(fileId))) {
      regionIconFileName.value = fileName;
    }
  } catch {
    if (requestSeq === regionIconDetailRequestSeq) {
      regionIconPreviewLoadFailed.value = true;
    }
  }
};

const regionIconPreviewUrl = computed(() => {
  const localUrl = regionIconFile.value?.url;
  if (localUrl) {
    return normalizePreviewUrl(localUrl);
  }

  const storedIcon = String(deptForm.regionIcon || "").trim();
  if (!storedIcon) {
    return "";
  }

  if (getRegionIconFileId(storedIcon)) {
    return normalizePreviewUrl(regionIconDetailPath.value);
  }

  return normalizePreviewUrl(storedIcon);
});

const regionIconPreviewVisible = computed(() => {
  return Boolean(regionIconPreviewUrl.value) && !regionIconPreviewLoadFailed.value;
});

const handleRegionIconPreviewLoad = () => {
  regionIconPreviewLoadFailed.value = false;
};

const handleRegionIconPreviewError = () => {
  regionIconPreviewLoadFailed.value = true;
};

const uploadDeptIcon = async (item: UploadItem) => {
  const uploadSource = item.file || item.url;
  const fileName = regionIconFileName.value || getFileName(item.url) || "region-icon";
  const response = await uploadFile(uploadSource, fileName) as UploadImageResponseLike;

  assertSuccessResponse(response);

  const filePath = String(response.data?.filePath || response.data?.file_path || response.data?.url || "");
  if (!filePath) {
    throw {
      code: response.code,
      msg: response.msg || "图片上传失败",
      data: response.data,
    };
  }

  item.id = String(response.data?.id || "");
  return filePath;
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
	clearRegionIconPreviewState();
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
	  clearRegionIconPreviewState();
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
  try {
    if (regionIconFile.value) {
      const uploadedFilePath = await uploadDeptIcon(regionIconFile.value);
      deptForm.regionIcon = uploadedFilePath;
      regionIconFileName.value = getFileName(uploadedFilePath) || regionIconFileName.value;
      clearDeptIconTempFile();
      regionIconDetailPath.value = uploadedFilePath;
      regionIconPreviewLoadFailed.value = false;
    }

    const payload = {
      ...deptForm,
    };

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
	  clearDeptIconTempFile();
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
      return localeText("停用", "Disabled");
    case 1:
      return localeText("启用", "Enabled");
    default:
      return '-';
  }
};

const getInstallStateText = (status: number): string => {
  switch(status) {
    case 0:
      return localeText("未安装", "Not installed");
    case 1:
      return localeText("已安装", "Installed");
    default:
      return '-';
  }
};


const getInstallMode = (status: number): string => {
  switch(status) {
    case 0:
      return localeText("固定点", "Fixed");
    case 1:
      return localeText("流动点", "Mobile");
    default:
      return '-';
  }
};

const getOnlineStatusText = (status: number): string => {
  switch(status) {
    case 0:
      return localeText("离线", "Offline");
    case 1:
      return localeText("在线", "Online");
    default:
      return '-';
  }
};

const getLeakStatusText = (status: number): string => {
  switch(status) {
    case 0:
      return localeText("渗漏", "Leak");
    case 1:
      return localeText("正常", "Normal");
	case 2:
	  return localeText("疑似", "Suspected");
	case 3:
	  return localeText("未知", "Unknown");
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

.region-icon-preview {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: auto;
  height: clamp(72px, 9vw, 112px);
  max-width: calc(100% - 43px);
  margin-top: 8px;
  margin-right: 43px;
  padding: 6px;
  overflow: hidden;
  background: #f8fbff;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.region-icon-preview__image {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 100px;
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

.secondary-button--active {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #8fc8f8;
}

.danger-button[disabled] {
  color: #ffd9d9;
  background: #f6a0a0;
  border-color: #f6a0a0;
  opacity: 0.72;
}

.range-dialog {
  display: flex;
  flex-direction: column;
  width: min(1180px, 96vw);
  height: min(760px, 90vh);
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  box-shadow: 0 18px 46px rgba(15, 35, 55, 0.2);
}

.range-dialog-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 18px 24px 16px;
  background: #ffffff;
}

.range-map-wrap {
  position: relative;
  z-index: 0;
  isolation: isolate;
  flex: 1;
  min-height: 430px;
  overflow: hidden;
  background: #f4f8fb;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.range-map-wrap--drawing,
.range-map-wrap--drawing :deep(*) {
  cursor: crosshair !important;
}

.range-native-map {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
  min-height: inherit;
}

.range-marker-layer {
  position: absolute;
  inset: 0;
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
}

.range-point-marker {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  color: #ffffff;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  background: #ef4444;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(15, 35, 55, 0.32);
  cursor: grab;
  pointer-events: auto;
  touch-action: none;
  transform: translate(-50%, -50%);
  user-select: none;
}

.range-point-marker:active {
  cursor: grabbing;
}

.range-point-marker--active {
  background: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.24), 0 2px 8px rgba(15, 35, 55, 0.32);
}

.range-map-error {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  padding: 8px 12px;
  color: #b91c1c;
  font-size: 13px;
  font-weight: 700;
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 4px;
}

.range-coordinate-form {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) 160px 160px 78px;
  gap: 14px;
  flex: none;
  align-items: end;
}

.range-coordinate-form__location {
  min-width: 0;
}

.range-search-button {
  width: 78px;
  min-width: 78px;
  max-width: none;
}

.range-search-button[disabled] {
  color: #98a6b5;
  background: #eef3f7;
  border-color: #d7e2ec;
  opacity: 0.72;
}

.center-dialog {
  display: flex;
  flex-direction: column;
  width: min(920px, 94vw);
  height: min(720px, 88vh);
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  box-shadow: 0 18px 46px rgba(15, 35, 55, 0.2);
}

.center-dialog-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 14px;
  min-height: 0;
  padding: 18px 24px 16px;
  background: #ffffff;
}

.center-map-wrap {
  flex: 1;
  min-height: 360px;
  overflow: hidden;
  background: #f4f8fb;
  border: 1px solid #d5e2ee;
  border-radius: 4px;
}

.center-map-wrap--drawing,
.center-map-wrap--drawing :deep(*) {
  cursor: crosshair !important;
}

.center-map-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 360px;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
}

.center-coordinate-form {
  display: grid;
  grid-template-columns: 268px 152px 230px;
  gap: 14px;
  flex: none;
  justify-content: start;
}

.center-coordinate-form__location {
  min-width: 0;
}

.center-search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.center-search-row__input {
  flex: 1;
  min-width: 0;
}

.center-search-button {
  min-width: 70px;
  max-width: none;
}

.center-search-button[disabled] {
  color: #98a6b5;
  background: #eef3f7;
  border-color: #d7e2ec;
  opacity: 0.72;
}

.color-picker-panel {
  width: 452px;
  max-width: calc(100vw - 28px);
}

.color-picker-body {
  padding: 10px 12px 12px;
}

.color-picker-content {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.color-board {
  position: relative;
  flex: none;
  width: 236px;
  height: 236px;
  overflow: hidden;
  cursor: crosshair;
  border: 1px solid #b7c0cb;
  box-sizing: border-box;
}

.color-board__white,
.color-board__black {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.color-board__white {
  background: linear-gradient(90deg, #ffffff 0%, rgba(255, 255, 255, 0) 100%);
}

.color-board__black {
  background: linear-gradient(0deg, #000000 0%, rgba(0, 0, 0, 0) 100%);
}

.color-board__cursor {
  position: absolute;
  z-index: 2;
  width: 16px;
  height: 16px;
  pointer-events: none;
  border: 2px solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.72);
  transform: translate(-50%, -50%);
  box-sizing: border-box;
}

.color-hue-slider {
  position: relative;
  flex: none;
  width: 28px;
  height: 236px;
  cursor: ns-resize;
  background: linear-gradient(
    180deg,
    #ff0000 0%,
    #ffff00 16.66%,
    #00ff00 33.33%,
    #00ffff 50%,
    #0000ff 66.66%,
    #ff00ff 83.33%,
    #ff0000 100%
  );
  border: 1px solid #c7d0d9;
  box-sizing: border-box;
}

.color-hue-slider__cursor {
  position: absolute;
  left: -6px;
  right: -6px;
  height: 0;
  pointer-events: none;
  border-top: 2px solid rgba(255, 255, 255, 0.95);
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.45));
  transform: translateY(-1px);
}

.color-hue-slider__cursor::before,
.color-hue-slider__cursor::after {
  position: absolute;
  top: -5px;
  width: 0;
  height: 0;
  content: "";
  border-top: 5px solid transparent;
  border-bottom: 5px solid transparent;
}

.color-hue-slider__cursor::before {
  left: -1px;
  border-left: 0;
  border-right: 6px solid #8a8f98;
}

.color-hue-slider__cursor::after {
  right: -1px;
  border-right: 0;
  border-left: 6px solid #8a8f98;
}

.color-control-panel {
  display: flex;
  flex: none;
  flex-direction: column;
  gap: 12px;
  width: 104px;
}

.color-current {
  width: 104px;
  height: 42px;
  border: 1px solid #c7d0d9;
  box-sizing: border-box;
}

.color-input-list {
  display: grid;
  gap: 10px;
}

.color-input-row {
  display: flex;
  align-items: center;
  width: 104px;
  height: 30px;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #cfd7df;
  border-radius: 4px;
  box-sizing: border-box;
}

.color-input-label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25px;
  height: 100%;
  flex: none;
  color: #53687f;
  font-size: 16px;
  font-weight: 700;
  background: #f5f7fa;
  border-right: 1px solid #d7dfe7;
  box-sizing: border-box;
}

.color-number-input,
.color-hex-input {
  min-width: 0;
  height: 100%;
  flex: 1;
  padding: 0 7px;
  color: #2f4054;
  font-size: 15px;
  line-height: 30px;
  text-align: right;
  background: #ffffff;
  border: 0;
  outline: none;
  box-sizing: border-box;
}

.color-hex-input {
  text-align: left;
  text-transform: lowercase;
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

  .range-dialog,
  .center-dialog {
    width: 94vw;
    height: 86vh;
  }

  .range-dialog-body,
  .center-dialog-body {
    padding: 14px;
  }

  .range-map-wrap,
  .center-map-wrap,
  .center-map-fallback {
    min-height: 280px;
  }

  .range-coordinate-form,
  .center-coordinate-form {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .range-search-button {
    width: 100%;
    min-width: 0;
  }

  .color-picker-panel {
    width: 94vw;
  }

  .color-picker-content {
    flex-wrap: wrap;
  }

  .color-board {
    width: min(236px, calc(94vw - 110px));
    height: min(236px, calc(94vw - 110px));
  }

  .color-hue-slider {
    height: min(236px, calc(94vw - 110px));
  }

  .color-control-panel {
    width: 100%;
    flex-direction: row;
    align-items: flex-start;
  }

  .color-input-list {
    grid-template-columns: repeat(2, 104px);
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
