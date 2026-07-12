import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LayoutGrid, MessageSquare, Users, Upload, Brain } from 'lucide-react-native';

const YELLOW = '#eab308';

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { path: '/dashboard', Icon: LayoutGrid },
    { path: '/requests', Icon: MessageSquare },
    { path: '/groupChat', Icon: Users },
    { path: '/upload', Icon: Upload },
    { path: '/aiStudymode', Icon: Brain },
  ];

  return (
    <View style={styles.footer}>
      {navItems.map(({ path, Icon }) => {
        const active = isActive(path);
        return (
          <TouchableOpacity
            key={path}
            onPress={() => router.push(path as any)}
            style={[styles.navItem, active && styles.navItemActive]}
          >
            <Icon size={24} color={active ? YELLOW : '#a1a1aa'} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#000',
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingVertical: 10,
    paddingBottom: 20,
  },
  navItem: { padding: 10, borderRadius: 12 },
  navItemActive: {
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: YELLOW,
    shadowColor: YELLOW,
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
});