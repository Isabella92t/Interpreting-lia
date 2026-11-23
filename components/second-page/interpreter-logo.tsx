import { Text, View } from "react-native";

import { useUiLanguage } from "@/context/ui-language-context";
import { styles } from "./second-page-styles";

/** Liten diskret symbol: två deltagare och en tolk med namnbricka. */
export function InterpreterLogo() {
  const { t } = useUiLanguage();

  return (
    <View style={styles.logo} accessibilityLabel={t("logoLabel")}>
      <View style={[styles.logoPerson, styles.logoSideLeft]}>
        <View style={styles.logoSideHead} />
        <View style={styles.logoSideBody} />
      </View>
      <View style={[styles.logoPerson, styles.logoSideRight]}>
        <View style={styles.logoSideHead} />
        <View style={styles.logoSideBody} />
      </View>
      <View style={styles.logoCenter}>
        <View style={styles.logoCenterHead} />
        <View style={styles.logoCenterBody} />
        <View style={styles.logoStrapLeft} />
        <View style={styles.logoStrapRight} />
        <View style={styles.logoBadge}>
          <Text style={styles.logoBadgeText} numberOfLines={1}>
            TolkAppen
          </Text>
          <View style={styles.logoBadgeTail} />
        </View>
      </View>
    </View>
  );
}

