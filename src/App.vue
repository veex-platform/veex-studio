<template>
  <div class="w-full h-full bg-[#0d0f14] text-slate-100 flex flex-col overflow-hidden">
    <nav class="h-14 shrink-0 border-b border-white/5 bg-[#131722]/80 backdrop-blur-xl flex items-center justify-between px-4 z-50">
      <div class="flex items-center gap-6">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
            <Database :size="14" class="text-white" />
          </div>
          <h1 class="font-bold text-sm tracking-tight flex items-center gap-2">
            Veex <span class="text-slate-500 font-normal">Studio</span>
          </h1>
        </div>
        <div class="h-4 w-px bg-white/10" />
        <div class="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
          <div class="flex items-center gap-1.5 opacity-60">
            <div class="w-1.5 h-1.5 rounded-full border border-slate-500" />
            Industrial Edge OS
          </div>
          <div class="flex items-center gap-1.5 text-emerald-500/80">
            <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]" />
            Registry: Connected
          </div>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button type="button" class="p-2 hover:bg-white/5 transition rounded-md text-slate-400 hover:text-white" title="Project Settings" @click="isSettingsOpen = true">
          <Settings :size="16" />
        </button>
        <div class="flex items-center gap-2 bg-black/40 border border-white/5 rounded-md px-2 py-1">
          <span class="text-[9px] font-bold text-slate-500 uppercase">Target:</span>
          <select v-model="targetDevice" class="bg-transparent text-[10px] text-blue-400 outline-none cursor-pointer font-mono">
            <option value="all">FROTA GERAL (Cloud)</option>
            <option v-for="d in availableDevices" :key="d.id" :value="d.id">{{ d.id }} ({{ d.status }})</option>
          </select>
        </div>
        <button type="button" class="flex items-center gap-2 px-3 py-1.5 hover:bg-white/5 transition rounded-md text-[10px] font-semibold text-slate-300 border border-white/10" @click="onDownload">
          <Download :size="12" /> .VEX
        </button>
        <div class="flex items-center">
          <button
            type="button"
            :disabled="deploying"
            class="flex items-center gap-2 px-4 py-1.5 rounded-l-md text-[10px] font-bold transition"
            :class="deploying ? 'bg-blue-800' : 'bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20'"
            @click="onDeploy"
          >
            <Zap :size="12" fill="currentColor" />
            {{ deploying ? 'Deploying...' : targetDevice === 'all' ? 'Deploy to Fleet' : 'Instant Flash' }}
          </button>
          <button type="button" class="bg-blue-600 hover:bg-blue-500 border-l border-white/10 px-1 py-1.5 rounded-r-md">
            <ChevronDown :size="14" />
          </button>
        </div>
        <div class="ml-2 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 hover:border-blue-500/50 transition cursor-pointer overflow-hidden">
          <UserCircle :size="20" class="text-slate-400" />
        </div>
      </div>
    </nav>
    <div class="flex-1 flex overflow-hidden">
      <Library
        :remote-templates="remoteTemplates"
        @load-template="onLoadTemplate"
      />
      <main class="flex-1 relative bg-[#0b0e14] border-r border-white/5" @dragover.prevent @drop.prevent="onDrop">
        <VueFlow
          v-model:nodes="nodes"
          v-model:edges="edges"
          :node-types="nodeTypes"
          fit-view-on-init
          @connect="onConnect"
          @init="(e) => (flowInstance = e)"
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @pane-click="onPaneClick"
        />
      </main>
      <aside class="w-[300px] shrink-0 bg-[#131722]/50 backdrop-blur-3xl flex flex-col min-h-0 border-l border-white/5">
        <div class="flex-1 p-4 font-mono text-[10px] overflow-auto text-blue-100/40 leading-relaxed">
          <pre>{{ vdlPreview }}</pre>
        </div>
      </aside>
    </div>
    <Transition name="slide">
      <div
        v-if="status"
        class="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-2 rounded-full text-[10px] font-bold shadow-2xl border flex items-center gap-2"
        :class="statusClass"
      >
        {{ status }}
      </div>
    </Transition>
    <SettingsModal :open="isSettingsOpen" :config="projectConfig" @close="isSettingsOpen = false" @save="updateConfig" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, markRaw, onMounted } from 'vue'
import { VueFlow, addEdge } from '@vue-flow/core'
import type { Node, Edge, Connection } from '@vue-flow/core'
import { Database, Settings, Download, Zap, ChevronDown, UserCircle } from 'lucide-vue-next'
import ActionNode from './components/ActionNode.vue'
import Library from './components/Library.vue'
import SettingsModal from './components/SettingsModal.vue'

const nodeTypes = { action: markRaw(ActionNode) } as Record<string, import('vue').Component>
const flowInstance = ref<{ screenToFlowCoordinate: (p: { x: number; y: number }) => { x: number; y: number } } | null>(null)

const nodes = ref<Node[]>([
  { id: '1', type: 'input', data: { label: 'Boot Sequence' }, position: { x: 300, y: 50 }, class: 'bg-white !text-slate-900 border-none rounded-lg px-6 py-3 font-bold shadow-xl !w-[160px] text-center text-[10px]' },
  { id: '2', type: 'action', data: { label: 'Industrial Blink', action: 'write', type: 'platform.gpio', params: { pin: '2', level: '1' } }, position: { x: 300, y: 150 } }
])
const edges = ref<Edge[]>([
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } }
])

const isSettingsOpen = ref(false)
const deploying = ref(false)
const status = ref<string | null>(null)
const statusType = ref<'info' | 'success' | 'error' | 'loading'>('info')
const targetDevice = ref('all')
const remoteTemplates = ref<{ id: string; title: string; description?: string; vdl?: string }[]>([])
const availableDevices = ref<{ id: string; status: string }[]>([])

const projectConfig = ref<{
  target: string
  wifi: { ssid: string; password: string }
  mqtt: { broker: string }
  registry: { url: string }
}>({
  target: 'esp32',
  wifi: { ssid: 'Factory_Guest', password: 'secure_iot_pass' },
  mqtt: { broker: 'tcp://broker.emqx.io:1883' },
  registry: { url: import.meta.env.VITE_REGISTRY_URL || 'https://registry.veexplatform.com/api/v1' }
})

const registryUrl = computed(() => {
  const u = projectConfig.value.registry?.url
  if (!u) return 'https://registry.veexplatform.com/api/v1'
  if (u.startsWith('http')) return u
  if (u.startsWith('/')) return `${window.location.origin}${u}`
  return u
})

const vdlPreview = computed(() => {
  const actionNodes = nodes.value
    .filter((n) => n.id !== '1' && n.type === 'action')
    .sort((a, b) => a.position.y - b.position.y)
  const steps = actionNodes
    .map((n) => {
      const d = n.data as Record<string, unknown>
      return `    - name: "${n.id}_${d.action}"\n      capability: "${d.type}"\n      action: "${d.action}"\n      params:\n${Object.entries((d.params as Record<string, unknown>) || {}).map(([k, v]) => `        ${k}: ${typeof v === 'string' && !v.startsWith('0x') ? `"${v}"` : v}`).join('\n')}`
    })
    .join('\n')
  const c = projectConfig.value
  return `vdlVersion: "1.0"\nenvironment:\n  target: "${c.target}"\n  wifi:\n    ssid: "${c.wifi.ssid}"\n    password: "${c.wifi.password}"\n  mqtt:\n    broker: "${c.mqtt.broker}"\nflows:\n  main_loop:\n    steps:\n${steps}`
})

const statusClass = computed(() => {
  switch (statusType.value) {
    case 'success': return 'bg-emerald-600 border-emerald-400/20 text-white'
    case 'error': return 'bg-red-600 border-red-400/20 text-white'
    case 'loading': return 'bg-blue-600 border-blue-400/20 text-white'
    default: return 'bg-slate-800 border-white/10 text-slate-200'
  }
})

let id = 3
const getId = () => String(id++)

function onConnect(params: Connection) {
  const newEdges = addEdge({ ...params, animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } }, edges.value as Edge[])
  edges.value = newEdges as Edge[]
}
function onNodeClick() {}
function onEdgeClick() {}
function onPaneClick() {}

function onDrop(e: DragEvent) {
  const data = e.dataTransfer?.getData('application/reactflow')
  if (!data) return
  const nodeData = JSON.parse(data)
  const pos = (flowInstance.value as { screenToFlowCoordinate?: (p: { x: number; y: number }) => { x: number; y: number } })?.screenToFlowCoordinate?.({ x: e.clientX, y: e.clientY }) ?? { x: 200, y: 200 }
  nodes.value = [
    ...nodes.value,
    {
    id: getId(),
    type: 'action',
    position: pos,
    data: {
      label: nodeData.label,
      type: nodeData.capability,
      action: nodeData.action,
      params: { ...nodeData.params }
    }
  } as Node
  ]
}

function onLoadTemplate(newNodes: Node[], newEdges: Edge[]) {
  nodes.value = newNodes
  edges.value = newEdges
  statusType.value = 'info'
  status.value = 'Template Loaded Successfully'
  setTimeout(() => { status.value = null }, 2000)
}

async function onDeploy() {
  deploying.value = true
  statusType.value = 'loading'
  status.value = 'Building industrial artifact...'
  try {
    const res = await fetch(`${registryUrl.value}/dev/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'visual-blink', version: '1.0.0', vdl: vdlPreview.value })
    })
    if (res.ok) {
      if (targetDevice.value === 'all') {
        statusType.value = 'success'
        status.value = 'Artifact registered in Cloud.'
      } else {
        const deployRes = await fetch(`${registryUrl.value}/dev/deploy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device_id: targetDevice.value, artifact_id: 'visual-blink-1.0.0' })
        })
        statusType.value = deployRes.ok ? 'success' : 'error'
        status.value = deployRes.ok ? `Flash Success: ${targetDevice.value} updated.` : `Deploy Failed`
      }
    } else {
      statusType.value = 'error'
      status.value = `Build Failed: ${await res.text()}`
    }
  } catch {
    statusType.value = 'error'
    status.value = 'Registry Connection Failed'
  } finally {
    deploying.value = false
    setTimeout(() => { status.value = null }, 4000)
  }
}

async function onDownload() {
  statusType.value = 'loading'
  status.value = 'Preparing download...'
  try {
    const res = await fetch(`${registryUrl.value}/dev/build`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'visual-blink', version: '1.0.0', vdl: vdlPreview.value })
    })
    if (res.ok) {
      const art = await res.json()
      window.open(art.download_url, '_blank')
      statusType.value = 'success'
      status.value = 'Download Started'
    } else {
      statusType.value = 'error'
      status.value = 'Failed to generate .vex'
    }
  } catch {
    statusType.value = 'error'
    status.value = 'Registry Offline'
  } finally {
    setTimeout(() => { status.value = null }, 3000)
  }
}

function updateConfig(c: typeof projectConfig.value) {
  projectConfig.value = c
}

onMounted(() => {
  fetch(`${registryUrl.value}/dev/templates`).then((r) => r.json()).then((d) => { remoteTemplates.value = d }).catch(() => {})
  fetch(`${registryUrl.value}/admin/devices`).then((r) => r.json()).then((d) => { availableDevices.value = d }).catch(() => {})
})
</script>

<style>
.slide-enter-active, .slide-leave-active { transition: all 0.2s ease; }
.slide-enter-from, .slide-leave-to { transform: translate(-50%, 20px); opacity: 0; }
</style>
