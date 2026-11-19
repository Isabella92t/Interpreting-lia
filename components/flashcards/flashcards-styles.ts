import { colors } from "@/constants/colors";
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 50,
  },

  stickyActions: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },

  scrollNavigation: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },

  scrollNavigationButton: {
    width: 42,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },

  stickyEditButtons: {
    flexDirection: "row",
    gap: 12,
  },
  stickyEditButtonFlex: {
    flex: 1,
  },
  stickyDeleteButton: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
  },
  stickySaveButton: {
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: colors.primary,
  },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 6,
  },

  helpText: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 14,
  },

  /* Kategorilistan, samma kort som pa andra sidan */

  /* Rullgardinen. Samma stil som språkvalet på första sidan. */

  label: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: colors.textSecondary,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 4,
  },

  sourceCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 3,
  },

  hintText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
    marginBottom: 10,
  },

  // Kategorierna ligger i en horisontell rad som går att svepa.
  categoryCarouselRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  categoryCarousel: {
    flex: 1,
  },
  categoryCarouselPage: {
    flexDirection: "row",
    gap: 8,
  },
  categoryArrowButton: {
    width: 25,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryArrowText: {
    fontSize: 29,
    color: "#475569",
    fontWeight: "300",
  },
  categoryArrowDisabled: {
    fontSize: 29,
    color: "#CBD5E1",
    fontWeight: "300",
  },

  categoryBox: {
    width: "100%",
    minHeight: 56,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },

  categoryBoxActive: {
    width: "100%",
    minHeight: 56,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },

  quickActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },

  savedListsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 2,
    justifyContent: "center",
  },

  // Chipsen radbryts, så att alla val syns utan att man skrollar i sidled.
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  newListRow: {
    flexDirection: "row",
    marginTop: 12,
  },

  newListChip: {
    width: "31.5%",
    minHeight: 56,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },

  newListChipText: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 17,
    textAlign: "center",
    color: colors.primary,
  },

  choiceCard: {
    marginTop: 24,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "#EAF4FF",
    borderWidth: 1.5,
    borderColor: "#9DC9F5",
    shadowColor: "#4779A8",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },

  choiceTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },

  buttonDisabled: {
    backgroundColor: colors.disabled,
  },

  editSourceButton: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10,
  },

  primaryActionHelp: {
    color: "#FFFFFF",
    fontSize: 12,
    textAlign: "center",
    marginTop: 3,
  },
  actionHelp: {
    color: "#64748B",
    fontSize: 12,
    textAlign: "center",
    marginTop: 3,
  },
  actionTextGroup: {
    alignItems: "center",
  },
  actionDisabled: {
    opacity: 0.5,
  },
  editListSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 18,
    paddingTop: 8,
  },
  editListHelp: {
    fontSize: 12,
    textAlign: "center",
    color: "#64748B",
    marginBottom: 4,
  },
  // Redigering av en sparad lista ar en separat, diskret atgard.
  editListLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 12,
    marginTop: 4,
  },
  editListLinkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  // Pennknappen inuti kategorikortet.

  /* Kategorifiltret */

  filterRow: {
    gap: 8,
    paddingBottom: 12,
  },

  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  filterChipActive: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    borderWidth: 1,
    borderColor: "#2563EB",
  },

  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },

  filterChipTextActive: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  /* Ordlistan */

  nameInput: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 15,
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 12,
  },

  search: {
    marginBottom: 12,
  },

  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(15,23,42,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },

  modalCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 22,
  },

  randomAmountInput: {
    height: 54,
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#0F172A",
  },

  modalMessage: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 6,
    marginBottom: 6,
  },

  deleteButton: {
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  deleteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
  },

  chipRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
  },

  wordRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
  },

  wordRowSelected: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
  },

  wordText: {
    flex: 1,
    marginLeft: 12,
  },

  wordFrom: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F172A",
  },

  wordTo: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  /* Ova-vyn */

  counter: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 14,
  },

  cardFront: {
    minHeight: 260,
    borderRadius: 24,
    backgroundColor: "#DFEAF3",
    borderWidth: 2,
    borderColor: "#9BBBD2",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 34,
    shadowColor: "#315D79",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },

  cardBack: {
    minHeight: 260,
    borderRadius: 24,
    backgroundColor: "#F7EBD9",
    borderWidth: 2,
    borderColor: "#DCC39F",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 34,
    shadowColor: "#80623F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 5,
  },

  resultCard: {
    minHeight: 230,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 28,
  },

  cardLanguage: {
    fontSize: 12,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 12,
    textTransform: "uppercase",
  },

  cardWord: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
  },

  cardHint: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginTop: 16,
  },

  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  /* Svarsknapparna */

  wrongButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    alignItems: "center",
    justifyContent: "center",
  },

  wrongButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#DC2626",
  },

  correctButton: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
    alignItems: "center",
    justifyContent: "center",
  },

  correctButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#16A34A",
  },

  /* Resultatet */

  resultTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 22,
  },

  resultRow: {
    flexDirection: "row",
    gap: 40,
  },

  resultBox: {
    alignItems: "center",
  },

  resultNumberCorrect: {
    fontSize: 34,
    fontWeight: "700",
    color: "#16A34A",
  },

  resultNumberWrong: {
    fontSize: 34,
    fontWeight: "700",
    color: "#DC2626",
  },

  resultLabel: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },

  fullPrimaryButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },

  primaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
  },

  fullSecondaryButton: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
});
