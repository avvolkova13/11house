const faqItems = [
  {
    question: 'Можно начать без оплаты?',
    answer: 'Да. Тариф «Старт» бесплатный: на нём доступны натальная карта и нумерология, личная страница, календарь, онлайн-запись, CRM, единые сообщения и справочник.',
  },
  {
    question: 'Какие ограничения есть на «Старте»?',
    answer: 'До 30 записей клиентов и 20 AI-действий в месяц, одна воронка, один пользователь и комиссия 8% с продаж.',
  },
  {
    question: 'Что открывает Pro?',
    answer: 'Все системы расчётов, безлимитные записи, AI-действия, воронки и продукты, а также продажи, контент, видео-консультации, записи сессий, аналитику и отчёты.',
  },
  {
    question: 'AI заменяет трактовку специалиста?',
    answer: 'Нет. AI считает и готовит черновик по вашим трактовкам и в вашем тоне. Последнее слово всегда остаётся за вами.',
  },
  {
    question: 'Можно работать командой?',
    answer: 'Да. На Studio в одном кабинете могут работать до пяти астрологов; также доступны white-label, API и приоритетная поддержка.',
  },
]

export function FaqSection() {
  return (
    <section className="faq-section" aria-labelledby="faq-title">
      <header>
        <span>08 · Частые вопросы</span>
        <h2 id="faq-title">Коротко<br />о главном.</h2>
      </header>
      <div className="faq-section__list">
        {faqItems.map((item, index) => (
          <details key={item.question}>
            <summary><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.question}</strong><i aria-hidden="true" /></summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
