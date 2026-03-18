// examAlias.ts

import type { ExamType } from './examType';

export type ExamAlias =
    | 'laboratorne_vysetrenia'
    | 'krvne_testy'
    | 'vysetrenie_mocu'
    | 'vysetrenie_stolice'
    | 'mikrobiologia'
    | 'cytologia'
    | 'biopsia_histologia'
    | 'alergie_koza'
    | 'kozne_scrapings'
    | 'kozne_stery'
    | 'alergologicke_krvne_testy'
    | 'intradermalne_alergotesty'
    | 'zobrazovacie_metody'
    | 'rtg'
    | 'ultrazvuk'
    | 'ct'
    | 'mri'
    | 'endoskopia'
    | 'srdce_cievy'
    | 'ekg'
    | 'krvny_tlak'
    | 'echo'
    | 'rtg_hrudnika'
    | 'ocne_vysetrenia'
    | 'vysetrenie_oka'
    | 'vnutoocny_tlak'
    | 'test_slzivosti'
    | 'farbiace_testy_rohovky'
    | 'neuro_vysetrenia'
    | 'klinicke_neuro'
    | 'pokrocile_zobrazovanie'
    | 'infekcne_ochorenia'
    | 'rychlotesty'
    | 'serologicke_panely'
    | 'geneticke_testy'
    | 'dedicne_ochorenia'
    | 'plemenne_testy'
    | 'veterinarny_pas';

export const EXAM_ALIAS_TO_TYPE: Record<ExamAlias, ExamType> = {
    laboratorne_vysetrenia: 'blood_tests',
    krvne_testy: 'blood_tests',
    vysetrenie_mocu: 'urine',
    vysetrenie_stolice: 'stool',
    mikrobiologia: 'microbiology',
    cytologia: 'cytology',
    biopsia_histologia: 'histology',

    alergie_koza: 'dermatology',
    kozne_scrapings: 'dermatology',
    kozne_stery: 'dermatology',
    alergologicke_krvne_testy: 'dermatology',
    intradermalne_alergotesty: 'dermatology',

    zobrazovacie_metody: 'imaging',
    rtg: 'imaging',
    ultrazvuk: 'imaging',
    ct: 'imaging',
    mri: 'imaging',
    endoskopia: 'imaging',

    srdce_cievy: 'cardiology',
    ekg: 'cardiology',
    krvny_tlak: 'cardiology',
    echo: 'cardiology',
    rtg_hrudnika: 'cardiology',

    ocne_vysetrenia: 'ophthalmology',
    vysetrenie_oka: 'ophthalmology',
    vnutoocny_tlak: 'ophthalmology',
    test_slzivosti: 'ophthalmology',
    farbiace_testy_rohovky: 'ophthalmology',

    neuro_vysetrenia: 'neurology',
    klinicke_neuro: 'neurology',
    pokrocile_zobrazovanie: 'neurology',

    infekcne_ochorenia: 'infectious_diseases',
    rychlotesty: 'infectious_diseases',
    serologicke_panely: 'infectious_diseases',

    geneticke_testy: 'genetics',
    dedicne_ochorenia: 'genetics',
    plemenne_testy: 'genetics',
    veterinarny_pas: 'vet_pass',
};

export const EXAM_ALIASES = Object.keys(EXAM_ALIAS_TO_TYPE) as ExamAlias[];

export function isExamAlias(value: string): value is ExamAlias {
    return EXAM_ALIASES.includes(value as ExamAlias);
}
