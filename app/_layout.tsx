
import { Stack } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="expert-dashboard" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="upload" />
        <Stack.Screen name="requests" />
        <Stack.Screen name="aiStudymode" />
        <Stack.Screen name="expertList" />
        <Stack.Screen name="groupChat" />
        <Stack.Screen name="noteDetails" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="studentExperts" />
      </Stack>

      {/* Mounted once, globally */}
      <Toast />
    </>
  );
}
