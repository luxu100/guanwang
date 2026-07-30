/**
 * 统一全量分页工具。
 *
 * 用于替换三个目标页面及 localized 版中的 `pageSize: 99999` 全量拉取。
 * 按页读取，不声称具备数据库事务快照一致性；并发写入期间允许导出结果与 total 存在时间差。
 */

interface PageResponseLike {
  code?: number;
  msg?: string;
  data?: unknown;
}

interface ParsedPage<T> {
  records: T[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export interface FetchAllPagesOptions {
  /** 每页大小，默认 200 */
  pageSize?: number;
  /** 最大并发请求数，默认 5 */
  concurrency?: number;
}

/**
 * 从响应中提取业务成功状态、记录列表和 total。
 * 兼容 {code:200, data:{records,total}} 和 {code:0, data:{records,total}} 两种格式。
 */
function parsePageResponse<T>(res: unknown): ParsedPage<T> {
  const r = res as PageResponseLike;
  const code = r?.code;
  if (code !== undefined && code !== 0 && code !== 200) {
    const msg = (r as { msg?: string })?.msg || "请求失败";
    throw { code, msg };
  }

  const d = r?.data ?? r;
  const pg = findPageObj(d) || findPageObj(r) || (isObj(d) ? d : {});
  const recs = extractArray(pg, ["records", "rows", "list", "items"]);
  const finalRecs = recs.length > 0 ? recs : extractArray(r, ["records", "rows", "list", "items"]);
  const totalNum = extractNumber(pg, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"])
    ?? extractNumber(r, ["total", "count", "totalCount", "totalRow", "totalRows", "totalElements"]);
  const current = extractNumber(pg, ["current", "pageNum", "page", "pageNo"]) ?? 1;
  const size = extractNumber(pg, ["size", "pageSize", "limit"]) ?? 200;

  return {
    records: finalRecs.map((item: unknown) => (isObj(item) ? item : { value: item }) as T),
    total: totalNum === undefined ? finalRecs.length : totalNum,
    pageNum: current,
    pageSize: size,
  };
}

function findPageObj(v: unknown): Record<string, unknown> | null {
  if (!isObj(v)) return null;
  if (extractArray(v, ["records", "rows", "list", "items"]).length > 0
    || extractNumber(v, ["total", "count", "totalCount"]) !== undefined) {
    return v as Record<string, unknown>;
  }
  for (const k of ["data", "result", "page", "pageData"]) {
    const m = findPageObj((v as Record<string, unknown>)[k]);
    if (m) return m;
  }
  return null;
}

function extractArray(v: unknown, keys: string[]): unknown[] {
  if (!isObj(v)) return [];
  for (const k of keys) {
    const a = (v as Record<string, unknown>)[k];
    if (Array.isArray(a)) return a;
  }
  return [];
}

function extractNumber(v: unknown, keys: string[]): number | undefined {
  if (!isObj(v)) return undefined;
  for (const k of keys) {
    const a = (v as Record<string, unknown>)[k];
    if (typeof a === "number") return a;
    if (typeof a === "string" && a.trim() && !isNaN(Number(a))) return Number(a);
  }
  return undefined;
}

function isObj(v: unknown): v is Record<string, unknown> {
  return Boolean(v && typeof v === "object" && !Array.isArray(v));
}

/**
 * 分批并发执行异步任务，限制最大并发数。
 */
async function runWithConcurrency<T, R>(
  tasks: T[],
  fn: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const current = index++;
      results[current] = await fn(tasks[current]);
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * 全量分页拉取工具。
 *
 * @param pageRequest 分页请求函数，接收包含 pageNum/pageSize 的参数对象，返回响应
 * @param baseParams 基础查询参数（不含 pageNum/pageSize），调用开始时浅拷贝冻结
 * @param options 可选配置
 * @returns 合并后的全部记录数组
 *
 * 固定行为：
 * 1. 默认 pageSize=200、最大并发 5；
 * 2. 第 1 页读取 total，计算剩余页；
 * 3. 每页执行业务成功断言和响应解析；
 * 4. 任一页失败整体失败，不返回部分结果；
 * 5. 按页码顺序合并，不按 Promise 完成顺序拼接；
 * 6. 合并后记录数必须等于第 1 页返回的 total，否则视为并发数据变化并整体失败；
 * 7. 不静默截断，不声称具备数据库事务快照一致性。
 */
export async function fetchAllPages<T = Record<string, unknown>>(
  pageRequest: (params: Record<string, unknown>) => Promise<unknown>,
  baseParams: Record<string, unknown>,
  options?: FetchAllPagesOptions,
): Promise<T[]> {
  const pageSize = options?.pageSize ?? 200;
  const concurrency = options?.concurrency ?? 5;

  // 浅拷贝并冻结基础参数，移除可能的 pageNum/pageSize
  const frozenParams: Record<string, unknown> = {};
  for (const key of Object.keys(baseParams)) {
    if (key !== "pageNum" && key !== "pageSize") {
      frozenParams[key] = baseParams[key];
    }
  }
  Object.freeze(frozenParams);

  // 第 1 页
  const firstRes = await pageRequest({ ...frozenParams, pageNum: 1, pageSize });
  const firstPage = parsePageResponse<T>(firstRes);

  if (firstPage.total === 0) {
    return [];
  }

  // 收集所有页结果，按页码顺序存放
  const allPages: ParsedPage<T>[] = new Array(1);
  allPages[0] = firstPage;

  // 计算剩余页
  const totalPages = Math.ceil(firstPage.total / pageSize);
  if (totalPages > 1) {
    const remainingPageNums = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);

    const remainingResults = await runWithConcurrency(
      remainingPageNums,
      async (pageNum) => {
        const res = await pageRequest({ ...frozenParams, pageNum, pageSize });
        return { pageNum, parsed: parsePageResponse<T>(res) };
      },
      concurrency,
    );

    for (const { pageNum, parsed } of remainingResults) {
      allPages[pageNum - 1] = parsed;
    }
  }

  // 按页码顺序合并记录
  const allRecords: T[] = [];
  for (const page of allPages) {
    allRecords.push(...page.records);
  }

  // 合并后记录数必须等于第 1 页返回的 total
  if (allRecords.length !== firstPage.total) {
    throw {
      code: -1,
      msg: `全量拉取记录数(${allRecords.length})与总数(${firstPage.total})不一致，数据可能已变化，请重试`,
    };
  }

  return allRecords;
}
