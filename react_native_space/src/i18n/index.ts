const strings = {
  af: {
    appName: 'Plaasboek™',
    login: 'Teken In', register: 'Registreer', logout: 'Teken Uit',
    email: 'E-posadres', password: 'Wagwoord', name: 'Volle Naam', farmName: 'Plaasnaam',
    save: 'Stoor', cancel: 'Kanselleer', delete: 'Verwyder', edit: 'Wysig', add: 'Voeg By',
    loading: 'Laai...', error: 'Fout', success: 'Sukses',
    home: 'Tuis', journal: 'Joernaal', livestock: 'Vee', expenses: 'Uitgawes',
    workers: 'Werkers', sos: 'SOS', settings: 'Instellings', rainfall: 'Reënval',
    income: 'Inkomste', profit: 'Wins', thisMonth: 'Hierdie Maand',
    noRecords: 'Geen rekords nie', confirmDelete: 'Bevestig verwydering',
    sosActive: '🚨 SOS AKTIEF', sosStandDown: 'Staan Af', sosAcknowledge: 'Erken',
    dmArm: 'Aktiveer Dooie Man Skakelaar', dmDisarm: 'Deaktiveer',
    dmHeartbeat: 'Ek is Veilig', proRequired: 'Pro-intekening benodig',
    upgrade: 'Opgradeer na Pro', perMonth: '/maand',
  },
  en: {
    appName: 'Plaasboek™',
    login: 'Log In', register: 'Register', logout: 'Log Out',
    email: 'Email Address', password: 'Password', name: 'Full Name', farmName: 'Farm Name',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add',
    loading: 'Loading...', error: 'Error', success: 'Success',
    home: 'Home', journal: 'Journal', livestock: 'Livestock', expenses: 'Expenses',
    workers: 'Workers', sos: 'SOS', settings: 'Settings', rainfall: 'Rainfall',
    income: 'Income', profit: 'Profit', thisMonth: 'This Month',
    noRecords: 'No records found', confirmDelete: 'Confirm deletion',
    sosActive: '🚨 SOS ACTIVE', sosStandDown: 'Stand Down', sosAcknowledge: 'Acknowledge',
    dmArm: 'Arm Dead Man Switch', dmDisarm: 'Disarm',
    dmHeartbeat: 'I am Safe', proRequired: 'Pro subscription required',
    upgrade: 'Upgrade to Pro', perMonth: '/month',
  }
};

export type Lang = 'af' | 'en';
export const t = (lang: Lang, key: keyof typeof strings.af): string => strings[lang][key] || key;
export default strings;
