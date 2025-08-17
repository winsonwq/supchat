// 基础组件类 - 所有可渲染组件的父类
import { RenderableComponent } from '../types.js'

export abstract class BaseComponent implements RenderableComponent {
  abstract render(): string
}
