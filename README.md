# Kravspecifikation: Tolkappen (Svenska ↔ Spanska)

> **Dokumenttyp:** Kravspecifikation och användarfall (Use Cases)

## Teknisk översikt

| Område | Specifikation |
|---------|---------------|
| **Utvecklingsplattform** | React Native (iOS & Android) |
| **Backend/Databas** | PostgreSQL |
| **Roll** | Mobilutvecklare (Examensarbete / Ersättning för praktikplats) |

---

# 1. Introduktion och syfte

Syftet med denna mobilapplikation är att fungera som ett professionellt digitalt hjälpmedel och en fickordbok för verksamma eller studerande tolkar i deras dagliga arbete, samt som ett stöd för andra personer i behov av språklig assistans mellan svenska och spanska.

Appen ska erbjuda:

- En snabb och överskådlig struktur
- Specifika fackkategorier (exempelvis juridik och sjukvård)
- En kraftfull global sökfunktion
- Snabb åtkomst till termer under tidspressade tolksituationer

---

# 2. Målgrupp & Teknisk plattform

## Primär målgrupp

- Yrkesverksamma tolkar
- Tolkstudenter

Målet är att erbjuda ett snabbt och pålitligt referensverktyg under tolkuppdrag.

## Sekundär målgrupp

- Handläggare inom myndigheter
- Studenter
- Privatpersoner som behöver språkligt stöd inom specifika fackområden

## Teknisk plattform

### Frontend

- **React Native**
- Gemensam kodbas för både iOS och Android (Cross-platform)

### Backend & Databas

- **PostgreSQL**
- Relationell databas för lagring av:
  - Ord
  - Översättningar
  - Definitioner
  - Kategorier

### Teknisk kommentar

Eftersom PostgreSQL är en serverbaserad databas kommer mobilappen att kommunicera med databasen via ett API (exempelvis Node.js + Express) över HTTPS.

För bättre prestanda kan data mellanlagras lokalt (cache) med exempelvis:

- SQLite
- AsyncStorage

Det möjliggör även framtida offline-stöd.

---

# 3. Funktionella krav

| Krav-ID | Funktion | Beskrivning |
|----------|----------|-------------|
| **F-01** | Kategorisering | Appen ska hämta och strukturera ord utifrån minst fyra fasta huvudkategorier från PostgreSQL: **Juridik**, **Sjukvård**, **Migration** och **Samhälle**. |
| **F-02** | Ordlistor (A–Ö) | Varje kategori ska innehålla en alfabetiskt sorterad lista över ord och begrepp. Sorteringen ska anpassas dynamiskt efter valt källspråk. |
| **F-03** | Global sökfunktion | Ett sökfält ska finnas tillgängligt på samtliga skärmar. Sökningen ska söka samtidigt i alla kategorier. |
| **F-04** | Ändring av språkriktning | Användaren ska kunna växla mellan **Svenska → Spanska** och **Spanska → Svenska** via en knapp eller switch i toppmenyn. |
| **F-05** | Databasintegration | Appen hämtar data via API kopplat till PostgreSQL. För bästa användarupplevelse bör data cachelagras lokalt för omedelbara sökningar. |

---

# 4. Användarfall (Use Cases)

---

## Use Case 1 – Global sökning under tolkuppdrag

### Aktör

Primär användare (Tolken)

### Mål

Att snabbt hitta översättning eller förklaring av ett ord, oavsett kategori.

### Huvudflöde

1. Användaren öppnar appen eller befinner sig på valfri skärm.
2. Användaren klickar på det globala sökfältet (`TextInput`).
3. Användaren skriver in ett ord.
4. Appen söker i databasen (eller filtrerar cachelagrad data).
5. Resultat visas direkt i realtid från samtliga kategorier.
6. Användaren väljer ett ord.
7. Appen öppnar ordets detaljvy.

---

## Use Case 2 – Bläddra i en kategori

### Aktör

- Tolk
- Person i behov av språkligt stöd

### Mål

Att studera eller leta efter relevanta termer inom ett specifikt ämnesområde.

### Huvudflöde

1. Användaren öppnar **HomeScreen**.
2. Användaren väljer en kategori (exempelvis **Sjukvård**).
3. Appen hämtar relevanta ord.
4. **CategoryScreen** öppnas.
5. Orden visas i en alfabetiskt sorterad `FlatList`.
6. Användaren bläddrar genom listan.

---

## Use Case 3 – Byta språkriktning under ett tolksamtal

### Aktör

Primär användare (Tolken)

### Mål

Att snabbt växla mellan svenska och spanska när samtalet ändrar riktning.

### Huvudflöde

1. Användaren befinner sig på startsidan eller i en kategori.
2. Språkindikatorn visas i toppmenyn.
3. Användaren trycker på språkknappen.
4. Appens interna state uppdateras (t.ex. `isSpanishToSwedish`).
5. Gränssnittet uppdateras.
6. Ordlistor och sökfunktion använder det nya källspråket direkt.

---

# 5. Förslag på gränssnitt och navigering

## Navigering

Använd:

- `@react-navigation/native`
- `StackNavigator`

för att hantera navigation mellan appens olika skärmar.

---

## HomeScreen

Startsidan innehåller:

- Globalt sökfält
- Språkväxlare (Switch/Button)
- Fyra huvudkategorier (`TouchableOpacity`)

### Kategorier

- ⚖️ Juridik
- 🏥 Sjukvård
- 🌍 Migration
- 🏛️ Samhälle

---

## CategoryScreen

Visar:

- Gemensam Header
  - Global sökning
  - Språkbyte
- `FlatList`
- Ord hämtade från PostgreSQL
- Alfabetisk sortering

---

## DetailScreen

Visar detaljer om valt ord:

- Ord på källspråket
- Översättning till målspråket
- Förklaring/definition
- Tillhörande kategori

---

# Sammanfattning

## Kärnfunktioner

- ✅ Svenska ↔ Spanska
- ✅ Fyra fackkategorier
- ✅ Global sökning
- ✅ Dynamiskt språkbyte
- ✅ PostgreSQL via API
- ✅ Lokal cache för snabb sökning
- ✅ React Native (iOS & Android)
```
