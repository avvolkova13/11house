import { WorkflowMetrics } from './WorkflowMetrics'

const comparisonRows = [
  {
    stage: 'Сбор данных',
    manual: 'Заявки в директе: «Напомните дату и время рождения?»',
    elevenHouse: 'Запись сама собирает данные рождения один раз',
  },
  {
    stage: 'Построение карты',
    manual: 'Данные переносите в отдельную программу',
    elevenHouse: 'Карта строится сразу и остаётся в карточке клиента',
  },
  {
    stage: 'Подготовка разбора',
    manual: 'Каждый разбор пишете с нуля — уходит целый вечер',
    elevenHouse: 'AI собирает черновик за минуты — вы проверяете и дополняете',
  },
  {
    stage: 'Запись и оплата',
    manual: 'Оплата переводом «на карту»',
    elevenHouse: 'Запись, предоплата и платёжная ссылка работают в одном процессе',
  },
  {
    stage: 'Повторный контакт',
    manual: 'Клиент пропадает после первой консультации',
    elevenHouse: 'Астрокалендарь и воронки находят повод вернуть клиента',
  },
]

const evidenceStats = [
  {
    value: '−12 ч',
    label: 'рутины в неделю',
  },
  {
    value: '×3',
    label: 'быстрее готов разбор',
  },
  {
    value: '+34%',
    label: 'повторных продаж',
  },
]

export function OneClientStory() {
  return (
    <section className="workflow-compare" aria-labelledby="workflow-compare-title">
      <div className="workflow-compare__inner">
        <header className="workflow-compare__intro">
          <h2 id="workflow-compare-title">Больше времени на клиентов. Меньше — на рутину.</h2>
          <p>
            Та же практика, те же клиенты. Разница — сколько времени остаётся
            на новые консультации.
          </p>
        </header>

        <div className="workflow-compare__head" aria-hidden="true">
          <span>Этап работы</span>
          <span>Ручной режим</span>
          <span>ElevenHouse</span>
        </div>

        <div className="workflow-compare__rows">
          {comparisonRows.map((row, index) => (
            <article className="workflow-compare__row" key={row.stage}>
              <header>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{row.stage}</h3>
              </header>
              <p className="workflow-compare__manual">
                <span>Ручной режим</span>
                {row.manual}
              </p>
              <p className="workflow-compare__system">
                <span>ElevenHouse</span>
                {row.elevenHouse}
              </p>
            </article>
          ))}
        </div>

        <WorkflowMetrics
          note="Медианные показатели активных практиков после двух месяцев на платформе."
          stats={evidenceStats}
        />
      </div>
    </section>
  )
}
