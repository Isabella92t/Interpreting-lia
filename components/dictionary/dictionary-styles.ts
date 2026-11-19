import { colors } from "@/constants/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  letterHeading: {
    color: "#648EB5",
    fontSize: 17,
    fontWeight: "700",
    paddingTop: 14,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#C8D9E6",
  },
  columnHeadings: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#C8D9E6",
  },
  columnHeading: {
    flex: 1,
    fontSize: 12,
    color: "#648EB5",
    fontWeight: "700",
  },
  columnActionsSpace: { width: 70 },
  actionsWithoutPencil: { width: 34 },
  infoSlot: { width: 24, alignItems: "center", justifyContent: "center" },
  editModeActive: { backgroundColor: "#E7F2FC", borderColor: "#B9D6EB" },
  watermarkLayer: {
    position: "absolute",
    top: "27%",
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
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
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
    backgroundColor: "#FAFBFC",
    paddingHorizontal: 22,
    paddingTop: 16,
  },

  search: {
    marginBottom: 16,
  },

  displayModeBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  displayModeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#F7FAFD",
  },
  displayModeLabel: {
    fontSize: 11,
    color: "#71859B",
  },
  sideTextRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  sideColumn: {
    flex: 1.08,
    minWidth: 0,
    paddingRight: 14,
  },
  sideColumnTranslation: {
    flex: 0.92,
    minWidth: 0,
    marginTop: 0,
    paddingLeft: 8,
    paddingRight: 4,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#203B59",
    marginBottom: 4,
    textAlign: "center",
  },

  subtitle: {
    fontSize: 12,
    color: "#71859B",
    textAlign: "center",
    marginBottom: 20,
  },

  searchHint: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 10,
    marginLeft: 4,
  },

  searchResults: {
    borderWidth: 1,
    borderColor: "#DFE8F1",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    marginBottom: 12,
  },

  searchResultRow: {
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
  },

  searchResultText: {
    flex: 1,
  },

  moreResults: {
    fontSize: 12,
    color: "#94A3B8",
    padding: 12,
    textAlign: "center",
  },

  infoButton: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  // Fast yta för info och redigering: textkolumnerna flyttas aldrig.
  rowActions: {
    width: 70,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },

  inlineInfoPopup: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F7FAFD",
    borderColor: "#C5DBEF",
    borderWidth: 1,
    borderRadius: 10,
  },

  inlineInfoScroll: {
    maxHeight: 130,
  },

  inlineInfoScrollContent: {
    paddingRight: 24,
  },

  informationBody: {
    fontSize: 12,
    lineHeight: 18,
    color: "#71859B",
  },

  listContent: {
    paddingBottom: 76,
  },

  row: {
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: "#E5EBF0",
  },

  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  word: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23,
    color: "#203B59",
    paddingRight: 8,
  },

  editButton: {
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 0,
  },

  translation: {
    fontSize: 14,
    lineHeight: 22,
    color: "#61758B",
    marginTop: 5,
  },

  empty: {
    fontSize: 14,
    color: "#71859B",
    textAlign: "center",
    paddingVertical: 24,
  },

  categoryBottomActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 16,
    marginRight: 2,
  },
  importCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#E9F3FB",
    borderWidth: 1,
    borderColor: "#DCEBF7",
  },
  importCategoryButtonText: {
    color: "#285F9D",
    fontSize: 12,
    fontWeight: "600",
  },
  importHint: { color: "#71859B", fontSize: 13, marginBottom: 12 },
  importListFrame: {
    borderWidth: 1,
    borderColor: "#DFE8F1",
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    marginBottom: 12,
  },
  importScroll: { maxHeight: 320 },
  importScrollContent: { paddingBottom: 8 },
  importCategoryRow: {
    minHeight: 51,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  importCategoryDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
  },
  importCategoryLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  importCategoryName: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
  },
  importEmpty: {
    padding: 16,
    fontSize: 13,
    color: "#71859B",
  },
  importBackButton: {
    alignSelf: "flex-start",
    paddingVertical: 10,
    marginTop: 8,
  },
  addWordPlusButton: {
    marginLeft: 8,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E9F3FB",
    borderWidth: 1,
    borderColor: "#DCEBF7",
    alignItems: "center",
    justifyContent: "center",
  },
  addWordPlusText: {
    fontSize: 26,
    lineHeight: 29,
    color: "#285F9D",
    fontWeight: "500",
  },
  addCategoriesScroll: { maxHeight: 135, marginBottom: 12 },
  editCategoryToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    borderRadius: 10,
    marginBottom: 12,
  },
  editCategoryHeading: { color: "#203B59", fontSize: 13, fontWeight: "600" },
  editCategorySummary: { flexDirection: "row", alignItems: "center", gap: 10 },
  editCategoryToggleText: { color: "#285F9D", fontSize: 13, fontWeight: "600" },
  editCategoriesScroll: { maxHeight: 155, marginBottom: 12 },
  editCategoriesDone: { alignItems: "center", paddingVertical: 10 },
  addCategoryChoice: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    marginBottom: 6,
  },
  addCategoryChoiceSelected: {
    backgroundColor: "#E9F3FB",
    borderColor: "#C5DBEF",
  },
  addCategoryChoiceText: { color: "#334155", fontSize: 13 },
  addSaveButton: {
    backgroundColor: "#DCEBF7",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  addSaveButtonText: { color: "#285F9D", fontWeight: "600", fontSize: 14 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  addWordModal: { maxHeight: "85%" },
  addWordModalContent: { paddingTop: 8, paddingBottom: 8 },
  editModal: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    position: "relative",
  },

  closeModalButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  closeModalText: {
    fontSize: 28,
    fontWeight: "400",
    color: "#71859B",
    lineHeight: 30,
  },

  editTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#203B59",
    marginBottom: 18,
    paddingRight: 35,
  },

  editLabel: {
    fontSize: 12,
    color: "#71859B",
    marginBottom: 5,
  },

  editInput: {
    height: 44,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: "#203B59",
    marginBottom: 14,
  },

  editInformationInput: {
    height: 90,
    paddingTop: 10,
    paddingBottom: 10,
  },

  editError: {
    color: "#9A5B22",
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 10,
  },

  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },

  deleteButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },

  deleteButtonText: {
    color: "#dc2626",
    fontSize: 14,
    fontWeight: "600",
  },

  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  saveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});
