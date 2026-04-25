<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  extractTags,
  resolveTagExtractorConfig,
  type TagDefinition,
  type TagExtractionResult,
} from '@browser-tag-extractor/core'

const sampleText = `We are looking to increase the trainers ability to perform tasks by providing them training. The agreement also funds coaching materials, peer learning sessions, and follow-up support for regional coordinators who will document participant progress over the next two quarters.`

const defaultTags: TagDefinition[] = [
  tag('capacity-building', 'Capacity building', 'Training, staffing, coaching, tools, governance, or organizational capability.', ['training', 'skills', 'coaching', 'technical assistance']),
  tag('infrastructure', 'Infrastructure', 'Construction, renovation, facilities, equipment, capital assets, or physical upgrades.', ['construction', 'renovation', 'facility', 'equipment']),
  tag('community-benefit', 'Community benefit', 'Direct benefit to residents, neighbourhoods, public users, or community partners.', ['public benefit', 'community impact', 'local benefit']),
  tag('health-services', 'Health services', 'Clinical, public health, mental health, prevention, treatment, or care navigation services.', ['clinic', 'mental health', 'public health', 'care navigation']),
  tag('workforce-development', 'Workforce development', 'Employment services, job placements, apprenticeships, labour-market access, or career training.', ['job placement', 'employment', 'apprenticeship', 'workforce']),
  tag('digital-access', 'Digital access', 'Broadband, devices, digital literacy, connectivity, or online service access.', ['broadband', 'devices', 'digital literacy', 'connectivity']),
]

const text = ref(sampleText)
const taxonomyText = ref(defaultTags.map((item) => `${item.key}: ${item.label.en} - ${item.description.en}`).join('\n'))
const minScore = ref(0.2)
const maxSuggestions = ref(4)
const minDynamicScore = ref(0.34)
const maxDynamicTags = ref(6)
const dynamicNgramMax = ref(3)
const status = ref('Ready')
const result = ref<TagExtractionResult>({ predefined: [], dynamic: [] })

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
  .filter((item) => item.key && item.label.en))

const topPredefined = computed(() => result.value.predefined)
const topDynamic = computed(() => result.value.dynamic)

onMounted(() => {
  watch([text, taxonomyText, minScore, maxSuggestions, minDynamicScore, maxDynamicTags, dynamicNgramMax], () => {
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
  result.value = await extractTags({
    text: text.value,
    tags: parsedTags.value,
    config: {
      minScore: minScore.value,
      maxSuggestions: maxSuggestions.value,
      minDynamicScore: minDynamicScore.value,
      maxDynamicTags: maxDynamicTags.value,
      dynamicNgramMax: dynamicNgramMax.value,
    },
  }, undefined, resolveTagExtractorConfig())

  if (token === runToken) {
    status.value = 'Ready'
  }
}

function resetExample() {
  text.value = sampleText
  taxonomyText.value = defaultTags.map((item) => `${item.key}: ${item.label.en} - ${item.description.en}`).join('\n')
  minScore.value = 0.2
  maxSuggestions.value = 4
  minDynamicScore.value = 0.34
  maxDynamicTags.value = 6
  dynamicNgramMax.value = 3
}

function scoreLabel(value: number) {
  return value.toFixed(3)
}

function tag(key: string, label: string, description: string, aliases: string[]): TagDefinition {
  return {
    key,
    label: { en: label, fr: label },
    description: { en: description, fr: description },
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
          <span>Minimum fixed score</span>
          <input v-model.number="minScore" type="range" min="0" max="1" step="0.01">
          <strong>{{ scoreLabel(minScore) }}</strong>
        </label>
        <label>
          <span>Fixed tag limit</span>
          <input v-model.number="maxSuggestions" type="range" min="1" max="8" step="1">
          <strong>{{ maxSuggestions }}</strong>
        </label>
        <label>
          <span>Minimum dynamic score</span>
          <input v-model.number="minDynamicScore" type="range" min="0" max="1" step="0.01">
          <strong>{{ scoreLabel(minDynamicScore) }}</strong>
        </label>
        <label>
          <span>Dynamic tag limit</span>
          <input v-model.number="maxDynamicTags" type="range" min="1" max="12" step="1">
          <strong>{{ maxDynamicTags }}</strong>
        </label>
        <label>
          <span>Maximum n-gram size</span>
          <input v-model.number="dynamicNgramMax" type="range" min="1" max="4" step="1">
          <strong>{{ dynamicNgramMax }}</strong>
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
          <span v-if="topPredefined.length === 0" class="tag-example__empty">No fixed tags above threshold</span>
        </div>
      </div>

      <div>
        <h3>Dynamic tags</h3>
        <div class="tag-example__chips">
          <span v-for="item in topDynamic" :key="item.label" class="tag-example__chip tag-example__chip--dynamic">
            {{ item.label }}
            <small>{{ scoreLabel(item.score) }}</small>
          </span>
          <span v-if="topDynamic.length === 0" class="tag-example__empty">No dynamic tags above threshold</span>
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
  grid-template-columns: repeat(5, minmax(0, 1fr));
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

.tag-example__buttons {
  display: flex;
  gap: 8px;
}

.tag-example button {
  height: 38px;
  border: 1px solid var(--vp-c-brand-1);
  border-radius: 8px;
  background: var(--vp-c-brand-1);
  color: var(--vp-c-white);
  font-weight: 700;
  padding: 0 14px;
  cursor: pointer;
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
