import type { TagDefinition } from '@browser-tag-extractor/core/benchmark'

export type BenchmarkCase = {
  id: string
  domain: string
  profile: 'direct' | 'mixed' | 'negative'
  text: string
  tags: TagDefinition[]
  expectedTags: string[]
  expectedDynamicTags: string[]
  rejectedTags: string[]
}

export const BENCHMARK_TAGS: TagDefinition[] = [
  tag('product-management', 'Product management', 'Roadmaps, product discovery, prioritization, release planning, requirements, or feature adoption.', ['roadmap', 'requirements', 'product discovery', 'feature adoption']),
  tag('software-engineering', 'Software engineering', 'Application code, APIs, frontend work, backend services, testing, refactoring, or developer workflows.', ['api', 'frontend', 'backend', 'tests']),
  tag('infrastructure-ops', 'Infrastructure operations', 'Cloud infrastructure, deployments, observability, reliability, networking, or incident operations.', ['deployment', 'observability', 'networking', 'reliability']),
  tag('security-compliance', 'Security and compliance', 'Access controls, audit readiness, privacy, risk reviews, encryption, policy controls, or compliance evidence.', ['access control', 'audit', 'privacy', 'encryption']),
  tag('data-analytics', 'Data and analytics', 'Dashboards, metrics, data pipelines, reporting, experimentation, warehouse models, or analytics instrumentation.', ['dashboard', 'metrics', 'data pipeline', 'analytics']),
  tag('customer-support', 'Customer support', 'Ticket triage, help desk operations, customer onboarding, support playbooks, escalations, or service recovery.', ['support ticket', 'help desk', 'onboarding', 'escalation']),
  tag('sales-marketing', 'Sales and marketing', 'Campaigns, lead generation, positioning, lifecycle messaging, sales enablement, or conversion work.', ['campaign', 'lead generation', 'positioning', 'sales enablement']),
  tag('finance-billing', 'Finance and billing', 'Budgets, invoices, billing operations, revenue recognition, cost controls, purchasing, or financial reporting.', ['invoice', 'billing', 'budget', 'revenue']),
  tag('legal-contracts', 'Legal and contracts', 'Contracts, terms, procurement language, legal review, obligations, negotiation, or policy interpretation.', ['contract', 'terms', 'legal review', 'procurement']),
  tag('people-hr', 'People and HR', 'Hiring, onboarding, performance processes, benefits, manager training, compensation, or employee relations.', ['hiring', 'performance review', 'benefits', 'employee relations']),
  tag('research-insights', 'Research and insights', 'User research, interviews, surveys, evidence reviews, market research, usability studies, or synthesis.', ['user research', 'survey', 'interview', 'usability']),
  tag('content-documentation', 'Content and documentation', 'Documentation, knowledge bases, release notes, editorial workflows, training material, or style guidance.', ['documentation', 'knowledge base', 'release notes', 'style guide']),
]

type Scenario = {
  domain: string
  expectedTags: string[]
  rejectedTags: string[]
  subject: string
  directDetails: string[]
  mixedDetails: string[]
  negativeText: string
}

const SCENARIOS: Scenario[] = [
  scenario('roadmap-prioritization', ['product-management', 'research-insights'], ['finance-billing', 'infrastructure-ops'], 'quarterly roadmap planning', ['customer interview synthesis', 'feature prioritization workshop', 'adoption metric review'], ['requirements cleanup', 'user feedback review'], 'The note is only a travel reimbursement request and does not describe roadmap planning, customer research, or feature decisions.'),
  scenario('api-refactor', ['software-engineering', 'infrastructure-ops'], ['sales-marketing', 'people-hr'], 'payments API refactor', ['backend service cleanup', 'contract test coverage', 'deployment rollback plan'], ['api test plan', 'release coordination'], 'The memo discusses a hiring panel schedule and has no application code, API, deployment, or test work.'),
  scenario('access-review', ['security-compliance', 'people-hr'], ['sales-marketing', 'content-documentation'], 'employee access review', ['role-based access cleanup', 'manager attestation workflow', 'audit evidence export'], ['access policy update', 'employee offboarding checks'], 'The update describes a product launch email and does not mention access controls, audits, or employee permissions.'),
  scenario('dashboard-migration', ['data-analytics', 'infrastructure-ops'], ['legal-contracts', 'people-hr'], 'executive dashboard migration', ['warehouse model rebuild', 'metric definition cleanup', 'observability alerts'], ['dashboard QA', 'pipeline monitoring'], 'The task asks for contract signature routing and has no dashboards, metrics, data models, or operations work.'),
  scenario('support-playbook', ['customer-support', 'content-documentation'], ['finance-billing', 'security-compliance'], 'support escalation playbook', ['ticket triage rules', 'knowledge base updates', 'service recovery scripts'], ['help desk workflow', 'article cleanup'], 'The issue is about cloud subnet tagging and does not involve support tickets, help desk workflows, or documentation.'),
  scenario('campaign-launch', ['sales-marketing', 'data-analytics'], ['infrastructure-ops', 'legal-contracts'], 'self-serve campaign launch', ['lifecycle messaging tests', 'lead source attribution', 'conversion dashboard'], ['positioning review', 'campaign metric tracking'], 'The request is for invoice approval and does not describe a campaign, lead generation, or conversion measurement.'),
  scenario('billing-dispute', ['finance-billing', 'customer-support'], ['software-engineering', 'research-insights'], 'billing dispute workflow', ['invoice adjustment rules', 'customer escalation queue', 'refund approval tracking'], ['billing operations', 'support handoff'], 'The brief summarizes usability interviews and has no invoice, refund, customer billing, or finance process.'),
  scenario('vendor-contract', ['legal-contracts', 'finance-billing'], ['software-engineering', 'research-insights'], 'vendor contract renewal', ['procurement clause review', 'payment schedule comparison', 'renewal obligation checklist'], ['legal review', 'budget approval'], 'The ticket describes frontend accessibility fixes and does not include legal terms, procurement, or billing review.'),
  scenario('manager-training', ['people-hr', 'content-documentation'], ['data-analytics', 'sales-marketing'], 'manager onboarding program', ['performance review guidance', 'benefits overview material', 'new manager checklist'], ['training content', 'employee handbook update'], 'The page documents database indexes and has no hiring, benefits, manager training, or employee process.'),
  scenario('usability-study', ['research-insights', 'product-management'], ['finance-billing', 'security-compliance'], 'checkout usability study', ['participant interview guide', 'prototype task analysis', 'recommendation synthesis'], ['user research plan', 'feature discovery notes'], 'The request is to rotate encryption keys and does not include interviews, usability testing, or product discovery.'),
  scenario('release-notes', ['content-documentation', 'product-management'], ['people-hr', 'finance-billing'], 'release notes workflow', ['feature summary drafting', 'editorial review queue', 'customer-facing change log'], ['documentation planning', 'roadmap reference cleanup'], 'The note asks for expense category mapping and has no release notes, documentation, or feature communication.'),
  scenario('incident-runbook', ['infrastructure-ops', 'content-documentation'], ['sales-marketing', 'legal-contracts'], 'incident response runbook', ['alert routing table', 'reliability checklist', 'post-incident template'], ['runbook cleanup', 'observability notes'], 'The document outlines a newsletter campaign and does not cover incidents, reliability, alerts, or operational documentation.'),
  scenario('privacy-assessment', ['security-compliance', 'legal-contracts'], ['customer-support', 'sales-marketing'], 'privacy impact assessment', ['data retention review', 'legal basis mapping', 'audit trail requirements'], ['privacy checklist', 'contract addendum review'], 'The ticket creates a support macro and has no privacy assessment, legal basis, or compliance evidence.'),
  scenario('data-pipeline', ['data-analytics', 'software-engineering'], ['people-hr', 'legal-contracts'], 'event data pipeline', ['analytics instrumentation', 'schema validation tests', 'warehouse load monitoring'], ['metric pipeline', 'backend event cleanup'], 'The update concerns employee benefits enrollment and does not describe code, analytics, or data pipeline changes.'),
  scenario('sales-enablement', ['sales-marketing', 'content-documentation'], ['security-compliance', 'infrastructure-ops'], 'sales enablement kit', ['competitive positioning sheet', 'demo script refresh', 'knowledge base links'], ['sales collateral', 'content review'], 'The task is to increase Kubernetes memory limits and has no sales material, positioning, or documentation kit.'),
  scenario('hiring-plan', ['people-hr', 'finance-billing'], ['software-engineering', 'customer-support'], 'department hiring plan', ['headcount budget update', 'interview loop design', 'compensation band review'], ['hiring forecast', 'budget reconciliation'], 'The story is about a customer refund queue and does not include recruiting, compensation, or headcount planning.'),
  scenario('contract-api', ['legal-contracts', 'software-engineering'], ['sales-marketing', 'people-hr'], 'partner API terms', ['data sharing clause review', 'developer integration requirements', 'contract obligation mapping'], ['legal technical review', 'api onboarding terms'], 'The note summarizes a brand campaign and has no partner contract, legal obligation, or integration requirement.'),
  scenario('support-analytics', ['customer-support', 'data-analytics'], ['legal-contracts', 'people-hr'], 'support quality dashboard', ['ticket resolution metrics', 'escalation trend analysis', 'service level reporting'], ['help desk analytics', 'queue performance review'], 'The request edits procurement language and does not involve support tickets, metrics, or service reporting.'),
  scenario('security-runbook', ['security-compliance', 'infrastructure-ops'], ['sales-marketing', 'finance-billing'], 'security incident runbook', ['key rotation steps', 'access revocation checklist', 'forensic log capture'], ['incident response drills', 'audit log retention'], 'The update is a pricing page experiment and has no security controls, access revocation, or infrastructure response work.'),
  scenario('content-audit', ['content-documentation', 'research-insights'], ['finance-billing', 'infrastructure-ops'], 'documentation content audit', ['reader survey analysis', 'outdated article inventory', 'style guide recommendations'], ['knowledge base review', 'documentation survey'], 'The item is about invoice aging and does not include documentation, surveys, or content quality work.'),
  scenario('forecast-model', ['data-analytics', 'finance-billing'], ['people-hr', 'content-documentation'], 'revenue forecast model', ['billing cohort analysis', 'pipeline forecast dashboard', 'variance reporting'], ['finance metrics review', 'forecast data cleanup'], 'The task rewrites onboarding documentation and has no revenue model, billing analysis, or finance dashboard.'),
  scenario('frontend-accessibility', ['software-engineering', 'product-management'], ['finance-billing', 'people-hr'], 'frontend accessibility release', ['component test fixes', 'keyboard navigation requirements', 'feature rollout checklist'], ['frontend QA', 'release acceptance criteria'], 'The note schedules employee interviews and does not include frontend code, requirements, or release planning.'),
  scenario('market-research', ['research-insights', 'sales-marketing'], ['infrastructure-ops', 'security-compliance'], 'market segment research', ['competitor positioning review', 'buyer interview synthesis', 'campaign audience recommendations'], ['market survey', 'positioning analysis'], 'The task adds server health checks and does not include market research, interviews, or campaign strategy.'),
  scenario('procurement-controls', ['finance-billing', 'security-compliance'], ['customer-support', 'product-management'], 'procurement control review', ['purchase approval thresholds', 'vendor risk questionnaire', 'audit evidence retention'], ['spend control policy', 'vendor compliance review'], 'The request triages customer password reset tickets and has no procurement, spend, or compliance review.'),
  scenario('customer-onboarding', ['customer-support', 'product-management'], ['legal-contracts', 'infrastructure-ops'], 'customer onboarding journey', ['setup checklist redesign', 'activation milestone tracking', 'support handoff process'], ['onboarding flow', 'adoption follow-up'], 'The note patches network routing and does not describe customer onboarding, activation, or support handoffs.'),
  scenario('developer-docs', ['content-documentation', 'software-engineering'], ['finance-billing', 'sales-marketing'], 'developer documentation portal', ['api reference cleanup', 'code example testing', 'release note automation'], ['technical writing', 'example validation'], 'The memo reviews revenue recognition and has no developer documentation, API examples, or release notes.'),
  scenario('data-privacy', ['security-compliance', 'data-analytics'], ['sales-marketing', 'people-hr'], 'analytics privacy review', ['event minimization rules', 'consent metric dashboard', 'data retention monitoring'], ['privacy-safe analytics', 'data governance checks'], 'The work item creates a sales one-pager and does not include analytics privacy, retention, or consent metrics.'),
  scenario('benefits-support', ['people-hr', 'customer-support'], ['software-engineering', 'infrastructure-ops'], 'benefits support queue', ['employee ticket routing', 'benefits eligibility guide', 'escalation response templates'], ['hr help desk', 'benefits article updates'], 'The request builds an API rate limiter and has no employee benefits, ticket routing, or HR support material.'),
  scenario('deployment-costs', ['infrastructure-ops', 'finance-billing'], ['research-insights', 'people-hr'], 'deployment cost reduction', ['cloud spend analysis', 'autoscaling policy update', 'capacity forecast review'], ['cost dashboard', 'infrastructure optimization'], 'The task plans usability interviews and does not include cloud costs, capacity, deployments, or finance review.'),
  scenario('policy-docs', ['legal-contracts', 'content-documentation'], ['data-analytics', 'customer-support'], 'policy documentation refresh', ['terms update summary', 'legal review annotations', 'knowledge base publishing plan'], ['policy rewrite', 'editorial legal review'], 'The ticket describes dashboard instrumentation and has no legal policy, terms, or documentation publishing work.'),
]

const VARIANTS = [
  { profile: 'direct' as const, prefix: 'The document covers', detailIndex: 0 },
  { profile: 'direct' as const, prefix: 'The work item focuses on', detailIndex: 1 },
  { profile: 'direct' as const, prefix: 'The team will improve', detailIndex: 2 },
  { profile: 'direct' as const, prefix: 'The plan prioritizes', detailIndex: 0 },
  { profile: 'mixed' as const, prefix: 'The note mentions', detailIndex: 0 },
  { profile: 'mixed' as const, prefix: 'The brief includes', detailIndex: 1 },
  { profile: 'mixed' as const, prefix: 'The request proposes', detailIndex: 0 },
  { profile: 'negative' as const, prefix: '', detailIndex: 0 },
  { profile: 'negative' as const, prefix: '', detailIndex: 0 },
  { profile: 'direct' as const, prefix: 'The project centers on', detailIndex: 1 },
]

export const BENCHMARK_CASES: BenchmarkCase[] = SCENARIOS.flatMap((item) =>
  VARIANTS.map((variant, index) => ({
    id: `${item.domain}-${index + 1}`,
    domain: item.domain,
    profile: variant.profile,
    text: renderText(item, variant),
    tags: BENCHMARK_TAGS,
    expectedTags: variant.profile === 'negative' ? [] : item.expectedTags,
    expectedDynamicTags: variant.profile === 'negative' ? [] : buildExpectedDynamicTags(item, variant),
    rejectedTags: variant.profile === 'negative' ? item.expectedTags : item.rejectedTags,
  }))
)

if (BENCHMARK_CASES.length !== 300) {
  throw new Error(`Expected 300 benchmark cases, received ${BENCHMARK_CASES.length}`)
}

function tag(
  key: string,
  en: string,
  descriptionEn: string,
  aliases: string[],
): TagDefinition {
  return {
    key,
    label: { en, fr: en },
    description: { en: descriptionEn, fr: descriptionEn },
    aliases,
  }
}

function scenario(
  domain: string,
  expectedTags: string[],
  rejectedTags: string[],
  subject: string,
  directDetails: string[],
  mixedDetails: string[],
  negativeText: string,
): Scenario {
  return {
    domain,
    expectedTags,
    rejectedTags,
    subject,
    directDetails,
    mixedDetails,
    negativeText,
  }
}

function renderText(item: Scenario, variant: typeof VARIANTS[number]) {
  if (variant.profile === 'negative') {
    return `${item.negativeText} The surrounding paragraph is intentionally ordinary: it includes status updates, ownership notes, calendar details, and follow-up reminders. It avoids the operational phrases tied to the rejected taxonomy so the extractor must not infer categories from generic business language alone.`
  }

  const details = variant.profile === 'direct' ? item.directDetails : item.mixedDetails
  const detail = details[variant.detailIndex % details.length] ?? details[0] ?? item.subject
  const secondDetail = details[(variant.detailIndex + 1) % details.length] ?? detail

  return `${variant.prefix} ${item.subject} through ${detail} and ${secondDetail}. The paragraph describes owners, milestones, expected artifacts, review checkpoints, and how the work will be validated before it is shared with users or stakeholders. It also includes surrounding business context so the extractor must identify the specific operational phrases instead of relying on generic words like project, task, or update.`
}

function buildExpectedDynamicTags(item: Scenario, variant: typeof VARIANTS[number]) {
  const details = variant.profile === 'direct' ? item.directDetails : item.mixedDetails
  const detail = details[variant.detailIndex % details.length] ?? details[0]
  const secondDetail = details[(variant.detailIndex + 1) % details.length] ?? detail

  return [
    item.subject,
    detail,
    secondDetail,
  ].filter(Boolean)
}
