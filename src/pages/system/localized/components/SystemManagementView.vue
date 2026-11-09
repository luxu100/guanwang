<template>
  <view class="system-view" :class="`system-view--${mode}`">
    <view class="workspace" :class="`workspace--${mode}`">
      <view class="side-panel">
        <view class="panel-head">
          <text class="panel-title">{{ sideTitle }}</text>
          <button class="icon-button" :disabled="refreshing" hover-class="icon-button--hover" aria-label="刷新" @click="handleRefresh">
            <svg class="icon-refresh" :class="{ 'icon-refresh--spinning': refreshing }" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
        </view>

        <view v-if="mode === 'user'" class="org-tree">
          <view
            v-for="item in orgOptions"
            :key="item.value"
            class="tree-node"
            :class="{ 'tree-node--active': activeOrg === item.value }"
            @click="selectOrg(item.value)"
          >
            <text class="tree-node__mark"></text>
            <text>{{ item.label }}</text>
            <text class="tree-node__count">{{ item.count }}</text>
          </view>
        </view>

        <scroll-view v-else-if="mode === 'auth'" class="side-list" scroll-y>
          <view
            v-for="item in roles"
            :key="getId(item)"
            class="side-list__item"
            :class="{ 'side-list__item--active': getId(item) === getId(selectedRole) }"
            @click="selectRole(item)"
          >
            <view class="role-title-row">
              <text class="side-list__title">{{ getRoleName(item) }}</text>
              <text
                v-if="isSuperAdminRole(item)"
                class="role-admin-note"
                :title="localeText('超级管理员可访问全部前端页面，勾选项展示显式授权记录。', 'Super administrators can access all frontend pages. Checkboxes show explicit grants.')"
              >{{ localeText("全部页面", "All pages") }}</text>
            </view>
            <text class="side-list__sub">{{ getText(item, ['roleCode'], '未配置编码') }}</text>
          </view>
          <view v-if="!roles.length && !loading" class="empty-tip">暂无角色数据</view>
        </scroll-view>

        <scroll-view v-else-if="mode === 'menu'" class="side-list" scroll-y>
          <view
            v-for="item in visibleMenus"
            :key="getId(item)"
            class="side-list__item side-list__item--tree"
            :class="{ 'side-list__item--active': getId(item) === getId(selectedMenu) }"
            :style="{ paddingLeft: `${9 + (getTreeLevel(item) - 1) * 18}px` }"
            @click="selectMenu(item)"
          >
            <view class="side-list__tree-title">
              <view
                v-if="hasMenuChildren(item)"
                class="menu-expand-toggle"
                :aria-label="isMenuExpanded(item) ? '收起子菜单' : '展开子菜单'"
                @click.stop="toggleMenuExpanded(item)"
              >
                <text class="menu-expand-arrow" :class="{ 'menu-expand-arrow--expanded': isMenuExpanded(item) }"></text>
              </view>
              <text v-else-if="getTreeLevel(item) > 1" class="side-list__tree-branch"></text>
              <text v-else class="side-list__tree-spacer"></text>
              <text class="side-list__title">{{ getPermissionName(item) }}</text>
            </view>
          </view>
          <view v-if="!menus.length && !loading" class="empty-tip">暂无菜单数据</view>
        </scroll-view>

        <scroll-view v-else class="side-list" scroll-y>
          <view
            v-for="item in dictTypes"
            :key="getId(item)"
            class="side-list__item"
            :class="{ 'side-list__item--active': getId(item) === getId(selectedDictType) }"
            @click="selectDictType(item)"
          >
            <text class="side-list__title">{{ getDictTypeName(item) }}</text>
            <text class="tag-code">{{ getDictTypeCode(item) }}</text>
          </view>
          <view v-if="!dictTypes.length && !loading" class="empty-tip">暂无字典分类</view>
        </scroll-view>
      </view>

      <view class="main-panel">
        <view class="toolbar">
          <view class="toolbar__filters">
            <view class="filter-field">
              <text class="filter-label">{{ searchLabel }}</text>
              <input v-model="filters.keyword" class="filter-input" :placeholder="searchPlaceholder" placeholder-class="input-placeholder" @confirm="searchCurrent" />
            </view>
            <view v-if="mode === 'user'" class="filter-field filter-field--small">
              <text class="filter-label">地区</text>
              <picker :range="userRegionFilterOptions" range-key="label" @change="handleUserRegionFilterChange">
                <view class="filter-select">{{ currentUserRegionFilterLabel }}</view>
              </picker>
            </view>
          </view>

          <view class="toolbar__actions">
            <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchCurrent">查询</button>
            <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
            <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="startCreate">{{ createButtonText }}</button>
            <button class="toolbar-button toolbar-button--danger" :disabled="!canDelete" hover-class="toolbar-button--hover" @click="deleteCurrent">{{ localeText("删除", "Delete") }}</button>
            <view v-if="mode === 'user'" class="user-pagination">
              <view class="user-page-size">
                <text class="user-page-info">{{ localeText("每页", "Per page") }}</text>
                <input
                  v-model="pageSizeInputValue"
                  class="user-page-size__input"
                  type="number"
                  confirm-type="done"
                  @confirm="commitPageSizeInput"
                  @blur="commitPageSizeInput"
                />
                <text class="user-page-info">{{ localeText("条", "items") }}</text>
              </view>
              <button class="user-page-button" :disabled="pagination.pageNum <= 1" hover-class="user-page-button--hover" @click="changePage(-1)">{{ localeText("上一页", "Previous") }}</button>
              <view class="user-page-jump">
                <text class="user-page-info">{{ localeText("第", "Page") }}</text>
                <input
                  v-model="pageInputValue"
                  class="user-page-input"
                  type="number"
                  confirm-type="done"
                  @confirm="commitPageInput"
                  @blur="commitPageInput"
                />
                <text class="user-page-info">/ {{ userTotalPages }} {{ localeText("页", "pages") }}</text>
              </view>
              <button class="user-page-button" :disabled="pagination.pageNum >= userTotalPages" hover-class="user-page-button--hover" @click="changePage(1)">{{ localeText("下一页", "Next") }}</button>
            </view>
          </view>
        </view>

        <view v-if="mode === 'user'" class="content-layout content-layout--vertical content-layout--user">
          <view class="table-panel">
            <view class="table-head">
              <text>用户列表</text>
              <text class="table-head__meta">{{ localizedTotal(userDisplayTotal) }}</text>
            </view>
            <scroll-view class="table-scroll" scroll-x scroll-y>
              <view class="data-table data-table--user">
                <view class="data-row data-row--header">
                  <text class="data-cell data-cell--name">用户姓名</text>
                  <text class="data-cell data-cell--account">登录账号</text>
                  <text class="data-cell data-cell--phone">联系电话</text>
                  <text class="data-cell data-cell--email">邮箱</text>
                  <text class="data-cell data-cell--region">地区</text>
                  <text class="data-cell data-cell--roles">角色</text>
                  <text class="data-cell data-cell--depts">分区</text>
                  <text class="data-cell data-cell--status">状态</text>
                </view>
                <view v-if="loading" class="table-state">加载中...</view>
                <view v-else-if="!users.length" class="table-state">暂无用户数据</view>
                <view
                  v-for="item in users"
                  v-else
                  :key="getId(item)"
                  class="data-row"
                  :class="{ 'data-row--active': getId(item) === getId(selectedUser) }"
                  @click="selectUser(item)"
                >
                  <text class="data-cell data-cell--name">{{ getText(item, ['realName', 'name'], '-') }}</text>
                  <text class="data-cell data-cell--account">{{ getText(item, ['username'], '-') }}</text>
                  <text class="data-cell data-cell--phone">{{ getText(item, ['phone'], '-') }}</text>
                  <text class="data-cell data-cell--email">{{ getText(item, ['email'], '-') }}</text>
                  <text class="data-cell data-cell--region">{{ getText(item, ['region'], '-') }}</text>
                  <text class="data-cell data-cell--roles">{{ getUserRoleNames(item) }}</text>
                  <text class="data-cell data-cell--depts">{{ getUserDeptNames(item) }}</text>
                  <text class="data-cell data-cell--status">
                    <text class="status-pill" :class="getStatusClass(item)">{{ getStatusLabel(getValue(item, ['status'])) }}</text>
                  </text>
                </view>
              </view>
            </scroll-view>
          </view>

          <transition name="user-detail-drawer">
            <view v-if="isUserDetailOpen" class="detail-panel detail-panel--user">
              <view class="detail-head detail-head--user">
                <text>{{ isCreating ? "新增用户" : "用户详细信息配置" }}</text>
                <text class="detail-head__sub">基础信息、角色分配和报警通知配置</text>
                <button
                  class="user-detail-collapse"
                  hover-class="user-detail-collapse--hover"
                  aria-label="收起用户详细信息配置"
                  @click="collapseUserDetail"
                >
                  <text class="user-detail-collapse__icon"></text>
                </button>
              </view>
              <view class="form-grid form-grid--user">
              <view class="form-field">
                <text class="form-label form-label--required">登录账号</text>
                <input v-model="userForm.username" class="form-input" placeholder="请输入至少6位登录账号" placeholder-class="input-placeholder" />
                <text v-if="isCreating && userForm.username && userForm.username.trim().length < 6" class="form-error">登录账号不能少于6位</text>
              </view>
              <view class="form-field">
                <text class="form-label form-label--required">用户姓名</text>
                <input v-model="userForm.realName" class="form-input" placeholder="请输入用户姓名" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">联系电话</text>
                <input v-model="userForm.phone" class="form-input" placeholder="请输入联系电话" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">邮箱</text>
                <input v-model="userForm.email" class="form-input" placeholder="请输入邮箱" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field" v-if="isCreating">
                <text class="form-label form-label--required">初始密码</text>
                <view class="password-input-wrap">
                  <input
                    v-model="userForm.password"
                    class="form-input form-input--password"
                    :password="!showUserPassword"
                    placeholder="请输入至少6位初始密码"
                    placeholder-class="input-placeholder"
                  />
                  <button
                    class="password-toggle"
                    :class="{ 'password-toggle--visible': showUserPassword }"
                    hover-class="password-toggle--hover"
                    :aria-label="showUserPassword ? '隐藏密码' : '显示密码'"
                    @click="toggleUserPasswordVisibility"
                  >
                    <text class="password-toggle__eye"></text>
                  </button>
                </view>
                <text v-if="userForm.password && userForm.password.trim().length < 6" class="form-error">初始密码不能少于6位</text>
              </view>
              <view class="form-field">
                <text class="form-label">地区</text>
                <picker :range="userRegionOptions" range-key="label" @change="handleUserRegionChange">
                  <view class="form-select">{{ currentUserRegionLabel }}</view>
                </picker>
              </view>
              <view class="form-field">
                <text class="form-label">用户状态</text>
                <picker :range="recordStatusOptions" range-key="label" @change="handleUserFormStatusChange">
                  <view class="form-select">{{ getStatusLabel(userForm.status) }}</view>
                </picker>
              </view>
              <view class="user-config-row">
                <view class="form-field">
                  <text class="form-label">分配权限角色（决定可访问菜单）</text>
                  <view class="check-grid check-grid--roles">
                    <view
                      v-for="item in roles"
                      :key="getId(item)"
                      class="check-item"
                      :class="{ 'check-item--checked': selectedRoleIds.includes(getId(item)) }"
                      @click="toggleUserRole(getId(item))"
                    >
                      <text class="check-box"></text>
                      <text data-i18n-raw>{{ getRoleName(item) }}</text>
                    </view>
                  </view>
                </view>
                <view class="form-field">
                  <text class="form-label">实时报警通知配置</text>
                  <view class="check-grid">
                    <view v-for="item in alarmOptions" :key="item.value" class="check-item" :class="{ 'check-item--checked': selectedAlarmOptions.includes(item.value) }" @click="toggleAlarm(item.value)">
                      <text class="check-box"></text>
                      <text>{{ item.label }}</text>
                    </view>
                  </view>
                </view>
              </view>
              <view class="form-field form-field--wide">
                <view class="binding-field-head">
                  <text class="form-label">用户绑定分区（Region接口）</text>
                  <button class="mini-button" :disabled="isSuperAdminSelected" hover-class="mini-button--hover" @click="openUserPartitionDialog">新增绑定</button>
                </view>
                <view class="bound-partition-list">
                  <view v-for="id in selectedUserPartitionIds" :key="id" class="bound-partition-tag">
                    <text>{{ getPartitionNameById(id) }}</text>
                    <text v-if="!isSuperAdminSelected" class="bound-partition-tag__remove" @click="removeUserPartition(id)">×</text>
                  </view>
                  <text v-if="!selectedUserPartitionIds.length" class="empty-inline">暂未绑定分区</text>
                </view>
                <text v-if="isSuperAdminSelected" class="binding-lock-tip">超级管理员自动绑定全部分区，不可手动修改</text>
              </view>
              <UserLogoBindingField
                v-model="userForm.logoId"
                @update:modelValue="handleUserLogoModelChange"
                class="form-field form-field--wide"
              />
              </view>
              <view class="form-actions">
                <button class="toolbar-button" hover-class="toolbar-button--hover" @click="cancelEdit">取消</button>
                <button class="toolbar-button toolbar-button--primary" :disabled="saving" hover-class="toolbar-button--hover" @click="saveUser">
                  {{ saving ? "保存中..." : "保存用户信息" }}
                </button>
              </view>
            </view>
          </transition>
          <button
            v-if="!isUserDetailOpen && selectedUser"
            class="user-detail-expand"
            hover-class="user-detail-expand--hover"
            :aria-label="localeText('展开用户详细信息配置', 'Expand user details')"
            @click="expandUserDetail"
          >
            <text class="user-detail-expand__icon"></text>
          </button>
        </view>

        <view v-else-if="mode === 'auth'" class="content-layout content-layout--auth">
          <view class="detail-panel detail-panel--role">
            <view class="detail-head">
              <text>{{ isCreating ? "新增角色" : "角色基础信息" }}</text>
              <text class="detail-head__sub">维护角色编码、排序和说明</text>
            </view>
            <view class="form-grid form-grid--role">
              <view class="form-field">
                <text class="form-label form-label--required">角色名称</text>
                <input v-model="roleForm.roleName" class="form-input" placeholder="请输入角色名称" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label form-label--required">角色编码</text>
                <input v-model="roleForm.roleCode" class="form-input" placeholder="请输入角色编码" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">排序</text>
                <input v-model="roleForm.sort" class="form-input" type="number" placeholder="排序值" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">说明</text>
                <input v-model="roleForm.description" class="form-input" placeholder="角色说明" placeholder-class="input-placeholder" />
              </view>
            </view>
            <view class="form-actions">
              <button class="toolbar-button" hover-class="toolbar-button--hover" @click="copyRole">复制</button>
              <button class="toolbar-button" hover-class="toolbar-button--hover" @click="setDefaultRole">设为默认</button>
              <button class="toolbar-button toolbar-button--primary" :disabled="saving" hover-class="toolbar-button--hover" @click="saveRole">
                {{ saving ? "保存中..." : "保存角色" }}
              </button>
            </view>
          </view>

          <view class="permission-panel">
            <view class="detail-head">
              <text>权限树配置</text>
              <text class="detail-head__sub">基于菜单结构为当前角色分配权限</text>
            </view>
            <view v-if="permissionLoadError || rolePermissionError" class="permission-load-error" role="alert" data-i18n-raw>
              {{ permissionLoadError || rolePermissionError }}
            </view>
            <scroll-view class="permission-tree" scroll-y>
              <view
                v-for="item in permissions"
                :key="getId(item)"
                class="permission-node"
                :class="`permission-node--level-${getTreeLevel(item)}`"
                :style="{ paddingLeft: `${8 + (getTreeLevel(item) - 1) * 22}px` }"
                @click="togglePermission(item)"
              >
                <text
                    class="check-box"
                    :class="{
                      'check-box--checked': isPermissionChecked(item),
                      'check-box--partial': isPermissionPartialChecked(item),
                    }"
                  ></text>
                <text class="permission-node__name">{{ getPermissionName(item) }}</text>
                <text class="permission-node__code">{{ getText(item, ['permissionCode'], '') }}</text>
              </view>
              <view v-if="!permissions.length && !loading" class="empty-tip">暂无权限树数据</view>
            </scroll-view>

            <view class="form-actions">
              <button class="toolbar-button" hover-class="toolbar-button--hover" @click="toggleAllPermissions">
                {{ areAllPermissionsChecked ? "取消全选" : "全选" }}
              </button>
              <button class="toolbar-button" hover-class="toolbar-button--hover" @click="clearPermissionSelection">清空选择</button>
              <button class="toolbar-button toolbar-button--primary" :disabled="saving || rolePermissionLoading || !!rolePermissionError || permissionSource === 'local' || !getId(selectedRole)" hover-class="toolbar-button--hover" @click="saveRolePermissions">
                {{ saving ? "保存中..." : "保存权限" }}
              </button>
            </view>
          
          </view>
        </view>

        <view v-else-if="mode === 'menu'" class="content-layout content-layout--vertical">
          <view v-if="menuLoadError" class="permission-load-error" role="alert" data-i18n-raw>{{ menuLoadError }}</view>
          <view class="table-panel">
            <view class="table-head">
              <text>菜单资源列表</text>
              <view class="table-head__actions">
                <text class="table-head__meta">{{ localizedTotal(total) }}</text>
                <button
                  class="toolbar-button toolbar-button--danger toolbar-button--compact"
                  :disabled="saving || selectedMenuIds.length === 0"
                  hover-class="toolbar-button--hover"
                  @click="deleteSelectedMenus"
                >
                  批量删除{{ selectedMenuIds.length ? `(${selectedMenuIds.length})` : "" }}
                </button>
              </view>
            </view>
            <scroll-view class="table-scroll" scroll-x scroll-y>
              <view class="data-table data-table--menu">
                <view class="data-row data-row--header">
                  <text class="data-cell data-cell--select">
                    <text class="check-box" :class="{ 'check-box--checked': areAllCurrentMenusSelected }" @click.stop="toggleAllCurrentMenus"></text>
                  </text>
                  <text class="data-cell data-cell--name">菜单名称</text>
                  <text class="data-cell data-cell--code">权限编码</text>
                  <text class="data-cell data-cell--path">页面路径</text>
                  <text class="data-cell data-cell--status">状态</text>
                </view>
                <view v-if="loading" class="table-state">加载中...</view>
                <view v-else-if="!menus.length" class="table-state">暂无菜单数据</view>
                <view v-for="item in visibleMenus" v-else :key="getId(item)" class="data-row" :class="{ 'data-row--active': getId(item) === getId(selectedMenu) }" @click="selectMenu(item)">
                  <text class="data-cell data-cell--select">
                    <text
                      class="check-box"
                      :class="{ 'check-box--checked': selectedMenuIds.includes(getId(item)), 'check-box--disabled': !canSelectMenuForBatch(item) }"
                      @click.stop="toggleMenuSelection(item)"
                    ></text>
                  </text>
                  <view class="data-cell data-cell--name">
                    <view class="menu-table-name" :style="{ paddingLeft: `${(getTreeLevel(item) - 1) * 18}px` }">
                      <view
                        v-if="hasMenuChildren(item)"
                        class="menu-expand-toggle"
                        :aria-label="isMenuExpanded(item) ? '收起子菜单' : '展开子菜单'"
                        @click.stop="toggleMenuExpanded(item)"
                      >
                        <text class="menu-expand-arrow" :class="{ 'menu-expand-arrow--expanded': isMenuExpanded(item) }"></text>
                      </view>
                      <text v-else class="menu-expand-spacer"></text>
                      <text>{{ getPermissionName(item) }}</text>
                    </view>
                  </view>
                  <text class="data-cell data-cell--code">{{ getText(item, ['permissionCode'], '-') }}</text>
                  <text class="data-cell data-cell--path">{{ getText(item, ['path'], '-') }}</text>
                  <text class="data-cell data-cell--status">
                    <text class="status-pill" :class="getStatusClass(item)">{{ getStatusLabel(getValue(item, ['status'])) }}</text>
                  </text>
                </view>
              </view>
            </scroll-view>
          </view>
          <view class="detail-panel detail-panel--menu">
            <view class="detail-head">
              <text>{{ isCreating ? "新增菜单" : "菜单配置" }}</text>
              <text class="detail-head__sub">维护页面入口、权限编码和父级关系</text>
            </view>
            <view class="form-grid">
              <view class="form-field">
                <text class="form-label form-label--required">菜单名称</text>
                <input v-model="menuForm.permissionName" class="form-input" placeholder="请输入菜单名称" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label form-label--required">权限编码</text>
                <input v-model="menuForm.permissionCode" class="form-input" placeholder="例如 system:user" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">页面路径</text>
                <input v-model="menuForm.path" class="form-input" placeholder="/pages/system/user/user" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">父级菜单</text>
                <picker :range="menuParentOptions" range-key="label" @change="handleMenuParentChange">
                  <view class="form-select">{{ currentMenuParentLabel }}</view>
                </picker>
              </view>
              <view class="form-field">
                <text class="form-label">资源类型</text>
                <picker :range="permissionTypeOptions" range-key="label" @change="handleMenuTypeChange">
                  <view class="form-select">{{ currentMenuTypeLabel }}</view>
                </picker>
              </view>
              <view class="form-field">
                <text class="form-label">状态</text>
                <picker :range="recordStatusOptions" range-key="label" @change="handleMenuStatusChange">
                  <view class="form-select">{{ getStatusLabel(menuForm.status) }}</view>
                </picker>
              </view>
            </view>
            <view class="form-actions">
              <button class="toolbar-button" hover-class="toolbar-button--hover" @click="cancelEdit">取消</button>
              <button class="toolbar-button" :disabled="saving" hover-class="toolbar-button--hover" @click="syncDefaultMenusToBackend">
                {{ saving ? "同步中..." : "同步默认菜单" }}
              </button>
              <button class="toolbar-button toolbar-button--primary" :disabled="saving" hover-class="toolbar-button--hover" @click="saveMenu">
                {{ saving ? "保存中..." : "保存菜单" }}
              </button>
            </view>
          </view>
        </view>

        <view v-else class="content-layout content-layout--dict">
          <view class="table-panel">
            <view class="table-head">
              <text>字典项明细：{{ selectedDictType ? getDictTypeName(selectedDictType) : "未选择分类" }}</text>
              <text class="table-head__meta">{{ localizedTotal(total) }}</text>
            </view>
            <scroll-view class="table-scroll" scroll-x scroll-y>
              <view class="data-table data-table--dict">
                <view class="data-row data-row--header">
                  <text class="data-cell data-cell--sort">排序</text>
                  <text class="data-cell data-cell--code">字典键</text>
                  <text class="data-cell data-cell--name">显示名称</text>
                  <text class="data-cell data-cell--remark">说明备注</text>
                  <text class="data-cell data-cell--time">修改时间</text>
                </view>
                <view v-if="loading" class="table-state">加载中...</view>
                <view v-else-if="!dictItems.length" class="table-state">暂无字典项数据</view>
                <view v-for="item in dictItems" v-else :key="getId(item)" class="data-row" :class="{ 'data-row--active': getId(item) === getId(selectedDictItem) }" @click="selectDictItem(item)">
                  <text class="data-cell data-cell--sort">{{ getText(item, ['sort'], '-') }}</text>
                  <text class="data-cell data-cell--code"><text class="tag-code">{{ getDictItemCode(item) }}</text></text>
                  <text class="data-cell data-cell--name">{{ getDictItemName(item) }}</text>
                  <text class="data-cell data-cell--remark">{{ getText(item, ['remark'], '-') }}</text>
                  <text class="data-cell data-cell--time">{{ formatDateTime(getText(item, ['updatedAt', 'createdAt'], '-')) }}</text>
                </view>
              </view>
            </scroll-view>
          </view>
          <view class="detail-panel detail-panel--dict">
            <view class="detail-head">
              <text>{{ isCreating ? createButtonText : "字典配置" }}</text>
              <text class="detail-head__sub">维护字典分类和当前分类下的字典项</text>
            </view>
            <view class="form-grid">
              <view class="form-field">
                <text class="form-label form-label--required">分类编码</text>
                <input v-model="dictTypeForm.code" class="form-input" placeholder="PIPE_MATERIAL" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label form-label--required">分类名称</text>
                <input v-model="dictTypeForm.name" class="form-input" placeholder="管道材质" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">字典键</text>
                <input v-model="dictItemForm.code" class="form-input" placeholder="STEEL" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">显示名称</text>
                <input v-model="dictItemForm.name" class="form-input" placeholder="镀锌钢管" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">排序</text>
                <input v-model="dictItemForm.sort" class="form-input" type="number" placeholder="排序值" placeholder-class="input-placeholder" />
              </view>
              <view class="form-field">
                <text class="form-label">备注</text>
                <input v-model="dictItemForm.remark" class="form-input" placeholder="说明备注" placeholder-class="input-placeholder" />
              </view>
            </view>
            <view class="form-actions">
              <button class="toolbar-button" hover-class="toolbar-button--hover" @click="startCreateDictType">{{ localeText("新增分类", "Add") }}</button>
              <button class="toolbar-button" hover-class="toolbar-button--hover" @click="startCreateDictItem">{{ localeText("新增字典项", "Add") }}</button>
              <button class="toolbar-button toolbar-button--primary" :disabled="saving" hover-class="toolbar-button--hover" @click="saveDict">
                {{ saving ? "保存中..." : "保存字典" }}
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showUserPartitionDialog" class="modal-mask" @click.self="closeUserPartitionDialog">
      <view class="modal-panel modal-panel--partition">
        <view class="modal-head">
          <view class="modal-title-block">
            <text class="modal-title">新增绑定分区</text>
            <text class="modal-subtitle">选择需要授权给当前用户的分区，可同时绑定多个分区</text>
          </view>
          <view class="modal-head__actions">
            <text class="modal-selection-count">已选 {{ userPartitionDraftIds.length }} 个</text>
            <text class="modal-close" @click="closeUserPartitionDialog">×</text>
          </view>
        </view>
        <view class="modal-body">
          <view class="partition-dialog-toolbar">
            <view>
              <text class="partition-dialog-toolbar__title">可绑定分区</text>
              <text class="partition-dialog-toolbar__meta">{{ localizedCount(availableUserPartitionOptions.length) }}</text>
            </view>
            <view class="check-item check-item--select-all" :class="{ 'check-item--checked': isAllUserPartitionDraftSelected }" @click="toggleAllUserPartitionDraft">
              <text class="check-box"></text>
              <text>{{ isAllUserPartitionDraftSelected ? "取消全选" : "全选" }}</text>
            </view>
          </view>
          <view class="partition-dialog-list">
            <view
              v-for="item in availableUserPartitionOptions"
              :key="getId(item)"
              class="check-item partition-dialog-item"
              :class="{ 'check-item--checked': userPartitionDraftIds.includes(String(getId(item))) }"
              @click="toggleUserPartitionDraft(String(getId(item)))"
            >
              <text class="check-box"></text>
              <view class="partition-dialog-item__content">
                <text class="partition-dialog-item__name">{{ getPartitionName(item) }}</text>
                <text class="partition-dialog-item__status">
                  {{ userPartitionDraftIds.includes(String(getId(item))) ? "已选择" : "点击选择" }}
                </text>
              </view>
            </view>
            <view v-if="!availableUserPartitionOptions.length" class="modal-empty">暂无可新增绑定的分区</view>
          </view>
        </view>
        <view class="modal-actions">
          <text class="modal-actions__summary">本次将新增绑定 {{ userPartitionDraftIds.length }} 个分区</text>
          <view class="modal-actions__buttons">
            <button class="toolbar-button" hover-class="toolbar-button--hover" @click="closeUserPartitionDialog">取消</button>
            <button
              class="toolbar-button toolbar-button--primary"
              :disabled="!userPartitionDraftIds.length"
              hover-class="toolbar-button--hover"
              @click="confirmUserPartitionBinding"
            >
              确定绑定
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useLocaleText, useLocalizedCount, useLocalizedTotal } from "@/i18n/localeText";
import UserLogoBindingField from "@/pages/system/components/UserLogoBindingField.vue";

const localeText = useLocaleText();
const localizedCount = useLocalizedCount();
const localizedTotal = useLocalizedTotal();
import { assignUserDepts, getUserDepts,getUserList, assignUserRoles, deleteUser, getUserPage, register, updateAdminUserLogo, updateUser, type RegisterParams } from "@/services/system/user";
import { applyUserLocale, createScopedT } from "@/i18n";
const frontendMenuT = createScopedT("appShellMenu");
import { updateCurrentUserLogoId } from "@/utils/branding";
import { getRolePermissions,assignRolePermissions, createRole, deleteRole, getPermissionList, getPermissionTree, getRoleDetail, getRoleList, getRolePage, updateRole } from "@/services/system/auth";
import { batchDeleteMenu, createMenu, deleteMenu, getMenuList, getMenuPage, getMenuTree, updateMenu } from "@/services/system/menu";
import { createDictItem, createDictType, deleteDictItem, deleteDictType, getDictItemPage, getDictTypePage, updateDictItem, updateDictType } from "@/services/system/dict";
import { getRegionList } from "@/services/partition/partition";
import {
  type ApiResponseLike,
  type RecordLike,
  assertSuccessResponse,
  formatDateTime,
  getArrayValue,
  getFirstArray,
  getId,
  getText,
  getValue,
  isObject,
  parseListResponse,
  parsePageResponse,
  removeEmptyFields,
  toastError,
} from "@/utils/adminData";
import appShellZhCN from "@/components/locales/zh-CN.json";
import { createDefaultMenuTree, getFrontendMenuByCode, sortFrontendMenuResources } from "@/utils/frontendMenu";
import { buildUserRoleAssignment } from "@/utils/adminUserBinding";
import { confirmAction, confirmDangerAction } from "@/utils/confirmAction";

type AdminMode = "user" | "auth" | "menu" | "dict";
type SelectOption<T extends string | number = string | number> = {
  label: string;
  value: T;
};
type DefaultMenuSyncResult = {
  created: number;
  updated: number;
  deleted: number;
  skipped: number;
};

const LOCAL_MENU_ID_PREFIX = "local-menu:";
const STALE_DEFAULT_MENU_CODES = new Set([
  "page:data-analysis:device-params",
  "page:device:status",
  "page:work-order:statistics",
  "page:alarm:analysis",
  "page:report:generate",
  "page:report:operation",
  "page:report:command",
]);
const STALE_DEFAULT_MENU_PATHS = new Set([
  "/pages/data-analysis/device-params/device-params",
  "/pages/alarm/analysis/analysis",
  "/pages/report/generate/generate",
  "/pages/report/operation/operation",
  "/pages/report/command/command",
]);

function isStaleDefaultMenu(item: RecordLike) {
  const code = getText(item, ["permissionCode", "code"], "").trim().toLowerCase();
  const path = getText(item, ["path", "url", "routePath"], "").trim().toLowerCase();
  return STALE_DEFAULT_MENU_CODES.has(code) || STALE_DEFAULT_MENU_PATHS.has(path);
}

const defaultMenuTree: RecordLike[] = createDefaultMenuTree(appShellZhCN.appShellMenu);

const props = defineProps<{
  mode: AdminMode;
}>();

const recordStatusOptions: Array<SelectOption<number>> = [
  { label: "启用", value: 1 },
  { label: "禁用", value: 0 },
];
const userRegionFilterOptions: Array<SelectOption<string>> = [
  { label: "全部", value: "" },
  { label: "国内", value: "国内" },
  { label: "国外", value: "国外" },
];
const userRegionOptions: Array<SelectOption<string>> = [
  { label: "国内", value: "国内" },
  { label: "国外", value: "国外" },
];
const permissionTypeOptions: Array<SelectOption<number>> = [
  { label: "菜单", value: 1 },
  { label: "按钮", value: 2 },
  { label: "接口", value: 3 },
];
const alarmOptions = [
  { label: "开启实时报警接收", value: "enabled" },
  { label: "Web端系统弹窗", value: "web" },
  { label: "App手机推送", value: "app" },
  { label: "紧急短信通知", value: "sms" },
];

const orgOptions = computed(() =>{
  
  const statUsers = allUsersForPartitionStats.value.length
    ? allUsersForPartitionStats.value
    : users.value;

  return[
  { label: "全部用户", value: "all", count: statUsers.length },
  ...partitionOptions.value.map((item) => {
    const id = String(getId(item));
    return {
      label: getPartitionName(item),
      value: id,
      count: statUsers.filter((user) => userMatchesPartition(user, id, getPartitionName(item))).length,
    };
  }),
]});

const filters = reactive({
  keyword: "",
  region: "",
});
const pagination = reactive({
  pageNum: 1,
  pageSize: 15,
});
const pageInputValue = ref("1");
const pageSizeInputValue = ref("15");
const userForm = reactive({
  id: "",
  username: "",
  realName: "",
  phone: "",
  email: "",
  password: "",
  status: 1,
  region: "国内",
  logoId: "",
});
const userLogoChanged = ref(false);
const roleForm = reactive({
  id: "",
  roleName: "",
  roleCode: "",
  description: "",
  sort: "0",
});
const menuForm = reactive({
  id: "",
  permissionName: "",
  permissionCode: "",
  path: "",
  parentId: "0",
  permissionType: 1,
  status: 1,
});
const dictTypeForm = reactive({
  id: "",
  code: "",
  name: "",
  remark: "",
});
const dictItemForm = reactive({
  id: "",
  code: "",
  name: "",
  sort: "0",
  remark: "",
});

const users = ref<RecordLike[]>([]);
const allUsersForPartitionStats = ref<RecordLike[]>([]);
const roles = ref<RecordLike[]>([]);
const permissions = ref<RecordLike[]>([]);
const menus = ref<RecordLike[]>([]);
const dictTypes = ref<RecordLike[]>([]);
const dictItems = ref<RecordLike[]>([]);
const partitionOptions = ref<RecordLike[]>([]);
const selectedUser = ref<RecordLike | null>(null);
const selectedRole = ref<RecordLike | null>(null);
const selectedMenu = ref<RecordLike | null>(null);
const selectedDictType = ref<RecordLike | null>(null);
const selectedDictItem = ref<RecordLike | null>(null);
const selectedRoleIds = ref<Array<string | number>>([]);
const selectedPermissionIds = ref<Array<string | number>>([]);
const selectedUserPartitionIds = ref<string[]>([]);
const selectedMenuIds = ref<Array<string | number>>([]);
const expandedMenuIds = ref<Array<string | number>>([]);
const userPartitionDraftIds = ref<string[]>([]);
const selectedAlarmOptions = ref(["enabled", "web", "app"]);
const activeOrg = ref("all");
const permissionSource = ref<"api" | "local">("api");
const menuSource = ref<"api" | "local">("api");
const permissionLoadError = ref("");
const menuLoadError = ref("");
const rolePermissionLoading = ref(false);
const rolePermissionError = ref("");
const total = ref(0);
const loading = ref(false);
const saving = ref(false);
const refreshing = ref(false);
const isCreating = ref(false);
const isUserDetailOpen = ref(true);
const showUserPassword = ref(false);
const showUserPartitionDialog = ref(false);
const dictCreateTarget = ref<"type" | "item">("item");
let rolePermissionRequestToken = 0;

const userDisplayTotal = computed(() => {
  if (props.mode !== "user") return total.value;
  return total.value > 0 ? total.value : users.value.length;
});
const userTotalPages = computed(() => Math.max(1, Math.ceil(userDisplayTotal.value / pagination.pageSize)));
const mode = computed(() => props.mode);
const sideTitle = computed(() => {
  const map: Record<AdminMode, string> = {
    user: "分区结构",
    auth: "角色列表",
    menu: "菜单资源",
    dict: "字典分类",
  };
  return map[props.mode];
});
const searchLabel = computed(() => (props.mode === "dict" ? "字典查询" : "关键字"));
const searchPlaceholder = computed(() => {
  const map: Record<AdminMode, string> = {
    user: "姓名、账号、电话",
    auth: "角色名称或编码",
    menu: "菜单名称、编码或路径",
    dict: "字典编码或名称",
  };
  return map[props.mode];
});
const createButtonText = computed(() => {
  const map: Record<AdminMode, string> = {
    user: "新增用户",
    auth: "新增角色",
    menu: "新增菜单",
    dict: dictCreateTarget.value === "type" ? "新增分类" : "新增字典项",
  };
  return localeText(map[props.mode], "Add");
});
const currentUserRegionFilterLabel = computed(() => userRegionFilterOptions.find((item) => item.value === filters.region)?.label || "全部");
const currentUserRegionLabel = computed(() => userRegionOptions.find((item) => item.value === userForm.region)?.label || "国内");
const currentMenuTypeLabel = computed(() => permissionTypeOptions.find((item) => item.value === menuForm.permissionType)?.label || "菜单");
const menuParentOptions = computed<Array<SelectOption<string>>>(() => [
  { label: "根节点", value: "0" },
  ...menus.value
    .filter((item) => {
      const id = getId(item);
      return id && !isLocalMenuId(id) && String(id) !== menuForm.id && Number(getValue(item, ["permissionType"]) ?? 1) !== 2;
    })
    .map((item) => ({
      label: `${getPermissionName(item)}${getText(item, ["path"], "") ? `（${getText(item, ["path"], "")}）` : ""}`,
      value: String(getId(item)),
    })),
]);
const currentMenuParentLabel = computed(() => menuParentOptions.value.find((item) => item.value === String(menuForm.parentId || "0"))?.label || "根节点");
const menuParentIds = computed(() => {
  const parentIds = new Set<string | number>();
  menus.value.forEach((item, index) => {
    const nextItem = menus.value[index + 1];
    const id = getId(item);
    if (isValidId(id) && nextItem && getTreeLevel(nextItem) > getTreeLevel(item)) {
      parentIds.add(id);
    }
  });
  return parentIds;
});
const visibleMenus = computed(() => {
  if (filters.keyword.trim()) {
    return menus.value;
  }

  const ancestorExpansion: boolean[] = [];
  return menus.value.filter((item) => {
    const level = Math.max(1, getTreeLevel(item));
    ancestorExpansion.length = level - 1;
    const isVisible = ancestorExpansion.every(Boolean);
    ancestorExpansion[level - 1] = isMenuExpanded(item);
    return isVisible;
  });
});
const selectableMenuIds = computed(() => menus.value.map((item) => getId(item)).filter((id) => isValidId(id) && !isLocalMenuId(id)));
const areAllCurrentMenusSelected = computed(() => {
  const ids = selectableMenuIds.value;
  return ids.length > 0 && ids.every((id) => selectedMenuIds.value.includes(id));
});
const availableUserPartitionOptions = computed(() =>
  partitionOptions.value.filter((item) => {
    const id = getId(item);
    return id && !selectedUserPartitionIds.value.includes(String(id));
  }),
);
const isAllUserPartitionDraftSelected = computed(() => {
  const ids = availableUserPartitionOptions.value.map((item) => getId(item)).filter(isValidId);
  return ids.length > 0 && ids.every((id) => userPartitionDraftIds.value.includes(String(id)));
});
const isSuperAdminSelected = computed(() =>
  selectedRoleIds.value.some((id) => {
    const role = roles.value.find((item) => String(getId(item)) === String(id));
    return role ? isSuperAdminRole(role) : false;
  }),
);
const canDelete = computed(() => {
  if (props.mode === "user") {
    return Boolean(getId(selectedUser.value));
  }
  if (props.mode === "auth") {
    return Boolean(getId(selectedRole.value));
  }
  if (props.mode === "menu") {
    const id = getId(selectedMenu.value);
    return Boolean(id && !isLocalMenuId(id));
  }
  return Boolean(getId(selectedDictItem.value) || getId(selectedDictType.value));
});
const metricCards = computed(() => {
  if (props.mode === "user") {
    return [
      { label: "用户总数", value: String(total.value || users.value.length) },
      { label: "启用账号", value: String(users.value.filter((item) => Number(getValue(item, ["status"]) ?? 1) === 1).length) },
      { label: "角色数量", value: String(roles.value.length) },
      { label: "当前分区", value: orgOptions.value.find((item) => item.value === activeOrg.value)?.label || "全部用户" },
    ];
  }

  if (props.mode === "auth") {
    return [
      { label: "角色数量", value: String(total.value || roles.value.length) },
      { label: "权限节点", value: String(permissions.value.length) },
      { label: "已选权限", value: String(selectedPermissionIds.value.length) },
      { label: "菜单资源", value: String(permissions.value.filter((item) => Number(getValue(item, ["permissionType"])) === 1).length) },
    ];
  }

  if (props.mode === "menu") {
    return [
      { label: "菜单资源", value: String(total.value || menus.value.length) },
      { label: "启用资源", value: String(menus.value.filter((item) => Number(getValue(item, ["status"]) ?? 1) === 1).length) },
      { label: "接口权限", value: String(menus.value.filter((item) => Number(getValue(item, ["permissionType"])) === 3).length) },
      { label: "按钮权限", value: String(menus.value.filter((item) => Number(getValue(item, ["permissionType"])) === 2).length) },
    ];
  }

  return [
    { label: "字典分类", value: String(dictTypes.value.length) },
    { label: "当前字典项", value: String(total.value || dictItems.value.length) },
    { label: "当前分类", value: selectedDictType.value ? getDictTypeName(selectedDictType.value) : "未选择" },
    { label: "选中字典键", value: selectedDictItem.value ? getDictItemCode(selectedDictItem.value) : "未选择" },
  ];
});

onMounted(() => {
  void refreshCurrent();
});

watch(
  () => props.mode,
  () => {
    resetFilters();
    void refreshCurrent();
  },
);

watch(
  () => pagination.pageNum,
  (pageNum) => {
    pageInputValue.value = String(pageNum);
  },
);

watch(
  () => pagination.pageSize,
  (pageSize) => {
    pageSizeInputValue.value = String(pageSize);
  },
);

function handleUserRegionFilterChange(event: { detail: { value: number } }) {
  filters.region = userRegionFilterOptions[event.detail.value]?.value || "";
}

function handleUserFormStatusChange(event: { detail: { value: number } }) {
  userForm.status = recordStatusOptions[event.detail.value]?.value ?? 1;
}

function handleUserRegionChange(event: { detail: { value: number } }) {
  userForm.region = userRegionOptions[event.detail.value]?.value || "国内";
}

function handleMenuStatusChange(event: { detail: { value: number } }) {
  menuForm.status = recordStatusOptions[event.detail.value]?.value ?? 1;
}

function handleMenuTypeChange(event: { detail: { value: number } }) {
  menuForm.permissionType = permissionTypeOptions[event.detail.value]?.value ?? 1;
}

function handleMenuParentChange(event: { detail: { value: number } }) {
  menuForm.parentId = menuParentOptions.value[event.detail.value]?.value || "0";
}

function selectOrg(value: string) {
  collapseUserDetail();
  activeOrg.value = value;
  pagination.pageNum = 1;
  void loadUsers();
}

function searchCurrent() {
  if (props.mode === "user") {
    collapseUserDetail();
  }
  pagination.pageNum = 1;
  void refreshCurrent();
}

function changePage(step: number) {
  jumpToPage(pagination.pageNum + step);
}

function commitPageInput() {
  const inputPage = Number(pageInputValue.value);
  if (!Number.isFinite(inputPage)) {
    pageInputValue.value = String(pagination.pageNum);
    return;
  }

  jumpToPage(inputPage);
}

function commitPageSizeInput() {
  const nextPageSize = normalizePageSize(pageSizeInputValue.value, pagination.pageSize);
  pageSizeInputValue.value = String(nextPageSize);
  if (nextPageSize === pagination.pageSize) {
    return;
  }

  pagination.pageSize = nextPageSize;
  pagination.pageNum = 1;
  pageInputValue.value = "1";
  collapseUserDetail();
  void loadUsers();
}

function normalizePageSize(value: unknown, fallback: number) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(numberValue), 1), 500);
}

function jumpToPage(page: number) {
  const nextPage = Math.min(Math.max(Math.trunc(page), 1), userTotalPages.value);
  pageInputValue.value = String(nextPage);

  if (nextPage === pagination.pageNum) {
    return;
  }

  pagination.pageNum = nextPage;
  collapseUserDetail();
  void loadUsers();
}

function resetFilters() {
  filters.keyword = "";
  filters.region = "";
  pagination.pageNum = 1;
}

function normalizeId(value: unknown) {
  const id = isObject(value) ? getId(value) : value;
  return isValidId(id) ? String(id) : "";
}

function normalizeIds(values: unknown[]): string[] {
  return values.map(normalizeId).filter(Boolean);
}
async function refreshCurrent() {
  if (props.mode === "user") {
    await Promise.all([
      loadUsers(),
      loadRoles(),
      loadPartitions(),
      loadAllUsersForPartitionStats(),
    ]);
    return;
  }

  if (props.mode === "auth") {
    await Promise.all([loadRolesPage(), loadPermissions()]);
    return;
  }

  if (props.mode === "menu") {
    await loadMenus();
    return;
  }

  await loadDictTypes();
}

async function handleRefresh() {
  if (refreshing.value) {
    return;
  }

  refreshing.value = true;
  try {
    await Promise.all([
      refreshCurrent(),
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);
  } finally {
    refreshing.value = false;
  }
}

async function loadUserDepts(userId: string | number) {
  if (!userId) return;

  try {
    const response = await getUserDepts(userId);
    assertSuccessResponse(response as ApiResponseLike);
    selectedUserPartitionIds.value = normalizeIds(parseListResponse(response as ApiResponseLike));
    syncSuperAdminPartitions();
  
  } catch {
    // 查询失败时保留 /api/user/page 返回的部门兜底数据
  }
}

function getDeptUsersFromDetail(response: ApiResponseLike, deptRecord: RecordLike) {
  const data = isObject(response?.data) ? response.data : {};

  const rawUsers = getFirstArray(data, [
    "users",
    "userList",
    "userVOList",
    "members",
    "userRecords",
  ]);
  // console.log("rawUsers", rawUsers, deptRecord);
  return rawUsers
    .map((item) => (isObject(item) ? item : { value: item }))
    .map((user) => {
      const existingDepts = getArrayValue(user, ["depts", "departments", "partitions"]);
      if (existingDepts.length) return user;

      return {
        ...user,
        depts: [deptRecord],
        deptId: getId(deptRecord),
        deptName: getPartitionName(deptRecord),
      };
    });
}
function filterUsersByKeywordAndRegion(records: RecordLike[], keyword: string) {
  return records.filter((user) => {
    const keywordMatched = !keyword || [
      getText(user, ["username"], ""),
      getText(user, ["realName", "name"], ""),
      getText(user, ["phone"], ""),
      getText(user, ["email"], ""),
      getUserRoleNames(user),
      getUserDeptNames(user),
    ].some((value) => value.includes(keyword));

    const regionMatched = !filters.region || getText(user, ["region"], "国内") === filters.region;

    return keywordMatched && regionMatched;
  });
}
function getUserRoleNames(item: RecordLike | null) {
  if (!item) return "-";

  const roleNames = getArrayValue(item, ["roles"])
    .map((role) => {
      if (!isObject(role)) return "";
      return getText(role, ["roleName", "name"], "");
    })
    .filter(Boolean);

  if (roleNames.length) {
    return roleNames[0];
  }

  return getText(item, ["roleName"], "-");
}

function getUserDeptNames(item: RecordLike | null) {
  if (!item) return "-";

  const deptNames = getArrayValue(item, ["depts", "departments", "partitions"])
    .map((dept) => {
      if (!isObject(dept)) return "";
      return getText(dept, ["deptName", "departmentName", "partitionName", "name"], "");
    })
    .filter(Boolean);

  if (deptNames.length) {
    return deptNames.join("、");
  }

  return getText(item, ["deptName", "departmentName", "partitionName"], "-");
}
async function loadUsers() {
  loading.value = true;
  try {
    const keyword = filters.keyword.trim();

    if (activeOrg.value !== "all") {
      if (!allUsersForPartitionStats.value.length) {
        await loadAllUsersForPartitionStats();
      }

      const partitionId = String(activeOrg.value);
      const partitionName = getPartitionNameById(partitionId);

      const deptUsers = allUsersForPartitionStats.value.filter((user) =>
        userMatchesPartition(user, partitionId, partitionName),
      );

      const filteredUsers = filterUsersByKeywordAndRegion(deptUsers, keyword);
      const pageStart = (pagination.pageNum - 1) * pagination.pageSize;

      users.value = filteredUsers.slice(pageStart, pageStart + pagination.pageSize);
      total.value = filteredUsers.length;
      selectUser(users.value[0] || null, false);
      return;
    }

    const response = await getUserPage(removeEmptyFields({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      username: keyword || undefined,
      realName: keyword || undefined,
      phone: keyword || undefined,
      region: filters.region || undefined,
    })) as ApiResponseLike;

    assertSuccessResponse(response);

    const parsed = parsePageResponse(response);
    users.value = parsed.records;
    total.value = parsed.total > 0 ? parsed.total : parsed.records.length;
    selectUser(users.value[0] || null, false);
  } catch (error) {
    users.value = [];
    total.value = 0;
    selectUser(null, false);
    toastError(error, "用户数据加载失败");
  } finally {
    loading.value = false;
  }
}
async function loadRoles() {
  try {
    const response = await getRoleList() as ApiResponseLike;
    assertSuccessResponse(response);
    roles.value = parseListResponse(response);
    syncSuperAdminPartitions();
  } catch {
    roles.value = [];
  }
}

async function loadPartitions() {
  try {
    const response = await getRegionList() as ApiResponseLike;
    assertSuccessResponse(response);
    partitionOptions.value = parseListResponse(response);
    syncSuperAdminPartitions();
    // console.log("partitionOptions.value", partitionOptions.value);
  } catch {
    partitionOptions.value = [];
  }
}

async function loadAllUsersForPartitionStats(keyword = "") {
  try {
    const response = await getUserList() as ApiResponseLike;
    assertSuccessResponse(response);

    allUsersForPartitionStats.value = parseListResponse(response);
  } catch {
    allUsersForPartitionStats.value = [];
  }
}

async function loadRolesPage() {
  loading.value = true;
  try {
    const keyword = filters.keyword.trim();
    const response = await getRolePage(removeEmptyFields({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      roleName: keyword || undefined,
      roleCode: keyword || undefined,
    })) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    roles.value = parsed.records;
    total.value = parsed.total;
    selectRole(roles.value[0] || null);
  } catch (error) {
    roles.value = [];
    total.value = 0;
    selectRole(null);
    toastError(error, "角色数据加载失败");
  } finally {
    loading.value = false;
  }
}

async function loadPermissions() {
  permissionLoadError.value = "";
  try {
    let records = [] as RecordLike[];

    try {
      const treeResponse = await getPermissionTree() as ApiResponseLike;
      assertSuccessResponse(treeResponse);
      records = toTreeRows(parseListResponse(treeResponse));
    } catch {
      records = [];
    }

    if (!records.length) {
      const listResponse = await getPermissionList() as ApiResponseLike;
      assertSuccessResponse(listResponse);
      records = toTreeRows(parseListResponse(listResponse));
    }

    records = records.filter(item => !(isStaleDefaultMenu(item) && Number(item.status) === 0));
    if (records.length) {
      permissions.value = records;
      permissionSource.value = "api";
      if (selectedRole.value) {
        applyRolePermissionSelection(selectedRole.value);
      }
    } else {
      permissions.value = getDefaultMenuResources();
      permissionSource.value = "local";
    }
  } catch (error) {
    permissions.value = getDefaultMenuResources();
    permissionSource.value = "local";
    const cause = error as { msg?: string; message?: string };
    permissionLoadError.value = cause?.msg || cause?.message || localeText("权限资源加载失败", "Failed to load permission resources");
  }
}

async function loadMenus() {
  loading.value = true;
  menuLoadError.value = "";
  try {
    const keyword = filters.keyword.trim();
    const treeResponse = await getMenuTree({ keyword }) as ApiResponseLike;
    assertSuccessResponse(treeResponse);
    const treeRecords = toTreeRows(parseListResponse(treeResponse));

    if (treeRecords.length) {
      menus.value = treeRecords;
      total.value = treeRecords.length;
      menuSource.value = "api";
    } else {
      const pageResponse = await getMenuPage(removeEmptyFields({
        pageNum: pagination.pageNum,
        pageSize: pagination.pageSize,
        permissionName: keyword || undefined,
      })) as ApiResponseLike;
      assertSuccessResponse(pageResponse);
      const parsed = parsePageResponse(pageResponse);
      if (parsed.records.length) {
        menus.value = toTreeRows(parsed.records);
        total.value = menus.value.length;
        menuSource.value = "api";
      } else {
        menus.value = getDefaultMenuResources(keyword);
        total.value = menus.value.length;
        menuSource.value = "local";
      }
    }

    expandedMenuIds.value = [];
    selectMenu(menus.value[0] || null);
    syncSelectedMenuIds();
  } catch (error) {
    const cause = error as { msg?: string; message?: string };
    menuLoadError.value = cause?.msg || cause?.message || localeText("菜单数据加载失败", "Failed to load menus");
    const keyword = filters.keyword.trim();
    menus.value = getDefaultMenuResources(keyword);
    total.value = menus.value.length;
    menuSource.value = "local";
    expandedMenuIds.value = [];
    selectMenu(menus.value[0] || null);
    syncSelectedMenuIds();
    toastError(error, "菜单数据加载失败");
  } finally {
    loading.value = false;
  }
}

async function loadDictTypes() {
  loading.value = true;
  try {
    const keyword = filters.keyword.trim();
    const response = await getDictTypePage(removeEmptyFields({
      pageNum: 1,
      pageSize: 100,
      dictCode: keyword || undefined,
      dictName: keyword || undefined,
    })) as ApiResponseLike;
    assertSuccessResponse(response);
    dictTypes.value = parsePageResponse(response).records;
    selectDictType(dictTypes.value[0] || null);
  } catch (error) {
    dictTypes.value = [];
    dictItems.value = [];
    total.value = 0;
    selectDictType(null);
    toastError(error, "字典分类加载失败");
  } finally {
    loading.value = false;
  }
}

async function loadDictItems() {
  if (!selectedDictType.value) {
    dictItems.value = [];
    total.value = 0;
    selectDictItem(null);
    return;
  }

  loading.value = true;
  try {
    const typeId = getId(selectedDictType.value);
    const typeCode = getDictTypeCode(selectedDictType.value);
    const response = await getDictItemPage(removeEmptyFields({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      dictTypeId: typeId || undefined,
      dictType: typeCode || undefined,
      dictCode: typeCode || undefined,
      keyword: filters.keyword.trim() || undefined,
    })) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    dictItems.value = parsed.records;
    total.value = parsed.total;
    selectDictItem(dictItems.value[0] || null);
  } catch (error) {
    dictItems.value = [];
    total.value = 0;
    selectDictItem(null);
    toastError(error, "字典项加载失败");
  } finally {
    loading.value = false;
  }
}

function selectUser(item: RecordLike | null, openDetail = true) {
  selectedUser.value = item;
  userLogoChanged.value = false;
  isCreating.value = false;
  if (openDetail && item) {
    isUserDetailOpen.value = true;
  }
  showUserPassword.value = false;
  Object.assign(userForm, {
    id: item ? String(getId(item)) : "",
    username: item ? getText(item, ["username"], "") : "",
    realName: item ? getText(item, ["realName", "name"], "") : "",
    phone: item ? getText(item, ["phone"], "") : "",
    email: item ? getText(item, ["email"], "") : "",
    password: "",
    status: Number(getValue(item || {}, ["status"]) ?? 1),
    region: item ? getText(item, ["region"], "国内") : "国内",
    logoId: item ? String(getValue(item, ["logoId"]) ?? "") : "",
  });
  if (item) {
    selectedRoleIds.value = getUserRoleIdsFromPageRecord(item);
  } else {
    selectedRoleIds.value = [];
  }
  selectedUserPartitionIds.value = normalizeIds(getArrayValue(item || {}, ["deptIds", "departmentIds", "partitionIds", "depts", "departments", "partitions"]));
  syncSuperAdminPartitions();

  userPartitionDraftIds.value = [];
  showUserPartitionDialog.value = false;

  if (item) {
    void loadUserDepts(getId(item));
  }
}

function getUserRoleIdsFromPageRecord(item: RecordLike | null) {
  if (!item) {
    return [];
  }

  const roleIds  = getArrayValue(item, ["roleIds", "roles"])
    .map((value) => (isObject(value) ? getId(value) : value))
    .filter(isValidId);

  if (roleIds.length) {
    return [roleIds[0]];
  }

  const roleCode = getText(item, ["roleCode"], "");
  const roleName = getText(item, ["roleName"], "");

  const matchedRole = roles.value.find((role) => {
    const codeMatched = roleCode && getText(role, ["roleCode"], "") === roleCode;
    const nameMatched = roleName && getText(role, ["roleName"], "") === roleName;
    return codeMatched || nameMatched;
  });

  const matchedId = matchedRole ? getId(matchedRole) : "";
  return isValidId(matchedId) ? [matchedId] : [];

}


function toggleUserPasswordVisibility() {
  showUserPassword.value = !showUserPassword.value;
}

function selectRole(item: RecordLike | null) {
  selectedRole.value = item;
  isCreating.value = false;
  Object.assign(roleForm, {
    id: item ? String(getId(item)) : "",
    roleName: item ? getText(item, ["roleName"], "") : "",
    roleCode: item ? getText(item, ["roleCode"], "") : "",
    description: item ? getText(item, ["description"], "") : "",
    sort: item ? getText(item, ["sort"], "0") : "0",
  });
  applyRolePermissionSelection(selectedRole.value);

  const roleId = item ? getId(item) : "";
  if (isValidId(roleId)) {
    void hydrateSelectedRolePermissions(roleId);
  } else {
    rolePermissionRequestToken += 1;
  }
}

function extractRolePermissionIds(item: RecordLike | null) {
  return getArrayValue(item || {}, ["permissionIds", "permissions"])
    .map((value) => {
      if (!isObject(value)) {
        return value;
      }

      return (
        getValue(value, ["id", "permissionId", "menuId", "resourceId", "authId"]) ??
        getId(value)
      );
    })
    .filter(isValidId);
}

function extractRolePermissionCodes(item: RecordLike | null) {
  return getArrayValue(item || {}, ["permissions"])
    .map((value) => (isObject(value) ? getText(value, ["permissionCode", "code"], "") : typeof value === "string" ? value : ""))
    .filter(Boolean);
}

function resolveRolePermissionSelection(item: RecordLike | null) {
  const directIds = extractRolePermissionIds(item);
  const directIdSet = new Set(directIds.map((value) => String(value)));
  const permissionCodeSet = new Set(extractRolePermissionCodes(item).map((value) => value.toLowerCase()));

  if (!permissions.value.length) {
    return directIds;
  }

  const matchedIds = permissions.value
    .map((permission) => {
      const permissionId = getId(permission);
      const permissionCode = getText(permission, ["permissionCode", "code"], "").toLowerCase();
      const matchesById = isValidId(permissionId) && directIdSet.has(String(permissionId));
      const matchesByCode = permissionCode && permissionCodeSet.has(permissionCode);
      return matchesById || matchesByCode ? permissionId : "";
    })
    .filter(isValidId);

  return matchedIds.length ? matchedIds : directIds;
}

function applyRolePermissionSelection(
    roleWithPermissions: RecordLike | null,
  ): void {
    const resolvedIds =
      resolveRolePermissionSelection(roleWithPermissions);

    // 权限树尚未加载时，先保留接口返回的原始 ID。
    if (!permissions.value.length) {
      selectedPermissionIds.value = resolvedIds;
      return;
    }

    const selectedIdSet = new Set(
      resolvedIds.map((id) => String(id)),
    );

    // 同步父节点：
    syncParentPermissionSelection(selectedIdSet);

    selectedPermissionIds.value =
      normalizeSelectedPermissionIds(selectedIdSet);
}

async function hydrateSelectedRolePermissions(roleId: string | number): Promise<void> {
  const requestToken = ++rolePermissionRequestToken;
  rolePermissionLoading.value = true;
  rolePermissionError.value = "";

  try {
    const response = await getRolePermissions(roleId) as ApiResponseLike;
    assertSuccessResponse(response);

    if (requestToken !== rolePermissionRequestToken || String(getId(selectedRole.value)) !== String(roleId)) {
      return;
    }

    const rolePermissions = Array.isArray(response.data) ? response.data : parseListResponse(response);
    const roleWithPermissions: RecordLike = {
      ...(selectedRole.value || {}),
      permissions: rolePermissions,
    };
    
    selectedRole.value = roleWithPermissions;
    applyRolePermissionSelection(roleWithPermissions);
  } catch (error){
    if (requestToken === rolePermissionRequestToken &&String(getId(selectedRole.value)) === String(roleId)) {
      selectedPermissionIds.value =[];
      rolePermissionError.value = localeText("角色权限读取失败，请刷新后再保存", "Failed to read role permissions. Refresh before saving.");
      toastError(error, "加载角色权限失败");
    }
  } finally {
    if (requestToken === rolePermissionRequestToken) rolePermissionLoading.value = false;
  }
}

function selectMenu(item: RecordLike | null) {
  selectedMenu.value = item;
  isCreating.value = false;
  Object.assign(menuForm, {
    id: item ? String(getId(item)) : "",
    permissionName: item ? getPermissionName(item) : "",
    permissionCode: item ? getText(item, ["permissionCode"], "") : "",
    path: item ? getText(item, ["path"], "") : "",
    parentId: item ? getText(item, ["parentId"], "0") : "0",
    permissionType: Number(getValue(item || {}, ["permissionType"]) ?? 1),
    status: Number(getValue(item || {}, ["status"]) ?? 1),
  });
}

function canSelectMenuForBatch(item: RecordLike) {
  const id = getId(item);
  return isValidId(id) && !isLocalMenuId(id);
}

function syncSelectedMenuIds() {
  const availableIds = new Set(selectableMenuIds.value.map((id) => String(id)));
  selectedMenuIds.value = selectedMenuIds.value.filter((id) => availableIds.has(String(id)));
}

function toggleMenuSelection(item: RecordLike) {
  if (!canSelectMenuForBatch(item)) {
    uni.showToast({ title: "本地菜单预览不能删除，请先同步到后端", icon: "none" });
    return;
  }

  const id = getId(item);
  selectedMenuIds.value = selectedMenuIds.value.includes(id)
    ? selectedMenuIds.value.filter((itemId) => itemId !== id)
    : [...selectedMenuIds.value, id];
}

function toggleAllCurrentMenus() {
  const ids = selectableMenuIds.value;
  if (!ids.length) {
    uni.showToast({ title: "暂无可批量删除的后端菜单", icon: "none" });
    return;
  }

  selectedMenuIds.value = areAllCurrentMenusSelected.value ? [] : ids;
}

function selectDictType(item: RecordLike | null) {
  selectedDictType.value = item;
  isCreating.value = false;
  dictCreateTarget.value = "item";
  Object.assign(dictTypeForm, {
    id: item ? String(getId(item)) : "",
    code: item ? getDictTypeCode(item) : "",
    name: item ? getDictTypeName(item) : "",
    remark: item ? getText(item, ["remark"], "") : "",
  });
  void loadDictItems();
}

function selectDictItem(item: RecordLike | null) {
  selectedDictItem.value = item;
  if (item) {
    dictCreateTarget.value = "item";
  }
  Object.assign(dictItemForm, {
    id: item ? String(getId(item)) : "",
    code: item ? getDictItemCode(item) : "",
    name: item ? getDictItemName(item) : "",
    sort: item ? getText(item, ["sort"], "0") : "0",
    remark: item ? getText(item, ["remark"], "") : "",
  });
}

function startCreate() {
  isCreating.value = true;
  if (props.mode === "user") {
    selectUser(null, false);
    isCreating.value = true;
    isUserDetailOpen.value = true;
  } else if (props.mode === "auth") {
    selectRole(null);
    isCreating.value = true;
  } else if (props.mode === "menu") {
    selectMenu(null);
    isCreating.value = true;
  } else {
    startCreateDictItem();
  }
}

function startCreateDictType() {
  isCreating.value = true;
  dictCreateTarget.value = "type";
  selectedDictType.value = null;
  Object.assign(dictTypeForm, { id: "", code: "", name: "", remark: "" });
}

function startCreateDictItem() {
  isCreating.value = true;
  dictCreateTarget.value = "item";
  selectedDictItem.value = null;
  Object.assign(dictItemForm, { id: "", code: "", name: "", sort: "0", remark: "" });
}

function cancelEdit() {
  if (props.mode === "user") {
    collapseUserDetail();
  } else if (props.mode === "auth") {
    selectRole(selectedRole.value || roles.value[0] || null);
  } else if (props.mode === "menu") {
    selectMenu(selectedMenu.value || menus.value[0] || null);
  }
}

function collapseUserDetail() {
  isUserDetailOpen.value = false;
  showUserPartitionDialog.value = false;
}

function expandUserDetail() {
  isUserDetailOpen.value = true;
}

async function saveUser() {
  if (!userForm.username.trim() || !userForm.realName.trim() || (isCreating.value && !userForm.password.trim())) {
    uni.showToast({ title: "请填写账号、姓名和初始密码", icon: "none" });
    return;
  }

  if (isCreating.value && userForm.username.trim().length < 6) {
    uni.showToast({ title: "登录账号不能少于6位", icon: "none" });
    return;
  }

  if (isCreating.value && userForm.password.trim().length < 6) {
    uni.showToast({ title: "初始密码不能少于6位", icon: "none" });
    return;
  }

  saving.value = true;
  try {
    syncSuperAdminPartitions();
    let savedMessage = "用户信息已保存";
    let savedIcon: "success" | "none" = "success";
    const payload: RecordLike = {
      ...removeEmptyFields({
        username: userForm.username.trim(),
        realName: userForm.realName.trim(),
        phone: userForm.phone.trim(),
        email: userForm.email.trim(),
        password: userForm.password.trim(),
        status: userForm.status,
        region: userForm.region,
        deptIds: selectedUserPartitionIds.value,
      }),
    };
    const logoId = Number(userForm.logoId);
    if (userLogoChanged.value && userForm.logoId && !Number.isFinite(logoId)) {
      throw new Error("Logo ID 无效，请重新上传");
    }
    const response =
      isCreating.value || !userForm.id
        ? await register({
            username: userForm.username.trim(),
            password: userForm.password.trim(),
            realName: userForm.realName.trim() || undefined,
            phone: userForm.phone.trim() || undefined,
            email: userForm.email.trim() || undefined,
            status: userForm.status,
            region: userForm.region,
          } satisfies RegisterParams)
        : await updateUser(userForm.id, payload);
    assertSuccessResponse(response as ApiResponseLike);

    const roleAssignment = buildUserRoleAssignment(response, userForm.id, selectedRoleIds.value);
    if (roleAssignment) {
      await assignUserRoles(roleAssignment.userId, roleAssignment.roleIds);
    } else if (selectedRoleIds.value.length) {
      savedMessage = "用户已保存，后端未返回用户ID，请重新选择后绑定角色";
      savedIcon = "none";
    }
    const savedUserId = roleAssignment?.userId || userForm.id;
    if (userLogoChanged.value) {
      if (savedUserId) {
        const logoResponse = await updateAdminUserLogo(
          savedUserId,
          userForm.logoId ? logoId : 0,
        );
        assertSuccessResponse(logoResponse as ApiResponseLike);
      } else {
        savedMessage = "用户已保存，后端未返回用户ID，Logo 暂未绑定";
        savedIcon = "none";
      }
    }
    if (savedUserId) {
      await assignUserDepts(
        savedUserId, 
        selectedUserPartitionIds.value.map((id) => Number(id)).filter((id) => Number.isFinite(id)),
      );
    } else if (selectedUserPartitionIds.value.length) {
      savedMessage = "用户已保存，后端未返回用户ID，请重新选择后绑定分区";
      savedIcon = "none";
    }
    uni.showToast({ title: savedMessage, icon: savedIcon });
    syncCachedUserRegion(savedUserId);
    await refreshCurrent();
    collapseUserDetail();
  } catch (error) {
    toastError(error, "用户保存失败");
  } finally {
    saving.value = false;
  }
}

function syncCachedUserRegion(savedUserId: string | number) {
  const cachedUserInfo = uni.getStorageSync("userInfo");
  if (!isObject(cachedUserInfo) || String(getId(cachedUserInfo)) !== String(savedUserId)) {
    return;
  }

  const nextUserInfo: RecordLike = {
    ...cachedUserInfo,
    region: userForm.region,
    logoId: userForm.logoId ? Number(userForm.logoId) : null,
  };
  uni.setStorageSync("userInfo", nextUserInfo);
  updateCurrentUserLogoId(nextUserInfo.logoId);
  applyUserLocale(nextUserInfo);
}

function handleUserLogoModelChange(value: string) {
  userForm.logoId = value;
  userLogoChanged.value = true;
}

async function saveRole() {
  if (!roleForm.roleName.trim() || !roleForm.roleCode.trim()) {
    uni.showToast({ title: "请填写角色名称和编码", icon: "none" });
    return;
  }

  saving.value = true;
  try {
    const payload = removeEmptyFields({
      roleName: roleForm.roleName.trim(),
      roleCode: roleForm.roleCode.trim(),
      description: roleForm.description.trim(),
      sort: Number(roleForm.sort) || 0,
    });
    const response = isCreating.value || !roleForm.id ? await createRole(payload) : await updateRole(roleForm.id, payload);
    assertSuccessResponse(response as ApiResponseLike);
    uni.showToast({ title: "角色已保存", icon: "success" });
    await loadRolesPage();
  } catch (error) {
    toastError(error, "角色保存失败");
  } finally {
    saving.value = false;
  }
}

async function saveRolePermissions() {
  if (saving.value || rolePermissionLoading.value || rolePermissionError.value) {
    uni.showToast({ title: rolePermissionError.value || localeText("正在读取角色权限", "Loading role permissions"), icon: "none" });
    return;
  }
  if (!getId(selectedRole.value)) {
    uni.showToast({ title: "请先选择角色", icon: "none" });
    return;
  }
  if (permissionSource.value === "local" || selectedPermissionIds.value.some(isLocalMenuId)) {
    uni.showToast({ title: "请先在菜单管理中保存后端菜单资源，再给角色授权", icon: "none" });
    return;
  }
  const confirmed = await confirmAction({
    title: "保存权限",
    content: "保存后会覆盖当前角色可访问的菜单权限，确定继续吗？",
    confirmText: "保存",
  });
  if (!confirmed) {
    return;
  }

  saving.value = true;
  try {
    const response = await assignRolePermissions(getId(selectedRole.value), selectedPermissionIds.value);
    assertSuccessResponse(response as ApiResponseLike);
    uni.showToast({ title: "角色权限已保存，请相关账号重新登录", icon: "none" });
    await loadRolesPage();
  } catch (error) {
    toastError(error, "权限保存失败");
  } finally {
    saving.value = false;
  }
}

async function saveMenu() {
  if (!menuForm.permissionName.trim() || !menuForm.permissionCode.trim()) {
    uni.showToast({ title: "请填写菜单名称和权限编码", icon: "none" });
    return;
  }

  saving.value = true;
  try {
    const backendMenuMap = await loadBackendMenuCodeMap();
    const parentId = await resolveMenuParentIdForSave(menuForm.parentId, backendMenuMap);
    const payload = removeEmptyFields({
      permissionName: menuForm.permissionName.trim(),
      permissionCode: menuForm.permissionCode.trim(),
      path: menuForm.path.trim(),
      parentId,
      permissionType: menuForm.permissionType,
      status: menuForm.status,
    });
    const shouldCreate = isCreating.value || !menuForm.id || isLocalMenuId(menuForm.id);
    const response = shouldCreate ? await createMenu(payload) : await updateMenu(menuForm.id, payload);
    assertSuccessResponse(response as ApiResponseLike);
    uni.showToast({ title: "菜单已保存", icon: "success" });
    await loadMenus();
  } catch (error) {
    toastError(error, "菜单保存失败");
  } finally {
    saving.value = false;
  }
}

async function syncDefaultMenusToBackend() {
  if (saving.value) {
    return;
  }

  const confirmed = await confirmAction({
    title: "同步默认菜单",
    content: "同步会新增、更新前端默认菜单，并清理已移除的默认菜单，确定继续吗？",
    confirmText: "同步",
  });
  if (!confirmed) {
    return;
  }

  saving.value = true;
  uni.showLoading({ title: localeText("正在同步菜单", "Syncing menus") });
  try {
    const backendRecords = await loadBackendMenuRecords();
    const backendMenuMap = createBackendMenuCodeMap(backendRecords);
    const result = { created: 0, updated: 0, deleted: 0, skipped: 0 };

    for (const item of defaultMenuTree) {
      await ensureDefaultMenuNode(item, 0, backendMenuMap, result);
    }
    await pruneStaleDefaultMenus(backendRecords, backendMenuMap, result);
    await assertStaleDefaultMenusRemoved();

    await loadMenus();
    const changed = result.created + result.updated + result.deleted;
    uni.showToast({
      title: changed
        ? localeText(
            `同步完成：新增${result.created}个，更新${result.updated}个，删除${result.deleted}个`,
            `Synced: ${result.created} added, ${result.updated} updated, ${result.deleted} deleted`,
          )
        : localeText("菜单已是最新，无需更新", "Menus are already up to date"),
      icon: "none",
      duration: 3000,
    });
  } catch (error) {
    await loadMenus();
    toastError(error, "默认菜单同步失败");
  } finally {
    uni.hideLoading();
    saving.value = false;
  }
}

async function resolveMenuParentIdForSave(parentId: string | number, backendMenuMap: Map<string, RecordLike>) {
  if (!isLocalMenuId(parentId)) {
    return Number(parentId) || 0;
  }

  const localParent = findDefaultMenuById(parentId);
  if (!localParent) {
    return 0;
  }

  return ensureDefaultMenuNode(localParent, 0, backendMenuMap, undefined, false);
}

async function ensureDefaultMenuNode(
  item: RecordLike,
  parentId: string | number,
  backendMenuMap: Map<string, RecordLike>,
  result?: DefaultMenuSyncResult,
  includeChildren = true,
) {
  const permissionCode = getText(item, ["permissionCode"], "");
  const existed = permissionCode ? backendMenuMap.get(permissionCode) : undefined;
  let backendId = getId(existed);
  const payload = buildDefaultMenuPayload(item, parentId);

  if (backendId) {
    if (shouldUpdateDefaultMenu(existed, payload)) {
      const response = await updateMenu(backendId, payload);
      assertSuccessResponse(response as ApiResponseLike);
      if (permissionCode) {
        backendMenuMap.set(permissionCode, { ...existed, ...payload, id: backendId });
      }
      result && (result.updated += 1);
    } else {
      result && (result.skipped += 1);
    }
  } else {
    const response = await createMenu(payload);
    assertSuccessResponse(response as ApiResponseLike);
    backendId = getCreatedMenuId(response as ApiResponseLike);

    if (backendId && permissionCode) {
      backendMenuMap.set(permissionCode, { ...payload, id: backendId });
    }
    if (!backendId) {
      throw { msg: `菜单创建成功但未获取到菜单ID：${permissionCode || payload.permissionName}` };
    }
    result && (result.created += 1);
  }

  if (includeChildren) {
    const children = getArrayValue(item, ["children"]).filter(isObject);
    for (const child of children) {
      await ensureDefaultMenuNode(child, backendId || 0, backendMenuMap, result);
    }
  }

  return backendId || 0;
}

async function pruneStaleDefaultMenus(
  backendRecords: RecordLike[],
  backendMenuMap: Map<string, RecordLike>,
  result: DefaultMenuSyncResult,
) {
  const defaultCodes = new Set(toTreeRows(defaultMenuTree).map((item) => getText(item, ["permissionCode"], "")).filter(Boolean));
  const grouped = new Map<string, RecordLike[]>();
  const idsToDelete = new Set<string | number>();

  backendRecords.forEach((item) => {
    if (isStaleDefaultMenu(item) && Number(item.status) === 0) return;
    const code = getText(item, ["permissionCode"], "");
    const path = getText(item, ["path", "url", "routePath"], "");
    if (isStaleDefaultMenu(item)) {
      grouped.set(`__stale_path__${path}`, [...(grouped.get(`__stale_path__${path}`) || []), item]);
      return;
    }
    if (!code) {
      return;
    }
    grouped.set(code, [...(grouped.get(code) || []), item]);
  });

  for (const [code, records] of grouped) {
    if (isStaleDefaultMenu({ permissionCode: code }) || code.startsWith("__stale_path__")) {
      for (const item of records) {
        collectDeleteId(item, idsToDelete);
      }
      backendMenuMap.delete(code);
      continue;
    }

    if (!defaultCodes.has(code) || records.length <= 1) {
      continue;
    }

    const keptId = getId(backendMenuMap.get(code));
    const duplicates = records.filter((item, index) => {
      const id = getId(item);
      return keptId ? String(id) !== String(keptId) : index > 0;
    });

    for (const item of duplicates) {
      collectDeleteId(item, idsToDelete);
    }
  }

  if (idsToDelete.size) {
    const response = await batchDeleteMenu(Array.from(idsToDelete), true);
    assertSuccessResponse(response as ApiResponseLike);
    result.deleted += idsToDelete.size;
  }
}

function collectDeleteId(item: RecordLike, ids: Set<string | number>) {
  const id = getId(item);
  if (isValidId(id) && !isLocalMenuId(id)) {
    ids.add(id);
  }
}

function shouldUpdateDefaultMenu(existed: RecordLike | undefined, payload: RecordLike) {
  if (!existed) {
    return false;
  }

  return ["permissionName", "permissionCode", "path", "parentId", "permissionType", "status"].some((key) => {
    const current = getValue(existed, [key]);
    const next = getValue(payload, [key]);
    if (["parentId", "permissionType", "status"].includes(key)) {
      return Number(current || 0) !== Number(next || 0);
    }
    return String(current || "") !== String(next || "");
  });
}

function buildDefaultMenuPayload(item: RecordLike, parentId: string | number) {
  const rawPermissionType = Number(getValue(item, ["permissionType"]) ?? 1);

  return removeEmptyFields({
    // Backend menu names are data, not UI labels. Keep the source value stable
    // when syncing while getPermissionName() may return the current locale.
    permissionName: getText(item, ["permissionName", "menuName", "name"], ""),
    permissionCode: getText(item, ["permissionCode"], ""),
    path: getText(item, ["path"], ""),
    parentId: Number(parentId) || 0,
    // The backend contract has no directory type: 1=menu, 2=button, 3=interface.
    permissionType: rawPermissionType === 0 ? 1 : rawPermissionType,
    status: Number(getValue(item, ["status"]) ?? 1),
  });
}

function getCreatedMenuId(response: ApiResponseLike) {
  const candidates = [
    response?.data,
    (response as RecordLike)?.id,
    isObject(response?.data) ? response.data.data : undefined,
  ];

  for (const candidate of candidates) {
    const id = getResponseId(candidate);
    if (id) {
      return id;
    }
  }

  return "";
}

function getResponseId(value: unknown): string | number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  if (isObject(value)) {
    return getId(value);
  }
  return "";
}

async function loadBackendMenuCodeMap() {
  const records = await loadBackendMenuRecords();
  return createBackendMenuCodeMap(records);
}

function createBackendMenuCodeMap(records: RecordLike[]) {
  const map = new Map<string, RecordLike>();
  records.forEach((item) => {
    const code = getText(item, ["permissionCode"], "");
    if (code && !map.has(code)) {
      map.set(code, item);
    }
  });
  return map;
}

async function loadBackendMenuRecords() {
  try {
    const treeResponse = await getMenuTree({}) as ApiResponseLike;
    assertSuccessResponse(treeResponse);
    const treeRecords = toTreeRows(parseListResponse(treeResponse));
    if (treeRecords.length) {
      return treeRecords;
    }
  } catch {
    // tree接口不可用时继续尝试普通列表接口。
  }

  try {
    const listResponse = await getMenuList() as ApiResponseLike;
    assertSuccessResponse(listResponse);
    const listRecords = toTreeRows(parseListResponse(listResponse));
    if (listRecords.length) {
      return listRecords;
    }
  } catch {
    // list接口不可用时再降级使用分页接口。
  }

  const pageResponse = await getMenuPage({ pageNum: 1, pageSize: 100 }) as ApiResponseLike;
  assertSuccessResponse(pageResponse);
  return parsePageResponse(pageResponse).records;
}

async function assertStaleDefaultMenusRemoved() {
  const remaining = (await loadBackendMenuRecords()).filter(item => isStaleDefaultMenu(item) && Number(item.status) !== 0);
  if (!remaining.length) {
    return;
  }

  const details = remaining
    .map((item) => {
      const id = getId(item);
      const code = getText(item, ["permissionCode", "code"], "-");
      return `${code}${isValidId(id) ? ` (#${id})` : ""}`;
    })
    .join(", ");
  throw { msg: `旧菜单仍存在，删除未生效：${details}` };
}

function findDefaultMenuById(id: string | number) {
  return toTreeRows(defaultMenuTree).find((item) => getId(item) === id) || null;
}

async function saveDict() {
  saving.value = true;
  try {
    if (dictCreateTarget.value === "type" || !selectedDictType.value) {
      if (!dictTypeForm.code.trim() || !dictTypeForm.name.trim()) {
        uni.showToast({ title: "请填写分类编码和名称", icon: "none" });
        return;
      }

      const payload = removeEmptyFields({
        dictCode: dictTypeForm.code.trim(),
        dictType: dictTypeForm.code.trim(),
        dictName: dictTypeForm.name.trim(),
        typeName: dictTypeForm.name.trim(),
        remark: dictTypeForm.remark.trim(),
      });
      const response = isCreating.value || !dictTypeForm.id ? await createDictType(payload) : await updateDictType(dictTypeForm.id, payload);
      assertSuccessResponse(response as ApiResponseLike);
      uni.showToast({ title: "字典分类已保存", icon: "success" });
      await loadDictTypes();
      return;
    }

    if (!dictItemForm.code.trim() || !dictItemForm.name.trim()) {
      uni.showToast({ title: "请填写字典键和显示名称", icon: "none" });
      return;
    }

    const typeId = getId(selectedDictType.value);
    const typeCode = getDictTypeCode(selectedDictType.value);
    const payload = removeEmptyFields({
      dictTypeId: typeId || undefined,
      dictType: typeCode || undefined,
      dictCode: typeCode || undefined,
      itemCode: dictItemForm.code.trim(),
      dictKey: dictItemForm.code.trim(),
      value: dictItemForm.code.trim(),
      itemName: dictItemForm.name.trim(),
      dictValue: dictItemForm.name.trim(),
      label: dictItemForm.name.trim(),
      sort: Number(dictItemForm.sort) || 0,
      remark: dictItemForm.remark.trim(),
    });
    const response = isCreating.value || !dictItemForm.id ? await createDictItem(payload) : await updateDictItem(dictItemForm.id, payload);
    assertSuccessResponse(response as ApiResponseLike);
    uni.showToast({ title: "字典项已保存", icon: "success" });
    await loadDictItems();
  } catch (error) {
    toastError(error, "字典保存失败");
  } finally {
    saving.value = false;
  }
}

async function deleteSelectedMenus() {
  const ids = selectedMenuIds.value.filter((id) => isValidId(id) && !isLocalMenuId(id));
  if (!ids.length) {
    uni.showToast({ title: "请先选择要删除的菜单", icon: "none" });
    return;
  }

  const confirmed = await confirmDangerAction({
    title: "批量删除菜单",
    content: `确定删除选中的 ${ids.length} 个菜单吗？`,
  });

  if (!confirmed) {
    return;
  }

  saving.value = true;
  try {
    for (const id of ids) {
      await deleteMenu(id);
    }
    selectedMenuIds.value = [];
    uni.showToast({ title: "批量删除成功", icon: "success" });
    await loadMenus();
  } catch (error) {
    toastError(error, "批量删除失败");
  } finally {
    saving.value = false;
  }
}

async function deleteCurrent() {
  const confirmed = await confirmDangerAction({
    title: "删除确认",
    content: "删除后数据可能无法恢复，确定继续吗？",
  });
  if (!confirmed) {
    return;
  }

  saving.value = true;
  try {
    if (props.mode === "user" && getId(selectedUser.value)) {
      await deleteUser(getId(selectedUser.value));
      await loadUsers();
      collapseUserDetail();
    } else if (props.mode === "auth" && getId(selectedRole.value)) {
      await deleteRole(getId(selectedRole.value));
      await loadRolesPage();
    } else if (props.mode === "menu" && getId(selectedMenu.value)) {
      if (isLocalMenuId(getId(selectedMenu.value))) {
        uni.showToast({ title: "本地菜单预览不能删除，请先保存为后端资源", icon: "none" });
        return;
      }
      await deleteMenu(getId(selectedMenu.value));
      await loadMenus();
    } else if (props.mode === "dict" && getId(selectedDictItem.value)) {
      await deleteDictItem(getId(selectedDictItem.value));
      await loadDictItems();
    } else if (props.mode === "dict" && getId(selectedDictType.value)) {
      await deleteDictType(getId(selectedDictType.value));
      await loadDictTypes();
    }

    uni.showToast({ title: "删除成功", icon: "success" });
  } catch (error) {
    toastError(error, "删除失败");
  } finally {
    saving.value = false;
  }
}

async function clearPermissionSelection() {
  if (!selectedPermissionIds.value.length) {
    return;
  }

  const confirmed = await confirmAction({
    title: "清空权限选择",
    content: "确定清空当前已选择的权限吗？未保存的选择会丢失。",
    confirmText: "清空",
  });
  if (confirmed) {
    selectedPermissionIds.value = [];
  }
}

function toggleUserRole(id: string | number) {
  selectedRoleIds.value = selectedRoleIds.value.includes(id) ? [] : [id];
  syncSuperAdminPartitions();
}

function openUserPartitionDialog() {
  if (isSuperAdminSelected.value) {
    return;
  }
  userPartitionDraftIds.value = [];
  showUserPartitionDialog.value = true;
  if (!partitionOptions.value.length) {
    void loadPartitions();

  }
}

function closeUserPartitionDialog() {
  showUserPartitionDialog.value = false;
  userPartitionDraftIds.value = [];
}

function toggleUserPartitionDraft(id: string | number) {
  const normalizedId = normalizeId(id);
  if (normalizedId) {
    toggleId(userPartitionDraftIds.value, normalizedId);
  }
}

function toggleAllUserPartitionDraft() {
  const ids = availableUserPartitionOptions.value
    .map((item) => normalizeId(item))
    .filter(Boolean);
  userPartitionDraftIds.value = isAllUserPartitionDraftSelected.value ? [] : ids;
}

function confirmUserPartitionBinding() {
  const merged = new Set<string >(selectedUserPartitionIds.value);
  userPartitionDraftIds.value.forEach((id) => merged.add(String(id)));
  selectedUserPartitionIds.value = Array.from(merged);
  closeUserPartitionDialog();
}

function removeUserPartition(id: string | number) {
  if (isSuperAdminSelected.value) {
    return;
  }
  selectedUserPartitionIds.value = selectedUserPartitionIds.value.filter((item) => item !== String(id));
}

function isSuperAdminRole(item: RecordLike) {
  const values = [
    getText(item, ["roleCode", "code", "roleKey", "key"], ""),
    getRoleName(item),
  ].map((value) => value.trim().toLowerCase());

  return values.some((value) =>
    ["super_admin", "superadmin", "role_super_admin", "超级管理员"].includes(value),
  );
}

function getAllPartitionIds() {
  return partitionOptions.value.map((item) => normalizeId(item)).filter(Boolean);
}

function syncSuperAdminPartitions() {
  if (!isSuperAdminSelected.value) {
    return;
  }

  selectedUserPartitionIds.value = getAllPartitionIds();
  closeUserPartitionDialog();
}

const selectedPermissionIdSet = computed<Set<string>>(() =>
  new Set(selectedPermissionIds.value.map((id) => String(id))),
);

const areAllPermissionsChecked = computed<boolean>(() => {
  const ids = getPermissionCascadeIds(permissions.value);
  return ids.length > 0 && ids.every((id) => selectedPermissionIdSet.value.has(String(id)));
});

function togglePermission(item: RecordLike) :void{
  const id = getId(item);
  if (!isValidId(id)) return;

  const ids = getPermissionCascadeIds([item]);
  const nextIds = new Set(selectedPermissionIds.value.map((value) => String(value)));
  const shouldCheck = !ids.every((value) => nextIds.has(String(value)));

  ids.forEach((value) => {
    const key = String(value);
    if (shouldCheck) {
      nextIds.add(key);
    } else {
      nextIds.delete(key);
    }
  });
  syncParentPermissionSelection(nextIds);
  selectedPermissionIds.value = normalizeSelectedPermissionIds(nextIds);
}

function toggleAllPermissions() :void{
  const ids = getPermissionCascadeIds(permissions.value);
  if (!ids.length) return;

  if (areAllPermissionsChecked.value) {
    selectedPermissionIds.value = [];
    return;
  }
  const nextIds = new Set<string>(ids.map((id) => String(id)));
  syncParentPermissionSelection(nextIds);

  selectedPermissionIds.value = normalizeSelectedPermissionIds(nextIds);
}

function syncParentPermissionSelection(idSet: Set<string>): void {
  const rootItems = permissions.value.filter((item) => getTreeLevel(item) === 1);

  rootItems.forEach((item) => {
    syncPermissionNodeSelection(item, idSet);
  });
}

function syncPermissionNodeSelection(item: RecordLike, idSet: Set<string>): boolean {
  const id = getId(item);
  const children = getArrayValue(item, ["children"]).filter(isObject);

  if (!children.length) {
    return isValidId(id) && idSet.has(String(id));
  }

  const childStates = children.map((child) => syncPermissionNodeSelection(child, idSet));
  const allChildrenChecked = childStates.every(Boolean);

  if (isValidId(id)) {
    if (allChildrenChecked) {
      idSet.add(String(id));
    } else {
      idSet.delete(String(id));
    }
  }

  return allChildrenChecked;
}

function isPermissionChecked(item: RecordLike): boolean {
  const ids = getPermissionCascadeIds([item]);
  return ids.length > 0 && ids.every((id) => selectedPermissionIdSet.value.has(String(id)));
}

function isPermissionPartialChecked(item: RecordLike): boolean {
  const ids = getPermissionCascadeIds([item]);
  if (ids.length <= 1) return false;

  const checkedCount = ids.filter((id) => selectedPermissionIdSet.value.has(String(id))).length;
  return checkedCount > 0 && checkedCount < ids.length;
}

function getPermissionCascadeIds(items: RecordLike[]) : Array<string | number>{
  return items.flatMap((item: RecordLike) => {
    const id = getId(item);
    const children = getArrayValue(item, ["children"])
      .filter(isObject);

    return [
      ...(isValidId(id) ? [id] : []),
      ...getPermissionCascadeIds(children),
    ];
  });
}

function normalizeSelectedPermissionIds(idSet: Set<string>) {
  return permissions.value
    .map((item) => getId(item))
    .filter((id) => isValidId(id) && idSet.has(String(id)));
}
function toggleAlarm(value: string) {
  const index = selectedAlarmOptions.value.indexOf(value);
  if (index >= 0) {
    selectedAlarmOptions.value.splice(index, 1);
  } else {
    selectedAlarmOptions.value.push(value);
  }
}

function copyRole() {
  isCreating.value = true;
  roleForm.id = "";
  roleForm.roleName = roleForm.roleName ? `${roleForm.roleName}副本` : "";
  roleForm.roleCode = roleForm.roleCode ? `${roleForm.roleCode}_copy` : "";
}

function setDefaultRole() {
  uni.showToast({ title: "默认角色已标记，请保存后生效", icon: "none" });
}

function toggleId(list: Array<string | number>, id: string | number) {
  if (!isValidId(id)) {
    return;
  }

  const index = list.indexOf(id);
  if (index >= 0) {
    list.splice(index, 1);
  } else {
    list.push(id);
  }
}

function hasMenuChildren(item: RecordLike) {
  return menuParentIds.value.has(getId(item));
}

function isMenuExpanded(item: RecordLike) {
  return expandedMenuIds.value.includes(getId(item));
}

function toggleMenuExpanded(item: RecordLike) {
  const id = getId(item);
  if (!isValidId(id) || !hasMenuChildren(item)) {
    return;
  }

  toggleId(expandedMenuIds.value, id);
}

function flattenTree(records: RecordLike[], level = 1): RecordLike[] {
  return sortFrontendMenuResources(records).flatMap((item) => {
    const children = getFirstArray(item, ["children", "childList", "nodes"]).map((child) => (isObject(child) ? child : { value: child }));
    const descendants = flattenTree(children, level + 1);
    const directChildren = descendants.filter((child) => getTreeLevel(child) === level + 1);
    return [{ ...item, children: directChildren, __level: level }, ...descendants];
  });
}

function toTreeRows(records: RecordLike[]) {
  const source = sortFrontendMenuResources(records.filter(isObject));
  if (source.some(hasTreeChildren)) {
    return flattenTree(source);
  }

  return flattenByParentId(source);
}

function flattenByParentId(records: RecordLike[]) {
  const idSet = new Set(records.map((item) => getTreeKey(getId(item))).filter(Boolean));
  const childrenMap = new Map<string, RecordLike[]>();
  const roots: RecordLike[] = [];

  records.forEach((item) => {
    const parentKey = getTreeKey(getValue(item, ["parentId", "parent_id", "pid"]));
    if (!parentKey || parentKey === "0" || !idSet.has(parentKey)) {
      roots.push(item);
      return;
    }

    const siblings = childrenMap.get(parentKey) || [];
    siblings.push(item);
    childrenMap.set(parentKey, siblings);
  });

  const visited = new Set<string>();
  const walk = (items: RecordLike[], level: number): RecordLike[] =>
    items.flatMap((item) => {
      const id = getId(item);
      const key = getTreeKey(id);
      if (key && visited.has(key)) {
        return [];
      }
      if (key) {
        visited.add(key);
      }
      const children = key ? childrenMap.get(key) || [] : [];
      const descendants = walk(children, level + 1);
      const directChildren = descendants.filter((child) => getTreeLevel(child) === level + 1);
      return [{ ...item, __level: level, children: directChildren }, ...descendants];
    });

  const rootRows = walk(roots, 1);
  const orphanRows = records
    .filter((item) => {
      const key = getTreeKey(getId(item));
      return key && !visited.has(key);
    })
    .map((item) => ({ ...item, __level: 1 }));
  return [...rootRows, ...orphanRows];
}

function getTreeKey(value: unknown) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "";
  }
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function hasTreeChildren(item: RecordLike) {
  return getFirstArray(item, ["children", "childList", "nodes"]).length > 0 || getArrayValue(item, ["children"]).length > 0;
}

function getDefaultMenuResources(keyword = "") {
  const records = toTreeRows(defaultMenuTree).map((item) => ({ ...item, __localMenu: true }));
  const normalizedKeyword = keyword.trim().toLowerCase();
  if (!normalizedKeyword) {
    return records;
  }

  return records.filter((item) =>
    [getPermissionName(item), getText(item, ["permissionCode"], ""), getText(item, ["path"], "")]
      .some((value) => value.toLowerCase().includes(normalizedKeyword)),
  );
}

function isLocalMenuId(value: unknown) {
  return typeof value === "string" && value.startsWith(LOCAL_MENU_ID_PREFIX);
}

function getRoleName(item: RecordLike) {
  return getText(item, ["roleName", "name"], "未命名角色");
}

function getPartitionName(item: RecordLike) {
  return getText(item, ["deptName", "departmentName", "partitionName", "name", "label"], "未命名分区");
}

function getPartitionNameById(id: string | number) {
  const normalizedId = String(id);
  const partition = partitionOptions.value.find((item) => String(getId(item)) === normalizedId);
  // console.log("getPartitionNameById", normalizedId, partition);
  return partition ? getPartitionName(partition) : `分区 ${normalizedId}`;
}

function userMatchesPartition(user: RecordLike, partitionId: string, partitionName: string) {
  const directId = getText(user, ["deptId", "departmentId", "partitionId"], "");
  if (directId && String(directId) === partitionId) {
    return true;
  }

  const ids = getArrayValue(user, ["deptIds", "departmentIds", "partitionIds"]).map(String);
  if (ids.includes(partitionId)) {
    return true;
  }

  const depts = getArrayValue(user, ["depts", "departments", "partitions"]);
  if (depts.some((dept) => {
    if (!isObject(dept)) return false;

    const deptId = getId(dept);
    const deptName = getPartitionName(dept);

    return String(deptId) === partitionId || Boolean(partitionName && deptName === partitionName);
  })) {
    return true;
  }

  const text = getText(user, ["deptName", "departmentName", "partitionName", "location", "address"], "");
  return Boolean(partitionName && text.includes(partitionName));
}

function getPermissionName(item: RecordLike) {
  const frontendMenu = getFrontendMenuByCode(getText(item, ["permissionCode", "code"], "").trim().toLowerCase());
  if (frontendMenu) return frontendMenuT(frontendMenu.labelKey);
  const permissionCode = getText(item, ["permissionCode", "code"], "").trim().toLowerCase();
  const permissionPath = getText(item, ["path", "url", "routePath"], "").trim().toLowerCase();
  const localizedNameMap: Record<string, [string, string]> = {
    "page:favorite": ["我的收藏", "Favorites"],
    "page:leak-monitor": ["渗漏监测", "Leak Monitor"],
    "page:water-hammer": ["水锤分析", "Water Hammer"],
    "page:partition": ["分区管理", "Partitions"],
    "module:device": ["设备管理", "Devices"],
    "page:device:info": ["设备信息", "Device Info"],
    "page:device:maintenance": ["拆装维护", "Maintenance"],
    "page:device:settings": ["设备参数", "Parameters"],
    "page:device:valve": ["阀门管理", "Valves"],
    "module:system": ["系统设置", "System"],
    "page:system:user": ["用户配置", "Users"],
    "page:system:auth": ["权限管理", "Permissions"],
    "page:system:menu": ["菜单管理", "Menus"],
    "page:system:search": ["查询模板", "Search Templates"],
    "page:system:dict": ["数据字典", "Dictionary"],
    "module:command": ["指令管理", "Commands"],
    "page:command:manage": ["指令管理", "Command List"],
    "page:command:configuration": ["指令配置", "Command Setup"],
    "module:data-analysis": ["数据分析", "Data Analysis"],
    "page:data-analysis:audio": ["音频数据", "Audio Data"],
    "page:data-analysis:leakage": ["渗漏数据", "Leak Data"],
    "module:leak-report": ["疑漏点上报", "Leak Reports"],
    "page:leak-report:suspect-management": ["疑点管理", "Suspects"],
    "page:leak-report:suspect-processing": ["疑点处理", "Suspect Review"],
    "page:leak-report:leak-management": ["漏点管理", "Leaks"],
    "page:leak-report:leak-analysis": ["漏点分析", "Leak Analysis"],
    "module:statistics": ["统计分析", "Statistics"],
    "page:leak-report:history-overview": ["疑漏模块总览", "Leak Overview"],
    "page:data-analysis:overview": ["数据系统总览", "System Overview"],
    "module:work-order": ["工单管理", "Work Orders"],
    "page:work-order:create": ["工单创建", "Create Order"],
    "page:work-order:processing": ["工单处理", "Process Orders"],
    "module:alarm": ["实时报警", "Alarms"],
    "page:alarm:strategy": ["报警策略", "Alarm Rules"],
    "page:alarm:processing": ["报警处理", "Alarm Management"],
    "module:report": ["运维报表", "Operations Reports"],
    "page:report:device-resume": ["设备履历", "Device History"],
    "page:report:device-ledger": ["设备台账", "Device Ledger"],
    "page:report:battery-health": ["电池健康度", "Battery Health"],
    "page:report:operation-analysis": ["运行分析报告", "Operations Analysis"],
    "module:leak-burst": ["渗漏爆管", "Leak and Pipe Burst"],
    "page:leak-burst:identification": ["爆管识别", "Burst Identification"],
    "page:leak-burst:measurement-analysis": ["测点分析", "Measurement Analysis"],
    "page:leak-burst:leak-location": ["漏点定位", "Leak Localization"],
    "page:leak-burst:loss-report": ["漏损报表", "Loss Report"],
    "module:data-receive": ["数据接收和解析", "Data Intake"],
    "page:data-receive:protocol": ["协议管理", "Protocols"],
    "page:data-receive:parse": ["数据解析", "Parsing"],
    "page:data-receive:record": ["数据记录", "Records"],
  };
  const mapped = localizedNameMap[permissionCode];
  if (mapped) {
    return localeText(mapped[0], mapped[1]);
  }

  const pathMap: Record<string, [string, string]> = {
    "/pages/index/index": ["我的收藏", "Favorites"],
    "/pages/leak-monitor/leak-monitor": ["渗漏监测", "Leak Monitor"],
    "/pages/partition/partition": ["分区管理", "Partitions"],
    "/pages/device/info/info": ["设备信息", "Device Info"],
    "/pages/device/maintenance/maintenance": ["拆装维护", "Maintenance"],
    "/pages/device/parameter/parameter": ["设备参数", "Parameters"],
    "/pages/device/settings/settings": ["设备参数", "Parameters"],
    "/pages/device/valve/valve": ["阀门管理", "Valves"],
    "/pages/system/user/user": ["用户配置", "Users"],
    "/pages/system/auth/auth": ["权限管理", "Permissions"],
    "/pages/system/menu/menu": ["菜单管理", "Menus"],
    "/pages/system/search/search": ["查询模板", "Search Templates"],
    "/pages/system/dict/dict": ["数据字典", "Dictionary"],
    "/pages/command/commandmanage": ["指令管理", "Command List"],
    "/pages/command/commandconfiguration": ["指令配置", "Command Setup"],
    "/pages/data-analysis/audio/audio": ["音频数据", "Audio Data"],
    "/pages/data-analysis/leakage/leakage": ["渗漏数据", "Leak Data"],
    "/pages/data-analysis/overview/overview": ["数据系统总览", "System Overview"],
    "/pages/leak-report/suspect-management/suspect-management": ["疑点管理", "Suspects"],
    "/pages/leak-report/suspect-processing/suspect-processing": ["疑点处理", "Suspect Review"],
    "/pages/leak-report/leak-management/leak-management": ["漏点管理", "Leaks"],
    "/pages/leak-report/leak-analysis/leak-analysis": ["漏点分析", "Leak Analysis"],
    "/pages/leak-report/history-overview/history-overview": ["疑漏模块总览", "Leak Overview"],
    "/pages/work-order/create/create": ["工单创建", "Create Order"],
    "/pages/work-order/processing/processing": ["工单处理", "Process Orders"],
    "/pages/alarm/strategy/strategy": ["报警策略", "Alarm Rules"],
    "/pages/alarm/processing/processing": ["报警处理", "Alarm Management"],
    "/pages/report/device-resume/device-resume": ["设备履历", "Device History"],
    "/pages/report/device-ledger/device-ledger": ["设备台账", "Device Ledger"],
    "/pages/report/battery-health/battery-health": ["电池健康度", "Battery Health"],
    "/pages/report/operation-analysis/operation-analysis": ["运行分析报告", "Operations Analysis"],
    "/pages/leak-burst/burst-identification/burst-identification": ["爆管识别", "Burst Identification"],
    "/pages/leak-burst/measurement-analysis/measurement-analysis": ["测点分析", "Measurement Analysis"],
    "/pages/leak-burst/leak-location/leak-location": ["漏点定位", "Leak Localization"],
    "/pages/leak-burst/loss-report/loss-report": ["漏损报表", "Loss Report"],
    "/pages/data-receive/access/access": ["协议管理", "Protocols"],
    "/pages/data-receive/parse/parse": ["数据解析", "Parsing"],
    "/pages/data-receive/record/record": ["数据记录", "Records"],
  };
  const pathMapped = pathMap[permissionPath];
  if (pathMapped) {
    return localeText(pathMapped[0], pathMapped[1]);
  }

  const rawName = getText(item, ["permissionName", "menuName", "name"], "未命名资源");
  const rawNameMap: Record<string, [string, string]> = {
    "我的收藏": ["我的收藏", "Favorites"],
    "渗漏监测": ["渗漏监测", "Leak Monitor"],
    "分区管理": ["分区管理", "Partitions"],
    "设备管理": ["设备管理", "Devices"],
    "设备信息": ["设备信息", "Device Info"],
    "拆装维护": ["拆装维护", "Maintenance"],
    "设备参数": ["设备参数", "Parameters"],
    "阀门管理": ["阀门管理", "Valves"],
    "系统设置": ["系统设置", "System"],
    "用户配置": ["用户配置", "Users"],
    "权限管理": ["权限管理", "Permissions"],
    "菜单管理": ["菜单管理", "Menus"],
    "查询模板": ["查询模板", "Search Templates"],
    "数据字典": ["数据字典", "Dictionary"],
    "指令管理": ["指令管理", "Command List"],
    "指令配置": ["指令配置", "Command Setup"],
    "数据分析": ["数据分析", "Data Analysis"],
    "音频数据": ["音频数据", "Audio Data"],
    "渗漏数据": ["渗漏数据", "Leak Data"],
    "疑漏点上报": ["疑漏点上报", "Leak Reports"],
    "疑点管理": ["疑点管理", "Suspects"],
    "疑点处理": ["疑点处理", "Suspect Review"],
    "漏点管理": ["漏点管理", "Leaks"],
    "漏点分析": ["漏点分析", "Leak Analysis"],
    "统计分析": ["统计分析", "Statistics"],
    "疑漏模块总览": ["疑漏模块总览", "Leak Overview"],
    "数据系统总览": ["数据系统总览", "System Overview"],
    "工单管理": ["工单管理", "Work Orders"],
    "工单创建": ["工单创建", "Create Order"],
    "工单处理": ["工单处理", "Process Orders"],
    "实时报警": ["实时报警", "Alarms"],
    "报警策略": ["报警策略", "Alarm Rules"],
    "报警处理": ["报警处理", "Alarm Management"],
    "运维报表": ["运维报表", "Operations Reports"],
    "设备履历": ["设备履历", "Device History"],
    "设备台账": ["设备台账", "Device Ledger"],
    "电池健康度": ["电池健康度", "Battery Health"],
    "运行分析报告": ["运行分析报告", "Operations Analysis"],
    "渗漏爆管": ["渗漏爆管", "Leak and Pipe Burst"],
    "爆管识别": ["爆管识别", "Burst Identification"],
    "测点分析": ["测点分析", "Measurement Analysis"],
    "漏损报表": ["漏损报表", "Loss Report"],
    "数据接收和解析": ["数据接收和解析", "Data Intake"],
    "协议管理": ["协议管理", "Protocols"],
    "数据解析": ["数据解析", "Parsing"],
    "数据记录": ["数据记录", "Records"],
  };
  const rawMapped = rawNameMap[rawName];
  return rawMapped ? localeText(rawMapped[0], rawMapped[1]) : rawName;
}

function getDictTypeCode(item: RecordLike) {
  return getText(item, ["dictCode", "dictType", "typeCode", "code"], "-");
}

function getDictTypeName(item: RecordLike) {
  return getText(item, ["dictName", "typeName", "name"], "未命名字典");
}

function getDictItemCode(item: RecordLike) {
  return getText(item, ["itemCode", "dictKey", "value", "code"], "-");
}

function getDictItemName(item: RecordLike) {
  return getText(item, ["itemName", "dictValue", "label", "name"], "未命名字典项");
}

function getTreeLevel(item: RecordLike) {
  return Number(getValue(item, ["__level"]) || 1);
}

function getStatusLabel(value: unknown) {
  return Number(value ?? 1) === 0
    ? localeText("禁用", "Disabled")
    : localeText("启用", "Enabled");
}

function getStatusClass(item: RecordLike) {
  return Number(getValue(item, ["status"]) ?? 1) === 0 ? "status-pill--disabled" : "status-pill--enabled";
}

function isValidId(value: unknown): value is string | number {
  return (typeof value === "string" && value !== "") || typeof value === "number";
}
</script>

<style scoped lang="scss">
.role-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  max-width: 100%;
}
.role-admin-note {
  padding: 1px 5px;
  border: 1px solid #b9d9fa;
  border-radius: 4px;
  color: #236bb1;
  background: #edf6ff;
  font-size: 10px;
  font-weight: 500;
  line-height: 16px;
  white-space: nowrap;
  cursor: help;
}
.permission-load-error {
  padding: 8px 12px;
  color: #b42318;
  font-size: 12px;
}
.system-view {
  --system-panel-bg: #ffffff;
  --system-panel-border: #cfe0ed;
  --system-soft-bg: #f6fbff;
  --system-soft-line: #edf3f8;
  --system-active-bg: #eaf4ff;
  --system-hover-bg: #f5faff;
  --system-focus-ring: 0 0 0 3px rgba(13, 130, 238, 0.12);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100%;
  min-height: var(--shell-content-min-height);
  padding: 10px;
  overflow: auto;
  background: linear-gradient(180deg, #edf5fb 0%, #f4f8fb 100%);
}

.system-view--user {
  overflow: hidden;
}

.side-panel,
.main-panel,
.table-panel,
.detail-panel,
.permission-panel {
  background: var(--system-panel-bg);
  border: 1px solid var(--system-panel-border);
  border-radius: 6px;
  box-shadow: 0 6px 16px rgba(30, 61, 89, 0.07);
}

.workspace {
  display: grid;
  grid-template-columns: 216px minmax(0, 1fr);
  gap: 10px;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.workspace--auth {
  grid-template-columns: minmax(168px, 0.19fr) minmax(0, 1fr);
}

.workspace--menu {
  grid-template-columns: 324px minmax(0, 1fr);
}

.workspace--dict {
  grid-template-columns: 300px minmax(0, 1fr);
}

.side-panel,
.main-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.side-panel {
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.panel-head,
.table-head,
.detail-head,
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  min-height: 40px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--system-soft-line);
}

.panel-title,
.table-head,
.detail-head {
  color: $color-admin-title;
  font-size: 14px;
  font-weight: 800;
}

.detail-head {
  align-items: flex-start;
  flex-direction: column;
  gap: 4px;
}

.detail-head__sub,
.table-head__meta {
  color: $color-admin-muted;
  font-size: 12px;
  font-weight: 500;
}

.table-head__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;
}

.org-tree,
.side-list {
  flex: 1;
  min-height: 0;
  padding: 8px;
  overflow: auto;
}

.tree-node,
.side-list__item {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 34px;
  padding: 7px 9px;
  color: #334155;
  border-radius: 4px;
  cursor: pointer;
}

.tree-node {
  gap: 8px;
}

.tree-node--active,
.side-list__item--active,
.tree-node:hover,
.side-list__item:hover {
  color: $color-admin-primary;
  background: var(--system-active-bg);
}

.tree-node--active,
.side-list__item--active {
  box-shadow: inset 3px 0 0 $color-admin-primary;
}

.tree-node__mark {
  width: 7px;
  height: 7px;
  background: $color-admin-primary;
  border-radius: 50%;
}

.tree-node__count {
  margin-left: auto;
  color: #64748b;
  font-size: 12px;
}

.side-list__item {
  align-items: flex-start;
  flex-direction: column;
  gap: 5px;
  margin-bottom: 4px;
}

.side-list__item--tree {
  align-items: center;
  flex-direction: row;
  box-sizing: border-box;
}

.side-list__tree-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-width: 0;
}

.side-list__tree-branch {
  width: 10px;
  height: 10px;
  flex: none;
  border-left: 1px solid #bfd3e6;
  border-bottom: 1px solid #bfd3e6;
}

.side-list__tree-spacer,
.menu-expand-spacer {
  width: 18px;
  flex: none;
}

.menu-expand-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 18px;
  height: 18px;
  color: #64748b;
  cursor: pointer;
}

.menu-expand-arrow {
  width: 7px;
  height: 7px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateX(-2px) rotate(-45deg);
  transition: transform 160ms ease;
}

.menu-expand-arrow--expanded {
  transform: translateY(-2px) rotate(45deg);
}

.side-list__title {
  color: inherit;
  font-size: 13px;
  font-weight: 800;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.side-list__sub {
  color: #7b8fa5;
  font-size: 11px;
}

.toolbar {
  gap: 10px;
  flex-wrap: wrap;
  align-items: flex-start;
  padding: 8px 10px;
  background: #fbfdff;
}

.toolbar__filters,
.toolbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  min-width: 0;
}

.toolbar__filters {
  flex: 1 1 360px;
}

.toolbar__actions {
  justify-content: flex-end;
  flex: 0 1 auto;
}

.user-pagination,
.user-page-size,
.user-page-jump {
  display: flex;
  align-items: center;
  gap: 6px;
}

.user-pagination {
  flex-wrap: wrap;
  justify-content: flex-end;
  flex: none;
  max-width: 100%;
  margin-left: 2px;
  padding-left: 10px;
  border-left: 1px solid #dbe7f1;
}

.user-page-size__input,
.user-page-button,
.user-page-input {
  box-sizing: border-box;
  height: 32px;
  color: #34495e;
  font-size: 13px;
  font-weight: 800;
  line-height: 32px;
  border: 1px solid #d4e2f0;
  border-radius: 4px;
  background: #f8fbff;
}

.user-page-size__input {
  width: 58px;
  padding: 0 6px;
  text-align: center;
}

.user-page-input {
  width: 46px;
  padding: 0 6px;
  text-align: center;
}

.user-page-button {
  min-width: 68px;
  margin: 0;
  padding: 0 10px;
}

.user-page-button::after {
  border: 0;
}

.user-page-button--hover {
  background: #edf7ff;
}

.user-page-button[disabled] {
  color: #a0aec0;
  background: #f2f5f8;
}

.user-page-info {
  color: #64748b;
  font-size: 13px;
  white-space: nowrap;
}

.filter-field {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
}

.filter-field--small .filter-select {
  width: 92px;
}

.filter-label,
.form-label {
  flex: none;
  color: #34495e;
  font-size: 12px;
  font-weight: 800;
}

.form-label {
  display: block;
  margin-bottom: 6px;
}

.form-label--required::after {
  margin-left: 3px;
  color: #ef4444;
  content: "*";
}

.filter-input,
.filter-select,
.form-input,
.form-select {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 32px;
  padding: 0 10px;
  color: #172033;
  font-size: 13px;
  line-height: 32px;
  background: #f9fcff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.filter-select {
  display: flex;
  align-items: center;
  line-height: 1;
}

.filter-input:focus,
.form-input:focus {
  background: #ffffff;
  border-color: #89c7ff;
  box-shadow: var(--system-focus-ring);
  outline: none;
}

.password-input-wrap {
  position: relative;
  width: 100%;
  min-width: 0;
}

.form-input--password {
  padding-right: 42px;
}

.password-toggle {
  position: absolute;
  top: 1px;
  right: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 4px;
}

.password-toggle::after {
  border: 0;
}

.password-toggle--hover {
  background: #eaf4ff;
}

.password-toggle__eye {
  position: relative;
  display: block;
  width: 17px;
  height: 11px;
  border: 1.5px solid #6b7f95;
  border-radius: 50%;
}

.password-toggle__eye::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: #6b7f95;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  content: "";
}

.password-toggle--visible .password-toggle__eye {
  border-color: #0d82ee;
}

.password-toggle--visible .password-toggle__eye::after {
  background: #0d82ee;
}

.filter-input {
  width: clamp(150px, 18vw, 220px);
}

.form-select--disabled,
.form-input[disabled] {
  color: #7b8fa5;
  background: #eef3f8;
  border-color: #d7e0e8;
}

.binding-notice {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 12px;
  background: #f5f9ff;
  border: 1px solid #d8e8f8;
  border-radius: 6px;
}

.binding-notice__title {
  color: #24527a;
  font-size: 13px;
  font-weight: 800;
}

.binding-notice__text {
  color: #64758b;
  font-size: 12px;
  line-height: 1.6;
  word-break: break-word;
}

.input-placeholder {
  color: #9aa9b8;
}

.toolbar-button,
.icon-button {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: 32px;
  margin: 0;
  padding: 0 12px;
  color: #31506d;
  font-size: 13px;
  font-weight: 700;
  background: #f6fbff;
  border: 1px solid #cbdced;
  border-radius: 4px;
}

.toolbar-button::after,
.icon-button::after {
  border: 0;
}

.toolbar-button--primary {
  color: #ffffff;
  background: $color-admin-primary;
  border-color: $color-admin-primary;
}

.toolbar-button--danger {
  color: #b42318;
  background: #fff5f3;
  border-color: #ffc9c0;
}

.toolbar-button--compact {
  min-width: 0;
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  line-height: 30px;
}

.toolbar-button[disabled] {
  color: #9aa9b8;
  background: #eef2f6;
  border-color: #d7e0e8;
}

.toolbar-button--hover,
.icon-button--hover {
  color: $color-admin-primary;
  background: #edf7ff;
  border-color: #a9d7ff;
}

.icon-button {
  width: 30px;
  height: 30px;
  padding: 0;
}

.icon-refresh {
  display: block;
  flex: none;
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.icon-refresh--spinning {
  animation: system-refresh-spin 0.75s linear infinite;
}

@keyframes system-refresh-spin {
  to {
    transform: rotate(360deg);
  }
}

.icon-button[disabled] {
  color: $color-admin-primary;
  background: transparent;
  opacity: 1;
}

.content-layout {
  display: grid;
  grid-template-columns: minmax(300px, 0.62fr) minmax(420px, 1fr);
  gap: 10px;
  flex: 1;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 0;
  padding: 10px;
  overflow: auto;
}

.content-layout--vertical {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(250px, 0.9fr) minmax(240px, 0.72fr);
}

.content-layout--auth {
  grid-template-columns: minmax(240px, 1fr) minmax(520px, 3fr);
}

.content-layout--dict {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(220px, 1fr) minmax(320px, 0.9fr);
}

.content-layout--user {
  position: relative;
  display: block;
  flex: 1 1 0;
  height: 0;
  overflow: hidden;
}

.workspace--user,
.workspace--user .main-panel {
  overflow: hidden;
}

.content-layout--user > .table-panel {
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
}

.table-panel,
.detail-panel,
.permission-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: auto;
}

.table-scroll,
.permission-tree {
  flex: 1;
  width: 100%;
  max-width: 100%;
  min-height: 0;
  overflow: auto;
}

.data-table {
  display: table;
  table-layout: auto;
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  min-width: 100%;
}

.data-table--user {
  min-width: 1200px;
}

.data-table--menu {
  min-width: 1040px;
}

.data-table--dict {
  min-width: 980px;
}

.data-row {
  display: table-row;
  min-height: 38px;
  color: #24384d;
  cursor: pointer;
}

.data-row--header {
  min-height: 38px;
  color: #5d7188;
  font-size: 13px;
  font-weight: 800;
  cursor: default;
}

.data-row--active .data-cell,
.data-row:hover:not(.data-row--header) .data-cell {
  background: var(--system-hover-bg);
}

.data-table--user .data-cell--name {
  min-width: 140px;
}

.data-table--user .data-cell--account,
.data-table--user .data-cell--phone {
  min-width: 150px;
}

.data-table--user .data-cell--email {
  min-width: 240px;
}

.data-table--user .data-cell--region {
  min-width: 100px;
}

.data-table--user .data-cell--roles {
  min-width: 180px;
}

.data-table--user .data-cell--depts {
  min-width: 220px;
}

.data-cell.data-cell--status {
  min-width: 100px;
}

.data-cell.data-cell--time {
  min-width: 180px;
}

.data-table--menu .data-cell--name {
  min-width: 180px;
}

.menu-table-name {
  display: flex;
  align-items: center;
  min-width: 0;
}

.data-table--menu .data-cell--select {
  width: 56px;
  min-width: 56px;
  text-align: center;
}

.data-table--menu .data-cell--code {
  min-width: 220px;
}

.data-table--menu .data-cell--path {
  min-width: 380px;
}

.data-table--dict .data-cell--sort {
  min-width: 80px;
}

.data-table--dict .data-cell--code {
  min-width: 170px;
}

.data-table--dict .data-cell--name {
  min-width: 190px;
}

.data-table--dict .data-cell--remark {
  min-width: 320px;
}

.data-cell {
  display: table-cell;
  height: 38px;
  box-sizing: border-box;
  vertical-align: middle;
  min-width: 0;
  text-align: center;
  padding: 0 10px;
  overflow: visible;
  font-size: 13px;
  white-space: nowrap;
  border-right: 1px solid #edf2f7;
  border-bottom: 1px solid #edf2f7;
}

.data-row--header .data-cell {
  position: sticky;
  top: 0;
  z-index: 1;
  height: 38px;
  background: #f2f7fc;
}

.data-cell > text:not(.status-pill) {
  min-width: 0;
  overflow: visible;
  white-space: nowrap;
}

.table-state,
.empty-tip {
  padding: 26px 12px;
  color: #8a9aab;
  font-size: 14px;
  text-align: center;
}

.status-pill,
.tag-code {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  min-height: 22px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 800;
  border-radius: 999px;
}

.status-pill--enabled {
  color: #16753a;
  background: #eafaf0;
}

.status-pill--disabled {
  color: #9f1f17;
  background: #fff0ee;
}

.tag-code {
  color: #0d82ee;
  background: #edf7ff;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px 14px;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 12px;
  overflow: auto;
}

.detail-panel > .form-grid,
.permission-tree {
  flex: 1;
  min-height: 0;
}

.form-grid--user {
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  align-content: start;
}

.user-config-row {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  min-width: 0;
}

.form-grid--role {
  display: block;
}

.form-grid--role .form-field + .form-field {
  margin-top: 10px;
}

.detail-panel--user {
  position: absolute;
  right: 10px;
  bottom: 10px;
  left: 10px;
  z-index: 4;
  box-sizing: border-box;
  height: clamp(309px, 52.73%, 473px);
  min-height: 0;
  overflow: hidden;
  background: #ffffff;
  border-color: #bfd5e7;
  box-shadow: none;
}

.detail-head--user {
  position: relative;
}

.user-detail-collapse {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 26px;
  margin: 0;
  padding: 0;
  color: #4e6d88;
  background: #ffffff;
  border: 1px solid #bfd5e7;
  border-radius: 5px;
  box-shadow: none;
  transform: translate(-50%, -50%);
}

.user-detail-collapse::after {
  border: 0;
}

.user-detail-collapse--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #8bc8f5;
}

.user-detail-collapse__icon {
  display: block;
  width: 9px;
  height: 9px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateY(-2px) rotate(45deg);
}

.user-detail-expand {
  position: absolute;
  bottom: 10px;
  left: 50%;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 28px;
  margin: 0;
  padding: 0;
  color: #4e6d88;
  background: #ffffff;
  border: 1px solid #bfd5e7;
  border-radius: 5px 5px 0 0;
  box-shadow: 0 -3px 10px rgba(36, 70, 101, 0.08);
  transform: translateX(-50%);
}

.user-detail-expand::after {
  border: 0;
}

.user-detail-expand--hover {
  color: #0d82ee;
  background: #edf7ff;
  border-color: #8bc8f5;
}

.user-detail-expand__icon {
  display: block;
  width: 9px;
  height: 9px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateY(2px) rotate(225deg);
}

.user-detail-drawer-enter-active,
.user-detail-drawer-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.user-detail-drawer-enter-from,
.user-detail-drawer-leave-to {
  opacity: 0;
  transform: translateY(24px);
}

.detail-panel--user .form-grid--user {
  flex: 1 1 0;
  height: 0;
  min-height: 0;
  align-content: start;
  padding-bottom: 20px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-gutter: stable;
}

.detail-panel--user .form-field {
  overflow: visible;
}

.detail-panel--user .form-actions {
  position: relative;
  z-index: 1;
  flex: none;
}

.user-config-row .check-grid {
  box-sizing: border-box;
  height: 40px;
  min-height: 40px;
  max-height: 40px;
  overflow-x: hidden;
  overflow-y: auto;
}

.detail-panel--dict .form-grid {
  align-content: start;
  padding-bottom: 16px;
  overflow-x: hidden;
  overflow-y: auto;
}

.detail-panel--menu .form-grid {
  align-content: start;
  padding-bottom: 16px;
  overflow-x: hidden;
  overflow-y: auto;
}

.detail-panel--menu .form-field,
.detail-panel--dict .form-field {
  overflow: visible;
}

.detail-panel--menu .form-actions,
.detail-panel--dict .form-actions {
  flex: none;
}

.form-field {
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.form-field--wide {
  grid-column: 1 / -1;
}

.form-error {
  display: block;
  margin-top: 4px;
  color: #c0362c;
  font-size: 12px;
  line-height: 18px;
}

.check-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 7px 10px;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 8px;
  overflow: auto;
  background: #f8fbfe;
  border: 1px solid #d8e6f2;
  border-radius: 4px;
}

.check-grid--partition {
  max-height: 118px;
  overflow-y: auto;
}
.check-box--partial {
  position: relative;
  background: #eaf4ff;
  border-color: #0d82ee;
}

.check-box--partial::after {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 8px;
  height: 2px;
  background: #0d82ee;
  border-radius: 2px;
  transform: translate(-50%, -50%);
  content: "";
}
.binding-field-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-width: 0;
  margin-bottom: 6px;
}

.binding-field-head .form-label {
  margin-bottom: 0;
}

.mini-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  height: 28px;
  margin: 0;
  padding: 0 10px;
  color: #0d82ee;
  font-size: 13px;
  font-weight: 800;
  line-height: 28px;
  background: #edf7ff;
  border: 1px solid #b9dcff;
  border-radius: 4px;
}

.mini-button::after {
  border: 0;
}

.mini-button--hover {
  color: #ffffff;
  background: #0d82ee;
  border-color: #0d82ee;
}

.mini-button[disabled] {
  color: #94a3b8;
  background: #f1f5f9;
  border-color: #d7e0e8;
}

.bound-partition-list {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  box-sizing: border-box;
  width: 100%;
  min-height: 34px;
  padding: 7px 8px;
  background: #f8fbfe;
  border: 1px solid #d8e6f2;
  border-radius: 4px;
}

.bound-partition-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-height: 24px;
  padding: 0 8px;
  color: #24527a;
  font-size: 13px;
  font-weight: 800;
  background: #edf7ff;
  border: 1px solid #cce6ff;
  border-radius: 999px;
}

.bound-partition-tag text:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bound-partition-tag__remove {
  flex: none;
  color: #d92d20;
  cursor: pointer;
}

.binding-lock-tip {
  display: block;
  margin-top: 6px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}

.check-item,
.permission-node {
  display: flex;
  align-items: center;
  flex: 0 1 auto;
  gap: 7px;
  max-width: 100%;
  min-width: 0;
  color: #34495e;
  font-size: 13px;
  cursor: pointer;
}

.empty-inline {
  color: #8a9aab;
  font-size: 13px;
}

.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 35, 55, 0.28);
}

.modal-panel {
  display: flex;
  flex-direction: column;
  width: min(520px, 100%);
  max-height: min(640px, calc(100vh - 56px));
  overflow: hidden;
  background: #ffffff;
  border: 1px solid #cfe0ee;
  border-radius: 6px;
  box-shadow: 0 18px 46px rgba(28, 55, 82, 0.22);
}

.modal-panel--partition {
  width: min(760px, calc(100vw - 40px));
  min-height: min(560px, calc(100vh - 56px));
  max-height: min(720px, calc(100vh - 40px));
}

.modal-head,
.modal-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  padding: 12px 14px;
  border-bottom: 1px solid #edf3f8;
}

.modal-head {
  min-height: 54px;
  padding: 16px 20px;
  color: #183755;
}

.modal-title-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.modal-title {
  font-size: 18px;
  font-weight: 900;
  line-height: 24px;
}

.modal-subtitle {
  color: #718397;
  font-size: 13px;
  font-weight: 400;
  line-height: 20px;
}

.modal-head__actions {
  display: flex;
  align-items: center;
  flex: none;
  gap: 14px;
  margin-left: 20px;
}

.modal-selection-count {
  min-width: 72px;
  padding: 5px 9px;
  color: #0b6fcb;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
  background: #edf7ff;
  border: 1px solid #cbe6fb;
  border-radius: 4px;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  color: #64748b;
  font-size: 22px;
  line-height: 30px;
  cursor: pointer;
  border-radius: 4px;
}

.modal-close:hover {
  color: #183755;
  background: #eef4f8;
}

.modal-body {
  flex: 1;
  min-height: 0;
  padding: 18px 20px;
  overflow: hidden;
}

.partition-dialog-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e4edf5;
}

.partition-dialog-toolbar > view:first-child {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.partition-dialog-toolbar__title {
  color: #24384d;
  font-size: 14px;
  font-weight: 900;
}

.partition-dialog-toolbar__meta {
  color: #7b8da0;
  font-size: 12px;
}

.partition-dialog-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-content: start;
  gap: 10px;
  height: 100%;
  max-height: 470px;
  margin-top: 14px;
  padding-right: 4px;
  overflow-y: auto;
}

.partition-dialog-item {
  min-height: 58px;
  box-sizing: border-box;
  padding: 10px 12px;
  background: #f8fbfe;
  border: 1px solid #d8e6f2;
  border-radius: 6px;
  transition: border-color 160ms ease, background-color 160ms ease, box-shadow 160ms ease;
}

.partition-dialog-item:hover {
  background: #f2f8fd;
  border-color: #a9c9e4;
}

.partition-dialog-item.check-item--checked {
  background: #edf7ff;
  border-color: #76b9ee;
  box-shadow: inset 3px 0 0 #0d82ee;
}

.partition-dialog-item__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.partition-dialog-item__name {
  overflow: hidden;
  color: #263b50;
  font-size: 14px;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.partition-dialog-item__status {
  color: #8494a5;
  font-size: 12px;
}

.partition-dialog-item.check-item--checked .partition-dialog-item__status {
  color: #0d82ee;
}

.check-item--select-all {
  flex: none;
  min-height: 32px;
  padding: 5px 10px;
  background: #f5f9fc;
  border: 1px solid #d8e6f2;
  border-radius: 4px;
}

.modal-empty {
  grid-column: 1 / -1;
  padding: 24px 10px;
  color: #8a9aab;
  font-size: 14px;
  text-align: center;
}

.modal-actions {
  justify-content: space-between;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid #edf3f8;
  border-bottom: 0;
  background: #fbfdff;
}

.modal-actions__summary {
  color: #66788a;
  font-size: 13px;
}

.modal-actions__buttons {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: none;
}

.check-item text:last-child,
.permission-node text:first-child {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.check-item--checked {
  color: #0d82ee;
}

.check-box {
  position: relative;
  flex: none;
  width: 14px;
  height: 14px;
  background: #ffffff;
  border: 1px solid #b8c9d9;
  border-radius: 3px;
}

.data-cell--select .check-box {
  display: inline-block;
  vertical-align: middle;
  cursor: pointer;
}

.check-box--disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.check-item--checked .check-box,
.check-box--checked {
  background: #0d82ee;
  border-color: #0d82ee;
}

.check-item--checked .check-box::after,
.check-box--checked::after {
  position: absolute;
  top: 1px;
  left: 4px;
  width: 4px;
  height: 8px;
  content: "";
  border-right: 2px solid #ffffff;
  border-bottom: 2px solid #ffffff;
  transform: rotate(42deg);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px 12px;
  background: #fbfdff;
  border-top: 1px solid var(--system-soft-line);
}

.permission-tree {
  padding: 10px 12px;
}

.permission-node {
  position: relative;
  min-height: 30px;
  padding: 0 8px;
  border-radius: 4px;
}

.permission-node:hover {
  background: #f4faff;
}

.permission-node--level-2 {
  padding-left: 22px;
}

.permission-node--level-3 {
  padding-left: 44px;
}

.permission-node__code {
  flex: none;
  margin-left: auto;
  padding-left: 24px;
  color: #8a9aab;
  font-size: 12px;
  text-align: right;
  white-space: nowrap;
}

.permission-node__name {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1360px) {
  .workspace {
    grid-template-columns: 200px minmax(0, 1fr);
  }

  .content-layout {
    grid-template-columns: 1fr;
  }

  .content-layout--vertical {
    grid-template-rows: minmax(230px, 0.85fr) minmax(230px, 0.72fr);
  }

  .content-layout--dict {
    grid-template-rows: minmax(200px, 0.8fr) minmax(320px, 1fr);
  }

  .form-grid--user {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .workspace,
  .workspace--auth,
  .workspace--dict {
    grid-template-columns: 1fr;
  }

  .side-panel {
    min-height: 180px;
  }

  .form-grid,
  .form-grid--user {
    grid-template-columns: 1fr;
  }

  .user-config-row {
    grid-template-columns: 1fr;
  }

  .detail-panel--user {
    height: min(440px, calc(100% - 20px));
  }
}

@media (max-width: 680px) {
  .modal-mask {
    padding: 12px;
  }

  .modal-panel--partition {
    width: 100%;
    min-height: min(520px, calc(100vh - 24px));
    max-height: calc(100vh - 24px);
  }

  .modal-head {
    align-items: flex-start;
    padding: 14px;
  }

  .modal-subtitle,
  .modal-selection-count {
    display: none;
  }

  .modal-head__actions {
    margin-left: 10px;
  }

  .modal-body {
    padding: 14px;
  }

  .partition-dialog-list {
    grid-template-columns: 1fr;
    max-height: none;
  }

  .modal-actions {
    align-items: stretch;
    flex-direction: column;
    padding: 12px 14px;
  }

  .modal-actions__buttons {
    justify-content: flex-end;
  }
}
</style>
