import type { TagDefinition } from '@browser-tag-extractor/core'

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
  tag('capacity-building', 'Capacity building', 'Renforcement des capacités', 'Training, staffing, coaching, tools, governance, or organizational capability.', ['training', 'skills', 'coaching', 'technical assistance']),
  tag('infrastructure', 'Infrastructure', 'Infrastructure', 'Construction, renovation, facilities, equipment, capital assets, or physical upgrades.', ['construction', 'renovation', 'facility', 'equipment']),
  tag('community-benefit', 'Community benefit', 'Avantage communautaire', 'Direct benefit to residents, neighbourhoods, public users, or community partners.', ['public benefit', 'community impact', 'local benefit']),
  tag('health-services', 'Health services', 'Services de santé', 'Clinical, public health, mental health, prevention, treatment, or care navigation services.', ['clinic', 'mental health', 'public health', 'care navigation']),
  tag('housing-support', 'Housing support', 'Soutien au logement', 'Affordable housing, shelter, homelessness prevention, rent supports, or transitional housing.', ['shelter', 'affordable housing', 'homelessness', 'rent support']),
  tag('workforce-development', 'Workforce development', 'Développement de la main-d’œuvre', 'Employment services, job placements, apprenticeships, labour-market access, or career training.', ['job placement', 'employment', 'apprenticeship', 'workforce']),
  tag('food-security', 'Food security', 'Sécurité alimentaire', 'Food banks, meals, nutrition programs, food distribution, or community kitchens.', ['food bank', 'meal delivery', 'nutrition', 'community kitchen']),
  tag('digital-access', 'Digital access', 'Accès numérique', 'Broadband, devices, digital literacy, connectivity, or online service access.', ['broadband', 'devices', 'digital literacy', 'connectivity']),
  tag('environmental-sustainability', 'Environmental sustainability', 'Durabilité environnementale', 'Energy efficiency, emissions reduction, climate adaptation, waste diversion, or conservation.', ['energy efficiency', 'climate adaptation', 'emissions', 'waste diversion']),
  tag('public-safety', 'Public safety', 'Sécurité publique', 'Emergency preparedness, violence prevention, safety planning, crisis response, or protective services.', ['emergency preparedness', 'violence prevention', 'safety planning', 'crisis response']),
  tag('research-evaluation', 'Research and evaluation', 'Recherche et évaluation', 'Studies, evidence reviews, pilots, evaluation frameworks, data collection, or outcome measurement.', ['evaluation', 'pilot study', 'data collection', 'research']),
  tag('arts-culture', 'Arts and culture', 'Arts et culture', 'Cultural programming, heritage, artists, festivals, creative production, or community arts access.', ['festival', 'heritage', 'artists', 'cultural programming']),
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
  scenario('rural-training', ['capacity-building', 'workforce-development'], ['infrastructure', 'food-security'], 'rural employment coordinators', ['training workshops', 'job placement coaching', 'skills assessments'], ['training support', 'employer outreach'], 'The proposal discusses repainting office walls and replacing chairs without any participant training or employment outcomes.'),
  scenario('clinic-navigation', ['health-services', 'community-benefit'], ['arts-culture', 'digital-access'], 'community health navigators', ['care navigation', 'mental health referrals', 'public health outreach'], ['health outreach', 'referral support'], 'The agreement funds a weekend music festival and does not mention health services or resident care.'),
  scenario('shelter-renovation', ['housing-support', 'infrastructure'], ['research-evaluation', 'arts-culture'], 'transitional shelter beds', ['shelter renovations', 'new accessible washrooms', 'winter overflow capacity'], ['shelter upgrades', 'temporary beds'], 'The recipient will run a survey about park usage with no shelter, housing, or construction component.'),
  scenario('food-hub', ['food-security', 'community-benefit'], ['public-safety', 'digital-access'], 'regional food hub', ['food bank distribution', 'community kitchen equipment', 'meal delivery routes'], ['food distribution', 'volunteer coordination'], 'The project purchases accounting software and does not deliver meals or nutrition services.'),
  scenario('broadband-literacy', ['digital-access', 'capacity-building'], ['housing-support', 'health-services'], 'low-income digital access', ['refurbished devices', 'digital literacy classes', 'broadband navigation'], ['device lending', 'basic computer workshops'], 'The work plan is about replacing a roof and has no connectivity, device, or digital training activities.'),
  scenario('energy-retrofit', ['environmental-sustainability', 'infrastructure'], ['food-security', 'arts-culture'], 'community building retrofit', ['heat pump installation', 'energy efficiency upgrades', 'emissions reduction tracking'], ['energy audit', 'lighting upgrades'], 'The recipient will hire youth mentors and does not mention emissions, conservation, or capital retrofits.'),
  scenario('violence-prevention', ['public-safety', 'capacity-building'], ['infrastructure', 'food-security'], 'violence prevention network', ['safety planning training', 'crisis response protocols', 'front-line staff coaching'], ['safety workshops', 'partner referrals'], 'The agreement expands a farmers market and has no safety planning or crisis response work.'),
  scenario('evaluation-pilot', ['research-evaluation', 'capacity-building'], ['housing-support', 'arts-culture'], 'outcomes evaluation pilot', ['data collection tools', 'evaluation framework', 'staff training on indicators'], ['pilot reporting', 'basic data collection'], 'The proposal buys kitchen freezers for a meal program and does not study outcomes or collect evaluation data.'),
  scenario('heritage-festival', ['arts-culture', 'community-benefit'], ['health-services', 'public-safety'], 'local heritage festival', ['artist fees', 'heritage workshops', 'public cultural programming'], ['community performances', 'artist showcases'], 'The agreement funds broadband installation in remote homes without cultural programming or artists.'),
  scenario('apprenticeship-completion', ['workforce-development', 'capacity-building'], ['housing-support', 'environmental-sustainability'], 'first-year apprentices', ['mentorship matching', 'completion coaching', 'employer check-ins'], ['apprentice coaching', 'tool support'], 'The project installs solar panels on a library and has no employment or apprenticeship service.'),
  scenario('supportive-housing-data', ['housing-support', 'research-evaluation'], ['arts-culture', 'food-security'], 'supportive housing outcomes', ['tenant stability tracking', 'evaluation framework', 'homelessness prevention indicators'], ['tenant survey', 'housing outcomes'], 'The recipient will stage theatre workshops and does not address housing or outcome measurement.'),
  scenario('clinic-equipment', ['health-services', 'infrastructure'], ['workforce-development', 'arts-culture'], 'mobile clinic equipment', ['diagnostic equipment', 'clinic van retrofit', 'public health screening'], ['clinic equipment', 'screening visits'], 'The agreement supports job fairs for students and does not purchase clinical equipment or deliver health screening.'),
  scenario('emergency-warming', ['public-safety', 'housing-support'], ['digital-access', 'arts-culture'], 'winter warming centre', ['emergency preparedness', 'temporary overnight spaces', 'cold-weather response'], ['warming centre operations', 'safety protocols'], 'The proposal is about digital literacy classes and has no emergency shelter or safety response.'),
  scenario('community-greenhouse', ['food-security', 'environmental-sustainability'], ['health-services', 'workforce-development'], 'community greenhouse', ['local food production', 'compost diversion', 'nutrition workshops'], ['greenhouse operations', 'food access'], 'The project provides mental health counselling and no food production or environmental work.'),
  scenario('library-connectivity', ['digital-access', 'community-benefit'], ['housing-support', 'food-security'], 'public library connectivity', ['public Wi-Fi hotspots', 'loaner laptops', 'digital navigation help'], ['device access', 'community Wi-Fi'], 'The agreement pays for emergency shelter staffing and has no devices or connectivity activities.'),
  scenario('fleet-emissions', ['environmental-sustainability', 'research-evaluation'], ['arts-culture', 'housing-support'], 'low-emission fleet pilot', ['emissions tracking', 'electric vehicle pilot', 'fuel-use evaluation'], ['pilot data', 'emissions reporting'], 'The agreement funds dance performances and no fleet, emissions, or evaluation work.'),
  scenario('newcomer-employment', ['workforce-development', 'community-benefit'], ['infrastructure', 'food-security'], 'newcomer employment bridge', ['job placements', 'credential navigation', 'employer engagement'], ['employment coaching', 'community referrals'], 'The recipient will repair a gym floor and does not provide employment services.'),
  scenario('senior-meals', ['food-security', 'health-services'], ['digital-access', 'arts-culture'], 'senior nutrition outreach', ['meal delivery', 'nutrition screening', 'dietitian referrals'], ['weekly meals', 'health referrals'], 'The agreement installs broadband towers and has no food or health services.'),
  scenario('youth-arts-mentorship', ['arts-culture', 'capacity-building'], ['housing-support', 'environmental-sustainability'], 'youth arts mentorship', ['artist mentorship', 'creative production training', 'public showcase'], ['arts workshops', 'mentor sessions'], 'The project funds emergency kits and has no artists, culture, or creative training.'),
  scenario('accessible-playground', ['infrastructure', 'community-benefit'], ['research-evaluation', 'health-services'], 'accessible playground', ['accessible equipment', 'site construction', 'public recreation access'], ['playground upgrade', 'community access'], 'The proposal collects survey data about housing and does not build or upgrade public space.'),
  scenario('harm-reduction', ['health-services', 'public-safety'], ['arts-culture', 'digital-access'], 'harm reduction outreach', ['overdose response training', 'mobile health outreach', 'safety planning'], ['health outreach', 'crisis response'], 'The project buys tablets for seniors and does not include health outreach or safety response.'),
  scenario('community-data-lab', ['digital-access', 'research-evaluation'], ['food-security', 'housing-support'], 'community data lab', ['open data training', 'evaluation dashboards', 'shared devices'], ['dashboard pilot', 'digital skills'], 'The agreement renovates a shelter kitchen and has no data, devices, or evaluation dashboard.'),
  scenario('green-job-training', ['workforce-development', 'environmental-sustainability'], ['arts-culture', 'housing-support'], 'green job trainees', ['retrofit training', 'employer placements', 'energy audit skills'], ['green skills training', 'placements'], 'The project funds a cultural archive and no job placement or sustainability training.'),
  scenario('food-bank-renovation', ['food-security', 'infrastructure'], ['digital-access', 'public-safety'], 'food bank warehouse', ['cold storage renovation', 'loading dock repairs', 'food distribution capacity'], ['warehouse upgrades', 'food storage'], 'The recipient will deliver counselling sessions and does not renovate food distribution space.'),
  scenario('tenant-digital-support', ['housing-support', 'digital-access'], ['arts-culture', 'environmental-sustainability'], 'tenant online access', ['rent portal navigation', 'loaner devices', 'housing application support'], ['tenant digital help', 'housing forms'], 'The project runs a summer concert series with no housing application or device support.'),
  scenario('climate-shelter-planning', ['environmental-sustainability', 'public-safety'], ['workforce-development', 'arts-culture'], 'climate emergency shelter planning', ['heat emergency protocols', 'climate adaptation planning', 'risk mapping'], ['heat response plan', 'adaptation workshops'], 'The agreement funds apprenticeship mentors and no climate or safety planning.'),
  scenario('cultural-facility', ['arts-culture', 'infrastructure'], ['health-services', 'food-security'], 'community theatre upgrades', ['stage accessibility renovation', 'lighting equipment', 'artist rehearsal space'], ['theatre renovation', 'cultural space'], 'The project delivers nutrition screening and no cultural facility improvements.'),
  scenario('clinic-workforce', ['health-services', 'workforce-development'], ['arts-culture', 'housing-support'], 'community clinic workforce', ['medical assistant placements', 'clinic onboarding', 'patient intake training'], ['clinic placements', 'health workforce'], 'The agreement installs public Wi-Fi and does not train clinic workers.'),
  scenario('safety-app-training', ['public-safety', 'digital-access'], ['food-security', 'arts-culture'], 'community safety app', ['digital incident reporting', 'safety training', 'crisis referral workflows'], ['safety app training', 'digital reporting'], 'The proposal expands meal delivery and has no digital safety reporting.'),
  scenario('market-garden-youth', ['food-security', 'workforce-development'], ['housing-support', 'public-safety'], 'youth market garden', ['food production training', 'paid placements', 'community produce distribution'], ['garden placements', 'food skills'], 'The recipient will conduct a heritage exhibit and no food or employment activity.'),
]

const VARIANTS = [
  { profile: 'direct' as const, prefix: 'The agreement funds', detailIndex: 0 },
  { profile: 'direct' as const, prefix: 'The project will deliver', detailIndex: 1 },
  { profile: 'direct' as const, prefix: 'The recipient will expand', detailIndex: 2 },
  { profile: 'direct' as const, prefix: 'Funding supports', detailIndex: 0 },
  { profile: 'mixed' as const, prefix: 'The agreement mentions', detailIndex: 0 },
  { profile: 'mixed' as const, prefix: 'The work plan includes', detailIndex: 1 },
  { profile: 'mixed' as const, prefix: 'The recipient proposes', detailIndex: 0 },
  { profile: 'negative' as const, prefix: '', detailIndex: 0 },
  { profile: 'negative' as const, prefix: '', detailIndex: 0 },
  { profile: 'direct' as const, prefix: 'The contribution focuses on', detailIndex: 1 },
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
  fr: string,
  descriptionEn: string,
  aliases: string[],
): TagDefinition {
  return {
    key,
    label: { en, fr },
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
    return `${item.negativeText} The budget narrative is mostly administrative: it describes insurance, office supplies, board minutes, and routine reporting. It deliberately avoids naming service delivery, participant outcomes, or the operational phrases tied to the rejected taxonomy so the extractor must leave those fixed tags unused.`
  }

  const details = variant.profile === 'direct' ? item.directDetails : item.mixedDetails
  const detail = details[variant.detailIndex % details.length] ?? details[0] ?? item.subject
  const secondDetail = details[(variant.detailIndex + 1) % details.length] ?? detail

  return `${variant.prefix} ${item.subject} through ${detail} and ${secondDetail}. The recipient describes a phased delivery plan with intake, partner coordination, participant follow-up, and quarterly reporting. The work plan names the service population, explains how staff will document completed activities, and connects the funded work to measurable agreement deliverables. The paragraph also includes surrounding administrative details so the extractor must identify the operational phrases rather than simply matching the word funding.`
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
