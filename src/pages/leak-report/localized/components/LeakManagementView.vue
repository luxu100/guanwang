﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿<template>
  <view class="leak-management-view">
    <!-- 筛选栏 -->
    <view class="toolbar">
      <view class="toolbar-row toolbar-row--filters">
        <view class="filter-group">
          <text class="filter-label">{{ t('filter.detectTime') }}</text>
          <view class="date-range">
            <WorkOrderDatetimePicker v-model="filters.startTime" class="filter-datetime" :title="t('time.pleaseSelectStartTime')" :placeholder="t('time.pleaseSelectStartTime')" />
            <text class="filter-separator">{{ t('time.to') }}</text>
            <WorkOrderDatetimePicker v-model="filters.endTime" class="filter-datetime" :title="t('time.pleaseSelectEndTime')" :placeholder="t('time.pleaseSelectEndTime')" />
          </view>
        </view>
        <view class="filter-group">
          <text class="filter-label">{{ t('filter.deviceNumber') }}</text>
          <input v-model="filters.deviceNumber" class="filter-input" :placeholder="t('filter.pleaseInputRelatedDeviceNumber')" placeholder-class="input-placeholder" />
        </view>
        <view class="filter-group">
          <text class="filter-label">{{ t('filter.leakPointType') }}</text>
          <input v-model="filters.leakPointType" class="filter-input" :placeholder="t('filter.pleaseInputLeakPointType')" placeholder-class="input-placeholder" />
        </view>
        <view class="filter-group">
          <text class="filter-label">{{ t('filter.leakArea') }}</text>
          <input v-model="filters.leakArea" class="filter-input" :placeholder="t('filter.pleaseInputLeakArea')" placeholder-class="input-placeholder" />
        </view>
        <view class="filter-group">
          <text class="filter-label">{{ t('filter.inspector') }}</text>
          <input v-model="filters.inspector" class="filter-input" :placeholder="t('filter.pleaseInputInspector')" placeholder-class="input-placeholder" />
        </view>
        <view class="filter-group">
          <text class="filter-label">{{ t('filter.locator') }}</text>
          <input v-model="filters.locator" class="filter-input" :placeholder="t('filter.pleaseInputLocator')" placeholder-class="input-placeholder" />
        </view>
        <view class="filter-group">
          <text class="filter-label">{{ t('filter.leakStatus') }}</text>
          <picker :range="leakStatusOptions" range-key="label" @change="handleLeakStatusChange">
            <view class="filter-select">
              <text>{{ currentLeakStatusLabel }}</text>
              <text class="filter-select__arrow"></text>
            </view>
          </picker>
        </view>
        <view class="toolbar-actions toolbar-actions--right">
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchLeakPoints">{{ t('common.search') }}</button>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">{{ t('common.reset') }}</button>
          <button class="toolbar-icon-button" hover-class="toolbar-icon-button--hover" :aria-label="t('common.refresh')" @click="fetchLeakPoints"><text class="icon-refresh"></text></button>
          <view class="export-dropdown">
            <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="exportMenuVisible = !exportMenuVisible">{{ t('common.export') }}</button>
            <view v-if="exportMenuVisible" class="export-menu">
              <view class="export-menu__item" @click="handleExport('current')">{{ t('common.exportCurrentPage') }}</view>
              <view class="export-menu__item" @click="handleExport('all')">{{ t('common.exportAll') }}</view>
            </view>
          </view>
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="handleImport">{{ t('common.import') }}</button>
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="openCreateDialog">{{ t('leakManagement.addLeakPoint') }}</button>
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" :disabled="!selectedRecord" @click="openEditDialog">{{ t('common.edit') }}</button>
          <button class="toolbar-button toolbar-button--danger" hover-class="toolbar-button--hover" :disabled="!selectedRecord" @click="handleDelete">{{ t('common.delete') }}</button>
          <button class="toolbar-button toolbar-button--danger" hover-class="toolbar-button--hover" :disabled="selectedIds.size === 0" @click="handleBatchDelete">{{ t('common.batchDelete') }}</button>
        </view>
      </view>
    </view>

    <!-- 表格 + 详情 -->
    <LeakTableView
      :title="t('leakManagement.leakList')"
      :total="total"
      :page-num="pagination.pageNum"
      :page-size="pagination.pageSize"
      :total-pages="totalPages"
      :has-detail="!!selectedRecord"
      :detail-empty-text="t('leakManagement.detailEmpty')"
      @prev-page="changePage(-1)"
      @next-page="changePage(1)"
      @jump-page="jumpToPage"
      @page-size-change="handlePageSizeChange"
    >
      <view class="data-table" :style="{ minWidth: tableMinWidth }">
        <view class="data-row data-row--header" :style="{ gridTemplateColumns: tableGridTemplateColumns, minWidth: tableMinWidth }">
          <view class="data-cell data-cell--checkbox">
            <view v-if="allSelectable" class="checkbox" :class="{ 'checkbox--checked': isAllSelected }" @click.stop="toggleSelectAll"><text v-if="isAllSelected" class="checkbox__mark"></text></view>
          </view>
          <text class="data-cell data-cell--index">{{ t('table.index') }}</text>
          <text class="data-cell data-cell--time data-cell--sortable" @click.stop="toggleSort('detectTime')">{{ t('table.detectTime') }}<text class="sort-arrow sort-arrow--active" v-if="sortField === 'detectTime'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</text><text class="sort-arrow" v-else></text></text>
          <text class="data-cell data-cell--level data-cell--sortable" @click.stop="toggleSort('leakStatus')">{{ t('table.leakStatus') }}<text class="sort-arrow sort-arrow--active" v-if="sortField === 'leakStatus'">{{ sortOrder === 'asc' ? '▲' : '▼' }}</text><text class="sort-arrow" v-else></text></text>
          <text class="data-cell data-cell--type">{{ t('table.leakPointType') }}</text>
          <text class="data-cell data-cell--leakpart">{{ t('table.leakPointPart') }}</text>
          <text class="data-cell data-cell--address">{{ t('table.leakPointPosition') }}</text>
          <text class="data-cell data-cell--account">{{ t('table.inspector') }}</text>
          <text class="data-cell data-cell--locator">{{ t('table.locator') }}</text>
          <text class="data-cell data-cell--audio">{{ t('table.audio') }}</text>
          <text class="data-cell data-cell--video">{{ t('table.video') }}</text>
          <text class="data-cell data-cell--wsid">{{ t('table.workOrderId') }}</text>
          <text class="data-cell data-cell--devices">{{ t('table.deviceId') }}</text>
        </view>
        <view v-if="loading" class="table-state table-state--loading"><view class="state-spinner"></view><text class="state-text">{{ t('common.loading') }}</text></view>
        <view v-else-if="records.length === 0" class="table-state table-state--empty"><view class="state-icon-empty"></view><text class="state-text">{{ t('leakManagement.noLeakData') }}</text></view>
        <view v-for="(item, index) in records" v-else :key="getRowKey(item, index)" class="data-row data-row--body" :class="{ 'data-row--active': selectedRecordKey === getRowKey(item, index) }" :style="{ gridTemplateColumns: tableGridTemplateColumns, minWidth: tableMinWidth }" @click="selectRecord(item, index)">
          <view class="data-cell data-cell--checkbox" @click.stop="toggleSelectItem(item)">
            <view v-if="allSelectable" class="checkbox" :class="{ 'checkbox--checked': isItemSelected(item) }"><text v-if="isItemSelected(item)" class="checkbox__mark"></text></view>
          </view>
          <text class="data-cell data-cell--index">{{ (pagination.pageNum - 1) * pagination.pageSize + index + 1 }}</text>
          <text class="data-cell data-cell--time">{{ formatDateTime(getFieldValue(item, "detectTime")) }}</text>
          <text class="data-cell data-cell--level"><text class="level-pill" :class="getLeakStatusClass(item)">{{ getLeakStatusDisplay(item) }}</text></text>
          <text class="data-cell data-cell--type">{{ getFieldValue(item, "leakPointType") || "-" }}</text>
          <text class="data-cell data-cell--leakpart">{{ getFieldValue(item, "leakPart") || "-" }}</text>
          <text class="data-cell data-cell--address">{{ getFieldValue(item, "leakPointPosition") || "-" }}</text>
          <text class="data-cell data-cell--account">{{ getFieldValue(item, "inspector") || "-" }}</text>
          <text class="data-cell data-cell--locator">{{ getFieldValue(item, "locator") || "-" }}</text>
          <text class="data-cell data-cell--audio" @click.stop="toggleAudioPlay(item, index)"><text v-if="getFieldValue(item, 'audioFile')" class="play-icon" :class="playingAudioIndex === index ? 'icon-pause' : 'icon-play'"></text><text v-else>-</text></text>
          <text class="data-cell data-cell--video" @click.stop="toggleVideoPlay(item)"><text v-if="getFieldValue(item, 'sceneVideo')" class="play-icon icon-play video-icon"></text><text v-else>-</text></text>
          <text class="data-cell data-cell--wsid" @click.stop="handleWorkOrderJump(item)"><text v-if="getFieldValue(item, 'worksheetNumber')" class="link-text" :title="getWorkOrderDisplay(item)">{{ getWorkOrderDisplay(item) }}</text><text v-else-if="getFieldValue(item, 'workOrderId')" class="work-order-missing">{{ t('leakManagement.workOrderMissing') }}</text><text v-else>-</text></text>
          <text class="data-cell data-cell--devices">{{ getFieldValue(item, "deviceNumber") || "-" }}</text>
        </view>
      </view>

      <template #detail>
        <view class="detail-body">
          <view class="detail-tabs">
            <view v-for="tab in visibleDetailTabs" :key="tab.value" class="detail-tab" :class="{ 'detail-tab--active': activeDetailTab === tab.value }" @click="activeDetailTab = tab.value">{{ tab.label }}</view>
          </view>
          <view v-if="activeDetailTab === 'base'" class="detail-section">
            <view class="detail-summary">
              <view class="detail-summary__main"><text class="detail-summary__label">{{ t('detail.fields.leakPointPosition') }}</text><text class="detail-summary__value">{{ getFieldValue(selectedRecord, "leakPointPosition") || "-" }}</text></view>
              <view class="detail-summary__badges"><text class="detail-summary__badge" :class="getLeakStatusBadgeClass(selectedRecord)">{{ getLeakStatusDisplay(selectedRecord) }}</text></view>
              <view class="detail-summary__meta">
                <view class="detail-summary__meta-item"><text class="detail-summary__meta-label">{{ t('detail.fields.leakPointType') }}</text><text class="detail-summary__meta-value">{{ getFieldValue(selectedRecord, "leakPointType") || "-" }}</text></view>
                <view class="detail-summary__meta-item"><text class="detail-summary__meta-label">{{ t('detail.fields.detectType') }}</text><text class="detail-summary__meta-value">{{ getFieldValue(selectedRecord, "detectType") || "-" }}</text></view>
                <view class="detail-summary__meta-item"><text class="detail-summary__meta-label">{{ t('detail.fields.detectDifficulty') }}</text><text class="detail-summary__meta-value">{{ getFieldValue(selectedRecord, "detectDifficulty") || "-" }}</text></view>
                <view class="detail-summary__meta-item"><text class="detail-summary__meta-label">{{ t('detail.fields.inspector') }}</text><text class="detail-summary__meta-value">{{ getFieldValue(selectedRecord, "inspector") || "-" }}</text></view>
              </view>
            </view>
            <view class="time-section">
              <text class="detail-section-title">{{ t('leakManagement.timeInfo') }}</text>
              <view class="time-list">
                <view v-for="item in timeDetailFields" :key="item.label" class="time-row">
                  <view class="time-row__marker"></view>
                  <view class="time-row__content">
                    <text class="time-row__label">{{ item.label }}</text>
                    <text class="time-row__value">{{ item.value }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view class="time-section time-section--location">
              <text class="detail-section-title">{{ t('leakManagement.locationInfo') }}</text>
              <view class="location-row"><text class="location-row__label">{{ t('detail.fields.coordinatePosition') }}</text><text class="location-row__value">{{ formatCoordinate(getFieldValue(selectedRecord, "coordinatePosition")) }}</text></view>
              <view class="location-row"><text class="location-row__label">{{ t('detail.fields.leakArea') }}</text><text class="location-row__value">{{ getFieldValue(selectedRecord, "leakArea") || "-" }}</text></view>
              <view class="location-row"><text class="location-row__label">{{ t('detail.fields.leakPointPosition') }}</text><text class="location-row__value">{{ getFieldValue(selectedRecord, "leakPointPosition") || "-" }}</text></view>
            </view>
          </view>
          <view v-if="activeDetailTab === 'detail'" class="detail-section">
            <view class="detail-fields-grid">
              <view v-for="item in detailDetailFields" :key="item.label" class="detail-field-card">
                <text class="detail-field-card__label">{{ item.label }}</text>
                <text class="detail-field-card__value">{{ item.value }}</text>
              </view>
            </view>
          </view>
          <view v-if="activeDetailTab === 'pipe'" class="detail-section">
            <view class="detail-fields-grid">
              <view v-for="item in pipeDetailFields" :key="item.label" class="detail-field-card">
                <text class="detail-field-card__label">{{ item.label }}</text>
                <text class="detail-field-card__value">{{ item.value }}</text>
              </view>
            </view>
          </view>
          <view v-if="activeDetailTab === 'attach'" class="detail-section">
            <view class="attach-media">
              <view class="attach-media__item">
                <text class="attach-media__label">{{ t('leakManagement.fieldLabels.audioFile') }}</text>
                <view v-if="getFieldValue(selectedRecord, 'audioFile')" class="attach-media__player">
                  <button class="attach-play-btn" hover-class="attach-play-btn--hover" @click="openAudioDialog(getPreviewUrl(getFieldValue(selectedRecord, 'audioFile')), t('leakManagement.leakAudio'))"><text class="play-icon icon-play"></text></button>
                  <text class="attach-media__hint">{{ t('common.clickToPlay') }}</text>
                </view>
                <text v-else class="attach-media__empty">{{ t('leakManagement.noAudioUploaded') }}</text>
              </view>
              <view class="attach-media__item">
                <text class="attach-media__label">{{ t('leakManagement.scenePhotos') }}</text>
                <view v-if="detailPhotoIds.length" class="attach-media__photos">
                  <view v-for="(pid, pi) in detailPhotoIds" :key="pi" class="attach-photo">
                    <image :src="getPreviewUrl(pid)" mode="aspectFill" class="attach-photo__img" @click="previewDetailPhoto(pi)" />
                  </view>
                </view>
                <text v-else class="attach-media__empty">{{ t('leakManagement.noPhotosUploaded') }}</text>
              </view>
              <view class="attach-media__item">
                <text class="attach-media__label">{{ t('leakManagement.fieldLabels.sceneVideo') }}</text>
                <view v-if="getFieldValue(selectedRecord, 'sceneVideo')" class="attach-media__player">
                  <button class="attach-play-btn" hover-class="attach-play-btn--hover" @click="playDetailVideo"><text class="play-icon icon-play"></text></button>
                  <text class="attach-media__hint">{{ t('common.clickToPlay') }}</text>
                </view>
                <text v-else class="attach-media__empty">{{ t('leakManagement.noVideoUploaded') }}</text>
              </view>
            </view>
            <view class="detail-fields-grid">
              <view v-for="item in attachTextFields" :key="item.label" class="detail-field-card">
                <text class="detail-field-card__label">{{ item.label }}</text>
                <text class="detail-field-card__value">{{ item.value }}</text>
              </view>
            </view>
          </view>
        </view>
      </template>
    </LeakTableView>

    <!-- ========== 视频播放浮层 ========== -->
    <view v-if="videoDialogVisible" class="video-dialog-mask" @click="closeVideoDialog">
      <view class="video-dialog" @click.stop>
        <view class="video-dialog__head">
          <text class="video-dialog__title">{{ t('leakManagement.videoPlay') }}</text>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="t('common.close')" @click="closeVideoDialog"><text class="close-icon"></text></button>
        </view>
        <view class="video-dialog__body">
          <video
            v-if="currentVideoUrl"
            :src="currentVideoUrl"
            class="video-player"
            controls
            playsinline
            webkit-playsinline
            @loadedmetadata="onVideoLoadedMeta"
            @timeupdate="onVideoTimeUpdate"
            @waiting="onVideoWaiting"
            @playing="onVideoPlaying"
          ></video>
          <view v-else class="video-empty">{{ t('leakManagement.videoLoadFailed') }}</view>
          <view v-if="videoLoading && currentVideoUrl" class="video-loading">{{ t('leakManagement.videoBuffering') }}</view>
        </view>
        <view v-if="currentVideoUrl" class="video-dialog__info">
          <view class="video-info-row">
            <text class="video-info-label">{{ t('leakManagement.duration') }}</text>
            <text class="video-info-value">{{ formatVideoTime(videoDuration) }}</text>
          </view>
          <view class="video-info-row">
            <text class="video-info-label">{{ t('leakManagement.progress') }}</text>
            <text class="video-info-value">{{ formatVideoTime(videoCurrentTime) }} / {{ formatVideoTime(videoDuration) }}</text>
          </view>
          <view class="video-progress-bar">
            <view class="video-progress-filled" :style="{ width: videoProgress + '%' }"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 音频播放浮层 ========== -->
    <view v-if="audioDialogVisible" class="audio-dialog-mask" @click="closeAudioDialog">
      <view class="audio-dialog" @click.stop>
        <view class="audio-dialog__head">
          <text class="audio-dialog__title">{{ currentAudioTitle || t('leakManagement.audioPlay') }}</text>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="t('common.close')" @click="closeAudioDialog"><text class="close-icon"></text></button>
        </view>
        <view class="audio-dialog__body">
          <view v-if="!currentAudioUrl" class="audio-empty">{{ t('leakManagement.audioLoadFailed') }}</view>
          <view v-else class="audio-player">
            <view class="audio-player__icon">
              <view class="audio-cover">
                <view class="audio-cover__ring"></view>
                <view class="audio-cover__dot"></view>
              </view>
            </view>
            <view class="audio-player__info">
              <text class="audio-player__title">{{ currentAudioTitle }}</text>
              <view v-if="audioLoading" class="audio-player__loading">{{ t('leakManagement.buffering') }}</view>
              <view class="audio-player__progress">
                <text class="audio-time">{{ formatVideoTime(audioCurrentTime) }}</text>
                <view class="audio-seek-bar">
                  <view class="audio-seek-filled" :style="{ width: audioProgress + '%' }"></view>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="0.1"
                    :value="audioProgress"
                    class="audio-seek-input"
                    @input="seekAudio"
                  />
                </view>
                <text class="audio-time">{{ formatVideoTime(audioDuration) }}</text>
              </view>
              <button class="audio-play-btn" hover-class="audio-play-btn--hover" @click="toggleAudioPlayState">
                <text class="play-icon-large" :class="audioPlaying ? 'icon-pause-large' : 'icon-play-large'"></text>
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ========== 新增/编辑弹窗 ========== -->
    <view v-if="dialogVisible" class="dialog-mask" @click="closeDialog">
      <view class="dialog-panel" @click.stop>
        <view class="dialog-head">
          <view><text class="dialog-title">{{ isEditing ? t('leakManagement.editLeakPoint') : t('leakManagement.addLeakPoint') }}</text><text class="dialog-subtitle">{{ t('leakManagement.dialogSubtitle') }}</text></view>
          <button class="icon-button" hover-class="icon-button--hover" :aria-label="t('common.close')" @click="closeDialog"><text class="close-icon"></text></button>
        </view>
        <view class="dialog-body" @click="formLeakStatusDropdownVisible = false">
          <view class="form-layout">
            <!-- 左栏 -->
            <view class="form-main">
              <!-- 基础信息 -->
              <view class="form-section">
                <view class="section-head"><text class="section-title">{{ t('leakManagement.basicInfo') }}</text></view>
                <view class="form-grid form-grid--three">
                  <view class="form-field">
                    <text class="form-label form-label--required">{{ t('detail.fields.detectTime') }}</text>
                    <WorkOrderDatetimePicker v-model="form.detectTime" :title="t('time.pleaseSelectDetectTime')" :placeholder="t('time.pleaseSelectDetectTime')" :clearable="false" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">{{ t('detail.fields.detectType') }}</text>
                    <input v-model="form.detectType" class="form-input" :placeholder="t('leakManagement.placeholders.detectType')" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">{{ t('detail.fields.detectDifficulty') }}</text>
                    <input v-model="form.detectDifficulty" class="form-input" :placeholder="t('leakManagement.placeholders.detectDifficulty')" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label form-label--required">{{ t('detail.fields.leakPointType') }}</text>
                    <input v-model="form.leakPointType" class="form-input" :class="{ 'form-control--error': validationErrors.leakPointType }" :placeholder="t('leakManagement.placeholders.leakPointType')" placeholder-class="input-placeholder" />
                    <text v-if="validationErrors.leakPointType" class="form-error">{{ validationErrors.leakPointType }}</text>
                  </view>
                  <view class="form-field form-field--wide">
                    <text class="form-label form-label--required">{{ t('detail.fields.leakPointPosition') }}</text>
                    <input v-model="form.leakPointPosition" class="form-input" :placeholder="t('leakManagement.placeholders.leakPointPosition')" placeholder-class="input-placeholder" />
                    <text v-if="validationErrors.leakPointPosition" class="form-error">{{ validationErrors.leakPointPosition }}</text>
                  </view>
                  <view class="form-field">
                    <text class="form-label form-label--required">{{ t('detail.fields.leakPointPart') }}</text>
                    <input v-model="form.leakPart" class="form-input" :class="{ 'form-control--error': validationErrors.leakPart }" :placeholder="t('leakManagement.placeholders.leakPart')" placeholder-class="input-placeholder" />
                    <text v-if="validationErrors.leakPart" class="form-error">{{ validationErrors.leakPart }}</text>
                  </view>
                  <view class="form-field">
                    <text class="form-label">{{ t('detail.fields.leakVolume') }}</text>
                    <input v-model="form.leakVolume" class="form-input" :placeholder="t('leakManagement.placeholders.leakVolume')" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">{{ t('detail.fields.leakArea') }}</text>
                    <input v-model="form.leakArea" class="form-input" :placeholder="t('leakManagement.placeholders.leakArea')" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">{{ t('detail.fields.leakStatus') }}</text>
                    <view class="form-select form-select--clickable" @click.stop="formLeakStatusDropdownVisible = !formLeakStatusDropdownVisible">
                      <text>{{ currentFormLeakStatusLabel }}</text>
                      <text class="filter-select__arrow"></text>
                    </view>
                    <view v-if="formLeakStatusDropdownVisible" class="form-select-dropdown" @click.stop>
                      <view
                        v-for="(opt, oi) in formLeakStatusOptions"
                        :key="oi"
                        class="form-select-dropdown__item"
                        :class="{ 'form-select-dropdown__item--active': form.leakStatus === opt.value }"
                        @click="handleFormLeakStatusSelect(opt.value)"
                      >{{ opt.label }}</view>
                    </view>
                  </view>
                  <view class="form-field">
                    <text class="form-label form-label--required">{{ t('detail.fields.inspector') }}</text>
                    <input v-model="form.inspector" class="form-input" :class="{ 'form-control--error': validationErrors.inspector }" :placeholder="t('filter.pleaseInputInspector')" placeholder-class="input-placeholder" />
                    <text v-if="validationErrors.inspector" class="form-error">{{ validationErrors.inspector }}</text>
                  </view>
                  <view class="form-field">
                    <text class="form-label">{{ t('detail.fields.locator') }}</text>
                    <input v-model="form.locator" class="form-input" :placeholder="t('filter.pleaseInputLocator')" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">{{ t('detail.fields.leakReason') }}</text>
                    <input v-model="form.leakReason" class="form-input" :placeholder="t('leakManagement.placeholders.leakReason')" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">{{ t('detail.fields.cost') }}</text>
                    <input v-model="form.cost" class="form-input" type="number" :placeholder="t('leakManagement.placeholders.cost')" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">{{ t('detail.fields.manualReviewCount') }}</text>
                    <input v-model="form.manualReviewCount" class="form-input" type="number" :placeholder="t('leakManagement.placeholders.manualReviewCount')" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">{{ t('detail.fields.repairMethod') }}</text>
                    <input v-model="form.repairMethod" class="form-input" :placeholder="t('leakManagement.placeholders.repairMethod')" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field">
                    <text class="form-label">{{ t('detail.fields.repairTime') }}</text>
                    <WorkOrderDatetimePicker v-model="form.repairTime" :title="t('time.pleaseSelectRepairTime')" :placeholder="t('time.pleaseSelectRepairTime')" />
                  </view>
                </view>
              </view>
              <!-- 坐标位置 -->
              <view class="form-section">
                <view class="section-head"><text class="section-title">{{ t('detail.fields.coordinatePosition') }}</text><text class="section-hint">{{ t('leakManagement.coordHint') }}</text></view>
                <view class="form-field">
                  <view class="form-row">
                    <input v-model="form.coordinatePosition" class="form-input form-input--flex" :placeholder="t('leakManagement.placeholders.coordPosition')" placeholder-class="input-placeholder" />
                    <button class="form-action-btn" hover-class="form-action-btn--hover" @click="openMapPicker">
                      <text class="form-action-btn__icon form-action-btn__icon--map"></text><text>{{ t('leakManagement.mapPickerBtn') }}</text>
                    </button>
                  </view>
                  <!-- 地图选点面板 -->
                  <view v-if="mapPickerVisible" class="map-picker-panel">
                    <view class="map-picker-head">
                      <text class="map-picker-title">{{ t('leakManagement.clickMapToPick') }}</text>
                      <text class="map-picker-coord" :class="{ 'map-picker-coord--active': mapPickedCoord }">{{ mapPickedCoord || t('leakManagement.pleaseClickMap') }}</text>
                    </view>
                    <view class="map-picker-body">
                      <!-- #ifdef H5 -->
                      <view class="map-picker-body">
                        <LocaleCoordinateMap
                          :lng="mapPickerCenter.lng"
                          :lat="mapPickerCenter.lat"
                          selectable
                          @pick="handleMapPick"
                        />
                      </view>
                      <!-- #endif -->
                      <!-- #ifndef H5 -->
                      <view class="map-picker-canvas map-picker-canvas--fallback">{{ t('leakManagement.mapH5Only') }}</view>
                      <!-- #endif -->
                    </view>
                    <view class="map-picker-actions">
                      <button class="dialog-btn dialog-btn--cancel" hover-class="dialog-btn--hover" @click="closeMapPicker">{{ t('common.cancel') }}</button>
                      <button class="dialog-btn dialog-btn--primary" :disabled="!mapPickedCoord" hover-class="dialog-btn--hover" @click="confirmMapPick">{{ t('leakManagement.confirmLocation') }}</button>
                    </view>
                  </view>
                </view>
              </view>
              <!-- 现场照片与视频 -->
              <view class="form-section">
                <view class="section-head"><text class="section-title">{{ t('leakManagement.scenePhotosAndVideos') }}</text></view>
                <view class="form-grid form-grid--two">
                  <view class="form-field">
                    <text class="form-label">{{ t('leakManagement.scenePhotos') }}</text>
                    <view class="form-photo-area">
                      <view v-if="photoList.length > 0" class="photo-preview-list">
                        <view v-for="(photo, idx) in photoList" :key="idx" class="photo-preview-item">
                          <image :src="photo.url" class="photo-thumb" mode="aspectFill" />
                          <button class="photo-remove-btn" hover-class="photo-remove-btn--hover" @click="removePhoto(idx)"><text class="photo-remove-icon"></text></button>
                        </view>
                      </view>
                      <view v-if="photoList.length < 9" class="photo-add-box" @click="handleUploadPhoto"><text class="photo-add-icon">+</text><text class="photo-add-label">{{ photoList.length === 0 ? t('leakManagement.uploadPhoto') : t('leakManagement.continueAdd') }}</text></view>
                    </view>
                    <input v-model="photoIdListText" class="form-input form-input--hidden-id" :placeholder="t('leakManagement.photoIdPlaceholder')" placeholder-class="input-placeholder" />
                  </view>
                  <view class="form-field" style="margin-bottom: 8px;">
                    <text class="form-label">{{ t('leakManagement.fieldLabels.sceneVideo') }}</text>
                    <view class="form-photo-area">
                      <view v-if="videoList.length > 0" class="photo-preview-list">
                        <view v-for="(video, vidx) in videoList" :key="vidx" class="photo-preview-item photo-preview-item--video">
                          <video :src="video.url" class="photo-thumb" />
                          <button class="photo-remove-btn" hover-class="photo-remove-btn--hover" @click="removeVideo"><text class="photo-remove-icon"></text></button>
                        </view>
                      </view>
                      <view v-if="videoList.length === 0" class="photo-add-box" @click="handleUploadVideo"><text class="photo-add-icon">+</text><text class="photo-add-label">{{ t('leakManagement.uploadVideo') }}</text></view>
                    </view>
                    <input v-model="form.sceneVideo" class="form-input form-input--hidden-id" :placeholder="t('leakManagement.videoIdPlaceholder')" placeholder-class="input-placeholder" />
                  </view>
                </view>
              </view>
              <!-- 备注 -->
              <view class="form-section">
                <view class="section-head"><text class="section-title">{{ t('leakManagement.fieldLabels.remark') }}</text></view>
                <view class="form-field"><textarea v-model="form.description" class="form-textarea" :placeholder="t('leakManagement.remarkPlaceholder')" placeholder-class="input-placeholder" /></view>
              </view>
            </view>
            <!-- 右栏 -->
            <view class="form-side">
              <!-- 管道信息 -->
              <view class="form-section">
                <view class="section-head"><text class="section-title">{{ t('leakManagement.pipeInfo') }}</text></view>
                <view class="form-grid form-grid--side">
                  <view class="form-field"><text class="form-label form-label--required">{{ t('detail.fields.tubeMaterial') }}</text><input v-model="form.tubeMaterial" class="form-input" :class="{ 'form-control--error': validationErrors.tubeMaterial }" :placeholder="t('leakManagement.placeholders.tubeMaterial')" placeholder-class="input-placeholder" /><text v-if="validationErrors.tubeMaterial" class="form-error">{{ validationErrors.tubeMaterial }}</text></view>
                  <view class="form-field"><text class="form-label form-label--required">{{ t('detail.fields.tubeBore') }}</text><input v-model="form.tubeBore" class="form-input" :class="{ 'form-control--error': validationErrors.tubeBore }" :placeholder="t('leakManagement.placeholders.tubeBore')" placeholder-class="input-placeholder" /><text v-if="validationErrors.tubeBore" class="form-error">{{ validationErrors.tubeBore }}</text></view>
                  <view class="form-field"><text class="form-label form-label--required">{{ t('detail.fields.tubeDepth') }}</text><input v-model="form.tubeBuriedDepth" class="form-input" :class="{ 'form-control--error': validationErrors.tubeBuriedDepth }" :placeholder="t('leakManagement.placeholders.tubeDepth')" placeholder-class="input-placeholder" /><text v-if="validationErrors.tubeBuriedDepth" class="form-error">{{ validationErrors.tubeBuriedDepth }}</text></view>
                  <view class="form-field"><text class="form-label">{{ t('detail.fields.tubeAge') }}</text><input v-model="form.tubeAge" class="form-input" :placeholder="t('leakManagement.placeholders.tubeAge')" placeholder-class="input-placeholder" /></view>
                </view>
              </view>
              <!-- 设备与音频 -->
              <view class="form-section">
                <view class="section-head"><text class="section-title">{{ t('leakManagement.deviceAndAudio') }}</text></view>
                <view class="form-grid form-grid--side">
                  <view class="form-field form-field--device-search">
                    <text class="form-label form-label--required">{{ t('detail.fields.deviceNumber') }}</text>
                    <input
                      v-model="form.deviceNumber"
                      class="form-input"
                      :class="{ 'form-control--error': validationErrors.deviceNumber }"
                      :placeholder="t('leakManagement.placeholders.deviceNumber')"
                      placeholder-class="input-placeholder"
                      @focus="showDeviceSuggestions = true"
                      @blur="hideDeviceSuggestions"
                    />
                    <text v-if="validationErrors.deviceNumber" class="form-error">{{ validationErrors.deviceNumber }}</text>
                    <view v-if="showDeviceSuggestions && filteredDeviceNumbers.length > 0" class="device-suggestions">
                      <view
                        v-for="num in filteredDeviceNumbers"
                        :key="num"
                        class="device-suggestion-item"
                        @mousedown.prevent="selectDeviceNumber(num)"
                      >{{ num }}</view>
                    </view>
                  </view>
                  <view class="form-field"><text class="form-label">{{ t('detail.fields.leakDistance') }}</text><input v-model="form.leakDistance" class="form-input" :placeholder="t('leakManagement.placeholders.leakDistance')" placeholder-class="input-placeholder" /></view>
                  <view class="form-field"><text class="form-label">{{ t('detail.fields.noiseSample') }}</text><input v-model="form.noiseSample" class="form-input" :placeholder="t('leakManagement.placeholders.noiseSample')" placeholder-class="input-placeholder" /></view>
                  <view class="form-field"><text class="form-label">{{ t('detail.fields.noiseTime') }}</text><WorkOrderDatetimePicker v-model="form.noiseTime" :title="t('time.pleaseSelectNoiseTime')" :placeholder="t('time.pleaseSelectNoiseTime')" /></view>
                  <view class="form-field"><text class="form-label">{{ t('detail.fields.leakEsa') }}</text><input v-model="form.featureValue" class="form-input" :placeholder="t('leakManagement.placeholders.featureValue')" placeholder-class="input-placeholder" /></view>
                  <view class="form-field">
                    <text class="form-label">{{ t('leakManagement.fieldLabels.audioFile') }}</text>
                    <view class="form-photo-area">
                      <view v-if="audioList.length > 0" class="photo-preview-list">
                        <view v-for="(audio, aidx) in audioList" :key="aidx" class="photo-preview-item photo-preview-item--audio">
                          <view class="audio-thumb"><text class="audio-thumb__icon">♪</text></view>
                          <button class="photo-remove-btn" hover-class="photo-remove-btn--hover" @click="removeAudio"><text class="photo-remove-icon"></text></button>
                        </view>
                      </view>
                      <view v-if="audioList.length === 0" class="photo-add-box" @click="handleUploadAudio"><text class="photo-add-icon">+</text><text class="photo-add-label">{{ t('leakManagement.uploadAudio') }}</text></view>
                    </view>
                    <input v-model="form.audioFile" class="form-input form-input--hidden-id" :placeholder="t('leakManagement.audioIdPlaceholder')" placeholder-class="input-placeholder" />
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
        <view class="dialog-actions">
          <button class="dialog-btn dialog-btn--cancel" hover-class="dialog-btn--hover" @click="closeDialog">{{ t('common.cancel') }}</button>
          <button class="dialog-btn dialog-btn--primary" :disabled="submitting" hover-class="dialog-btn--hover" @click="submitForm">{{ submitting ? t('common.submitting') : t('common.confirm') }}</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import LocaleCoordinateMap from "@/components/map/LocaleCoordinateMap.vue";
import { MAP_CONFIG } from "@/services/map/map";
import { computed, reactive, ref, onMounted } from "vue";
import type { DetailTab } from "@/types/LeakPoint";
import {
  getLeakPointPage,
  getLeakPointDetail,
  createLeakPoint,
  updateLeakPoint,
  deleteLeakPoint,
} from "@/services/leak-report/leak-management";
import { getWorksheetProcessDetail } from "@/services/work-order/processing";
import WorkOrderDatetimePicker from "@/pages/work-order/localized/components/WorkOrderDatetimePicker.vue";
import LeakTableView from "@/pages/leak-report/localized/components/LeakTableView.vue";
import { uploadFile } from "@/services/leak-report/file-upload";
import { getVisibleDeviceList } from "@/services/device/info";
import { createScopedT, useI18n } from "@/i18n";
import {
  LEAK_STATUS,
  isRepairedStatus,
  isUnrepairedStatus,
  normalizeLeakStatusCode,
} from "@/pages/leak-report/constants/status";

const t = createScopedT("leakReport");
const { locale } = useI18n();

/**
 * 表格列宽动态配置（13 列）
 *
 * 英文表头普遍比中文长（如 "Leak Point Position" 19字符 vs "漏点位置" 4字符），
 * 共用一套列宽会导致英文表头截断。根据 locale 返回不同配置：
 * - zh-CN：以中文表头长度为基准，min-width 1200px
 * - en-US：以英文表头长度为基准，min-width 1380px（关键列加宽）
 *
 * 每列 minmax 的最小值基于英文表头字符数 × 6.5px + 24px padding 计算，确保完整展示。
 * 13 列依次为：复选框/序号/检出时间/渗漏状态/漏点类型/泄漏部位/漏点位置/巡检人员/定漏人员/音频/视频/关联工单/关联设备
 */
const tableGridTemplateColumns = computed<string>(() => {
  if (locale.value === "en-US") {
    return "40px 52px minmax(150px, 1.5fr) minmax(100px, 1fr) minmax(120px, 1.1fr) minmax(120px, 1.1fr) minmax(170px, 1.7fr) minmax(105px, 1fr) minmax(105px, 1fr) 72px 72px minmax(130px, 1fr) minmax(130px, 1fr)";
  }
  return "40px 52px minmax(140px, 1.4fr) minmax(86px, 0.85fr) minmax(96px, 0.95fr) minmax(100px, 1fr) minmax(140px, 1.6fr) minmax(86px, 0.85fr) minmax(86px, 0.85fr) 72px 72px minmax(110px, 0.85fr) minmax(100px, 0.85fr)";
});

const tableMinWidth = computed<string>(() => (locale.value === "en-US" ? "1380px" : "1200px"));

function getBaseUrl(): string {
  const env = (import.meta as unknown as { env: { VITE_API_BASE_URL?: string; VITE_DEV_PROXY_TARGET?: string } }).env;
  return env?.VITE_API_BASE_URL || env?.VITE_DEV_PROXY_TARGET || "";
}

type RecordItem = Record<string, unknown>;

interface Res {
  code?: number;
  data?: unknown;
  records?: unknown[];
  total?: number;
  msg?: string;
}

interface PhotoItem {
  url: string;
  id: string;
}

interface VideoItem {
  url: string;
  id: string;
  name: string;
}

const MAX_VIDEO_SIZE = 500 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + "B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + "KB";
  return (bytes / (1024 * 1024)).toFixed(1) + "MB";
}

const detailTabs = computed<Array<{ label: string; value: DetailTab }>>(() => [
  { label: t("detail.tabs.basic"), value: "base" },
  { label: t("detail.tabs.leakDetail"), value: "detail" },
  { label: t("detail.tabs.pipeInfo"), value: "pipe" },
  { label: t("detail.tabs.attachment"), value: "attach" },
]);

const visibleDetailTabs = computed(() => detailTabs.value);

const sortField = ref("detectTime");
const sortOrder = ref("desc");

const filters = reactive({ startTime: "", endTime: "", deviceNumber: "", leakPointType: "", leakArea: "", inspector: "", locator: "", leakStatus: "" });
const leakStatusOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: t("common.all"), value: "" },
  { label: t("status.repaired"), value: LEAK_STATUS.REPAIRED },
  { label: t("status.unrepaired"), value: LEAK_STATUS.UNREPAIRED },
]);
const formLeakStatusOptions = computed<Array<{ label: string; value: string }>>(() => [
  { label: t("status.repaired"), value: LEAK_STATUS.REPAIRED },
  { label: t("status.unrepaired"), value: LEAK_STATUS.UNREPAIRED },
]);
const currentLeakStatusLabel = computed(() => leakStatusOptions.value.find((o) => o.value === filters.leakStatus)?.label || t("common.all"));
function handleLeakStatusChange(e: { detail: { value: number } }) {
  filters.leakStatus = leakStatusOptions.value[e.detail.value]?.value || "";
}
const currentFormLeakStatusLabel = computed(() => formLeakStatusOptions.value.find((o) => o.value === form.leakStatus)?.label || t("common.all"));
const formLeakStatusDropdownVisible = ref(false);
function handleFormLeakStatusSelect(value: string) {
  form.leakStatus = value;
  formLeakStatusDropdownVisible.value = false;
}
const pagination = reactive({ pageNum: 1, pageSize: 10 });
const records = ref<RecordItem[]>([]);
const selectedRecord = ref<RecordItem | null>(null);
const selectedRecordKey = ref("");
const selectedIds = ref(new Set<string>());
const total = ref(0);
const loading = ref(false);
const exportMenuVisible = ref(false);

const dialogVisible = ref(false);
const isEditing = ref(false);
const submitting = ref(false);
const activeDetailTab = ref<DetailTab>("base");
const photoList = ref<PhotoItem[]>([]);
const photoIdListText = ref("");
const videoList = ref<VideoItem[]>([]);
const audioList = ref<VideoItem[]>([]);

const validationErrors = reactive({
  detectTime: "",
  leakPointType: "",
  leakPointPosition: "",
  leakPart: "",
  inspector: "",
  tubeMaterial: "",
  tubeBore: "",
  tubeBuriedDepth: "",
  deviceNumber: "",
});

const form = reactive({
  detectType: "",
  detectTime: "",
  detectDifficulty: "",
  leakPointType: "",
  leakPointPosition: "",
  coordinatePosition: "",
  leakVolume: "",
  tubeBore: "",
  tubeMaterial: "",
  tubeAge: "",
  leakPart: "",
  tubeBuriedDepth: "",
  leakReason: "",
  leakDistance: "",
  noiseSample: "",
  inspector: "",
  locator: "",
  cost: "",
  leakArea: "",
  repairTime: "",
  sceneImages: "",
  sceneVideo: "",
  manualReviewCount: "",
  deviceNumber: "",
  noiseTime: "",
  leakStatus: "",
  featureValue: "",
  audioFile: "",
  repairMethod: "",
  description: "",
});

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pagination.pageSize)));
const allSelectable = computed(() => records.value.length > 0);
const isAllSelected = computed(() => records.value.length > 0 && records.value.every((r) => isItemSelected(r)));

function mkFields(r: RecordItem | null, defs: Array<[string, string, boolean?, string?]>) {
  const item = r || {};
  return defs.map(([label, key, fmt, override]) => ({
    label,
    value: override ?? (fmt ? fmtDt(gv(item, key)) : String(gv(item, key) ?? "-")),
  }));
}

const detailDetailFields = computed(() => mkFields(selectedRecord.value, [
  [t("detail.fields.leakStatus"), "leakStatus", false, getLeakStatusDisplay(selectedRecord.value)],
  [t("detail.fields.leakPointPart"), "leakPart"],
  [t("detail.fields.leakDistance"), "leakDistance"],
  [t("detail.fields.leakVolume"), "leakVolume"],
  [t("detail.fields.locator"), "locator"],
  [t("detail.fields.leakReason"), "leakReason"],
  [t("detail.fields.cost"), "cost"],
  [t("detail.fields.manualReviewCount"), "manualReviewCount"],
  [t("detail.fields.repairMethod"), "repairMethod"],
  [t("detail.fields.leakEsa"), "featureValue"],
  [t("detail.fields.suspectedLeakId"), "suspectedLeakId"],
]));

const timeDetailFields = computed(() => {
  const r = selectedRecord.value || {};
  return [
    { label: t("detail.fields.detectTime"), value: fmtDt(gv(r, "detectTime")) },
    { label: t("detail.fields.noiseTime"), value: fmtDt(gv(r, "noiseTime")) },
    { label: t("detail.fields.createdAt"), value: fmtDt(gv(r, "createdAt")) },
    { label: t("detail.fields.repairTime"), value: fmtDt(gv(r, "repairTime")) },
  ];
});

const pipeDetailFields = computed(() => mkFields(selectedRecord.value, [
  [t("detail.fields.tubeMaterial"), "tubeMaterial"],
  [t("detail.fields.tubeBore"), "tubeBore"],
  [t("detail.fields.tubeDepth"), "tubeBuriedDepth"],
  [t("detail.fields.tubeAge"), "tubeAge"],
]));

const attachTextFields = computed(() => mkFields(selectedRecord.value, [
  [t("detail.fields.noiseSample"), "noiseSample"],
  [t("detail.fields.description"), "description"],
]));

const detailPhotoIds = computed<string[]>(() => {
  const raw = getFieldValue(selectedRecord.value, "sceneImages");
  if (!raw) return [];
  return String(raw).split(",").map((s) => s.trim()).filter(Boolean);
});

function getPreviewUrl(filePath: string): string {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) return filePath;
  if (filePath.startsWith("/")) return `${getBaseUrl()}${filePath}`;
  return `${getBaseUrl()}/${filePath}`;
}

function previewDetailPhoto(index: number) {
  const urls = detailPhotoIds.value.map(getPreviewUrl);
  // #ifdef H5
  window.open(urls[index], "_blank");
  // #endif
  // #ifndef H5
  uni.previewImage({ current: urls[index], urls });
  // #endif
}

function playDetailVideo() {
  const vid = getFieldValue(selectedRecord.value, "sceneVideo");
  if (!vid) return;
  videoDuration.value = 0;
  videoCurrentTime.value = 0;
  videoLoading.value = true;
  currentVideoUrl.value = getPreviewUrl(String(vid));
  videoDialogVisible.value = true;
}

function gv(item: RecordItem, k: string) { return Object.hasOwn(item, k) ? item[k] : undefined; }
function getRowId(item: RecordItem): string { const v = gv(item, "id"); return typeof v === "string" || typeof v === "number" ? String(v) : ""; }
function getRowKey(item: RecordItem, i: number): string { return getRowId(item) || String(i); }

const deviceNumberList = ref<string[]>([]);
const showDeviceSuggestions = ref(false);
const filteredDeviceNumbers = computed(() => {
  const kw = form.deviceNumber.trim().toLowerCase();
  if (!kw) return deviceNumberList.value.slice(0, 20);
  return deviceNumberList.value.filter((d) => d.toLowerCase().includes(kw)).slice(0, 20);
});

async function fetchDeviceNumbers() {
  try {
    const res = await getVisibleDeviceList() as unknown as Res;
    const data = res?.data as RecordItem[] | RecordItem | undefined;
    const list = Array.isArray(data) ? data : Array.isArray((data as RecordItem)?.records) ? (data as RecordItem).records as RecordItem[] : [];
    deviceNumberList.value = list.map((d) => String(gv(d, "deviceNumber") || "")).filter(Boolean);
  } catch { deviceNumberList.value = []; }
}

function selectDeviceNumber(num: string) {
  form.deviceNumber = num;
  showDeviceSuggestions.value = false;
  validationErrors.deviceNumber = "";
}

function hideDeviceSuggestions() {
  setTimeout(() => { showDeviceSuggestions.value = false; }, 200);
}

onMounted(() => { fetchLeakPoints(); fetchDeviceNumbers(); });

function toggleSort(field: string) {
  if (sortField.value === field) {
    if (sortOrder.value === "asc") { sortOrder.value = "desc"; }
    else if (sortOrder.value === "desc") { sortField.value = ""; sortOrder.value = ""; return; }
  } else {
    sortField.value = field;
    sortOrder.value = "asc";
  }
  pagination.pageNum = 1;
  fetchLeakPoints();
}

function buildQuery(): Record<string, unknown> {
  return rmEmpty({
    pageNum: pagination.pageNum,
    pageSize: pagination.pageSize,
    startTime: normDate(filters.startTime, false),
    endTime: normDate(filters.endTime, true),
    sortOrder: sortOrder.value || "desc",
    sortField: sortField.value || "detectTime",
    deviceNumber: filters.deviceNumber.trim() || undefined,
    leakPointType: filters.leakPointType.trim() || undefined,
    leakArea: filters.leakArea.trim() || undefined,
    inspector: filters.inspector.trim() || undefined,
    locator: filters.locator.trim() || undefined,
  });
}

async function fetchLeakPoints() {
  loading.value = true;
  try {
    const res = (await getLeakPointPage(buildQuery())) as Res;
    ok(res);
    const p = parsePage(res);
    if (p.pageNum && p.pageNum !== pagination.pageNum) pagination.pageNum = p.pageNum;
    if (p.pageSize && p.pageSize !== pagination.pageSize) pagination.pageSize = p.pageSize;
    const filteredRecords = applyLocalFilters(p.records);
    records.value = applyLocalSort(filteredRecords);
    total.value = filteredRecords.length !== p.records.length ? filteredRecords.length : p.total;
    selectedIds.value = new Set();
    selectFirstRow();
    fillWorkOrderNumbers();
  } catch (e: unknown) {
    records.value = []; total.value = 0; selectedRecord.value = null; selectedRecordKey.value = "";
    uni.showToast({ title: (e as { msg?: string }).msg || t("leakManagement.loadFailed"), icon: "none" });
  } finally { loading.value = false; }
}

async function fillWorkOrderNumbers() {
  const needFetch = records.value.filter((r) => {
    const wid = getFieldValue(r, "workOrderId");
    return wid && !getFieldValue(r, "worksheetNumber");
  });
  if (needFetch.length === 0) return;
  await Promise.all(needFetch.map(async (item) => {
    const wid = getFieldValue(item, "workOrderId");
    try {
      const res = (await getWorksheetProcessDetail(wid)) as Res;
      const d = res?.data;
      if (isObj(d)) {
        item.worksheetNumber = String(gv(d as RecordItem, "worksheetNumber") || "");
      } else {
        item.worksheetNumber = "";
      }
    } catch {
      item.worksheetNumber = "";
    }
  }));
  records.value = [...records.value];
}

function searchLeakPoints() { pagination.pageNum = 1; fetchLeakPoints(); }
function resetFilters() { filters.startTime = ""; filters.endTime = ""; filters.deviceNumber = ""; filters.leakPointType = ""; filters.leakArea = ""; filters.inspector = ""; filters.locator = ""; filters.leakStatus = ""; searchLeakPoints(); }
function changePage(s: number) { const n = pagination.pageNum + s; if (n < 1 || n > totalPages.value) return; pagination.pageNum = n; fetchLeakPoints(); }
function jumpToPage(p: number) { if (p < 1 || p > totalPages.value) return; pagination.pageNum = p; fetchLeakPoints(); }
function handlePageSizeChange(size: number) { pagination.pageSize = size; pagination.pageNum = 1; fetchLeakPoints(); }

function selectFirstRow() {
  if (!records.value.length) { selectedRecord.value = null; selectedRecordKey.value = ""; return; }
  selectedRecord.value = records.value[0];
  selectedRecordKey.value = getRowKey(records.value[0], 0);
  activeDetailTab.value = "base";
}

function selectRecord(item: RecordItem, i: number) {
  selectedRecord.value = item; selectedRecordKey.value = getRowKey(item, i); activeDetailTab.value = "base";
  const id = getRowId(item);
  if (!id) return;
  getLeakPointDetail(id).then((res: unknown) => {
    ok(res as Res);
    const d = (res as Res)?.data;
    if (isObj(d)) {
      const cleanDetail = Object.fromEntries(Object.entries(d as RecordItem).filter(([, v]) => v !== null && v !== undefined));
      selectedRecord.value = { ...item, ...cleanDetail };
    }
  }).catch(() => {});
}

function isItemSelected(item: RecordItem) { return selectedIds.value.has(getRowKey(item, records.value.indexOf(item))); }
function toggleSelectItem(item: RecordItem) {
  const key = getRowKey(item, records.value.indexOf(item));
  const s = new Set(selectedIds.value); s.has(key) ? s.delete(key) : s.add(key); selectedIds.value = s;
}
function toggleSelectAll() { selectedIds.value = isAllSelected.value ? new Set() : new Set(records.value.map((r, i) => getRowKey(r, i))); }

function openCreateDialog() { isEditing.value = false; resetForm(); dialogVisible.value = true; }
function openEditDialog() {
  if (!selectedRecord.value) { uni.showToast({ title: t("leakManagement.selectLeakPointFirst"), icon: "none" }); return; }
  isEditing.value = true; resetForm(); fillForm(selectedRecord.value); dialogVisible.value = true;
}
function closeDialog() { dialogVisible.value = false; formLeakStatusDropdownVisible.value = false; resetForm(); }

function revokeBlobUrl(url: string) { if (url.startsWith("blob:")) URL.revokeObjectURL(url); }

function resetForm() {
  form.detectType = ""; form.detectTime = ""; form.detectDifficulty = ""; form.leakPointType = "";
  form.leakPointPosition = ""; form.coordinatePosition = ""; form.leakVolume = ""; form.tubeBore = "";
  form.tubeMaterial = ""; form.tubeAge = ""; form.leakPart = ""; form.tubeBuriedDepth = "";
  form.leakReason = ""; form.leakDistance = ""; form.noiseSample = ""; form.inspector = "";
  form.locator = ""; form.cost = ""; form.leakArea = ""; form.repairTime = "";
  form.sceneImages = ""; form.sceneVideo = ""; form.manualReviewCount = ""; form.deviceNumber = "";
  form.noiseTime = ""; form.leakStatus = ""; form.featureValue = ""; form.audioFile = "";
  form.repairMethod = ""; form.description = "";
  photoList.value.forEach((p) => revokeBlobUrl(p.url));
  videoList.value.forEach((v) => revokeBlobUrl(v.url));
  audioList.value.forEach((a) => revokeBlobUrl(a.url));
  photoList.value = []; photoIdListText.value = ""; videoList.value = []; audioList.value = []; clearValidationErrors();
}

function fillForm(item: RecordItem) {
  form.detectType = String(gv(item, "detectType") ?? "");
  form.detectTime = toLocal(gv(item, "detectTime"));
  form.detectDifficulty = String(gv(item, "detectDifficulty") ?? "");
  form.leakPointType = String(gv(item, "leakPointType") ?? "");
  form.leakPointPosition = String(gv(item, "leakPointPosition") ?? "");
  form.coordinatePosition = String(gv(item, "coordinatePosition") ?? "");
  form.leakVolume = String(gv(item, "leakVolume") ?? "");
  form.tubeBore = String(gv(item, "tubeBore") ?? "");
  form.tubeMaterial = String(gv(item, "tubeMaterial") ?? "");
  form.tubeAge = String(gv(item, "tubeAge") ?? "");
  form.leakPart = String(gv(item, "leakPart") ?? "");
  form.tubeBuriedDepth = String(gv(item, "tubeBuriedDepth") ?? "");
  form.leakReason = String(gv(item, "leakReason") ?? "");
  form.leakDistance = String(gv(item, "leakDistance") ?? "");
  form.noiseSample = String(gv(item, "noiseSample") ?? "");
  form.inspector = String(gv(item, "inspector") ?? "");
  form.locator = String(gv(item, "locator") ?? "");
  form.cost = String(gv(item, "cost") ?? "");
  form.leakArea = String(gv(item, "leakArea") ?? "");
  form.repairTime = toLocal(gv(item, "repairTime"));
  form.sceneImages = String(gv(item, "sceneImages") ?? "");
  form.sceneVideo = String(gv(item, "sceneVideo") ?? "");
  form.manualReviewCount = String(gv(item, "manualReviewCount") ?? "");
  form.deviceNumber = String(gv(item, "deviceNumber") ?? "");
  form.noiseTime = toLocal(gv(item, "noiseTime"));
  form.leakStatus = String(gv(item, "leakStatus") ?? "");
  form.featureValue = String(gv(item, "featureValue") ?? "");
  form.audioFile = String(gv(item, "audioFile") ?? "");
  form.repairMethod = String(gv(item, "repairMethod") ?? "");
  form.description = String(gv(item, "description") ?? "");
  const picPaths = String(gv(item, "sceneImages") ?? "").split(",").map((s: string) => s.trim()).filter(Boolean);
  form.sceneImages = picPaths.join(","); photoIdListText.value = form.sceneImages;
  photoList.value = picPaths.map((p: string) => ({ url: getPreviewUrl(p), id: p }));
  const vidId = String(gv(item, "sceneVideo") ?? "");
  videoList.value = vidId ? [{ url: getPreviewUrl(vidId), id: vidId, name: `${t("leakManagement.videoFilePrefix")}_${vidId}` }] : [];
  const audId = String(gv(item, "audioFile") ?? "");
  audioList.value = audId ? [{ url: getPreviewUrl(audId), id: audId, name: `${t("leakManagement.audioFilePrefix")}_${audId}` }] : [];
  clearValidationErrors();
}

function clearValidationErrors() { validationErrors.detectTime = ""; validationErrors.leakPointType = ""; validationErrors.leakPointPosition = ""; validationErrors.leakPart = ""; validationErrors.inspector = ""; validationErrors.tubeMaterial = ""; validationErrors.tubeBore = ""; validationErrors.tubeBuriedDepth = ""; validationErrors.deviceNumber = ""; }

function validateForm(): boolean {
  clearValidationErrors(); let valid = true;
  if (!form.detectTime) { validationErrors.detectTime = t("validation.detectTimeRequired"); valid = false; }
  if (!form.leakPointType.trim()) { validationErrors.leakPointType = t("validation.leakPointTypeRequired"); valid = false; }
  if (!form.leakPointPosition.trim()) { validationErrors.leakPointPosition = t("validation.leakPointPositionRequired"); valid = false; }
  if (!form.leakPart.trim()) { validationErrors.leakPart = t("validation.leakPartRequired"); valid = false; }
  if (!form.inspector.trim()) { validationErrors.inspector = t("validation.inspectorRequired"); valid = false; }
  if (!form.tubeMaterial.trim()) { validationErrors.tubeMaterial = t("validation.tubeMaterialRequired"); valid = false; }
  if (!form.tubeBore.trim()) { validationErrors.tubeBore = t("validation.tubeBoreRequired"); valid = false; }
  if (!form.tubeBuriedDepth.trim()) { validationErrors.tubeBuriedDepth = t("validation.tubeDepthRequired"); valid = false; }
  if (!form.deviceNumber.trim()) { validationErrors.deviceNumber = t("validation.deviceNumberRequired"); valid = false; }
  return valid;
}

function handleUploadPhoto() {
  const remaining = 9 - photoList.value.length;
  if (remaining <= 0) { uni.showToast({ title: t("leakManagement.maxPhotos"), icon: "none" }); return; }
  // #ifdef H5
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.multiple = remaining > 1;
  input.onchange = async () => {
    const files = Array.from(input.files || []).slice(0, remaining);
    if (!files.length) return;
    uni.showToast({ title: t("leakManagement.photoUploading"), icon: "loading" });
    try {
      const newPhotos: PhotoItem[] = [];
      for (const file of files) {
        const localUrl = URL.createObjectURL(file);
        const res = await uploadFile(file, file.name) as { data?: { filePath?: string; id?: string }; msg?: string };
        const filePath = String(res?.data?.filePath || "");
        if (!filePath) { uni.showToast({ title: res?.msg || t("leakManagement.uploadFailed"), icon: "none" }); URL.revokeObjectURL(localUrl); continue; }
        newPhotos.push({ url: localUrl, id: filePath });
      }
      if (newPhotos.length > 0) {
        photoList.value = [...photoList.value, ...newPhotos];
        form.sceneImages = photoList.value.map((p) => p.id).join(","); photoIdListText.value = form.sceneImages;
        uni.showToast({ title: t("leakManagement.uploadSuccessCount", { count: newPhotos.length }), icon: "success" });
      }
    } catch (err) {
      const errStatus = (err as { status?: number })?.status;
      const errMsg = (err as { msg?: string })?.msg || (errStatus ? t("leakManagement.errorCode", { code: errStatus }) : t("leakManagement.uploadFailed"));
      uni.showToast({ title: errMsg, icon: "none" });
    }
  };
  document.body.appendChild(input);
  input.style.display = "none";
  input.click();
  setTimeout(() => { document.body.removeChild(input); }, 1000);
  // #endif
  // #ifndef H5
  uni.chooseImage({
    count: remaining, sizeType: ["compressed"], sourceType: ["album", "camera"],
    success: async (res) => {
      const paths: string[] = Array.isArray(res.tempFilePaths) ? res.tempFilePaths : [res.tempFilePaths];
      uni.showToast({ title: t("leakManagement.photoUploading"), icon: "loading" });
      try {
        const newPhotos: PhotoItem[] = [];
        for (const path of paths) {
          const fileName = path.split("/").pop() || "image.jpg";
          const r = await uploadFile(path, fileName) as { data?: { filePath?: string; id?: string }; msg?: string };
          const filePath = String(r?.data?.filePath || "");
          if (!filePath) { uni.showToast({ title: r?.msg || t("leakManagement.uploadFailed"), icon: "none" }); continue; }
          newPhotos.push({ url: path, id: filePath });
        }
        if (newPhotos.length > 0) {
          photoList.value = [...photoList.value, ...newPhotos];
          form.sceneImages = photoList.value.map((p) => p.id).join(","); photoIdListText.value = form.sceneImages;
          uni.showToast({ title: t("leakManagement.uploadSuccessCount", { count: newPhotos.length }), icon: "success" });
        }
      } catch (err) {
        const errMsg = (err as { msg?: string })?.msg || t("leakManagement.uploadFailed");
        uni.showToast({ title: errMsg, icon: "none" });
      }
    },
    fail: () => { uni.showToast({ title: t("leakManagement.cancelSelect"), icon: "none" }); },
  });
  // #endif
}

function removePhoto(idx: number) { photoList.value.splice(idx, 1); form.sceneImages = photoList.value.map((p) => p.id).join(","); photoIdListText.value = form.sceneImages; }
async function handleExport(scope: "current" | "all") {
  exportMenuVisible.value = false;
  let exportRecords = records.value;
  if (scope === "all") {
    try {
      const params = { ...buildQuery(), pageNum: 1, pageSize: 99999 };
      const response = (await getLeakPointPage(params)) as Res;
      ok(response);
      const p = parsePage(response);
      exportRecords = p.records;
    } catch {
      uni.showToast({ title: t("leakManagement.loadFailed"), icon: "none" });
      return;
    }
  }
  if (!exportRecords.length) { uni.showToast({ title: t("common.noDataToExport"), icon: "none" }); return; }
  // #ifdef H5
  const headers = [
    t("leakManagement.exportHeaders.detectTime"),
    t("leakManagement.exportHeaders.leakStatus"),
    t("leakManagement.exportHeaders.leakPointType"),
    t("leakManagement.exportHeaders.leakPart"),
    t("leakManagement.exportHeaders.leakPointPosition"),
    t("leakManagement.exportHeaders.inspector"),
    t("leakManagement.exportHeaders.locator"),
    t("leakManagement.exportHeaders.audioFile"),
    t("leakManagement.exportHeaders.sceneVideo"),
    t("leakManagement.exportHeaders.worksheetNumber"),
    t("leakManagement.exportHeaders.deviceNumber"),
  ];
  const keys = ["detectTime", "leakStatus", "leakPointType", "leakPart", "leakPointPosition", "inspector", "locator", "audioFile", "sceneVideo", "worksheetNumber", "deviceNumber"];
  const rows = exportRecords.map((r) =>
    keys.map((k) => {
      if (k === "detectTime") return fmtDt(gv(r, k));
      if (k === "leakStatus") return getLeakStatusDisplay(r);
      const v = gv(r, k);
      if (v === undefined || v === null) return "";
      return String(v).replace(/"/g, '""');
    })
  );
  const csv = [headers.join(","), ...rows.map((row) => row.map((c) => `"${c}"`).join(","))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${t("leakManagement.exportFileName")}_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  uni.showToast({ title: t("common.exportSuccess"), icon: "success" });
  // #endif
  // #ifndef H5
  uni.showToast({ title: t("common.exportH5Only"), icon: "none" });
  // #endif
}

function removeVideo() { videoList.value = []; form.sceneVideo = ""; }
function removeAudio() { audioList.value = []; form.audioFile = ""; }

function handleImport() {
  // #ifdef H5
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,.xlsx,.xls";
  input.onchange = async (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    uni.showToast({ title: t("leakManagement.importDeveloping"), icon: "none" });
  };
  input.click();
  // #endif
  // #ifndef H5
  uni.showToast({ title: t("leakManagement.importH5Only"), icon: "none" });
  // #endif
}

function handleUploadAudio() {
  if (!form.deviceNumber.trim()) { uni.showToast({ title: t("leakManagement.pleaseInputDeviceFirst"), icon: "none" }); validationErrors.deviceNumber = t("validation.deviceNumberRequired"); return; }
  // #ifdef H5
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "audio/*";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    uni.showToast({ title: t("leakManagement.audioUploading"), icon: "loading" });
    try {
      const res = await uploadFile(file, file.name) as { data?: { filePath?: string; id?: string }; msg?: string };
      const aid = String(res?.data?.filePath || "");
      if (!aid) { uni.showToast({ title: res?.msg || t("leakManagement.uploadFailed"), icon: "none" }); return; }
      form.audioFile = aid;
      audioList.value = [{ url: getPreviewUrl(aid), id: aid, name: `${t("leakManagement.audioFilePrefix")}_${aid}` }];
      uni.showToast({ title: t("leakManagement.uploadSuccess"), icon: "success" });
    } catch {
      uni.showToast({ title: t("leakManagement.uploadFailed"), icon: "none" });
    }
  };
  document.body.appendChild(input);
  input.style.display = "none";
  input.click();
  setTimeout(() => { document.body.removeChild(input); }, 1000);
  // #endif
  // #ifndef H5
  uni.chooseMessageFile({
    count: 1,
    type: "file",
    success: async (res) => {
      const file = res.tempFiles?.[0];
      if (!file) return;
      uni.showToast({ title: t("leakManagement.audioUploading"), icon: "loading" });
      try {
        const r = await uploadFile(file.path, file.name || "audio") as { data?: { filePath?: string; id?: string }; msg?: string };
        const aid = String(r?.data?.filePath || "");
        if (!aid) { uni.showToast({ title: r?.msg || t("leakManagement.uploadFailed"), icon: "none" }); return; }
        form.audioFile = aid;
        audioList.value = [{ url: getPreviewUrl(aid), id: aid, name: `${t("leakManagement.audioFilePrefix")}_${aid}` }];
        uni.showToast({ title: t("leakManagement.uploadSuccess"), icon: "success" });
      } catch {
        uni.showToast({ title: t("leakManagement.uploadFailed"), icon: "none" });
      }
    },
  });
  // #endif
}

function handleUploadVideo() {
  // #ifdef H5
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "video/*";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > MAX_VIDEO_SIZE) { uni.showToast({ title: t("leakManagement.videoTooLarge", { size: formatFileSize(file.size), max: formatFileSize(MAX_VIDEO_SIZE) }), icon: "none" }); return; }
    uni.showToast({ title: t("leakManagement.videoUploading", { size: formatFileSize(file.size) }), icon: "loading" });
    try {
      const localUrl = URL.createObjectURL(file);
      const res = await uploadFile(file, file.name) as { data?: { filePath?: string; id?: string }; msg?: string };
      const vid = String(res?.data?.filePath || "");
      if (!vid) { uni.showToast({ title: res?.msg || t("leakManagement.uploadFailed"), icon: "none" }); URL.revokeObjectURL(localUrl); return; }
      form.sceneVideo = vid;
      videoList.value = [{ url: localUrl, id: vid, name: `${t("leakManagement.videoFilePrefix")}_${vid}` }];
      uni.showToast({ title: t("leakManagement.uploadSuccess"), icon: "success" });
    } catch (err) {
      const errStatus = (err as { status?: number })?.status;
      const errMsg = (err as { msg?: string })?.msg || (errStatus ? t("leakManagement.errorCode", { code: errStatus }) : t("leakManagement.uploadFailed"));
      uni.showToast({ title: errMsg, icon: "none" });
    }
  };
  document.body.appendChild(input);
  input.style.display = "none";
  input.click();
  setTimeout(() => { document.body.removeChild(input); }, 1000);
  // #endif
  // #ifndef H5
  uni.chooseVideo({
    success: async (res) => {
      uni.showToast({ title: t("leakManagement.videoUploadingShort"), icon: "loading" });
      try {
        const fileName = (res.name || "video.mp4") as string;
        const r = await uploadFile(res.tempFilePath, fileName) as { data?: { filePath?: string; id?: string }; msg?: string };
        const vid = String(r?.data?.filePath || "");
        if (!vid) { uni.showToast({ title: r?.msg || t("leakManagement.uploadFailed"), icon: "none" }); return; }
        form.sceneVideo = vid;
        videoList.value = [{ url: getPreviewUrl(vid), id: vid, name: `${t("leakManagement.videoFilePrefix")}_${vid}` }];
        uni.showToast({ title: t("leakManagement.uploadSuccess"), icon: "success" });
      } catch (err) {
        const errMsg = (err as { msg?: string })?.msg || t("leakManagement.uploadFailed");
        uni.showToast({ title: errMsg, icon: "none" });
      }
    },
  });
  // #endif
}

const mapPickerVisible = ref(false);
const mapPickedCoord = ref("");
// const mapPickerContainer = ref<HTMLElement | null>(null);
// let mapPickerInstance: { destroy?: () => void; on?: (event: string, handler: (e: { latLng: { getLat?: () => number; getLng?: () => number } }) => void) => void } | null = null;

// const TENCENT_MAP_KEY = MAP_CONFIG.tencentKey;
// const TENCENT_MAP_SCRIPT_ID = "tencent-map-sdk-picker";
// const TENCENT_MAP_SCRIPT_URL = `https://map.qq.com/api/gljs?v=1.exp&key=${TENCENT_MAP_KEY}`;

// function loadTencentMapSDK(): Promise<void> {
//   if (window.TMap) return Promise.resolve();
//   return new Promise((resolve, reject) => {
//     const existing = document.getElementById(TENCENT_MAP_SCRIPT_ID) as HTMLScriptElement | null;
//     const script = existing || document.createElement("script");
//     script.id = TENCENT_MAP_SCRIPT_ID;
//     script.charset = "utf-8";
//     script.src = TENCENT_MAP_SCRIPT_URL;
//     script.onload = () => { if (window.TMap) resolve(); else reject(new Error("SDK load failed")); };
//     script.onerror = () => reject(new Error("SDK script failed"));
//     if (!existing) document.body.appendChild(script);
//   });
// }

// function initMapPicker(lng: number, lat: number) {
//   if (!mapPickerContainer.value || !window.TMap) return;
//   const center = new window.TMap.LatLng(lat, lng);
//   const map = new window.TMap.Map(mapPickerContainer.value, { center, zoom: 15, pitch: 0, rotation: 0 });
//   mapPickerInstance = map;
//   map.on?.("click", (e: { latLng: { getLat?: () => number; getLng?: () => number } }) => {
//     const clng = e.latLng.getLng?.().toFixed(6);
//     const clat = e.latLng.getLat?.().toFixed(6);
//     if (!clng || !clat) return;
//     mapPickedCoord.value = `${clng},${clat}`;
//   });
// }

const mapPickerCenter = ref({
  lng: 121.4737,
  lat: 31.2304,
});

function openMapPicker() {
  mapPickedCoord.value = "";
  uni.getLocation({
    type: "gcj02",
    success: (result) => {
      mapPickerCenter.value = {
        lng: result.longitude,
        lat: result.latitude,
      };

      mapPickerVisible.value = true;
    },

    fail: () => {
      mapPickerCenter.value = {
        lng: 121.4737,
        lat: 31.2304,
      };

      mapPickerVisible.value = true;
    },
  });
}

function handleMapPick(coordinate: {
  lng: number;
  lat: number;
}) {
  mapPickedCoord.value =
    `${coordinate.lng.toFixed(6)},${coordinate.lat.toFixed(6)}`;
}

function confirmMapPick() {
  if (mapPickedCoord.value) form.coordinatePosition = mapPickedCoord.value;
  closeMapPicker();
}

function closeMapPicker() {
  mapPickerVisible.value = false;
  mapPickedCoord.value = "";
  
}

function buildPayload() {
  return rmEmpty({
    detectType: form.detectType.trim(),
    detectTime: normDt(form.detectTime),
    detectDifficulty: form.detectDifficulty.trim(),
    leakPointType: form.leakPointType.trim(),
    leakPointPosition: form.leakPointPosition.trim(),
    coordinatePosition: form.coordinatePosition.trim(),
    leakVolume: form.leakVolume.trim(),
    tubeBore: form.tubeBore.trim(),
    tubeMaterial: form.tubeMaterial.trim(),
    tubeAge: form.tubeAge.trim(),
    leakPart: form.leakPart.trim(),
    tubeBuriedDepth: form.tubeBuriedDepth.trim(),
    leakReason: form.leakReason.trim(),
    leakDistance: form.leakDistance.trim(),
    noiseSample: form.noiseSample.trim(),
    inspector: form.inspector.trim(),
    locator: form.locator.trim(),
    cost: form.cost.trim() || undefined,
    leakArea: form.leakArea.trim(),
    repairTime: normDt(form.repairTime) || undefined,
    sceneImages: form.sceneImages.trim() || undefined,
    sceneVideo: form.sceneVideo.trim(),
    manualReviewCount: form.manualReviewCount.trim() ? Number(form.manualReviewCount) : undefined,
    deviceNumber: form.deviceNumber.trim(),
    noiseTime: normDt(form.noiseTime) || undefined,
    leakStatus: form.leakStatus,
    featureValue: form.featureValue.trim(),
    audioFile: form.audioFile.trim(),
    repairMethod: form.repairMethod.trim(),
    description: form.description.trim(),
  });
}

async function submitForm() {
  if (!validateForm()) { const fe = validationErrors.detectTime || validationErrors.leakPointType || validationErrors.leakPointPosition || validationErrors.leakPart || validationErrors.inspector || validationErrors.tubeMaterial || validationErrors.tubeBore || validationErrors.tubeBuriedDepth || validationErrors.deviceNumber; if (fe) uni.showToast({ title: fe, icon: "none" }); return; }
  submitting.value = true;
  try {
    const payload = buildPayload(); let res: Res;
    if (isEditing.value) { res = (await updateLeakPoint(getRowId(selectedRecord.value!), payload)) as Res; }
    else { res = (await createLeakPoint(payload)) as Res; }
    ok(res); uni.showToast({ title: isEditing.value ? t("leakManagement.editSuccess") : t("leakManagement.addSuccess"), icon: "success" }); closeDialog(); fetchLeakPoints();
  } catch (e: unknown) { uni.showToast({ title: (e as { msg?: string }).msg || t("leakManagement.submitFailed"), icon: "none" }); }
  finally { submitting.value = false; }
}

async function handleDelete() {
  if (!selectedRecord.value) { uni.showToast({ title: t("leakManagement.selectLeakPointFirst"), icon: "none" }); return; }
  const id = getRowId(selectedRecord.value); if (!id) return;
  try { ok((await deleteLeakPoint(id)) as Res); uni.showToast({ title: t("common.deleteSuccess"), icon: "success" }); selectedRecord.value = null; fetchLeakPoints(); }
  catch (e: unknown) { uni.showToast({ title: (e as { msg?: string }).msg || t("common.deleteFailed"), icon: "none" }); }
}

async function handleBatchDelete() {
  if (!selectedIds.value.size) return;
  const ids = Array.from(selectedIds.value).map((k) => { const i = records.value.findIndex((r, idx) => getRowKey(r, idx) === k); return i >= 0 ? getRowId(records.value[i]) : ""; }).filter(Boolean);
  if (!ids.length) return;
  try { await Promise.all(ids.map((id) => deleteLeakPoint(id))); uni.showToast({ title: t("leakManagement.batchDeleteSuccess", { count: ids.length }), icon: "success" }); selectedIds.value = new Set(); fetchLeakPoints(); }
  catch (e: unknown) { uni.showToast({ title: (e as { msg?: string }).msg || t("leakManagement.batchDeleteFailed"), icon: "none" }); }
}

function handleWorkOrderJump(item: RecordItem) {
  const wid = getFieldValue(item, "workOrderId");
  if (!wid) { uni.showToast({ title: t("leakManagement.noWorkOrder"), icon: "none" }); return; }
  uni.navigateTo({ url: `/pages/work-order/processing/processing?id=${wid}` });
}

function getWorkOrderDisplay(item: RecordItem): string {
  const no = getFieldValue(item, "worksheetNumber");
  if (no) return String(no);
  const wid = getFieldValue(item, "workOrderId");
  if (wid) return t("leakManagement.workOrderMissing");
  return "-";
}

function getFieldValue(item: RecordItem | null, key: string): string { if (!item) return ""; const v = gv(item, key); if (v === undefined || v === null) return ""; return String(v); }
function formatDateTime(v: unknown): string { return fmtDt(v); }

// 格式化经纬度字符串，保留 4 位小数（支持 "经度,纬度" 或 "经度 纬度" 格式）
function formatCoordinate(value: unknown): string {
  if (value == null || value === "") return "-";
  const s = String(value).trim();
  const parts = s.split(/[,，\s]+/).filter(Boolean);
  if (parts.length >= 2) {
    const lng = parseFloat(parts[0]);
    const lat = parseFloat(parts[1]);
    if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
      return `${lng.toFixed(4)},${lat.toFixed(4)}`;
    }
  }
  return s;
}

const playingAudioIndex = ref(-1);
let audioPlayerInstance: HTMLAudioElement | null = null;

const audioDialogVisible = ref(false);
const currentAudioUrl = ref("");
const currentAudioTitle = ref("");
const audioDuration = ref(0);
const audioCurrentTime = ref(0);
const audioPlaying = ref(false);
const audioLoading = ref(false);
let audioDialogElement: HTMLAudioElement | null = null;

const audioProgress = computed(() => {
  if (!audioDuration.value) return 0;
  return Math.min(100, (audioCurrentTime.value / audioDuration.value) * 100);
});

function onAudioLoadedMeta() {
  if (!audioDialogElement) return;
  audioDuration.value = audioDialogElement.duration || 0;
  audioLoading.value = false;
}

function onAudioTimeUpdate() {
  if (!audioDialogElement) return;
  audioCurrentTime.value = audioDialogElement.currentTime || 0;
}

function onAudioEnded() {
  audioPlaying.value = false;
  audioCurrentTime.value = 0;
}

function toggleAudioPlayState() {
  if (!audioDialogElement) return;
  if (audioDialogElement.paused) { audioDialogElement.play(); }
  else { audioDialogElement.pause(); }
}

function seekAudio(e: Event) {
  if (!audioDialogElement || !audioDuration.value) return;
  const target = e.target as HTMLInputElement;
  const time = (Number(target.value) / 100) * audioDuration.value;
  audioDialogElement.currentTime = time;
  audioCurrentTime.value = time;
}

function openAudioDialog(url: string, title: string) {
  if (audioDialogElement) { audioDialogElement.pause(); audioDialogElement = null; }
  currentAudioUrl.value = url;
  currentAudioTitle.value = title;
  audioDuration.value = 0;
  audioCurrentTime.value = 0;
  audioPlaying.value = false;
  audioLoading.value = true;
  audioDialogVisible.value = true;
  audioDialogElement = new Audio(url);
  audioDialogElement.addEventListener("loadedmetadata", onAudioLoadedMeta);
  audioDialogElement.addEventListener("timeupdate", onAudioTimeUpdate);
  audioDialogElement.addEventListener("ended", onAudioEnded);
  audioDialogElement.addEventListener("waiting", () => { audioLoading.value = true; });
  audioDialogElement.addEventListener("playing", () => { audioLoading.value = false; audioPlaying.value = true; });
  audioDialogElement.addEventListener("play", () => { audioPlaying.value = true; });
  audioDialogElement.addEventListener("pause", () => { audioPlaying.value = false; });
  audioDialogElement.addEventListener("canplay", () => { audioLoading.value = false; });
  audioDialogElement.play().catch(() => { audioLoading.value = false; });
}

function closeAudioDialog() {
  if (audioDialogElement) {
    audioDialogElement.pause();
    audioDialogElement.src = "";
    audioDialogElement = null;
  }
  audioDialogVisible.value = false;
  currentAudioUrl.value = "";
  audioDuration.value = 0;
  audioCurrentTime.value = 0;
  audioPlaying.value = false;
  audioLoading.value = false;
  playingAudioIndex.value = -1;
}

function toggleAudioPlay(item: RecordItem, index: number) {
  const aid = getFieldValue(item, "audioFile");
  if (!aid) return;
  // #ifdef H5
  audioPlayerInstance?.pause();
  const url = getPreviewUrl(String(aid));
  const title = `${t("leakManagement.leakAudio")} - ${getFieldValue(item, "leakPointPosition") || getFieldValue(item, "deviceNumber") || ""}`;
  playingAudioIndex.value = index;
  openAudioDialog(url, title);
  // #endif
  // #ifndef H5
  uni.showToast({ title: t("leakManagement.audioH5Only"), icon: "none" });
  // #endif
}

const videoDialogVisible = ref(false);
const currentVideoUrl = ref("");
const videoDuration = ref(0);
const videoCurrentTime = ref(0);
const videoLoading = ref(false);

function formatVideoTime(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    return `${String(h).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const videoProgress = computed(() => {
  if (!videoDuration.value) return 0;
  return Math.min(100, (videoCurrentTime.value / videoDuration.value) * 100);
});

function onVideoLoadedMeta(e: Event) {
  const v = e.target as HTMLVideoElement;
  videoDuration.value = v.duration || 0;
  videoLoading.value = false;
}

function onVideoTimeUpdate(e: Event) {
  const v = e.target as HTMLVideoElement;
  videoCurrentTime.value = v.currentTime || 0;
}

function onVideoWaiting() { videoLoading.value = true; }
function onVideoPlaying() { videoLoading.value = false; }

function toggleVideoPlay(item: RecordItem) {
  const vid = getFieldValue(item, "sceneVideo");
  if (!vid) return;
  videoDuration.value = 0;
  videoCurrentTime.value = 0;
  videoLoading.value = true;
  currentVideoUrl.value = getPreviewUrl(String(vid));
  videoDialogVisible.value = true;
}

function closeVideoDialog() {
  videoDialogVisible.value = false;
  currentVideoUrl.value = "";
  videoDuration.value = 0;
  videoCurrentTime.value = 0;
  videoLoading.value = false;
}

// 将 leakStatus code 翻译为当前语言的展示文本
function translateLeakStatusCode(code: string): string {
  if (isRepairedStatus(code)) return t("status.repaired");
  if (isUnrepairedStatus(code)) return t("status.unrepaired");
  return code || "-";
}

// 获取 leakStatus 的展示文本（normalize + translate）
function getLeakStatusDisplay(item: RecordItem | null): string {
  const raw = getFieldValue(item, "leakStatus");
  if (raw === null || raw === undefined || raw === "") return "-";
  const code = normalizeLeakStatusCode(raw, "leakage");
  return translateLeakStatusCode(code);
}

function getLeakStatusClass(item: RecordItem | null): string {
  const s = getFieldValue(item, "leakStatus");
  if (isUnrepairedStatus(s)) return "level-pill--heavy";
  if (isRepairedStatus(s)) return "level-pill--light";
  return "";
}

function getLeakStatusBadgeClass(item: RecordItem | null): string {
  const s = getFieldValue(item, "leakStatus");
  if (isUnrepairedStatus(s)) return "detail-summary__badge--heavy";
  if (isRepairedStatus(s)) return "detail-summary__badge--light";
  return "";
}

function fmtDt(v: unknown): string { if (!v || v === "-") return String(v || "-"); return String(v).replace("T", " ").replace(/\.\d+/, "").replace(/(?:Z|[+-]\d{2}:?\d{2})$/, ""); }
function toLocal(v: unknown): string { if (!v) return ""; const d = typeof v === "string" ? new Date(String(v).replace(" ", "T")) : new Date(v as number); if (isNaN(d.getTime())) return ""; return `${d.getFullYear()}-${p2(d.getMonth()+1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`; }
function normDate(v: string, isEnd: boolean): string | undefined { if (!v) return undefined; const n = v.trim().replace(/\s+/, "T"); if (n.includes("T")) return n.length === 16 ? `${n}:00` : n; return `${n}T${isEnd ? "23:59:59" : "00:00:00"}`; }
function normDt(v: string): string | undefined { if (!v) return undefined; const n = v.trim().replace(/\s+/, "T"); return n.includes("T") ? (n.length === 16 ? `${n}:00` : n) : n; }
function p2(n: number): string { return String(n).padStart(2, "0"); }

function parsePage(res: Res) {
  const d = res?.data ?? res; const pg = findPg(d) || findPg(res) || (isObj(d) ? d : {});
  const pgRecs = arr(pg, ["records","rows","list","items"]);
  const recs = pgRecs.length > 0 ? pgRecs : arr(res, ["records","rows","list","items"]);
  const totalNum = num(pg, ["total","count","totalCount","totalRow","totalRows","totalElements"]) ?? num(res, ["total","count","totalCount","totalRow","totalRows","totalElements"]);
  const c = num(pg, ["current","pageNum","page","pageNo"]); const s = num(pg, ["size","pageSize","limit"]);
  const pageNum = c || pagination.pageNum;
  const pageSize = s || pagination.pageSize;
  const mt = (pageNum - 1) * pageSize + recs.length;
  return { records: recs.map((r: unknown) => (isObj(r) ? r : { value: r })), total: totalNum === undefined ? recs.length : Math.max(totalNum, mt), pageNum, pageSize };
}
function findPg(v: unknown): RecordItem | null {
  if (!isObj(v)) return null;
  if (arr(v, ["records","rows","list","items"]).length > 0 || num(v, ["total","count","totalCount"]) !== undefined) return v as RecordItem;
  for (const k of ["data","result","page","pageData"]) { const m = findPg((v as RecordItem)[k]); if (m) return m; }
  return null;
}
function arr(v: unknown, ks: string[]): unknown[] { if (!isObj(v)) return []; for (const k of ks) { const a = (v as RecordItem)[k]; if (Array.isArray(a)) return a; } return []; }
function num(v: unknown, ks: string[]): number | undefined { if (!isObj(v)) return undefined; for (const k of ks) { const a = (v as RecordItem)[k]; if (typeof a === "number") return a; if (typeof a === "string" && a.trim() && !isNaN(Number(a))) return Number(a); } return undefined; }
function isObj(v: unknown): v is RecordItem { return Boolean(v && typeof v === "object" && !Array.isArray(v)); }
function rmEmpty(obj: RecordItem): RecordItem { return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== "" && v !== undefined && v !== null)); }
function applyLocalFilters(list: RecordItem[]): RecordItem[] {
  const inspectorKey = filters.inspector.trim().toLowerCase();
  const locatorKey = filters.locator.trim().toLowerCase();
  const statusKey = filters.leakStatus.trim();
  if (!inspectorKey && !locatorKey && !statusKey) return list;
  return list.filter((item) => {
    if (inspectorKey && !String(getFieldValue(item, "inspector") || "").toLowerCase().includes(inspectorKey)) return false;
    if (locatorKey && !String(getFieldValue(item, "locator") || "").toLowerCase().includes(locatorKey)) return false;
    if (statusKey && !matchLeakStatus(getFieldValue(item, "leakStatus"), statusKey)) return false;
    return true;
  });
}

/**
 * 状态匹配：兼容 "已修复" 中文 code 和 "repaired" 英文 code
 * 用于本地过滤，避免国际化后状态匹配失败
 */
function matchLeakStatus(actual: string, expected: string): boolean {
  if (actual === expected) return true;
  if (expected === LEAK_STATUS.REPAIRED && isRepairedStatus(actual)) return true;
  if (expected === LEAK_STATUS.UNREPAIRED && isUnrepairedStatus(actual)) return true;
  return false;
}

function applyLocalSort(list: RecordItem[]): RecordItem[] {
  if (!sortField.value || !sortOrder.value) return list;
  const field = sortField.value;
  const order = sortOrder.value;
  return [...list].sort((a, b) => {
    let va = gv(a, field);
    let vb = gv(b, field);
    if (field === "detectTime" || field === "createdAt") {
      va = String(va ?? "");
      vb = String(vb ?? "");
    }
    if (va === undefined || va === null) return 1;
    if (vb === undefined || vb === null) return -1;
    if (va < vb) return order === "asc" ? -1 : 1;
    if (va > vb) return order === "asc" ? 1 : -1;
    return 0;
  });
}

function ok(res: Res | undefined) { const c = res?.code; if (c === undefined || c === 0 || c === 200) return; throw { code: c, msg: res?.msg || t("common.requestFailed") }; }
</script>

<style scoped lang="scss">
.leak-management-view { display: flex; flex-direction: column; box-sizing: border-box; height: 100%; min-height: 0; padding: 0 14px 14px; overflow: hidden; background: #eef4f8; }

.toolbar, .table-panel, .detail-panel { background: #fff; border: 1px solid #d8e5ef; border-radius: 6px; box-shadow: 0 12px 26px rgba(35,72,104,0.09); }
.toolbar { flex: none; display: flex; flex-direction: column; gap: 12px; padding: 14px; margin-bottom: 12px; background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%); border-radius: 6px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06); }
.toolbar-row { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; }
.toolbar-row--filters { display: flex; flex-wrap: wrap; align-items: end; gap: 10px 12px; }
.filter-group { display: grid; align-content: start; gap: 6px; }
.filter-label { color: #52677b; font-size: 12px; font-weight: 800; line-height: 1.2; white-space: nowrap; }
.filter-input { box-sizing: border-box; width: 140px; height: 28px; padding: 0 10px; color: #172033; font-size: 13px; font-weight: 600; background: #f9fcff; border: 1px solid #cbdced; border-radius: 4px; line-height: 28px; }
.filter-input:focus, .filter-select:hover { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.input-placeholder { color: #9aa9b8; font-size: 13px; }
.filter-select { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; min-width: 100px; height: 28px; padding: 0 10px; color: #172033; font-size: 13px; font-weight: 600; background: #f9fcff; border: 1px solid #cbdced; border-radius: 4px; cursor: pointer; line-height: 28px; }
.filter-select__arrow { width: 8px; height: 8px; margin-left: 8px; border: solid #74879c; border-width: 0 2px 2px 0; transform: translateY(-2px) rotate(45deg); }
.date-range { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }
.filter-datetime { width: 200px; }
.filter-datetime :deep(.datetime-picker__control) { height: 28px; padding: 0 10px; font-size: 13px; font-weight: 600; line-height: 28px; }
.filter-datetime :deep(.datetime-picker__value) { font-size: 13px; font-weight: 600; }
.filter-datetime :deep(.datetime-picker__icon) { width: 15px; height: 15px; }
.filter-separator { flex: none; color: #8191a2; font-size: 13px; }
.toolbar-actions { display: flex; align-items: center; gap: 7px; &--right { margin-left: auto; } }
.toolbar-button { display: flex; align-items: center; justify-content: center; box-sizing: border-box; min-width: 64px; height: 38px; margin: 0; padding: 0 15px; color: #31506d; font-size: 13px; font-weight: 700; line-height: 1.2; background: #f6fbff; border: 1px solid #cbdced; border-radius: 5px; cursor: pointer; &--primary { color: #fff; background: #3b82f6; border-color: #3b82f6; } &--danger { color: #dc2626; background: #fef2f2; border-color: #fecaca; } &--hover { color: #3b82f6; background: #eff6ff; border-color: #bfdbfe; } &--primary.toolbar-button--hover { color: #fff; background: #2563eb; border-color: #2563eb; } &:disabled { color: #9aa9b8; background: #eff6ff; border-color: #d7e0e8; cursor: not-allowed; } }
.toolbar-icon-button { display: flex; align-items: center; justify-content: center; width: 38px; height: 38px; margin: 0; padding: 0; color: #31506d; background: #f6fbff; border: 1px solid #cbdced; border-radius: 5px; cursor: pointer; &--hover { color: #3b82f6; background: #eff6ff; border-color: #bfdbfe; } }
.icon-refresh { display: block; width: 16px; height: 16px; border: 2px solid #7f8fa3; border-top-color: transparent; border-radius: 50%; }
.export-dropdown { position: relative; }
.export-menu { position: absolute; top: 100%; right: 0; z-index: 20; margin-top: 4px; background: #ffffff; border: 1px solid #d5e2ee; border-radius: 6px; box-shadow: 0 8px 20px rgba(15, 35, 55, 0.12); overflow: hidden; }
.export-menu__item { padding: 10px 18px; color: #24384d; font-size: 13px; white-space: nowrap; cursor: pointer; }
.export-menu__item:hover { background: #eff6ff; color: #3b82f6; }

.main-layout { display: grid; grid-template-columns: minmax(0, 1fr) clamp(380px, 20vw, 420px); flex: 1; min-height: 0; gap: 12px; overflow: hidden; }
.table-panel { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.table-head, .pagination-bar { display: flex; align-items: center; justify-content: space-between; padding: 0 16px; }
.table-head { flex: none; height: 50px; color: #24445f; font-size: 16px; font-weight: 800; background: #ffffff; border-bottom: 1px solid #edf3f8; }
.table-head__meta { padding: 4px 10px; color: #6a7f94; font-size: 13px; font-weight: 800; background: #f7fafc; border: 1px solid #e3ebf2; border-radius: 999px; }
.table-scroll { flex: 1; min-height: 0; overflow: auto; background: #ffffff; }
.table-scroll::-webkit-scrollbar, .detail-section::-webkit-scrollbar { width: 9px; height: 9px; }
.table-scroll::-webkit-scrollbar-track, .detail-section::-webkit-scrollbar-track { background: #edf3f8; border-radius: 999px; }
.table-scroll::-webkit-scrollbar-thumb, .detail-section::-webkit-scrollbar-thumb { background: linear-gradient(90deg, #9fb4c8, #6f8ba8); border: 2px solid #edf3f8; border-radius: 999px; }
.table-scroll::-webkit-scrollbar-thumb:hover, .detail-section::-webkit-scrollbar-thumb:hover { background: linear-gradient(90deg, #7f9ab4, #4d6f91); }
.data-table { display: flex; flex-direction: column; width: 100%; min-width: 1200px; background: #ffffff; }
.data-row { display: grid; grid-template-columns: 40px 52px minmax(140px, 1.4fr) minmax(86px, 0.85fr) minmax(96px, 0.95fr) minmax(100px, 1fr) minmax(140px, 1.6fr) minmax(86px, 0.85fr) minmax(86px, 0.85fr) 72px 72px minmax(110px, 0.85fr) minmax(100px, 0.85fr); min-height: 42px; width: 100%; min-width: 1200px; border-bottom: 1px solid #edf1f5; cursor: pointer; transition: background 0.18s ease, box-shadow 0.18s ease; &--header { position: sticky; top: 0; z-index: 1; min-height: 44px; color: #20384f; font-weight: 800; background: #f6f9fc; cursor: default; box-shadow: 0 1px 0 #dbe7f0; } &--active { position: relative; background: #e7f3ff !important; box-shadow: inset 0 0 0 1px #b9dcff; } }
.data-row:not(.data-row--header):nth-child(odd) { background: #fff; }
.data-row:not(.data-row--header):nth-child(even) { background: #fbfdff; }
.data-row:not(.data-row--header):hover { background: #f1f8ff; box-shadow: inset 0 0 0 1px #d7ebfb; }
.data-row--active::before { position: absolute; top: 7px; bottom: 7px; left: 0; width: 3px; content: ""; background: #0d82ee; border-radius: 0 999px 999px 0; }
.data-cell { display: flex; align-items: center; justify-content: center; min-width: 0; padding: 0 12px; overflow: hidden; color: #24384d; font-size: 13px; line-height: 1.35; text-align: center; white-space: nowrap; text-overflow: ellipsis; border-right: 1px solid #edf1f5; }
.data-row--header .data-cell { color: #415a73; font-size: 12px; letter-spacing: 0; }
.data-cell:last-child { border-right: 0; }
.data-cell--sortable { cursor: pointer; user-select: none; }
.data-cell--sortable:hover { color: #3b82f6; }
.data-cell--checkbox { justify-content: center; }
.data-cell--index { justify-content: center; color: #64748b; }
.data-cell--time { color: #0f4c81; }
.data-cell--address { justify-content: center; text-align: center; }
.data-cell--leakpart { justify-content: center; text-align: center; color: #475569; }
.data-cell--type { justify-content: center; text-align: center; color: #475569; }
.data-cell--locator { justify-content: center; text-align: center; color: #475569; }

.data-cell--audio { justify-content: center; }
.play-icon { display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.icon-play { width: 0; height: 0; border-style: solid; border-width: 6px 0 6px 10px; border-color: transparent transparent transparent #3b82f6; }
.video-icon { border-color: transparent transparent transparent #16a34a; }
.icon-pause { width: 10px; height: 12px; position: relative; &::before, &::after { content: ""; position: absolute; top: 0; width: 3px; height: 100%; background: #3b82f6; border-radius: 1px; } &::before { left: 0; } &::after { right: 0; } }
.data-cell--video { justify-content: center; }
.video-dialog-mask { position: fixed; inset: 0; z-index: 2200; display: flex; align-items: center; justify-content: center; background: rgba(15, 35, 55, 0.55); }
.video-dialog { width: min(900px, 92vw); background: #fff; border-radius: 10px; box-shadow: 0 12px 36px rgba(15, 35, 55, 0.25); overflow: hidden; }
.video-dialog__head { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid #edf1f5; }
.video-dialog__title { color: #0f172a; font-size: 15px; font-weight: 700; }
.video-dialog__body { position: relative; padding: 16px; background: #000; }
.video-player { display: block; width: 100%; max-height: 60vh; background: #000; }
.video-empty { padding: 40px; color: #94a3b8; font-size: 14px; text-align: center; background: #fff; }
.video-loading { position: absolute; top: 16px; left: 50%; transform: translateX(-50%); padding: 6px 16px; color: #fff; font-size: 12px; background: rgba(0, 0, 0, 0.6); border-radius: 4px; }
.video-dialog__info { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px; padding: 12px 18px; border-top: 1px solid #edf1f5; background: #f8fafc; }
.video-info-row { display: flex; align-items: center; gap: 6px; }
.video-info-label { color: #64748b; font-size: 12px; font-weight: 700; }
.video-info-value { color: #0f172a; font-size: 13px; font-weight: 700; font-family: monospace; }
.video-progress-bar { flex: 1; min-width: 120px; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
.video-progress-filled { height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); border-radius: 3px; transition: width 0.2s ease; }

.audio-dialog-mask { position: fixed; inset: 0; z-index: 2200; display: flex; align-items: center; justify-content: center; background: rgba(15, 35, 55, 0.55); }
.audio-dialog { width: min(520px, 92vw); background: #fff; border-radius: 10px; box-shadow: 0 12px 36px rgba(15, 35, 55, 0.25); overflow: hidden; }
.audio-dialog__head { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px; border-bottom: 1px solid #edf1f5; }
.audio-dialog__title { color: #0f172a; font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 400px; }
.audio-dialog__body { padding: 24px; background: linear-gradient(135deg, #f0f7ff 0%, #faf5ff 100%); }
.audio-empty { padding: 40px; color: #94a3b8; font-size: 14px; text-align: center; }
.audio-player { display: flex; align-items: center; gap: 20px; }
.audio-player__icon { flex-shrink: 0; }
.audio-cover { position: relative; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; }
.audio-cover__ring { position: absolute; inset: 0; border: 3px solid #bfdbfe; border-top-color: #3b82f6; border-radius: 50%; animation: audio-spin 2s linear infinite; }
.audio-cover__dot { width: 12px; height: 12px; background: #3b82f6; border-radius: 50%; box-shadow: 0 0 12px rgba(59, 130, 246, 0.4); }
@keyframes audio-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.audio-player__info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10px; }
.audio-player__title { color: #0f172a; font-size: 14px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.audio-player__loading { color: #f59e0b; font-size: 12px; font-weight: 600; }
.audio-player__progress { display: flex; align-items: center; gap: 8px; }
.audio-time { color: #64748b; font-size: 12px; font-weight: 700; font-family: monospace; min-width: 40px; text-align: center; flex-shrink: 0; }
.audio-seek-bar { position: relative; flex: 1; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; }
.audio-seek-filled { position: absolute; top: 0; left: 0; height: 100%; background: linear-gradient(90deg, #3b82f6, #2563eb); border-radius: 3px; pointer-events: none; }
.audio-seek-input { position: absolute; inset: 0; width: 100%; height: 100%; margin: 0; opacity: 0; cursor: pointer; }
.audio-play-btn { display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; padding: 0; margin: 0; background: #3b82f6; border: 0; border-radius: 50%; cursor: pointer; flex-shrink: 0; &--hover { background: #2563eb; } }
.play-icon-large { display: inline-flex; align-items: center; justify-content: center; }
.icon-play-large { width: 0; height: 0; border-style: solid; border-width: 8px 0 8px 14px; border-color: transparent transparent transparent #fff; margin-left: 3px; }
.icon-pause-large { width: 14px; height: 16px; position: relative; &::before, &::after { content: ""; position: absolute; top: 0; width: 4px; height: 100%; background: #fff; border-radius: 1px; } &::before { left: 0; } &::after { right: 0; } }
/* 排序箭头 */
.sort-arrow { flex: none; font-size: 10px; line-height: 1; margin-left: 2px; color: #bcc7d6; transition: color 0.18s ease; &--active { color: #3b82f6; } &--idle { opacity: 0.4; } }
.data-cell--sortable:hover .sort-arrow:not(.sort-arrow--active) { color: #7f8fa3; }
.checkbox { display: flex; align-items: center; justify-content: center; width: 18px; height: 18px; border: 2px solid #cdd7e4; border-radius: 4px; cursor: pointer; &--checked { background: #3b82f6; border-color: #3b82f6; } }
.checkbox__mark { display: block; width: 6px; height: 10px; border-right: 2px solid #fff; border-bottom: 2px solid #fff; transform: rotate(45deg) translate(-1px, -1px); }
.level-pill { display: inline-block; padding: 2px 10px; font-size: 12px; font-weight: 700; border-radius: 10px; &--light { color: #22c55e; background: #f0fdf4; border: 1px solid #bbf7d0; } &--medium { color: #f59e0b; background: #fffbeb; border: 1px solid #fde68a; } &--heavy { color: #ef4444; background: #fef2f2; border: 1px solid #fecaca; } &--suspect { color: #8c8c8c; background: #fafafa; border: 1px solid #d9d9d9; } }
.table-state { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 32px; color: #a0aec0; font-size: 14px; text-align: center; }
.state-spinner { width: 28px; height: 28px; border: 3px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: state-spin 0.7s linear infinite; }
@keyframes state-spin { to { transform: rotate(360deg); } }
.state-icon-empty { width: 40px; height: 40px; border: 2px dashed #cbd5e1; border-radius: 50%; position: relative; }
.state-icon-empty::after { content: ""; position: absolute; top: 50%; left: 50%; width: 14px; height: 2px; background: #cbd5e1; transform: translate(-50%, -50%); }
.pagination-bar { flex: none; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; border-top: 1px solid #edf3f8; }
.page-button { display: flex; align-items: center; justify-content: center; min-width: 64px; height: 34px; margin: 0; padding: 0 14px; color: #183755; font-size: 13px; font-weight: 700; background: #fff; border: 1px solid #d5e2ee; border-radius: 6px; cursor: pointer; &--hover { background: #eff6ff; } &:disabled { opacity: 0.4; cursor: not-allowed; } }
.page-info { color: #64748b; font-size: 13px; font-weight: 600; }

.detail-panel { display: flex; flex-direction: column; min-width: 0; overflow: hidden; }
.detail-empty { flex: 1; display: flex; align-items: center; justify-content: center; color: #7c8da1; font-size: 14px; }
.detail-body { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
.detail-tabs { display: flex; flex: none; border-bottom: 1px solid #edf3f8; }
.detail-tab { flex: 1; display: flex; align-items: center; justify-content: center; height: 42px; color: #64748b; font-size: 13px; font-weight: 700; cursor: pointer; border-bottom: 2px solid transparent; &--active { color: #3b82f6; border-bottom-color: #3b82f6; } }
.detail-section { flex: 1; min-height: 0; padding: 16px; overflow-y: auto; background: linear-gradient(180deg, #f8fafc 0, #ffffff 142px), #ffffff; }
.detail-summary { display: flex; flex-direction: column; gap: 12px; padding: 14px 16px; margin-bottom: 12px; background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 6px; box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045); }
.detail-summary__main { display: flex; flex-direction: column; gap: 7px; min-width: 0; }
.detail-summary__label { color: #475569; font-size: 12px; font-weight: 800; }
.detail-summary__value { color: #0f4c81; font-family: "DIN Alternate", "Arial", sans-serif; font-size: 17px; font-weight: 900; line-height: 1.25; word-break: normal; overflow-wrap: anywhere; }
.detail-summary__badges { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; }
.detail-summary__badge { display: inline-block; min-width: 64px; height: 26px; line-height: 26px; text-align: center; padding: 0 10px; font-size: 12px; font-weight: 700; border-radius: 10px; background: #eff6ff; color: #3b82f6; &--light { color: #22c55e; background: #dcfce7; } &--medium { color: #f59e0b; background: #fef3c7; } &--heavy { color: #ef4444; background: #fee2e2; } }
.detail-summary__meta { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding-top: 10px; border-top: 1px solid #edf3f8; }
.detail-summary__meta-item { min-width: 0; padding: 8px 10px; background: #f8fafc; border-radius: 6px; border: 1px solid #e8eef5; }
.detail-summary__meta-label { display: block; color: #475569; font-size: 11px; font-weight: 800; }
.detail-summary__meta-value { display: block; margin-top: 4px; color: #0f172a; font-size: 14px; font-weight: 700; }
.detail-grid { display: grid; gap: 0; overflow: hidden; background: #ffffff; border: 1px solid #dfebf5; border-radius: 6px; box-shadow: 0 8px 18px rgba(33, 72, 108, 0.045); }
.detail-item { display: grid; grid-template-columns: 92px minmax(0, 1fr); align-items: center; min-height: 48px; padding: 8px 14px; border-bottom: 1px solid #edf3f8; }
.detail-grid .detail-item:last-child { border-bottom: 0; }
.detail-fields-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.detail-field-card { display: flex; flex-direction: column; gap: 6px; min-width: 0; padding: 12px 14px; background: #ffffff; border: 1px solid #c4d3e3; border-radius: 8px; box-shadow: 0 2px 8px rgba(33, 72, 108, 0.08); transition: border-color 0.18s ease, box-shadow 0.18s ease; }
.detail-field-card:hover { border-color: #4a90d9; box-shadow: 0 4px 12px rgba(33, 72, 108, 0.12); }
.detail-field-card__label { display: flex; align-items: center; gap: 6px; color: #4a5e73; font-size: 11px; font-weight: 800; letter-spacing: 0.3px; }
.detail-field-card__label::before { content: ""; width: 3px; height: 12px; background: #4a90d9; border-radius: 999px; flex-shrink: 0; }
.detail-field-card__value { color: #0f172a; font-size: 14px; font-weight: 700; line-height: 1.45; word-break: break-all; padding-left: 9px; }
.detail-item__label { display: flex; align-items: center; color: #71869b; font-size: 12px; font-weight: 800; line-height: 1.3; }
.detail-item__value { color: #172033; font-size: 14px; font-weight: 700; line-height: 1.45; text-align: right; word-break: break-all; }
.link-text { color: #3b82f6; text-decoration: underline; cursor: pointer; }
.work-order-missing { color: #94a3b8; font-size: 12px; }

.dialog-mask { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; background: rgba(15,35,55,0.22); }
.dialog-panel { display: flex; flex-direction: column; width: 1200px; max-width: calc(100vw - 40px); max-height: 86vh; overflow: hidden; background: #fff; border-radius: 8px; box-shadow: 0 18px 46px rgba(15,35,55,0.2); }
.dialog-head { display: flex; align-items: center; justify-content: space-between; flex: none; padding: 18px 24px; background: #f8fbfe; border-bottom: 1px solid #edf3f8; }
.dialog-title { display: block; color: #183755; font-size: 22px; font-weight: 900; }
.dialog-subtitle { display: block; margin-top: 4px; color: #5f7188; font-size: 13px; }
.icon-button { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; margin: 0; background: #f6fbff; border: 1px solid #d9e7f3; border-radius: 6px; cursor: pointer; &--hover { background: #eff6ff; border-color: #3b82f6; } }
.close-icon { position: relative; width: 14px; height: 14px; &::before, &::after { position: absolute; top: 6px; left: 0; width: 14px; height: 2px; content: ""; background: #64748b; border-radius: 2px; } &::before { transform: rotate(45deg); } &::after { transform: rotate(-45deg); } }
.dialog-body { flex: 1; min-height: 0; max-height: none; overflow-y: auto; padding: 16px 20px; background: #fff; }

.form-section { margin-bottom: 14px; padding: 0; background: #fff; border: 0; border-radius: 0; &:last-child { margin-bottom: 0; } }
.section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 11px; padding-bottom: 9px; border-bottom: 1px solid #eef4fa; }
.section-title { position: relative; padding-left: 10px; color: #183755; font-size: 16px; font-weight: 900; &::before { position: absolute; top: 50%; left: 0; width: 3px; height: 16px; content: ""; background: #3b82f6; border-radius: 999px; transform: translateY(-50%); } }
.section-hint { color: #94a3b8; font-size: 12px; }

.form-grid { display: grid; gap: 12px 18px; &--two { grid-template-columns: repeat(2, 1fr); } &--three { grid-template-columns: repeat(3, 1fr); } }
.form-field { min-width: 0; position: relative; &--wide { grid-column: span 2; } &--device-search { position: relative; } }
.form-label { display: block; margin-bottom: 5px; color: #34495e; font-size: 13px; font-weight: 700; &--required::after { margin-left: 4px; color: #ef4444; content: "*"; } }
.form-error { display: block; margin-top: 4px; color: #ef4444; font-size: 12px; }
.device-suggestions { position: absolute; top: 100%; left: 0; right: 0; z-index: 100; max-height: 200px; overflow-y: auto; margin-top: 4px; background: #fff; border: 1px solid #d5e2ee; border-radius: 4px; box-shadow: 0 8px 20px rgba(15, 35, 55, 0.12); }
.device-suggestion-item { padding: 8px 12px; color: #31506d; font-size: 13px; cursor: pointer; &:hover { background: #eff6ff; color: #3b82f6; } }
.form-input, .form-select { box-sizing: border-box; min-width: 0; width: 100%; max-width: 100%; height: 38px; padding: 0 12px; overflow: hidden; color: #172033; font-size: 14px; line-height: 38px; text-overflow: ellipsis; background: #fbfdff; border: 1px solid #d5e2ee; border-radius: 4px; transition: border-color 0.16s ease, box-shadow 0.16s ease; &--flex { flex: 1; } }
.form-input:focus, .form-textarea:focus { background: #fff; border-color: #8fc8f8; box-shadow: 0 0 0 3px rgba(13,130,238,0.1); }
.form-select { display: flex; align-items: center; justify-content: space-between; &--dropdown { background: #f7fbff; box-shadow: inset 0 -1px 0 rgba(13,130,238,0.03); } &__placeholder { color: #9aa9b8; } }
.form-select--clickable { cursor: pointer; &:hover { border-color: #8fc8f8; } }
.form-select-dropdown { position: absolute; top: 100%; left: 0; right: 0; z-index: 2100; margin-top: 4px; background: #ffffff; border: 1px solid #d5e2ee; border-radius: 6px; box-shadow: 0 8px 20px rgba(15, 35, 55, 0.12); overflow: hidden; }
.form-select-dropdown__item { padding: 8px 12px; font-size: 14px; color: #24384d; cursor: pointer; &:hover { background: #eff6ff; } &--active { background: #dbeafe; color: #3b82f6; font-weight: 700; } }
.form-textarea { box-sizing: border-box; width: 100%; max-width: 100%; min-height: 88px; padding: 9px 12px; color: #172033; font-size: 14px; line-height: 1.45; background: #fbfdff; border: 1px solid #d5e2ee; border-radius: 4px; }

.select-arrow { width: 8px; height: 8px; border: solid #74879c; border-width: 0 2px 2px 0; transform: translateY(-2px) rotate(45deg); &--up { transform: translateY(2px) rotate(-135deg); } }

.select-field-wrapper { position: relative; }
.custom-select { display: flex; align-items: center; justify-content: space-between; box-sizing: border-box; width: 100%; height: 38px; padding: 0 12px; color: #172033; font-size: 14px; background: #fbfdff; border: 1px solid #d5e2ee; border-radius: 4px; cursor: pointer; transition: border-color 0.16s ease, box-shadow 0.16s ease; &--open { border-color: #8fc8f8; box-shadow: 0 0 0 3px rgba(13,130,238,0.1); } }
.custom-select__placeholder { color: #9aa9b8; }
.custom-select-dropdown { position: absolute; top: 100%; left: 0; z-index: 10; width: 100%; margin-top: 4px; background: #fff; border: 1px solid #d5e2ee; border-radius: 4px; box-shadow: 0 8px 24px rgba(15,35,55,0.12); overflow: hidden; }
.custom-select-option { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; font-size: 14px; color: #172033; cursor: pointer; &:hover { background: #eff6ff; } &--active { color: #3b82f6; font-weight: 700; } }
.custom-select-check { color: #3b82f6; font-size: 14px; }
.select-backdrop { position: fixed; inset: 0; z-index: 5; }

.form-row { display: flex; gap: 10px; align-items: center; }
.form-action-btn { display: flex; align-items: center; gap: 4px; flex: none; height: 38px; padding: 0 14px; color: #3b82f6; font-size: 13px; font-weight: 700; white-space: nowrap; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; cursor: pointer; &--small { height: 38px; padding: 0 12px; font-size: 12px; } &--hover { background: #dbeafe; border-color: #3b82f6; } }
.form-action-btn__icon--map { display: inline-block; width: 14px; height: 14px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%233b82f6'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z'/%3E%3C/svg%3E") center/contain no-repeat; }

.form-photo-area { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; justify-content: center; }
.photo-preview-list { display: flex; flex-wrap: wrap; gap: 10px; }
.photo-preview-item { position: relative; width: 88px; height: 88px; border-radius: 6px; overflow: hidden; &--video { width: 120px; height: 88px; } &--audio { width: 88px; height: 88px; background: #f1f5f9; display: flex; align-items: center; justify-content: center; } }
.audio-thumb { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }
.audio-thumb__icon { font-size: 32px; color: #3b82f6; }
.photo-thumb { width: 100%; height: 100%; }
.photo-remove-btn { position: absolute; top: 2px; right: 2px; display: flex; align-items: center; justify-content: center; width: 22px; height: 22px; padding: 0; margin: 0; background: rgba(0,0,0,0.55); border: 0; border-radius: 50%; cursor: pointer; &--hover { background: rgba(0,0,0,0.75); } }
.photo-remove-icon { position: relative; width: 10px; height: 10px; &::before, &::after { position: absolute; top: 4px; left: 0; width: 10px; height: 2px; content: ""; background: #fff; border-radius: 1px; } &::before { transform: rotate(45deg); } &::after { transform: rotate(-45deg); } }
.photo-add-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; width: 100%; height: 88px; border: 2px dashed #c5d2e2; border-radius: 6px; background: #fbfdff; cursor: pointer; transition: border-color 0.16s ease, background 0.16s ease; &:hover { border-color: #3b82f6; background: #eff6ff; } }
.photo-add-icon { font-size: 26px; font-weight: 300; color: #94a3b8; line-height: 1; }
.photo-add-label { font-size: 11px; color: #94a3b8; }
.form-input--hidden-id { margin-top: 10px; height: 32px; font-size: 12px; color: #94a3b8; background: #f9fafb; }

.dialog-actions { display: flex; flex: none; justify-content: flex-end; gap: 12px; padding: 12px 22px; padding-bottom: calc(12px + env(safe-area-inset-bottom)); background: #fff; border-top: 1px solid #edf3f8; box-shadow: 0 -4px 16px rgba(24,55,85,0.06); }
.dialog-btn { display: flex; align-items: center; justify-content: center; min-width: 80px; height: 38px; padding: 0 22px; font-size: 14px; font-weight: 700; border-radius: 6px; cursor: pointer; transition: opacity 0.16s ease; &--cancel { color: #34495e; background: #f1f5f9; border: 1px solid #d5e2ee; } &--primary { color: #fff; background: #3b82f6; border: 1px solid #3b82f6; } &--hover { opacity: 0.85; } &:disabled { opacity: 0.45; cursor: not-allowed; } }

/* ========== 地图选点面板 ========== */
.map-picker-panel {
  margin-top: 12px;
  border: 1px solid #d5e2ee;
  border-radius: 6px;
  overflow: hidden;
}

.map-picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #f8fbfe;
  border-bottom: 1px solid #edf3f8;
}

.map-picker-title {
  color: #183755;
  font-size: 14px;
  font-weight: 700;
}

.map-picker-coord {
  color: #94a3b8;
  font-size: 13px;

  &--active {
    color: #3b82f6;
    font-weight: 700;
  }
}

.map-picker-body {
  position: relative;
  width: 100%;
  height: 300px;
}

.map-picker-canvas {
  width: 100%;
  height: 100%;

  &--fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    color: #7c8da1;
    font-size: 14px;
    background: #f8fafc;
  }
}

.map-picker-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 10px 14px;
  background: #fff;
  border-top: 1px solid #edf3f8;
}

@media (max-width: 1024px) { .main-layout { flex-direction: column; } .detail-panel { width: 100%; max-height: 340px; } .stats-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 1024px) { .form-grid--three { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 640px) { .form-grid--two, .form-grid--three { grid-template-columns: 1fr; } .form-field--wide { grid-column: span 1; } }

.form-layout { display: grid; grid-template-columns: 1fr 320px; gap: 20px; min-height: 100%; }
.form-main { display: flex; flex-direction: column; gap: 14px; min-width: 0; }
.form-side { min-width: 0; padding-left: 20px; border-left: 1px solid #e4edf6; display: flex; flex-direction: column; gap: 14px; }
.form-grid--side { grid-template-columns: 1fr; }

@media (max-width: 1024px) { .form-layout { grid-template-columns: 1fr; } .form-side { padding-left: 0; border-left: 0; } .form-grid--three { grid-template-columns: repeat(2, 1fr); } }

.time-section { min-width: 0; margin-top: 14px; padding: 14px; background: rgba(255, 255, 255, 0.96); border: 1px solid #dfebf5; border-radius: 6px; box-shadow: 0 8px 18px rgba(33, 72, 108, 0.055); }
.detail-section-title { display: block; margin-bottom: 12px; color: #183755; font-size: 14px; font-weight: 900; }
.attach-media { display: flex; flex-direction: column; gap: 12px; margin-bottom: 12px; }
.attach-media__item { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 14px 12px; background: #f8fafc; border: 1px solid #dfebf5; border-radius: 6px; }
.attach-media__label { color: #475569; font-size: 12px; font-weight: 800; }
.attach-media__player { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.attach-media__hint { color: #64748b; font-size: 12px; }
.attach-media__empty { color: #94a3b8; font-size: 13px; text-align: center; padding: 8px 0; }
.attach-media__photos { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.attach-photo { width: 80px; height: 80px; border-radius: 4px; overflow: hidden; border: 1px solid #dfebf5; cursor: pointer; }
.attach-photo__img { width: 100%; height: 100%; }
.attach-play-btn { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; padding: 0; margin: 0; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 50%; cursor: pointer; &--hover { background: #dbeafe; } }
.attach-audio-list { display: flex; flex-direction: column; gap: 6px; }
.attach-audio-item { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 6px 8px; background: #fff; border: 1px solid #e3ebf2; border-radius: 4px; }
.attach-audio-item__time { color: #475569; font-size: 12px; }
.time-list { position: relative; display: grid; gap: 0; }
.time-list::before { position: absolute; top: 16px; bottom: 16px; left: 6px; width: 2px; content: ""; background: #d7e8f6; }
.time-row { position: relative; display: grid; grid-template-columns: 18px minmax(0, 1fr); gap: 10px; min-width: 0; padding: 9px 0; }
.time-row__marker { position: relative; z-index: 1; width: 10px; height: 10px; margin-top: 4px; background: #0d82ee; border: 3px solid #e8f4ff; border-radius: 50%; box-shadow: 0 0 0 1px #b9dcff; }
.time-row__content { display: grid; grid-template-columns: 72px minmax(0, 1fr); align-items: center; gap: 10px; min-width: 0; }
.time-row__label { color: #6b7f94; font-size: 12px; font-weight: 800; }
.time-row__value { min-width: 0; color: #172033; font-size: 14px; font-weight: 700; line-height: 1.45; word-break: break-all; }
.time-section--location { background: linear-gradient(90deg, rgba(13, 130, 238, 0.08), rgba(255, 255, 255, 0) 58%), rgba(255, 255, 255, 0.96); margin-top: 10px; }
.location-row { display: grid; grid-template-columns: 60px minmax(0, 1fr); gap: 10px; min-width: 0; padding: 11px 0; border-bottom: 1px solid #edf3f8; &:last-child { border-bottom: 0; } }
.location-row__label { color: #6b7f94; font-size: 12px; font-weight: 800; }
.location-row__value { min-width: 0; color: #172033; font-size: 14px; font-weight: 700; word-break: break-all; }
</style>
