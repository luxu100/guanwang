export const deptOptions = [{ label: '全部分区', value: '' }, { label: '东区', value: 1 }, { label: '西区', value: 2 }, { label: '南区', value: 3 }, { label: '北区', value: 4 }];
export function validateRange(form: Record<string, any>, required = true) {
    const start = form.startTime, end = form.endTime;
    const parse = (s: string) => new Date(s.replace(/-/g, '/')).getTime();
    let message = '';
    if (required && (!start || !end))
        message = '请选择完整的统计时间范围';
    else if ((start && !Number.isFinite(parse(start))) || (end && !Number.isFinite(parse(end))))
        message = '时间格式无效';
    else if (start && end && parse(start) > parse(end))
        message = '开始时间不能晚于结束时间';
    else if (start && end && parse(end) - parse(start) > 366 * 86400000)
        message = '单次查询时间范围请控制在一年以内';
    if (message)
        uni.showToast({ title: message, icon: 'none' });
    return !message;
}
// uni-app H5 的 view ref 可能是组件实例；v-for 中的 ref 则是数组。
export function chartElement(value: any): HTMLElement | null {
    const node = Array.isArray(value) ? value[0] : value;
    return node?.$el || node || null;
}
