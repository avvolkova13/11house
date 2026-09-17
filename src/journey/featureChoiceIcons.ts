import clients from '../assets/feature-icons/01-clients.svg'
import calculations from '../assets/feature-icons/02-calculations.svg'
import calendar from '../assets/feature-icons/03-calendar.svg'
import services from '../assets/feature-icons/04-services.svg'
import consultations from '../assets/feature-icons/05-consultations.svg'
import support from '../assets/feature-icons/06-support.svg'
import automation from '../assets/feature-icons/07-automation.svg'
import content from '../assets/feature-icons/08-content.svg'
import practice from '../assets/feature-icons/09-practice.svg'
import type { FeatureId } from './SourceFragments'

export const featureChoiceIcons = {
  client: clients,
  reading: calculations,
  calendar,
  products: services,
  session: consultations,
  followup: support,
  automation,
  content,
  practice,
} satisfies Record<FeatureId, string>
