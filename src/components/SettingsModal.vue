<template>
  <div v-if="open" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center">
    <div class="bg-[#131722] border border-white/10 rounded-xl shadow-2xl w-[500px] overflow-hidden">
      <div class="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <h2 class="text-sm font-bold text-slate-100 uppercase tracking-widest flex items-center gap-2">
          <Server :size="14" class="text-blue-500" />
          Project Settings
        </h2>
        <button type="button" class="text-slate-500 hover:text-white transition" @click="$emit('close')">
          <X :size="16" />
        </button>
      </div>
      <div class="p-6 space-y-6">
        <div class="space-y-3">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu :size="12" class="text-blue-400" /> Target Hardware
          </label>
          <div class="grid grid-cols-2 gap-3">
            <button
              v-for="t in ['esp32', 'm5stack-core2']"
              :key="t"
              type="button"
              class="px-4 py-2 rounded-lg text-[11px] font-mono border transition text-left"
              :class="local.target === t ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/5'"
              @click="local.target = t"
            >
              {{ t }}
            </button>
          </div>
        </div>
        <div class="space-y-4">
          <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Wifi :size="12" class="text-emerald-400" /> Connectivity
          </label>
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <span class="text-[10px] text-slate-400">WiFi SSID</span>
              <input
                v-model="local.wifi.ssid"
                type="text"
                class="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-[11px] text-slate-300 outline-none focus:border-emerald-500/50"
              />
            </div>
            <div class="space-y-1.5">
              <span class="text-[10px] text-slate-400">WiFi Password</span>
              <input
                v-model="local.wifi.password"
                type="password"
                class="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-[11px] text-slate-300 outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
          <div class="space-y-1.5">
            <span class="text-[10px] text-slate-400">MQTT Broker URL</span>
            <input
              v-model="local.mqtt.broker"
              type="text"
              placeholder="tcp://broker.hivemq.com:1883"
              class="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-[11px] text-slate-300 outline-none focus:border-blue-500/50 font-mono"
            />
          </div>
          <div class="space-y-1.5">
            <span class="text-[10px] text-slate-400">Registry API URL</span>
            <input
              v-model="local.registry.url"
              type="text"
              placeholder="https://registry.veexplatform.com"
              class="w-full bg-black/40 border border-white/10 rounded px-3 py-1.5 text-[11px] text-slate-300 outline-none focus:border-blue-500/50 font-mono"
            />
          </div>
        </div>
      </div>
      <div class="p-4 border-t border-white/5 bg-black/20 flex justify-end">
        <button
          type="button"
          class="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition shadow-lg shadow-blue-500/20"
          @click="save"
        >
          <Save :size="14" /> Save Configuration
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { X, Save, Server, Wifi, Cpu } from 'lucide-vue-next'

const props = defineProps<{
  open: boolean
  config: {
    target: string
    wifi: { ssid: string; password: string }
    mqtt: { broker: string }
    registry: { url: string }
  }
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', config: typeof props.config): void
}>()

const local = ref({
  target: props.config.target,
  wifi: { ...props.config.wifi },
  mqtt: { ...props.config.mqtt },
  registry: { ...props.config.registry }
})

watch(() => props.config, (c) => {
  local.value.target = c.target
  local.value.wifi = { ...c.wifi }
  local.value.mqtt = { ...c.mqtt }
  local.value.registry = { ...c.registry }
}, { deep: true })

function save() {
  emit('save', { ...local.value })
  emit('close')
}
</script>
