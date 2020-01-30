import Vue from 'vue'
import { hasFetch, normalizeError } from '../utils'

function getDataDiff(o1, o2) {
  const diff = {}
  for (const key in o2) {
    if (o1[key] !== o2[key]) {
      diff[key] = o2[key]
    }
  }
  return diff
}

export default {
  beforeCreate () {
    if (hasFetch(this)) {
      this._fetchOnServer = this.$options.fetchOnServer !== false
      Vue.util.defineReactive(this, '$fetchState', {
        pending: !this._fetchOnServer,
        error: null,
        timestamp: Date.now()
      })
    }
  },
  async serverPrefetch () {
    if (this._fetchOnServer && hasFetch(this)) {
      const data = Object.assign({}, this.$data)

      try {
        await this.$options.fetch.call(this)
      } catch (err) {
        this.$fetchState.error = normalizeError(err)
      }
      // Define an ssrKey for hydration
      this._ssrKey = this.$ssrContext.nuxt.data.length

      // Add data-ssr-key on parent element of Component
      const attrs = this.$vnode.data.attrs = this.$vnode.data.attrs || {}
      attrs['data-ssr-key'] = this._ssrKey

      // Call asyncData & add to ssrContext for window.__NUXT__.asyncData
      this.$ssrContext.nuxt.data.push(this.$fetchState.error ? { _error: this.$fetchState.error } : getDataDiff(data, this.$data))
    }
  }
}
