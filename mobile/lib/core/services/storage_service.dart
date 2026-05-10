import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/app_strings.dart';
import 'web_storage_helper.dart';

class StorageService {
  StorageService._();

  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  static Future<void> saveToken(String token) async {
    if (kIsWeb) {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.setString(AppStrings.tokenKey, token);
      await saveWebString(AppStrings.tokenKey, token);
      return;
    }

    await _secureStorage.write(key: AppStrings.tokenKey, value: token);
  }

  static Future<String?> getToken() async {
    if (kIsWeb) {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final String? value = prefs.getString(AppStrings.tokenKey);
      final String? fallback = await readWebString(AppStrings.tokenKey);
      return value?.isNotEmpty == true ? value : fallback;
    }

    final String? secureValue = await _secureStorage.read(key: AppStrings.tokenKey);
    return secureValue != null && secureValue.isNotEmpty ? secureValue : null;
  }

  static Future<void> clearToken() async {
    if (kIsWeb) {
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.remove(AppStrings.tokenKey);
      await removeWebString(AppStrings.tokenKey);
      return;
    }

    await _secureStorage.delete(key: AppStrings.tokenKey);
  }

  static Future<void> clearAllSecure() async {
    await _secureStorage.deleteAll();
  }

  static Future<void> setString(String key, String value) async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, value);
    if (kIsWeb) {
      await saveWebString(key, value);
    }
  }

  static Future<String?> getString(String key) async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    final String? value = prefs.getString(key);
    final String? fallback = kIsWeb ? await readWebString(key) : null;
    if (value != null && value.isNotEmpty) {
      return value;
    }
    return fallback;
  }

  static Future<void> setBool(String key, bool value) async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  static Future<bool?> getBool(String key) async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    return prefs.getBool(key);
  }

  static Future<void> remove(String key) async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.remove(key);
    if (kIsWeb) {
      await removeWebString(key);
    }
  }
}
