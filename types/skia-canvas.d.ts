// types/skia-canvas.d.ts
import type * as SkiaCanvas from 'skia-canvas'

// 扩展 skia-canvas 的默认导出类型，添加 createCanvas 方法
declare module 'skia-canvas' {
  export default interface SkiaCanvas {
    createCanvas: (width: number, height: number) => HTMLCanvasElement
  }
}
