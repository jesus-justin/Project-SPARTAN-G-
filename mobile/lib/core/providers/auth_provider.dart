import 'package:flutter/foundation.dart';

import '../services/api_service.dart';
import '../services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider({ApiService? apiService}) : _apiService = apiService ?? ApiService();

  final ApiService _apiService;

  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _token;
  String? _errorMessage;
  String _studentName = 'Student';

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get token => _token;
  String? get errorMessage => _errorMessage;
  String get studentName => _studentName;

  Future<void> initialize() async {
    _setLoading(true);
    try {
      _token = await StorageService.getToken();
      _isAuthenticated = _token != null && _token!.isNotEmpty;
      final String? savedName = await StorageService.getString('student_name');
      if (savedName != null && savedName.isNotEmpty) {
        _studentName = savedName;
      }
      _errorMessage = null;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> login({required String studentId, required String password}) async {
    _setLoading(true);
    _errorMessage = null;

    try {
      final dynamic response = await _apiService.post(
        '/auth/login',
        body: <String, dynamic>{
          'studentId': studentId,
          'password': password,
        },
      );

      // Backend returns { success: true, data: { token, user } }
      if (response is Map<String, dynamic> && response['data'] != null) {
        final Map<String, dynamic> data = Map<String, dynamic>.from(response['data']);
        final String? jwt = data['token']?.toString();
        final Map<String, dynamic>? user = data['user'] is Map<String, dynamic> ? Map<String, dynamic>.from(data['user']) : null;
        final String? name = user != null ? '${user['firstName'] ?? user['first_name'] ?? ''} ${user['lastName'] ?? user['last_name'] ?? ''}'.trim() : null;

        if (jwt == null || jwt.isEmpty) {
          _errorMessage = 'No token received from server.';
          return false;
        }

        await StorageService.saveToken(jwt);
        if (name != null && name.isNotEmpty) {
          _studentName = name;
          await StorageService.setString('student_name', name);
        }

        _token = jwt;
        _isAuthenticated = true;
        notifyListeners();
        return true;
      }

      _errorMessage = 'Invalid server response.';
      return false;
    } on ApiException catch (e) {
      _errorMessage = e.message;
      return false;
    } catch (_) {
      _errorMessage = 'Unable to log in. Please try again.';
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    await StorageService.clearToken();
    _token = null;
    _isAuthenticated = false;
    _errorMessage = null;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
