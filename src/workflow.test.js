import { describe, expect, it } from 'vitest'
import * as W from './workflow.js'

const prop = (titre, jours = 4) => ({ id: titre, titre, description: '', jours, revue: {} })

describe('parcours complet d’un dossier', () => {
  it('va du prospect à la livraison', () => {
    let d = W.nouveauDossier({ nom: 'Léa Martin', business: 'Léa Academy' }, 'nino')
    expect(W.aMoiDeJouer(d, 'nino')).toBe(true)
    d = W.passerAudit(d, 'nino')
    expect(d.etape).toBe('audit')
    expect(W.aMoiDeJouer(d, 'hugo')).toBe(true)

    expect(() => W.soumettreAudit(d, 'hugo')).toThrow(/proposition/)
    d = { ...d, audit: { ...d.audit, propositions: [prop('CRM setters', 6), prop('Espace membre', 8), prop('App mobile', 20)] } }
    d = W.soumettreAudit(d, 'hugo')
    expect(d.etape).toBe('revue')

    expect(() => W.validerAudit(d, 'martin', 'D-1')).toThrow(/verdict/)
    d = W.renvoyerAudit(d, 'martin', 'Il manque le nombre de closers')
    expect(d.etape).toBe('audit')
    expect(d.audit.retours).toHaveLength(1)
    d = W.soumettreAudit(d, 'hugo')

    const verdicts = { 'CRM setters': 'ok', 'Espace membre': 'reserve', 'App mobile': 'non' }
    d = { ...d, audit: { ...d.audit, propositions: d.audit.propositions.map((p) => ({ ...p, revue: { verdict: verdicts[p.titre], jours: '' } })) } }
    d = W.validerAudit(d, 'martin', 'D-2026-001')
    expect(d.etape).toBe('devis')
    expect(d.devis.lignes.map((l) => l.titre)).toEqual(['CRM setters', 'Espace membre'])
    expect(W.totalDevis(d.devis).total).toBe(14 * d.devis.tjm)

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
