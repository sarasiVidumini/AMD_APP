import { Slot } from "expo-router";
import { StyleSheet, View } from "react-native";
import Navbar from "../../components/Navbar";
import ProtectedRoute from "../../components/ProtectedRoute";

export default function ScreensLayout() {
  return (
    <ProtectedRoute>
      <View style={styles.container}>
        {/* Persistent header — stays mounted while Slot swaps the active screen.
            This is what makes tapping between Dashboard/Requests/Experts/Upload
            feel instant, like a real mobile app, instead of each screen
            re-rendering its own header. */}
        <Navbar />
        <View style={styles.content}>
          <Slot />
        </View>
      </View>
    </ProtectedRoute>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  content: { flex: 1 },
});
