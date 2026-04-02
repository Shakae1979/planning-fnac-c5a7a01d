import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { fr, nl } from "date-fns/locale";

export type Lang = "fr" | "nl";

const translations = {
  // ========== Navigation / Sidebar ==========
  "nav.overview": { fr: "Vue d'ensemble", nl: "Overzicht" },
  "nav.schedule": { fr: "Plannings", nl: "Werkroosters" },
  "nav.recap": { fr: "Récap équipe", nl: "Teamoverzicht" },
  "nav.conges": { fr: "Congés", nl: "Verlof" },
  "nav.team": { fr: "Équipe & Comptes", nl: "Team & Accounts" },
  "nav.stores": { fr: "Magasins", nl: "Winkels" },
  "nav.logout": { fr: "Déconnexion", nl: "Afmelden" },
  "nav.collapse": { fr: "Réduire", nl: "Inklappen" },
  "nav.expand": { fr: "Agrandir", nl: "Uitklappen" },
  "nav.planning": { fr: "Planning", nl: "Planning" },
  "nav.myAccount": { fr: "Mon compte", nl: "Mijn account" },

  // ========== Account ==========
  "account.title": { fr: "Mon compte", nl: "Mijn account" },
  "account.changePassword": { fr: "Changer le mot de passe", nl: "Wachtwoord wijzigen" },
  "account.newPassword": { fr: "Nouveau mot de passe", nl: "Nieuw wachtwoord" },
  "account.confirmPassword": { fr: "Confirmer le mot de passe", nl: "Wachtwoord bevestigen" },
  "account.passwordTooShort": { fr: "Le mot de passe doit contenir au moins 6 caractères", nl: "Wachtwoord moet minstens 6 tekens bevatten" },
  "account.passwordMismatch": { fr: "Les mots de passe ne correspondent pas", nl: "Wachtwoorden komen niet overeen" },
  "account.passwordChanged": { fr: "Mot de passe modifié avec succès", nl: "Wachtwoord succesvol gewijzigd" },
  "account.save": { fr: "Enregistrer", nl: "Opslaan" },

  // ========== Header shortcuts ==========
  "header.teamDay": { fr: "Équipe du jour", nl: "Team van de dag" },
  "header.weekPlan": { fr: "Planning semaine", nl: "Weekplanning" },
  "header.myPlan": { fr: "Mon planning", nl: "Mijn planning" },
  "header.title": { fr: "Planning Fnac", nl: "Planning Fnac" },
  "header.mgmt": { fr: "Gestion des plannings", nl: "Roosterbeheer" },

  // ========== Days short ==========
  "day.short.lundi": { fr: "Lun", nl: "Ma" },
  "day.short.mardi": { fr: "Mar", nl: "Di" },
  "day.short.mercredi": { fr: "Mer", nl: "Wo" },
  "day.short.jeudi": { fr: "Jeu", nl: "Do" },
  "day.short.vendredi": { fr: "Ven", nl: "Vr" },
  "day.short.samedi": { fr: "Sam", nl: "Za" },
  "day.short.dimanche": { fr: "Dim", nl: "Zo" },

  // ========== Days long ==========
  "day.long.lundi": { fr: "Lundi", nl: "Maandag" },
  "day.long.mardi": { fr: "Mardi", nl: "Dinsdag" },
  "day.long.mercredi": { fr: "Mercredi", nl: "Woensdag" },
  "day.long.jeudi": { fr: "Jeudi", nl: "Donderdag" },
  "day.long.vendredi": { fr: "Vendredi", nl: "Vrijdag" },
  "day.long.samedi": { fr: "Samedi", nl: "Zaterdag" },
  "day.long.dimanche": { fr: "Dimanche", nl: "Zondag" },

  // ========== Days micro (calendar grid) ==========
  "day.micro.dim": { fr: "dim", nl: "zo" },
  "day.micro.lun": { fr: "lun", nl: "ma" },
  "day.micro.mar": { fr: "mar", nl: "di" },
  "day.micro.mer": { fr: "mer", nl: "wo" },
  "day.micro.jeu": { fr: "jeu", nl: "do" },
  "day.micro.ven": { fr: "ven", nl: "vr" },
  "day.micro.sam": { fr: "sam", nl: "za" },

  // ========== Months ==========
  "month.0": { fr: "Janvier", nl: "Januari" },
  "month.1": { fr: "Février", nl: "Februari" },
  "month.2": { fr: "Mars", nl: "Maart" },
  "month.3": { fr: "Avril", nl: "April" },
  "month.4": { fr: "Mai", nl: "Mei" },
  "month.5": { fr: "Juin", nl: "Juni" },
  "month.6": { fr: "Juillet", nl: "Juli" },
  "month.7": { fr: "Août", nl: "Augustus" },
  "month.8": { fr: "Septembre", nl: "September" },
  "month.9": { fr: "Octobre", nl: "Oktober" },
  "month.10": { fr: "Novembre", nl: "November" },
  "month.11": { fr: "Décembre", nl: "December" },

  // ========== Months short ==========
  "month.short.0": { fr: "janv", nl: "jan" },
  "month.short.1": { fr: "févr", nl: "feb" },
  "month.short.2": { fr: "mars", nl: "mrt" },
  "month.short.3": { fr: "avr", nl: "apr" },
  "month.short.4": { fr: "mai", nl: "mei" },
  "month.short.5": { fr: "juin", nl: "jun" },
  "month.short.6": { fr: "juil", nl: "jul" },
  "month.short.7": { fr: "août", nl: "aug" },
  "month.short.8": { fr: "sept", nl: "sep" },
  "month.short.9": { fr: "oct", nl: "okt" },
  "month.short.10": { fr: "nov", nl: "nov" },
  "month.short.11": { fr: "déc", nl: "dec" },

  // ========== Roles ==========
  "role.responsable": { fr: "Responsable", nl: "Verantwoordelijke" },
  "role.responsable.short": { fr: "Resp.", nl: "Verantw." },
  "role.responsable.plural": { fr: "Responsables", nl: "Verantwoordelijken" },
  "role.technique": { fr: "Technique", nl: "Techniek" },
  "role.technique.short": { fr: "Tech.", nl: "Tech." },
  "role.technique.plural": { fr: "Techniques", nl: "Technici" },
  "role.editorial": { fr: "Éditorial", nl: "Redactie" },
  "role.editorial.short": { fr: "Édit.", nl: "Red." },
  "role.editorial.plural": { fr: "Éditoriaux", nl: "Redactie" },
  "role.stock": { fr: "Stock", nl: "Stock" },
  "role.stock.short": { fr: "Stock", nl: "Stock" },
  "role.stock.plural": { fr: "Stocks", nl: "Stock" },
  "role.caisse": { fr: "Caisse", nl: "Kassa" },
  "role.caisse.short": { fr: "Caisse", nl: "Kassa" },
  "role.caisse.plural": { fr: "Caisses", nl: "Kassa's" },
  "role.stagiaire": { fr: "Stagiaire", nl: "Stagiair" },
  "role.stagiaire.short": { fr: "Stage", nl: "Stage" },
  "role.stagiaire.plural": { fr: "Stagiaires", nl: "Stagiairs" },

  // ========== Leave types ==========
  "leave.conge": { fr: "Congé payé", nl: "Betaald verlof" },
  "leave.conge.short": { fr: "CP", nl: "BV" },
  "leave.rtt": { fr: "Sans solde", nl: "Onbetaald" },
  "leave.rtt.short": { fr: "SS", nl: "OB" },
  "leave.maladie": { fr: "Maladie", nl: "Ziekte" },
  "leave.maladie.short": { fr: "MAL", nl: "ZIE" },
  "leave.formation": { fr: "Formation", nl: "Opleiding" },
  "leave.formation.short": { fr: "FORM", nl: "OPL" },
  "leave.autre": { fr: "Pas encodé", nl: "Niet ingevoerd" },
  "leave.divers": { fr: "Autre", nl: "Andere" },
  "leave.divers.short": { fr: "AUT", nl: "AND" },
  "leave.school": { fr: "Congé scolaire", nl: "Schoolvakantie" },
  "leave.school.fr": { fr: "Congé scol. FR", nl: "Schoolvak. FR" },
  "leave.school.nl": { fr: "Congé scol. NL", nl: "Schoolvak. NL" },

  // ========== Holidays ==========
  "holiday.nouvelAn": { fr: "Nouvel An", nl: "Nieuwjaar" },
  "holiday.paques": { fr: "Pâques", nl: "Pasen" },
  "holiday.lundiPaques": { fr: "Lundi de Pâques", nl: "Paasmaandag" },
  "holiday.feteTravail": { fr: "Fête du travail", nl: "Dag van de Arbeid" },
  "holiday.ascension": { fr: "Ascension", nl: "Hemelvaart" },
  "holiday.pentecote": { fr: "Pentecôte", nl: "Pinksteren" },
  "holiday.feteNationale": { fr: "Fête nationale", nl: "Nationale feestdag" },
  "holiday.assomption": { fr: "Assomption", nl: "Maria-Hemelvaart" },
  "holiday.toussaint": { fr: "Toussaint", nl: "Allerheiligen" },
  "holiday.armistice": { fr: "Armistice", nl: "Wapenstilstand" },
  "holiday.noel": { fr: "Noël", nl: "Kerstmis" },

  // ========== Common actions ==========
  "action.save": { fr: "Sauvegarder", nl: "Opslaan" },
  "action.saving": { fr: "Sauvegarde...", nl: "Opslaan..." },
  "action.cancel": { fr: "Annuler", nl: "Annuleren" },
  "action.delete": { fr: "Supprimer", nl: "Verwijderen" },
  "action.add": { fr: "Ajouter", nl: "Toevoegen" },
  "action.edit": { fr: "Modifier", nl: "Bewerken" },
  "action.validate": { fr: "Valider", nl: "Bevestigen" },
  "action.print": { fr: "Imprimer", nl: "Afdrukken" },
  "action.copy": { fr: "Copier", nl: "Kopiëren" },
  "action.paste": { fr: "Coller", nl: "Plakken" },
  "action.choose": { fr: "Choisir…", nl: "Kiezen…" },
  "action.change": { fr: "Changer", nl: "Wijzigen" },
  "action.close": { fr: "Fermer", nl: "Sluiten" },
  "action.deactivate": { fr: "Désactiver", nl: "Deactiveren" },
  "action.reactivate": { fr: "Réactiver", nl: "Heractiveren" },
  "action.deletePermanent": { fr: "Supprimer définitivement", nl: "Definitief verwijderen" },

  // ========== Login ==========
  "login.title": { fr: "Connexion au Planning", nl: "Aanmelden bij Planning" },
  "login.email": { fr: "Email", nl: "E-mail" },
  "login.password": { fr: "Mot de passe", nl: "Wachtwoord" },
  "login.submit": { fr: "Se connecter", nl: "Aanmelden" },
  "login.error": { fr: "Email ou mot de passe incorrect", nl: "Onjuist e-mailadres of wachtwoord" },

  // ========== Dashboard overview ==========
  "overview.activeEmployees": { fr: "Collaborateurs actifs", nl: "Actieve medewerkers" },
  "overview.weeksPlanned": { fr: "Semaines planifiées", nl: "Geplande weken" },
  "overview.diffs": { fr: "Écarts détectés", nl: "Afwijkingen gedetecteerd" },
  "overview.team": { fr: "Équipe", nl: "Team" },
  "overview.collaborator": { fr: "collaborateur", nl: "medewerker" },
  "overview.collaborators": { fr: "collaborateurs", nl: "medewerkers" },
  "overview.getStarted": { fr: "Pour commencer", nl: "Aan de slag" },
  "overview.getStartedText": {
    fr: "Allez dans <strong>Plannings</strong> pour créer et modifier les plannings semaine par semaine. Partagez ensuite les <strong>Liens vendeurs</strong> pour que chaque collaborateur puisse consulter son planning.",
    nl: "Ga naar <strong>Werkroosters</strong> om weekplanningen aan te maken en te wijzigen. Deel vervolgens de <strong>Medewerkerslinks</strong> zodat iedereen zijn planning kan raadplegen."
  },

  // ========== Schedule editor ==========
  "schedule.weekOf": { fr: "Semaine du", nl: "Week van" },
  "schedule.seller": { fr: "Vendeur", nl: "Verkoper" },
  "schedule.contract": { fr: "contrat", nl: "contract" },
  "schedule.total": { fr: "Total", nl: "Totaal" },
  "schedule.startEnd": { fr: "Début — Fin", nl: "Begin — Einde" },
  "schedule.notes": { fr: "Notes", nl: "Notities" },
  "schedule.loading": { fr: "Chargement...", nl: "Laden..." },
  "schedule.noEmployee": { fr: "Aucun employé trouvé.", nl: "Geen medewerkers gevonden." },
  "schedule.saveTemplate": { fr: "Sauver sem. type", nl: "Modelweek opslaan" },
  "schedule.saveTemplateA": { fr: "Sauver sem. A", nl: "Week A opslaan" },
  "schedule.saveTemplateB": { fr: "Sauver sem. B", nl: "Week B opslaan" },
  "schedule.applyTemplate": { fr: "Appliquer sem. type", nl: "Modelweek toepassen" },
  "schedule.applyTemplateA": { fr: "Appliquer sem. A", nl: "Week A toepassen" },
  "schedule.applyTemplateB": { fr: "Appliquer sem. B", nl: "Week B toepassen" },
  "schedule.copyPrevWeek": { fr: "Copier sem. précédente", nl: "Vorige week kopiëren" },
  "schedule.saved": { fr: "Planning sauvegardé !", nl: "Roosters opgeslagen!" },
  "schedule.templateApplied": { fr: "Semaine type appliquée !", nl: "Modelweek toegepast!" },
  "schedule.templateAApplied": { fr: "Semaine A appliquée !", nl: "Week A toegepast!" },
  "schedule.templateBApplied": { fr: "Semaine B appliquée !", nl: "Week B toegepast!" },
  "schedule.templateSaved": { fr: "Semaine type sauvegardée !", nl: "Modelweek opgeslagen!" },
  "schedule.templateASaved": { fr: "Semaine A sauvegardée !", nl: "Week A opgeslagen!" },
  "schedule.templateBSaved": { fr: "Semaine B sauvegardée !", nl: "Week B opgeslagen!" },
  "schedule.prevWeekCopied": { fr: "Semaine précédente copiée — vérifiez puis sauvegardez", nl: "Vorige week gekopieerd — controleer en sla op" },
  "schedule.noPrevWeek": { fr: "Aucun planning trouvé pour la semaine précédente", nl: "Geen planning gevonden voor de vorige week" },
  "schedule.exterior": { fr: "Extérieur", nl: "Extern" },
  "schedule.holiday": { fr: "Férié", nl: "Feestdag" },
  "schedule.rotation": { fr: "Roulement", nl: "Wisseldienst" },
  "schedule.breakNote": { fr: "Les heures affichées sont brutes. Le total soustrait 1h de pause par jour travaillé.", nl: "De getoonde uren zijn bruto. Het totaal trekt 1u pauze per gewerkte dag af." },

  // ========== Recap ==========
  "recap.contractHours": { fr: "Heures contrat", nl: "Contracturen" },
  "recap.plannedHours": { fr: "Heures planifiées", nl: "Geplande uren" },
  "recap.unplanned": { fr: "Non planifiés", nl: "Niet gepland" },
  "recap.coverage": { fr: "Couverture planning — Nombre de vendeurs par créneau", nl: "Uurrooster — Aantal verkopers per tijdslot" },
  "recap.categoryCoverage": { fr: "Couverture par catégorie — Présence par jour", nl: "Dekking per categorie — Aanwezigheid per dag" },
  "recap.perSeller": { fr: "Récapitulatif par vendeur", nl: "Overzicht per verkoper" },
  "recap.category": { fr: "Catégorie", nl: "Categorie" },
  "recap.contract": { fr: "Contrat", nl: "Contract" },
  "recap.planned": { fr: "Planifié", nl: "Gepland" },
  "recap.diff": { fr: "Écart", nl: "Verschil" },
  "recap.days": { fr: "Jours", nl: "Dagen" },
  "recap.status": { fr: "Statut", nl: "Status" },
  "recap.statusPlanned": { fr: "Planifié", nl: "Gepland" },
  "recap.statusUnplanned": { fr: "Non planifié", nl: "Niet gepland" },
  "recap.nobody": { fr: "Personne", nl: "Niemand" },
  "recap.missing": { fr: "Manque", nl: "Ontbreekt" },
  "recap.missingCategory": { fr: "Catégorie manquante", nl: "Ontbrekende categorie" },
  "recap.0seller": { fr: "0 vendeur", nl: "0 verkopers" },
  "recap.1seller": { fr: "1 vendeur", nl: "1 verkoper" },
  "recap.2_3sellers": { fr: "2-3 vendeurs", nl: "2-3 verkopers" },
  "recap.4sellers": { fr: "4+ vendeurs", nl: "4+ verkopers" },

  // ========== Conges calendar ==========
  "conges.addLeave": { fr: "Ajouter", nl: "Toevoegen" },
  "conges.seller": { fr: "Vendeur", nl: "Verkoper" },
  "conges.start": { fr: "Début", nl: "Begin" },
  "conges.end": { fr: "Fin", nl: "Einde" },
  "conges.type": { fr: "Type", nl: "Type" },
  "conges.added": { fr: "Congé ajouté !", nl: "Verlof toegevoegd!" },
  "conges.deleted": { fr: "Congé supprimé !", nl: "Verlof verwijderd!" },
  "conges.encodeLeave": { fr: "Encoder le congé", nl: "Verlof invoeren" },
  "conges.deleteLeave": { fr: "Supprimer ce congé ?", nl: "Dit verlof verwijderen?" },
  "conges.deleteConfirm": { fr: "Voulez-vous vraiment supprimer le congé", nl: "Wilt u het verlof echt verwijderen" },
  "conges.irreversible": { fr: "Cette action est irréversible.", nl: "Deze actie is onomkeerbaar." },
  "conges.leaveType": { fr: "Type de congé", nl: "Verloftype" },
  "conges.date": { fr: "Date", nl: "Datum" },
  "conges.dayLabel": { fr: "Jour", nl: "Dag" },

  // ========== Team & Accounts ==========
  "team.title": { fr: "Équipe & Comptes", nl: "Team & Accounts" },
  "team.addEmployee": { fr: "Ajouter un collaborateur", nl: "Medewerker toevoegen" },
  "team.name": { fr: "Prénom", nl: "Voornaam" },
  "team.lastName": { fr: "Nom", nl: "Achternaam" },
  "team.email": { fr: "Email", nl: "E-mail" },
  "team.contractHours": { fr: "Heures contrat", nl: "Contracturen" },
  "team.department": { fr: "Département", nl: "Afdeling" },
  "team.activeEmployees": { fr: "Collaborateurs actifs", nl: "Actieve medewerkers" },
  "team.inactive": { fr: "Inactifs", nl: "Inactief" },
  "team.noAccount": { fr: "Pas de compte", nl: "Geen account" },
  "team.createAccount": { fr: "Créer un compte", nl: "Account aanmaken" },
  "team.deleteAccount": { fr: "Suppr. compte", nl: "Account verw." },
  "team.resetPassword": { fr: "Réinit. mot de passe", nl: "Wachtwoord resetten" },
  "team.resetEmailSent": { fr: "Email de réinitialisation envoyé", nl: "Reset-e-mail verzonden" },
  "team.password": { fr: "Mot de passe", nl: "Wachtwoord" },
  "team.minChars": { fr: "Min. 6 caractères", nl: "Min. 6 tekens" },
  "team.accountRole": { fr: "Rôle", nl: "Rol" },
  "team.employeeAdded": { fr: "Collaborateur ajouté !", nl: "Medewerker toegevoegd!" },
  "team.employeeUpdated": { fr: "Mis à jour !", nl: "Bijgewerkt!" },
  "team.departmentUpdated": { fr: "Département mis à jour !", nl: "Afdeling bijgewerkt!" },
  "team.emailUpdated": { fr: "Email mis à jour !", nl: "E-mail bijgewerkt!" },
  "team.employeeDeleted": { fr: "Collaborateur supprimé !", nl: "Medewerker verwijderd!" },
  "team.accountCreated": { fr: "Compte créé !", nl: "Account aangemaakt!" },
  "team.accountDeleted": { fr: "Compte supprimé", nl: "Account verwijderd" },
  "team.deleteConfirm": { fr: "Cette action est irréversible. Toutes les données liées seront supprimées.", nl: "Deze actie is onomkeerbaar. Alle gerelateerde gegevens worden verwijderd." },
  "team.orphanAccounts": { fr: "Comptes sans collaborateur", nl: "Accounts zonder medewerker" },
  "team.orphanDesc": { fr: "Ces comptes ne sont liés à aucun collaborateur (email différent ou non renseigné).", nl: "Deze accounts zijn niet gekoppeld aan een medewerker (ander of ontbrekend e-mailadres)." },
  "team.deleteConfirmTitle": { fr: "Supprimer", nl: "Verwijderen" },
  "team.deleteConfirmDesc": { fr: "Cette action est irréversible. Toutes les données liées seront supprimées.", nl: "Deze actie is onomkeerbaar. Alle gerelateerde gegevens worden verwijderd." },
  "team.deleteAccountConfirm": { fr: "Supprimer ce compte d'accès ?", nl: "Dit toegangsaccount verwijderen?" },
  "team.notConnected": { fr: "Non connecté", nl: "Niet verbonden" },
  "team.serverError": { fr: "Erreur serveur", nl: "Serverfout" },
  "team.nameRequired": { fr: "Le nom est requis", nl: "Naam is verplicht" },
  "team.passwordMinChars": { fr: "Le mot de passe doit faire au moins 6 caractères", nl: "Het wachtwoord moet minstens 6 tekens bevatten" },
  "team.errorCreating": { fr: "Erreur lors de la création", nl: "Fout bij het aanmaken" },
  "team.firstName": { fr: "Prénom", nl: "Voornaam" },
  "team.create": { fr: "Créer", nl: "Aanmaken" },

  // ========== Access roles ==========
  "access.admin": { fr: "Admin", nl: "Admin" },
  "access.admin.desc": { fr: "Accès total, tous les magasins", nl: "Volledige toegang, alle winkels" },
  "access.editor": { fr: "Éditeur", nl: "Editor" },
  "access.editor.desc": { fr: "Gestion de son magasin uniquement", nl: "Alleen eigen winkelbeheer" },
  "access.user": { fr: "Utilisateur", nl: "Gebruiker" },
  "access.user.desc": { fr: "Lecture seule", nl: "Alleen lezen" },

  // ========== Stores ==========
  "store.title": { fr: "Gestion des magasins", nl: "Winkelbeheer" },
  "store.add": { fr: "Ajouter un magasin", nl: "Winkel toevoegen" },
  "store.name": { fr: "Nom", nl: "Naam" },
  "store.city": { fr: "Ville", nl: "Stad" },
  "store.stores": { fr: "Magasins", nl: "Winkels" },
  "store.created": { fr: "Magasin créé !", nl: "Winkel aangemaakt!" },
  "store.updated": { fr: "Magasin mis à jour !", nl: "Winkel bijgewerkt!" },
  "store.abWeeks": { fr: "Semaines A/B", nl: "Weken A/B" },
  "store.abWeeksDesc": { fr: "Alterner entre deux semaines types", nl: "Afwisselen tussen twee modelweken" },
  "store.deleted": { fr: "Magasin supprimé !", nl: "Winkel verwijderd!" },
  "store.nameAndCity": { fr: "Nom et ville requis", nl: "Naam en stad vereist" },
  "store.noStores": { fr: "Aucun magasin", nl: "Geen winkels" },

  // ========== Team day view ==========
  "teamDay.title": { fr: "Planning équipe du jour", nl: "Teamplanning van de dag" },
  "teamDay.subtitle": { fr: "Qui travaille aujourd'hui ?", nl: "Wie werkt er vandaag?" },
  "teamDay.present": { fr: "Présents", nl: "Aanwezig" },
  "teamDay.onLeave": { fr: "En congé", nl: "Met verlof" },
  "teamDay.rest": { fr: "Repos", nl: "Rust" },
  "teamDay.holidayRest": { fr: "Férié / Repos", nl: "Feestdag / Rust" },
  "teamDay.today": { fr: "Aujourd'hui", nl: "Vandaag" },
  "teamDay.uncovered": { fr: "Non couverts", nl: "Niet gedekt" },
  "teamDay.holidayBanner": { fr: "Jour férié", nl: "Feestdag" },
  "teamDay.employeeConcerned": { fr: "employé(s) concerné(s)", nl: "betrokken medewerker(s)" },
  "teamDay.hourlyGrid": { fr: "Grille planning", nl: "Uurrooster" },
  "teamDay.employee": { fr: "Employé", nl: "Medewerker" },

  // ========== Team week view ==========
  "teamWeek.title": { fr: "Planning équipe", nl: "Teamplanning" },
  "teamWeek.subtitle": { fr: "Vue complète de la semaine", nl: "Volledig weekoverzicht" },
  "teamWeek.seller": { fr: "Vendeur", nl: "Verkoper" },
  "teamWeek.total": { fr: "Total", nl: "Totaal" },
  "teamWeek.notes": { fr: "📝 Notes", nl: "📝 Notities" },
  "teamWeek.ferie": { fr: "Férié", nl: "Feestdag" },
  "teamWeek.exterior": { fr: "Extérieur", nl: "Extern" },
  "teamWeek.breakNote": { fr: "Les heures affichées sont brutes. Le total soustrait 1h de pause par jour travaillé.", nl: "De getoonde uren zijn bruto. Het totaal trekt 1u pauze per gewerkte dag af." },
  "teamWeek.markHoliday": { fr: "Jour marqué comme férié pour tous les employés", nl: "Dag gemarkeerd als feestdag voor alle medewerkers" },
  "teamWeek.markedHoliday": { fr: "Jour marqué comme férié !", nl: "Dag gemarkeerd als feestdag!" },

  // ========== Employee view ==========
  "empView.selectName": { fr: "Sélectionnez votre nom pour voir votre planning :", nl: "Selecteer uw naam om uw planning te bekijken:" },
  "empView.notFound": { fr: "Vendeur non trouvé", nl: "Verkoper niet gevonden" },
  "empView.notFoundDesc": { fr: "n'existe pas dans le système.", nl: "bestaat niet in het systeem." },
  "empView.chooseSeller": { fr: "Choisir un vendeur", nl: "Kies een verkoper" },
  "empView.thisWeek": { fr: "Cette semaine", nl: "Deze week" },
  "empView.4weeks": { fr: "4 semaines affichées", nl: "4 weken weergegeven" },
  "empView.schedules": { fr: "Planning :", nl: "Uren:" },
  "empView.net": { fr: "net", nl: "netto" },
  "empView.perWeek": { fr: "/ semaine", nl: "/ week" },

  // ========== Share links ==========
  "share.teamLinks": { fr: "Liens équipe", nl: "Teamlinks" },
  "share.dayLabel": { fr: "Planning équipe du jour", nl: "Teamplanning van de dag" },
  "share.dayDesc": { fr: "Qui travaille aujourd'hui ?", nl: "Wie werkt er vandaag?" },
  "share.weekLabel": { fr: "Planning semaine complet", nl: "Volledig weekplanning" },
  "share.weekDesc": { fr: "Vue Gantt de toute l'équipe sur la semaine", nl: "Gantt-weergave van het hele team over de week" },
  "share.directory": { fr: "Annuaire des liens", nl: "Linkenoverzicht" },
  "share.sellers": { fr: "vendeurs", nl: "verkopers" },
  "share.clickToCopy": { fr: "Cliquez sur une carte pour copier le lien du vendeur.", nl: "Klik op een kaart om de link van de verkoper te kopiëren." },
  "share.copyAll": { fr: "Copier tous les liens", nl: "Alle links kopiëren" },
  "share.copyLink": { fr: "Copier le lien", nl: "Link kopiëren" },
  "share.linkCopied": { fr: "Lien copié !", nl: "Link gekopieerd!" },
  "share.allCopied": { fr: "Tous les liens ont été copiés !", nl: "Alle links zijn gekopieerd!" },

  // ========== Employee sheet ==========
  "sheet.title": { fr: "Fiche collaborateur", nl: "Medewerkersblad" },
  "sheet.register": { fr: "Enregistrer", nl: "Opslaan" },
  "sheet.accessRole": { fr: "Rôle d'accès", nl: "Toegangsrol" },
  "sheet.noAccountYet": { fr: "Ce collaborateur n'a pas encore de compte d'accès. Créez-en un depuis la liste pour pouvoir gérer son rôle.", nl: "Deze medewerker heeft nog geen toegangsaccount. Maak er een aan vanuit de lijst om de rol te beheren." },
  "sheet.accessRoleUpdated": { fr: "Rôle d'accès mis à jour !", nl: "Toegangsrol bijgewerkt!" },
  "sheet.employeeUpdated": { fr: "Collaborateur mis à jour !", nl: "Medewerker bijgewerkt!" },

  // ========== User manager ==========
  "users.title": { fr: "Gestion des comptes", nl: "Accountbeheer" },
  "users.subtitle": { fr: "Créer et gérer les accès au planning", nl: "Toegang tot planning aanmaken en beheren" },
  "users.newAccount": { fr: "Nouveau compte", nl: "Nieuw account" },
  "users.createAccount": { fr: "Créer un compte", nl: "Account aanmaken" },
  "users.create": { fr: "Créer", nl: "Aanmaken" },
  "users.noUsers": { fr: "Aucun utilisateur trouvé", nl: "Geen gebruikers gevonden" },
  "users.administrator": { fr: "Administrateur", nl: "Beheerder" },
  "users.user": { fr: "Utilisateur", nl: "Gebruiker" },
  "users.createdOn": { fr: "Créé le", nl: "Aangemaakt op" },

  // ========== Copy/paste schedule ==========
  "copy.copied": { fr: "copiés", nl: "gekopieerd" },
  "copy.checkTargets": { fr: "Cochez les employés cibles", nl: "Selecteer de doelmedewerkers" },
  "copy.checkDays": { fr: "Cochez les jours cibles", nl: "Selecteer de doeldagen" },
  "copy.selected": { fr: "sélectionné(s)", nl: "geselecteerd" },
  "copy.pastedTo": { fr: "Planning collé sur", nl: "Roosters geplakt op" },
  "copy.employees": { fr: "employé(s)", nl: "medewerker(s)" },
  "copy.source": { fr: "(source)", nl: "(bron)" },
  "copy.pastedOn": { fr: "collé sur", nl: "geplakt op" },
  "copy.day": { fr: "jour(s)", nl: "dag(en)" },

  // ========== Misc ==========
  "misc.nameRequired": { fr: "Le nom est requis", nl: "Naam is verplicht" },
  "misc.allFieldsRequired": { fr: "Tous les champs sont requis", nl: "Alle velden zijn verplicht" },
  "misc.errorSaving": { fr: "Erreur lors de la sauvegarde", nl: "Fout bij het opslaan" },
  "misc.gridSaved": { fr: "Grille sauvegardée", nl: "Rooster opgeslagen" },
  "misc.dayOfWeek": { fr: "jour(s)", nl: "dag(en)" },
  "misc.from": { fr: "Du", nl: "Van" },
  "misc.to": { fr: "au", nl: "tot" },
  "misc.active": { fr: "Actif", nl: "Actief" },
  "misc.week": { fr: "Semaine", nl: "Week" },
  "misc.rest": { fr: "Repos", nl: "Rust" },
  "misc.nobody": { fr: "Personne", nl: "Niemand" },
  "misc.collaborator": { fr: "collaborateur", nl: "medewerker" },
  "misc.collaborators": { fr: "collaborateurs", nl: "medewerkers" },

  // ========== HourlyGrid ==========
  "hourlyGrid.title": { fr: "Grille planning", nl: "Uurrooster" },
  "hourlyGrid.employee": { fr: "Employé", nl: "Medewerker" },
  "hourlyGrid.saving": { fr: "Sauvegarde...", nl: "Opslaan..." },

  // ========== EmployeeView ==========
  "empView.myPlanning": { fr: "Mon Planning", nl: "Mijn Planning" },
  "empView.selectYourName": { fr: "Sélectionnez votre nom", nl: "Selecteer uw naam" },
  "empView.weeklyContract": { fr: "/ semaine", nl: "/ week" },
  "empView.contract": { fr: "Contrat", nl: "Contract" },

  // ========== Store delete confirm ==========
  "store.deleteConfirm": { fr: "Supprimer", nl: "Verwijderen" },
  "store.deleteTitle": { fr: "Supprimer ce magasin ?", nl: "Winkel verwijderen?" },
  "store.employeesDetached": { fr: "collaborateur(s). Ils seront détachés du magasin.", nl: "medewerker(s). Zij worden losgekoppeld van de winkel." },
  "store.irreversible": { fr: "Cette action est irréversible.", nl: "Deze actie is onomkeerbaar." },
  "store.managers": { fr: "Responsables", nl: "Verantwoordelijken" },
  "store.noManager": { fr: "Aucun responsable assigné", nl: "Geen verantwoordelijke toegewezen" },
  "store.addManager": { fr: "Ajouter un responsable", nl: "Verantwoordelijke toevoegen" },
  "store.createManager": { fr: "Créer un responsable", nl: "Verantwoordelijke aanmaken" },
  "store.createManagerEmail": { fr: "Email du responsable", nl: "E-mail verantwoordelijke" },
  "store.createManagerPassword": { fr: "Mot de passe", nl: "Wachtwoord" },
  "store.managerCreated": { fr: "Responsable créé et assigné au magasin !", nl: "Verantwoordelijke aangemaakt en toegewezen!" },
  "store.orCreateNew": { fr: "ou créer un nouveau compte", nl: "of een nieuw account aanmaken" },
  "store.assignExisting": { fr: "assigner un compte existant", nl: "bestaand account toewijzen" },
  "store.selectUser": { fr: "Sélectionner un utilisateur", nl: "Selecteer een gebruiker" },
  "store.managerAssigned": { fr: "Responsable assigné !", nl: "Verantwoordelijke toegewezen!" },
  "store.managerRemoved": { fr: "Responsable retiré !", nl: "Verantwoordelijke verwijderd!" },
  "store.storeManager": { fr: "Store Manager", nl: "Store Manager" },
  "store.setAsManager": { fr: "Définir comme Store Manager", nl: "Instellen als Store Manager" },
  "store.removeManager": { fr: "Retirer le rôle Store Manager", nl: "Store Manager rol verwijderen" },
  "store.managerSet": { fr: "Store Manager défini !", nl: "Store Manager ingesteld!" },

  // ========== Schedule misc ==========
  "schedule.markHoliday": { fr: "marqué comme jour férié", nl: "gemarkeerd als feestdag" },
  "schedule.unmarkHoliday": { fr: "n'est plus jour férié", nl: "is geen feestdag meer" },
  "schedule.errorSaving": { fr: "Erreur lors de la sauvegarde", nl: "Fout bij het opslaan" },
  "schedule.weekOfDate": { fr: "Semaine du", nl: "Week van" },
  "schedule.prevWeekCopiedFor": { fr: "Semaine précédente copiée pour", nl: "Vorige week gekopieerd voor" },
  "schedule.pastedOnEmployees": { fr: "Planning collé sur", nl: "Roosters geplakt op" },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  dateFnsLocale: typeof fr;
  formatDateLong: (date: Date) => string;
  formatDateMonth: (date: Date) => string;
  monthName: (index: number) => string;
  monthShort: (index: number) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("app-lang") as Lang) || "fr";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("app-lang", l);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry.fr;
  }, [lang]);

  const dateFnsLocale = lang === "nl" ? nl : fr;

  const formatDateLong = useCallback((date: Date): string => {
    const d = date.getDate();
    const locale = lang === "nl" ? "nl-BE" : "fr-BE";
    const m = date.toLocaleDateString(locale, { month: "long" });
    const y = date.getFullYear();
    return `${d} ${m} ${y}`;
  }, [lang]);

  const formatDateMonth = useCallback((date: Date): string => {
    const d = date.getDate();
    const locale = lang === "nl" ? "nl-BE" : "fr-BE";
    const m = date.toLocaleDateString(locale, { month: "long" });
    return `${d} ${m}`;
  }, [lang]);

  const monthName = useCallback((index: number): string => {
    return t(`month.${index}` as TranslationKey);
  }, [t]);

  const monthShort = useCallback((index: number): string => {
    return t(`month.short.${index}` as TranslationKey);
  }, [t]);

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dateFnsLocale, formatDateLong, formatDateMonth, monthName, monthShort }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/** Helper to get holidays map in current language */
export function getHolidays2026(t: (key: TranslationKey) => string): Record<string, string> {
  return {
    "2026-01-01": t("holiday.nouvelAn"),
    "2026-04-05": t("holiday.paques"),
    "2026-04-06": t("holiday.lundiPaques"),
    "2026-05-01": t("holiday.feteTravail"),
    "2026-05-14": t("holiday.ascension"),
    "2026-05-25": t("holiday.pentecote"),
    "2026-07-21": t("holiday.feteNationale"),
    "2026-08-15": t("holiday.assomption"),
    "2026-11-01": t("holiday.toussaint"),
    "2026-11-11": t("holiday.armistice"),
    "2026-12-25": t("holiday.noel"),
  };
}

/** Helper to get day names array for calendar grids (index 0 = dimanche) */
export function getDayNames(t: (key: TranslationKey) => string): string[] {
  return [
    t("day.micro.dim"),
    t("day.micro.lun"),
    t("day.micro.mar"),
    t("day.micro.mer"),
    t("day.micro.jeu"),
    t("day.micro.ven"),
    t("day.micro.sam"),
  ];
}
