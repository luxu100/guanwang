<script lang="ts">
/**
 * 应用根组件。
 *
 * 当前根组件只承载全局样式，后台通用布局由各业务页引入 AppShell。
 * 这样登录页可以保持独立视觉，不受后台顶部栏和侧边栏影响。
 */
export default {};
</script>

<style lang="scss">
/* 全局基础样式入口：页面背景、字体和盒模型等跨页面规则统一在 global.scss 维护。 */
@use "@/styles/global.scss";
@use "@/styles/localized-en.scss";
</style>
