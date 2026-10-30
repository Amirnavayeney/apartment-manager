window.initialData = {
  columns: [
    { id: 'col_old', label: 'بدهی قبلی', type: 'fixed' },
    { id: 'col_def', label: 'شارژ معوق', type: 'fixed' },
    { id: 'col_cost', label: 'هزینه‌ها', type: 'fixed' },
    { id: 'col_sewage', label: 'فاضلاب', type: 'fixed' },
    { id: 'col_aban', label: 'آبان ۱۴۰۵', type: 'month' }
  ],
  people: [
    { id: 'p_bayan', name: 'بیان' },
    { id: 'p_amir', name: 'امیر' },
    { id: 'p_bigdeli', name: 'بیگدلی' },
    { id: 'p_akam', name: 'آکام' },
    { id: 'p_moradi', name: 'خانم مرادی' },
    { id: 'p_armand', name: 'علیرضا آرمند' },
    { id: 'p_shahnaz', name: 'شهناز رسولی' },
    { id: 'p_nasiri', name: 'محمد نصیری' },
    { id: 'p_masoudi', name: 'مهدی مسعودی' },
    { id: 'p_bameri', name: 'محمد بامری' },
    { id: 'p_siamak', name: 'سیامک محمدی' },
    { id: 'p_bektash', name: 'سعید بکتاش' },
    { id: 'p_abubakr', name: 'ابوبکر رسولی' },
    { id: 'p_omid', name: 'امید سوزه' },
    { id: 'p_zeynab', name: 'زینب رسول‌پور' },
    { id: 'p_jafar', name: 'جعفر رسولی' }
  ],
  amounts: {
    'p_akam:col_def': 700000, 'p_akam:col_cost': 950000, 'p_akam:col_sewage': 630000, 'p_akam:col_aban': 500000,
    'p_moradi:col_cost': 100000, 'p_moradi:col_sewage': 630000, 'p_moradi:col_aban': 500000,
    'p_armand:col_def': 1750000, 'p_armand:col_cost': 950000, 'p_armand:col_sewage': 630000, 'p_armand:col_aban': 500000,
    'p_shahnaz:col_cost': 950000, 'p_shahnaz:col_sewage': 630000, 'p_shahnaz:col_aban': 500000,
    'p_masoudi:col_old': 500000, 'p_masoudi:col_sewage': 630000, 'p_masoudi:col_aban': 500000,
    'p_abubakr:col_def': 700000, 'p_abubakr:col_cost': 950000, 'p_abubakr:col_sewage': 630000, 'p_abubakr:col_aban': 500000,
    'p_jafar:col_def': 350000, 'p_jafar:col_cost': 100000, 'p_jafar:col_sewage': 630000, 'p_jafar:col_aban': 500000,
    'p_zeynab:col_old': 3750000, 'p_zeynab:col_sewage': 630000, 'p_zeynab:col_aban': 500000
  },
  details: {
    'p_akam:col_def': 'شهریور + مهر (۲×۳۵۰)',
    'p_armand:col_def': 'خرداد تا مهر (۵×۳۵۰)',
    'p_abubakr:col_def': 'شهریور + مهر (۲×۳۵۰)',
    'p_jafar:col_def': 'فقط مهر (۱×۳۵۰)',
    'p_moradi:col_cost': 'فقط تخلیه چاه',
    'p_jafar:col_cost': 'فقط تخلیه چاه',
    'p_akam:col_cost': '۷۵۰ + ۱۰۰ چاه + ۱۰۰ آسانسور',
    'p_armand:col_cost': '۷۵۰ + ۱۰۰ چاه + ۱۰۰ آسانسور',
    'p_shahnaz:col_cost': '۷۵۰ + ۱۰۰ چاه + ۱۰۰ آسانسور',
    'p_abubakr:col_cost': '۷۵۰ + ۱۰۰ چاه + ۱۰۰ آسانسور',
    'p_masoudi:col_old': 'از حساب قبلی',
    'p_zeynab:col_old': 'فروردین تا مهر (پرداخت شد)'
  },
  paid: {
    'p_zeynab:col_old': true
  }
};