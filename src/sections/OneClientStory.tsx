import { WorkflowMetrics } from './WorkflowMetrics'
import './workflowComparison.css'

const comparisonRows = [
  { stage: 'История клиента', manual: 'Переписки и таблицы', elevenHouse: 'Единая история клиента' },
  { stage: 'Запись', manual: 'Запись вручную', elevenHouse: 'Онлайн-запись' },
  { stage: 'Оплата', manual: 'Отдельные ссылки на оплату', elevenHouse: 'Оплата выбранной услуги' },
  { stage: 'Подготовка', manual: 'Подготовка разбора с нуля', elevenHouse: 'Карта и AI-черновик под контролем астролога' },
]

// Comparison metrics published in the #pains section of elevenhouse.ai.
// Source checked on 2026-09-11; these are the platform's published claims.
const evidenceStats = [
  { value: '−12 ч', label: 'рутины в неделю' },
  { value: '×3', label: 'быстрее готов разбор' },
  { value: '+34%', label: 'повторных продаж' },
  { value: '24/7', label: 'воронки работают за вас' },
]

export function OneClientStory() {
  return (
    <section className="workflow-compare" id="workflow-compare" aria-labelledby="workflow-compare-title">
      <div className="workflow-compare__inner">
        <header className="workflow-compare__intro">
          <div>
            <p className="workflow-compare__eyebrow">Ручной режим против ElevenHouse</p>
            <h2 id="workflow-compare-title">Меньше рутины — больше времени на клиентов</h2>
          </div>
        </header>
        <div className="workflow-compare__head" aria-hidden="true">
          <span>Этап работы</span><span>Ручной режим</span><span>ElevenHouse</span>
        </div>
        <div className="workflow-compare__rows">
          {comparisonRows.map((row, index) => (
            <article className="workflow-compare__row" key={row.stage}>
              <header><span>{String(index + 1).padStart(2, '0')}</span><h3>{row.stage}</h3></header>
              <p className="workflow-compare__manual"><span>Ручной режим</span>{row.manual}</p>
              <p className="workflow-compare__system"><span>ElevenHouse</span>{row.elevenHouse}</p>
            </article>
          ))}
        </div>
        <WorkflowMetrics stats={evidenceStats} note="Медианные показатели активных практиков за два месяца на платформе" />
      </div>
    </section>
  )
}
