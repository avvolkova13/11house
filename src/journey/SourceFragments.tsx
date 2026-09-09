import { memo, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { rangeProgress, typedText, type SourceGuide } from './featurePlayback'
import { Icon } from './SourceIcons'
import { NatalWheel } from './SourceWheel'
import { MatrixOctagram, PsychoMatrix, Bodygraph } from './SourceCalculations'

type FragmentProps = { step: number; setStep: (step: number) => void; guide?: SourceGuide }
const reveal = (guide: SourceGuide | undefined, start = .1, end = .4) => ({ '--reveal': guide ? rangeProgress(guide.progress, start, end) : 1 }) as CSSProperties
const press = (guide?: SourceGuide) => !!guide && guide.progress >= .72 && guide.progress < .82
function Notice({ children, show }: { children: ReactNode; show: boolean }) { return <div className="eh-source__notice" style={{ visibility: show ? 'visible' : 'hidden' }}><Icon.check size={14} />{children}</div> }

export const featureChoices = [
  { id: 'client', title: 'Клиенты', detail: 'Данные, история, заметки', icon: 'users', tabs: ['Данные', 'История', 'Заметки', 'Переписка'] },
  { id: 'reading', title: 'Расчёты', detail: 'Все системы рядом', icon: 'orbit', tabs: ['Натальная карта', 'Нумерология', 'Матрица судьбы', 'Дизайн человека'] },
  { id: 'calendar', title: 'Запись и календарь', detail: 'От свободного слота до встречи', icon: 'calendar', tabs: ['Встреча', 'Перенос'] },
  { id: 'products', title: 'Ваши услуги', detail: 'Консультации и продукты', icon: 'box', tabs: ['Услуга', 'Редактирование'] },
  { id: 'session', title: 'Консультации', detail: 'Встреча и её материалы', icon: 'video', tabs: ['Подготовка', 'Материалы'] },
  { id: 'followup', title: 'Сопровождение', detail: 'Дневник и связь с клиентом', icon: 'book', tabs: ['Астродневник', 'Ответ'] },
  { id: 'automation', title: 'AI и автоматизация', detail: 'Ваши знания, меньше рутины', icon: 'flow', tabs: ['Цепочка', 'AI-черновик'] },
  { id: 'content', title: 'Контент', detail: 'Публикации и ваши трактовки', icon: 'content', tabs: ['Публикация', 'Справочник'] },
  { id: 'practice', title: 'Моя практика', detail: 'Финансы и личный профиль', icon: 'wallet', tabs: ['Финансы', 'Профиль'] },
] as const
export type FeatureId = typeof featureChoices[number]['id']

// app/shared.jsx → Avatar, unchanged proportions, palette and border treatment.
function Avatar({ initials = 'МС', size = 38 }: { initials?: string; size?: number }) {
  return <span style={{ width: size, height: size, borderRadius: size * .32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size * .4, letterSpacing: '.01em', color: 'var(--moon)', background: 'linear-gradient(140deg, var(--surface-4), var(--violet-deep))', border: '1px solid var(--line-strong)' }}>{initials}</span>
}
function Person() {
  return <div className="eh-source__person"><Avatar size={48} /><div><strong>Марина Соколова</strong><span>Натальный разбор</span></div></div>
}
// app/crm-card.jsx → InfoRow. Names and values are fixture data; markup/styles retained.
function InfoRow({ icon = 'calendar', label, value }: { icon?: keyof typeof Icon; label: string; value: ReactNode }) {
  const IC = Icon[icon]
  return <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 0', borderTop: '1px solid var(--line)' }}>
    <span style={{ color: 'var(--text-3)', display: 'flex' }}><IC size={16} /></span>
    <span style={{ fontSize: 13, color: 'var(--text-3)', minWidth: 70 }}>{label}</span>
    <span style={{ fontSize: 13.5, color: 'var(--text-1)', fontWeight: 500, flex: 1, textAlign: 'right' }}>{value}</span>
  </div>
}
function Field({ label, value, onChange, active = false }: { label: string; value: string; onChange?: (value: string) => void; active?: boolean }) {
  const id = useId()
  return <div className="eh-source__field"><label className="label" htmlFor={id}>{label}</label><input id={id} className="input" data-guide-active={active} value={value} readOnly={!onChange} onChange={(event) => onChange?.(event.target.value)} /></div>
}
function Action({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" className="btn btn-primary eh-source__action" onClick={onClick}>{children}<Icon.chevR size={17} /></button>
}

function ClientFragment({ step, setStep, guide }: FragmentProps) {
  const [note, setNote] = useState('')
  const [notes, setNotes] = useState(['Хочет обсудить смену работы и переход в собственную практику. На встрече вернуться к теме опоры и комфортного темпа.'])
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([{ from: 'client', text: 'Алиса, здравствуйте! Заполнила анкету. Время рождения уточнила — 09:35.', time: '10:12' }, { from: 'me', text: 'Марина, спасибо! Всё вижу. До встречи в четверг.', time: '10:15' }])
  const p = guide?.progress ?? 1
  const saved = !!guide && p >= .82
  const noteText = 'Обсудить первые шаги в собственной практике.'
  const messageText = 'Марина, спасибо! На встрече обсудим ваш запрос и первые шаги.'
  const shownNotes = guide && saved ? [noteText, ...notes] : notes
  const shownMessages = guide ? [...messages.slice(0, 1), ...(saved ? [{ from: 'me', text: messageText, time: 'сейчас' }] : [])] : messages
  return <div className="eh-source__narrow">
    <Person />
    {step === 0 && <>
      {/* app/crm-card.jsx → ClientOverview, isolated natal-data card. */}
      <div className="card" style={{ padding: '16px 18px' }}><div className="kicker" style={{ marginBottom: 8 }}>Натальные данные</div><InfoRow label="Дата" value={guide ? typedText("14.05.1992", p, .12, .3) || "—" : "14.05.1992"} /><InfoRow icon="clock" label="Время" value={guide ? typedText("09:35", p, .34, .46) || "—" : "09:35"} /><InfoRow icon="pin" label="Место" value={guide ? typedText("Москва", p, .5, .65) || "—" : "Москва"} /></div>
      <Action onClick={() => setStep(1)}>История клиента</Action>
    </>}
    {step === 1 && <div className="eh-source__timeline">
      {/* app/crm-card.jsx → ClientHistory: dated icon rows, connector and right status. */}
      {[['10 сентября', 'Натальный разбор', '11:00 · Видеозвонок', '4 900 ₽'], ['8 сентября', 'Анкета заполнена', 'Данные рождения подтверждены', 'Готово'], ['8 сентября', 'Первая запись', 'С личной страницы', 'Новый клиент']].map(([date, title, text, status], index) => <div key={title} className="eh-source__history-row eh-source__reveal" style={reveal(guide, .12 + (2 - index) * .18, .24 + (2 - index) * .18)}><span className="eh-source__history-icon"><Icon.calendar size={16} /></span><div><span className="mono eh-source__muted">{date}</span><strong>{title}</strong><p>{text}</p></div><span className="eh-source__status">{status}</span></div>)}
      <Action onClick={() => setStep(2)}>Заметки к встрече</Action>
    </div>}
    {step === 2 && <>
      {/* app/crm-card.jsx → ClientNotes: original composer and note items. */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}><textarea className="input" aria-label="Добавить заметку о клиенте" rows={2} readOnly={!!guide} data-guide-active={!!guide && p > .12 && p < .7} value={guide ? saved ? "" : typedText(noteText, p) : note} onChange={(event) => setNote(event.target.value)} placeholder="Добавить заметку о клиенте…" style={{ flex: 1 }} /><button type="button" className="btn btn-primary" aria-label="Сохранить заметку" data-guide-press={press(guide)} onClick={() => { if (guide) { guide.finish(); return } if (note.trim()) { setNotes([note.trim(), ...notes]); setNote('') } }}><Icon.plus size={16} /></button></div>
      <div className="eh-source__stack">{shownNotes.map((text, index) => <div key={index} style={{ padding: '13px 15px', borderRadius: 13, border: '1px solid var(--line)', background: 'var(--surface-1)' }}><div style={{ display: 'flex', gap: 7, marginBottom: 6 }}><span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-2)' }}>Ваша заметка</span><span className="mono" style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 'auto' }}>{index === shownNotes.length - 1 ? '8 сентября' : 'только что'}</span></div><p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55 }}>{text}</p></div>)}</div>
    </>}
    {step === 2 && guide && <Notice show={saved}>Заметка сохранена</Notice>}
    {step === 3 && <>
      {/* app/crm-card.jsx → ClientInbox, original opposing bubble styles. */}
      <div className="eh-source__stack">{shownMessages.map((item, index) => <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: item.from === 'me' ? 'flex-end' : 'flex-start', gap: 3 }}><div style={{ maxWidth: '88%', padding: '10px 14px', borderRadius: 14, fontSize: 13.5, lineHeight: 1.45, background: item.from === 'me' ? 'var(--accent)' : 'var(--surface-2)', color: item.from === 'me' ? 'var(--text-on-accent)' : 'var(--text-1)', borderBottomRightRadius: item.from === 'me' ? 4 : 14, borderBottomLeftRadius: item.from === 'me' ? 14 : 4, border: item.from === 'me' ? 'none' : '1px solid var(--line)' }}>{item.text}</div><span className="mono eh-source__muted">Telegram · {item.time}</span></div>)}</div>
      <form className="eh-source__composer" onSubmit={(event) => { event.preventDefault(); if (guide) { guide.finish(); return } if (message.trim()) { setMessages([...messages, { from: 'me', text: message.trim(), time: 'сейчас' }]); setMessage('') } }}><input className="input" aria-label="Сообщение Марине" readOnly={!!guide} data-guide-active={!!guide && p > .12 && p < .7} value={guide ? saved ? "" : typedText(messageText, p) : message} onChange={(event) => setMessage(event.target.value)} placeholder="Написать в единый инбокс…" /><button className="btn btn-primary" aria-label="Добавить сообщение" data-guide-press={press(guide)}><Icon.send size={16} /></button></form>
    </>}
  </div>
}

const CalculationGraphic = memo(function CalculationGraphic({ step, cell }: { step: number; cell?: string }) {
  return step === 0 ? <NatalWheel size={390} /> : step === 1 ? <PsychoMatrix guidedCell={cell} /> : step === 2 ? <MatrixOctagram /> : <Bodygraph />
})
function ReadingFragment({ step, guide }: FragmentProps) {
  const p = guide?.progress ?? 1
  if (step === -1) return <div className="eh-source__narrow">
    <Person />
    <Field label="Дата рождения" active={!!guide && p > .1 && p < .28} value={typedText('14.05.1992', p, .1, .28)} />
    <Field label="Время рождения" active={!!guide && p > .3 && p < .43} value={typedText('09:35', p, .3, .43)} />
    <Field label="Место рождения" active={!!guide && p > .45 && p < .62} value={typedText('Москва', p, .45, .62)} />
    <button type="button" className="btn btn-primary eh-source__action" data-guide-press={press(guide)} onClick={guide?.next}>Рассчитать <Icon.orbit size={17} /></button>
  </div>
  const hints = ['Круг — знаки зодиака. Символы — планеты. Линии внутри связывают планеты аспектами.', 'Выбрана ячейка «Память · ум». Сетка помогает ориентироваться в темах нумерологического разбора.', 'Числа распределены по позициям матрицы. Схема остаётся связана с данными клиента.', 'Фигуры — центры, линии между ними — каналы. Это схема для работы специалиста по Дизайну человека.']
  return <div className="eh-source__calculation"><div className="eh-source__calculation-caption"><strong>Марина Соколова</strong><span>14.05.1992 · 09:35 · Москва</span></div>
    <div className="eh-source__drawing" style={{ '--draw': guide ? rangeProgress(p, .08, .38) : 1 } as CSSProperties}><CalculationGraphic step={step} cell={guide && step === 1 ? p < .4 ? 'cell:1' : p < .6 ? 'cell:5' : 'cell:9' : undefined} /></div>
    {guide && <p className="eh-source__chart-help eh-source__reveal" style={reveal(guide, .65, .75)}>{hints[step]}</p>}
  </div>
}

function CalendarFragment({ step, setStep, guide }: FragmentProps) {
  const [manualTime, setTime] = useState('11:00')
  const time = guide ? guide.id === 'calendar-saved' || (guide.id === 'calendar-move' && guide.progress >= .45) ? '14:00' : '11:00' : manualTime
  // app/calendar-panels.jsx → SessionDetail. Only its person, facts and action block.
  return <div className="eh-source__narrow"><span className="eh-source__status">Подтверждена</span><Person />
    {step === 0 ? <><div style={{ background: 'var(--surface-1)', border: '1px solid var(--line)', borderRadius: 12, padding: '0 13px' }}><InfoRow icon="box" label="Услуга" value="Натальный разбор · 4 900 ₽" /><InfoRow label="Дата" value="10 сентября 2026" /><InfoRow icon="clock" label="Время" value={`${time} · 60 мин`} /><InfoRow icon="video" label="Формат" value="Видеозвонок" /></div><Action onClick={() => setStep(1)}>Перенести встречу</Action></> : <><h3>Выберите время</h3><p className="eh-source__muted">Четверг, 10 сентября · Москва</p><div className="eh-source__slots">{['10:00', '11:00', '12:30', '14:00', '15:30', '17:00'].map((value) => <button type="button" key={value} className={`chip${value === time ? ' on' : ''}`} data-guide-active={!!guide && value === "14:00" && guide.progress > .3 && guide.progress < .65} disabled={!!guide && value !== "14:00"} aria-pressed={time === value} onClick={() => guide ? guide.finish() : setTime(value)}>{value}</button>)}</div><div data-guide-press={press(guide)}><Action onClick={() => setStep(0)}>Сохранить время</Action></div></>}
  </div>
}

function ProductFragment({ step, setStep, guide }: FragmentProps) {
  const [manualName, setName] = useState('Натальный разбор')
  const [manualPrice, setPrice] = useState('4 900')
  const name = guide ? step === 1 ? typedText('Натальный разбор', guide.progress, .12, .43) : 'Натальный разбор' : manualName
  const price = guide ? step === 1 ? typedText('4 900', guide.progress, .46, .62) : '4 900' : manualPrice
  // app/products.jsx → one catalog card. No catalog page or app toolbar.
  return <div className="eh-source__narrow">{step === 0 ? <div className="card" style={{ overflow: 'hidden' }}>
    <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: 12 }}><span className="eh-source__product-icon"><Icon.box size={20} /></span><div style={{ flex: 1 }}><div className="kicker">Консультация</div><h3 style={{ margin: '2px 0 0', fontSize: 16 }}>{name}</h3></div><span className="eh-source__status">Активен</span></div>
    <div style={{ padding: '0 18px 14px' }}><strong style={{ fontSize: 24 }}>{price} ₽</strong><span className="eh-source__muted"> · Видео · 60 мин</span></div>
    <div style={{ padding: '0 18px 16px', display: 'grid', gap: 8 }}>{['Натальная карта', 'Ответы на ваш запрос', 'Запись встречи и материалы'].map((text, index) => <div key={text} className="eh-source__reveal" style={{ ...reveal(guide, .15 + index * .16, .3 + index * .16), display: 'flex', gap: 8, fontSize: 12.5, color: 'var(--text-2)' }}><Icon.check size={13} />{text}</div>)}</div>
    <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14 }}><span className="eh-source__muted">{guide ? "Готова к записи клиентов" : <>Продаж <b>14</b></>}</span>{!guide && <span style={{ color: 'var(--gold)', fontSize: 12.5 }}>68 600 ₽</span>}<button type="button" className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: 12.5 }} onClick={() => setStep(1)}>Изменить</button></div>
  </div> : <><Field label="Название продукта" active={!!guide && guide.progress > .12 && guide.progress < .43} value={name} onChange={guide ? undefined : setName} /><Field label="Стоимость, ₽" active={!!guide && guide.progress > .46 && guide.progress < .62} value={price} onChange={guide ? undefined : setPrice} /><div data-guide-press={press(guide)}><Action onClick={() => setStep(0)}>Сохранить</Action></div></>}</div>
}

function SessionFragment({ step, setStep, guide }: FragmentProps) {
  // app/calendar-panels.jsx → AI brief and materials; app/session-call.jsx → session context.
  return <div className="eh-source__narrow"><Person />{step === 0 ? <><div className="card" style={{ padding: '20px 22px' }}><div className="kicker">К встрече · 10 сентября, 11:00</div><h3>Запрос и фокус</h3><p style={{ minHeight: 84 }}>{guide ? typedText("Смена профессионального направления. Собственные опоры и комфортный темп изменений.", guide.progress, .12, .6) : "Смена профессионального направления. Собственные опоры и комфортный темп изменений."}</p><div className="eh-source__brief eh-source__reveal" style={reveal(guide, .65, .75)}><Icon.spark size={17} /><span>AI-бриф к сессии готов — ключевые конфигурации и темы.</span></div></div><Action onClick={() => setStep(1)}>Запись и материалы</Action></> : <div className="card" style={{ padding: '16px 18px' }}><h3>Материалы встречи</h3><div className="eh-source__reveal" style={reveal(guide, .1, .28)}><InfoRow icon="video" label="Запись" value="Натальный разбор · 58 мин" /></div><div className="eh-source__reveal" style={reveal(guide, .3, .48)}><InfoRow icon="doc" label="Документ" value="Итоги консультации.pdf" /></div><div className="eh-source__reveal" style={reveal(guide, .5, .68)}><InfoRow icon="orbit" label="Карта" value="Марина · 14.05.1992" /></div><p className="eh-source__status eh-source__reveal" style={reveal(guide, .7, .8)}>Доступны в личном кабинете клиента</p></div>}</div>
}

function FollowupFragment({ step, guide }: FragmentProps) {
  const [answer, setAnswer] = useState('Марина, какие решения на этой неделе давались вам легче всего?')
  const [manualSent, setSent] = useState(false)
  const sent = guide ? step === 1 && guide.progress >= .82 : manualSent
  // app/journal.jsx → JournalEntry, original entry/avatar/meta arrangement and accent edge.
  return <div className="eh-source__narrow"><Person /><div className="eh-source__stack"><div className="eh-source__journal-entry"><span className="eh-source__muted">Марина · 12 сентября, 19:40</span><div style={{ padding: '12px 15px', borderRadius: 14, border: '1px solid var(--line)', background: 'var(--surface-1)', borderLeft: '3px solid var(--moon)' }}><p>{guide && step === 0 ? typedText("После нашей встречи записала, что даёт мне чувство уверенности. Стало понятнее, с чего начать.", guide.progress) : "После нашей встречи записала, что даёт мне чувство уверенности. Стало понятнее, с чего начать."}</p><span className="eh-source__muted"><Icon.moon size={11} /> Растущая Луна</span></div></div>
    {(step === 1 || sent) && (sent ? <div style={{ padding: '12px 15px', borderRadius: 14, background: 'var(--warn-soft)', borderRight: '3px solid var(--gold)' }}><div className="kicker">Ваш вопрос · только что</div><p>{answer}</p></div> : <><label className="label" htmlFor="journal-answer">Ответить Марине</label><textarea id="journal-answer" className="input" rows={3} readOnly={!!guide} data-guide-active={!!guide && guide.progress > .12 && guide.progress < .7} value={guide ? typedText(answer, guide.progress) : answer} onChange={(event) => setAnswer(event.target.value)} /><div data-guide-press={press(guide)}><Action onClick={() => { if (guide) guide.finish(); else if (answer.trim()) setSent(true) }}>Отправить вопрос</Action></div></>)}
  </div></div>
}

function AutomationFragment({ step, setStep, guide }: FragmentProps) {
  const [draft, setDraft] = useState('Марина, в нашем разборе мы вернулись к теме профессиональной опоры. Обратите внимание, какие занятия дают вам чувство устойчивости, и запишите наблюдения перед следующей встречей.')
  const [manualApproved, setApproved] = useState(false)
  const approved = guide ? guide.id === 'automation-approved' && guide.progress >= .3 : manualApproved
  const p = guide?.progress ?? 1
  const editedDraft = guide ? p < .6 ? typedText(draft, p, .08, .55) : draft + typedText(' Начните с одного небольшого шага в своём темпе.', p, .62, .78) : draft
  // app/flow-nodes.jsx → FlowNode: original surfaces, category edge, icon block, title and HITL badge.
  return step === 0 ? <div className="eh-source__flow">{[{ title: 'Новая запись', sub: 'Натальный разбор', label: 'Триггер', color: '#6FA8FF', icon: 'calendar' as const }, { title: 'Подготовить разбор', sub: 'По вашим трактовкам', label: 'AI', color: '#B79CFB', icon: 'spark' as const }, { title: 'Материалы клиенту', sub: 'В личный кабинет', label: 'Действие', color: '#4EC8A0', icon: 'send' as const }].map((node, index) => { const IC = Icon[node.icon]; return <div key={node.title} className="eh-source__flow-node" data-pending={!!guide && (index === 1 && p < .3 || index === 2 && !(approved && p >= .65))} style={{ borderColor: index === 1 ? node.color : 'var(--line-strong)' }}><div style={{ height: 3, background: index === 1 ? 'linear-gradient(90deg, var(--amethyst), var(--gold))' : node.color }} /><div style={{ padding: '12px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><span className="eh-source__product-icon" style={{ width: 30, height: 30, color: node.color }}><IC size={17} /></span><span className="kicker" style={{ color: node.color }}>{node.label}</span></div><strong style={{ fontSize: 14 }}>{node.title}</strong><p className="eh-source__muted">{node.sub}</p>{index === 1 && <button type="button" className="chip on" onClick={() => setStep(1)}><Icon.check size={12} />{approved ? 'Подтверждено' : 'Требует подтверждения'}</button>}{guide && index === 2 && <p className="eh-source__status">{approved && p >= .65 ? 'Материалы переданы' : 'Ожидает проверки'}</p>}</div></div> })}</div> : <div className="eh-source__narrow"><div className="eh-source__brief"><Icon.spark size={18} /><span>AI-черновик · Марина Соколова</span></div><label className="label" htmlFor="ai-text">Разбор по вашим трактовкам</label><textarea id="ai-text" className="input" rows={6} readOnly={!!guide} data-guide-active={!!guide && p > .08 && p < .78} value={editedDraft} onChange={(event) => setDraft(event.target.value)} /><div data-guide-press={press(guide)}><Action onClick={() => { setApproved(true); setStep(0) }}>Подтвердить</Action></div></div>
}

function ContentFragment({ step, guide }: FragmentProps) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState('Не обязательно менять всё сразу. Иногда первый шаг — заметить, что уже даёт вам опору. Три вопроса, которые помогут услышать себя…')
  if (guide && step === 0) {
    const writing = guide.id === 'content-write'
    const p = guide.progress
    const scheduled = !writing && p >= .82
    // app/content.jsx → PostEditor: selected title/body/channel/schedule controls, without modal shell.
    return <div className="eh-source__narrow">
      <div className="kicker">Публикация · Telegram</div><h3>Как найти свою опору</h3>
      {writing ? <><label className="label" htmlFor="guided-post-body">Текст</label><textarea id="guided-post-body" className="input" rows={5} readOnly data-guide-active={p > .12 && p < .7} value={typedText(text, p)} /><div data-guide-press={press(guide)}><Action onClick={guide.next}>Сохранить текст</Action></div></> : <>
        <p>{text}</p><label className="label">Автопубликация в соцсети</label><button type="button" className="chip on" onClick={guide.finish}>Telegram ✓</button>
        <div style={{ marginTop: 20 }}><label className="label">Публикация</label><div className="eh-source__slots" style={{ gridTemplateColumns: "1fr 1fr" }}><button type="button" className={`chip${p < .35 ? ' on' : ''}`} disabled>Сейчас</button><button type="button" className={`chip${p >= .35 ? ' on' : ''}`} onClick={guide.finish}>Запланировать</button></div></div>
        <div className="eh-source__reveal" style={reveal(guide, .4, .55)}><InfoRow label="Дата" value="15 сентября · 10:00" /></div>
        <button type="button" className="btn btn-primary eh-source__action" data-guide-press={press(guide)} onClick={guide.finish}>{scheduled ? 'Запланировано' : 'Запланировать'} <Icon.check size={16} /></button>
      </>}
    </div>
  }
  // app/content.jsx → a single post card; app/ref-library.jsx → an interpretation entry.
  return <div className="eh-source__narrow">{step === 0 ? <div className="card" style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 9 }}><div className="kicker">Публикация · Telegram</div><h3 style={{ margin: 0 }}>Как найти свою опору</h3>{editing ? <textarea className="input" aria-label="Текст публикации" rows={4} value={text} onChange={(event) => setText(event.target.value)} /> : <p style={{ margin: 0 }}>{text}</p>}<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}><span className="eh-source__muted">15 сентября · 10:00</span><button type="button" className="btn btn-ghost" style={{ marginLeft: 'auto', fontSize: 12 }} onClick={() => setEditing(!editing)}>{editing ? 'Сохранить' : 'Изменить'}</button></div></div> : <div className="card" style={{ padding: '20px 22px' }}><div className="kicker">Мои трактовки · Натальная астрология</div><h3>Солнце в Тельце</h3><p style={{ minHeight: 125 }}>{guide ? typedText("Потребность в устойчивости, осязаемом результате и собственном темпе. В консультации — исследовать, что человек считает своим ресурсом.", guide.progress) : "Потребность в устойчивости, осязаемом результате и собственном темпе. В консультации — исследовать, что человек считает своим ресурсом."}</p><span className="eh-source__muted">Используется при подготовке AI-черновика</span></div>}</div>
}

function PracticeFragment({ step, guide }: FragmentProps) {
  const [manualName, setName] = useState('Алиса Вега')
  const [manualTagline, setTagline] = useState('Натальная астрология · прогнозы · синастрия')
  const [manualHandle, setHandle] = useState('alisa-vega')
  const p = guide?.progress ?? 1
  const name = guide ? typedText('Алиса Вега', p, .12, .28) : manualName
  const tagline = guide ? typedText('Натальная астрология · прогнозы · синастрия', p, .3, .58) : manualTagline
  const handle = guide ? typedText('alisa-vega', p, .6, .76) : manualHandle
  const monthly = guide ? Math.round(63700 + 4900 * rangeProgress(p, .35, .6)).toLocaleString('ru-RU').replace(/\u00a0/g, ' ') : '68 600'
  // app/finance.jsx → balance cards; app/onboarding-steps.jsx → StepBasics fields.
  return <div className="eh-source__narrow">{step === 0 ? <><div className="eh-source__balances">{[['Доступно к выводу', '26 400', 'var(--pos)'], ['Всего за сентябрь', monthly, 'var(--text-1)']].map(([label, value, color]) => <div className="card" key={label} style={{ padding: '16px 18px' }}><div className="kicker" style={{ marginBottom: 10 }}>{label}</div><strong style={{ fontSize: 25, color }}>{value} <span style={{ fontSize: 14 }}>₽</span></strong></div>)}</div><div className="card" style={{ padding: '16px 18px', marginTop: 16 }}><h3>История операций</h3><div className="eh-source__reveal" style={reveal(guide, .25, .4)}><InfoRow icon="wallet" label="Марина" value="+4 900 ₽" /></div><InfoRow icon="wallet" label="Дмитрий" value="+4 900 ₽" /><InfoRow icon="wallet" label="Ольга" value="+4 900 ₽" /></div></> : <><Field label="Отображаемое имя / псевдоним" active={!!guide && p > .12 && p < .28} value={name} onChange={guide ? undefined : setName} /><Field label="Тэглайн" active={!!guide && p > .3 && p < .58} value={tagline} onChange={guide ? undefined : setTagline} /><div className="eh-source__field"><label className="label" htmlFor="profile-link">Короткая ссылка</label><div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-1)', border: '1px solid var(--line-strong)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}><span className="mono" style={{ padding: '12px 4px 12px 14px', color: 'var(--text-3)', fontSize: 12 }}>elevenhouse.app/</span><input id="profile-link" className="input mono" data-guide-active={!!guide && p > .6 && p < .76} readOnly={!!guide} value={handle} onChange={(event) => setHandle(event.target.value.replace(/[^a-z0-9-]/gi, '').toLowerCase())} style={{ border: 'none', paddingLeft: 0 }} /></div></div></>}</div>
}

export function SourceFragment({ feature, step, setStep, guide }: FragmentProps & { feature: FeatureId }) {
  const parts = { client: ClientFragment, reading: ReadingFragment, calendar: CalendarFragment, products: ProductFragment, session: SessionFragment, followup: FollowupFragment, automation: AutomationFragment, content: ContentFragment, practice: PracticeFragment }
  const Part = parts[feature]
  return <div className="eh-source eh-source__fragment" data-source-feature={feature}><Part step={step} setStep={setStep} guide={guide} /></div>
}
