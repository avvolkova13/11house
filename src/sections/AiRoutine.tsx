const routineSteps = [
  'Собирает данные рождения',
  'Строит карту и расчёт',
  'Готовит черновик разбора',
  'Ведёт к записи и оплате',
  'Возвращает клиента',
]

export function AiRoutine() {
  return (
    <section className="ai-routine" aria-labelledby="ai-routine-title">
      <header className="ai-routine__heading">
        <span>05 · AI берёт рутину</span>
        <h2 id="ai-routine-title">AI готовит основу.<br />Вы принимаете решение.</h2>
        <p>Система считает и собирает черновик по вашим трактовкам и в вашем тоне. Последнее слово всегда остаётся за вами.</p>
      </header>

      <ol className="ai-routine__flow">
        {routineSteps.map((step, index) => (
          <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>
        ))}
      </ol>

      <div className="ai-routine__evidence">
        <figure className="ai-routine__screen ai-routine__screen--source">
          <figcaption>Сценарий · подтверждённый черновик</figcaption>
          <div><img src="/assets/product-screenshots/eh-p04-funnel.png" alt="Редактор воронки ElevenHouse" loading="lazy" /></div>
        </figure>
        <div className="ai-routine__handoff" aria-hidden="true"><i /><span>черновик</span><i /></div>
        <figure className="ai-routine__screen ai-routine__screen--result">
          <figcaption>Расчёт · реальный результат</figcaption>
          <div><img src="/assets/product-screenshots/eh-p07-numerology.png" alt="Результат расчёта нумерологии ElevenHouse" loading="lazy" /></div>
        </figure>
      </div>

      <p className="ai-routine__boundary">На приложенном экране исполнение воронки ещё недоступно — показываем только подтверждённый редактор и рассчитанный результат.</p>
    </section>
  )
}
