import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { AppText } from '@/components/ui/AppText';
import { COMPACT_HERO_GRADIENT } from '@/constants/theme';

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
}

/**
 * Compact gradient header for pushed detail screens (e.g. task/[id]).
 *
 * This used to be a plain white bar with a hard bottom border and a bold
 * system-font title — the one screen in the app that didn't match the
 * gradient-hero identity used everywhere else (Home, Farmers, Batches,
 * Tasks, Profile all use the same dark-green gradient). Rebuilt to share
 * that identity via the same COMPACT_HERO_GRADIENT token instead of
 * introducing a fourth visual language.
 */
export function PageHeader({ title, showBack = false, onBack }: PageHeaderProps) {
  return (
    <LinearGradient
      colors={COMPACT_HERO_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView edges={['top']}>
        <View style={styles.headerContainer}>
          {showBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <ChevronLeft size={20} color="#ffffff" />
            </TouchableOpacity>
          )}
          <AppText weight="bold" style={styles.title} numberOfLines={1}>
            {title}
          </AppText>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 18,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 17,
    color: '#ffffff',
  },
});
