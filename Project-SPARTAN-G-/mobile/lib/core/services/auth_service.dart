import 'api_service.dart';

class AuthService {
  AuthService({ApiService? apiService}) : _apiService = apiService ?? ApiService();

  final ApiService _apiService;

  Future<Map<String, dynamic>> login({required String studentId, required String password}) async {
    final dynamic response = await _apiService.post(
      '/auth/login',
      body: <String, dynamic>{
        'studentId': studentId,
        'password': password,
      },
    );

    if (response is Map<String, dynamic>) {
      return response;
    }

    return <String, dynamic>{};
  }
}
