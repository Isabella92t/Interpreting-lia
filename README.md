# Requirements Specification: Interpreter App (Swedish ↔ Spanish)

> **Document Type:** Requirements Specification and Use Cases

## Technical Overview

| Area                     | Specification                                                 |
| ------------------------ | ------------------------------------------------------------- |
| **Development Platform** | React Native (iOS & Android)                                  |
| **Backend/Database**     | PostgreSQL                                                    |
| **Role**                 | Mobile Developer (Bachelor's Thesis / Internship Replacement) |

---

# 1. Introduction and Purpose

The purpose of this mobile application is to serve as a professional digital reference tool and pocket dictionary for professional and student interpreters in their daily work, as well as a language support tool for other users who need assistance between Swedish and Spanish.

The application will provide:

* A fast and intuitive interface
* Specialized domain categories (e.g., Legal and Healthcare)
* A powerful global search function
* Quick access to terminology during time-critical interpreting sessions

---

# 2. Target Audience & Technical Platform

## Primary Target Audience

* Professional interpreters
* Interpreter students

The goal is to provide a fast and reliable reference tool during interpreting assignments.

## Secondary Target Audience

* Government officials and case workers
* Students
* Individuals who need language support within specialized subject areas

## Technical Platform

### Frontend

* **React Native**
* Shared codebase for both iOS and Android (Cross-platform)

### Backend & Database

* **PostgreSQL**
* Relational database for storing:

  * Words
  * Translations
  * Definitions
  * Categories

### Technical Notes

Since PostgreSQL is a server-based database, the mobile application will communicate with the database through an API (for example, Node.js + Express) over HTTPS.

To improve performance, data may be cached locally using technologies such as:

* SQLite
* AsyncStorage

This also enables future offline support.

---

# 3. Functional Requirements

| Requirement ID | Function                     | Description                                                                                                                                                                 |
| -------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F-01**       | Categorization               | The application shall retrieve and organize terms into at least four predefined main categories from PostgreSQL: **Legal**, **Healthcare**, **Migration**, and **Society**. |
| **F-02**       | Alphabetical Word Lists      | Each category shall contain an alphabetically sorted list of words and terms. The sorting shall adapt dynamically according to the selected source language.                |
| **F-03**       | Global Search                | A search field shall be available on every screen. The search function shall search across all categories simultaneously.                                                   |
| **F-04**       | Language Direction Switching | The user shall be able to switch between **Swedish → Spanish** and **Spanish → Swedish** using a button or switch in the top navigation bar.                                |
| **F-05**       | Database Integration         | The application shall retrieve data through an API connected to PostgreSQL. To improve user experience, data should be cached locally for instant searches.                 |

---

# 4. Use Cases

---

## Use Case 1 – Global Search During an Interpreting Session

### Actor

Primary User (Interpreter)

### Goal

To quickly find the translation or definition of a word regardless of its category.

### Main Flow

1. The user opens the application or is already on any screen.
2. The user selects the global search field (`TextInput`).
3. The user enters a search term.
4. The application searches the database (or filters cached data).
5. Matching results are displayed instantly from all categories.
6. The user selects a word.
7. The application opens the word's detail view.

---

## Use Case 2 – Browse a Category

### Actor

* Interpreter
* User requiring language support

### Goal

To browse or study terminology within a specific subject area.

### Main Flow

1. The user opens the **HomeScreen**.
2. The user selects a category (for example, **Healthcare**).
3. The application retrieves the relevant terminology.
4. The **CategoryScreen** is displayed.
5. The terms are presented in an alphabetically sorted `FlatList`.
6. The user browses the list.

---

## Use Case 3 – Switch Language Direction During an Interpreting Session

### Actor

Primary User (Interpreter)

### Goal

To quickly switch between Swedish and Spanish when the direction of the conversation changes.

### Main Flow

1. The user is on the HomeScreen or a CategoryScreen.
2. The language indicator is displayed in the top navigation bar.
3. The user presses the language switch button.
4. The application's internal state is updated (e.g., `isSpanishToSwedish`).
5. The user interface is refreshed.
6. Word lists and the search function immediately use the newly selected source language.

---

# 5. Proposed User Interface and Navigation

## Navigation

Use:

* `@react-navigation/native`
* `StackNavigator`

to manage navigation between the application's screens.

---

## HomeScreen

The HomeScreen contains:

* Global search field
* Language switch (Switch/Button)
* Four main categories (`TouchableOpacity`)

### Categories

* ⚖️ Legal
* 🏥 Healthcare
* 🌍 Migration
* 🏛️ Society

---

## CategoryScreen

Displays:

* Shared Header

  * Global search
  * Language switch
* `FlatList`
* Terms retrieved from PostgreSQL
* Alphabetical sorting

---

## DetailScreen

Displays detailed information about the selected term:

* Source language term
* Translation into the target language
* Definition / explanation
* Associated category

---

# Summary

## Core Features

* ✅ Swedish ↔ Spanish
* ✅ Four specialized categories
* ✅ Global search
* ✅ Dynamic language switching
* ✅ PostgreSQL integration via API
* ✅ Local caching for fast searches
* ✅ React Native (iOS & Android)
