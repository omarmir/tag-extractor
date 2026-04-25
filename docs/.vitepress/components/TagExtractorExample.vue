<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  createTagExtractor,
  type PredefinedTag,
  type TagExtractorResult,
} from '@browser-tag-extractor/core'

const sampleText = `The document describes a developer documentation portal with API reference cleanup, code example testing, and release note automation. The team will validate each example against the current SDK, update the knowledge base navigation, and publish a short migration guide for users.`

const defaultTags: PredefinedTag[] = [
  tag('software-engineering', 'Software engineering', 'Application code, APIs, frontend work, backend services, testing, refactoring, or developer workflows.', ['api', 'frontend', 'backend', 'tests']),
  tag('content-documentation', 'Content and documentation', 'Documentation, knowledge bases, release notes, editorial workflows, training material, or style guidance.', ['documentation', 'knowledge base', 'release notes', 'style guide']),
  tag('product-management', 'Product management', 'Roadmaps, product discovery, prioritization, release planning, requirements, or feature adoption.', ['roadmap', 'requirements', 'product discovery', 'feature adoption']),
  tag('customer-support', 'Customer support', 'Ticket triage, help desk operations, customer onboarding, support playbooks, escalations, or service recovery.', ['support ticket', 'help desk', 'onboarding', 'escalation']),
  tag('security-compliance', 'Security and compliance', 'Access controls, audit readiness, privacy, risk reviews, encryption, policy controls, or compliance evidence.', ['access control', 'audit', 'privacy', 'encryption']),
  tag('data-analytics', 'Data and analytics', 'Dashboards, metrics, data pipelines, reporting, experimentation, warehouse models, or analytics instrumentation.', ['dashboard', 'metrics', 'data pipeline', 'analytics']),
]

const text = ref(sampleText)
const taxonomyText = ref(defaultTags.map((item) => `${item.key}: ${item.label} - ${item.description}`).join('\n'))
const k = ref(5)
const allowDynamicTags = ref(true)
const status = ref('Ready')
const result = ref<TagExtractorResult>({ predefined: [], dynamic: [] })
const extractor = createTagExtractor()

let runToken = 0

const parsedTags = computed(() => taxonomyText.value
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const [keyPart, rest = keyPart] = line.split(':')
    const [labelPart = rest, descriptionPart = rest] = rest.split(' - ')
    return tag(
      keyPart.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      labelPart.trim(),
      descriptionPart.trim(),
      labelPart.toLowerCase().split(/\s+/).filter((word) => word.length > 4),
    )
  })
    .filter((item) => item.key && item.label))

const topPredefined = computed(() => result.value.predefined)
const topDynamic = computed(() => result.value.dynamic)

onMounted(() => {
  watch([text, taxonomyText, k, allowDynamicTags], () => {
    const token = runToken + 1
    runToken = token
    status.value = 'Calculating'
    window.setTimeout(() => {
      if (token === runToken) {
        void runExtractor()
      }
    }, 220)
  }, { immediate: true })
})

async function runExtractor() {
  const token = runToken
  status.value = 'Calculating'
  result.value = await extractor.extract({
    text: text.value,
    predefinedTags: parsedTags.value,
    allowDynamicTags: allowDynamicTags.value,
    k: k.value,
  })

  if (token === runToken) {
    status.value = 'Ready'
  }
}

function resetExample() {
  text.value = sampleText
  taxonomyText.value = defaultTags.map((item) => `${item.key}: ${item.label} - ${item.description}`).join('\n')
  k.value = 5
  allowDynamicTags.value = true
}

function scoreLabel(value: number) {
  return value.toFixed(3)
}

function tag(key: string, label: string, description: string, aliases: string[]): PredefinedTag {
  return {
    key,
    label,
    description,
    aliases,
  }
}
</script>

<template>
  <section class="tag-example">
    <div class="tag-example__header">
      <div>
        <p class="tag-example__eyebrow">Interactive example</p>
        <h2>Hybrid tag extraction</h2>
      </div>
      <div class="tag-example__status" :data-state="status.toLowerCase()">
        <span />
        {{ status }}
      </div>
    </div>

    <div class="tag-example__grid">
      <label class="tag-example__panel tag-example__panel--wide">
        <span>Narrative</span>
        <textarea v-model="text" rows="9" />
      </label>

      <label class="tag-example__panel">
        <span>Taxonomy</span>
        <textarea v-model="taxonomyText" rows="9" />
      </label>

      <div class="tag-example__panel tag-example__controls">
        <label>
          <span>Suggestion count K</span>
          <input v-model.number="k" type="range" min="1" max="20" step="1">
          <strong>{{ k }}</strong>
        </label>
        <label class="tag-example__toggle">
          <input v-model="allowDynamicTags" type="checkbox">
          <span>Dynamic tags</span>
        </label>
        <div class="tag-example__buttons">
          <button type="button" @click="runExtractor">Run extractor</button>
          <button type="button" class="tag-example__secondary" @click="resetExample">Reset</button>
        </div>
      </div>
    </div>

    <div class="tag-example__results">
      <div>
        <h3>Fixed taxonomy</h3>
        <div class="tag-example__chips">
          <span v-for="item in topPredefined" :key="item.key" class="tag-example__chip tag-example__chip--fixed">
            {{ item.key }}
            <small>{{ scoreLabel(item.score) }}</small>
          </span>
          <span v-if="topPredefined.length === 0" class="tag-example__empty">No fixed tags returned</span>
        </div>
      </div>

      <div>
        <h3>Dynamic tags</h3>
        <div class="tag-example__chips">
          <span v-for="item in topDynamic" :key="item.label" class="tag-example__chip tag-example__chip--dynamic">
            {{ item.label }}
            <small>{{ scoreLabel(item.score) }}</small>
          </span>
          <span v-if="topDynamic.length === 0" class="tag-example__empty">No dynamic tags returned</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tag-example {
  margin: 32px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
  overflow: hidden;
}

.tag-example__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.tag-example__eyebrow {
  margin: 0 0 4px;
  color: var(--vp-c-brand-1);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.tag-example h2,
.tag-example h3 {
  margin: 0;
  border: 0;
  padding: 0;
}

.tag-example__status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 112px;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 600;
}

.tag-example__status span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--vp-c-brand-1);
}

.tag-example__status[data-state="calculating"] span {
  animation: tag-pulse 0.8s infinite ease-in-out;
}

.tag-example__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
  gap: 16px;
  padding: 20px;
}

.tag-example__panel {
  display: grid;
  gap: 10px;
  min-width: 0;
  color: var(--vp-c-text-2);
  font-size: 13px;
  font-weight: 700;
}

.tag-example__panel--wide {
  min-height: 280px;
}

.tag-example textarea {
  width: 100%;
  min-width: 0;
  resize: vertical;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
  font: inherit;
  font-weight: 400;
  line-height: 1.55;
  padding: 12px;
}

.tag-example__controls {
  grid-column: 1 / -1;
  grid-template-columns: minmax(180px, 1fr) minmax(140px, auto) minmax(220px, auto);
  align-items: end;
  border-top: 1px solid var(--vp-c-divider);
  padding-top: 16px;
}

.tag-example__controls label {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.tag-example input[type="range"] {
  width: 100%;
  accent-color: var(--vp-c-brand-1);
}

.tag-example__toggle {
  display: inline-flex !important;
  grid-template-columns: auto 1fr;
  align-items: center;
}

.tag-example__toggle input {
  accent-color: var(--vp-c-brand-1);
}

.tag-example__buttons {
  display: flex;
  gap: 8px;
  min-width: 220px;
}

.tag-example button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  font-weight: 700;
  padding: 0 14px;
  cursor: pointer;
  white-space: nowrap;
}

.tag-example button.tag-example__secondary {
  background: transparent;
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-divider);
}

.tag-example__results {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding: 0 20px 20px;
}

.tag-example__results > div {
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  padding: 16px;
}

.tag-example__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag-example__chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 700;
}

.tag-example__chip small {
  opacity: 0.72;
}

.tag-example__chip--fixed {
  background: color-mix(in srgb, var(--vp-c-brand-1) 16%, transparent);
  color: var(--vp-c-brand-1);
}

.tag-example__chip--dynamic {
  background: color-mix(in srgb, var(--vp-c-green-1) 16%, transparent);
  color: var(--vp-c-green-1);
}

.tag-example__empty {
  color: var(--vp-c-text-3);
  font-size: 13px;
}

@media (max-width: 760px) {
  .tag-example__header,
  .tag-example__grid,
  .tag-example__results {
    grid-template-columns: 1fr;
  }

  .tag-example__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .tag-example__controls {
    grid-template-columns: 1fr;
  }

  .tag-example__buttons {
    min-width: 0;
  }
}

@keyframes tag-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
