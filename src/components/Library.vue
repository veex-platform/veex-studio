<template>
  <div class="w-[260px] shrink-0 border-r border-white/5 bg-[#131722]/40 backdrop-blur-xl flex flex-col h-full z-40">
    <div class="p-4 border-b border-white/5 bg-white/5">
      <div class="relative group">
        <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition" />
        <input
          type="text"
          placeholder="Search capabilities..."
          class="w-full bg-black/40 border border-white/10 rounded-lg py-1.5 pl-9 pr-4 text-[11px] text-slate-300 focus:border-blue-500/50 outline-none transition"
        />
      </div>
    </div>
    <div class="flex-1 overflow-y-auto py-4 scrollbar-hide">
      <h2 class="px-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Industrial Templates</h2>
      <div class="mb-6">
        <div class="mt-2 px-4 space-y-2">
          <button
            v-for="tmpl in templates"
            :key="tmpl.id"
            type="button"
            class="w-full text-left p-3 rounded-lg bg-white/5 border border-white/5 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
            @click="$emit('load-template', tmpl.nodes, tmpl.edges)"
          >
            <div class="flex items-center gap-3 mb-1">
              <component :is="tmpl.icon" :size="14" class="text-blue-500 group-hover:scale-110 transition-transform" />
              <span class="text-[11px] font-bold text-slate-200">{{ tmpl.title }}</span>
            </div>
            <p class="text-[9px] text-slate-500 leading-tight">{{ tmpl.description }}</p>
          </button>
          <button
            v-for="tmpl in remoteTemplates"
            :key="tmpl.id"
            type="button"
            class="w-full text-left p-3 rounded-lg bg-blue-600/10 border border-blue-500/20 hover:border-blue-400 hover:bg-blue-600/20 transition-all group"
            @click="$emit('load-template', parseVDL(tmpl.vdl || '').nodes, parseVDL(tmpl.vdl || '').edges)"
          >
            <div class="flex items-center gap-3 mb-1">
              <Globe :size="14" class="text-emerald-500 group-hover:scale-110 transition-transform" />
              <span class="text-[11px] font-bold text-slate-100">{{ tmpl.title }}</span>
            </div>
            <p class="text-[9px] text-slate-400 leading-tight">{{ tmpl.description }} (Remote)</p>
          </button>
        </div>
      </div>
      <div class="h-px bg-white/5 mx-5 mb-6" />
      <h2 class="px-5 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Capabilities</h2>
      <div v-for="cat in categories" :key="cat.id" class="mb-1">
        <div
          v-for="item in cat.items"
          :key="item.label"
          class="group flex items-center gap-3 px-10 py-2 cursor-grab active:cursor-grabbing hover:bg-blue-600/10 transition-all border-l-2 border-transparent hover:border-blue-500"
          draggable
          @dragstart="onDragStart($event, item)"
        >
          <component :is="item.icon" :size="14" class="text-slate-500 group-hover:text-blue-400 transition" />
          <span class="text-[11px] text-slate-400 group-hover:text-slate-200 transition truncate">{{ item.label }}</span>
        </div>
      </div>
    </div>
    <div class="p-6 text-center border-t border-white/5 bg-slate-950/20">
      <p class="text-[9px] text-slate-600 uppercase tracking-widest leading-loose">Drag items to canvas<br />to define logic</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Send, Cpu, Globe } from 'lucide-vue-next'
import type { Node, Edge } from '@vue-flow/core'

defineProps<{
  remoteTemplates?: { id: string; title: string; description?: string; vdl?: string }[]
}>()

defineEmits<{
  (e: 'load-template', nodes: Node[], edges: Edge[]): void
}>()

const templates = [
  {
    id: 'tmpl-mqtt',
    title: 'MQTT Remote I/O',
    description: 'Control GPIO pins via MQTT messages.',
    icon: Send,
    nodes: [
      { id: '1', type: 'input', data: { label: 'Boot Sequence' }, position: { x: 250, y: 0 }, class: 'bg-white !text-slate-900 border-none rounded-lg px-6 py-3 font-bold shadow-xl !w-[160px] text-center text-[10px]' },
      { id: '2', type: 'action', data: { label: 'Listen MQTT', action: 'subscribe', type: 'comm.mqtt', params: { topic: 'v1/device/control/+' } }, position: { x: 250, y: 100 } },
      { id: '3', type: 'action', data: { label: 'Write GPIO', action: 'write', type: 'platform.gpio', params: { pin: '2', level: '$PAYLOAD' } }, position: { x: 250, y: 200 } }
    ] as Node[],
    edges: [
      { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } },
      { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } }
    ] as Edge[]
  }
]

const categories = [
  { id: 'digital', title: 'Digital I/O & Bus', items: [
    { type: 'action', label: 'GPIO Write', capability: 'platform.gpio', icon: Cpu, params: { pin: '2', level: '1' }, action: 'write' }
  ]}
]

function onDragStart(e: DragEvent, nodeData: Record<string, unknown>) {
  if (!e.dataTransfer) return
  e.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData))
  e.dataTransfer.effectAllowed = 'move'
}

function parseVDL(vdlStr: string): { nodes: Node[]; edges: Edge[] } {
  const newNodes: Node[] = [
    { id: '1', type: 'input', data: { label: 'Boot Sequence' }, position: { x: 250, y: 0 }, class: 'bg-white !text-slate-900 border-none rounded-lg px-6 py-3 font-bold shadow-xl !w-[160px] text-center text-[10px]' }
  ]
  const newEdges: Edge[] = []
  if (!vdlStr.trim()) return { nodes: newNodes, edges: newEdges }
  const stepLines = vdlStr.split('\n')
  let currentStep: Record<string, unknown> | null = null
  let y = 100
  let prevId = '1'
  stepLines.forEach((line) => {
    const trimmed = line.trim()
    if (trimmed.startsWith('- name:')) {
      if (currentStep) {
        const id = String(newNodes.length + 1)
        newNodes.push({ id, type: 'action', position: { x: 250, y }, data: currentStep })
        newEdges.push({ id: `e${prevId}-${id}`, source: prevId, target: id, animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } })
        prevId = id
        y += 100
      }
      currentStep = { label: trimmed.split('"')[1], params: {} }
    } else if (trimmed.startsWith('capability:') && currentStep) {
      currentStep.type = trimmed.split('"')[1]
    } else if (trimmed.startsWith('action:') && currentStep) {
      currentStep.action = trimmed.split('"')[1]
    } else if (trimmed.startsWith('params:') && currentStep && trimmed.includes('{')) {
      const pStr = trimmed.split('{')[1]?.split('}')[0] ?? ''
      pStr.split(',').forEach((p) => {
        const [k, v] = p.split(':').map((s) => s.trim().replace(/"/g, ''))
        if (k && v) (currentStep!.params as Record<string, string>)[k] = v
      })
    }
  })
  if (currentStep) {
    const id = String(newNodes.length + 1)
    newNodes.push({ id, type: 'action', position: { x: 250, y }, data: currentStep })
    newEdges.push({ id: `e${prevId}-${id}`, source: prevId, target: id, animated: true, style: { stroke: '#475569', strokeWidth: 1, strokeDasharray: '5,5' } })
  }
  return { nodes: newNodes, edges: newEdges }
}
</script>
