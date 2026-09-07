import { publicAsset } from '../assets'

const externalTools = [
  'Программа расчётов',
  'Таблица или CRM',
  'Taplink или сайт',
  'Бот и рассылки',
  'Онлайн-запись',
  'Платёжный сервис',
] as const

const workspaceCapabilities = [
  'Расчёты',
  'Клиенты',
  'Личная страница',
  'Автоматизация',
  'Запись',
  'Оплаты',
] as const

export function UnifiedWorkspace() {
  return (
    <section className="unified-workspace" aria-labelledby="workspace-title">
      <header className="unified-workspace__heading">
        <span>06 · Один кабинет</span>
        <h2 id="workspace-title">Один кабинет вместо<br />нескольких сервисов.</h2>
        <p>Все инструменты практики связаны между собой: данные не приходится переносить, а клиент проходит один цельный путь.</p>
      </header>

      <div className="unified-workspace__comparison">
        <article className="workspace-stack" aria-labelledby="workspace-stack-title">
          <header>
            <span>Обычная связка</span>
            <strong id="workspace-stack-title">6 отдельных сервисов</strong>
          </header>

          <ul>
            {externalTools.map((tool, index) => (
              <li key={tool}><span>{String(index + 1).padStart(2, '0')}</span>{tool}</li>
            ))}
          </ul>

          <footer>
            <span>Ориентировочная стоимость</span>
            <strong>≈5 280 ₽ / месяц</strong>
          </footer>
        </article>

        <div className="unified-workspace__merge" aria-hidden="true">
          <i /><span>вместе</span><i />
        </div>

        <article className="workspace-one" aria-labelledby="workspace-one-title">
          <header>
            <span>Единая система</span>
            <strong id="workspace-one-title">ElevenHouse</strong>
          </header>

          <figure>
            <figcaption><span>Рабочий кабинет</span><span>всё связано</span></figcaption>
            <div><img src={publicAsset('assets/product-screenshots/eh-p04-funnel.png')} alt="Единый рабочий процесс в ElevenHouse" loading="lazy" /></div>
          </figure>

          <ul aria-label="Возможности единого кабинета">
            {workspaceCapabilities.map((capability) => <li key={capability}>{capability}</li>)}
          </ul>
        </article>
      </div>
    </section>
  )
}
