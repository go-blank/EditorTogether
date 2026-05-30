/**
 * 将 px 值按设计稿宽度比例转换为 vw 单位
 * @param {number} px      - 设计稿中的像素值
 * @param {number} width   - 设计稿宽度（默认 375，iPhone 标准）
 * @returns {string}        - 带 vw 单位的字符串
 *
 * @example
 * pxToVw(100)          // → '26.6667vw'
 * pxToVw(16, 750)      // → '2.1333vw'（设计稿 750px 时）
 */
export function pxToVw(px, width = 375) {
  if (typeof px !== 'number' || px === 0) return '0'
  return ((px / width) * 100).toFixed(4) + 'vw'
}
