export function FinalCta() {
  return (
    <section className="final-cta" aria-labelledby="final-cta-title">
      <div className="final-cta__orbit" aria-hidden="true"><i /><i /><i /></div>
      <h2 id="final-cta-title">Соберите практику<br />в одном кабинете.</h2>
      <a className="final-cta__action" href="https://app.elevenhouse.ai/auth?mode=register">
        Создать кабинет бесплатно <span aria-hidden="true">↗</span>
      </a>
      <p className="final-cta__note">Без банковской карты</p>
      <footer className="final-cta__footer">
        <div className="final-cta__brand">
          <strong>ElevenHouse</strong>
          <span>ASTROLOGER WORKSPACE</span>
        </div>
        <nav aria-label="Контакты ElevenHouse">
          <span>Связаться</span>
          <a href="mailto:hello@elevenhouse.ai">hello@elevenhouse.ai</a>
          <a href="mailto:support@elevenhouse.ai">Поддержка</a>
          <a href="https://t.me/elevenhouse_support" rel="noreferrer" target="_blank">Telegram</a>
        </nav>
        <nav aria-label="Документы ElevenHouse">
          <span>Документы</span>
          <a href="/privacy">Политика конфиденциальности</a>
          <a href="/personal-data-processing">Обработка персональных данных</a>
        </nav>
        <small>© ElevenHouse</small>
      </footer>
    </section>
  )
}
