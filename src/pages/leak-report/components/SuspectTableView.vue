<template>
  <view class="suspect-view">
    <!-- ========== 筛选栏 ========== -->
    <view class="suspect-toolbar">
      <view class="toolbar-row toolbar-row--filters">
        <view class="filter-group">
          <text class="filter-label">检出类型</text>
          <picker :range="detectTypeFilterOptions" range-key="label" :value="currentDetectTypeIndex" @change="handleDetectTypeChange">
            <view class="filter-select">
              <text>{{ currentDetectTypeLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">处理状态</text>
          <picker :range="processStatusFilterOptions" range-key="label" :value="currentProcessStatusIndex" @change="handleProcessStatusChange">
            <view class="filter-select">
              <text>{{ currentProcessStatusLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">是否漏点</text>
          <picker :range="isLeakPointFilterOptions" range-key="label" :value="currentIsLeakPointIndex" @change="handleIsLeakPointChange">
            <view class="filter-select">
              <text>{{ currentIsLeakPointLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>

        <view class="filter-group">
          <text class="filter-label">上报人员</text>
          <input v-model="filters.reporter" class="filter-input" placeholder="请输入上报人员" placeholder-class="input-placeholder" />
        </view>

        <view class="filter-group filter-group--date">
          <text class="filter-label">检出时间</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" title="选择开始时间" placeholder="请选择开始时间" />
            <text class="filter-separator">至</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" title="选择结束时间" placeholder="请选择结束时间" />
          </view>
        </view>

        <view class="toolbar-actions toolbar-actions--inline">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchSuspects">查询</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" aria-label="刷新" @click="fetchSuspects">
            <text class="icon-refresh"></text>
          </button>
        </view>
      </view>

      <view v-if="mode === 'management'" class="toolbar-row toolbar-row--bottom">
        <view class="toolbar-actions">
          <button
            class="toolbar-button toolbar-button--primary toolbar-button--create"
            hover-class="toolbar-button--hover"
            @click="emit('create')"
          >
            新增疑点
          </button>
          <button
            class="toolbar-button"
            :disabled="!selectedSuspect"
            hover-class="toolbar-button--hover"
            @click="selectedSuspect && emit('edit', selectedSuspect)"
          >
            编辑疑点
          </button>
          <button
            class="toolbar-button toolbar-button--danger"
            :disabled="!selectedSuspect"
            hover-class="toolbar-button--hover"
            @click="removeSuspect"
          >
            删除疑点
          </button>
        </view>
      </view>

      <view v-if="mode === 'processing'" class="toolbar-row toolbar-row--bottom">
        <view class="toolbar-actions">
          <button
            class="toolbar-button toolbar-button--primary"
            :disabled="!selectedSuspect || processing || getIsLeakPoint(selectedSuspect) === 1 || getProcessStatus(selectedSuspect) === 4"
            hover-class="toolbar-button--hover"
            @click="openConfirmLeakDialog"
          >
            确认疑点
          </button>
          <button
            class="toolbar-button"
            :disabled="!selectedSuspect || processing || getProcessStatus(selectedSuspect) !== 0"
            hover-class="toolbar-button--hover"
            @click="openDispatchDialog"
          >
            转工单
          </button>
        </view>
      </view>
    </view>

    <!-- ========== 左侧表格 + 右侧详情面板 ========== -->
    <view class="suspect-layout">
      <!-- 左侧表格 -->
      <view class="suspect-table-panel">
        <view class="table-head">
          <text>{{ pageTitle }}</text>
          <text class="table-head__meta">共 {{ total }} 条</text>
        </view>

        <scroll-view class="table-scroll" scroll-x scroll-y>
          <view class="data-table">
            <view class="data-row data-row--header">
              <text class="data-cell data-cell--index data-header-cell--sortable" :class="{ 'data-header-cell--active': sortField === 'index' }" @click="toggleSort('index')">序号<text class="sort-indicator" :class="getSortClass('index')"></text></text>
              <text class="data-cell data-cell--detect-type data-header-cell--sortable" :class="{ 'data-header-cell--active': sortField === 'detectType' }" @click="toggleSort('detectType')">检出类型<text class="sort-indicator" :class="getSortClass('detectType')"></text></text>
              <text class="data-cell data-cell--process-status data-header-cell--sortable" :class="{ 'data-header-cell--active': sortField === 'processStatus' }" @click="toggleSort('processStatus')">处理状态<text class="sort-indicator" :class="getSortClass('processStatus')"></text></text>
              <text class="data-cell data-cell--is-leak data-header-cell--sortable" :class="{ 'data-header-cell--active': sortField === 'isLeakPoint' }" @click="toggleSort('isLeakPoint')">是否漏点<text class="sort-indicator" :class="getSortClass('isLeakPoint')"></text></text>
              <text class="data-cell data-cell--position data-header-cell--sortable" :class="{ 'data-header-cell--active': sortField === 'leakPointPosition' }" @click="toggleSort('leakPointPosition')">漏点位置<text class="sort-indicator" :class="getSortClass('leakPointPosition')"></text></text>
              <text class="data-cell data-cell--time data-header-cell--sortable" :class="{ 'data-header-cell--active': sortField === 'reportTime' }" @click="toggleSort('reportTime')">上报时间<text class="sort-indicator" :class="getSortClass('reportTime')"></text></text>
              <text class="data-cell data-cell--reporter data-header-cell--sortable" :class="{ 'data-header-cell--active': sortField === 'reporter' }" @click="toggleSort('reporter')">上报人员<text class="sort-indicator" :class="getSortClass('reporter')"></text></text>
              <text class="data-cell data-cell--worksheet data-header-cell--sortable" :class="{ 'data-header-cell--active': sortField === 'workOrderNo' }" @click="toggleSort('workOrderNo')">关联工单<text class="sort-indicator" :class="getSortClass('workOrderNo')"></text></text>
            </view>

            <view v-if="loading" class="table-state">加载中...</view>
            <view v-else-if="suspects.length === 0" class="table-state">暂无疑点数据</view>

            <view v-else class="data-table-body" :class="{ 'data-table-body--loading': loading }">
              <view
                v-for="(item, index) in suspects"
                :key="getRowKey(item, index)"
                class="data-row"
                :class="{ 'data-row--active': selectedKey === getRowKey(item, index) }"
                @click="selectSuspect(item, index)"
              >
                <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
                <text class="data-cell data-cell--detect-type">{{ getTextValue(item, ["detectType"], "-") }}</text>
                <text class="data-cell data-cell--process-status">
                  <text class="status-tag" :class="getProcessStatusClass(item)">{{ getProcessStatusLabel(item) }}</text>
                </text>
                <text class="data-cell data-cell--is-leak">
                  <text class="status-tag" :class="getIsLeakPointClass(item)">{{ getIsLeakPointLabel(item) }}</text>
                </text>
                <text class="data-cell data-cell--position">{{ getTextValue(item, ["leakPointPosition"], "-") }}</text>
                <text class="data-cell data-cell--time">{{ formatDateTime(getTextValue(item, ["reportTime"], "-")) }}</text>
                <text class="data-cell data-cell--reporter">{{ getTextValue(item, ["reporter"], "-") }}</text>
                <text
                  class="data-cell data-cell--worksheet data-cell--link"
                  @click.stop="navigateToWorkOrderFromRow(item)"
                >{{ getTextValue(item, ["workOrderNo"], "-") }}</text>
              </view>
            </view>
          </view>
        </scroll-view>

        <view class="pagination-bar">
          <button class="page-button" hover-class="page-button--hover" :disabled="pagination.pageNum <= 1" @click="changePage(-1)">上一页</button>
          <text class="page-info">第 {{ pagination.pageNum }} / {{ totalPages }} 页</text>
          <button class="page-button" hover-class="page-button--hover" :disabled="pagination.pageNum >= totalPages" @click="changePage(1)">下一页</button>
          <view class="page-jump">
            <text class="page-jump__prefix">到 第</text>
            <input v-model="jumpPageInput" class="page-jump__input" type="number" min="1" :max="totalPages" placeholder="" @confirm="jumpToPage" />
            <text class="page-jump__suffix">页</text>
            <button class="page-button" hover-class="page-button--hover" :disabled="!jumpPageInput" @click="jumpToPage">跳转</button>
          </view>
        </view>
      </view>

      <!-- 右侧详情面板 -->
      <view class="suspect-detail-panel">
        <view class="detail-tabs">
          <view
            v-for="tab in detailTabs"
            :key="tab.value"
            class="detail-tab"
            :class="{ 'detail-tab--active': activeTab === tab.value }"
            @click="activeTab = tab.value"
          >
            {{ tab.label }}
          </view>
        </view>

        <view v-if="!selectedSuspect" class="detail-empty">请选择左侧疑点查看详情</view>
        <view v-else class="detail-body">
          <!-- 疑点详情 Tab -->
          <view v-if="activeTab === 'base'" class="detail-base-panel">
            <view class="detail-summary">
              <view class="detail-summary__main">
                <text class="detail-summary__label">疑点编号</text>
                <text class="detail-summary__number">{{ getId(selectedSuspect) }}</text>
              </view>
              <view class="detail-summary__badges">
                <text class="detail-summary__badge status-pill" :class="getProcessStatusClass(selectedSuspect)">{{ getProcessStatusLabel(selectedSuspect) }}</text>
                <text class="detail-summary__badge urgency-pill" :class="getIsLeakPointClass(selectedSuspect)">{{ getIsLeakPointLabel(selectedSuspect) }}</text>
              </view>
              <view class="detail-summary__meta">
                <view v-for="item in baseSummaryMeta" :key="item.label" class="detail-summary__meta-item">
                  <text class="detail-summary__meta-label">{{ item.label }}</text>
                  <text class="detail-summary__meta-value">{{ item.value }}</text>
                </view>
              </view>
            </view>

            <view class="detail-grid detail-grid--base">
              <view v-for="(field, fi) in baseDetailFields" :key="fi" class="detail-item detail-item--base">
                <text class="detail-item__label">{{ field.label }}</text>
                <view v-if="field.label === '坐标位置' && field.value !== '-'" class="detail-item__value detail-item__value--link" @click="openDetailMap">{{ field.value }}</view>
                <text v-else class="detail-item__value">{{ field.value }}</text>
              </view>
            </view>
            <view v-if="detailMapVisible" class="detail-map-mask" @click="closeDetailMap">
              <view class="detail-map-panel" @click.stop>
                <view class="detail-map-panel__body">
                  <!-- #ifdef H5 -->
                  <LocaleCoordinateMap
                    :lng="detailMapCoord.lng"
                    :lat="detailMapCoord.lat"
                  />
                  <!-- #endif -->
                  <!-- #ifndef H5 -->
                  <view class="detail-map-panel__fallback">地图仅支持 H5 端展示</view>
                  <!-- #endif -->
                </view>
              </view>
            </view>

            <view class="detail-time-panel detail-time-panel--embedded">
              <text class="detail-section-title">时间信息</text>
              <view class="time-list">
                <view v-for="item in timeInfoFields" :key="item.label" class="time-row">
                  <view class="time-row__marker"></view>
                  <view class="time-row__content">
                    <text class="time-row__label">{{ item.label }}</text>
                    <text class="time-row__value">{{ item.value }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>

          <!-- 管道信息 Tab -->
          <view v-if="activeTab === 'pipe'" class="detail-base-panel">
            <view class="detail-fields-grid">
              <view v-for="item in pipeDetailFields" :key="item.label" class="detail-field-card">
                <text class="detail-field-card__label">{{ item.label }}</text>
                <text class="detail-field-card__value">{{ item.value }}</text>
              </view>
            </view>
          </view>

          <!-- 关联信息 Tab -->
          <view v-if="activeTab === 'related'" class="detail-base-panel">
            <view class="detail-fields-grid">
              <view v-for="item in relatedDetailFields" :key="item.label" class="detail-field-card">
                <text class="detail-field-card__label">{{ item.label }}</text>
                <view v-if="item.type === 'images'" class="detail-field-card__value detail-field-card__value--link" @click="previewMediaFiles(item.paths ?? [], 'image')">
                  {{ item.value }}
                </view>
                <view v-else-if="item.type === 'video'" class="detail-field-card__value detail-field-card__value--link" @click="previewMediaFiles([item.path ?? ''], 'video')">
                  {{ item.value }}
                </view>
                <view v-else-if="item.type === 'audio'" class="detail-field-card__value">
                  <view class="audio-inline-player">
                    <view class="audio-inline-player__btn" @click="toggleAudio(item.path ?? '')">
                      <text class="audio-inline-player__icon">{{ audioSrc === item.path && audioPlaying ? '⏸' : '▶' }}</text>
                    </view>
                    <view
                      class="audio-inline-player__track"
                      @click.stop="seekAudio($event, item.path ?? '')"
                    >
                      <view class="audio-inline-player__bar" :style="{ width: (audioSrc === item.path ? audioProgress : 0) + '%' }"></view>
                    </view>
                    <text class="audio-inline-player__time">
                      {{ audioSrc === item.path ? formatAudioTime(audioCurrentTime) + ' / ' + formatAudioTime(audioDuration) : '00:00 / 00:00' }}
                    </text>
                  </view>
                </view>
                <view v-else-if="item.type === 'workOrder'" class="detail-field-card__value detail-field-card__value--link" @click="viewWorkOrder">
                  {{ item.value }}
                </view>
                <text v-else class="detail-field-card__value">{{ item.value }}</text>
              </view>
            </view>
          </view>
      </view>
    </view>
  </view>

    <!-- ========== 转工单对话框 ========== -->
    <view v-if="dispatchDialogVisible" class="dialog-mask" @click.self="closeDispatchDialog">
      <view class="dialog-panel" @click.stop>
        <view class="dialog-header">
          <view>
            <text class="dialog-title">转工单</text>
            <text class="dialog-subtitle">填写工单信息，将疑点转为工单处理</text>
          </view>
          <button class="dialog-close" hover-class="dialog-close--hover" aria-label="关闭" @click="closeDispatchDialog">×</button>
        </view>
                <view class="dialog-body">
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">疑点编号</text>
              <view class="form-readonly">{{ dispatchSuspectId || "-" }}</view>
            </view>
            <view class="form-field">
              <text class="form-label">工单编号</text>
              <input v-model="dispatchForm.workOrderNo" class="form-input" placeholder="不填则自动生成" placeholder-class="input-placeholder" />
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">预期时间</text>
              <WorkOrderDatetimePicker v-model="dispatchForm.expectedTime" class="form-datetime" title="选择预期时间" placeholder="请选择预期时间" />
            </view>
            <view class="form-field">
              <text class="form-label">紧急程度</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" :class="{ 'form-select--open': dispatchUrgencySelectOpen, 'form-control--error': dispatchUrgencyError }" @click.stop="dispatchUrgencySelectOpen = !dispatchUrgencySelectOpen">
                  <text :class="{ 'select-placeholder': !dispatchForm.urgencyLevel }">{{ dispatchUrgencyLabel }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="dispatchUrgencySelectOpen" class="select-menu">
                  <view v-for="item in urgencyOptions" :key="item.value" class="select-option" :class="{ 'select-option--active': dispatchForm.urgencyLevel === item.value }" @click.stop="selectDispatchUrgency(item.value)">{{ item.label }}</view>
                </view>
              </view>
              <text v-if="dispatchUrgencyError" class="form-error">{{ dispatchUrgencyError }}</text>
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">处理流程</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" :class="{ 'form-select--open': processFlowSelectOpen }" @click.stop="processFlowSelectOpen = !processFlowSelectOpen">
                  <text :class="{ 'select-placeholder': !dispatchForm.processFlow }">{{ dispatchForm.processFlow || "请选择处理流程" }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="processFlowSelectOpen" class="select-menu">
                  <view v-for="item in processFlowOptions" :key="item" class="select-option" :class="{ 'select-option--active': dispatchForm.processFlow === item }" @click.stop="selectProcessFlow(item)"><text>{{ item }}</text></view>
                </view>
              </view>
            </view>
            <view class="form-field">
              <text class="form-label">工单类别</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" :class="{ 'form-select--open': workOrderCategorySelectOpen }" @click.stop="workOrderCategorySelectOpen = !workOrderCategorySelectOpen">
                  <text :class="{ 'select-placeholder': !dispatchForm.workOrderCategory }">{{ dispatchForm.workOrderCategory || "请选择工单类别" }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="workOrderCategorySelectOpen" class="select-menu">
                  <view v-for="item in workOrderCategoryOptions" :key="item" class="select-option" :class="{ 'select-option--active': dispatchForm.workOrderCategory === item }" @click.stop="selectWorkOrderCategory(item)"><text>{{ item }}</text></view>
                </view>
              </view>
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">流程类型</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" :class="{ 'form-select--open': flowTypeSelectOpen }" @click.stop="flowTypeSelectOpen = !flowTypeSelectOpen">
                  <text :class="{ 'select-placeholder': !dispatchForm.flowType }">{{ dispatchForm.flowType || "请选择流程类型" }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="flowTypeSelectOpen" class="select-menu">
                  <view v-for="item in flowTypeOptions" :key="item" class="select-option" :class="{ 'select-option--active': dispatchForm.flowType === item }" @click.stop="selectFlowType(item)"><text>{{ item }}</text></view>
                </view>
              </view>
            </view>
            <view class="form-field">
              <text class="form-label">处理方式</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" :class="{ 'form-select--open': handleMethodSelectOpen }" @click.stop="handleMethodSelectOpen = !handleMethodSelectOpen">
                  <text :class="{ 'select-placeholder': !dispatchForm.handleMethod }">{{ dispatchForm.handleMethod || "请选择处理方式" }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="handleMethodSelectOpen" class="select-menu">
                  <view v-for="item in handleMethodOptions" :key="item" class="select-option" :class="{ 'select-option--active': dispatchForm.handleMethod === item }" @click.stop="selectHandleMethod(item)"><text>{{ item }}</text></view>
                </view>
              </view>
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">渗漏状态</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" :class="{ 'form-select--open': leakageStatusSelectOpen }" @click.stop="leakageStatusSelectOpen = !leakageStatusSelectOpen">
                  <text :class="{ 'select-placeholder': !dispatchForm.leakageStatus }">{{ dispatchForm.leakageStatus || "请选择渗漏状态" }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="leakageStatusSelectOpen" class="select-menu">
                  <view v-for="item in leakageStatusOptions" :key="item" class="select-option" :class="{ 'select-option--active': dispatchForm.leakageStatus === item }" @click.stop="selectLeakageStatus(item)"><text>{{ item }}</text></view>
                </view>
              </view>
            </view>
            <view class="form-field">
              <text class="form-label">处理人员</text>
              <input v-model="dispatchForm.handler" class="form-input" placeholder="请输入处理人员" placeholder-class="input-placeholder" />
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">所属分区</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" :class="{ 'form-select--open': dispatchDeptIdSelectOpen }" @click.stop="dispatchDeptIdSelectOpen = !dispatchDeptIdSelectOpen">
                  <text :class="{ 'select-placeholder': !dispatchForm.deptId }">{{ dispatchForm.deptId ? ((deptNameMap)[dispatchForm.deptId] || dispatchForm.deptId) : "请选择所属分区" }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="dispatchDeptIdSelectOpen" class="select-menu">
                  <view v-for="item in regionOptions" :key="item.id" class="select-option" :class="{ 'select-option--active': dispatchForm.deptId === item.id }" @click.stop="selectDispatchDeptId(item.id)"><text>{{ item.deptName }}</text></view>
                  <view v-if="regionOptions.length === 0" class="select-option select-option--empty">暂无分区数据</view>
                </view>
              </view>
            </view>
            <view class="form-field">
              <text class="form-label">设备编号</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" :class="{ 'form-select--open': dispatchDeviceSelectOpen }" @click.stop="dispatchDeviceSelectOpen = !dispatchDeviceSelectOpen">
                  <text :class="{ 'select-placeholder': !dispatchForm.deviceNo }">{{ dispatchForm.deviceNo || "请选择设备编号" }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="dispatchDeviceSelectOpen" class="select-menu">
                  <view class="select-search"><input v-model="dispatchDeviceSearch" class="select-search-input" placeholder="搜索设备..." placeholder-class="input-placeholder" @click.stop /></view>
                  <view v-for="item in filteredDispatchDeviceOptions" :key="item.deviceNumber" class="select-option" :class="{ 'select-option--active': dispatchForm.deviceNo === item.deviceNumber }" @click.stop="selectDispatchDevice(item.deviceNumber)"><text>{{ item.deviceNumber }}</text></view>
                  <view v-if="filteredDispatchDeviceOptions.length === 0" class="select-option select-option--empty">暂无匹配设备</view>
                </view>
              </view>
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">安装图片</text>
              <view class="upload-area">
                <view v-if="dispatchImageItem.url" class="upload-preview-grid">
                  <view class="upload-preview-item">
                    <image :src="dispatchImageItem.url" class="upload-preview-img" mode="aspectFill" @click="previewDispatchImage" />
                    <view class="upload-preview-remove" @click.stop="removeDispatchImage">×</view>
                  </view>
                </view>
                <view v-else class="upload-placeholder" @click="pickDispatchImage">
                  <text class="upload-placeholder__title">点击上传图片</text>
                  <text class="upload-placeholder__hint">支持 jpg、png 格式</text>
                </view>
              </view>
            </view>
            <view class="form-field">
              <text class="form-label">安装地址</text>
              <view class="form-row">
                <input v-model="dispatchForm.installAddress" class="form-input form-input--flex" placeholder="经度,纬度 (如 121.4737,31.2304)" placeholder-class="input-placeholder" />
                <button class="form-action-btn" hover-class="form-action-btn--hover" @click="pickDispatchLocation">
                  <text class="form-action-btn__icon form-action-btn__icon--map"></text><text>定位</text>
                </button>
              </view>
              <view v-if="dispatchMapPickerVisible" class="dispatch-map-picker">
                <view class="dispatch-map-picker__head">
                  <text class="dispatch-map-picker__title">点击地图选取坐标</text>
                  <text class="dispatch-map-picker__coord" :class="{ 'dispatch-map-picker__coord--active': dispatchMapPickedCoord }">{{ dispatchMapPickedCoord || "请在地图上点击选择" }}</text>
                </view>
                <view class="dispatch-map-picker__body">
                  <!-- #ifdef H5 -->
                  <LocaleCoordinateMap
                    :lng="dispatchMapCenter.lng"
                    :lat="dispatchMapCenter.lat"
                    selectable
                    @pick="handleDispatchMapPick"
                  />
                  <!-- #endif -->
                  <!-- #ifndef H5 -->
                  <view class="dispatch-map-picker__fallback">地图选点仅支持 H5 端</view>
                  <!-- #endif -->
                </view>
                <view class="dispatch-map-picker__actions">
                  <button class="dialog-btn dialog-btn--cancel" hover-class="dialog-btn--hover" @click="closeDispatchMapPicker">取消</button>
                  <button class="dialog-btn dialog-btn--primary" :disabled="!dispatchMapPickedCoord" hover-class="dialog-btn--hover" @click="confirmDispatchMapPick">确认选点</button>
                </view>
              </view>
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">工单详情</text>
              <textarea v-model="dispatchForm.detail" class="form-textarea" placeholder="请输入工单详情" placeholder-class="input-placeholder" />
            </view>
            <view class="form-field">
              <text class="form-label">备注</text>
              <textarea v-model="dispatchForm.remark" class="form-textarea" placeholder="请输入备注" placeholder-class="input-placeholder" />
            </view>
          </view>
        </view><view class="dialog-footer">
          <button class="dialog-button" hover-class="dialog-button--hover" @click="closeDispatchDialog">取消</button>
          <button class="dialog-button dialog-button--primary" :disabled="processing" hover-class="dialog-button--hover" @click="submitDispatch">
            {{ processing ? "处理中..." : "确认转工单" }}
          </button>
        </view>
      </view>
    </view>

    <!-- ========== 确认疑点对话框 ========== -->
    <view v-if="confirmLeakDialogVisible" class="dialog-mask" @click.self="closeConfirmLeakDialog">
      <view class="dialog-panel" @click.stop>
        <view class="dialog-header">
          <view>
            <text class="dialog-title">确认疑点</text>
            <text class="dialog-subtitle">确认后该疑点将转为漏点记录，同步到漏点界面</text>
          </view>
          <button class="dialog-close" hover-class="dialog-close--hover" aria-label="关闭" @click="closeConfirmLeakDialog">×</button>
        </view>
        <view class="dialog-body">
          <view class="form-field">
            <text class="form-label">疑点编号</text>
            <view class="form-readonly">{{ confirmLeakSuspectId || "-" }}</view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">检出时间</text>
              <WorkOrderDatetimePicker v-model="confirmLeakForm.detectTime" class="form-datetime" title="选择检出时间" placeholder="请选择检出时间" />
            </view>
            <view class="form-field">
              <text class="form-label">检出难度</text>
              <view class="select-field">
                <view
                  class="form-select form-select--dropdown"
                  :class="{ 'form-select--open': detectDifficultySelectOpen }"
                  @click.stop="detectDifficultySelectOpen = !detectDifficultySelectOpen"
                >
                  <text :class="{ 'select-placeholder': !confirmLeakForm.detectDifficulty }">{{ confirmLeakForm.detectDifficulty || "请选择检出难度" }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="detectDifficultySelectOpen" class="select-menu">
                  <view
                    v-for="item in detectDifficultyOptions"
                    :key="item.value"
                    class="select-option"
                    :class="{ 'select-option--active': confirmLeakForm.detectDifficulty === item.value }"
                    @click.stop="selectDetectDifficulty(item.value)"
                  >
                    {{ item.label }}
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">漏点类型</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" :class="{ 'form-select--open': leakPointTypeSelectOpen }" @click.stop="leakPointTypeSelectOpen = !leakPointTypeSelectOpen">
                  <text :class="{ 'select-placeholder': !confirmLeakForm.leakPointType }">{{ confirmLeakForm.leakPointType || "请选择漏点类型" }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="leakPointTypeSelectOpen" class="select-menu">
                  <view v-for="item in leakPointTypeOptions" :key="item" class="select-option" :class="{ 'select-option--active': confirmLeakForm.leakPointType === item }" @click.stop="selectLeakPointType(item)">
                    <text>{{ item }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view class="form-field">
              <text class="form-label">漏点位置</text>
              <input v-model="confirmLeakForm.leakPointPosition" class="form-input" placeholder="请输入漏点位置" placeholder-class="input-placeholder" />
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">坐标位置</text>
              <input v-model="confirmLeakForm.coordinatePosition" class="form-input" placeholder="请输入坐标位置" placeholder-class="input-placeholder" />
            </view>
            <view class="form-field">
              <text class="form-label">初判级别</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" :class="{ 'form-select--open': initialLevelSelectOpen }" @click.stop="initialLevelSelectOpen = !initialLevelSelectOpen">
                  <text :class="{ 'select-placeholder': !confirmLeakForm.initialLevel }">{{ confirmLeakForm.initialLevel || "请选择初判级别" }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="initialLevelSelectOpen" class="select-menu">
                  <view v-for="item in initialLevelOptions" :key="item.value" class="select-option" :class="{ 'select-option--active': confirmLeakForm.initialLevel === item.value }" @click.stop="selectInitialLevel(item.value)">
                    <text>{{ item.label }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">漏点大小</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" :class="{ 'form-select--open': leakPointSizeSelectOpen }" @click.stop="leakPointSizeSelectOpen = !leakPointSizeSelectOpen">
                  <text :class="{ 'select-placeholder': !confirmLeakForm.leakPointSize }">{{ confirmLeakForm.leakPointSize || "请选择漏点大小" }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="leakPointSizeSelectOpen" class="select-menu">
                  <view v-for="item in leakPointSizeOptions" :key="item" class="select-option" :class="{ 'select-option--active': confirmLeakForm.leakPointSize === item }" @click.stop="selectLeakPointSize(item)">
                    <text>{{ item }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view class="form-field">
              <text class="form-label">漏点路面</text>
              <view class="select-field">
                <view class="form-select form-select--dropdown" :class="{ 'form-select--open': leakRoadSurfaceSelectOpen }" @click.stop="leakRoadSurfaceSelectOpen = !leakRoadSurfaceSelectOpen">
                  <text :class="{ 'select-placeholder': !confirmLeakForm.leakRoadSurface }">{{ confirmLeakForm.leakRoadSurface || "请选择漏点路面" }}</text>
                  <text class="select-arrow"></text>
                </view>
                <view v-if="leakRoadSurfaceSelectOpen" class="select-menu">
                  <view v-for="item in leakRoadSurfaceOptions" :key="item" class="select-option" :class="{ 'select-option--active': confirmLeakForm.leakRoadSurface === item }" @click.stop="selectLeakRoadSurface(item)">
                    <text>{{ item }}</text>
                  </view>
                </view>
              </view>
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">泄露部位</text>
              <input v-model="confirmLeakForm.leakPart" class="form-input" placeholder="请输入泄露部位" placeholder-class="input-placeholder" />
            </view>
            <view class="form-field">
              <text class="form-label">产生漏点原因</text>
              <input v-model="confirmLeakForm.leakReason" class="form-input" placeholder="请输入产生漏点原因" placeholder-class="input-placeholder" />
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">修复时间</text>
              <WorkOrderDatetimePicker v-model="confirmLeakForm.repairTime" class="form-datetime" title="选择修复时间" placeholder="请选择修复时间" />
            </view>
            <view class="form-field">
              <text class="form-label">巡检人员</text>
              <input v-model="confirmLeakForm.inspector" class="form-input" placeholder="请输入巡检人员" placeholder-class="input-placeholder" />
            </view>
          </view>
          <view class="form-grid form-grid--two">
            <view class="form-field">
              <text class="form-label">定漏人员</text>
              <input v-model="confirmLeakForm.locator" class="form-input" placeholder="请输入定漏人员" placeholder-class="input-placeholder" />
            </view>
            <view class="form-field" />
          </view>
          <view class="form-field">
            <text class="form-label">备注</text>
            <textarea v-model="confirmLeakForm.remark" class="form-textarea" placeholder="请输入备注" placeholder-class="input-placeholder" />
          </view>
        </view>
        <view class="dialog-footer">
          <button class="dialog-button" hover-class="dialog-button--hover" @click="closeConfirmLeakDialog">取消</button>
          <button class="dialog-button dialog-button--primary" :disabled="processing" hover-class="dialog-button--hover" @click="submitConfirmLeak">
            {{ processing ? "处理中..." : "确认" }}
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { getSuspectPage, getSuspectDetail, deleteSuspect } from "@/services/leak-report/suspected-leak";
import { dispatchSuspect, confirmLeakPoint } from "@/services/leak-report/suspected-leak";
import WorkOrderDatetimePicker from "@/pages/work-order/components/WorkOrderDatetimePicker.vue";
import { getRegionList } from "@/services/leak-report/region";
import { getDeviceVisibleList } from "@/services/leak-report/device";
import { getPartitionDeviceList } from "@/services/partition/partition";
import { uploadFile } from "@/services/leak-report/file-upload";
import LocaleCoordinateMap from "@/components/map/LocaleCoordinateMap.vue";

// ========== 类型定义 ==========
type SuspectMode = "management" | "processing";
type DetailTab = "base" | "pipe" | "related";
type SuspectRecord = Record<string, unknown>;
type OptionValue = number | string;
type SelectOption = {
  label: string;
  value: OptionValue;
};

interface ApiResponseLike {
  code?: number;
  data?: unknown;
  records?: unknown[];
  rows?: unknown[];
  total?: number;
  msg?: string;
}

// ========== Props / Emits ==========
const props = defineProps<{
  mode: SuspectMode;
}>();

const emit = defineEmits<{
  (event: "create"): void;
  (event: "edit", suspect: SuspectRecord): void;
}>();

// ========== 常量 ==========
const pageTitleMap: Record<SuspectMode, string> = {
  management: "疑点管理列表",
  processing: "疑点处理列表",
};

const processStatusFilterOptions: SelectOption[] = [
  { label: "不限", value: "" },
  { label: "未处理", value: 0 },
  { label: "已派单", value: 1 },
  { label: "处理中", value: 2 },
  { label: "已完成", value: 3 },
  { label: "已取消", value: 4 },
];

const isLeakPointFilterOptions: SelectOption[] = [
  { label: "不限", value: "" },
  { label: "否", value: 0 },
  { label: "是", value: 1 },
  { label: "待确认", value: 2 },
];

const detectTypeFilterOptions: SelectOption[] = [
  { label: "全部", value: "" },
  { label: "人工检出", value: "人工检出" },
  { label: "设备检出", value: "设备检出" },
];

const processStatusLabelMap: Record<number, string> = {
  0: "未处理",
  1: "已派单",
  2: "处理中",
  3: "已完成",
  4: "已取消",
};

const isLeakPointLabelMap: Record<number, string> = {
  0: "否",
  1: "是",
  2: "待确认",
};

const urgencyOptions: SelectOption[] = [
  { label: "低", value: "low" },
  { label: "中", value: "medium" },
  { label: "高", value: "high" },
  { label: "紧急", value: "urgent" },
];

// 转工单下拉选项
const processFlowSelectOpen = ref(false);
const processFlowOptions = ["噪声工单", "消火栓工单", "水锤工单", "温振工单"];

const leakageStatusSelectOpen = ref(false);
const leakageStatusOptions = ["正常", "疑似", "渗漏", "未抄", "新装"];

const workOrderCategorySelectOpen = ref(false);
const workOrderCategoryOptions = ["巡检", "检漏", "拆装", "维护"];

const flowTypeSelectOpen = ref(false);
const flowTypeOptions = ["派单", "转办", "抢单", "指定"];

const handleMethodSelectOpen = ref(false);
const handleMethodOptions = ["现场处理", "远程处理", "转交处理", "预约处理"];

const dispatchDeptIdSelectOpen = ref(false);

const detailTabs: Array<{ label: string; value: DetailTab }> = [
  { label: "疑点详情", value: "base" },
  { label: "管道信息", value: "pipe" },
  { label: "关联信息", value: "related" },
];

// ========== 响应式数据 ==========
const filters = reactive({
  detectType: "",
  processStatus: "" as number | "",
  isLeakPoint: "" as number | "",
  reporter: "",
  startTime: "",
  endTime: "",
});

const pagination = reactive({
  pageNum: 1,
  pageSize: 10,
});

const suspects = ref<SuspectRecord[]>([]);
const selectedSuspect = ref<SuspectRecord | null>(null);
const selectedKey = ref("");
const total = ref(0);
const loading = ref(false);
const activeTab = ref<DetailTab>("base");

const sortField = ref<string>("");
const sortOrder = ref<"asc" | "desc" | "">("");

// ========== 音频播放器状态 ==========
const audioEl = ref<HTMLAudioElement | null>(null);
const audioPlaying = ref(false);
const audioCurrentTime = ref(0);
const audioDuration = ref(0);
const audioSrc = ref("");
const audioProgress = computed(() => {
  if (audioDuration.value <= 0) return 0;
  return (audioCurrentTime.value / audioDuration.value) * 100;
});

// ========== 详情地图弹窗 ==========
const detailMapVisible = ref(false);
const detailMapCoord = ref({ lng: 0, lat: 0 });

function openDetailMap() {
  const raw = selectedSuspect.value?.coordinatePosition;
  if (!raw) return;
  const clean = String(raw).replace(/[（(][^）)]*[）)]/g, "").trim();
  const parts = clean.split(",").map(s => s.trim());
  if (parts.length === 2) {
    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    if (!isNaN(lng) && !isNaN(lat)) {
      detailMapCoord.value = { lng, lat };
      detailMapVisible.value = true;
    }
  }
}
function closeDetailMap() { detailMapVisible.value = false; }

// ========== 对话框状态 ==========
const processing = ref(false);
const dispatchDialogVisible = ref(false);
const dispatchUrgencySelectOpen = ref(false);
const dispatchUrgencyError = ref("");
const dispatchForm = reactive({
  workOrderNo: "",
  expectedTime: "",
  urgencyLevel: "",
  workOrderCategory: "",
  flowType: "",
  handleMethod: "",
  processFlow: "",
  handler: "",
  deviceNo: "",
  deptId: undefined as number | undefined,
  leakageStatus: "",
  installImage: "",
  installAddress: "",
  detail: "",
  remark: "",
});

// ========== 转工单 - 地图选点 ==========
const dispatchMapPickerVisible = ref(false);
const dispatchMapPickedCoord = ref("");
const dispatchMapCenter = ref({ lng: 121.4737, lat: 31.2304 });

/** 转工单安装图片（本地预览，提交时上传） */
const dispatchImageItem = ref<{ file?: File; url: string; id: string; filePath?: string }>({ url: "", id: "" });
function pickDispatchImage() {
  // #ifdef H5
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.onchange = () => {
    const file = input.files?.[0];
    if (!file) return;
    dispatchImageItem.value = { file, url: URL.createObjectURL(file), id: "" };
  };
  input.click();
  // #endif
  // #ifndef H5
  uni.chooseImage({
    count: 1,
    sizeType: ["compressed"],
    sourceType: ["album", "camera"],
    success: (res) => {
      dispatchImageItem.value = { url: res.tempFilePaths[0], id: "" };
    },
  });
  // #endif
}
function removeDispatchImage() {
  dispatchImageItem.value = { url: "", id: "" };
}

// 派单设备下拉
const dispatchDeviceOptions = ref<Array<{ deviceNumber: string }>>([]);
const dispatchDeviceSelectOpen = ref(false);
const dispatchDeviceSearch = ref("");

const filteredDispatchDeviceOptions = computed(() => {
  if (!dispatchDeviceSearch.value) return dispatchDeviceOptions.value;
  const kw = dispatchDeviceSearch.value.toLowerCase();
  return dispatchDeviceOptions.value.filter((d) => d.deviceNumber.toLowerCase().includes(kw));
});

function loadDispatchDevices() {
  if (dispatchForm.deptId != null) {
    getPartitionDeviceList(dispatchForm.deptId, {}).then((res: any) => {
      const data = res?.data;
      if (Array.isArray(data)) {
        dispatchDeviceOptions.value = data as Array<{ deviceNumber: string }>;
      }
    }).catch(() => {});
  } else {
    getDeviceVisibleList({}).then((res: { data?: Array<{ deviceNumber: string }> }) => {
      if (res && Array.isArray(res.data)) {
        dispatchDeviceOptions.value = res.data;
      }
    }).catch(() => {});
  }
}

function selectDispatchDevice(val: string) {
  dispatchForm.deviceNo = val;
  dispatchDeviceSelectOpen.value = false;
  dispatchDeviceSearch.value = "";
}

function previewDispatchImage() {
  const url = dispatchImageItem.value.id
    ? addBaseUrl(dispatchImageItem.value.id)
    : dispatchImageItem.value.url;
  if (url) uni.previewImage({ urls: [url] });
}

function pickDispatchLocation() {
  dispatchMapPickedCoord.value = "";
  uni.getLocation({
    type: "gcj02",
    success: (result) => {
      dispatchMapCenter.value = { lng: result.longitude, lat: result.latitude };
      dispatchMapPickerVisible.value = true;
    },
    fail: () => {
      dispatchMapPickerVisible.value = true;
    },
  });
}

function handleDispatchMapPick(coordinate: { lng: number; lat: number }) {
  dispatchMapPickedCoord.value = `${coordinate.lng.toFixed(6)},${coordinate.lat.toFixed(6)}`;
}

function confirmDispatchMapPick() {
  if (dispatchMapPickedCoord.value) {
    dispatchForm.installAddress = dispatchMapPickedCoord.value;
  }
  closeDispatchMapPicker();
}

function closeDispatchMapPicker() {
  dispatchMapPickerVisible.value = false;
  dispatchMapPickedCoord.value = "";
}

const confirmLeakDialogVisible = ref(false);
const detectDifficultySelectOpen = ref(false);
const confirmLeakForm = reactive({
  detectTime: "",
  detectDifficulty: "",
  leakPointType: "",
  leakPointPosition: "",
  coordinatePosition: "",
  initialLevel: "",
  leakPointSize: "",
  leakRoadSurface: "",
  remark: "",
  repairTime: "",
  leakPart: "",
  leakReason: "",
  inspector: "",
  locator: "",
});

const detectDifficultyOptions: SelectOption[] = [
  { label: "一般", value: "一般" },
  { label: "疑难", value: "疑难" },
];

// 确认疑点对话框下拉选项
const leakPointTypeSelectOpen = ref(false);
const leakPointTypeOptions = ["小漏量", "远距离", "大漏量", "埋设深", "大口径", "重大隐患", "疑难漏点", "其它"];

const initialLevelSelectOpen = ref(false);
const initialLevelOptions: SelectOption[] = [
  { label: "一般", value: "一般" },
  { label: "紧急", value: "紧急" },
];

const leakPointSizeSelectOpen = ref(false);
const leakPointSizeOptions = ["大", "中", "小"];

const leakRoadSurfaceSelectOpen = ref(false);
const leakRoadSurfaceOptions = ["柏油", "水泥", "绿化", "石板", "泥地", "塘渣", "墙面", "其它"];

// ========== 计算属性 ==========
const pageTitle = computed(() => pageTitleMap[props.mode]);
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));

const currentProcessStatusIndex = computed(() => {
  const idx = processStatusFilterOptions.findIndex((item) => item.value === filters.processStatus);
  return idx >= 0 ? idx : 0;
});
const currentProcessStatusLabel = computed(() => {
  return processStatusFilterOptions[currentProcessStatusIndex.value]?.label || "不限";
});

const currentIsLeakPointIndex = computed(() => {
  const idx = isLeakPointFilterOptions.findIndex((item) => item.value === filters.isLeakPoint);
  return idx >= 0 ? idx : 0;
});
const currentIsLeakPointLabel = computed(() => {
  return isLeakPointFilterOptions[currentIsLeakPointIndex.value]?.label || "不限";
});

const currentDetectTypeIndex = computed(() => {
  const idx = detectTypeFilterOptions.findIndex((item) => item.value === filters.detectType);
  return idx >= 0 ? idx : 0;
});
const currentDetectTypeLabel = computed(() => {
  return detectTypeFilterOptions[currentDetectTypeIndex.value]?.label || "全部";
});

const dispatchUrgencyLabel = computed(() => {
  if (!dispatchForm.urgencyLevel) return "请选择紧急程度";
  return urgencyOptions.find((item) => item.value === dispatchForm.urgencyLevel)?.label || "请选择紧急程度";
});

const dispatchSuspectId = computed(() => (selectedSuspect.value ? getRowId(selectedSuspect.value) : ""));
const confirmLeakSuspectId = computed(() => (selectedSuspect.value ? getRowId(selectedSuspect.value) : ""));

// 疑点详情——摘要卡片元信息
const baseSummaryMeta = computed(() => {
  const item = selectedSuspect.value || {};
  return [
    { label: "上报时间", value: formatDateTime(getTextValue(item, ["reportTime"], "-")) },
    { label: "上报人员", value: getTextValue(item, ["reporter"], "-") },
    { label: "检出类型", value: getTextValue(item, ["detectType"], "-") },
    { label: "巡检编号", value: getTextValue(item, ["patrolNo"], "-") },
  ];
});

// 疑点详情字段（列表已显示的字段不再重复展示）
const baseDetailFields = computed(() => {
  const item = selectedSuspect.value || {};
  const rawCoord = item?.coordinatePosition;
  let formattedCoord = "";
  if (rawCoord) {
    const raw = String(rawCoord);
    const clean = raw.replace(/[（(][^）)]*[）)]/g, "").trim();
    const parts = clean.split(",").map(s => s.trim());
    if (parts.length === 2) {
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (!isNaN(lng) && !isNaN(lat)) {
        formattedCoord = `${lng.toFixed(4)},${lat.toFixed(4)}`;
      }
    }
  }
  return [
    { label: "漏点类型", value: getTextValue(item, ["leakPointType"], "-") },
    { label: "初判级别", value: getTextValue(item, ["initialLevel"], "-") },
    { label: "漏点大小", value: getTextValue(item, ["leakPointSize"], "-") },
    { label: "漏点路面", value: getTextValue(item, ["leakRoadSurface"], "-") },
    { label: "坐标位置", value: formattedCoord || "-", type: formattedCoord ? "coordinate" : "" },
    { label: "漏点位置", value: getTextValue(item, ["leakPointPosition"], "-") },
    { label: "备注信息", value: getTextValue(item, ["remark"], "-") },
  ];
});

// 时间信息（从关联信息Tab移入疑点详情Tab）
const timeInfoFields = computed(() => {
  const item = selectedSuspect.value || {};
  return [
    { label: "创建时间", value: formatDateTime(getTextValue(item, ["createdAt"], "-")) },
    { label: "更新时间", value: formatDateTime(getTextValue(item, ["updatedAt"], "-")) },
    { label: "噪声时间", value: formatDateTime(getTextValue(item, ["noiseTime"], "-")) },
    { label: "修复时间", value: formatDateTime(getTextValue(item, ["repairTime"], "-")) },
  ];
});

// 管道信息字段
const pipeDetailFields = computed(() => {
  const item = selectedSuspect.value || {};
  const deptId = getStableValue(item, ["deptId"]);
  const deptName = deptId != null ? (deptNameMap.value[Number(deptId)] || String(deptId)) : "-";
  return [
    { label: "管道管径", value: getTextValue(item, ["tubeBore"], "-") },
    { label: "管道材质", value: getTextValue(item, ["tubeMaterial"], "-") },
    { label: "设备编号", value: getTextValue(item, ["deviceNumber"], "-") },
    { label: "噪声时间", value: formatDateTime(getTextValue(item, ["noiseTime"], "-")) },
    { label: "渗漏状态", value: getTextValue(item, ["leakStatus"], "-") },
    { label: "特征值", value: getTextValue(item, ["featureValue"], "-") },
    { label: "修复状态", value: getTextValue(item, ["repairStatus"], "-") },
    { label: "修复时间", value: formatDateTime(getTextValue(item, ["repairTime"], "-")) },
    { label: "修复人", value: getTextValue(item, ["repairPerson"], "-") },
    { label: "下漏单位", value: getTextValue(item, ["leakUnit"], "-") },
    { label: "维修单位", value: getTextValue(item, ["maintenanceUnit"], "-") },
    { label: "所属分区", value: deptName },
  ];
});

interface DetailField {
  label: string;
  value: string;
  type?: "images" | "video" | "audio" | "workOrder";
  /** 文件路径列表（如 ["/files/images/xxx", "/files/images/yyy"]） */
  paths?: string[];
  /** 单个文件路径 */
  path?: string;
}

// 关联信息字段
const relatedDetailFields = computed((): DetailField[] => {
  const item = selectedSuspect.value || {};
  const suspectPaths = getTextValue(item, ["suspectSceneImages"], "");
  const leakPaths = getTextValue(item, ["leakSceneImages"], "");
  const videoPath = getTextValue(item, ["sceneVideo"], "");
  const audioPath = getTextValue(item, ["audioFile"], "");
  const suspectPathList = suspectPaths ? suspectPaths.split(",").filter(Boolean) : [];
  const leakPathList = leakPaths ? leakPaths.split(",").filter(Boolean) : [];
  return [
    { label: "关联工单ID", value: getTextValue(item, ["workOrderId"], "-"), type: "workOrder" as const },
    { label: "关联漏点记录ID", value: getTextValue(item, ["leakPointRecordId"], "-") },
    ...(suspectPathList.length > 0
      ? [{ label: "疑点现场照片", value: `${suspectPathList.length} 张`, type: "images" as const, paths: suspectPathList }]
      : [{ label: "疑点现场照片", value: "-" }]),
    ...(leakPathList.length > 0
      ? [{ label: "漏点现场照片", value: `${leakPathList.length} 张`, type: "images" as const, paths: leakPathList }]
      : [{ label: "漏点现场照片", value: "-" }]),
    ...(videoPath
      ? [{ label: "现场视频", value: "已上传", type: "video" as const, path: videoPath }]
      : [{ label: "现场视频", value: "-" }]),
    ...(audioPath
      ? [{ label: "音频文件", value: "已上传", type: "audio" as const, path: audioPath }]
      : [{ label: "音频文件", value: "-" }]),
  ];
});

// ========== 区域名称映射 ==========
interface RegionOption {
  id: number;
  deptName: string;
}
const regionOptions = ref<RegionOption[]>([]);
const deptNameMap = computed(() => {
  const map: Record<number, string> = {};
  for (const r of regionOptions.value) {
    if (r.id != null) map[r.id] = r.deptName;
  }
  return map;
});

function loadRegions() {
  getRegionList({}).then((res: { data?: RegionOption[] }) => {
    if (res && Array.isArray(res.data)) {
      regionOptions.value = res.data;
    }
  }).catch(() => {});
}

// ========== 生命周期 ==========
onMounted(() => {
  void fetchSuspects();
  loadRegions();
});

// 派单分区切换时刷新设备列表
watch(() => dispatchForm.deptId, () => {
  dispatchForm.deviceNo = "";
  dispatchDeviceSearch.value = "";
  loadDispatchDevices();
});

// ========== 筛选器事件处理 ==========
function handleProcessStatusChange(event: { detail: { value: number } }) {
  filters.processStatus = (processStatusFilterOptions[event.detail.value]?.value ?? "") as number | "";
}

function handleIsLeakPointChange(event: { detail: { value: number } }) {
  filters.isLeakPoint = (isLeakPointFilterOptions[event.detail.value]?.value ?? "") as number | "";
}

function handleDetectTypeChange(event: { detail: { value: number } }) {
  filters.detectType = (detectTypeFilterOptions[event.detail.value]?.value ?? "") as string;
}

// ========== 查询参数构建 ==========
function buildQueryParams() {
  const params: Record<string, unknown> = {
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normalizeDateForApi(filters.startTime, false),
    endTime: normalizeDateForApi(filters.endTime, true),
    sortOrder: sortOrder.value || "desc",
    sortField: sortField.value || "createdAt",
  };

  if (filters.processStatus !== "" && filters.processStatus !== undefined) {
    params.processStatus = filters.processStatus;
  }
  if (filters.isLeakPoint !== "" && filters.isLeakPoint !== undefined) {
    params.isLeakPoint = filters.isLeakPoint;
  }
  if (filters.detectType.trim()) {
    params.detectType = filters.detectType.trim();
  }
  if (filters.reporter.trim()) {
    params.reporter = filters.reporter.trim();
  }

  return params;
}

// ========== 数据获取 ==========
async function fetchSuspects() {
  loading.value = true;

  try {
    const response = (await getSuspectPage(buildQueryParams())) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    suspects.value = parsed.records;
    total.value = parsed.total;
    selectFirstRow();
  } catch (error) {
    suspects.value = [];
    total.value = 0;
    selectedSuspect.value = null;
    selectedKey.value = "";
    uni.showToast({
      title: (error as { msg?: string })?.msg || "疑点数据加载失败",
      icon: "none",
    });
  } finally {
    loading.value = false;
  }
}

function searchSuspects() {
  pagination.pageNum = 1;
  void fetchSuspects();
}

function resetFilters() {
  clearFilters();
  searchSuspects();
}

function clearFilters() {
  filters.detectType = "";
  filters.processStatus = "";
  filters.isLeakPoint = "";
  filters.reporter = "";
  filters.startTime = "";
  filters.endTime = "";
}

function resetFiltersAndFetch() {
  clearFilters();
  pagination.pageNum = 1;
  return fetchSuspects();
}

// ========== 排序 ==========
function toggleSort(field: string) {
  if (sortField.value === field && sortOrder.value === "asc") {
    sortOrder.value = "desc";
  } else {
    sortField.value = field;
    sortOrder.value = sortField.value === field && sortOrder.value === "desc" ? "" : "asc";
  }
  if (!sortOrder.value) sortField.value = "";
  searchSuspects();
}

function getSortClass(field: string) {
  if (sortField.value !== field) return "sort-indicator--default";
  return sortOrder.value === "asc" ? "sort-indicator--asc" : "sort-indicator--desc";
}

// ========== 分页 ==========
const jumpPageInput = ref("");

function changePage(step: number) {
  const nextPage = pagination.pageNum + step;
  if (nextPage < 1 || nextPage > totalPages.value) {
    return;
  }

  pagination.pageNum = nextPage;
  void fetchSuspects();
}

function jumpToPage() {
  const page = parseInt(jumpPageInput.value, 10);
  if (isNaN(page) || page < 1 || page > totalPages.value) {
    uni.showToast({ title: `请输入 1~${totalPages.value} 的页码`, icon: "none" });
    return;
  }
  jumpPageInput.value = "";
  pagination.pageNum = page;
  void fetchSuspects();
}

// ========== 行选择 ==========
function selectFirstRow() {
  if (suspects.value.length === 0) {
    selectedSuspect.value = null;
    selectedKey.value = "";
    return;
  }

  const currentId = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  const matched = currentId ? suspects.value.find((item) => getRowId(item) === currentId) : null;
  const next = matched || suspects.value[0];

  selectedSuspect.value = next;
  selectedKey.value = getRowKey(next, suspects.value.indexOf(next));
  activeTab.value = "base";
}

async function selectSuspect(item: SuspectRecord, index: number) {
  selectedSuspect.value = item;
  selectedKey.value = getRowKey(item, index);
  activeTab.value = "base";

  const id = getRowId(item);
  if (!id) {
    return;
  }

  try {
    const response = (await getSuspectDetail(id)) as ApiResponseLike;
    assertSuccessResponse(response);
    if (isObject(response?.data)) {
      selectedSuspect.value = {
        ...item,
        ...(response.data as SuspectRecord),
      };
    }
  } catch {
    // 详情失败时保留列表数据，避免影响主表格展示。
  }
}

// ========== 删除 ==========
async function removeSuspect() {
  const id = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  if (!id) {
    uni.showToast({ title: "请先选择疑点", icon: "none" });
    return;
  }

  uni.showModal({
    title: "确认删除",
    content: "确定要删除该疑点吗？删除后不可恢复。",
    success: (modalRes) => {
      if (!modalRes.confirm) return;
      void doDelete(id, false);
    },
  });
}

async function doDelete(id: string | number, force: boolean) {
  try {
    const response = (await deleteSuspect(id, force)) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: force ? "疑点已强制删除" : "疑点已删除", icon: "success", duration: 2000 });
    await fetchSuspects();
  } catch (error) {
    const errMsg = (error as { msg?: string })?.msg || "";
    if (!force && errMsg && (errMsg.includes("关联") || errMsg.includes("工单") || errMsg.includes("强制"))) {
      uni.showModal({
        title: "强制删除",
        content: "该疑点已关联工单，强制删除将同时解除关联，是否继续？",
        success: (res) => res.confirm && void doDelete(id, true),
      });
    } else {
      uni.showToast({ title: errMsg || "删除失败", icon: "none" });
    }
  }
}

// ========== 转工单 ==========
function openDispatchDialog() {
  dispatchForm.workOrderNo = "";
  dispatchForm.expectedTime = "";
  dispatchForm.urgencyLevel = "";
  dispatchForm.workOrderCategory = "";
  dispatchForm.flowType = "";
  dispatchForm.handleMethod = "";
  dispatchForm.processFlow = "";
  dispatchForm.handler = "";
  dispatchForm.deviceNo = "";
  dispatchForm.deptId = undefined;
  dispatchForm.leakageStatus = "";
  dispatchForm.installImage = "";
  dispatchForm.installAddress = "";
  dispatchForm.detail = "";
  dispatchForm.remark = "";
  dispatchUrgencySelectOpen.value = false;
  dispatchUrgencyError.value = "";
  processFlowSelectOpen.value = false;
  leakageStatusSelectOpen.value = false;
  workOrderCategorySelectOpen.value = false;
  flowTypeSelectOpen.value = false;
  handleMethodSelectOpen.value = false;
  dispatchDeptIdSelectOpen.value = false;
  dispatchImageItem.value = { url: "", id: "" };
  loadDispatchDevices();
  dispatchDialogVisible.value = true;
}

function closeDispatchDialog() {
  dispatchDialogVisible.value = false;
  dispatchUrgencySelectOpen.value = false;
  processFlowSelectOpen.value = false;
  leakageStatusSelectOpen.value = false;
  workOrderCategorySelectOpen.value = false;
  flowTypeSelectOpen.value = false;
  handleMethodSelectOpen.value = false;
  dispatchDeptIdSelectOpen.value = false;
  dispatchUrgencyError.value = "";
  dispatchImageItem.value = { url: "", id: "" };
}

function selectDispatchUrgency(value: OptionValue) {
  dispatchForm.urgencyLevel = String(value);
  dispatchUrgencySelectOpen.value = false;
  dispatchUrgencyError.value = "";
}

function selectProcessFlow(value: string) {
  dispatchForm.processFlow = value;
  processFlowSelectOpen.value = false;
}

function selectLeakageStatus(value: string) {
  dispatchForm.leakageStatus = value;
  leakageStatusSelectOpen.value = false;
}

function selectWorkOrderCategory(value: string) {
  dispatchForm.workOrderCategory = value;
  workOrderCategorySelectOpen.value = false;
}

function selectFlowType(value: string) {
  dispatchForm.flowType = value;
  flowTypeSelectOpen.value = false;
}

function selectHandleMethod(value: string) {
  dispatchForm.handleMethod = value;
  handleMethodSelectOpen.value = false;
}

function selectDispatchDeptId(id: number) {
  dispatchForm.deptId = id;
  dispatchDeptIdSelectOpen.value = false;
}

async function submitDispatch() {
  if (processing.value) {
    console.log("[submitDispatch] 已在处理中，跳过重复点击");
    return;
  }
  const id = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  if (!id) {
    uni.showToast({ title: "请先选择疑点", icon: "none" });
    return;
  }

  processing.value = true;
  try {
    console.log("[submitDispatch] 开始处理，疑点ID：", id);
    // 尝试上传安装图片（失败不影响派单）
    let installImagePath = dispatchForm.installImage.trim();
    try {
      const imgItem = dispatchImageItem.value;
      if (imgItem.file && !imgItem.id) {
        const res = await uploadFile(imgItem.file, "install_image") as Record<string, unknown>;
        if (res && (res.code === undefined || res.code === 0 || res.code === 200)) {
          const resData = (res?.data || {}) as Record<string, unknown>;
          const filePath = String(resData.filePath || resData.file_path || "");
          if (filePath) {
            imgItem.id = String(resData.id || "");
            imgItem.filePath = filePath;
            installImagePath = filePath;
          }
        }
      } else if (imgItem.filePath) {
        installImagePath = imgItem.filePath;
      }
    } catch (uploadErr) {
      console.warn("[submitDispatch] 安装图片上传失败，继续派单：", uploadErr);
    }

    const payload: Record<string, unknown> = {};
    const woNo = dispatchForm.workOrderNo.trim();
    if (woNo) {
      payload.workOrderNo = woNo;
    } else {
      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      payload.workOrderNo = `GD${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    }
    if (dispatchForm.expectedTime) payload.expectedTime = dispatchForm.expectedTime;
    if (dispatchForm.urgencyLevel) payload.urgencyLevel = dispatchForm.urgencyLevel;
    if (dispatchForm.workOrderCategory) payload.workOrderCategory = dispatchForm.workOrderCategory;
    if (dispatchForm.flowType) payload.flowType = dispatchForm.flowType;
    if (dispatchForm.handleMethod) payload.handleMethod = dispatchForm.handleMethod;
    if (dispatchForm.processFlow.trim()) payload.processFlow = dispatchForm.processFlow.trim();
    if (dispatchForm.handler.trim()) payload.handler = dispatchForm.handler.trim();
    if (dispatchForm.deviceNo.trim()) payload.deviceNo = dispatchForm.deviceNo.trim();
    if (dispatchForm.remark.trim()) payload.remark = dispatchForm.remark.trim();
    if (dispatchForm.leakageStatus.trim()) payload.leakageStatus = dispatchForm.leakageStatus.trim();
    if (installImagePath) payload.installImage = installImagePath;
    if (dispatchForm.installAddress.trim()) payload.installAddress = dispatchForm.installAddress.trim();
    if (dispatchForm.detail.trim()) payload.detail = dispatchForm.detail.trim();

    const response = (await dispatchSuspect(id, payload)) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "转工单成功", icon: "success", duration: 2000 });
    dispatchDialogVisible.value = false;
    await fetchSuspects();
  } catch (error) {
    console.error("[submitDispatch] 失败：", error);
    uni.showToast({
      title: (error as { msg?: string })?.msg || "转工单失败",
      icon: "none",
    });
  } finally {
    processing.value = false;
  }
}

// ========== 确认漏点 ==========
function selectDetectDifficulty(value: OptionValue) {
  confirmLeakForm.detectDifficulty = String(value);
  detectDifficultySelectOpen.value = false;
}

function selectLeakPointType(value: string) {
  confirmLeakForm.leakPointType = value;
  leakPointTypeSelectOpen.value = false;
}

function selectInitialLevel(value: OptionValue) {
  confirmLeakForm.initialLevel = String(value);
  initialLevelSelectOpen.value = false;
}

function selectLeakPointSize(value: string) {
  confirmLeakForm.leakPointSize = value;
  leakPointSizeSelectOpen.value = false;
}

function selectLeakRoadSurface(value: string) {
  confirmLeakForm.leakRoadSurface = value;
  leakRoadSurfaceSelectOpen.value = false;
}

function openConfirmLeakDialog() {
  const suspect = selectedSuspect.value || {};
  confirmLeakForm.detectTime = "";
  confirmLeakForm.detectDifficulty = "";
  confirmLeakForm.leakPointType = String(suspect.leakPointType ?? "");
  confirmLeakForm.leakPointPosition = String(suspect.leakPointPosition ?? "");
  confirmLeakForm.coordinatePosition = String(suspect.coordinatePosition ?? "");
  confirmLeakForm.initialLevel = String(suspect.initialLevel ?? "");
  confirmLeakForm.leakPointSize = String(suspect.leakPointSize ?? "");
  confirmLeakForm.leakRoadSurface = String(suspect.leakRoadSurface ?? "");
  confirmLeakForm.remark = String(suspect.remark ?? "");
  confirmLeakForm.repairTime = "";
  confirmLeakForm.leakPart = String(suspect.leakPart ?? "");
  confirmLeakForm.leakReason = String(suspect.leakReason ?? "");
  confirmLeakForm.inspector = String(suspect.inspector ?? "");
  confirmLeakForm.locator = String(suspect.locator ?? "");
  detectDifficultySelectOpen.value = false;
  leakPointTypeSelectOpen.value = false;
  initialLevelSelectOpen.value = false;
  leakPointSizeSelectOpen.value = false;
  leakRoadSurfaceSelectOpen.value = false;
  confirmLeakDialogVisible.value = true;
}

function closeConfirmLeakDialog() {
  confirmLeakDialogVisible.value = false;
  detectDifficultySelectOpen.value = false;
  leakPointTypeSelectOpen.value = false;
  initialLevelSelectOpen.value = false;
  leakPointSizeSelectOpen.value = false;
  leakRoadSurfaceSelectOpen.value = false;
}

async function submitConfirmLeak() {
  const id = selectedSuspect.value ? getRowId(selectedSuspect.value) : "";
  if (!id) {
    uni.showToast({ title: "请先选择疑点", icon: "none" });
    return;
  }

  processing.value = true;
  try {
    // 先收集表单中填写的字段值
    const payload: Record<string, unknown> = {};
    if (confirmLeakForm.detectTime) payload.detectTime = confirmLeakForm.detectTime;
    if (confirmLeakForm.detectDifficulty) payload.detectDifficulty = confirmLeakForm.detectDifficulty;

    // 表单可见字段：用户可修改，填入有效值时覆盖
    if (confirmLeakForm.leakPointType.trim()) payload.leakPointType = confirmLeakForm.leakPointType.trim();
    if (confirmLeakForm.leakPointPosition.trim()) payload.leakPointPosition = confirmLeakForm.leakPointPosition.trim();
    if (confirmLeakForm.coordinatePosition.trim()) payload.coordinatePosition = confirmLeakForm.coordinatePosition.trim();
    if (confirmLeakForm.initialLevel.trim()) payload.initialLevel = confirmLeakForm.initialLevel.trim();
    if (confirmLeakForm.leakPointSize.trim()) payload.leakPointSize = confirmLeakForm.leakPointSize.trim();
    if (confirmLeakForm.leakRoadSurface.trim()) payload.leakRoadSurface = confirmLeakForm.leakRoadSurface.trim();
    if (confirmLeakForm.remark.trim()) payload.remark = confirmLeakForm.remark.trim();
    if (confirmLeakForm.repairTime) payload.repairTime = confirmLeakForm.repairTime;
    if (confirmLeakForm.leakPart.trim()) payload.leakPart = confirmLeakForm.leakPart.trim();
    if (confirmLeakForm.leakReason.trim()) payload.leakReason = confirmLeakForm.leakReason.trim();
    if (confirmLeakForm.inspector.trim()) payload.inspector = confirmLeakForm.inspector.trim();
    if (confirmLeakForm.locator.trim()) payload.locator = confirmLeakForm.locator.trim();

    // 同步疑点已有的其他信息（表单不展示但漏点需要保留的字段）
    const suspect = selectedSuspect.value;
    if (suspect) {
      const extraFields: string[] = [
        "detectType", "tubeBore", "tubeMaterial", "suspectSceneImages",
        "leakSceneImages", "sceneVideo", "reporter", "reportTime",
        "patrolNo", "deviceNumber", "noiseTime", "leakStatus", "featureValue",
        "audioFile", "repairStatus", "repairPerson",
        "leakUnit", "maintenanceUnit", "deptId",
      ];
      for (const field of extraFields) {
        const val = suspect[field];
        if (val !== undefined && val !== null && val !== "") {
          payload[field] = val;
        }
      }
    }

    const response = (await confirmLeakPoint(id, payload)) as ApiResponseLike;
    assertSuccessResponse(response);
    uni.showToast({ title: "疑点已确认，同步至漏点界面", icon: "success", duration: 2000 });
    confirmLeakDialogVisible.value = false;
    await fetchSuspects();
  } catch (error) {
    uni.showToast({
      title: (error as { msg?: string })?.msg || "确认疑点失败",
      icon: "none",
    });
  } finally {
    processing.value = false;
  }
}

// ========== 排除疑点 ==========
// 后端不存在 /api/suspected-leak/{id}/exclude 路由，相关对话框、表单和请求已移除。
// 状态 4 按后端合同显示"已取消"，不再作为自创"已排除"语义。


// ========== 查看工单 ==========
function viewWorkOrder() {
  const workOrderId = getWorkOrderId(selectedSuspect.value);
  if (!workOrderId) {
    uni.showToast({ title: "无关联工单", icon: "none" });
    return;
  }
  uni.navigateTo({
    url: `/pages/work-order/processing/processing?id=${workOrderId}`,
  });
}

/** 从表格行直接跳转工单（点击关联工单列） */
function navigateToWorkOrderFromRow(item: SuspectRecord) {
  const workOrderId = getWorkOrderId(item);
  if (!workOrderId) {
    uni.showToast({ title: "无关联工单", icon: "none" });
    return;
  }
  uni.navigateTo({
    url: `/pages/work-order/processing/processing?id=${workOrderId}`,
  });
}

// ========== 媒体预览 ==========
/** 给相对路径加上 API 基础地址 */
function addBaseUrl(path: string): string {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://") || path.startsWith("blob:") || path.startsWith("file://")) {
    return path;
  }
  const base = import.meta.env.VITE_API_BASE_URL || "";
  const cleanBase = typeof base === "string" ? base.replace(/\/$/, "") : "";
  return `${cleanBase}${path}`;
}

/** 预览图片列表 */
function previewMediaFiles(paths: string[], type: "image" | "video") {
  if (!paths.length) {
    uni.showToast({ title: "暂无文件", icon: "none" });
    return;
  }
  if (type === "video") {
    // #ifdef H5
    window.open(addBaseUrl(paths[0]), "_blank");
    // #endif
    // #ifndef H5
    uni.showToast({ title: "请使用 H5 端播放视频", icon: "none" });
    // #endif
    return;
  }
  uni.previewImage({ urls: paths.map((p) => addBaseUrl(p)), current: 0 });
}

// ========== 音频播放器 ==========
/** 格式化时间 mm:ss */
function formatAudioTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** 创建或获取 Audio 实例 */
function getOrCreateAudio(): HTMLAudioElement {
  if (!audioEl.value) {
    audioEl.value = new Audio();
    audioEl.value.addEventListener("timeupdate", () => {
      if (audioEl.value) {
        audioCurrentTime.value = audioEl.value.currentTime;
      }
    });
    audioEl.value.addEventListener("loadedmetadata", () => {
      if (audioEl.value) {
        audioDuration.value = audioEl.value.duration;
      }
    });
    audioEl.value.addEventListener("ended", () => {
      audioPlaying.value = false;
      audioCurrentTime.value = 0;
    });
    audioEl.value.addEventListener("error", () => {
      audioPlaying.value = false;
      uni.showToast({ title: "音频加载失败", icon: "none" });
    });
  }
  return audioEl.value;
}

/** 播放/暂停音频 */
function toggleAudio(path: string) {
  if (!path) {
    uni.showToast({ title: "暂无音频", icon: "none" });
    return;
  }
  const audio = getOrCreateAudio();
  const url = addBaseUrl(path);

  // 同一音频 → 切换播放/暂停
  if (audioSrc.value === path) {
    if (audioPlaying.value) {
      audio.pause();
      audioPlaying.value = false;
    } else {
      audio.play().catch(() => {
        uni.showToast({ title: "播放失败", icon: "none" });
      });
      audioPlaying.value = true;
    }
    return;
  }

  // 不同音频 → 切换音源
  audio.pause();
  audio.src = url;
  audioSrc.value = path;
  audioCurrentTime.value = 0;
  audioDuration.value = 0;
  audio.play().then(() => {
    audioPlaying.value = true;
  }).catch(() => {
    audioPlaying.value = false;
    uni.showToast({ title: "播放失败", icon: "none" });
  });
}

/** 点击进度条跳转 */
function seekAudio(e: MouseEvent, path: string) {
  if (!path || audioSrc.value !== path) return;
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  const audio = getOrCreateAudio();
  audio.currentTime = ratio * (audioDuration.value || 0);
  audioCurrentTime.value = audio.currentTime;
}

/** 停止并销毁音频 */
function stopAudio() {
  if (audioEl.value) {
    audioEl.value.pause();
    audioEl.value.src = "";
    audioEl.value.removeEventListener("timeupdate", () => {});
    audioEl.value.removeEventListener("loadedmetadata", () => {});
    audioEl.value.removeEventListener("ended", () => {});
    audioEl.value.removeEventListener("error", () => {});
    audioEl.value = null;
  }
  audioPlaying.value = false;
  audioCurrentTime.value = 0;
  audioDuration.value = 0;
  audioSrc.value = "";
}

onUnmounted(() => {
  stopAudio();
});

// 切换选中项时停止音频
watch(selectedSuspect, () => {
  stopAudio();
});

// ========== 辅助函数：状态标签 ==========
function getProcessStatus(item: SuspectRecord | null): number {
  if (!item) return -1;
  const val = getStableValue(item, ["processStatus"]);
  if (typeof val === "number") return val;
  if (typeof val === "string" && val.trim()) {
    const num = Number(val);
    return Number.isNaN(num) ? -1 : num;
  }
  return -1;
}

function getProcessStatusLabel(item: SuspectRecord): string {
  const status = getProcessStatus(item);
  return processStatusLabelMap[status] || "未知";
}

function getProcessStatusClass(item: SuspectRecord): string {
  const status = getProcessStatus(item);
  const classMap: Record<number, string> = {
    0: "status-tag--pending",
    1: "status-tag--dispatched",
    2: "status-tag--processing",
    3: "status-tag--completed",
    4: "status-tag--excluded",
  };
  return classMap[status] || "status-tag--default";
}

function getIsLeakPointLabel(item: SuspectRecord): string {
  const val = getStableValue(item, ["isLeakPoint"]);
  if (typeof val === "number") return isLeakPointLabelMap[val] || "未知";
  if (typeof val === "string" && val.trim()) {
    const num = Number(val);
    return Number.isNaN(num) ? "未知" : (isLeakPointLabelMap[num] || "未知");
  }
  return "未知";
}

function getIsLeakPointClass(item: SuspectRecord): string {
  const val = getStableValue(item, ["isLeakPoint"]);
  let num = -1;
  if (typeof val === "number") num = val;
  else if (typeof val === "string" && val.trim()) num = Number(val);
  const classMap: Record<number, string> = {
    0: "status-tag--no",
    1: "status-tag--yes",
    2: "status-tag--pending-confirm",
  };
  return classMap[num] || "status-tag--default";
}

function getWorkOrderId(item: SuspectRecord | null): string | number {
  if (!item) return "";
  const val = getStableValue(item, ["workOrderId"]);
  return typeof val === "string" || typeof val === "number" ? val : "";
}

function getIsLeakPoint(item: SuspectRecord | null): number {
  if (!item) return -1;
  const val = getStableValue(item, ["isLeakPoint"]);
  if (typeof val === "number") return val;
  if (typeof val === "string" && val.trim()) {
    const num = Number(val);
    return Number.isNaN(num) ? -1 : num;
  }
  return -1;
}

// ========== 通用工具函数（保留自原有文件） ==========
function parsePageResponse(response: ApiResponseLike) {
  const data = response?.data ?? response;
  const pageData = findPageContainer(data) || findPageContainer(response) || (isObject(data) ? data : {});
  const records = getFirstArray(pageData, ["records", "rows", "list", "items"]);
  const topLevelRecords = getFirstArray(response, ["records", "rows", "list", "items"]);
  const finalRecords = records.length > 0 ? records : topLevelRecords;
  const totalValue =
    getFirstNumber(pageData, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]) ??
    getFirstNumber(response, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]);
  const current = getFirstNumber(pageData, ["current", "pageNum", "page", "pageNo"]);
  const size = getFirstNumber(pageData, ["size", "pageSize", "limit"]);

  if (current) {
    pagination.pageNum = current;
  }

  if (size) {
    pagination.pageSize = size;
  }

  const minimumVisibleTotal = (pagination.pageNum - 1) * pagination.pageSize + finalRecords.length;
  const resolvedTotal = totalValue === undefined ? finalRecords.length : Math.max(totalValue, minimumVisibleTotal);

  return {
    records: finalRecords.map((item) => (isObject(item) ? item : { value: item })),
    total: resolvedTotal,
  };
}

function findPageContainer(value: unknown): SuspectRecord | null {
  if (!isObject(value)) {
    return null;
  }

  const hasRecords = getFirstArray(value, ["records", "rows", "list", "items"]).length > 0;
  const hasTotal =
    getFirstNumber(value, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]) !== undefined;
  if (hasRecords || hasTotal) {
    return value;
  }

  for (const key of ["data", "result", "page", "pageData"]) {
    const matched = findPageContainer(value[key]);
    if (matched) {
      return matched;
    }
  }

  return null;
}

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

function getRowId(item: SuspectRecord) {
  const value = getStableValue(item, ["id"]);
  return typeof value === "string" || typeof value === "number" ? value : "";
}

function getRowKey(item: SuspectRecord, index: number) {
  return String(getRowId(item) || index);
}

function getId(item: SuspectRecord) {
  return getTextValue(item, ["id"], "-");
}

function getTextValue(item: SuspectRecord, keys: string[], fallback = "") {
  const value = getStableValue(item, keys);
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return String(value);
}


function getStableValue(item: SuspectRecord, keys: string[]) {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      return item[key];
    }
  }

  return undefined;
}

function getFirstArray(item: unknown, keys: string[]) {
  if (!isObject(item)) {
    return [];
  }

  for (const key of keys) {
    const value = item[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function getFirstNumber(item: unknown, keys: string[]) {
  if (!isObject(item)) {
    return undefined;
  }

  for (const key of keys) {
    const value = item[key];
    if (typeof value === "number") {
      return value;
    }

    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return undefined;
}

function isObject(value: unknown): value is SuspectRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeDateForApi(value: string, isEnd: boolean) {
  if (!value) {
    return undefined;
  }

  const normalizedValue = normalizeDisplayDatetime(value);

  if (normalizedValue.includes("T")) {
    return normalizedValue.length === 16 ? `${normalizedValue}:00` : normalizedValue;
  }

  return `${normalizedValue}T${isEnd ? "23:59:59" : "00:00:00"}`;
}

function normalizeDisplayDatetime(value: string) {
  return value.trim().replace(/\s+/, "T");
}

function formatDateTime(value: string) {
  if (!value || value === "-") {
    return value || "-";
  }

  return value
    .replace("T", " ")
    .replace(/\.\d+/, "")
    .replace(/(?:Z|[+-]\d{2}:?\d{2})$/, "");
}

// ========== 暴露方法 ==========
defineExpose({
  fetchSuspects,
  resetFiltersAndFetch,
});
</script>

<style scoped lang="scss">
.suspect-view {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: 0;
  padding: 0 14px 14px;
  overflow: hidden;
  overflow-x: hidden;
  background: #eef4f8;
}

.suspect-toolbar,
.suspect-table-panel,
.suspect-detail-panel {
  background: #ffffff;
  border: 1px solid #d8e5ef;
  border-radius: 6px;
  box-shadow: 0 12px 26px rgba(35, 72, 104, 0.09);
  min-width: 0;
  overflow: hidden;
}

.pagination-bar,
.table-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.filter-group {
  display: grid;
  align-content: start;
  gap: 6px;
  flex: 0 0 136px;
  min-width: 0;
}

.toolbar-row {
  min-width: 0;
}

.toolbar-row--filters {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  gap: 10px 12px;
}

.toolbar-row--bottom {
  display: flex;
  align-items: end;
  gap: 12px;
  width: 100%;
}

.filter-label {
  color: #52677b;
  font-size: 12px;
  font-weight: 800;
  line-height: 1.2;
  white-space: nowrap;
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
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 30px;
}

.toolbar-row--filters .filter-input,
.toolbar-row--filters .filter-select {
  height: 28px;
  line-height: 28px;
}

.input-placeholder {
  color: #9aa9b8;
}

.filter-separator {
  color: #8191a2;
  font-size: 13px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.filter-group--date {
  flex: 0 0 auto;
  min-width: 0;
}

.filter-datetime {
  flex: 0 0 200px;
  width: 200px;
}

.filter-datetime :deep(.datetime-picker__control) {
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  font-weight: 600;
  line-height: 30px;
}

.filter-datetime :deep(.datetime-picker__value) {
  font-size: 13px;
  font-weight: 600;
}

.filter-datetime :deep(.datetime-picker__icon) {
  width: 15px;
  height: 15px;
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

.suspect-toolbar {
  flex: none;
  display: grid;
  gap: 12px;
  min-height: 0;
  padding: 14px;
  overflow: visible;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.toolbar-button,
.toolbar-icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: 30px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 13px;
  font-weight: 700;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.toolbar-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
  justify-content: flex-start;
  width: auto;
  margin-left: 0;
}

.toolbar-actions--inline {
  align-self: end;
}

.toolbar-actions--inline .toolbar-button,
.toolbar-actions--inline .toolbar-icon-button {
  height: 30px;
  line-height: 30px;
  border-radius: 4px;
}

.toolbar-actions--inline .toolbar-button {
  min-width: 56px;
  padding: 0 12px;
}

.toolbar-actions--inline .toolbar-icon-button {
  width: 30px;
}

.toolbar-actions .toolbar-button,
.toolbar-actions .toolbar-icon-button {
  height: 38px;
  line-height: 1.2;
  border-radius: 5px;
}

.toolbar-actions .toolbar-button {
  min-width: 64px;
  padding: 0 15px;
}

.toolbar-actions .toolbar-icon-button {
  width: 38px;
}

.toolbar-button::after,
.toolbar-icon-button::after,
.page-button::after {
  border: 0;
}

.toolbar-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
  box-shadow: 0 5px 12px rgba(13, 130, 238, 0.18);
}

.toolbar-button--danger {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

.toolbar-button--hover,
.toolbar-icon-button--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.toolbar-button--primary.toolbar-button--hover {
  color: #ffffff;
  background: #0674d8;
  border-color: #0674d8;
}

.toolbar-button[disabled] {
  color: #9aa9b8;
  background: #eef2f6;
  border-color: #d7e0e8;
}

.toolbar-icon-button {
  width: 30px;
  padding: 0;
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

.suspect-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(380px, 20vw, 420px);
  flex: 1;
  gap: 14px;
  margin-top: 14px;
  min-height: 0;
  overflow: hidden;
}

.suspect-table-panel,
.suspect-detail-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}

.table-head {
  flex: none;
  height: 50px;
  padding: 0 16px;
  color: #24445f;
  font-size: 16px;
  font-weight: 800;
  background: #ffffff;
  border-bottom: 1px solid #edf3f8;
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

.table-scroll {
  flex: 1;
  height: auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
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

.data-table {
  width: 100%;
  min-width: 900px;
  background: #ffffff;
}

.data-row {
  display: grid;
  grid-template-columns: 54px minmax(92px, 0.85fr) minmax(88px, 0.82fr) minmax(78px, 0.76fr) minmax(160px, 1.2fr) minmax(140px, 1fr) minmax(88px, 0.78fr) minmax(200px, 0.95fr);
  min-height: 42px;
  width: 100%;
  min-width: 900px;
  border-bottom: 1px solid #edf1f5;
  cursor: pointer;
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease,
    opacity 0.2s ease;
}

.data-row--header {
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 44px;
  color: #20384f;
  font-weight: 800;
  background: #f6f9fc;
  cursor: default;
  box-shadow: 0 1px 0 #dbe7f0;
}

.data-table-body {
  transition: opacity 0.25s ease;
}

.data-table-body--loading {
  opacity: 0.5;
  pointer-events: none;
}

.data-row:not(.data-row--header):nth-child(odd) {
  background: #ffffff;
}

.data-row:not(.data-row--header):nth-child(even) {
  background: #fbfdff;
}

.data-row:not(.data-row--header):hover {
  background: #f1f8ff;
  box-shadow: inset 0 0 0 1px #d7ebfb;
  transform: translateY(-1px);
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.data-row--active {
  position: relative;
  background: #e7f3ff !important;
}

.data-row--active .data-cell {
  background: #e7f3ff;
  box-shadow: inset 0 -1px 0 0 #b9dcff;
}

.data-row--active::before {
  position: absolute;
  top: 7px;
  bottom: 7px;
  left: 0;
  width: 3px;
  content: "";
  background: #0d82ee;
  border-radius: 0 999px 999px 0;
}

.data-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  padding: 0 8px;
  overflow: hidden;
  color: #24384d;
  font-size: 13px;
  line-height: 1.35;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.data-row--header .data-cell {
  justify-content: center;
  color: #415a73;
  font-size: 12px;
  letter-spacing: 0;
  text-align: center;
  gap: 5px;
  user-select: none;
}

.data-header-cell--sortable {
  cursor: pointer;
  transition:
    color 0.18s ease,
    background 0.18s ease;
}

.data-header-cell--sortable:hover {
  color: #0d82ee;
  background: #edf7ff;
}

.data-header-cell--active {
  color: #0d82ee !important;
  background: #eaf5ff;
}

.sort-indicator {
  position: relative;
  flex: none;
  display: inline-flex;
  align-items: center;
  width: 12px;
  height: 14px;
  color: #9cafc1;
  vertical-align: middle;
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
  top: 2px;
  border-bottom: 4px solid currentColor;
}

.sort-indicator::after {
  bottom: 2px;
  border-top: 4px solid currentColor;
}

.sort-indicator--asc::before,
.sort-indicator--desc::after {
  color: #0d82ee;
}

.sort-indicator--asc::after,
.sort-indicator--desc::before,
.sort-indicator--default {
  opacity: 0.46;
}


/* last-child border removed — left/right 边框已全部取消 */

.data-cell--index {
  justify-content: center;
  color: #64748b;
}

.data-cell--position {
  justify-content: center;
  text-align: center;
}

.data-cell--time {
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-weight: 800;
}

.data-cell--worksheet {
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-weight: 800;
}

.data-cell--link {
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: #b0c8e0;
  text-underline-offset: 2px;
  transition: color 0.15s ease, text-decoration-color 0.15s ease;
}

.data-cell--link:hover {
  color: #0d82ee;
  text-decoration-color: #0d82ee;
}

.data-cell--reporter {
  color: #24384d;
}

/* 状态标签 */
.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
  white-space: nowrap;
}

.status-tag--pending {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fcd34d;
}

.status-tag--dispatched {
  color: #1e40af;
  background: #dbeafe;
  border: 1px solid #93c5fd;
}

.status-tag--processing {
  color: #6d28d9;
  background: #ede9fe;
  border: 1px solid #c4b5fd;
}

.status-tag--completed {
  color: #166534;
  background: #dcfce7;
  border: 1px solid #86efac;
}

.status-tag--excluded {
  color: #7a5910;
  background: #fef3c7;
  border: 1px solid #f5d685;
}

.status-tag--no {
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
}

.status-tag--yes {
  color: #166534;
  background: #dcfce7;
  border: 1px solid #86efac;
}

.status-tag--pending-confirm {
  color: #92400e;
  background: #fef3c7;
  border: 1px solid #fcd34d;
}

.status-tag--default {
  color: #6b7280;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
}

.table-state {
  height: 180px;
  color: #7c8da1;
  font-size: 14px;
  line-height: 180px;
  text-align: center;
}

.pagination-bar {
  flex: none;
  justify-content: flex-end;
  gap: 10px;
  height: 48px;
  padding: 0 14px;
  border-top: 1px solid #edf3f8;
}

.page-button {
  height: 30px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 13px;
  line-height: 30px;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.page-button[disabled] {
  color: #a9b4c1;
  background: #f4f7fa;
}

.page-info {
  color: #64748b;
  font-size: 13px;
}

.page-jump {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
}
.page-jump__prefix,
.page-jump__suffix {
  color: #64748b;
  font-size: 13px;
  white-space: nowrap;
}
.page-jump__input {
  width: 52px;
  height: 30px;
  padding: 0 6px;
  color: #172033;
  font-size: 13px;
  text-align: center;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.18s ease;
}
.page-jump__input:focus {
  border-color: #5ba4f0;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.08);
}

/* ========== 详情面板 ========== */
.detail-tabs {
  flex: none;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  height: 54px;
  padding: 8px;
  background: #f6fafe;
  border-bottom: 1px solid #e3edf6;
}

.detail-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #5d7188;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  transition:
    color 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease;
}

.detail-tab--active {
  color: #0d82ee;
  background: #ffffff;
  border-color: #cfe7fb;
  box-shadow: 0 6px 14px rgba(13, 130, 238, 0.1);
}

.detail-body {
  flex: 1;
  height: auto;
  min-height: 0;
  padding: 16px;
  overflow-y: auto;
  background:
    linear-gradient(180deg, #f5faff 0, #ffffff 142px),
    #ffffff;
}

.detail-empty {
  height: 260px;
  color: #8a9aab;
  font-size: 14px;
  line-height: 260px;
  text-align: center;
}

.detail-base-panel {
  display: grid;
  gap: 14px;
  min-width: 0;
}

/* ========== 摘要卡片（仿工单详情设计） ========== */
.detail-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
  min-width: 0;
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid #dce9f4;
  border-left: 4px solid #0d82ee;
  border-radius: 6px;
  box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045);
}

.detail-summary__main {
  min-width: 0;
}

.detail-summary__label {
  display: block;
  color: #6b7f94;
  font-size: 12px;
  font-weight: 800;
}

.detail-summary__number {
  display: block;
  margin-top: 7px;
  color: #0f4c81;
  font-family: "DIN Alternate", "Arial", sans-serif;
  font-size: 17px;
  font-weight: 900;
  line-height: 1.25;
  word-break: normal;
  overflow-wrap: anywhere;
}

.detail-summary__badges {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 7px;
}

.detail-summary__badge {
  min-width: 64px;
  height: 26px;
  line-height: 26px;
}

.detail-summary__meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid #edf3f8;
}

.detail-summary__meta-item {
  min-width: 0;
}

.detail-summary__meta-label {
  display: block;
  color: #71869b;
  font-size: 11px;
  font-weight: 800;
}

.detail-summary__meta-value {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: #172033;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ========== 详情网格（base 字段） ========== */
.detail-grid {
  display: grid;
  gap: 10px;
}

.detail-grid--base {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e8eef4;
  border-radius: 5px;
}

.detail-item__label {
  color: #71869b;
  font-size: 11px;
  font-weight: 800;
}

.detail-item__value {
  color: #172033;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
  word-break: break-all;
}
.detail-item__value--link {
  color: #3b82f6;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-color: rgba(59,130,246,0.3);
  text-underline-offset: 2px;
  transition: color 0.2s;
}
.detail-item__value--link:hover {
  color: #2563eb;
  text-decoration-color: #2563eb;
}

/* ========== 详情地图弹窗 ========== */
.detail-map-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}
.detail-map-panel {
  width: 880px;
  max-width: 92vw;
  border-radius: 12px;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  position: relative;
  color: #1e293b;
}
.detail-map-panel__body {
  height: 600px;
  width: 100%;
  position: relative;
}
.detail-map-panel__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  font-size: 14px;
  background: #f8fafc;
}

/* ========== 时间信息面板 ========== */
.detail-time-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 14px;
  background: #f8fafc;
  border: 1px solid #e8eef4;
  border-radius: 6px;
}

.detail-section-title {
  color: #0f4c81;
  font-size: 13px;
  font-weight: 800;
  margin-bottom: 2px;
}

.time-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.time-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #edf1f5;
}

.time-row:last-child {
  border-bottom: none;
}

.time-row__marker {
  width: 8px;
  height: 8px;
  margin-top: 4px;
  flex-shrink: 0;
  background: #0d82ee;
  border-radius: 50%;
}

.time-row__content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.time-row__label {
  color: #71869b;
  font-size: 11px;
  font-weight: 800;
}

.time-row__value {
  color: #172033;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

/* ========== 状态标签（胶囊） ========== */
.status-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.status-pill.status-tag--pending {
  color: #92400e;
  background: #fef3c7;
}

.status-pill.status-tag--dispatched {
  color: #1e40af;
  background: #dbeafe;
}

.status-pill.status-tag--processing {
  color: #065f46;
  background: #d1fae5;
}

.status-pill.status-tag--completed {
  color: #1e3a5f;
  background: #e0e7ff;
}

.status-pill.status-tag--excluded {
  color: #991b1b;
  background: #fee2e2;
}

.urgency-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
}

.urgency-pill.status-tag--yes {
  color: #b91c1c;
  background: #fee2e2;
}

.urgency-pill.status-tag--no {
  color: #065f46;
  background: #d1fae5;
}

.urgency-pill.status-tag--pending-confirm {
  color: #92400e;
  background: #fef3c7;
}

.urgency-pill.status-tag--default {
  color: #64748b;
  background: #f1f5f9;
}

/* ========== 字段卡片网格 ========== */
.detail-fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.detail-field-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  padding: 12px 14px;
  background: #ffffff;
  border: 1px solid #e8f0f7;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(33, 72, 108, 0.04);
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.detail-field-card:hover {
  border-color: #cfe0f0;
  box-shadow: 0 4px 12px rgba(33, 72, 108, 0.07);
}

.detail-field-card__label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #7a8ea3;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

.detail-field-card__label::before {
  content: "";
  width: 3px;
  height: 12px;
  background: #b9dcff;
  border-radius: 999px;
  flex-shrink: 0;
}

.detail-field-card__value {
  color: #172033;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.45;
  word-break: break-all;
  padding-left: 9px;
}

.detail-field-card__value--link {
  color: #0d82ee;
  cursor: pointer;
  transition: color 0.16s ease;
}

.detail-field-card__value--link:hover {
  color: #0674d8;
  text-decoration: underline;
}

/* ========== 音频内联播放器 ========== */
.audio-inline-player {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 0;
}

.audio-inline-player__btn {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #0d82ee;
  cursor: pointer;
  transition: background 0.16s ease, transform 0.12s ease;
  user-select: none;
}

.audio-inline-player__btn:hover {
  background: #0674d8;
}

.audio-inline-player__btn:active {
  transform: scale(0.92);
}

.audio-inline-player__icon {
  color: #fff;
  font-size: 12px;
  line-height: 1;
}

.audio-inline-player__track {
  flex: 1;
  height: 6px;
  min-width: 0;
  background: #e2e8f0;
  border-radius: 3px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.audio-inline-player__track:hover {
  background: #d0dce8;
}

.audio-inline-player__bar {
  height: 100%;
  background: #0d82ee;
  border-radius: 3px;
  transition: width 0.15s linear;
  pointer-events: none;
}

.audio-inline-player__time {
  flex: none;
  font-size: 11px;
  color: #7b8da0;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

/* ========== 疑点处理区 ========== */
.detail-process-box {
  margin-top: 14px;
  padding: 14px;
  background: #f8fbfe;
  border: 1px solid #e3edf6;
  border-radius: 8px;
}

.process-box {
  flex: none;
  padding: 16px 18px 18px;
  background: #f8fbfe;
  border-top: 1px solid #e3edf6;
}

.process-box__title {
  display: block;
  margin-bottom: 14px;
  padding-left: 10px;
  color: #183755;
  font-size: 15px;
  font-weight: 800;
  border-left: 3px solid #0d82ee;
  border-radius: 2px;
}

.process-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
}

.process-action {
  width: auto;
  min-width: 80px;
  height: 40px;
  margin: 0;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 800;
  line-height: 40px;
  border-radius: 6px;
}

.process-action--dispatch {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.process-action--confirm-leak {
  color: #177245;
  background: #eaf8ef;
  border-color: #bfe8ce;
}

.process-action--view-worksheet {
  color: #1e40af;
  background: #dbeafe;
  border-color: #93c5fd;
}

.process-action--edit {
  color: #31506d;
  background: #f6fbff;
  border-color: #cbdced;
}

.process-action--delete {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

.process-action--exclude {
  color: #7a5910;
  background: #fff9e6;
  border-color: #f5d685;
}

.process-action--excluded {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  font-size: 13px;
  color: #7a5910;
  background: #fff9e6;
  border-radius: 6px;
  border: 1px solid #f5d685;
}

/* ========== 对话框 ========== */
.dialog-mask {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(15, 35, 55, 0.22);
}

.dialog-panel {
  display: flex;
  flex-direction: column;
  width: min(780px, calc(100vw - 32px));
  max-height: calc(100vh - 64px);
  overflow: hidden;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 18px 46px rgba(15, 35, 55, 0.2);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  padding: 14px 28px;
  background: #f8fbfe;
  border-bottom: 1px solid #edf3f8;
}

.dialog-title {
  display: block;
  color: #183755;
  font-size: 18px;
  font-weight: 800;
}

.dialog-subtitle {
  display: block;
  margin-top: 2px;
  color: #5f7188;
  font-size: 13px;
}

.dialog-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  margin: 0;
  padding: 0;
  font-size: 18px;
  color: #5f7188;
  background: #f6fbff;
  border: 1px solid #d9e7f3;
  border-radius: 6px;
  cursor: pointer;
}

.dialog-close--hover {
  background: #edf7ff;
  border-color: #0d82ee;
}

.dialog-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 14px 28px 12px;
  background: #fff;
}

.form-field {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.form-label {
  display: block;
  margin-bottom: 4px;
  color: #2c3e50;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}

.form-label--required::after {
  margin-left: 4px;
  color: #dc2626;
  content: "*";
  font-weight: 700;
}

.form-input,
.form-select,
.form-textarea {
  box-sizing: border-box;
  width: 100%;
  color: #1a2035;
  font-size: 14px;
  font-weight: 500;
  background: #fafcff;
  border: 1px solid #d0dce8;
  border-radius: 5px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.form-input:hover,
.form-select:hover,
.form-textarea:hover {
  border-color: #b0c4d8;
  background: #fff;
}

.form-input:focus,
.form-textarea:focus {
  background: #fff;
  border-color: #5ba4f0;
  box-shadow: 0 0 0 3px rgba(13, 130, 238, 0.08);
  outline: none;
}

.form-input,
.form-select {
  height: 36px;
  padding: 0 12px;
  line-height: 36px;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #a0aec0;
  font-weight: 400;
}

.form-textarea {
  min-height: 90px;
  padding: 10px 12px;
  line-height: 1.5;
  resize: vertical;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 20px;
  margin-bottom: 0;
}

.form-grid--two .form-field {
  margin-bottom: 12px;
}

.form-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.form-input--flex {
  flex: 1;
  min-width: 0;
}
.form-action-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  flex: none;
  height: 30px;
  padding: 0 8px;
  color: #3b82f6;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 4px;
  cursor: pointer;
  box-sizing: border-box;
}
.form-action-btn--hover {
  background: #dbeafe;
  border-color: #3b82f6;
}
.form-action-btn__icon--map {
  display: inline-block;
  width: 12px;
  height: 12px;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z'/%3E%3C/svg%3E") center/contain no-repeat;
}

/* ========== 转工单 - 地图选点面板 ========== */
.dispatch-map-picker {
  margin-top: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.10);
}
.dispatch-map-picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}
.dispatch-map-picker__title {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}
.dispatch-map-picker__coord {
  font-size: 12px;
  color: #94a3b8;
  transition: color 0.2s;
}
.dispatch-map-picker__coord--active {
  color: #3b82f6;
  font-weight: 500;
}
.dispatch-map-picker__body {
  height: 280px;
  width: 100%;
  position: relative;
}
.dispatch-map-picker__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #94a3b8;
  font-size: 14px;
  background: #f8fafc;
}
.dispatch-map-picker__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 14px;
  border-top: 1px solid #e2e8f0;
  background: #fafafa;
}
.dispatch-map-picker .dialog-btn {
  padding: 5px 18px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.2s;
}
.dispatch-map-picker .dialog-btn--cancel {
  background: #fff;
  color: #475569;
  border-color: #cbd5e1;
}
.dispatch-map-picker .dialog-btn--cancel:hover {
  background: #f1f5f9;
}
.dispatch-map-picker .dialog-btn--primary {
  background: #3b82f6;
  color: #fff;
}
.dispatch-map-picker .dialog-btn--primary:hover {
  background: #2563eb;
}
.dispatch-map-picker .dialog-btn--primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.dispatch-map-picker .dialog-btn--hover {
  opacity: 0.85;
}

/* 安装图片半宽 */
.dispatch-media-row {
  width: 50%;
  min-width: 200px;
}
.dispatch-media-row__item {
  width: 100%;
}

.form-select {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
}

.form-select--dropdown {
  position: relative;
}

.select-arrow {
  width: 8px;
  height: 8px;
  border: solid #74879c;
  border-width: 0 2px 2px 0;
  transform: translateY(-2px) rotate(45deg);
}

.select-field {
  position: relative;
}

.select-placeholder {
  color: #a0aec0;
  font-weight: 400;
}

.select-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  max-height: 220px;
  overflow-y: auto;
  background: #ffffff;
  border: 1px solid #d0dce8;
  border-radius: 6px;
  box-shadow: 0 10px 28px rgba(15, 35, 55, 0.14);
}

.select-option {
  display: flex;
  align-items: center;
  height: 38px;
  padding: 0 14px;
  color: #1a2035;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.14s ease, color 0.14s ease;
}

.select-option:hover {
  background: #edf7ff;
  color: #0d82ee;
}

.select-option--active {
  color: #0d82ee;
  background: #e8f4ff;
  font-weight: 700;
}

.form-control--error {
  border-color: #ef4444 !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

.form-error {
  display: block;
  margin-top: 4px;
  color: #ef4444;
  font-size: 12px;
  font-weight: 600;
}

.form-textarea {
  min-height: 72px;
  padding: 8px 12px;
  line-height: 1.45;
}

.form-readonly {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 600;
  background: #f0f4f8;
  border: 1px solid #e0e8f0;
  border-radius: 5px;
}

.form-datetime {
  width: 100%;
}

.form-datetime :deep(.datetime-picker__control) {
  height: 36px;
  padding: 0 12px;
  font-size: 14px;
  font-weight: 500;
  line-height: 36px;
  background: #fafcff;
  border: 1px solid #d0dce8;
  border-radius: 5px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease;
}

.form-datetime :deep(.datetime-picker__control:hover) {
  border-color: #b0c4d8;
  background: #fff;
}

.input-placeholder {
  color: #a0aec0;
  font-size: 14px;
  font-weight: 400;
}

/* 安装图片上传 — 与新增疑点表单一致 */
.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 96px;
  padding: 20px 16px;
  background: #f8fbfe;
  border: 2px dashed #c8dae8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-sizing: border-box;
}
.upload-placeholder:hover {
  background: #edf7ff;
  border-color: #0d82ee;
}
.upload-placeholder__title {
  color: #183755;
  font-size: 14px;
  font-weight: 700;
}
.upload-placeholder__hint {
  color: #8799ad;
  font-size: 12px;
}
.upload-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 8px;
}
.upload-preview-item {
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  overflow: hidden;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  background: #f6fafe;
  transition: border-color 0.2s;
}
.upload-preview-item:hover {
  border-color: #0d82ee;
}
.upload-preview-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: pointer;
}
.upload-preview-remove {
  position: absolute;
  top: 3px;
  right: 3px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  background: rgba(180, 35, 24, 0.82);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.15s;
}
.upload-preview-remove:hover {
  background: rgba(180, 35, 24, 0.95);
  transform: scale(1.1);
}
.upload-area {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 96px;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  flex: none;
  padding: 12px 28px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  background: #fafcff;
  border-top: 1px solid #e8eef4;
  box-shadow: 0 -2px 12px rgba(24, 55, 85, 0.04);
}

.dialog-button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 88px;
  height: 40px;
  margin: 0;
  padding: 0 24px;
  color: #2c3e50;
  font-size: 14px;
  font-weight: 700;
  line-height: 40px;
  background: #f0f4f8;
  border: 1px solid #d0dce8;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.18s ease;
}

.dialog-button::after {
  border: 0;
}

.dialog-button--hover {
  background: #e4ecf5;
  border-color: #b0c4d8;
}

.dialog-button--primary {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
  box-shadow: 0 4px 12px rgba(13, 130, 238, 0.2);
}

.dialog-button--primary.dialog-button--hover {
  background: #0674d8;
  border-color: #0674d8;
  box-shadow: 0 6px 16px rgba(13, 130, 238, 0.28);
}

.dialog-button--danger {
  color: #ffffff;
  background: #e74c3c;
  border-color: #e74c3c;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.2);
}

.dialog-button--danger.dialog-button--hover {
  background: #c0392b;
  border-color: #c0392b;
  box-shadow: 0 6px 16px rgba(231, 76, 60, 0.28);
}

.dialog-button[disabled] {
  opacity: 0.45;
  cursor: not-allowed;
}

/* ============================================
   响应式布局
   ============================================ */

/* 2K+ 大屏（>= 1920px） */
@media (min-width: 1920px) {
  .suspect-layout {
    grid-template-columns: minmax(0, 1fr) clamp(400px, 22vw, 480px);
  }

  .data-row {
    grid-template-columns: 58px minmax(110px, 0.9fr) minmax(104px, 0.86fr) minmax(94px, 0.8fr) minmax(200px, 1.2fr) minmax(160px, 1fr) minmax(104px, 0.82fr) minmax(220px, 0.98fr);
  }

  .suspect-view {
    padding: 0 20px 16px;
  }

  .suspect-layout {
    gap: 18px;
    margin-top: 18px;
  }

  .table-head {
    height: 54px;
    font-size: 17px;
    padding: 0 20px;
  }

  .data-cell {
    font-size: 14px;
    padding: 0 10px;
  }

  .data-row--header .data-cell {
    font-size: 13px;
  }

  .table-head__meta {
    font-size: 14px;
    padding: 4px 12px;
  }
}

/* 全高清（>= 1440px, < 1920px） */
@media (min-width: 1440px) and (max-width: 1919px) {
  .data-row {
    grid-template-columns: 54px minmax(100px, 0.88fr) minmax(96px, 0.84fr) minmax(86px, 0.78fr) minmax(180px, 1.2fr) minmax(150px, 1fr) minmax(96px, 0.8fr) minmax(210px, 0.96fr);
  }
}

/* 1366×768 标清（>= 1280px, < 1440px） */
@media (min-width: 1280px) and (max-width: 1439px) {
  .suspect-layout {
    grid-template-columns: minmax(0, 1fr) clamp(340px, 18vw, 380px);
  }

  .data-row {
    grid-template-columns: 50px minmax(90px, 0.85fr) minmax(86px, 0.8fr) minmax(76px, 0.74fr) minmax(150px, 1.2fr) minmax(130px, 1fr) minmax(86px, 0.76fr) minmax(180px, 0.92fr);
  }

  .suspect-toolbar {
    padding: 10px 14px;
    gap: 10px;
  }

  .filter-group {
    flex: 0 0 120px;
  }

  .filter-datetime {
    flex: 0 0 165px;
    width: 165px;
  }

  .table-head {
    height: 46px;
    font-size: 15px;
    padding: 0 14px;
  }

  .data-cell {
    padding: 0 7px;
    font-size: 12px;
  }

  .data-row--header .data-cell {
    font-size: 11px;
  }

  .detail-body {
    padding: 14px;
  }

  .detail-fields-grid {
    gap: 8px;
  }

  .detail-field-card {
    padding: 10px 12px;
  }

  .detail-field-card__value {
    font-size: 13px;
  }
}

/* 中屏（<= 1280px），堆叠布局 */
@media (max-width: 1280px) {
  .suspect-layout {
    grid-template-columns: minmax(0, 1fr) clamp(300px, 28vw, 380px);
  }

  .suspect-table-panel {
    overflow-y: auto;
    min-height: 0;
  }
}

/* 小屏平板（<= 960px） */
@media (max-width: 960px) {
  .suspect-view {
    padding: 0 8px 10px;
  }

  .suspect-layout {
    margin-top: 10px;
  }

  .toolbar-row--filters {
    flex-direction: column;
    gap: 8px;
  }

  .filter-group {
    flex: 1 1 100%;
    min-width: 0;
  }

  .filter-group--date {
    flex: 1 1 100%;
  }

  .date-range {
    flex-wrap: wrap;
  }

  .filter-datetime {
    flex: 1 1 140px;
    width: auto;
  }

  .data-row {
    min-height: 40px;
  }

  .data-cell {
    padding: 0 6px;
    font-size: 12px;
  }

  .detail-tabs {
    gap: 4px;
    height: 48px;
    padding: 6px;
  }

  .detail-tab {
    font-size: 12px;
  }

  .process-actions {
    gap: 8px;
  }
}

/* 手机（<= 640px） */
@media (max-width: 640px) {
  .suspect-view {
    padding: 0 4px 8px;
  }

  .suspect-toolbar {
    padding: 10px;
    gap: 8px;
  }

  .toolbar-row--filters {
    gap: 6px;
  }

  .toolbar-row--bottom {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .toolbar-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
    gap: 6px;
  }

  .toolbar-actions .toolbar-button {
    min-width: 56px;
    padding: 0 10px;
    font-size: 12px;
    height: 34px;
  }

  .toolbar-actions .toolbar-icon-button {
    width: 34px;
    height: 34px;
  }

  .suspect-layout {
    margin-top: 8px;
    grid-template-columns: minmax(0, 1fr) clamp(260px, 30vw, 340px);
  }

  .suspect-table-panel {
    overflow-y: auto;
    min-height: 0;
  }

  .suspect-detail-panel {
    min-height: 280px;
  }

  .table-head {
    height: 42px;
    padding: 0 10px;
    font-size: 14px;
  }

  .table-head__meta {
    font-size: 11px;
    padding: 2px 8px;
  }

  .data-row {
    min-height: 38px;
  }

  .data-row--header {
    min-height: 38px;
  }

  .data-cell {
    padding: 0 4px;
    font-size: 11px;
  }

  .data-row--header .data-cell {
    font-size: 11px;
  }

  .detail-tabs {
    gap: 3px;
    height: 44px;
    padding: 4px;
  }

  .detail-tab {
    font-size: 11px;
  }

  .detail-body {
    padding: 10px;
  }

  .detail-fields-grid {
    grid-template-columns: 1fr;
  }

  .pagination-bar {
    height: 40px;
    padding: 0 8px;
    gap: 6px;
  }

  .page-button {
    height: 28px;
    padding: 0 8px;
    font-size: 12px;
    line-height: 28px;
  }

  .page-info {
    font-size: 12px;
  }

  .process-actions {
    flex-direction: column;
    gap: 8px;
  }
}

/* 极小屏（<= 400px） */
@media (max-width: 400px) {
  .data-row {
    min-height: 36px;
  }

  .data-cell {
    padding: 0 3px;
    font-size: 10px;
  }

  .data-row--header .data-cell {
    font-size: 10px;
  }

  .detail-tabs {
    gap: 2px;
    height: 40px;
    padding: 3px;
  }

  .detail-tab {
    font-size: 10px;
  }
}
</style>
