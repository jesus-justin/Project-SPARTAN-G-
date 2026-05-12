import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/storage_service.dart';

class FacilitatorLoginFormScreen extends StatefulWidget {
  const FacilitatorLoginFormScreen({super.key});

  @override
  State<FacilitatorLoginFormScreen> createState() =>
      _FacilitatorLoginFormScreenState();
}

class _FacilitatorLoginFormScreenState extends State<FacilitatorLoginFormScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _onLoginPressed() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      final ApiService api = ApiService();
      final String email = _emailController.text.trim();
      final String password = _passwordController.text;
      
      debugPrint('[FacilitatorLogin] Attempting login with email: $email');
      debugPrint('[FacilitatorLogin] Sending request to /auth/facilitator/login');
      
      final dynamic response = await api.post(
        '/auth/facilitator/login',
        body: <String, dynamic>{
          'email': email,
          'password': password,
        },
      );

      debugPrint('[FacilitatorLogin] Response received: $response');
      if (!mounted) return;

      // Backend returns { success: true, data: { token, user } }
      if (response is Map<String, dynamic> && response['data'] != null) {
        final Map<String, dynamic> data =
            Map<String, dynamic>.from(response['data']);
        final String? jwt = data['token']?.toString();
        final Map<String, dynamic>? user = data['user'] is Map<String, dynamic>
            ? Map<String, dynamic>.from(data['user'])
            : null;

        if (jwt != null && jwt.isNotEmpty) {
          debugPrint('[FacilitatorLogin] Token received, saving...');
          await StorageService.saveToken(jwt);
          final String userName = _resolveName(user);
          if (userName.isNotEmpty) {
            await StorageService.setString('user_role', 'facilitator');
            await StorageService.setString('facilitator_name', userName);
          }
          
          // Update AuthProvider to mark user as authenticated
          if (!mounted) return;
          context.read<AuthProvider>().setAuthenticated(jwt);
          
          debugPrint('[FacilitatorLogin] Login successful, navigating to facilitator dashboard');
          context.go('/facilitator-dashboard');
          return;
        }
      }

      debugPrint('[FacilitatorLogin] Invalid response format or no data');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Invalid server response. Please try again.')),
      );
    } catch (e) {
      if (!mounted) return;
      debugPrint('[FacilitatorLogin] Error occurred: $e');
      debugPrint('[FacilitatorLogin] Error type: ${e.runtimeType}');
      final String errorMsg = _friendlyErrorMessage(e);
      debugPrint('[FacilitatorLogin] Friendly error: $errorMsg');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorMsg)),
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  String _resolveName(Map<String, dynamic>? user) {
    if (user == null) return '';
    final String? first = user['firstName']?.toString().trim();
    final String? last = user['lastName']?.toString().trim();
    if (first != null && first.isNotEmpty) {
      return last != null && last.isNotEmpty ? '$first $last' : first;
    }
    return last ?? '';
  }

  String _friendlyErrorMessage(dynamic error) {
    if (error is ApiException) {
      if (error.statusCode == 401) {
        return 'Invalid email or password.';
      }
      if (error.statusCode == 400) {
        return 'Please enter both email and password.';
      }
      if (error.statusCode >= 500) {
        return 'Server error. Please try again later.';
      }
      return error.message;
    }
    return 'Network error. Please check your connection and try again.';
  }

  void _goBackToLogin() {
    context.pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Facilitator Login'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.primaryRed,
        foregroundColor: Colors.white,
      ),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Card(
                elevation: 1,
                color: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: <Widget>[
                        const CircleAvatar(
                          radius: 34,
                          backgroundColor: AppColors.primaryRed,
                          child: Text(
                            'BSU',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 20,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        const Text(
                          'Facilitator Portal',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primaryRed,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Sign in with your facilitator account',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 28),
                        TextFormField(
                          controller: _emailController,
                          decoration: const InputDecoration(
                            labelText: 'Email (Facilitator ID)',
                            border: OutlineInputBorder(),
                            hintText: 'facilitator@batstateu.edu.ph',
                          ),
                          validator: (String? value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your email/ID.';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 14),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: _obscurePassword,
                          decoration: InputDecoration(
                            labelText: 'Password',
                            border: const OutlineInputBorder(),
                            suffixIcon: IconButton(
                              onPressed: () {
                                setState(() {
                                  _obscurePassword = !_obscurePassword;
                                });
                              },
                              icon: Icon(
                                _obscurePassword
                                    ? Icons.visibility_off
                                    : Icons.visibility,
                              ),
                            ),
                          ),
                          validator: (String? value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your password.';
                            }
                            if (value.length < 6) {
                              return 'Password must be at least 6 characters.';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 24),
                        ElevatedButton(
                          onPressed: _isLoading ? null : _onLoginPressed,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryRed,
                            disabledBackgroundColor: Colors.grey,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.white,
                                    ),
                                  ),
                                )
                              : const Text(
                                  'Sign In',
                                  style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                        ),
                        const SizedBox(height: 16),
                        OutlinedButton.icon(
                          onPressed: _isLoading ? null : _goBackToLogin,
                          icon: const Icon(Icons.arrow_back),
                          label: const Text('Back to Student Login'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
