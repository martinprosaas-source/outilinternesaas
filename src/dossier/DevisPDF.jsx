// Le devis en version imprimable (PDF via « Imprimer → Enregistrer en PDF »).
// Rendu dans document.body avec la classe .imprimable : seul ce bloc sort à l'impression.
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { NOM } from '../config.js'
import { dateLongue, euros } from '../lib.js'
import * as W from '../workflow.js'

// Monte la copie imprimable seulement le temps de l'impression (jamais deux devis dans la page).
export function useImpression(d) {
  const [actif, setActif] = useState(false)
  useEffect(() => {
    if (!actif) return
    const t = setTimeout(() => { window.print(); setActif(false) }, 80)
    return () => clearTimeout(t)
  }, [actif])
  return [actif && d?.devis ? <DevisPDF d={d} /> : null, () => setActif(true)]
}

export default function DevisPDF({ d }) {
  const t = W.totalDevis(d.devis)
  const date = d.devis.envoyeLe || d.devis.creeLe || new Date().toISOString()
  return createPortal(
    <div className="imprimable" style={{ fontFamily: '"Schibsted Grotesk", system-ui, sans-serif', color: '#121212', fontSize: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #121212', paddingBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg viewBox="0 0 100 100" width="30" height="30"><path d="M20 80 L50 20 L80 80" fill="none" stroke="#121212" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" /><circle cx="50" cy="64" r="10" fill="#2B44E0" /></svg>
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em' }}>{NOM}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.03em' }}>Devis</div>
          <div style={{ color: '#6B6660' }}>{d.devis.numero} · {dateLongue(date)}</div>
          <div style={{ color: '#6B6660' }}>Valable 30 jours</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, gap: 24 }}>
        <div>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6660' }}>Pour</div>
          <div style={{ marginTop: 4, fontSize: 15, fontWeight: 700 }}>{d.business || d.nom}</div>
          <div>{d.nom}</div>
          {d.contact?.email && <div style={{ color: '#6B6660' }}>{d.contact.email}</div>}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6660' }}>Délai</div>
          <div style={{ marginTop: 4, fontSize: 15, fontWeight: 700 }}>{d.devis.delaiSemaines} semaines</div>
          <div style={{ color: '#6B6660' }}>à partir de la signature</div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 28 }}>
        <thead>
          <tr style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B6660', textAlign: 'left' }}>
            <th style={{ padding: '8px 0', borderBottom: '1px solid #E6E2DA' }}>Prestation</th>
            <th style={{ padding: '8px 0', borderBottom: '1px solid #E6E2DA', textAlign: 'right', width: 110 }}>Montant HT</th>
          </tr>
        </thead>
        <tbody>
          {d.devis.lignes.map((l) => (
            <tr key={l.id}>
              <td style={{ padding: '12px 0', borderBottom: '1px solid #E6E2DA', verticalAlign: 'top' }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{l.titre}</div>
                {l.description && <div style={{ color: '#6B6660', marginTop: 2 }}>{l.description}</div>}
              </td>
              <td style={{ padding: '12px 0', borderBottom: '1px solid #E6E2DA', textAlign: 'right', verticalAlign: 'top', fontWeight: 600 }}>{euros(l.prix)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginLeft: 'auto', width: 260, marginTop: 16 }}>
        {t.remise > 0 && <Ligne label="Sous-total" valeur={euros(t.brut)} />}
        {t.remise > 0 && <Ligne label="Remise" valeur={`− ${euros(t.remise)}`} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #121212', marginTop: 6, paddingTop: 8, fontSize: 16, fontWeight: 800 }}>
          <span>Total HT</span><span>{euros(t.total)}</span>
        </div>
        <Ligne label={`Acompte à la signature (${d.devis.acompte} %)`} valeur={euros(t.acompte)} />
        <Ligne label="Solde à la livraison" valeur={euros(t.solde)} />
        {t.mensuel > 0 && <Ligne label="Maintenance et hébergement" valeur={`${euros(t.mensuel)} / mois`} />}
      </div>

      {d.devis.conditions && (
        <div style={{ marginTop: 26, padding: 14, background: '#F4F2EE', borderRadius: 10, whiteSpace: 'pre-line' }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6660', marginBottom: 4 }}>Conditions</div>
          {d.devis.conditions}
        </div>
      )}

      <div style={{ display: 'flex', gap: 24, marginTop: 40 }}>
        {['Pour ' + NOM, `Pour ${d.business || d.nom}`].map((x) => (
          <div key={x} style={{ flex: 1, border: '1px solid #E6E2DA', borderRadius: 10, padding: 14, height: 90 }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B6660' }}>{x}</div>
            <div style={{ color: '#6B6660', marginTop: 4 }}>Date et signature, précédées de « Bon pour accord »</div>
          </div>
        ))}
      </div>
    </div>,
    document.body,
  )
}

const Ligne = ({ label, valeur }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', color: '#3a3733' }}>
    <span>{label}</span><span style={{ fontWeight: 600 }}>{valeur}</span>
  </div>
)
