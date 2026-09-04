const comparisonRows = [
  {
    stage: 'Сбор данных',
    manual: 'Анкета в переписке, затем ручной перенос',
    elevenHouse: 'Клиент вводит данные один раз',
  },
  {
    stage: 'Построение карты',
    manual: 'Перенос данных в отдельный сервис',
    elevenHouse: 'Расчёт остаётся рядом с клиентом',
  },
  {
    stage: 'Подготовка разбора',
    manual: 'Материалы по разным файлам, текст с нуля',
    elevenHouse: 'AI готовит основу, специалист проверяет',
  },
  {
    stage: 'Запись и оплата',
    manual: 'Согласование времени, ссылка и проверка оплаты вручную',
    elevenHouse: 'Время, услуга и оплата связаны в одном процессе',
  },
  {
    stage: 'Повторный контакт',
    manual: 'Искать историю и помнить о следующем сообщении',
    elevenHouse: 'История клиента и следующий шаг сохранены вместе',
  },
]

const evidenceStats = [
  {
    value: '≈5 минут',
    label: 'на повторном вводе одной анкеты',
    source: 'Исследование электронных анкет',
    href: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC5709849/',
  },
  {
    value: '≈5 минут',
    label: 'административной работы на каждой онлайн-записи',
    source: 'Исследование онлайн-записи',
    href: 'https://journals.sagepub.com/doi/10.3233/SHTI260505',
  },
  {
    value: '−40%',
    label: 'времени на подготовку первого черновика',
    source: 'Эксперимент MIT и Science',
    href: 'https://economics.mit.edu/sites/default/files/inline-files/Noy_Zhang_1.pdf',
  },
]

export function OneClientStory() {
  return (
    <section className="workflow-compare" aria-labelledby="workflow-compare-title">
      <div className="workflow-compare__inner">
        <header className="workflow-compare__intro">
          <h2 id="workflow-compare-title">Ручной режим — ElevenHouse.</h2>
          <p>
            Пять знакомых этапов работы. Слева — где обычно уходит время,
            справа — как тот же путь собирается в одном кабинете.
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

        <section className="workflow-evidence" aria-labelledby="workflow-evidence-title">
          <header>
            <span>Ориентиры экономии</span>
            <h3 id="workflow-evidence-title">Что дают автоматизированные операции.</h3>
          </header>

          <div className="workflow-evidence__grid">
            {evidenceStats.map((stat) => (
              <article className="workflow-evidence__stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <p>{stat.label}</p>
                <a href={stat.href} target="_blank" rel="noreferrer">
                  {stat.source} <span aria-hidden="true">↗</span>
                </a>
              </article>
            ))}
          </div>

          <p className="workflow-evidence__note">
            Ориентиры основаны на исследованиях цифрового ввода данных, онлайн-записи и AI-подготовки текста. Фактическая экономия зависит от процесса специалиста.
          </p>
        </section>
      </div>
    </section>
  )
}
