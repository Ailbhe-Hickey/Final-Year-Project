import { FIREBASE_auth } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ─── Constants ────────────────────────────────────────────────────────────────

const green = '#7F9C96';
const dark_green = '#5f8a7c';
const { width: SCREEN_WIDTH } = Dimensions.get('screen');

// ─── Component ────────────────────────────────────────────────────────────────

const Login = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const router = useRouter();

  const signIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter both email and password.');
      return;
    }
    setLoading(true);
    try {
      const response = await signInWithEmailAndPassword(FIREBASE_auth, email, password);
      console.log('User logged in: ', response.user);
      router.replace('/mnd_carousel');
    } catch (error: any) {
      Alert.alert('Login Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top wave */}
            <View style={styles.top}>
              <View style={styles.box}>
                <Svg
                  height={300}
                  width={SCREEN_WIDTH}
                  viewBox="0 0 1440 320"
                  preserveAspectRatio="none"
                >
                  <Path
                    fill="#7F9C96"
                    d="M0,192L120,202.7C240,213,480,235,720,224C960,213,1200,171,1320,149.3L1440,128L1440,0L1320,0C1200,0,960,0,720,0C480,0,240,0,120,0L0,0Z"
                  />
                </Svg>
              </View>
            </View>

      {/* Log in section */}
      <KeyboardAvoidingView
        style={{flex:1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
                  contentContainerStyle={styles.scrollContent}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subheading}>Sign in to continue</Text>

      
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={18} color={green} />
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputRow}>
          <Ionicons name="lock-closed-outline" size={18} color={green} />
          <TextInput
            style={styles.input}
            placeholder="Your password"
            placeholderTextColor="#aaa"
            autoCapitalize="none"
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color="#aaa"
            />
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            pressed && { opacity: 0.85 },
            loading && { opacity: 0.6 },
          ]}
          onPress={signIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Text style={styles.submitText}>Sign In</Text>
              <Ionicons name="arrow-forward-outline" size={18} color="white" />
            </>
          )}
        </Pressable>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.outlineBtn,
            pressed && { opacity: 0.8 },
          ]}
          onPress={() => router.push('/auth/signup')}
        >
          <Ionicons name="person-add-outline" size={18} color={dark_green} />
          <Text style={styles.outlineBtnText}>Create an account</Text>
        </Pressable>
        </  ScrollView>
      </KeyboardAvoidingView>

      
    </View>
  );
};

export default Login;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  container: { 
    flex: 1, 
    backgroundColor: '#f8fbfa' 
  },

  // Waves
  top: { 
    height: 230, 
    overflow: 'hidden'
  },

  bottom: { 
    width: '100%' 
  },

  box: { 
    backgroundColor: '#7F9C96', 
    height: 20 
  },

  // main login section
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 40,
  },

  // Form
  formWrapper: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 4,
    justifyContent: 'center',
  },

  // Heading
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a2e28',
    letterSpacing: -0.5,
    marginBottom: 4,
  },

  subheading: {
    fontSize: 14,
    color: '#888',
    marginBottom: 28,
  },

  // Labels
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: dark_green,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },

  // Input rows
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d0e3e0',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 18,
    shadowColor: green,
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#1a2e28',
  },

  // Submit button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: green,
    borderRadius: 14,
    paddingVertical: 16,
    marginBottom: 20,
    shadowColor: dark_green,
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
  },

  submitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#d0e3e0',
  },
  dividerText: {
    fontSize: 13,
    color: '#aaa',
    fontWeight: '500',
  },

  // Outline button
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: '#d0e3e0',
    backgroundColor: '#ffffff',
  },
  
  outlineBtnText: {
    color: dark_green,
    fontSize: 15,
    fontWeight: '600',
  },
});