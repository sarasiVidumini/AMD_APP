import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Public entry points — no navbar */}
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />

        {/* Auth flow — no navbar */}
        <Stack.Screen name="(auth)" />

        {/* Authenticated app — persistent Navbar rendered by (screens)/_layout.tsx */}
        <Stack.Screen name="(screens)" />
      </Stack>

      {/* Mounted once, globally — Toast.show(...) anywhere renders through this */}
      <Toast />
    </>
  );
}
