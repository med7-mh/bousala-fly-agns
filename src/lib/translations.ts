export const translations = {
  ar: {
    dashboard: 'اليومية',
    bookings: 'الحجوزات',
    customers: 'العملاء',
    cashier: 'سجل الكاشير',
    expenses: 'المصروفات',
    suppliers: 'الموردين',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    
    // Dashboard
    daily_journal: 'اليومية والصندوق',
    daily_journal_desc: 'تسجيل العمليات السريعة وملخص حسابات اليوم',
    form: 'استمارة',
    photocopy: 'تصوير',
    visa: 'تأشيرة',
    expense_quick: 'مصروف',
    total_income: 'إجمالي المقبوضات',
    total_expense: 'إجمالي المنصرف',
    net_balance: 'صافي الصندوق (الرصيد)',
    daily_transactions: 'تفاصيل حركات اليوم',
    no_transactions: 'لا توجد حركات مالية مسجلة في هذا اليوم',
    cancel: 'إلغاء',
    save: 'حفظ وتسجيل',
    amount: 'المبلغ',
    currency: 'أوقية',
    description: 'البيان / الوصف',
    payment_method: 'طريقة الدفع',

    // Bookings
    add_booking: 'حجز جديد',
    type: 'نوع الحجز',
    flight: 'طيران',
    hotel: 'فندق',
    tour: 'جولة سياحية',
    passport: 'جواز سفر',
    
    // Status
    pending: 'معلق',
    confirmed: 'مؤكد',
    cancelled: 'ملغي',
    documents_received: 'استلام المستندات',
    processing: 'قيد المعالجة',
    ready: 'جاهز للاستلام',
    delivered: 'تم التسليم',

    // Payment Methods
    cash: 'نقدي (Cash)',
    bankily: 'بنكيلي (Bankily)',
    masrivi: 'مصرفي (Masrivi)',
    sedad: 'سداد (Sedad)',
    bamis: 'باميس (Bamis)',
    amanty: 'أمانتي (Amanty)',
    other: 'أخرى'
  },
  fr: {
    dashboard: 'Journal',
    bookings: 'Réservations',
    customers: 'Clients',
    cashier: 'Caisse',
    expenses: 'Dépenses',
    suppliers: 'Fournisseurs',
    settings: 'Paramètres',
    logout: 'Déconnexion',

    // Dashboard
    daily_journal: 'Journal Quotidien',
    daily_journal_desc: 'Enregistrement rapide et résumé journalier',
    form: 'Formulaire',
    photocopy: 'Photocopie',
    visa: 'Visa',
    expense_quick: 'Dépense',
    total_income: 'Total Recettes',
    total_expense: 'Total Dépenses',
    net_balance: 'Solde Net',
    daily_transactions: 'Détails des Mouvements',
    no_transactions: 'Aucun mouvement enregistré aujourd\'hui',
    cancel: 'Annuler',
    save: 'Enregistrer',
    amount: 'Montant',
    currency: 'MRU',
    description: 'Description',
    payment_method: 'Méthode de Paiement',

    // Bookings
    add_booking: 'Nouvelle Réservation',
    type: 'Type',
    flight: 'Vol',
    hotel: 'Hôtel',
    tour: 'Tour',
    passport: 'Passeport',

    // Status
    pending: 'En attente',
    confirmed: 'Confirmé',
    cancelled: 'Annulé',
    documents_received: 'Docs Reçus',
    processing: 'En traitement',
    ready: 'Prêt',
    delivered: 'Livré',

    // Payment Methods
    cash: 'Espèces (Cash)',
    bankily: 'Bankily',
    masrivi: 'Masrivi',
    sedad: 'Sedad',
    bamis: 'Bamis',
    amanty: 'Amanty',
    other: 'Autre'
  }
} as const;

export type TranslationKey = keyof typeof translations.ar;

export function t(key: TranslationKey, lang: 'ar' | 'fr') {
  return translations[lang][key] || translations['ar'][key] || key;
}
