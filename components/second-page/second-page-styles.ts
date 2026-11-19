import { StyleSheet } from "react-native";

const CATEGORY_GAP = 10;

export const styles = StyleSheet.create({
  // Samma tre personer som på startsidan, som mycket svag vattenstämpel.
  // pointerEvents="none" gör att den aldrig blockerar tryck eller scrollning.
  watermarkLayer: {
    position: "absolute",
    top: "24%",
    left: 0,
    right: 0,
    height: 240,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.055,
  },
  watermarkScale: {
    width: 106,
    height: 83,
    transform: [{ scale: 2.8 }],
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 106,
    height: 90,
    alignSelf: "center",
    marginBottom: 34,
    position: "relative",
    transform: [{ scale: 1.6 }],
  },
  logoPerson: {
    position: "absolute",
    top: 12,
    width: 38,
    height: 55,
    alignItems: "center",
  },
  logoSideLeft: { left: 2 },
  logoSideRight: { right: 2 },
  logoSideHead: {
    width: 21,
    height: 21,
    borderRadius: 11,
    backgroundColor: "#91B7DA",
  },
  logoSideBody: {
    width: 35,
    height: 29,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#91B7DA",
    marginTop: 3,
  },
  logoCenter: {
    position: "absolute",
    top: 0,
    left: 29,
    width: 48,
    height: 70,
    alignItems: "center",
  },
  logoCenterHead: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#234C7A",
    zIndex: 2,
  },
  logoCenterBody: {
    position: "absolute",
    top: 27,
    width: 48,
    height: 41,
    borderTopLeftRadius: 23,
    borderTopRightRadius: 23,
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    backgroundColor: "#234C7A",
  },
  logoStrapLeft: {
    position: "absolute",
    top: 28,
    left: 16,
    width: 3,
    height: 24,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "-28deg" }],
    zIndex: 3,
  },
  logoStrapRight: {
    position: "absolute",
    top: 28,
    right: 16,
    width: 3,
    height: 24,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "28deg" }],
    zIndex: 3,
  },
  logoBadge: {
    position: "absolute",
    top: 43,
    width: 53,
    height: 19,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 4,
  },
  logoBadgeText: { fontSize: 8, fontWeight: "700", color: "#234C7A" },
  logoBadgeTail: {
    position: "absolute",
    bottom: -3,
    left: 10,
    width: 7,
    height: 7,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
  },

  container: {
    flex: 1,
    backgroundColor: "#EAF3FA",
  },

  scrollView: {
    flex: 1,
    zIndex: 1,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 28,
  },
  bottomActionBar: {
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 12,
    zIndex: 2,
  },
  bottomAddButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DCECF8",
    borderWidth: 1,
    borderColor: "#DCEBF7",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomAddText: {
    fontSize: 28,
    lineHeight: 32,
    fontWeight: "500",
    color: "#285F9D",
  },
  addMenuCard: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 24,
  },
  addMenuOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#F7FAFD",
    borderRadius: 12,
  },
  addMenuOptionText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#203B59",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  languagePair: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },

  languagePairText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#304C69",
  },

  languagePairArrow: {
    fontSize: 16,
    color: "#8299AF",
    marginHorizontal: 10,
  },

  searchHint: {
    fontSize: 13,
    color: "#8299AF",
    marginTop: 8,
    marginLeft: 4,
  },

  searchResults: {
    marginTop: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  searchRow: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
  },

  searchTextContainer: {
    flex: 1,
  },

  searchWord: {
    fontSize: 15,
    fontWeight: "600",
    color: "#203B59",
  },

  searchTranslation: {
    fontSize: 14,
    color: "#71859B",
    marginTop: 3,
  },

  infoButton: {
    marginLeft: 12,
    padding: 8,
  },

  inlineInfoPopup: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F5F9FD",
    borderColor: "#C9DEEE",
    borderWidth: 1,
    borderRadius: 10,
  },

  inlineInfoScroll: {
    maxHeight: 130,
  },

  inlineInfoScrollContent: {
    paddingRight: 24,
  },

  informationLabel: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "600",
    color: "#304C69",
  },

  informationInput: {
    minHeight: 85,
  },

  informationBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "#71859B",
  },

  noResults: {
    fontSize: 14,
    color: "#8299AF",
    padding: 16,
  },

  moreResults: {
    fontSize: 12,
    color: "#8299AF",
    padding: 12,
    textAlign: "center",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 30,
    marginBottom: 14,
  },

  categoryHeaderTitle: {
    flexDirection: "row",
    alignItems: "center",
  },

  collapseButton: {
    marginLeft: 9,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#203B59",
  },

  carouselRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  carousel: {
    flex: 1,
  },

  carouselPage: {
    flexDirection: "row",
    gap: CATEGORY_GAP,
  },

  arrowButton: {
    width: 25,
    height: 58,
    alignItems: "center",
    justifyContent: "center",
  },

  arrowText: {
    fontSize: 29,
    color: "#475569",
    fontWeight: "300",
  },

  arrowTextDisabled: {
    fontSize: 29,
    color: "#CBD5E1",
    fontWeight: "300",
  },

  categoryCard: {
    minHeight: 64,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E9ED",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    shadowColor: "#597783",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 9,
    elevation: 2,
  },

  categoryText: {
    textAlign: "center",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#304C69",
  },

  featureCard: {
    minHeight: 76,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E3E9EA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    marginBottom: 10,
    shadowColor: "#597783",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 9,
    elevation: 2,
  },

  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "#E9F3FB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },

  featureText: {
    flex: 1,
  },

  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#203B59",
  },

  featureArrow: {
    fontSize: 26,
    fontWeight: "300",
    color: "#8299AF",
    marginLeft: 8,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.30)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  modalScroll: {
    width: "100%",
    flexGrow: 0,
    flexShrink: 1,
  },

  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  categoryModal: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 22,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 8,
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#203B59",
    marginBottom: 18,
  },

  languageLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#304C69",
    marginTop: 10,
    marginBottom: 5,
  },

  categoryHint: {
    fontSize: 12,
    color: "#8299AF",
    marginTop: 10,
    lineHeight: 17,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#F5F9FD",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: "#203B59",
    marginTop: 5,
    fontSize: 15,
  },

  categoryTitle: {
    marginTop: 20,
    marginBottom: 5,
    fontWeight: "700",
    color: "#203B59",
  },

  optionalText: {
    fontSize: 12,
    color: "#8299AF",
    marginBottom: 10,
  },

  categoryPickerButton: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#F5F9FD",
    borderRadius: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  categoryPickerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#285F9D",
  },
  categoryPickerPanel: {
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#FFFFFF",
  },
  categoryPickerScroll: {
    maxHeight: 210,
  },
  categoryPickerDone: {
    alignSelf: "flex-end",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryPickerDoneText: {
    fontWeight: "700",
    color: "#285F9D",
  },
  category: {
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 7,
  },

  selectedCategory: {
    borderWidth: 1.5,
    borderColor: "#285F9D",
    backgroundColor: "#E9F3FB",
    borderRadius: 12,
    padding: 11,
    marginBottom: 7,
  },

  categoryOptionText: {
    color: "#304C69",
    fontSize: 14,
  },

  selectedCategoryText: {
    color: "#285F9D",
    fontSize: 14,
    fontWeight: "600",
  },

  modalPrimaryButton: {
    width: 160,
    height: 46,
    alignSelf: "center",
    borderRadius: 12,
    backgroundColor: "#285F9D",
    borderWidth: 1,
    borderColor: "#285F9D",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },

  disabledButton: {
    opacity: 0.6,
  },

  modalPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  modalCancelButton: {
    width: 160,
    height: 46,
    alignSelf: "center",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DFE8F1",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  modalCancelText: {
    color: "#304C69",
    fontSize: 15,
    fontWeight: "600",
  },

  formError: {
    color: "#9A5B22",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 10,
  },
});
