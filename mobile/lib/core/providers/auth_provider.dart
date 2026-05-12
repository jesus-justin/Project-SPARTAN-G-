import 'dart:io';

import 'package:flutter/foundation.dart';

import '../services/api_service.dart';
import '../services/storage_service.dart';

class AuthProvider extends ChangeNotifier {
  AuthProvider({ApiService? apiService}) : _apiService = apiService ?? ApiService();

  final ApiService _apiService;

  bool _isAuthenticated = false;
  bool _isLoading = true;
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
        _studentName = _normalizeDisplayName(savedName);
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
        final String? name = _resolveDisplayName(user);

        if (jwt == null || jwt.isEmpty) {
          _errorMessage = 'No token received from server.';
          return false;
        }

        await StorageService.saveToken(jwt);
        if (name != null && name.isNotEmpty) {
          _studentName = _normalizeDisplayName(name);
          await StorageService.setString('student_name', _studentName);
        }

        _token = jwt;
        _isAuthenticated = true;
        notifyListeners();
        return true;
      }

      _errorMessage = 'Invalid server response.';
      return false;
    } on ApiException catch (e) {
      _errorMessage = _friendlyLoginErrorMessage(e);
      return false;
    } on SocketException {
      _errorMessage = 'Cannot connect to server. Make sure you are on the network.';
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

  // Mark user as authenticated (used for facilitator login)
  void setAuthenticated(String token) {
    _token = token;
    _isAuthenticated = true;
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

  String? _resolveDisplayName(Map<String, dynamic>? user) {
    if (user == null) {
      return null;
    }

    final String? directName = _stringValue(user['name']) ?? _stringValue(user['fullName']) ?? _stringValue(user['full_name']);
    if (directName != null && directName.isNotEmpty) {
      return _normalizeDisplayName(directName);
    }

    final String firstName = _stringValue(user['firstName']) ?? _stringValue(user['first_name']) ?? '';
    final String lastName = _stringValue(user['lastName']) ?? _stringValue(user['last_name']) ?? '';

    if (firstName.isNotEmpty && lastName.isNotEmpty) {
      if (firstName == lastName) {
        return _normalizeDisplayName(firstName);
      }
      return _normalizeDisplayName('$firstName $lastName');
    }

    return _normalizeDisplayName(firstName.isNotEmpty ? firstName : lastName);
  }

  String _normalizeDisplayName(String value) {
    final String normalized = value.trim().replaceAll(RegExp(r'\s+'), ' ');
    final List<String> parts = normalized.split(' ');

    if (parts.length.isEven) {
      final int half = parts.length ~/ 2;
      final List<String> firstHalf = parts.sublist(0, half);
      final List<String> secondHalf = parts.sublist(half);
      if (_listsEqualIgnoreCase(firstHalf, secondHalf)) {
        return firstHalf.join(' ');
      }
    }

    return normalized;
  }

  bool _listsEqualIgnoreCase(List<String> left, List<String> right) {
    if (left.length != right.length) {
      return false;
    }

    for (int index = 0; index < left.length; index += 1) {
      if (left[index].toLowerCase() != right[index].toLowerCase()) {
        return false;
      }
    }

    return true;
  }

  String? _stringValue(dynamic value) {
    final String text = value?.toString().trim() ?? '';
    return text.isEmpty ? null : text;
  }

  String _friendlyLoginErrorMessage(ApiException error) {
    switch (error.statusCode) {
      case 401:
        return 'Incorrect Student ID or password.';
      case 404:
        return 'Student ID not found. Please sign up first.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return error.message.isNotEmpty ? error.message : 'Unable to log in. Please try again.';
    }
  }
}
