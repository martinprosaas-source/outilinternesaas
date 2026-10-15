import { describe, expect, it } from 'vitest'
import * as W from './workflow.js'
import { BLOCS, cleItem } from './trame.js'

const besoin = (besoin, priorite = 'indispensable') => ({ id: besoin, qui: 'La compta', besoin, pour: 'gagner du temps', priorite, preuve: '', revue: {} })
const toutCoche = () => Object.fromEntries(BLOCS.flatMap((b) => b.items.map((i) => [cleItem(b.id, i.id), true])))

describe('parcours complet d’un dossier', () => {
  it('va du prospect à la livraison', () => {
    let d = W.nouveauDossier({ nom: 'Léa Martin', business: 'Léa Academy' }, 'nino')
    expect(W.aMoiDeJouer(d, 'nino')).toBe(true)
    d = W.passerAudit(d, 'nino')
    expect(d.etape).toBe('audit')
    expect(W.aMoiDeJouer(d, 'hugo')).toBe(true)

    expect(() => W.soumettreAudit(d, 'hugo')).toThrow(/9 blocs/)
    d = { ...d, audit: { ...d.audit, coches: toutCoche(), acces: [{ id: 'a', outil: 'Whop' }], fiche: { ...d.audit.fiche, exclus: 'Les pubs' } } }
    expect(() => W.soumettreAudit(d, 'hugo')).toThrow(/besoin/)
    d = { ...d, audit: { ...d.audit, besoins: [besoin('les commissions'), besoin('un espace membre'), besoin('une app mobile'), besoin('un classement', 'plus_tard'), besoin('les pubs Meta', 'hors')] } }
    d = W.soumettreAudit(d, 'hugo')
    expect(d.etape).toBe('revue')

    expect(() => W.validerAudit(d, 'martin', 'D-1')).toThrow(/verdict/)
    d = W.renvoyerAudit(d, 'martin', 'Il manque le nombre de closers')
    expect(d.etape).toBe('audit')
    expect(d.audit.retours).toHaveLength(1)
    d = W.soumettreAudit(d, 'hugo')

    const verdicts = { 'les commissions': ['ok', 6], 'un espace membre': ['reserve', 8], 'une app mobile': ['non', ''] }
    d = { ...d, audit: { ...d.audit, besoins: d.audit.besoins.map((b) => (verdicts[b.besoin] ? { ...b, revue: { verdict: verdicts[b.besoin][0], jours: verdicts[b.besoin][1] } } : b)) } }
    expect(W.verdictGlobal(d.audit)).toBe('reserve')
    expect(W.pretAValider(d.audit)).toBe(true)
    d = W.validerAudit(d, 'martin', 'D-2026-001')
    expect(d.etape).toBe('devis')
    expect(d.devis.lignes.map((l) => l.titre)).toEqual(['Les commissions', 'Un espace membre'])
    expect(W.totalDevis(d.devis).total).toBe(14 * d.devis.tjm)
    expect(d.devis.conditions).toMatch(/plus tard.*un classement/)
    expect(d.devis.conditions).toMatch(/Exclu : une app mobile ; les pubs Meta ; Les pubs/)
    expect(d.devis.conditions).toMatch(/Accès à fournir : Whop/)

    d = W.soumettreDevis(d, 'martin')
    expect(W.nbValidations(d)).toBe(1)
    expect(() => W.envoyerDevis(d, 'martin')).toThrow(/validations/)
    d = W.voterDevis(d, 'nino')
    d = W.demanderModif(d, 'hugo', 'Ajouter la maintenance')
    expect(d.etape).toBe('devis')
    expect(W.nbValidations(d)).toBe(0)
    d = W.soumettreDevis(d, 'martin')
    d = W.voterDevis(W.voterDevis(d, 'nino'), 'hugo')
    expect(W.devisValide(d)).toBe(true)
    d = W.envoyerDevis(d, 'martin')
    expect(d.etape).toBe('envoye')
    expect(W.aMoiDeJouer(d, 'nino')).toBe(true)

    d = W.signer(d, 'nino')
    expect(d.etape).toBe('delivery')
    expect(d.delivery.livrables).toHaveLength(2)
    expect(d.delivery.paiements.reduce((s, p) => s + p.montant, 0)).toBe(W.totalDevis(d.devis).total)

    expect(() => W.livrer(d, 'martin')).toThrow(/livrables/)
    d = { ...d, delivery: { ...d.delivery, livrables: d.delivery.livrables.map((l) => ({ ...l, statut: 'livre' })) } }
    d = W.livrer(d, 'martin')
    expect(d.etape).toBe('livre')
    expect(d.historique.length).toBeGreaterThan(10)
  })

  it('une case sans réponse devient une question ouverte', () => {
    let a = W.auditVide()
    const cle = cleItem('argent', 'cas')
    expect(W.etatItem(a, cle)).toBe(null)
    a = { ...a, questions: [{ id: 'q', item: cle, texte: 'Upsell ?', aQui: 'Le dirigeant', reponse: '' }] }
    expect(W.etatItem(a, cle)).toBe('question')
    expect(W.questionsOuvertes(a)).toHaveLength(1)
    const c = W.completionAudit({ ...a, coches: Object.fromEntries(BLOCS.find((b) => b.id === 'argent').items.filter((i) => i.id !== 'cas').map((i) => [cleItem('argent', i.id), true])) })
    expect(c.blocs.argent).toMatchObject({ termine: true, questions: 1 })
    expect(c.faits).toBe(1)
  })

  it('remise et acompte', () => {
    const t = W.totalDevis({ lignes: [{ prix: 3000 }, { prix: 2000 }], remise: 500, acompte: 40, maintenance: 290 })
    expect(t).toMatchObject({ brut: 5000, total: 4500, acompte: 1800, solde: 2700, mensuel: 290 })
  })

  it('un dossier perdu n’attend plus personne', () => {
    let d = W.nouveauDossier({ nom: 'X' }, 'nino')
    d = W.perdre(d, 'nino', 'Pas de budget')
    expect(W.attendus(d)).toEqual([])
    d = W.reactiver(d, 'nino')
    expect(W.attendus(d)).toEqual(['nino'])
  })
})
