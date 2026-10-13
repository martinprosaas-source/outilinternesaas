import { describe, expect, it } from 'vitest'
import { aujourdhui, decalerJour } from './lib.js'
import * as S from './suivi.js'
import * as W from './workflow.js'
import { donneesDemo } from './demo.js'

const ilYa = (n) => new Date(Date.now() - n * 86400000).toISOString()

describe('suivi des délais', () => {
  it('gris, puis orange à 2 j, puis rouge à 5 j', () => {
    const d = W.nouveauDossier({ nom: 'A' }, 'nino')
    expect(S.niveau({ ...d, etatLe: ilYa(0) })).toBe('ok')
    expect(S.niveau({ ...d, etatLe: ilYa(2) })).toBe('orange')
    expect(S.niveau({ ...d, etatLe: ilYa(5) })).toBe('rouge')
  })
  it('une date choisie (relance) passe au rouge une fois dépassée', () => {
    const d = W.nouveauDossier({ nom: 'A' }, 'nino')
    const relance = (n) => ({ ...d, prospection: { ...d.prospection, statut: 'contacte', relance: decalerJour(aujourdhui(), n) } })
    expect(S.niveau(relance(2))).toBe('ok')
    expect(S.niveau(relance(0))).toBe('orange')
    expect(S.niveau(relance(-1))).toBe('rouge')
    expect(S.groupe(S.tache(relance(-1), 'nino'))).toBe('retard')
    expect(S.groupe(S.tache(relance(0), 'nino'))).toBe('aujourdhui')
  })
  it('relancer remet le compteur à zéro et repousse la relance de 3 jours', () => {
    let d = W.contacter(W.nouveauDossier({ nom: 'A' }, 'nino'), 'nino')
    d = W.relancerProspect({ ...d, etatLe: ilYa(6) }, 'nino')
    expect(S.attente(d)).toBe(0)
    expect(d.prospection.relance).toBe(decalerJour(aujourdhui(), 3))
  })
})

describe('mes tâches', () => {
  it('chacun ne voit que ses dossiers, et validé à 3 la balle revient à Martin', () => {
    const { dossiers } = donneesDemo()
    const leroy = dossiers.find((d) => d.business === 'Leroy Business School')
    expect(S.tache(leroy, 'hugo').actions).toEqual(['valider', 'modif'])
    expect(S.tache(leroy, 'nino')).toBeNull()
    const valide = W.voterDevis(leroy, 'hugo')
    expect(W.attendus(valide)).toEqual(['martin'])
    expect(S.tache(valide, 'martin').actions[0]).toBe('envoyer')
    for (const id of ['nino', 'hugo', 'martin']) expect(S.mesTaches(dossiers, id).length).toBeGreaterThan(0)
  })
  it('les groupes de tâches suivent les couleurs du tableau', () => {
    const { dossiers } = donneesDemo()
    for (const id of ['nino', 'hugo', 'martin']) {
      for (const t of S.mesTaches(dossiers, id)) {
        const n = S.niveau(t.d)
        if (n === 'rouge') expect(S.groupe(t)).toBe('retard')
        if (n === 'orange') expect(S.groupe(t)).toBe('aujourdhui')
        if (S.groupe(t) === 'retard') expect(n).toBe('rouge')
      }
    }
  })
})
