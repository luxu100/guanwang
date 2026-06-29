<template>
  <view class="system-view">
    <view class="workspace" :class="`workspace--${mode}`">
      <view class="side-panel">
        <view class="panel-head">
          <text class="panel-title">{{ sideTitle }}</text>
          <button class="icon-button" hover-class="icon-button--hover" aria-label="刷新" @click="refreshCurrent">
            <text class="icon-refresh"></text>
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
            <text class="side-list__title">{{ getRoleName(item) }}</text>
            <text class="side-list__sub">{{ getText(item, ['roleCode'], '未配置编码') }}</text>
          </view>
          <view v-if="!roles.length && !loading" class="empty-tip">暂无角色数据</view>
        </scroll-view>

        <scroll-view v-else-if="mode === 'menu'" class="side-list" scroll-y>
          <view
            v-for="item in menus"
            :key="getId(item)"
            class="side-list__item"
            :class="{ 'side-list__item--active': getId(item) === getId(selectedMenu) }"
            @click="selectMenu(item)"
          >
            <text class="side-list__title">{{ getPermissionName(item) }}</text>
            <text class="side-list__sub">{{ getText(item, ['path'], '目录节点') }}</text>
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
              <text class="filter-label">状态</text>
              <picker :range="statusOptions" range-key="label" @change="handleStatusChange">
                <view class="filter-select">{{ currentStatusLabel }}</view>
              </picker>
            </view>
          </view>

          <view class="toolbar__actions">
            <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="searchCurrent">查询</button>
            <button class="toolbar-button" hover-class="toolbar-button--hover" @click="resetFilters">重置</button>
            <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="startCreate">{{ createButtonText }}</button>
            <button class="toolbar-button toolbar-button--danger" :disabled="!canDelete" hover-class="toolbar-button--hover" @click="deleteCurrent">删除</button>
          </view>
        </view>

        <view v-if="mode === 'user'" class="content-layout content-layout--vertical content-layout--user">
          <view class="table-panel">
            <view class="table-head">
              <text>用户列表</text>
              <text class="table-head__meta">共 {{ total }} 条</text>
            </view>
            <scroll-view class="table-scroll" scroll-x scroll-y>
              <view class="data-table data-table--user">
                <view class="data-row data-row--header">
                  <text class="data-cell data-cell--name">用户姓名</text>
                  <text class="data-cell data-cell--account">登录账号</text>
                  <text class="data-cell data-cell--phone">联系电话</text>
                  <text class="data-cell data-cell--email">邮箱</text>
                  <text class="data-cell data-cell--status">状态</text>
                  <text class="data-cell data-cell--time">创建时间</text>
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
                  <text class="data-cell data-cell--status">
                    <text class="status-pill" :class="getStatusClass(item)">{{ getStatusLabel(getValue(item, ['status'])) }}</text>
                  </text>
                  <text class="data-cell data-cell--time">{{ formatDateTime(getText(item, ['createdAt'], '-')) }}</text>
                </view>
              </view>
            </scroll-view>
          </view>

          <view class="detail-panel">
            <view class="detail-head">
              <text>{{ isCreating ? "新增用户" : "用户详细信息配置" }}</text>
              <text class="detail-head__sub">基础信息、角色分配和报警通知配置</text>
            </view>
            <view class="form-grid form-grid--user">
              <view class="form-field">
                <text class="form-label form-label--required">登录账号</text>
                <input v-model="userForm.username" class="form-input" placeholder="请输入登录账号" placeholder-class="input-placeholder" />
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
                    placeholder="请输入初始密码"
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
              </view>
              <view class="form-field">
                <text class="form-label">用户状态</text>
                <picker :range="recordStatusOptions" range-key="label" @change="handleUserFormStatusChange">
                  <view class="form-select">{{ getStatusLabel(userForm.status) }}</view>
                </picker>
              </view>
              <view class="form-field form-field--wide">
                <text class="form-label">分配权限角色（决定可访问菜单）</text>
                <view class="check-grid">
                  <view
                    v-for="item in roles"
                    :key="getId(item)"
                    class="check-item"
                    :class="{ 'check-item--checked': selectedRoleIds.includes(getId(item)) }"
                    @click="toggleUserRole(getId(item))"
                  >
                    <text class="check-box"></text>
                    <text>{{ getRoleName(item) }}</text>
                  </view>
                </view>
              </view>
              <view class="form-field form-field--wide">
                <text class="form-label">实时报警通知配置</text>
                <view class="check-grid">
                  <view v-for="item in alarmOptions" :key="item.value" class="check-item" :class="{ 'check-item--checked': selectedAlarmOptions.includes(item.value) }" @click="toggleAlarm(item.value)">
                    <text class="check-box"></text>
                    <text>{{ item.label }}</text>
                  </view>
                </view>
              </view>
              <view class="form-field form-field--wide">
                <view class="binding-field-head">
                  <text class="form-label">用户绑定分区（部门接口）</text>
                  <button class="mini-button" hover-class="mini-button--hover" @click="openUserPartitionDialog">新增绑定</button>
                </view>
                <view class="bound-partition-list">
                  <view v-for="id in selectedUserPartitionIds" :key="id" class="bound-partition-tag">
                    <text>{{ getPartitionNameById(id) }}</text>
                    <text class="bound-partition-tag__remove" @click="removeUserPartition(id)">×</text>
                  </view>
                  <text v-if="!selectedUserPartitionIds.length" class="empty-inline">暂未绑定分区</text>
                </view>
              </view>
            </view>
            <view class="form-actions">
              <button class="toolbar-button" hover-class="toolbar-button--hover" @click="cancelEdit">取消</button>
              <button class="toolbar-button toolbar-button--primary" :disabled="saving" hover-class="toolbar-button--hover" @click="saveUser">
                {{ saving ? "保存中..." : "保存用户信息" }}
              </button>
            </view>
          </view>
        </view>

        <view v-else-if="mode === 'auth'" class="content-layout">
          <view class="detail-panel detail-panel--role">
            <view class="detail-head">
              <text>{{ isCreating ? "新增角色" : "角色基础信息" }}</text>
              <text class="detail-head__sub">维护角色编码、排序和说明</text>
            </view>
            <view class="form-grid">
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
            <scroll-view class="permission-tree" scroll-y>
              <view
                v-for="item in permissions"
                :key="getId(item)"
                class="permission-node"
                :class="`permission-node--level-${getTreeLevel(item)}`"
                :style="{ paddingLeft: `${8 + (getTreeLevel(item) - 1) * 22}px` }"
                @click="togglePermission(getId(item))"
              >
                <text class="check-box" :class="{ 'check-box--checked': selectedPermissionIds.includes(getId(item)) }"></text>
                <text>{{ getPermissionName(item) }}</text>
                <text class="permission-node__code">{{ getText(item, ['permissionCode'], '') }}</text>
              </view>
              <view v-if="!permissions.length && !loading" class="empty-tip">暂无权限树数据</view>
            </scroll-view>
            <view class="form-actions">
              <button class="toolbar-button" hover-class="toolbar-button--hover" @click="selectedPermissionIds = []">清空选择</button>
              <button class="toolbar-button toolbar-button--primary" :disabled="saving || !getId(selectedRole)" hover-class="toolbar-button--hover" @click="saveRolePermissions">
                {{ saving ? "保存中..." : "保存权限" }}
              </button>
            </view>
          </view>
        </view>

        <view v-else-if="mode === 'menu'" class="content-layout content-layout--vertical">
          <view class="table-panel">
            <view class="table-head">
              <text>菜单资源列表</text>
              <view class="table-head__actions">
                <text class="table-head__meta">共 {{ total }} 条</text>
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
                <view v-for="item in menus" v-else :key="getId(item)" class="data-row" :class="{ 'data-row--active': getId(item) === getId(selectedMenu) }" @click="selectMenu(item)">
                  <text class="data-cell data-cell--select">
                    <text
                      class="check-box"
                      :class="{ 'check-box--checked': selectedMenuIds.includes(getId(item)), 'check-box--disabled': !canSelectMenuForBatch(item) }"
                      @click.stop="toggleMenuSelection(item)"
                    ></text>
                  </text>
                  <text class="data-cell data-cell--name">
                    <text class="tree-cell-name" :style="{ paddingLeft: `${(getTreeLevel(item) - 1) * 20}px` }">
                      <text>{{ getPermissionName(item) }}</text>
                    </text>
                  </text>
                  <text class="data-cell data-cell--code">{{ getText(item, ['permissionCode'], '-') }}</text>
                  <text class="data-cell data-cell--path">{{ getText(item, ['path'], '-') }}</text>
                  <text class="data-cell data-cell--status">
                    <text class="status-pill" :class="getStatusClass(item)">{{ getStatusLabel(getValue(item, ['status'])) }}</text>
                  </text>
                </view>
              </view>
            </scroll-view>
          </view>
          <view class="detail-panel">
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
              <text class="table-head__meta">共 {{ total }} 条</text>
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
              <button class="toolbar-button" hover-class="toolbar-button--hover" @click="startCreateDictType">新增分类</button>
              <button class="toolbar-button" hover-class="toolbar-button--hover" @click="startCreateDictItem">新增字典项</button>
              <button class="toolbar-button toolbar-button--primary" :disabled="saving" hover-class="toolbar-button--hover" @click="saveDict">
                {{ saving ? "保存中..." : "保存字典" }}
              </button>
            </view>
          </view>
        </view>
      </view>
    </view>

    <view v-if="showUserPartitionDialog" class="modal-mask" @click.self="closeUserPartitionDialog">
      <view class="modal-panel">
        <view class="modal-head">
          <text>新增绑定分区</text>
          <text class="modal-close" @click="closeUserPartitionDialog">×</text>
        </view>
        <view class="modal-body">
          <view class="check-item check-item--select-all" :class="{ 'check-item--checked': isAllUserPartitionDraftSelected }" @click="toggleAllUserPartitionDraft">
            <text class="check-box"></text>
            <text>全选</text>
          </view>
          <view class="partition-dialog-list">
            <view
              v-for="item in availableUserPartitionOptions"
              :key="getId(item)"
              class="check-item partition-dialog-item"
              :class="{ 'check-item--checked': userPartitionDraftIds.includes(getId(item)) }"
              @click="toggleUserPartitionDraft(getId(item))"
            >
              <text class="check-box"></text>
              <text>{{ getPartitionName(item) }}</text>
            </view>
            <view v-if="!availableUserPartitionOptions.length" class="modal-empty">暂无可新增绑定的分区</view>
          </view>
        </view>
        <view class="modal-actions">
          <button class="toolbar-button" hover-class="toolbar-button--hover" @click="closeUserPartitionDialog">取消</button>
          <button class="toolbar-button toolbar-button--primary" hover-class="toolbar-button--hover" @click="confirmUserPartitionBinding">确定绑定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { assignUserDepts, getUserDepts, assignUserRoles, deleteUser, getUserPage, register, updateUser, type RegisterParams } from "@/services/system/user";
import { assignRolePermissions, createRole, deleteRole, getPermissionTree, getRoleList, getRolePage, updateRole } from "@/services/system/auth";
import { createMenu, deleteMenu, getMenuPage, getMenuTree, updateMenu } from "@/services/system/menu";
import { createDictItem, createDictType, deleteDictItem, deleteDictType, getDictItemPage, getDictTypePage, updateDictItem, updateDictType } from "@/services/system/dict";
import { getDeptList } from "@/services/partition/partition";
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
import { buildUserRoleAssignment } from "@/utils/adminUserBinding";

type AdminMode = "user" | "auth" | "menu" | "dict";
type SelectOption<T extends string | number = string | number> = {
  label: string;
  value: T;
};

const LOCAL_MENU_ID_PREFIX = "local-menu:";
const defaultMenuTree: RecordLike[] = [
  { id: `${LOCAL_MENU_ID_PREFIX}favorite`, permissionName: "我的收藏", permissionCode: "page:favorite", path: "/pages/index/index", permissionType: 1, status: 1 },
  { id: `${LOCAL_MENU_ID_PREFIX}leak-monitor`, permissionName: "渗漏监测", permissionCode: "page:leak-monitor", path: "/pages/leak-monitor/leak-monitor", permissionType: 1, status: 1 },
  { id: `${LOCAL_MENU_ID_PREFIX}partition`, permissionName: "分区管理", permissionCode: "page:partition", path: "/pages/partition/partition", permissionType: 1, status: 1 },
  {
    id: `${LOCAL_MENU_ID_PREFIX}device`,
    permissionName: "设备管理",
    permissionCode: "module:device",
    path: "/pages/device/info/info",
    permissionType: 0,
    status: 1,
    children: [
      { id: `${LOCAL_MENU_ID_PREFIX}device-info`, permissionName: "设备信息", permissionCode: "page:device:info", path: "/pages/device/info/info", parentId: `${LOCAL_MENU_ID_PREFIX}device`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}device-maintenance`, permissionName: "拆装维护", permissionCode: "page:device:maintenance", path: "/pages/device/maintenance/maintenance", parentId: `${LOCAL_MENU_ID_PREFIX}device`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}device-status`, permissionName: "设备状态", permissionCode: "page:device:status", path: "/pages/device/status/status", parentId: `${LOCAL_MENU_ID_PREFIX}device`, permissionType: 1, status: 1 },
    ],
  },
  {
    id: `${LOCAL_MENU_ID_PREFIX}system`,
    permissionName: "系统设置",
    permissionCode: "module:system",
    path: "/pages/system/user/user",
    permissionType: 0,
    status: 1,
    children: [
      { id: `${LOCAL_MENU_ID_PREFIX}system-user`, permissionName: "用户配置", permissionCode: "page:system:user", path: "/pages/system/user/user", parentId: `${LOCAL_MENU_ID_PREFIX}system`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}system-auth`, permissionName: "权限管理", permissionCode: "page:system:auth", path: "/pages/system/auth/auth", parentId: `${LOCAL_MENU_ID_PREFIX}system`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}system-menu`, permissionName: "菜单管理", permissionCode: "page:system:menu", path: "/pages/system/menu/menu", parentId: `${LOCAL_MENU_ID_PREFIX}system`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}system-search`, permissionName: "查询模板", permissionCode: "page:system:search", path: "/pages/system/search/search", parentId: `${LOCAL_MENU_ID_PREFIX}system`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}system-dict`, permissionName: "数据字典", permissionCode: "page:system:dict", path: "/pages/system/dict/dict", parentId: `${LOCAL_MENU_ID_PREFIX}system`, permissionType: 1, status: 1 },
    ],
  },
  {
    id: `${LOCAL_MENU_ID_PREFIX}command`,
    permissionName: "指令管理",
    permissionCode: "module:command",
    path: "/pages/command/commandManage",
    permissionType: 0,
    status: 1,
    children: [
      { id: `${LOCAL_MENU_ID_PREFIX}command-manage`, permissionName: "指令管理", permissionCode: "page:command:manage", path: "/pages/command/commandManage", parentId: `${LOCAL_MENU_ID_PREFIX}command`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}command-configuration`, permissionName: "指令配置", permissionCode: "page:command:configuration", path: "/pages/command/commandConfiguration", parentId: `${LOCAL_MENU_ID_PREFIX}command`, permissionType: 1, status: 1 },
    ],
  },
  {
    id: `${LOCAL_MENU_ID_PREFIX}data-analysis`,
    permissionName: "数据分析",
    permissionCode: "module:data-analysis",
    path: "/pages/data-analysis/overview/overview",
    permissionType: 0,
    status: 1,
    children: [
      { id: `${LOCAL_MENU_ID_PREFIX}data-analysis-overview`, permissionName: "系统总览", permissionCode: "page:data-analysis:overview", path: "/pages/data-analysis/overview/overview", parentId: `${LOCAL_MENU_ID_PREFIX}data-analysis`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}data-analysis-audio`, permissionName: "音频数据", permissionCode: "page:data-analysis:audio", path: "/pages/data-analysis/audio/audio", parentId: `${LOCAL_MENU_ID_PREFIX}data-analysis`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}data-analysis-device-params`, permissionName: "设备参数", permissionCode: "page:data-analysis:device-params", path: "/pages/data-analysis/device-params/device-params", parentId: `${LOCAL_MENU_ID_PREFIX}data-analysis`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}data-analysis-leakage`, permissionName: "渗漏数据", permissionCode: "page:data-analysis:leakage", path: "/pages/data-analysis/leakage/leakage", parentId: `${LOCAL_MENU_ID_PREFIX}data-analysis`, permissionType: 1, status: 1 },
    ],
  },
  {
    id: `${LOCAL_MENU_ID_PREFIX}leak-report`,
    permissionName: "疑漏点上报",
    permissionCode: "module:leak-report",
    path: "/pages/leak-report/suspect-management/suspect-management",
    permissionType: 0,
    status: 1,
    children: [
      { id: `${LOCAL_MENU_ID_PREFIX}leak-report-suspect-management`, permissionName: "疑点管理", permissionCode: "page:leak-report:suspect-management", path: "/pages/leak-report/suspect-management/suspect-management", parentId: `${LOCAL_MENU_ID_PREFIX}leak-report`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}leak-report-suspect-processing`, permissionName: "疑点处理", permissionCode: "page:leak-report:suspect-processing", path: "/pages/leak-report/suspect-processing/suspect-processing", parentId: `${LOCAL_MENU_ID_PREFIX}leak-report`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}leak-report-leak-management`, permissionName: "漏点管理", permissionCode: "page:leak-report:leak-management", path: "/pages/leak-report/leak-management/leak-management", parentId: `${LOCAL_MENU_ID_PREFIX}leak-report`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}leak-report-leak-analysis`, permissionName: "漏点分析", permissionCode: "page:leak-report:leak-analysis", path: "/pages/leak-report/leak-analysis/leak-analysis", parentId: `${LOCAL_MENU_ID_PREFIX}leak-report`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}leak-report-history-overview`, permissionName: "历史总览", permissionCode: "page:leak-report:history-overview", path: "/pages/leak-report/history-overview/history-overview", parentId: `${LOCAL_MENU_ID_PREFIX}leak-report`, permissionType: 1, status: 1 },
    ],
  },
  { id: `${LOCAL_MENU_ID_PREFIX}statistics`, permissionName: "统计分析", permissionCode: "page:statistics", path: "/pages/statistics/statistics", permissionType: 1, status: 1 },
  {
    id: `${LOCAL_MENU_ID_PREFIX}work-order`,
    permissionName: "工单管理",
    permissionCode: "module:work-order",
    path: "/pages/work-order/create/create",
    permissionType: 0,
    status: 1,
    children: [
      { id: `${LOCAL_MENU_ID_PREFIX}work-order-create`, permissionName: "工单创建", permissionCode: "page:work-order:create", path: "/pages/work-order/create/create", parentId: `${LOCAL_MENU_ID_PREFIX}work-order`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}work-order-processing`, permissionName: "工单处理", permissionCode: "page:work-order:processing", path: "/pages/work-order/processing/processing", parentId: `${LOCAL_MENU_ID_PREFIX}work-order`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}work-order-statistics`, permissionName: "工单查询与统计", permissionCode: "page:work-order:statistics", path: "/pages/work-order/statistics/statistics", parentId: `${LOCAL_MENU_ID_PREFIX}work-order`, permissionType: 1, status: 1 },
    ],
  },
  {
    id: `${LOCAL_MENU_ID_PREFIX}alarm`,
    permissionName: "实时报警",
    permissionCode: "module:alarm",
    path: "/pages/alarm/strategy/strategy",
    permissionType: 0,
    status: 1,
    children: [
      { id: `${LOCAL_MENU_ID_PREFIX}alarm-strategy`, permissionName: "报警策略", permissionCode: "page:alarm:strategy", path: "/pages/alarm/strategy/strategy", parentId: `${LOCAL_MENU_ID_PREFIX}alarm`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}alarm-processing`, permissionName: "报警处理", permissionCode: "page:alarm:processing", path: "/pages/alarm/processing/processing", parentId: `${LOCAL_MENU_ID_PREFIX}alarm`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}alarm-analysis`, permissionName: "报警分析", permissionCode: "page:alarm:analysis", path: "/pages/alarm/analysis/analysis", parentId: `${LOCAL_MENU_ID_PREFIX}alarm`, permissionType: 1, status: 1 },
    ],
  },
  {
    id: `${LOCAL_MENU_ID_PREFIX}report`,
    permissionName: "统计报表",
    permissionCode: "module:report",
    path: "/pages/report/generate/generate",
    permissionType: 0,
    status: 1,
    children: [
      { id: `${LOCAL_MENU_ID_PREFIX}report-generate`, permissionName: "报表生成", permissionCode: "page:report:generate", path: "/pages/report/generate/generate", parentId: `${LOCAL_MENU_ID_PREFIX}report`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}report-operation`, permissionName: "报表操作", permissionCode: "page:report:operation", path: "/pages/report/operation/operation", parentId: `${LOCAL_MENU_ID_PREFIX}report`, permissionType: 1, status: 1 },
    ],
  },
  {
    id: `${LOCAL_MENU_ID_PREFIX}data-receive`,
    permissionName: "数据接收和解析",
    permissionCode: "module:data-receive",
    path: "/pages/data-receive/access/access",
    permissionType: 0,
    status: 1,
    children: [
      { id: `${LOCAL_MENU_ID_PREFIX}data-receive-protocol`, permissionName: "协议管理", permissionCode: "page:data-receive:protocol", path: "/pages/data-receive/access/access", parentId: `${LOCAL_MENU_ID_PREFIX}data-receive`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}data-receive-parse`, permissionName: "数据解析", permissionCode: "page:data-receive:parse", path: "/pages/data-receive/parse/parse", parentId: `${LOCAL_MENU_ID_PREFIX}data-receive`, permissionType: 1, status: 1 },
      { id: `${LOCAL_MENU_ID_PREFIX}data-receive-record`, permissionName: "数据记录", permissionCode: "page:data-receive:record", path: "/pages/data-receive/record/record", parentId: `${LOCAL_MENU_ID_PREFIX}data-receive`, permissionType: 1, status: 1 },
    ],
  },
];

const props = defineProps<{
  mode: AdminMode;
}>();

const statusOptions: Array<SelectOption<string | number>> = [
  { label: "全部", value: "" },
  { label: "启用", value: 1 },
  { label: "禁用", value: 0 },
];
const recordStatusOptions: Array<SelectOption<number>> = [
  { label: "启用", value: 1 },
  { label: "禁用", value: 0 },
];
const permissionTypeOptions: Array<SelectOption<number>> = [
  { label: "目录", value: 0 },
  { label: "菜单", value: 1 },
  { label: "按钮", value: 2 },
];
const alarmOptions = [
  { label: "开启实时报警接收", value: "enabled" },
  { label: "Web端系统弹窗", value: "web" },
  { label: "App手机推送", value: "app" },
  { label: "紧急短信通知", value: "sms" },
];

const orgOptions = computed(() => [
  { label: "全部分区", value: "all", count: users.value.length },
  ...partitionOptions.value.map((item) => {
    const id = String(getId(item));
    return {
      label: getPartitionName(item),
      value: id,
      count: users.value.filter((user) => userMatchesPartition(user, id, getPartitionName(item))).length,
    };
  }),
]);

const filters = reactive({
  keyword: "",
  status: "" as string | number,
});
const pagination = reactive({
  pageNum: 1,
  pageSize: 15,
});
const userForm = reactive({
  id: "",
  username: "",
  realName: "",
  phone: "",
  email: "",
  password: "",
  status: 1,
  scope: "company",
  location: "",
});
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
const selectedUserPartitionIds = ref<Array<string | number>>([]);
const selectedMenuIds = ref<Array<string | number>>([]);
const userPartitionDraftIds = ref<Array<string | number>>([]);
const selectedAlarmOptions = ref(["enabled", "web", "app"]);
const activeOrg = ref("all");
const permissionSource = ref<"api" | "local">("api");
const menuSource = ref<"api" | "local">("api");
const total = ref(0);
const loading = ref(false);
const saving = ref(false);
const isCreating = ref(false);
const showUserPassword = ref(false);
const showUserPartitionDialog = ref(false);
const dictCreateTarget = ref<"type" | "item">("item");

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
  if (props.mode === "dict") {
    return dictCreateTarget.value === "type" ? "新增分类" : "新增字典项";
  }

  const map: Record<AdminMode, string> = {
    user: "新增用户",
    auth: "新增角色",
    menu: "新增菜单",
    dict: "新增字典项",
  };
  return map[props.mode];
});
const currentStatusLabel = computed(() => statusOptions.find((item) => item.value === filters.status)?.label || "全部");
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
const selectableMenuIds = computed(() => menus.value.map((item) => getId(item)).filter((id) => isValidId(id) && !isLocalMenuId(id)));
const areAllCurrentMenusSelected = computed(() => {
  const ids = selectableMenuIds.value;
  return ids.length > 0 && ids.every((id) => selectedMenuIds.value.includes(id));
});
const availableUserPartitionOptions = computed(() =>
  partitionOptions.value.filter((item) => {
    const id = getId(item);
    return id && !selectedUserPartitionIds.value.includes(id);
  }),
);
const isAllUserPartitionDraftSelected = computed(() => {
  const ids = availableUserPartitionOptions.value.map((item) => getId(item)).filter(isValidId);
  return ids.length > 0 && ids.every((id) => userPartitionDraftIds.value.includes(id));
});
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
      { label: "当前分区", value: orgOptions.value.find((item) => item.value === activeOrg.value)?.label || "全部分区" },
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
      { label: "目录节点", value: String(menus.value.filter((item) => Number(getValue(item, ["permissionType"])) === 0).length) },
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

function handleStatusChange(event: { detail: { value: number } }) {
  filters.status = statusOptions[event.detail.value]?.value ?? "";
}

function handleUserFormStatusChange(event: { detail: { value: number } }) {
  userForm.status = recordStatusOptions[event.detail.value]?.value ?? 1;
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
  activeOrg.value = value;
  pagination.pageNum = 1;
  void loadUsers();
}

function searchCurrent() {
  pagination.pageNum = 1;
  void refreshCurrent();
}

function resetFilters() {
  filters.keyword = "";
  filters.status = "";
  pagination.pageNum = 1;
}

async function refreshCurrent() {
  if (props.mode === "user") {
    await Promise.all([loadUsers(), loadRoles(), loadPartitions()]);
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

async function loadUserDepts(userId: string | number) {
  if (!userId) return;

  try {
    const response = await getUserDepts(userId);
    assertSuccessResponse(response as ApiResponseLike);
    selectedUserPartitionIds.value = parseListResponse(response as ApiResponseLike)
      .map((item) => getId(item))
      .filter(isValidId);
  } catch {
    // 查询失败时保留 /api/user/page 返回的部门兜底数据
  }
}

async function loadUsers() {
  loading.value = true;
  try {
    const keyword = filters.keyword.trim();
    const response = await getUserPage(removeEmptyFields({
      pageNum: pagination.pageNum,
      pageSize: pagination.pageSize,
      username: keyword || undefined,
      realName: keyword || undefined,
      phone: keyword || undefined,
      status: filters.status === "" ? undefined : filters.status,
      deptId: activeOrg.value === "all" ? undefined : activeOrg.value,
    })) as ApiResponseLike;
    assertSuccessResponse(response);
    const parsed = parsePageResponse(response);
    users.value = parsed.records;
    total.value = parsed.total;
    selectUser(users.value[0] || null);
  } catch (error) {
    users.value = [];
    total.value = 0;
    selectUser(null);
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
  } catch {
    roles.value = [];
  }
}

async function loadPartitions() {
  try {
    const response = await getDeptList() as ApiResponseLike;
    assertSuccessResponse(response);
    partitionOptions.value = parseListResponse(response);
  } catch {
    partitionOptions.value = [];
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
  try {
    const response = await getPermissionTree() as ApiResponseLike;
    assertSuccessResponse(response);
    const records = toTreeRows(parseListResponse(response));
    if (records.length) {
      permissions.value = records;
      permissionSource.value = "api";
    } else {
      permissions.value = getDefaultMenuResources();
      permissionSource.value = "local";
    }
  } catch {
    permissions.value = getDefaultMenuResources();
    permissionSource.value = "local";
  }
}

async function loadMenus() {
  loading.value = true;
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
        total.value = parsed.total;
        menuSource.value = "api";
      } else {
        menus.value = getDefaultMenuResources(keyword);
        total.value = menus.value.length;
        menuSource.value = "local";
      }
    }

    selectMenu(menus.value[0] || null);
    syncSelectedMenuIds();
  } catch (error) {
    const keyword = filters.keyword.trim();
    menus.value = getDefaultMenuResources(keyword);
    total.value = menus.value.length;
    menuSource.value = "local";
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

function selectUser(item: RecordLike | null) {
  selectedUser.value = item;
  isCreating.value = false;
  showUserPassword.value = false;
  Object.assign(userForm, {
    id: item ? String(getId(item)) : "",
    username: item ? getText(item, ["username"], "") : "",
    realName: item ? getText(item, ["realName", "name"], "") : "",
    phone: item ? getText(item, ["phone"], "") : "",
    email: item ? getText(item, ["email"], "") : "",
    password: "",
    status: Number(getValue(item || {}, ["status"]) ?? 1),
    scope: "company",
    location: item ? getText(item, ["location", "address"], "") : "",
  });
  selectedRoleIds.value = getUserRoleIdsFromPageRecord(item);
  selectedUserPartitionIds.value = getArrayValue(item || {}, ["deptIds", "departmentIds", "partitionIds", "depts", "departments", "partitions"])
    .map((value) => (isObject(value) ? getId(value) : value))
    .filter(isValidId);
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
  selectedPermissionIds.value = getArrayValue(item || {}, ["permissionIds", "permissions"]).map((value) => (isObject(value) ? getId(value) : value)).filter(isValidId);
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
    selectUser(null);
    isCreating.value = true;
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
    selectUser(selectedUser.value || users.value[0] || null);
  } else if (props.mode === "auth") {
    selectRole(selectedRole.value || roles.value[0] || null);
  } else if (props.mode === "menu") {
    selectMenu(selectedMenu.value || menus.value[0] || null);
  }
}

async function saveUser() {
  if (!userForm.username.trim() || !userForm.realName.trim() || (isCreating.value && !userForm.password.trim())) {
    uni.showToast({ title: "请填写账号、姓名和初始密码", icon: "none" });
    return;
  }

  saving.value = true;
  try {
    let savedMessage = "用户信息已保存";
    let savedIcon: "success" | "none" = "success";
    const payload = removeEmptyFields({
      username: userForm.username.trim(),
      realName: userForm.realName.trim(),
      phone: userForm.phone.trim(),
      email: userForm.email.trim(),
      password: userForm.password.trim(),
      status: userForm.status,
      deptIds: selectedUserPartitionIds.value,
    });
    const response =
      isCreating.value || !userForm.id
        ? await register({
            username: userForm.username.trim(),
            password: userForm.password.trim(),
            realName: userForm.realName.trim() || undefined,
            phone: userForm.phone.trim() || undefined,
            email: userForm.email.trim() || undefined,
            status: userForm.status,
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
    if (savedUserId) {
      await assignUserDepts(savedUserId, selectedUserPartitionIds.value);
    } else if (selectedUserPartitionIds.value.length) {
      savedMessage = "用户已保存，后端未返回用户ID，请重新选择后绑定分区";
      savedIcon = "none";
    }
    uni.showToast({ title: savedMessage, icon: savedIcon });
    await loadUsers();
  } catch (error) {
    toastError(error, "用户保存失败");
  } finally {
    saving.value = false;
  }
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
  if (!getId(selectedRole.value)) {
    uni.showToast({ title: "请先选择角色", icon: "none" });
    return;
  }
  if (permissionSource.value === "local" || selectedPermissionIds.value.some(isLocalMenuId)) {
    uni.showToast({ title: "请先在菜单管理中保存后端菜单资源，再给角色授权", icon: "none" });
    return;
  }

  saving.value = true;
  try {
    await assignRolePermissions(getId(selectedRole.value), selectedPermissionIds.value);
    uni.showToast({ title: "角色权限已保存", icon: "success" });
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

  saving.value = true;
  try {
    const backendMenuMap = await loadBackendMenuCodeMap();
    const result = { created: 0, skipped: 0 };

    for (const item of defaultMenuTree) {
      await ensureDefaultMenuNode(item, 0, backendMenuMap, result);
    }

    uni.showToast({
      title: `同步完成：新增${result.created}个，跳过${result.skipped}个`,
      icon: "none",
    });
    await loadMenus();
  } catch (error) {
    toastError(error, "默认菜单同步失败");
  } finally {
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
  result?: { created: number; skipped: number },
  includeChildren = true,
) {
  const permissionCode = getText(item, ["permissionCode"], "");
  const existed = permissionCode ? backendMenuMap.get(permissionCode) : undefined;
  let backendId = getId(existed);

  if (backendId) {
    result && (result.skipped += 1);
  } else {
    const payload = buildDefaultMenuPayload(item, parentId);
    const response = await createMenu(payload);
    assertSuccessResponse(response as ApiResponseLike);
    backendId = getCreatedMenuId(response as ApiResponseLike);

    if (!backendId && permissionCode) {
      await refreshBackendMenuCodeMap(backendMenuMap);
      backendId = getId(backendMenuMap.get(permissionCode));
    }

    if (backendId && permissionCode) {
      backendMenuMap.set(permissionCode, { ...payload, id: backendId });
    }
    result && (result.created += 1);
  }

  if (includeChildren) {
    const children = getArrayValue(item, ["children"]).filter(isObject);
    for (const child of children) {
      await ensureDefaultMenuNode(child, backendId || 0, backendMenuMap, result);
    }
  }

  return Number(backendId) || 0;
}

function buildDefaultMenuPayload(item: RecordLike, parentId: string | number) {
  return removeEmptyFields({
    permissionName: getPermissionName(item),
    permissionCode: getText(item, ["permissionCode"], ""),
    path: getText(item, ["path"], ""),
    parentId: Number(parentId) || 0,
    permissionType: Number(getValue(item, ["permissionType"]) ?? 1),
    status: Number(getValue(item, ["status"]) ?? 1),
  });
}

function getCreatedMenuId(response: ApiResponseLike) {
  const data = response.data;
  if (isObject(data)) {
    return getId(data);
  }
  return getId(response as RecordLike);
}

async function loadBackendMenuCodeMap() {
  const map = new Map<string, RecordLike>();
  const records = await loadBackendMenuRecords();
  records.forEach((item) => {
    const code = getText(item, ["permissionCode"], "");
    if (code) {
      map.set(code, item);
    }
  });
  return map;
}

async function refreshBackendMenuCodeMap(map: Map<string, RecordLike>) {
  map.clear();
  const nextMap = await loadBackendMenuCodeMap();
  nextMap.forEach((value, key) => map.set(key, value));
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
    // tree接口不可用时降级使用分页接口。
  }

  const pageResponse = await getMenuPage({ pageNum: 1, pageSize: 500 }) as ApiResponseLike;
  assertSuccessResponse(pageResponse);
  return parsePageResponse(pageResponse).records;
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

  const confirmed = await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: "批量删除菜单",
      content: `确定删除选中的 ${ids.length} 个菜单吗？`,
      confirmText: "删除",
      confirmColor: "#ef4444",
      success: (result) => resolve(Boolean(result.confirm)),
      fail: () => resolve(false),
    });
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
  saving.value = true;
  try {
    if (props.mode === "user" && getId(selectedUser.value)) {
      await deleteUser(getId(selectedUser.value));
      await loadUsers();
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

function toggleUserRole(id: string | number) {
 selectedRoleIds.value = selectedRoleIds.value.includes(id) ? [] : [id];
}

function openUserPartitionDialog() {
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
  toggleId(userPartitionDraftIds.value, id);
}

function toggleAllUserPartitionDraft() {
  const ids = availableUserPartitionOptions.value.map((item) => getId(item)).filter(isValidId);
  userPartitionDraftIds.value = isAllUserPartitionDraftSelected.value ? [] : ids;
}

function confirmUserPartitionBinding() {
  const merged = new Set<string | number>(selectedUserPartitionIds.value);
  userPartitionDraftIds.value.forEach((id) => merged.add(id));
  selectedUserPartitionIds.value = Array.from(merged);
  closeUserPartitionDialog();
}

function removeUserPartition(id: string | number) {
  selectedUserPartitionIds.value = selectedUserPartitionIds.value.filter((item) => item !== id);
}

function togglePermission(id: string | number) {
  toggleId(selectedPermissionIds.value, id);
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

function flattenTree(records: RecordLike[], level = 1): RecordLike[] {
  return records.flatMap((item) => {
    const children = getFirstArray(item, ["children", "childList", "nodes"]).map((child) => (isObject(child) ? child : { value: child }));
    return [{ ...item, __level: level }, ...flattenTree(children, level + 1)];
  });
}

function toTreeRows(records: RecordLike[]) {
  const source = records.filter(isObject);
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
      return [{ ...item, __level: level, children }, ...walk(children, level + 1)];
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
  const partition = partitionOptions.value.find((item) => getId(item) === id);
  return partition ? getPartitionName(partition) : `分区 ${id}`;
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

  const text = getText(user, ["deptName", "departmentName", "partitionName", "location", "address"], "");
  return Boolean(partitionName && text.includes(partitionName));
}

function getPermissionName(item: RecordLike) {
  return getText(item, ["permissionName", "menuName", "name"], "未命名资源");
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
  return Number(value ?? 1) === 0 ? "禁用" : "启用";
}

function getStatusClass(item: RecordLike) {
  return Number(getValue(item, ["status"]) ?? 1) === 0 ? "status-pill--disabled" : "status-pill--enabled";
}

function isValidId(value: unknown): value is string | number {
  return (typeof value === "string" && value !== "") || typeof value === "number";
}
</script>

<style scoped lang="scss">
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
  grid-template-columns: minmax(248px, 0.36fr) minmax(0, 1fr);
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

.side-list__title {
  color: inherit;
  font-size: 13px;
  font-weight: 800;
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

.content-layout--dict {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(260px, 1fr) minmax(158px, 0.42fr);
}

.content-layout--user {
  grid-template-rows: minmax(240px, 0.85fr) minmax(280px, 0.75fr);
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
  width: max-content;
  min-width: 100%;
}

.data-table--user {
  min-width: 1040px;
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

.data-cell.data-cell--status {
  min-width: 100px;
}

.data-cell.data-cell--time {
  min-width: 180px;
}

.data-table--menu .data-cell--name {
  min-width: 180px;
}

.tree-cell-name {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  box-sizing: border-box;
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

.content-layout--user .form-grid--user {
  padding-bottom: 16px;
}

.content-layout--user .form-field {
  overflow: visible;
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
  color: #183755;
  font-size: 16px;
  font-weight: 900;
}

.modal-close {
  color: #64748b;
  font-size: 20px;
  cursor: pointer;
}

.modal-body {
  flex: 1;
  min-height: 0;
  padding: 12px 14px;
  overflow: hidden;
}

.partition-dialog-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 360px;
  margin-top: 10px;
  overflow-y: auto;
}

.partition-dialog-item,
.check-item--select-all {
  min-height: 34px;
  padding: 7px 8px;
  background: #f8fbfe;
  border: 1px solid #d8e6f2;
  border-radius: 4px;
}

.modal-empty {
  padding: 24px 10px;
  color: #8a9aab;
  font-size: 14px;
  text-align: center;
}

.modal-actions {
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #edf3f8;
  border-bottom: 0;
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
  margin-left: auto;
  color: #8a9aab;
  font-size: 12px;
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
    grid-template-rows: minmax(240px, 1fr) minmax(150px, 0.42fr);
  }

  .content-layout--user {
    grid-template-rows: minmax(220px, 0.75fr) minmax(340px, 0.9fr);
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
}
</style>
