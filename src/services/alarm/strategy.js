/**
 * 报警规则接口封装，围绕 /api/alarm-rule 资源提供 CRUD 能力。
 *
 * 页面层应优先调用这里导出的语义化函数，避免在 .vue 文件中直接拼接接口地址。
 */
import { createCrudService } from "@/services/shared/crud";

const alarmRuleApi = createCrudService("/api/alarm-rule");

/** 分页查询报警规则（按名称模糊/类型/级别/启用状态/生效范围筛选）。 */
export const getRulePage = alarmRuleApi.getPage;

/** 获取规则下拉列表（可带 enabled 筛选）。 */
export const getRuleList = alarmRuleApi.getList;

/** 根据 ID 获取规则详情。 */
export const getRuleDetail = alarmRuleApi.getDetail;

/** 新建报警规则。 */
export const createRule = alarmRuleApi.create;

/** 更新报警规则。 */
export const updateRule = alarmRuleApi.update;

/** 删除报警规则（默认逻辑删除，request 层自动追加 is_force）。 */
export const deleteRule = alarmRuleApi.delete;

export default {
  getRulePage,
  getRuleList,
  getRuleDetail,
  createRule,
  updateRule,
  deleteRule,
};
