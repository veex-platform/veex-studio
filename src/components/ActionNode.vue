<template>
  <div
    class="min-w-[170px] bg-[#131722]/95 backdrop-blur-xl border-2 rounded-xl shadow-2xl overflow-hidden transition-all duration-300 group"
    :class="selected ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-white/5'"
  >
    <div :class="['px-3 py-1.5 bg-gradient-to-r flex items-center gap-2 border-b border-white/5', themeClass.split(' ')[0], themeClass.split(' ')[1]]">
      <component :is="iconComponent" :size="12" />
      <span class="text-[9px] font-black uppercase tracking-[0.2em] text-white/80">{{ capabilityName }}</span>
      <div class="ml-auto opacity-0 group-hover:opacity-100 transition">
        <Settings :size="10" class="text-white/40 hover:text-white" />
      </div>
    </div>
    <div class="p-3 bg-slate-900/20">
      <h3 class="text-[11px] font-bold text-slate-100 mb-1.5 leading-tight">{{ data.label }}</h3>
      <div class="flex flex-col gap-1">
        <div class="flex items-center justify-between text-[8px] font-mono text-slate-500 uppercase">
          <span>Action</span>
          <span class="text-blue-400/80">{{ data.action }}</span>
        </div>
        <div
          v-for="([k, v]) in paramEntries"
          :key="k"
          class="flex justify-between items-center text-[9px] font-mono border-t border-white/[0.03] pt-1 mt-1"
        >
          <span class="text-slate-500 lowercase">{{ k }}</span>
          <span class="text-blue-200/90">{{ String(v) }}</span>
        </div>
      </div>
    </div>
    <Handle type="target" :position="Position.Top" class="!w-2 !h-2 !bg-blue-500 !border-none !-top-1 opacity-0 group-hover:opacity-100 transition" />
    <Handle type="source" :position="Position.Bottom" class="!w-2 !h-2 !bg-blue-500 !border-none !-bottom-1 opacity-0 group-hover:opacity-100 transition" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position, useNode } from '@vue-flow/core'
import { Settings, Cpu, Globe, Network, Bluetooth, Clock, Send, Thermometer, Zap } from 'lucide-vue-next'

const { node } = useNode()
const data = computed(() => (node && 'data' in node ? node.data : {}) as Record<string, unknown>)
const selected = computed(() => (node && 'selected' in node ? node.selected : false) as boolean)

const iconMap: Record<string, unknown> = {
  'platform.gpio': Cpu,
  'platform.core': Clock,
  'comm.mqtt': Send,
  'comm.can': Network,
  'comm.http': Globe,
  'comm.grpc': Globe,
  'comm.ble': Bluetooth,
  'platform.sensor': Thermometer
}

const colorMap: Record<string, string> = {
  'platform.gpio': 'from-blue-600/40 text-blue-400',
  'platform.core': 'from-slate-600/40 text-slate-400',
  'comm.mqtt': 'from-emerald-600/40 text-emerald-400',
  'comm.can': 'from-orange-600/40 text-orange-400',
  'comm.http': 'from-indigo-600/40 text-indigo-400',
  'platform.sensor': 'from-rose-600/40 text-rose-400'
}

const capability = computed(() => (data.value?.type as string) ?? 'platform.core')
const iconComponent = computed(() => iconMap[capability.value] || Zap)
const themeClass = computed(() => colorMap[capability.value] || 'from-blue-600/40 text-blue-400')
const capabilityName = computed(() => capability.value.split('.')[1] || 'core')
const paramEntries = computed(() => Object.entries((data.value?.params as Record<string, unknown>) ?? {}).slice(0, 2))
</script>
