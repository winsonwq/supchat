// 简化的 SVG 图标组件
Component({
  options: {
    styleIsolation: 'apply-shared'
  },

  /**
   * 组件的属性列表
   */
  properties: {
    // 图标名称
    name: {
      type: String,
      value: ''
    },
    // 图标大小（rpx）
    size: {
      type: Number,
      value: 48
    },
    // 图标颜色
    color: {
      type: String,
      value: ''
    },
    // 是否禁用点击
    disabled: {
      type: Boolean,
      value: false
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    iconPath: '', // 图标路径
    iconStyle: '' // 图标样式
  },

  /**
   * 组件生命周期
   */
  lifetimes: {
    attached() {
      this.updateIcon()
    }
  },

  /**
   * 属性变化监听
   */
  observers: {
    'name, size, color': function() {
      this.updateIcon()
    }
  },

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 更新图标
     */
    updateIcon() {
      const { name, size, color } = this.data
      
      if (!name) {
        this.setData({
          iconPath: '',
          iconStyle: ''
        })
        return
      }

      // 构建图标路径
      const iconPath = `/assets/icons/${name}.svg`
      let iconStyle = `width: ${size}rpx; height: ${size}rpx;`
      
      // 如果有颜色属性，添加滤镜样式
      if (color) {
        iconStyle += ` filter: brightness(0) saturate(100%) ${this.colorToFilter(color)};`
      }

      this.setData({
        iconPath,
        iconStyle
      })
    },

    /**
     * 颜色转换为滤镜
     */
    colorToFilter(color: string): string {
      // 预定义的颜色主题
      const colorMap: { [key: string]: string } = {
        'primary': 'invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)',
        'success': 'invert(64%) sepia(88%) saturate(1747%) hue-rotate(89deg) brightness(96%) contrast(86%)',
        'warning': 'invert(60%) sepia(98%) saturate(1175%) hue-rotate(11deg) brightness(103%) contrast(101%)',
        'danger': 'invert(24%) sepia(89%) saturate(1812%) hue-rotate(347deg) brightness(102%) contrast(105%)',
        'white': 'invert(100%)',
        'black': 'invert(0%)',
        'gray': 'invert(50%)'
      }

      // 如果是预定义颜色，返回对应的滤镜
      if (colorMap[color]) {
        return colorMap[color]
      }

      // 如果是十六进制颜色，转换为滤镜（简化处理）
      if (color.startsWith('#')) {
        return `drop-shadow(0 0 0 ${color})`
      }

      // 默认返回原颜色
      return `drop-shadow(0 0 0 ${color})`
    },

    /**
     * 点击事件
     */
    onTap() {
      if (!this.data.disabled) {
        this.triggerEvent('tap', {
          name: this.data.name
        })
      }
    },

    /**
     * 图片加载失败处理
     */
    onImageError(e: any) {
      console.warn(`SVG icon "${this.data.name}" load failed:`, e.detail)
      // 可以设置一个默认的占位符
      this.setData({
        iconPath: ''
      })
    }
  }
})
