import 'dart:convert';
import 'dart:io';
import 'dart:async';

import 'package:http/http.dart' as http;
import 'package:spartan_g/core/constants/api_constants.dart';
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
    return _requestWithFallbacks(
      endpoint,
      (Uri uri, Map<String, String> headers) => _client.get(uri, headers: headers),
    );
  }

  Future<dynamic> post(String endpoint, {Map<String, dynamic>? body}) async {
    return _requestWithFallbacks(
      endpoint,
      (Uri uri, Map<String, String> headers) => _client.post(
        uri,
        headers: headers,
        body: jsonEncode(body ?? <String, dynamic>{}),
      ),
    );
  }

  Future<dynamic> put(String endpoint, {Map<String, dynamic>? body}) async {
    return _requestWithFallbacks(
      endpoint,
      (Uri uri, Map<String, String> headers) => _client.put(
        uri,
        headers: headers,
        body: jsonEncode(body ?? <String, dynamic>{}),
      ),
    );
  }

  Future<dynamic> delete(String endpoint) async {
    return _requestWithFallbacks(
      endpoint,
      (Uri uri, Map<String, String> headers) => _client.delete(uri, headers: headers),
    );
  }

  Future<dynamic> _requestWithFallbacks(
    String endpoint,
    Future<http.Response> Function(Uri uri, Map<String, String> headers) request,
  ) async {
    final List<String> baseUrls = ApiConstants.candidateBaseUrls;
    Object? lastError;

    for (final String base in baseUrls) {
      try {
        final Uri uri = Uri.parse('$base$endpoint');
        final http.Response response = await request(uri, await _headers());
        return _handleResponse(response);
      } on SocketException catch (error) {
        lastError = error;
      } on TimeoutException catch (error) {
        lastError = error;
      } on HttpException catch (error) {
        lastError = error;
      }
    }

    if (lastError != null) {
      throw lastError;
    }

    throw const SocketException('Unable to reach API server');
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
