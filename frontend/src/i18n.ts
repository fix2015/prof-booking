/**
 * Lightweight i18n utility — no external dependencies.
 * Supports en, pl, ro, uk, es locales. Add new keys to all objects.
 */

const translations = {
  en: {
    // Discover page
    "discover.title": "Discover Professionals",
    "discover.subtitle": "Browse and book top-rated specialists",
    "discover.search_placeholder": "Search by name…",
    "discover.filters": "Filters",
    "discover.filter.salon": "Salon / Provider",
    "discover.filter.service": "Service",
    "discover.filter.nationality": "Nationality",
    "discover.filter.min_experience": "Min. Experience",
    "discover.filter.all_salons": "All salons",
    "discover.filter.service_placeholder": "e.g. Manicure",
    "discover.filter.all_nationalities": "All nationalities",
    "discover.filter.experience_placeholder": "e.g. 3 years",
    "discover.filter.clear_all": "Clear all",
    "discover.filter.apply": "Apply",
    "discover.filter.independent": "Independent only",
    "discover.found": "{count} found",
    "discover.empty.title": "No professionals found",
    "discover.empty.subtitle": "Try adjusting your search or filters",
    "discover.empty.clear": "Clear filters",
    "discover.card.profile": "Profile",
    "discover.card.book": "Book",
    "discover.nav.find_salons": "Find Salons",
    "discover.nav.sign_in": "Sign in",

    // Booking management page
    "bookings.title": "My Bookings",
    "bookings.subtitle": "Look up your bookings using the phone number you booked with",
    "bookings.phone_label": "Phone Number",
    "bookings.phone_placeholder": "+1 (555) 000-0000",
    "bookings.lookup": "Look Up",
    "bookings.looking_up": "Looking up…",
    "bookings.no_bookings": "No bookings found for this phone number",
    "bookings.cancel": "Cancel Booking",
    "bookings.cancel.confirm": "Are you sure?",
    "bookings.cancel.reason_label": "Cancellation reason (optional)",
    "bookings.cancel.reason_placeholder": "e.g. Change of plans",
    "bookings.cancel.submit": "Confirm Cancellation",
    "bookings.cancel.cancelling": "Cancelling…",
    "bookings.cancel.back": "Back",
    "bookings.status.pending": "Pending",
    "bookings.status.confirmed": "Confirmed",
    "bookings.status.in_progress": "In Progress",
    "bookings.status.completed": "Completed",
    "bookings.status.cancelled": "Cancelled",
    "bookings.status.no_show": "No Show",
    "bookings.field.provider": "Salon",
    "bookings.field.service": "Service",
    "bookings.field.professional": "Professional",
    "bookings.field.date": "Date & Time",
    "bookings.field.price": "Price",
    "bookings.field.code": "Confirmation Code",
    "bookings.cancelled_reason": "Reason: {reason}",

    // Onboarding
    "onboarding.step": "Step {current} of {total}",
    "onboarding.next": "Next",
    "onboarding.back": "Back",
    "onboarding.finish": "Finish",

    // Common
    "common.search": "Search",
    "common.loading": "Loading…",
    "common.error": "Something went wrong",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "common.free": "Free",

    // Login
    "login.title": "Service Platform",
    "login.sign_in": "Sign In",
    "login.email": "Email",
    "login.password": "Password",
    "login.book_appointment": "Book an Appointment",
    "login.invalid_credentials": "Invalid email or password",

    // Register (owner)
    "register.title": "Register Your Business",
    "register.email": "Email",
    "register.phone": "Phone",
    "register.password": "Password",
    "register.business_name": "Business Name",
    "register.address": "Address",
    "register.submit": "Create Account",
    "register.sign_in": "Sign In",

    // Register (professional)
    "register.pro.title": "Join as a Professional",
    "register.pro.name": "Full Name",
    "register.pro.email": "Email",
    "register.pro.phone": "Phone",
    "register.pro.password": "Password",
    "register.pro.submit": "Create Account",

    // Navigation / Sidebar
    "nav.dashboard": "Dashboard",
    "nav.calendar": "Calendar",
    "nav.sessions": "Sessions",
    "nav.clients": "Clients",
    "nav.professionals": "Professionals",
    "nav.services": "Services",
    "nav.reports": "Reports",
    "nav.notifications": "Notifications",
    "nav.reviews": "Reviews",
    "nav.analytics": "Analytics",
    "nav.invoices": "Invoices",
    "nav.admin": "Admin Panel",
    "nav.profile": "My Profile",
    "nav.sign_out": "Sign Out",
    "nav.find_providers": "Find Providers",

    // Providers page (/providers)
    "providers.title": "Find Your Provider",
    "providers.subtitle": "Discover service providers near you",
    "providers.search_placeholder": "Search by name or address…",
    "providers.search_nearby": "Search Nearby",
    "providers.professional_name": "Professional name…",
    "providers.nationality": "Professional nationality…",
    "providers.min_experience": "Min years experience",
    "providers.clear_all": "Clear all",
    "providers.no_providers": "No providers found",
    "providers.professionals": "Professionals",
    "providers.no_professionals": "No professionals found matching your filters",
    "providers.book_now": "Book Now →",
    "providers.view_profile": "View Profile",
    "providers.view": "split",
    "providers.map_unavailable": "Map unavailable",

    // Public booking
    "booking.title": "Book an Appointment",
    "booking.select_service": "Select Service",
    "booking.select_professional": "Select Professional",
    "booking.select_date": "Select Date & Time",
    "booking.your_details": "Your Details",
    "booking.name": "Your Name",
    "booking.phone": "Phone Number",
    "booking.notes": "Notes (optional)",
    "booking.submit": "Confirm Booking",
    "booking.success": "Booking Confirmed!",
    "booking.confirmation_code": "Your confirmation code",
    "booking.any_professional": "Any available professional",
    "booking.free": "Free",
    "booking.no_slots": "No available slots for this date",
    "booking.manage": "Manage My Bookings",

    // Sessions
    "sessions.title": "Sessions",
    "sessions.no_sessions": "No sessions found",
    "sessions.status.pending": "Pending",
    "sessions.status.confirmed": "Confirmed",
    "sessions.status.in_progress": "In Progress",
    "sessions.status.completed": "Completed",
    "sessions.status.cancelled": "Cancelled",
    "sessions.status.no_show": "No Show",

    // Professionals list (owner view)
    "masters.title": "Professionals",
    "masters.invite": "Invite Professional",
    "masters.no_professionals": "No professionals yet",
    "masters.status.pending": "Pending",
    "masters.status.approved": "Approved",
    "masters.status.rejected": "Rejected",

    // Services
    "services.title": "Services",
    "services.add": "Add Service",
    "services.no_services": "No services yet",
    "services.duration": "{min} min",
    "services.free": "Free",

    // Notifications
    "notifications.title": "Notifications",
    "notifications.empty": "No notifications yet",

    // Reviews
    "reviews.title": "Reviews",
    "reviews.empty": "No reviews yet",

    // Dashboard (owner)
    "dashboard.owner.welcome": "Welcome back",
    "dashboard.owner.total_sessions": "Total Sessions",
    "dashboard.owner.revenue": "Revenue",
    "dashboard.owner.professionals": "Professionals",

    // Dashboard (professional)
    "dashboard.pro.welcome": "Welcome back",
    "dashboard.pro.upcoming": "Upcoming Sessions",
    "dashboard.pro.completed": "Completed",

    // Calendar
    "calendar.title": "Calendar",
    "calendar.today": "Today",
    "calendar.no_sessions": "No sessions",

    // Reports
    "reports.title": "Reports",
    "reports.export": "Export",
    "reports.period": "Period",

    // Profile edit
    "profile.title": "Edit Profile",
    "profile.save": "Save Changes",
    "profile.bio": "Bio",
    "profile.experience": "Years of Experience",
    "profile.nationality": "Nationality",
    "profile.specializations": "Specializations",

    // Admin
    "admin.title": "Admin Panel",
    "admin.users": "Users",
    "admin.providers": "Providers",

    // Invoices
    "invoices.title": "Invoices",
    "invoices.empty": "No invoices yet",
    "invoices.download": "Download PDF",

    // Analytics
    "analytics.title": "Analytics",
    "analytics.revenue": "Revenue",
    "analytics.sessions": "Sessions",
    "analytics.period.week": "Week",
    "analytics.period.month": "Month",
    "analytics.period.year": "Year",
  },
  pl: {
    // Discover page
    "discover.title": "Odkryj Specjalistów",
    "discover.subtitle": "Przeglądaj i rezerwuj najlepszych specjalistów",
    "discover.search_placeholder": "Szukaj po imieniu…",
    "discover.filters": "Filtry",
    "discover.filter.salon": "Salon / Dostawca",
    "discover.filter.service": "Usługa",
    "discover.filter.nationality": "Narodowość",
    "discover.filter.min_experience": "Min. doświadczenie",
    "discover.filter.all_salons": "Wszystkie salony",
    "discover.filter.service_placeholder": "np. Manicure",
    "discover.filter.all_nationalities": "Wszystkie narodowości",
    "discover.filter.experience_placeholder": "np. 3 lata",
    "discover.filter.clear_all": "Wyczyść wszystko",
    "discover.filter.apply": "Zastosuj",
    "discover.filter.independent": "Tylko niezależni",
    "discover.found": "Znaleziono: {count}",
    "discover.empty.title": "Nie znaleziono specjalistów",
    "discover.empty.subtitle": "Spróbuj zmienić wyszukiwanie lub filtry",
    "discover.empty.clear": "Wyczyść filtry",
    "discover.card.profile": "Profil",
    "discover.card.book": "Zarezerwuj",
    "discover.nav.find_salons": "Znajdź salony",
    "discover.nav.sign_in": "Zaloguj się",

    // Booking management page
    "bookings.title": "Moje rezerwacje",
    "bookings.subtitle": "Znajdź swoje rezerwacje za pomocą numeru telefonu",
    "bookings.phone_label": "Numer telefonu",
    "bookings.phone_placeholder": "+48 (555) 000-000",
    "bookings.lookup": "Wyszukaj",
    "bookings.looking_up": "Wyszukiwanie…",
    "bookings.no_bookings": "Nie znaleziono rezerwacji dla tego numeru",
    "bookings.cancel": "Anuluj rezerwację",
    "bookings.cancel.confirm": "Jesteś pewny/a?",
    "bookings.cancel.reason_label": "Powód anulowania (opcjonalnie)",
    "bookings.cancel.reason_placeholder": "np. Zmiana planów",
    "bookings.cancel.submit": "Potwierdź anulowanie",
    "bookings.cancel.cancelling": "Anulowanie…",
    "bookings.cancel.back": "Wróć",
    "bookings.status.pending": "Oczekuje",
    "bookings.status.confirmed": "Potwierdzona",
    "bookings.status.in_progress": "W trakcie",
    "bookings.status.completed": "Zakończona",
    "bookings.status.cancelled": "Anulowana",
    "bookings.status.no_show": "Nieobecny",
    "bookings.field.provider": "Salon",
    "bookings.field.service": "Usługa",
    "bookings.field.professional": "Specjalista",
    "bookings.field.date": "Data i godzina",
    "bookings.field.price": "Cena",
    "bookings.field.code": "Kod potwierdzenia",
    "bookings.cancelled_reason": "Powód: {reason}",

    // Onboarding
    "onboarding.step": "Krok {current} z {total}",
    "onboarding.next": "Dalej",
    "onboarding.back": "Wróć",
    "onboarding.finish": "Zakończ",

    // Common
    "common.search": "Szukaj",
    "common.loading": "Ładowanie…",
    "common.error": "Coś poszło nie tak",
    "common.cancel": "Anuluj",
    "common.save": "Zapisz",
    "common.free": "Bezpłatnie",

    // Login
    "login.title": "Platforma Usług",
    "login.sign_in": "Zaloguj się",
    "login.email": "E-mail",
    "login.password": "Hasło",
    "login.book_appointment": "Umów wizytę",
    "login.invalid_credentials": "Nieprawidłowy e-mail lub hasło",

    // Register (owner)
    "register.title": "Zarejestruj swoją firmę",
    "register.email": "E-mail",
    "register.phone": "Telefon",
    "register.password": "Hasło",
    "register.business_name": "Nazwa firmy",
    "register.address": "Adres",
    "register.submit": "Utwórz konto",
    "register.sign_in": "Zaloguj się",

    // Register (professional)
    "register.pro.title": "Dołącz jako specjalista",
    "register.pro.name": "Imię i nazwisko",
    "register.pro.email": "E-mail",
    "register.pro.phone": "Telefon",
    "register.pro.password": "Hasło",
    "register.pro.submit": "Utwórz konto",

    // Navigation / Sidebar
    "nav.dashboard": "Panel główny",
    "nav.calendar": "Kalendarz",
    "nav.sessions": "Sesje",
    "nav.clients": "Klienci",
    "nav.professionals": "Specjaliści",
    "nav.services": "Usługi",
    "nav.reports": "Raporty",
    "nav.notifications": "Powiadomienia",
    "nav.reviews": "Recenzje",
    "nav.analytics": "Analityka",
    "nav.invoices": "Faktury",
    "nav.admin": "Panel admina",
    "nav.profile": "Mój profil",
    "nav.sign_out": "Wyloguj się",
    "nav.find_providers": "Znajdź dostawców",

    // Providers page
    "providers.title": "Znajdź dostawcę",
    "providers.subtitle": "Odkryj dostawców usług w pobliżu",
    "providers.search_placeholder": "Szukaj po nazwie lub adresie…",
    "providers.search_nearby": "Szukaj w pobliżu",
    "providers.professional_name": "Imię specjalisty…",
    "providers.nationality": "Narodowość specjalisty…",
    "providers.min_experience": "Min. lata doświadczenia",
    "providers.clear_all": "Wyczyść wszystko",
    "providers.no_providers": "Nie znaleziono dostawców",
    "providers.professionals": "Specjaliści",
    "providers.no_professionals": "Nie znaleziono specjalistów pasujących do filtrów",
    "providers.book_now": "Zarezerwuj →",
    "providers.view_profile": "Zobacz profil",
    "providers.view": "podział",
    "providers.map_unavailable": "Mapa niedostępna",

    // Public booking
    "booking.title": "Umów wizytę",
    "booking.select_service": "Wybierz usługę",
    "booking.select_professional": "Wybierz specjalistę",
    "booking.select_date": "Wybierz datę i godzinę",
    "booking.your_details": "Twoje dane",
    "booking.name": "Twoje imię",
    "booking.phone": "Numer telefonu",
    "booking.notes": "Uwagi (opcjonalnie)",
    "booking.submit": "Potwierdź rezerwację",
    "booking.success": "Rezerwacja potwierdzona!",
    "booking.confirmation_code": "Twój kod potwierdzenia",
    "booking.any_professional": "Dowolny dostępny specjalista",
    "booking.free": "Bezpłatnie",
    "booking.no_slots": "Brak dostępnych terminów na ten dzień",
    "booking.manage": "Zarządzaj rezerwacjami",

    // Sessions
    "sessions.title": "Sesje",
    "sessions.no_sessions": "Nie znaleziono sesji",
    "sessions.status.pending": "Oczekuje",
    "sessions.status.confirmed": "Potwierdzona",
    "sessions.status.in_progress": "W trakcie",
    "sessions.status.completed": "Zakończona",
    "sessions.status.cancelled": "Anulowana",
    "sessions.status.no_show": "Nieobecny",

    // Professionals list (owner view)
    "masters.title": "Specjaliści",
    "masters.invite": "Zaproś specjalistę",
    "masters.no_professionals": "Brak specjalistów",
    "masters.status.pending": "Oczekuje",
    "masters.status.approved": "Zatwierdzony",
    "masters.status.rejected": "Odrzucony",

    // Services
    "services.title": "Usługi",
    "services.add": "Dodaj usługę",
    "services.no_services": "Brak usług",
    "services.duration": "{min} min",
    "services.free": "Bezpłatnie",

    // Notifications
    "notifications.title": "Powiadomienia",
    "notifications.empty": "Brak powiadomień",

    // Reviews
    "reviews.title": "Recenzje",
    "reviews.empty": "Brak recenzji",

    // Dashboard (owner)
    "dashboard.owner.welcome": "Witaj ponownie",
    "dashboard.owner.total_sessions": "Łączna liczba sesji",
    "dashboard.owner.revenue": "Przychód",
    "dashboard.owner.professionals": "Specjaliści",

    // Dashboard (professional)
    "dashboard.pro.welcome": "Witaj ponownie",
    "dashboard.pro.upcoming": "Nadchodzące sesje",
    "dashboard.pro.completed": "Ukończone",

    // Calendar
    "calendar.title": "Kalendarz",
    "calendar.today": "Dziś",
    "calendar.no_sessions": "Brak sesji",

    // Reports
    "reports.title": "Raporty",
    "reports.export": "Eksportuj",
    "reports.period": "Okres",

    // Profile edit
    "profile.title": "Edytuj profil",
    "profile.save": "Zapisz zmiany",
    "profile.bio": "Bio",
    "profile.experience": "Lata doświadczenia",
    "profile.nationality": "Narodowość",
    "profile.specializations": "Specjalizacje",

    // Admin
    "admin.title": "Panel admina",
    "admin.users": "Użytkownicy",
    "admin.providers": "Dostawcy",

    // Invoices
    "invoices.title": "Faktury",
    "invoices.empty": "Brak faktur",
    "invoices.download": "Pobierz PDF",

    // Analytics
    "analytics.title": "Analityka",
    "analytics.revenue": "Przychód",
    "analytics.sessions": "Sesje",
    "analytics.period.week": "Tydzień",
    "analytics.period.month": "Miesiąc",
    "analytics.period.year": "Rok",
  },
  ro: {
    // Discover page
    "discover.title": "Descoperă Profesioniști",
    "discover.subtitle": "Răsfoiește și rezervă cei mai buni specialiști",
    "discover.search_placeholder": "Caută după nume…",
    "discover.filters": "Filtre",
    "discover.filter.salon": "Salon / Furnizor",
    "discover.filter.service": "Serviciu",
    "discover.filter.nationality": "Naționalitate",
    "discover.filter.min_experience": "Exp. minimă",
    "discover.filter.all_salons": "Toate saloanele",
    "discover.filter.service_placeholder": "ex. Manichiură",
    "discover.filter.all_nationalities": "Toate naționalitățile",
    "discover.filter.experience_placeholder": "ex. 3 ani",
    "discover.filter.clear_all": "Șterge tot",
    "discover.filter.apply": "Aplică",
    "discover.filter.independent": "Doar independenți",
    "discover.found": "{count} găsiți",
    "discover.empty.title": "Nu s-au găsit profesioniști",
    "discover.empty.subtitle": "Încearcă să ajustezi căutarea sau filtrele",
    "discover.empty.clear": "Șterge filtrele",
    "discover.card.profile": "Profil",
    "discover.card.book": "Rezervă",
    "discover.nav.find_salons": "Găsește saloane",
    "discover.nav.sign_in": "Autentifică-te",

    // Booking management page
    "bookings.title": "Rezervările mele",
    "bookings.subtitle": "Caută rezervările tale folosind numărul de telefon",
    "bookings.phone_label": "Număr de telefon",
    "bookings.phone_placeholder": "+40 (555) 000-000",
    "bookings.lookup": "Caută",
    "bookings.looking_up": "Se caută…",
    "bookings.no_bookings": "Nu s-au găsit rezervări pentru acest număr",
    "bookings.cancel": "Anulează rezervarea",
    "bookings.cancel.confirm": "Ești sigur/ă?",
    "bookings.cancel.reason_label": "Motiv anulare (opțional)",
    "bookings.cancel.reason_placeholder": "ex. S-au schimbat planurile",
    "bookings.cancel.submit": "Confirmă anularea",
    "bookings.cancel.cancelling": "Se anulează…",
    "bookings.cancel.back": "Înapoi",
    "bookings.status.pending": "În așteptare",
    "bookings.status.confirmed": "Confirmată",
    "bookings.status.in_progress": "În desfășurare",
    "bookings.status.completed": "Finalizată",
    "bookings.status.cancelled": "Anulată",
    "bookings.status.no_show": "Neprezentare",
    "bookings.field.provider": "Salon",
    "bookings.field.service": "Serviciu",
    "bookings.field.professional": "Profesionist",
    "bookings.field.date": "Dată și oră",
    "bookings.field.price": "Preț",
    "bookings.field.code": "Cod de confirmare",
    "bookings.cancelled_reason": "Motiv: {reason}",

    // Onboarding
    "onboarding.step": "Pasul {current} din {total}",
    "onboarding.next": "Înainte",
    "onboarding.back": "Înapoi",
    "onboarding.finish": "Finalizează",

    // Common
    "common.search": "Caută",
    "common.loading": "Se încarcă…",
    "common.error": "Ceva nu a mers bine",
    "common.cancel": "Anulează",
    "common.save": "Salvează",
    "common.free": "Gratuit",

    // Login
    "login.title": "Platformă de Servicii",
    "login.sign_in": "Autentifică-te",
    "login.email": "E-mail",
    "login.password": "Parolă",
    "login.book_appointment": "Rezervă o programare",
    "login.invalid_credentials": "E-mail sau parolă incorectă",

    // Register (owner)
    "register.title": "Înregistrează-ți afacerea",
    "register.email": "E-mail",
    "register.phone": "Telefon",
    "register.password": "Parolă",
    "register.business_name": "Numele afacerii",
    "register.address": "Adresă",
    "register.submit": "Creează cont",
    "register.sign_in": "Autentifică-te",

    // Register (professional)
    "register.pro.title": "Alătură-te ca Profesionist",
    "register.pro.name": "Nume complet",
    "register.pro.email": "E-mail",
    "register.pro.phone": "Telefon",
    "register.pro.password": "Parolă",
    "register.pro.submit": "Creează cont",

    // Navigation / Sidebar
    "nav.dashboard": "Panou principal",
    "nav.calendar": "Calendar",
    "nav.sessions": "Sesiuni",
    "nav.clients": "Clienți",
    "nav.professionals": "Profesioniști",
    "nav.services": "Servicii",
    "nav.reports": "Rapoarte",
    "nav.notifications": "Notificări",
    "nav.reviews": "Recenzii",
    "nav.analytics": "Analiză",
    "nav.invoices": "Facturi",
    "nav.admin": "Panou admin",
    "nav.profile": "Profilul meu",
    "nav.sign_out": "Deconectare",
    "nav.find_providers": "Găsește furnizori",

    // Providers page
    "providers.title": "Găsește un furnizor",
    "providers.subtitle": "Descoperă furnizori de servicii din apropiere",
    "providers.search_placeholder": "Caută după nume sau adresă…",
    "providers.search_nearby": "Caută în apropiere",
    "providers.professional_name": "Numele profesionistului…",
    "providers.nationality": "Naționalitatea profesionistului…",
    "providers.min_experience": "Ani minimi de experiență",
    "providers.clear_all": "Șterge tot",
    "providers.no_providers": "Nu s-au găsit furnizori",
    "providers.professionals": "Profesioniști",
    "providers.no_professionals": "Nu s-au găsit profesioniști corespunzători filtrelor",
    "providers.book_now": "Rezervă acum →",
    "providers.view_profile": "Vezi profilul",
    "providers.view": "împărțit",
    "providers.map_unavailable": "Harta indisponibilă",

    // Public booking
    "booking.title": "Rezervă o programare",
    "booking.select_service": "Selectează serviciul",
    "booking.select_professional": "Selectează profesionistul",
    "booking.select_date": "Selectează data și ora",
    "booking.your_details": "Datele tale",
    "booking.name": "Numele tău",
    "booking.phone": "Număr de telefon",
    "booking.notes": "Note (opțional)",
    "booking.submit": "Confirmă rezervarea",
    "booking.success": "Rezervare confirmată!",
    "booking.confirmation_code": "Codul tău de confirmare",
    "booking.any_professional": "Orice profesionist disponibil",
    "booking.free": "Gratuit",
    "booking.no_slots": "Nu există intervale disponibile pentru această dată",
    "booking.manage": "Gestionează rezervările",

    // Sessions
    "sessions.title": "Sesiuni",
    "sessions.no_sessions": "Nu s-au găsit sesiuni",
    "sessions.status.pending": "În așteptare",
    "sessions.status.confirmed": "Confirmată",
    "sessions.status.in_progress": "În desfășurare",
    "sessions.status.completed": "Finalizată",
    "sessions.status.cancelled": "Anulată",
    "sessions.status.no_show": "Neprezentare",

    // Professionals list (owner view)
    "masters.title": "Profesioniști",
    "masters.invite": "Invită un profesionist",
    "masters.no_professionals": "Nu există profesioniști încă",
    "masters.status.pending": "În așteptare",
    "masters.status.approved": "Aprobat",
    "masters.status.rejected": "Respins",

    // Services
    "services.title": "Servicii",
    "services.add": "Adaugă serviciu",
    "services.no_services": "Nu există servicii încă",
    "services.duration": "{min} min",
    "services.free": "Gratuit",

    // Notifications
    "notifications.title": "Notificări",
    "notifications.empty": "Nu există notificări încă",

    // Reviews
    "reviews.title": "Recenzii",
    "reviews.empty": "Nu există recenzii încă",

    // Dashboard (owner)
    "dashboard.owner.welcome": "Bine ai revenit",
    "dashboard.owner.total_sessions": "Total sesiuni",
    "dashboard.owner.revenue": "Venituri",
    "dashboard.owner.professionals": "Profesioniști",

    // Dashboard (professional)
    "dashboard.pro.welcome": "Bine ai revenit",
    "dashboard.pro.upcoming": "Sesiuni viitoare",
    "dashboard.pro.completed": "Finalizate",

    // Calendar
    "calendar.title": "Calendar",
    "calendar.today": "Azi",
    "calendar.no_sessions": "Nu există sesiuni",

    // Reports
    "reports.title": "Rapoarte",
    "reports.export": "Exportă",
    "reports.period": "Perioadă",

    // Profile edit
    "profile.title": "Editează profilul",
    "profile.save": "Salvează modificările",
    "profile.bio": "Bio",
    "profile.experience": "Ani de experiență",
    "profile.nationality": "Naționalitate",
    "profile.specializations": "Specializări",

    // Admin
    "admin.title": "Panou admin",
    "admin.users": "Utilizatori",
    "admin.providers": "Furnizori",

    // Invoices
    "invoices.title": "Facturi",
    "invoices.empty": "Nu există facturi încă",
    "invoices.download": "Descarcă PDF",

    // Analytics
    "analytics.title": "Analiză",
    "analytics.revenue": "Venituri",
    "analytics.sessions": "Sesiuni",
    "analytics.period.week": "Săptămână",
    "analytics.period.month": "Lună",
    "analytics.period.year": "An",
  },
  uk: {
    // Discover page
    "discover.title": "Знайдіть спеціалістів",
    "discover.subtitle": "Переглядайте та бронюйте найкращих майстрів",
    "discover.search_placeholder": "Пошук за іменем…",
    "discover.filters": "Фільтри",
    "discover.filter.salon": "Салон / Постачальник",
    "discover.filter.service": "Послуга",
    "discover.filter.nationality": "Національність",
    "discover.filter.min_experience": "Мін. досвід",
    "discover.filter.all_salons": "Усі салони",
    "discover.filter.service_placeholder": "напр. Манікюр",
    "discover.filter.all_nationalities": "Усі національності",
    "discover.filter.experience_placeholder": "напр. 3 роки",
    "discover.filter.clear_all": "Скинути все",
    "discover.filter.apply": "Застосувати",
    "discover.filter.independent": "Лише незалежні",
    "discover.found": "Знайдено: {count}",
    "discover.empty.title": "Спеціалістів не знайдено",
    "discover.empty.subtitle": "Спробуйте змінити запит або фільтри",
    "discover.empty.clear": "Скинути фільтри",
    "discover.card.profile": "Профіль",
    "discover.card.book": "Записатися",
    "discover.nav.find_salons": "Знайти салони",
    "discover.nav.sign_in": "Увійти",

    // Booking management page
    "bookings.title": "Мої записи",
    "bookings.subtitle": "Знайдіть свої записи за номером телефону",
    "bookings.phone_label": "Номер телефону",
    "bookings.phone_placeholder": "+38 (050) 000-0000",
    "bookings.lookup": "Знайти",
    "bookings.looking_up": "Пошук…",
    "bookings.no_bookings": "Записів для цього номера не знайдено",
    "bookings.cancel": "Скасувати запис",
    "bookings.cancel.confirm": "Ви впевнені?",
    "bookings.cancel.reason_label": "Причина скасування (необов'язково)",
    "bookings.cancel.reason_placeholder": "напр. Змінилися плани",
    "bookings.cancel.submit": "Підтвердити скасування",
    "bookings.cancel.cancelling": "Скасування…",
    "bookings.cancel.back": "Назад",
    "bookings.status.pending": "Очікує",
    "bookings.status.confirmed": "Підтверджено",
    "bookings.status.in_progress": "Виконується",
    "bookings.status.completed": "Завершено",
    "bookings.status.cancelled": "Скасовано",
    "bookings.status.no_show": "Не з'явився",
    "bookings.field.provider": "Салон",
    "bookings.field.service": "Послуга",
    "bookings.field.professional": "Спеціаліст",
    "bookings.field.date": "Дата та час",
    "bookings.field.price": "Ціна",
    "bookings.field.code": "Код підтвердження",
    "bookings.cancelled_reason": "Причина: {reason}",

    // Onboarding
    "onboarding.step": "Крок {current} з {total}",
    "onboarding.next": "Далі",
    "onboarding.back": "Назад",
    "onboarding.finish": "Завершити",

    // Common
    "common.search": "Пошук",
    "common.loading": "Завантаження…",
    "common.error": "Щось пішло не так",
    "common.cancel": "Скасувати",
    "common.save": "Зберегти",
    "common.free": "Безкоштовно",

    // Login
    "login.title": "Платформа послуг",
    "login.sign_in": "Увійти",
    "login.email": "Електронна пошта",
    "login.password": "Пароль",
    "login.book_appointment": "Записатися на прийом",
    "login.invalid_credentials": "Невірна пошта або пароль",

    // Register (owner)
    "register.title": "Зареєструйте свій бізнес",
    "register.email": "Електронна пошта",
    "register.phone": "Телефон",
    "register.password": "Пароль",
    "register.business_name": "Назва бізнесу",
    "register.address": "Адреса",
    "register.submit": "Створити акаунт",
    "register.sign_in": "Увійти",

    // Register (professional)
    "register.pro.title": "Приєднатися як спеціаліст",
    "register.pro.name": "Повне ім'я",
    "register.pro.email": "Електронна пошта",
    "register.pro.phone": "Телефон",
    "register.pro.password": "Пароль",
    "register.pro.submit": "Створити акаунт",

    // Navigation / Sidebar
    "nav.dashboard": "Панель керування",
    "nav.calendar": "Календар",
    "nav.sessions": "Сесії",
    "nav.clients": "Клієнти",
    "nav.professionals": "Спеціалісти",
    "nav.services": "Послуги",
    "nav.reports": "Звіти",
    "nav.notifications": "Сповіщення",
    "nav.reviews": "Відгуки",
    "nav.analytics": "Аналітика",
    "nav.invoices": "Рахунки",
    "nav.admin": "Панель адміна",
    "nav.profile": "Мій профіль",
    "nav.sign_out": "Вийти",
    "nav.find_providers": "Знайти постачальників",

    // Providers page
    "providers.title": "Знайдіть постачальника",
    "providers.subtitle": "Відкрийте для себе постачальників послуг поруч",
    "providers.search_placeholder": "Пошук за назвою або адресою…",
    "providers.search_nearby": "Шукати поруч",
    "providers.professional_name": "Ім'я спеціаліста…",
    "providers.nationality": "Національність спеціаліста…",
    "providers.min_experience": "Мін. роки досвіду",
    "providers.clear_all": "Скинути все",
    "providers.no_providers": "Постачальників не знайдено",
    "providers.professionals": "Спеціалісти",
    "providers.no_professionals": "Спеціалістів за вашими фільтрами не знайдено",
    "providers.book_now": "Записатися →",
    "providers.view_profile": "Переглянути профіль",
    "providers.view": "розділений",
    "providers.map_unavailable": "Карта недоступна",

    // Public booking
    "booking.title": "Записатися на прийом",
    "booking.select_service": "Оберіть послугу",
    "booking.select_professional": "Оберіть спеціаліста",
    "booking.select_date": "Оберіть дату та час",
    "booking.your_details": "Ваші дані",
    "booking.name": "Ваше ім'я",
    "booking.phone": "Номер телефону",
    "booking.notes": "Примітки (необов'язково)",
    "booking.submit": "Підтвердити запис",
    "booking.success": "Запис підтверджено!",
    "booking.confirmation_code": "Ваш код підтвердження",
    "booking.any_professional": "Будь-який доступний спеціаліст",
    "booking.free": "Безкоштовно",
    "booking.no_slots": "Немає доступних слотів на цю дату",
    "booking.manage": "Керувати записами",

    // Sessions
    "sessions.title": "Сесії",
    "sessions.no_sessions": "Сесій не знайдено",
    "sessions.status.pending": "Очікує",
    "sessions.status.confirmed": "Підтверджено",
    "sessions.status.in_progress": "Виконується",
    "sessions.status.completed": "Завершено",
    "sessions.status.cancelled": "Скасовано",
    "sessions.status.no_show": "Не з'явився",

    // Professionals list (owner view)
    "masters.title": "Спеціалісти",
    "masters.invite": "Запросити спеціаліста",
    "masters.no_professionals": "Спеціалістів ще немає",
    "masters.status.pending": "Очікує",
    "masters.status.approved": "Схвалено",
    "masters.status.rejected": "Відхилено",

    // Services
    "services.title": "Послуги",
    "services.add": "Додати послугу",
    "services.no_services": "Послуг ще немає",
    "services.duration": "{min} хв",
    "services.free": "Безкоштовно",

    // Notifications
    "notifications.title": "Сповіщення",
    "notifications.empty": "Сповіщень ще немає",

    // Reviews
    "reviews.title": "Відгуки",
    "reviews.empty": "Відгуків ще немає",

    // Dashboard (owner)
    "dashboard.owner.welcome": "Ласкаво просимо",
    "dashboard.owner.total_sessions": "Всього сесій",
    "dashboard.owner.revenue": "Дохід",
    "dashboard.owner.professionals": "Спеціалісти",

    // Dashboard (professional)
    "dashboard.pro.welcome": "Ласкаво просимо",
    "dashboard.pro.upcoming": "Майбутні сесії",
    "dashboard.pro.completed": "Завершено",

    // Calendar
    "calendar.title": "Календар",
    "calendar.today": "Сьогодні",
    "calendar.no_sessions": "Немає сесій",

    // Reports
    "reports.title": "Звіти",
    "reports.export": "Експортувати",
    "reports.period": "Період",

    // Profile edit
    "profile.title": "Редагувати профіль",
    "profile.save": "Зберегти зміни",
    "profile.bio": "Біографія",
    "profile.experience": "Роки досвіду",
    "profile.nationality": "Національність",
    "profile.specializations": "Спеціалізації",

    // Admin
    "admin.title": "Панель адміна",
    "admin.users": "Користувачі",
    "admin.providers": "Постачальники",

    // Invoices
    "invoices.title": "Рахунки",
    "invoices.empty": "Рахунків ще немає",
    "invoices.download": "Завантажити PDF",

    // Analytics
    "analytics.title": "Аналітика",
    "analytics.revenue": "Дохід",
    "analytics.sessions": "Сесії",
    "analytics.period.week": "Тиждень",
    "analytics.period.month": "Місяць",
    "analytics.period.year": "Рік",
  },
  es: {
    // Discover page
    "discover.title": "Descubrir Profesionales",
    "discover.subtitle": "Explora y reserva especialistas de primer nivel",
    "discover.search_placeholder": "Buscar por nombre…",
    "discover.filters": "Filtros",
    "discover.filter.salon": "Salón / Proveedor",
    "discover.filter.service": "Servicio",
    "discover.filter.nationality": "Nacionalidad",
    "discover.filter.min_experience": "Exp. mínima",
    "discover.filter.all_salons": "Todos los salones",
    "discover.filter.service_placeholder": "ej. Manicura",
    "discover.filter.all_nationalities": "Todas las nacionalidades",
    "discover.filter.experience_placeholder": "ej. 3 años",
    "discover.filter.clear_all": "Borrar todo",
    "discover.filter.apply": "Aplicar",
    "discover.filter.independent": "Solo independientes",
    "discover.found": "{count} encontrados",
    "discover.empty.title": "No se encontraron profesionales",
    "discover.empty.subtitle": "Intenta ajustar la búsqueda o los filtros",
    "discover.empty.clear": "Borrar filtros",
    "discover.card.profile": "Perfil",
    "discover.card.book": "Reservar",
    "discover.nav.find_salons": "Buscar salones",
    "discover.nav.sign_in": "Iniciar sesión",

    // Booking management page
    "bookings.title": "Mis reservas",
    "bookings.subtitle": "Consulta tus reservas usando el número de teléfono con el que reservaste",
    "bookings.phone_label": "Número de teléfono",
    "bookings.phone_placeholder": "+34 (555) 000-000",
    "bookings.lookup": "Buscar",
    "bookings.looking_up": "Buscando…",
    "bookings.no_bookings": "No se encontraron reservas para este número",
    "bookings.cancel": "Cancelar reserva",
    "bookings.cancel.confirm": "¿Estás seguro/a?",
    "bookings.cancel.reason_label": "Motivo de cancelación (opcional)",
    "bookings.cancel.reason_placeholder": "ej. Cambio de planes",
    "bookings.cancel.submit": "Confirmar cancelación",
    "bookings.cancel.cancelling": "Cancelando…",
    "bookings.cancel.back": "Volver",
    "bookings.status.pending": "Pendiente",
    "bookings.status.confirmed": "Confirmada",
    "bookings.status.in_progress": "En curso",
    "bookings.status.completed": "Completada",
    "bookings.status.cancelled": "Cancelada",
    "bookings.status.no_show": "No presentado",
    "bookings.field.provider": "Salón",
    "bookings.field.service": "Servicio",
    "bookings.field.professional": "Profesional",
    "bookings.field.date": "Fecha y hora",
    "bookings.field.price": "Precio",
    "bookings.field.code": "Código de confirmación",
    "bookings.cancelled_reason": "Motivo: {reason}",

    // Onboarding
    "onboarding.step": "Paso {current} de {total}",
    "onboarding.next": "Siguiente",
    "onboarding.back": "Atrás",
    "onboarding.finish": "Finalizar",

    // Common
    "common.search": "Buscar",
    "common.loading": "Cargando…",
    "common.error": "Algo salió mal",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "common.free": "Gratis",

    // Login
    "login.title": "Plataforma de Servicios",
    "login.sign_in": "Iniciar sesión",
    "login.email": "Correo electrónico",
    "login.password": "Contraseña",
    "login.book_appointment": "Reservar una cita",
    "login.invalid_credentials": "Correo o contraseña incorrectos",

    // Register (owner)
    "register.title": "Registra tu negocio",
    "register.email": "Correo electrónico",
    "register.phone": "Teléfono",
    "register.password": "Contraseña",
    "register.business_name": "Nombre del negocio",
    "register.address": "Dirección",
    "register.submit": "Crear cuenta",
    "register.sign_in": "Iniciar sesión",

    // Register (professional)
    "register.pro.title": "Únete como Profesional",
    "register.pro.name": "Nombre completo",
    "register.pro.email": "Correo electrónico",
    "register.pro.phone": "Teléfono",
    "register.pro.password": "Contraseña",
    "register.pro.submit": "Crear cuenta",

    // Navigation / Sidebar
    "nav.dashboard": "Panel principal",
    "nav.calendar": "Calendario",
    "nav.sessions": "Sesiones",
    "nav.clients": "Clientes",
    "nav.professionals": "Profesionales",
    "nav.services": "Servicios",
    "nav.reports": "Informes",
    "nav.notifications": "Notificaciones",
    "nav.reviews": "Reseñas",
    "nav.analytics": "Análisis",
    "nav.invoices": "Facturas",
    "nav.admin": "Panel de admin",
    "nav.profile": "Mi perfil",
    "nav.sign_out": "Cerrar sesión",
    "nav.find_providers": "Buscar proveedores",

    // Providers page
    "providers.title": "Encuentra tu proveedor",
    "providers.subtitle": "Descubre proveedores de servicios cerca de ti",
    "providers.search_placeholder": "Buscar por nombre o dirección…",
    "providers.search_nearby": "Buscar cerca",
    "providers.professional_name": "Nombre del profesional…",
    "providers.nationality": "Nacionalidad del profesional…",
    "providers.min_experience": "Años mínimos de experiencia",
    "providers.clear_all": "Borrar todo",
    "providers.no_providers": "No se encontraron proveedores",
    "providers.professionals": "Profesionales",
    "providers.no_professionals": "No se encontraron profesionales que coincidan con los filtros",
    "providers.book_now": "Reservar →",
    "providers.view_profile": "Ver perfil",
    "providers.view": "dividido",
    "providers.map_unavailable": "Mapa no disponible",

    // Public booking
    "booking.title": "Reservar una cita",
    "booking.select_service": "Seleccionar servicio",
    "booking.select_professional": "Seleccionar profesional",
    "booking.select_date": "Seleccionar fecha y hora",
    "booking.your_details": "Tus datos",
    "booking.name": "Tu nombre",
    "booking.phone": "Número de teléfono",
    "booking.notes": "Notas (opcional)",
    "booking.submit": "Confirmar reserva",
    "booking.success": "¡Reserva confirmada!",
    "booking.confirmation_code": "Tu código de confirmación",
    "booking.any_professional": "Cualquier profesional disponible",
    "booking.free": "Gratis",
    "booking.no_slots": "No hay horarios disponibles para esta fecha",
    "booking.manage": "Gestionar mis reservas",

    // Sessions
    "sessions.title": "Sesiones",
    "sessions.no_sessions": "No se encontraron sesiones",
    "sessions.status.pending": "Pendiente",
    "sessions.status.confirmed": "Confirmada",
    "sessions.status.in_progress": "En curso",
    "sessions.status.completed": "Completada",
    "sessions.status.cancelled": "Cancelada",
    "sessions.status.no_show": "No presentado",

    // Professionals list (owner view)
    "masters.title": "Profesionales",
    "masters.invite": "Invitar profesional",
    "masters.no_professionals": "No hay profesionales todavía",
    "masters.status.pending": "Pendiente",
    "masters.status.approved": "Aprobado",
    "masters.status.rejected": "Rechazado",

    // Services
    "services.title": "Servicios",
    "services.add": "Añadir servicio",
    "services.no_services": "No hay servicios todavía",
    "services.duration": "{min} min",
    "services.free": "Gratis",

    // Notifications
    "notifications.title": "Notificaciones",
    "notifications.empty": "No hay notificaciones todavía",

    // Reviews
    "reviews.title": "Reseñas",
    "reviews.empty": "No hay reseñas todavía",

    // Dashboard (owner)
    "dashboard.owner.welcome": "Bienvenido de nuevo",
    "dashboard.owner.total_sessions": "Total de sesiones",
    "dashboard.owner.revenue": "Ingresos",
    "dashboard.owner.professionals": "Profesionales",

    // Dashboard (professional)
    "dashboard.pro.welcome": "Bienvenido de nuevo",
    "dashboard.pro.upcoming": "Próximas sesiones",
    "dashboard.pro.completed": "Completadas",

    // Calendar
    "calendar.title": "Calendario",
    "calendar.today": "Hoy",
    "calendar.no_sessions": "Sin sesiones",

    // Reports
    "reports.title": "Informes",
    "reports.export": "Exportar",
    "reports.period": "Período",

    // Profile edit
    "profile.title": "Editar perfil",
    "profile.save": "Guardar cambios",
    "profile.bio": "Biografía",
    "profile.experience": "Años de experiencia",
    "profile.nationality": "Nacionalidad",
    "profile.specializations": "Especializaciones",

    // Admin
    "admin.title": "Panel de admin",
    "admin.users": "Usuarios",
    "admin.providers": "Proveedores",

    // Invoices
    "invoices.title": "Facturas",
    "invoices.empty": "No hay facturas todavía",
    "invoices.download": "Descargar PDF",

    // Analytics
    "analytics.title": "Análisis",
    "analytics.revenue": "Ingresos",
    "analytics.sessions": "Sesiones",
    "analytics.period.week": "Semana",
    "analytics.period.month": "Mes",
    "analytics.period.year": "Año",
  },
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

const VALID_LOCALES = new Set(Object.keys(translations) as Locale[]);
const COOKIE_KEY = "app_locale";

function readLocaleCookie(): Locale {
  const match = document.cookie.match(/(?:^|;\s*)app_locale=([^;]+)/);
  const val = match?.[1] as Locale | undefined;
  return val && VALID_LOCALES.has(val) ? val : "en";
}

function writeLocaleCookie(locale: Locale) {
  const maxAge = 60 * 60 * 24 * 365; // 1 year
  document.cookie = `${COOKIE_KEY}=${locale};max-age=${maxAge};path=/;SameSite=Lax`;
  // keep localStorage in sync for SSR/hydration compatibility
  localStorage.setItem(COOKIE_KEY, locale);
}

let currentLocale: Locale = readLocaleCookie();

export function setLocale(locale: Locale) {
  currentLocale = locale;
  writeLocaleCookie(locale);
}

export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Translate a key, replacing `{param}` placeholders with values.
 *
 * @example
 * t("discover.found", { count: 12 }) // "12 found"
 */
export function t(key: TranslationKey, params?: Record<string, string | number>): string {
  const dict = translations[currentLocale] as Record<string, string>;
  let str = dict[key] ?? (translations.en as Record<string, string>)[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, String(v));
    }
  }
  return str;
}
