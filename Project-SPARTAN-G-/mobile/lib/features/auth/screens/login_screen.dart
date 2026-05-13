import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/services/storage_service.dart';
import '../../../core/services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _studentIdController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _studentIdController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _onLoginPressed() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final AuthProvider authProvider = context.read<AuthProvider>();
    final bool ok = await authProvider.login(
      studentId: _studentIdController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) {
      return;
    }

    if (ok) {
      // Fetch dashboard to check consentFlag from server
      final ApiService api = ApiService();
      try {
        final dynamic dash = await api.get('/student/dashboard');
        final bool consentFlag = dash is Map<String, dynamic> && dash['data'] != null ? dash['data']['consentFlag'] == true : false;
        if (!mounted) {
          return;
        }
        context.go(consentFlag ? '/dashboard' : '/consent');
        return;
      } catch (_) {
        // fallback to local stored flag
        final bool consentGiven = await StorageService.getBool('consent_given') ?? false;
        if (!mounted) {
          return;
        }
        context.go(consentGiven ? '/dashboard' : '/consent');
        return;
      }
    }

    final String message = (authProvider.errorMessage != null && authProvider.errorMessage!.trim().isNotEmpty)
        ? authProvider.errorMessage!.trim()
        : 'Unable to log in. Please try again.';
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
                          AppStrings.appName,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 30,
                            fontWeight: FontWeight.w800,
                            color: AppColors.primaryRed,
                          ),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          AppStrings.portalSubtitle,
                          textAlign: TextAlign.center,
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 28),
                        TextFormField(
                          controller: _studentIdController,
                          decoration: const InputDecoration(
                            labelText: 'Student ID',
                            border: OutlineInputBorder(),
                          ),
                          validator: (String? value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Please enter your Student ID.';
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
                                _obscurePassword ? Icons.visibility : Icons.visibility_off,
                              ),
                            ),
                          ),
                          validator: (String? value) {
                            if (value == null || value.isEmpty) {
                              return 'Please enter your password.';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 18),
                        Consumer<AuthProvider>(
                          builder: (BuildContext context, AuthProvider auth, Widget? child) {
                            return SizedBox(
                              height: 50,
                              child: FilledButton(
                                style: FilledButton.styleFrom(
                                  backgroundColor: AppColors.primaryRed,
                                  foregroundColor: Colors.white,
                                ),
                                onPressed: auth.isLoading ? null : _onLoginPressed,
                                child: auth.isLoading
                                    ? const SizedBox(
                                        width: 22,
                                        height: 22,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : const Text('Login'),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            TextButton(
                              onPressed: () => context.push('/signup'),
                              child: const Text("Don't have an account? Sign Up"),
                            ),
                            const SizedBox(height: 6),
                            SizedBox(
                              height: 44,
                              child: OutlinedButton(
                                onPressed: _openFacilitatorLogin,
                                style: OutlinedButton.styleFrom(
                                  side: BorderSide.none,
                                  padding: const EdgeInsets.symmetric(horizontal: 8),
                                  foregroundColor: AppColors.primaryRed,
                                ),
                                child: const Text('Facilitator Login?'),
                              ),
                            ),
                          ],
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

  Future<void> _openFacilitatorLogin() async {
    debugPrint('Opening facilitator login from LoginScreen');
    context.push('/facilitator-login');
  }
}
