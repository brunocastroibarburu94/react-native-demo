import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
// import { Button } from 'react-native/types_generated/index';

// const BASE_URL = 'https://home.home.arpa/api/v1'; // Requires trusted SSL certificate  (Not available due to unrecognized CA certificate)
// const BASE_URL = 'https://www.brunocastroibarburu.com/api/v1';
const BASE_URL = 'http://192.168.1.24/api/v1';

const STORAGE_KEYS = {
  username: 'apiTest.username',
  password: 'apiTest.password',
  saveCredentials: 'apiTest.saveCredentials',
  rememberPassword: 'apiTest.rememberPassword',
};

type ApiResult = Record<string, unknown> | unknown[] | string | null;

type TokenResponse = {
  access_token: string;
  token_type: string;
  token_expiry: number;
};

type Tenant = {
  id: string | number;
  name: string;
  description?: string | null;
};

type TenantsResponse = {
  tenants: Tenant[];
};

type RequestKey = 'root' | 'token' | 'tenants';

let nextApiRequestId = 1;

type ApiRequestLog = {
  details?: Record<string, unknown>;
  method?: string;
  url: string;
};

function responseHeadersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {};

  try {
    headers.forEach((value, key) => {
      result[key] = value;
    });
  } catch {
    result.unavailable = 'Could not read response headers';
  }

  return result;
}

function logApiError(requestId: number, error: unknown) {
  if (error instanceof Error) {
    console.log(`[Home API #${requestId}] Fetch failed before receiving an HTTP response`, {
      name: error.name,
      message: error.message,
      cause: error.cause,
      stack: error.stack,
    });

    if (error.message === 'Network request failed') {
      console.log(
        `[Home API #${requestId}]: ${error.message} ` //No status code or response body is available. In React Native this usually means DNS, connectivity, TLS/certificate trust, hostname mismatch, or Android network security blocked the request before HTTP completed.
      );
    }

    return;
  }

  console.log(`[Home API #${requestId}] Fetch failed with a non-Error value`, error);
}

async function apiFetch({ details, method = 'GET', url }: ApiRequestLog, init?: RequestInit) {
  const requestId = nextApiRequestId;
  nextApiRequestId += 1;
  const startedAt = Date.now();
  console.log(``);
  console.log(``);
  console.log(`[Home API #${requestId}] Request ${method} ${url}`, details ?? {});
  console.log(`Headers: ${JSON.stringify(init?.headers ?? {})}`);
  try {
    const response = await fetch(url, init);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    console.log(`[Home API #${requestId}] Request failed after ${Date.now() - startedAt}ms`,error);
    throw error;
  }
}


async function parseResponse(response: Response): Promise<ApiResult> {
  const text = await response.text();
  const responseUrl = response.url || 'unknown URL';

  console.log(`[Home API] Response ${response.status} ${response.statusText} ${responseUrl}`);
  console.log(`[Home API] Response payload text: ${text || '<empty>'}`);

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as ApiResult;
  } catch {
    return text;
  }
}

function formatResult(result: ApiResult): string {
  if (result === null) {
    return 'No response body';
  }

  if (typeof result === 'string') {
    return result;
  }

  return JSON.stringify(result, null, 2);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unexpected request failure';
}

async function readJsonOrThrow(response: Response): Promise<ApiResult> {
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${formatResult(payload)}`);
  }

  return payload;
}

function isTokenResponse(value: ApiResult): value is TokenResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<TokenResponse>;
  return (
    typeof candidate.access_token === 'string' &&
    typeof candidate.token_type === 'string' &&
    typeof candidate.token_expiry === 'number'
  );
}

function isTenantsResponse(value: ApiResult): value is TenantsResponse {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<TenantsResponse>;
  return Array.isArray(candidate.tenants);
}

const Home = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saveCredentials, setSaveCredentials] = useState(true);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [refreshToken, setRefreshToken] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [accessTokenMeta, setAccessTokenMeta] = useState<Omit<TokenResponse, 'access_token'> | null>(null);
  const [accessTokenResult, setAccessTokenResult] = useState<ApiResult>(null);
  const [tokenMeta, setTokenMeta] = useState<Omit<TokenResponse, 'access_token'> | null>(null);
  const [rootResult, setRootResult] = useState<ApiResult>(null);
  const [tokenResult, setTokenResult] = useState<ApiResult>(null);
  const [tenantsResult, setTenantsResult] = useState<ApiResult>(null);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<RequestKey | null>(null);
  const hasLoadedStorage = useRef(false);

  useEffect(() => {
    const loadStoredCredentials = async () => {
      try {
        const [storedUsername, storedPassword, storedSaveCredentials, storedRememberPassword] =
          await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.username),
            AsyncStorage.getItem(STORAGE_KEYS.password),
            AsyncStorage.getItem(STORAGE_KEYS.saveCredentials),
            AsyncStorage.getItem(STORAGE_KEYS.rememberPassword),
          ]);
        const shouldSave = storedSaveCredentials !== 'false';
        const shouldRememberPassword = storedRememberPassword === 'true';

        setSaveCredentials(shouldSave);
        setRememberPassword(shouldRememberPassword);

        if (shouldSave) {
          setUsername(storedUsername ?? '');
        }

        if (shouldSave && shouldRememberPassword) {
          setPassword(storedPassword ?? '');
        }
      } catch (storageError) {
        setError(`Could not load saved credentials: ${getErrorMessage(storageError)}`);
      } finally {
        hasLoadedStorage.current = true;
      }
    };

    void loadStoredCredentials();
  }, []);

  useEffect(() => {
    if (!hasLoadedStorage.current) {
      return;
    }

    const persistCredentials = async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.saveCredentials, String(saveCredentials));
        await AsyncStorage.setItem(STORAGE_KEYS.rememberPassword, String(rememberPassword));

        if (!saveCredentials) {
          await Promise.all([
            AsyncStorage.removeItem(STORAGE_KEYS.username),
            AsyncStorage.removeItem(STORAGE_KEYS.password),
          ]);
          return;
        }

        await AsyncStorage.setItem(STORAGE_KEYS.username, username);

        if (rememberPassword) {
          await AsyncStorage.setItem(STORAGE_KEYS.password, password);
        } else {
          await AsyncStorage.removeItem(STORAGE_KEYS.password);
        }
      } catch (storageError) {
        setError(`Could not save credentials: ${getErrorMessage(storageError)}`);
      }
    };

    void persistCredentials();
  }, [password, rememberPassword, saveCredentials, username]);

  const runRequest = useCallback(
    async (key: RequestKey, request: () => Promise<void>) => {
      setLoading(key);
      setError('');

      try {
        await request();
      } catch (requestError) {
        setError(getErrorMessage(requestError));
      } finally {
        setLoading(null);
      }
    },
    []
  );

  const checkApi = () => {
    void runRequest('root', async () => {
      const response = await apiFetch({ url: BASE_URL });
      console.log('response', response);
      const payload = await readJsonOrThrow(response);
      console.log('payload', payload);
      setRootResult(payload);
    });
  };

  const createRefreshToken = () => {
    void runRequest('token', async () => {
      const body = new URLSearchParams();
      body.append('grant_type', 'password');
      body.append('username', username);
      body.append('password', password);
      body.append('scope', '');

      const response = await apiFetch({
        details: {
          contentType: 'application/x-www-form-urlencoded',
          grantType: 'password',
          hasScope: true,
          username,
          
          passwordLength: password.length,
        },
        method: 'POST',
        url: `${BASE_URL}/session/new`,
      }, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      const payload = await readJsonOrThrow(response);

      if (!isTokenResponse(payload)) {
        throw new Error(`Unexpected token response: ${formatResult(payload)}`);
      }

      setRefreshToken(payload.access_token);
      setTokenMeta({ token_type: payload.token_type, token_expiry: payload.token_expiry });
      setTokenResult(payload);
    });
  };

  const fetchTenants = () => {
    void runRequest('tenants', async () => {
      const response = await apiFetch(
        { details: {}, url: `${BASE_URL}/session/tenants`,}, 
        { headers: {Authorization: `Bearer ${refreshToken}`,},}
      );
      const payload = await readJsonOrThrow(response);
      if (!isTenantsResponse(payload)) {  throw new Error(`Unexpected tenants response: ${formatResult(payload)}`);}
      setTenantsResult(payload);
    });
  };

  const fetchAccessToken = () => {
    void runRequest('token', async () => {
      const body = new URLSearchParams();
      const response = await apiFetch(
        {details:{}, url: `${BASE_URL}/session/access/${tenantId}`,method: 'POST'}, //method: 'POST',
        { headers: {Authorization: `Bearer ${refreshToken}`}, method: 'POST', body: body.toString(),}
      );
      const payload = await readJsonOrThrow(response);
      if (!isTokenResponse(payload)) {
        throw new Error(`Unexpected token response: ${formatResult(payload)}`);
      }
      setAccessToken(payload.access_token);
      setAccessTokenMeta({ token_type: payload.token_type, token_expiry: payload.token_expiry });
      setAccessTokenResult(payload);
    });
    
  }

  const confirmRememberPassword = (enabled: boolean) => {
    if (!enabled) {
      setRememberPassword(false);
      return;
    }

    Alert.alert(
      'Remember password?',
      'This stores the password on this device for test convenience.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => setRememberPassword(false) },
        { text: 'Remember', style: 'default', onPress: () => setRememberPassword(true) },
      ]
    );
  };

  const canLogin = username.trim().length > 0 && password.length > 0 && loading !== 'token';
  const canFetchTenants = refreshToken.length > 0 && loading !== 'tenants';
  const canFetchAccessToken = refreshToken.length > 0 && tenantId !== null ;
  const tenants = isTenantsResponse(tenantsResult) ? tenantsResult.tenants : [];

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Home API</Text>
        <Text style={styles.title}>Session test console</Text>
        <Text style={styles.subtitle}>{BASE_URL}</Text>
        <Text style={styles.subtitle}>Tenant: {tenantId !== null ? tenantId : 'N/A' }</Text>
      </View>

      {/* Test Connection Block */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Connection</Text>
          <RequestBadge active={loading === 'root'} />
        </View>
        <ActionButton disabled={loading === 'root'} label="Check API" onPress={checkApi} />
        <ResultPanel title="Root response" result={rootResult} />
      </View>

      {/* Fetch Refresh Token Block */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Credentials</Text>
          <RequestBadge active={loading === 'token'} />
        </View>

        <Text style={styles.label}>User</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setUsername}
          placeholder="username"
          style={styles.input}
          value={username}
        />

        <Text style={styles.label}>Password</Text>
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setPassword}
          placeholder="password"
          secureTextEntry={!showPassword}
          style={styles.input}
          value={password}
        />
        <ToggleRow
          label="Show password"
          onValueChange={setShowPassword}
          value={showPassword}
        />

        <ToggleRow
          label="Save credentials"
          onValueChange={setSaveCredentials}
          value={saveCredentials}
        />
        <ToggleRow
          disabled={!saveCredentials}
          label="Remember password"
          onValueChange={confirmRememberPassword}
          value={saveCredentials && rememberPassword}
        />

        <ActionButton disabled={!canLogin} label="Create Refresh Token" onPress={createRefreshToken} />
        {tokenMeta ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Type: {tokenMeta.token_type}</Text>
            <Text style={styles.metaText}>Expires in: {tokenMeta.token_expiry}s</Text>
          </View>
        ) : null}
        <ResultPanel redactedToken title="Token response" result={tokenResult} />
      </View>


      {/* Fetch tenants block */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tenants</Text>
          <RequestBadge active={loading === 'tenants'} />
        </View>

        <ActionButton disabled={!canFetchTenants} label="Fetch Tenants" onPress={fetchTenants} />

        {tenants.length > 0 ? (
          <View style={styles.tenantList}>
            {tenants.map((tenant) => (
              <View key={String(tenant.id)} style={styles.tenantItem}>
                <Text style={styles.tenantName}>Tenant Name: {tenant.name}</Text>
                <Text style={styles.tenantDescription}>Tenant ID: {tenant.id}</Text>
                {tenant.description ? (
                  <Text style={styles.tenantDescription}> Tenant Description: {tenant.description}</Text>
                ) : null}
                <ActionButton label="Select" onPress={() => setTenantId(tenant.id as string)} />
              </View>
            ))}
          </View>
        ) : null}

        <ResultPanel title="Tenants response" result={tenantsResult} />
      </View>


        {/* Fetch access token block  */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Access Token</Text>
            <RequestBadge active={loading === 'token'} />
          </View>

          <ActionButton disabled={!canFetchAccessToken} label="Fetch Access Token" onPress={fetchAccessToken} />
          <ResultPanel redactedToken title="Token response" result={accessTokenResult} />
          {/* {accessToken ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>Type: {accessTokenMeta.token_type}</Text>
              <Text style={styles.metaText}>Expires in: {accessTokenMeta.token_expiry}s</Text>
            </View>
          ) : null}
          <ResultPanel redactedToken title="Access Token response" result={accessTokenResult} />
          )} */}
        </View>
      {error ? (
        <View style={styles.errorPanel}>
          <Text style={styles.errorTitle}>Request error</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

type ActionButtonProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
};

function ActionButton({ disabled = false, label, onPress }: ActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        disabled ? styles.buttonDisabled : null,
        pressed && !disabled ? styles.buttonPressed : null,
      ]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
}

type ToggleRowProps = {
  disabled?: boolean;
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean;
};

function ToggleRow({ disabled = false, label, onValueChange, value }: ToggleRowProps) {
  return (
    <View style={[styles.toggleRow, disabled ? styles.disabledRow : null]}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch disabled={disabled} onValueChange={onValueChange} value={value} />
    </View>
  );
}

type ResultPanelProps = {
  redactedToken?: boolean;
  result: ApiResult;
  title: string;
};

function ResultPanel({ redactedToken = false, result, title }: ResultPanelProps) {
  if (result === null) {
    return null;
  }

  const displayResult = redactedToken && isTokenResponse(result)
    ? { ...result, access_token: `${result.access_token.slice(0, 16)}...` }
    : result;

  return (
    <View style={styles.resultPanel}>
      <Text style={styles.resultTitle}>{title}</Text>
      <Text selectable style={styles.resultText}>
        {formatResult(displayResult)}
      </Text>
    </View>
  );
}

function RequestBadge({ active }: { active: boolean }) {
  if (!active) {
    return null;
  }

  return (
    <View style={styles.requestBadge}>
      <ActivityIndicator color="#1f5eff" size="small" />
      <Text style={styles.requestBadgeText}>Running</Text>
    </View>
  );
}

export default Home;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f6f7fb',
    gap: 18,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    gap: 6,
    paddingTop: 22,
  },
  eyebrow: {
    color: '#1f5eff',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  title: {
    color: '#172033',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 0,
  },
  subtitle: {
    color: '#5c667a',
    fontSize: 14,
  },
  section: {
    backgroundColor: '#ffffff',
    borderColor: '#dfe4ee',
    borderRadius: 8,
    borderWidth: 1,
    gap: 12,
    padding: 16,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 28,
  },
  sectionTitle: {
    color: '#172033',
    fontSize: 18,
    fontWeight: '700',
  },
  label: {
    color: '#384154',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#ffffff',
    borderColor: '#c8cfdd',
    borderRadius: 6,
    borderWidth: 1,
    color: '#172033',
    fontSize: 16,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  toggleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  disabledRow: {
    opacity: 0.45,
  },
  toggleLabel: {
    color: '#263044',
    fontSize: 15,
    fontWeight: '600',
  },
  button: {
    alignItems: 'center',
    backgroundColor: '#1f5eff',
    borderRadius: 6,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  buttonDisabled: {
    backgroundColor: '#9aa9c8',
  },
  buttonPressed: {
    opacity: 0.82,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaText: {
    backgroundColor: '#eef3ff',
    borderRadius: 6,
    color: '#22427d',
    fontSize: 13,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tenantList: {
    gap: 10,
  },
  tenantItem: {
    backgroundColor: '#f7f9fc',
    borderColor: '#dfe4ee',
    borderRadius: 6,
    borderWidth: 1,
    gap: 4,
    padding: 12,
  },
  tenantName: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '800',
  },
  tenantDescription: {
    color: '#5c667a',
    fontSize: 13,
  },
  resultPanel: {
    backgroundColor: '#111827',
    borderRadius: 6,
    gap: 8,
    padding: 12,
  },
  resultTitle: {
    color: '#a7f3d0',
    fontSize: 13,
    fontWeight: '800',
  },
  resultText: {
    color: '#e5e7eb',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 18,
  },
  errorPanel: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
    padding: 14,
  },
  errorTitle: {
    color: '#be123c',
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    color: '#881337',
    fontSize: 13,
    lineHeight: 18,
  },
  requestBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  requestBadgeText: {
    color: '#1f5eff',
    fontSize: 12,
    fontWeight: '700',
  },
});
