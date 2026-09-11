import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { legalDrafts, type LegalDraftId } from './legalDrafts'
import './legalDialog.css'

function LegalDraftDialog({ kind, onClose }: { kind: LegalDraftId; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const document = legalDrafts[kind]
  useEffect(() => {
    const element = dialog.current
    if (element && !element.open) element.showModal()
    // Removing the dialog from the DOM releases the native modal state.
    // Closing in cleanup would dismiss it during React StrictMode's effect replay.
  }, [])
  return <dialog ref={dialog} className="eh-legal-dialog" aria-labelledby="eh-legal-title" aria-describedby="eh-legal-note" onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close() }}>
    <div className="eh-legal-dialog__content">
      <header className="eh-legal-dialog__header">
        <div><span className="eh-legal-dialog__eyebrow">ElevenHouse · Черновик для макета</span><h2 id="eh-legal-title">{document.title}</h2></div>
        <button type="button" autoFocus aria-label="Закрыть документ" onClick={() => dialog.current?.close()}>×</button>
      </header>
      <p id="eh-legal-note" className="eh-legal-dialog__note">Реквизиты вымышлены. Этот документ — черновик для макета, а не действующие юридические условия сервиса.</p>
      {document.sections.map(([title, body]) => <section key={title}><h3>{title}</h3><p>{body}</p></section>)}
    </div>
  </dialog>
}

export function FinaleFooter() {
  const [activeDocument, setActiveDocument] = useState<LegalDraftId | null>(null)
  return <><footer className="eh-journey__footer eh-finale-footer">
    <span className="eh-finale-footer__copyright">© {new Date().getFullYear()} ElevenHouse</span>
    <nav className="eh-finale-footer__contacts" aria-label="Контакты ElevenHouse">
      <a href="mailto:hello@elevenhouse.ai">Связаться с нами</a>
      <a href="mailto:support@elevenhouse.ai">Поддержка</a>
    </nav>
    <a className="eh-finale-footer__top" href="#top">К началу ↑</a>
    <nav className="eh-finale-footer__documents" aria-label="Юридические документы">
      {(Object.keys(legalDrafts) as LegalDraftId[]).map((kind) => <button key={kind} type="button" onClick={() => setActiveDocument(kind)}>{legalDrafts[kind].title}</button>)}
    </nav>
  </footer>
    {activeDocument && createPortal(<LegalDraftDialog kind={activeDocument} onClose={() => setActiveDocument(null)} />, document.body)}
  </>
}
