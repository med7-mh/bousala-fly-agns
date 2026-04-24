export const translations = {
  ar: {
    dashboard: 'اليومية',
    bookings: 'الحجوزات',
    customers: 'العملاء',
    cashier: 'الخزينة والحسابات',
    expenses: 'المصروفات',
    suppliers: 'الموردين',
    settings: 'الإعدادات',
    logout: 'تسجيل الخروج',
    
    // Common
    search: 'بحث...',
    filter: 'تصفية',
    add: 'إضافة',
    edit: 'تعديل',
    delete: 'حذف',
    confirm: 'تأكيد',
    cancel: 'إلغاء',
    save: 'حفظ وتسجيل',
    save_changes: 'حفظ التعديلات',
    amount: 'المبلغ',
    currency: 'أوقية',
    description: 'البيان / الوصف',
    category_desc: 'البيان / التصنيف',
    payment_method: 'طريقة الدفع',
    date: 'التاريخ',
    status: 'الحالة',
    name: 'الاسم',
    phone: 'رقم الهاتف',
    email: 'البريد الإلكتروني',
    balance: 'الرصيد',
    total: 'الإجمالي',
    action: 'الإجراء',
    
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

    // Transactions
    financial_summary: 'الخلاصات المالية (كل الوقت)',
    add_transaction: 'إضافة عملية',
    internal_transfer: 'تحويل بين الحسابات',
    income: 'إيراد / مدخول',
    expense: 'مصروف',
    operating_expense: 'مصروف تشغيلي (للرحلات)',
    operating_expense_short: 'مصروف تشغيلي',
    all_transactions: 'جميع العمليات',
    from_account: 'من حساب',
    to_account: 'إلى حساب',
    execute_transfer: 'تنفيذ التحويل',
    transfer_amount: 'المبلغ (أوقية)',
    transaction_type: 'نوع العملية',
    transaction_income: 'مقبوضات (سند قبض)',
    transaction_expense: 'مدفوعات (سند صرف)',
    payment_receipt_method: 'طريقة الدفع/الاستلام',
    transaction_desc_placeholder: 'مثال: دفعة مقدمة لتذكرة ذهاب فقط',
    linked_supplier_optional: 'مرتبط بمورد (اختياري)',
    no_supplier: 'بدون مورد...',
    linked_booking_optional: 'مرتبط بحجز (اختياري)',
    no_booking: 'بدون حجز...',
    save_transaction: 'حفظ العملية',
    delete_transaction_confirm: 'هل أنت متأكد من حذف العملية',
    delete_transaction_warning: 'هذا الإجراء لا يمكن التراجع عنه. قد يؤثر على حسابات العملاء والموردين.',
    transfer_desc_optional: 'البيان (اختياري)',
    transfer_desc_placeholder: 'مثال: إيداع نقدي في البنك',
    date_col: 'التاريخ',
    type_col: 'النوع',
    amount_col: 'المبلغ',
    method_col: 'وسيلة الدفع',
    desc_col: 'الوصف',
    booking_col: 'مرتبط بحجز',
    no_financial_transactions: 'لا توجد عمليات مالية',
    edit_transaction_title: 'تعديل العملية المالية',
    add_transaction_title: 'إضافة عملية مالية',

    // Bookings
    add_booking: 'حجز جديد',
    type: 'نوع الحجز',
    flight: 'طيران',
    hotel: 'فندق',
    tour: 'جولة سياحية',
    passport: 'جواز سفر',
    
    // Customers & Suppliers
    customer_list: 'قائمة العملاء',
    add_customer: 'إضافة عميل',
    supplier_list: 'قائمة الموردين',
    add_supplier: 'إضافة مورد',

    // Expenses
    expense_list: 'سجل المصروفات',
    total_operating_expenses: 'إجمالي المصروفات الإدارية',
    deducted_from_profits: 'يُخصم تلقائياً من الأرباح الصافية',
    search_expenses: 'ابحث في المصروفات...',
    new_operating_expense: 'سند صرف جديد (إداري)',
    no_operating_expenses: 'لا توجد مصروفات إدارية',
    edit_expense: 'تعديل المصروف',
    delete_expense: 'حذف المصروف',
    edit_operating_expense_title: 'تعديل مصروف إداري',
    new_operating_expense_title: 'تسجيل مصروف إداري جديد',
    expense_category: 'تصنيف المصروف',
    expense_details: 'البيان/الوصف (التفاصيل)',
    record_expense: 'تسجيل المصروف',
    delete_expense_confirm: 'هل أنت متأكد من حذف هذا المصروف؟',
    
    // Categories
    cat_salaries: 'رواتب وأجور',
    cat_rent: 'إيجار المكتب',
    cat_utilities: 'كهرباء وماء',
    cat_internet: 'انترنت واتصالات',
    cat_hospitality: 'بوفيه وضيافة (نثرية)',
    cat_transport: 'نقل ومواصلات',
    cat_marketing: 'تسويق وإعلان',
    cat_other: 'أخرى',

    // Settings
    agency_settings: 'إعدادات الوكالة',
    staff_management: 'إدارة الموظفين',
    add_staff: 'إضافة موظف',
    pin_code: 'الرمز السري',
    
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
    cashier: 'Trésorerie',
    expenses: 'Dépenses',
    suppliers: 'Fournisseurs',
    settings: 'Paramètres',
    logout: 'Déconnexion',

    // Common
    search: 'Rechercher...',
    filter: 'Filtrer',
    add: 'Ajouter',
    edit: 'Modifier',
    delete: 'Supprimer',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    save: 'Enregistrer',
    save_changes: 'Enregistrer les modifications',
    amount: 'Montant',
    currency: 'MRU',
    description: 'Description',
    category_desc: 'Description / Catégorie',
    payment_method: 'Méthode de Paiement',
    date: 'Date',
    status: 'Statut',
    name: 'Nom',
    phone: 'Téléphone',
    email: 'Email',
    balance: 'Solde',
    total: 'Total',
    action: 'Action',

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

    // Transactions
    financial_summary: 'Résumé Financier (Tout le temps)',
    add_transaction: 'Ajouter une transaction',
    internal_transfer: 'Transfert interne',
    income: 'Recette / Revenu',
    expense: 'Dépense',
    operating_expense: 'Dépense d\'exploitation',
    operating_expense_short: 'Dép. exploitation',
    all_transactions: 'Toutes les transactions',
    from_account: 'Du compte',
    to_account: 'Vers le compte',
    execute_transfer: 'Exécuter le transfert',
    transfer_amount: 'Montant (MRU)',
    transaction_type: 'Type de transaction',
    transaction_income: 'Recettes (Bon d\'encaissement)',
    transaction_expense: 'Paiements (Bon de décaissement)',
    payment_receipt_method: 'Méthode de Paiement/Encaissement',
    transaction_desc_placeholder: 'Ex: Acompte pour billet aller simple',
    linked_supplier_optional: 'Lié à un fournisseur (Optionnel)',
    no_supplier: 'Aucun fournisseur...',
    linked_booking_optional: 'Lié à une réservation (Optionnel)',
    no_booking: 'Aucune réservation...',
    save_transaction: 'Enregistrer la transaction',
    delete_transaction_confirm: 'Êtes-vous sûr de vouloir supprimer la transaction',
    delete_transaction_warning: 'Cette action est irréversible. Elle peut affecter les comptes des clients et fournisseurs.',
    transfer_desc_optional: 'Description (Optionnel)',
    transfer_desc_placeholder: 'Ex: Dépôt en espèces à la banque',
    date_col: 'Date',
    type_col: 'Type',
    amount_col: 'Montant',
    method_col: 'Méthode de paiement',
    desc_col: 'Description',
    booking_col: 'Lié à une réservation',
    no_financial_transactions: 'Aucune transaction financière',
    edit_transaction_title: 'Modifier la transaction financière',
    add_transaction_title: 'Ajouter une transaction financière',

    // Bookings
    add_booking: 'Nouvelle Réservation',
    type: 'Type',
    flight: 'Vol',
    hotel: 'Hôtel',
    tour: 'Tour',
    passport: 'Passeport',

    // Customers & Suppliers
    customer_list: 'Liste des Clients',
    add_customer: 'Ajouter Client',
    supplier_list: 'Liste des Fournisseurs',
    add_supplier: 'Ajouter Fournisseur',

    // Expenses
    expense_list: 'Registre des Dépenses',
    total_operating_expenses: 'Total Dépenses d\'Exploitation',
    deducted_from_profits: 'Déduit automatiquement des bénéfices nets',
    search_expenses: 'Rechercher dans les dépenses...',
    new_operating_expense: 'Nouveau bon de dépense (Admin)',
    no_operating_expenses: 'Aucune dépense administrative',
    edit_expense: 'Modifier la dépense',
    delete_expense: 'Supprimer la dépense',
    edit_operating_expense_title: 'Modifier la dépense administrative',
    new_operating_expense_title: 'Enregistrer une nouvelle dépense',
    expense_category: 'Catégorie de dépense',
    expense_details: 'Description / Détails',
    record_expense: 'Enregistrer la dépense',
    delete_expense_confirm: 'Êtes-vous sûr de vouloir supprimer cette dépense ?',
    
    // Categories
    cat_salaries: 'Salaires et rames',
    cat_rent: 'Loyer de bureau',
    cat_utilities: 'Électricité et Eau',
    cat_internet: 'Internet et Communications',
    cat_hospitality: 'Buffet et Accueil (Divers)',
    cat_transport: 'Transport',
    cat_marketing: 'Marketing et Publicité',
    cat_other: 'Autre',

    // Settings
    agency_settings: 'Paramètres de l\'Agence',
    staff_management: 'Gestion du Personnel',
    add_staff: 'Ajouter Personnel',
    pin_code: 'Code PIN',

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

export function translateCategory(text: string, lang: 'ar' | 'fr') {
  if (lang === 'ar') return text;
  
  const categoryMap: Record<string, string> = {
    'رواتب وأجور': translations.fr.cat_salaries,
    'إيجار المكتب': translations.fr.cat_rent,
    'إيجار': translations.fr.cat_rent,
    'كهرباء وماء': translations.fr.cat_utilities,
    'انترنت واتصالات': translations.fr.cat_internet,
    'بوفيه وضيافة (نثرية)': translations.fr.cat_hospitality,
    'بوفيه وضيافة': translations.fr.cat_hospitality,
    'نقل ومواصلات': translations.fr.cat_transport,
    'تسويق وإعلان': translations.fr.cat_marketing,
    'أخرى': translations.fr.cat_other,
  };

  let translatedText = text;
  Object.entries(categoryMap).forEach(([ar, fr]) => {
    // Replace both the standalone category and also inside brackets e.g. [إيجار المكتب]
    translatedText = translatedText.replace(new RegExp(`\\[${ar}\\]`, 'g'), `[${fr}]`);
    // Also replace without brackets just in case
    // translatedText = translatedText.replace(new RegExp(ar, 'g'), fr);
  });

  return translatedText;
}
