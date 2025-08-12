Component({
  options: {
    styleIsolation: 'apply-shared'
  },
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: ''
    },
    zIndex: {
      type: Number,
      value: 1000
    },
    closeOnMask: {
      type: Boolean,
      value: true
    }
  },
  data: {},
  methods: {
    onMaskTap() {
      if (this.properties.closeOnMask) {
        this.triggerEvent('close')
      }
    },
    onClose() {
      this.triggerEvent('close')
    },
    noop() {}
  }
})
