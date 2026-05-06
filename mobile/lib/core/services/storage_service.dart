import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../constants/app_strings.dart';

class StorageService {
  StorageService._();

  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage();

  static Future<void> saveToken(String token) async {
    await _secureStorage.write(key: AppStrings.tokenKey, value: token);
  }

  static Future<String?> getToken() async {
    return _secureStorage.read(key: AppStrings.tokenKey);
  }

  static Future<void> clearToken() async {
    await _secureStorage.delete(key: AppStrings.tokenKey);
  }

  static Future<void> clearAllSecure() async {
    await _secureStorage.deleteAll();
  }

  static Future<void> setString(String key, String value) async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, value);
  }

  static Future<String?> getString(String key) async {
    final SharedPreferences prefs = await SharedPreferences.getInstance();
    return prefs.getString(key);
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
  }
}
