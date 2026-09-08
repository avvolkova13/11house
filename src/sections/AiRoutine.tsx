import { publicAsset } from '../assets'

const routineSteps = [
  'Клиент оставил данные',
  'Система построила карту',
  'AI подготовил черновик',
  'Астролог проверил и дополнил',
  'Клиент получил результат',
]

export function AiRoutine() {
  return (
    <section className="ai-routine" aria-labelledby="ai-routine-title">
      <header className="ai-routine__heading">
        <h2 id="ai-routine-title">AI берёт рутину на себя.<br />Последнее слово — за вами.</h2>
        <p>AI считает и готовит черновик по вашим трактовкам и в вашем тоне. Последнее слово всегда за вами.</p>
      </header>

      <ol className="ai-routine__flow">
        {routineSteps.map((step, index) => (
          <li key={step}><span>{String(index + 1).padStart(2, '0')}</span><p>{step}</p></li>
        ))}
      </ol>

      <div className="ai-routine__evidence">
        <figure className="ai-routine__screen ai-routine__screen--source">
          <figcaption>Данные и сценарий работы</figcaption>
          <div><img src={publicAsset('assets/product-screenshots/eh-p04-funnel.png')} alt="Редактор воронки ElevenHouse" loading="lazy" /></div>
        </figure>
        <div className="ai-routine__handoff" aria-hidden="true"><i /><span>черновик</span><i /></div>
        <figure className="ai-routine__screen ai-routine__screen--result">
          <figcaption>Расчёт · основа для проверки</figcaption>
          <div><img src={publicAsset('assets/product-screenshots/eh-p07-numerology.png')} alt="Результат расчёта нумерологии ElevenHouse" loading="lazy" /></div>
        </figure>
      </div>

      <p className="ai-routine__boundary">AI ускоряет подготовку, но не публикует результат без вашей проверки.</p>
    </section>
  )
}
