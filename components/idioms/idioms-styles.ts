import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F9FD",
    paddingHorizontal: 22,
    paddingTop: 16,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    zIndex: 1,
  },
  watermark: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "34%",
    height: 230,
    opacity: 0.055,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  person: { width: 100, alignItems: "center", justifyContent: "flex-end" },
  personLeft: { transform: [{ translateX: 17 }, { translateY: 17 }] },
  personCenter: { zIndex: 2, transform: [{ translateY: -6 }] },
  personRight: { transform: [{ translateX: -17 }, { translateY: 17 }] },
  personHead: { width: 52, height: 52, borderRadius: 26, marginBottom: 7 },
  personBody: {
    width: 92,
    height: 114,
    borderTopLeftRadius: 46,
    borderTopRightRadius: 46,
  },
  badgeCord: {
    position: "absolute",
    top: 73,
    width: 2,
    height: 32,
    backgroundColor: "#FFFFFF",
  },
  badge: {
    position: "absolute",
    top: 101,
    width: 67,
    height: 28,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontSize: 10, fontWeight: "700", color: "#285F9D" },

  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#203B59",
    marginBottom: 20,
    textAlign: "center",
  },

  search: {
    marginBottom: 16,
  },

  displayModeBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginBottom: 8,
  },
  // Redigera-knappen när redigeringsläget är på.
  editModeActive: { backgroundColor: "#E7F2FC", borderColor: "#B9D6EB" },
  displayModeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
    borderColor: "#DFE8F1",
    borderWidth: 1,
    borderRadius: 10,
  },
  displayModeLabel: {
    fontSize: 12,
    color: "#71859B",
  },
  idiomContentSide: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  idiomTextSide: {
    flex: 1,
    marginBottom: 0,
  },
  translationTextSide: {
    flex: 1,
    marginTop: 0,
  },

  // LUFTIGARE IDIOMLISTA

  listContent: {
    paddingBottom: 30,
  },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 18,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#DFE8F1",
  },

  idiomContent: {
    flex: 1,
    paddingRight: 12,
  },

  idiomText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#203B59",
    lineHeight: 24,
    marginBottom: 9,
  },

  translationText: {
    fontSize: 14,
    color: "#71859B",
    lineHeight: 22,
  },

  infoButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  infoModalBackground: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  infoText: {
    fontSize: 15,
    color: "#334155",
    lineHeight: 23,
  },

  editButton: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },

  // PLUSKNAPP

  addIdiomButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignSelf: "flex-end",
    marginBottom: 16,
    marginRight: 2,
    backgroundColor: "#E9F3FB",
    borderWidth: 1,
    borderColor: "#DCEBF7",
    alignItems: "center",
    justifyContent: "center",
  },

  addIdiomPlus: {
    fontSize: 26,
    lineHeight: 29,
    color: "#285F9D",
    fontWeight: "500",
  },

  // MODALER

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.30)",
  },

  modalScroll: {
    flex: 1,
  },

  modalScrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  categoryModal: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 22,
    position: "relative",
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
    color: "#0F172A",
    marginBottom: 18,
    paddingRight: 25,
  },

  closeModalButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },

  closeModalText: {
    fontSize: 28,
    lineHeight: 30,
    color: "#6B7280",
  },

  addFieldLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 5,
  },

  modalLanguagePair: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  modalLanguageText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },

  modalLanguageArrow: {
    color: "#94A3B8",
    marginHorizontal: 8,
  },

  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#DFE8F1",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: "#0F172A",
    marginTop: 5,
    fontSize: 15,
  },

  idiomInput: {
    minHeight: 90,
    marginBottom: 10,
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

  formError: {
    color: "#9A5B22",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 19,
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
    color: "#334155",
    fontSize: 15,
    fontWeight: "600",
  },

  // REDIGERING OCH RADERING

  editActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },

  deleteButton: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  deleteButtonText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "600",
  },

  saveButton: {
    backgroundColor: "#E9F3FB",
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },

  saveButtonText: {
    color: "#285F9D",
    fontSize: 14,
    fontWeight: "600",
  },
});
