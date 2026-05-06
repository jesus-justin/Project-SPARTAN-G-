import 'dart:convert';

import 'package:http/http.dart' as http;

import '../constants/api_constants.dart';
import 'storage_service.dart';

typedef UnauthorizedCallback = void Function();

class ApiService {
  ApiService({http.Client? client, UnauthorizedCallback? onUnauthorized})
      : _client = client ?? http.Client(),
        _onUnauthorized = onUnauthorized;

  final http.Client _client;
  final UnauthorizedCallback? _onUnauthorized;

  Future<Map<String, String>> _headers({bool withJson = true}) async {
    final String? token = await StorageService.getToken();
    final Map<String, String> headers = <String, String>{};

    if (withJson) {
      headers['Content-Type'] = 'application/json';
    }

    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }

    return headers;
  }

  Future<dynamic> get(String endpoint) async {
    final Uri uri = Uri.parse('$apiBaseUrl$endpoint');
    final http.Response response = await _client.get(uri, headers: await _headers());
    return _handleResponse(response);
  }

  Future<dynamic> post(String endpoint, {Map<String, dynamic>? body}) async {
    final Uri uri = Uri.parse('$apiBaseUrl$endpoint');
    final http.Response response = await _client.post(
      uri,
      headers: await _headers(),
      body: jsonEncode(body ?? <String, dynamic>{}),
    );
    return _handleResponse(response);
  }

  Future<dynamic> put(String endpoint, {Map<String, dynamic>? body}) async {
    final Uri uri = Uri.parse('$apiBaseUrl$endpoint');
    final http.Response response = await _client.put(
      uri,
      headers: await _headers(),
      body: jsonEncode(body ?? <String, dynamic>{}),
    );
    return _handleResponse(response);
  }

  Future<dynamic> delete(String endpoint) async {
    final Uri uri = Uri.parse('$apiBaseUrl$endpoint');
    final http.Response response = await _client.delete(uri, headers: await _headers());
    return _handleResponse(response);
  }

  dynamic _handleResponse(http.Response response) {
    final dynamic decodedBody = response.body.isNotEmpty ? jsonDecode(response.body) : null;

    if (response.statusCode == 401) {
      StorageService.clearToken();
      _onUnauthorized?.call();
      throw ApiException('Unauthorized', response.statusCode);
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      String message = 'Request failed';
      if (decodedBody is Map<String, dynamic> && decodedBody['message'] != null) {
        message = decodedBody['message'].toString();
      }
      throw ApiException(message, response.statusCode);
    }

    return decodedBody;
  }
}

class ApiException implements Exception {
  ApiException(this.message, this.statusCode);

  final String message;
  final int statusCode;

  @override
  String toString() => 'ApiException($statusCode): $message';
}
