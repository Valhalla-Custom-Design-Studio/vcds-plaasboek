/**
 * VCDS™ Secure Storage — wraps expo-secure-store
 * Never store tokens in AsyncStorage. Always use this.
 */
import * as SecureStore from "expo-secure-store";

const PREFIX = "vcds_";

export async function secureSet(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(`${PREFIX}${key}`, value, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function secureGet(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(`${PREFIX}${key}`);
}

export async function secureDelete(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(`${PREFIX}${key}`);
}

export async function secureGetOrThrow(key: string): Promise<string> {
  const val = await secureGet(key);
  if (!val) throw new Error(`Secure key "${key}" not found — user may need to re-authenticate.`);
  return val;
}
