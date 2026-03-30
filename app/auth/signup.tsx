import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
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
import { FIREBASE_auth, FIREBASE_db } from '../../firebaseConfig';

// ─── Constants ────────────────────────────────────────────────────────────────

const green = '#7F9C96';
const dark_green = '#5f8a7c';
const { width: SCREEN_WIDTH } = Dimensions.get('screen');

// ─── Component ────────────────────────────────────────────────────────────────

const Signup = () => {
  const [displayName, setDisplayName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const router = useRouter();

  const signUp = async () => {
    if (!displayName || !email || !password || !role) {
      Alert.alert('Missing fields', 'Please fill in all fields before continuing.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await createUserWithEmailAndPassword(FIREBASE_auth, email, password);
      await setDoc(doc(FIREBASE_db, 'users', response.user.uid), {
        displayName,
        email,
        role,
        createdAt: new Date(),
      });
      router.replace('/home');
    } catch (error: any) {
      Alert.alert('Signup Error', error.message);
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

      {/* sign up section */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.heading}>Create account</Text>
          <Text style={styles.subheading}>Sign up to get started</Text>

          <Text style={styles.label}>Full Name</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color={green} />
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor="#aaa"
              autoCapitalize="words"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

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
              placeholder="Min. 6 characters"
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

          <Text style={styles.label}>Role</Text>
          <View style={styles.roleRow}>
            {['MND', 'Family/Carer'].map((option) => {
              const selected = role === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.roleChip, selected && styles.roleChipActive]}
                  onPress={() => setRole(option)}
                >
                  <Ionicons
                    name={
                      option === 'MND'
                        ? 'share-social-outline'
                        : 'home-outline'
                    }
                    size={16}
                    color={selected ? 'white' : dark_green}
                  />
                  <Text
                    style={[styles.roleChipText, selected && styles.roleChipTextActive]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              pressed && { opacity: 0.85 },
              loading && { opacity: 0.6 },
            ]}
            onPress={signUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Text style={styles.submitText}>Create Account</Text>
                <Ionicons name="arrow-forward-outline" size={18} color="white" />
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.loginLink}
            onPress={() => router.back()}
          >
            <Text style={styles.loginLinkText}>
              Already have an account?{' '}
              <Text style={styles.loginLinkBold}>Sign in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

    </View>
  );
};

export default Signup;


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fbfa' },

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

  // Role chips
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 28,
  },

  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#d0e3e0',
    backgroundColor: '#ffffff',
  },

  roleChipActive: {
    backgroundColor: dark_green,
    borderColor: dark_green,
  },

  roleChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: dark_green,
  },

  roleChipTextActive: {
    color: 'white',
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
    marginBottom: 18,
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

  // Login link
  loginLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },

  loginLinkText: {
    fontSize: 14,
    color: '#888',
  },
  
  loginLinkBold: {
    color: dark_green,
    fontWeight: '700',
  },
});