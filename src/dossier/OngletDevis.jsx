// Onglet Devis : Martin chiffre, les trois valident, puis le devis part chez le client jusqu'à la signature.
import { motion } from 'motion/react'
import { dateLongue, depuis, euros, uid } from '../lib.js'
import { useStore } from '../store.jsx'
import { AvatarMembre, Bouton, Champ, Compteur, EASE, Icone, Presence, Surtitre, TexteLibre } from '../ui.jsx'
import { nomMembre } from './commun.jsx'
import * as W from '../workflow.js'

// Le devis comme un document : lignes, totaux. Modifiable pendant le chiffrage.
function Document({ d, edition }) {
  const { modifier } = useStore()
  const v = d.devis
  const t = W.totalDevis(v)
  const majDevis = (k) => (val) => modifier(d.id, (x) => ({ ...x, devis: { ...x.devis, [k]: val } }))
  const majLigne = (id, k, val) => modifier(d.id, (x) => ({ ...x, devis: { ...x.devis, lignes: x.devis.lignes.map((l) => (l.id === id ? { ...l, [k]: val } : l)) } }))
  const majJours = (id, val) => modifier(d.id, (x) => ({ ...x, devis: { ...x.devis, lignes: x.devis.lignes.map((l) => (l.id === id ? { ...l, jours: val, prix: (Number(val) || 0) * (Number(x.devis.tjm) || 0) } : l)) } }))
  const ajouter = () => modifier(d.id, (x) => ({ ...x, devis: { ...x.devis, lignes: [...x.devis.lignes, { id: uid('l'), titre: '', description: '', jours: '', prix: 0 }] } }))
  const retirer = (id) => modifier(d.id, (x) => ({ ...x, devis: { ...x.devis, lignes: x.devis.lignes.filter((l) => l.id !== id) } }))
  const recalculer = () => modifier(d.id, (x) => ({ ...x, devis: { ...x.devis, lignes: x.devis.lignes.map((l) => ({ ...l, prix: (Number(l.jours) || 0) * (Number(x.devis.tjm) || 0) })) } }))

  return (
    <div className="overflow-hidden rounded-[24px] border border-craie bg-white shadow-[0_30px_80px_-50px_rgba(18,18,18,0.45)]">
      {/* En-tête du document */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-craie px-5 py-5 md:px-7">
        <div>
          <Surtitre>Devis {v.numero}</Surtitre>
          <div className="mt-1 text-xl font-extrabold tracking-tight">{d.business || d.nom}</div>
          <div className="text-sm text-pierre">{d.nom}{d.contact?.email ? ` · ${d.contact.email}` : ''}</div>
        </div>
        <div className="text-right text-sm">
          <div className="text-pierre">Créé le {dateLongue(v.creeLe)}</div>
          {v.envoyeLe && <div className="text-pierre">Envoyé le {dateLongue(v.envoyeLe)}</div>}
          {v.signeLe && <div className="font-semibold text-vert">Signé le {dateLongue(v.signeLe)}</div>}
        </div>
      </div>

      {/* Lignes */}
      <div className="px-5 py-3 md:px-7">
        {edition && <div className="hidden grid-cols-[1fr_90px_120px_36px] gap-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-pierre md:grid">
          <span>Prestation</span><span className="text-right">Jours</span><span className="text-right">Montant HT</span><span />
        </div>}
        <Presence initial={false}>
          {v.lignes.map((l, i) => (
            <motion.div key={l.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: EASE }} className="border-t border-craie/70 first:border-t-0">
              {edition ? (
                <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 py-3 md:grid-cols-[1fr_90px_120px_36px]">
                  <div className="col-span-2 space-y-1.5 md:col-span-1">
                    <input className="champ h-9 font-bold" value={l.titre} placeholder="Prestation" onChange={(e) => majLigne(l.id, 'titre', e.target.value)} />
                    <input className="champ h-9 text-sm text-pierre" value={l.description} placeholder="Description (apparaît sur le PDF)" onChange={(e) => majLigne(l.id, 'description', e.target.value)} />
                  </div>
                  <input className="champ h-9 text-right tabular" inputMode="numeric" value={l.jours} placeholder="j" onChange={(e) => majJours(l.id, e.target.value)} aria-label="Jours" />
                  <input className="champ h-9 text-right font-bold tabular" inputMode="numeric" value={l.prix} onChange={(e) => majLigne(l.id, 'prix', Number(e.target.value.replace(/\D/g, '')) || 0)} aria-label="Montant" />
                  <button type="button" onClick={() => retirer(l.id)} className="hidden h-9 w-9 items-center justify-center rounded-full text-pierre transition hover:bg-red-600/10 hover:text-red-700 md:flex" aria-label="Retirer la ligne"><Icone nom="corbeille" /></button>
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05, ease: EASE }} className="flex items-start justify-between gap-4 py-3.5">
                  <div className="min-w-0">
                    <div className="font-bold">{l.titre}</div>
                    {l.description && <div className="text-sm text-pierre">{l.description}</div>}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-bold tabular">{euros(l.prix)}</div>
                    {l.jours ? <div className="text-[11px] text-pierre">{l.jours} j</div> : null}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </Presence>
        {edition && (
          <div className="flex flex-wrap gap-2 py-3">
            <Bouton taille="sm" variante="secondaire" icone="plus" onClick={ajouter}>Ajouter une ligne</Bouton>
            <Bouton taille="sm" variante="discret" icone="reset" onClick={recalculer}>Recalculer jours × TJM</Bouton>
          </div>
        )}
      </div>

      {/* Totaux */}
      <div className="grid grid-cols-1 gap-6 border-t border-craie bg-papier/60 px-5 py-5 md:grid-cols-[1fr_280px] md:px-7">
        <div>
          {edition ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Champ label="TJM"><div className="relative"><input className="champ h-10 pr-8 tabular" inputMode="numeric" value={v.tjm} onChange={(e) => majDevis('tjm')(Number(e.target.value.replace(/\D/g, '')) || 0)} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-pierre">€</span></div></Champ>
              <Champ label="Remise"><div className="relative"><input className="champ h-10 pr-8 tabular" inputMode="numeric" value={v.remise} onChange={(e) => majDevis('remise')(Number(e.target.value.replace(/\D/g, '')) || 0)} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-pierre">€</span></div></Champ>
              <Champ label="Acompte"><div className="relative"><input className="champ h-10 pr-8 tabular" inputMode="numeric" value={v.acompte} onChange={(e) => majDevis('acompte')(Math.min(100, Number(e.target.value.replace(/\D/g, '')) || 0))} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-pierre">%</span></div></Champ>
              <Champ label="Maintenance"><div className="relative"><input className="champ h-10 pr-14 tabular" inputMode="numeric" value={v.maintenance} onChange={(e) => majDevis('maintenance')(Number(e.target.value.replace(/\D/g, '')) || 0)} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-pierre">€/mois</span></div></Champ>
              <Champ label="Délai"><div className="relative"><input className="champ h-10 pr-12 tabular" inputMode="numeric" value={v.delaiSemaines} onChange={(e) => majDevis('delaiSemaines')(Number(e.target.value.replace(/\D/g, '')) || 0)} /><span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-pierre">sem.</span></div></Champ>
              <div className="col-span-2 sm:col-span-3">
                <span className="etiquette">Conditions (facultatif)</span>
                <TexteLibre valeur={v.conditions} onChange={majDevis('conditions')} lignes={1} placeholder="Accès à fournir, nombre d’allers-retours inclus, hébergement…" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div><Surtitre>Délai</Surtitre><div className="mt-1 font-bold">{v.delaiSemaines} semaines</div></div>
              <div><Surtitre>Acompte</Surtitre><div className="mt-1 font-bold">{v.acompte} %</div></div>
              <div><Surtitre>Charge</Surtitre><div className="mt-1 font-bold">{t.jours} jours</div></div>
              {v.conditions && <div className="col-span-2 sm:col-span-3"><Surtitre>Conditions</Surtitre><p className="mt-1 whitespace-pre-line text-pierre">{v.conditions}</p></div>}
            </div>
          )}
        </div>
        <div className="space-y-1.5 text-sm">
          {t.remise > 0 && <div className="flex justify-between text-pierre"><span>Sous-total</span><span className="tabular">{euros(t.brut)}</span></div>}
          {t.remise > 0 && <div className="flex justify-between text-pierre"><span>Remise</span><span className="tabular">− {euros(t.remise)}</span></div>}
          <div className="flex items-baseline justify-between border-t-2 border-encre pt-2">
            <span className="font-bold">Total HT</span>
            <span className="text-[26px] font-extrabold tracking-tight tabular"><Compteur valeur={t.total} format={euros} duree={0.6} /></span>
          </div>
          <div className="flex justify-between text-pierre"><span>Acompte {v.acompte} %</span><span className="tabular">{euros(t.acompte)}</span></div>
          <div className="flex justify-between text-pierre"><span>Solde à la livraison</span><span className="tabular">{euros(t.solde)}</span></div>
          {t.mensuel > 0 && <div className="flex justify-between font-semibold text-accent"><span>Maintenance</span><span className="tabular">{euros(t.mensuel)} / mois</span></div>}
        </div>
      </div>
    </div>
  )
}

export default function OngletDevis({ d, moi }) {
  if (!d.devis) return null
  const edition = d.etape === 'devis' && moi.role === 'dev' && !d.perdu
  const derniereModif = d.devis.modifs?.[0]
  return (
    <div className="space-y-4">
      {d.etape === 'devis' && derniereModif && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 rounded-2xl border border-accent/30 bg-accent/[0.06] p-4">
          <AvatarMembre id={derniereModif.qui} plein />
          <div className="text-sm">
            <div><b>{nomMembre(derniereModif.qui)} demande une modification</b> <span className="text-pierre">· {depuis(derniereModif.date)}</span></div>
            <p className="mt-1 font-serif text-[16px] italic">« {derniereModif.texte} »</p>
          </div>
        </motion.div>
      )}
      {d.etape === 'devis' && moi.role !== 'dev' && <p className="font-serif text-[15px] italic text-pierre">Martin prépare le devis : tu le valideras quand il te l’enverra.</p>}
      <Document d={d} edition={edition} />
    </div>
  )
}
