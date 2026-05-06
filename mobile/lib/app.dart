import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'core/constants/app_colors.dart';
import 'core/constants/app_strings.dart';
import 'core/providers/auth_provider.dart';
import 'core/services/api_service.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/signup_screen.dart';
import 'features/consent/screens/consent_screen.dart';
import 'features/cssrs/screens/cssrs_screen.dart';
import 'features/dashboard/screens/dashboard_screen.dart';
import 'features/dass21/screens/dass21_screen.dart';
import 'features/esm/screens/esm_checkin_screen.dart';

class SpartanGApp extends StatefulWidget {
  const SpartanGApp({super.key});

  @override
  State<SpartanGApp> createState() => _SpartanGAppState();
}

class _SpartanGAppState extends State<SpartanGApp> {
  late final AuthProvider _authProvider;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();

    _authProvider = AuthProvider(
      apiService: ApiService(
        onUnauthorized: () {
          _authProvider.logout();
          if (mounted) {
            _router.go('/login');
          }
        },
      ),
    );

    _router = GoRouter(
      initialLocation: '/',
      refreshListenable: _authProvider,
      redirect: (BuildContext context, GoRouterState state) {
        final bool authenticated = _authProvider.isAuthenticated;
        final String location = state.matchedLocation;
        final bool authRoute = location == '/login' || location == '/signup';

        if (!authenticated && !authRoute) {
          return '/login';
        }

        if (authenticated && authRoute) {
          return '/dashboard';
        }

        if (location == '/') {
          return authenticated ? '/dashboard' : '/login';
        }

        return null;
      },
      routes: <RouteBase>[
        GoRoute(
          path: '/',
          builder: (BuildContext context, GoRouterState state) => const SizedBox.shrink(),
        ),
        GoRoute(
          path: '/login',
          builder: (BuildContext context, GoRouterState state) => const LoginScreen(),
        ),
        GoRoute(
          path: '/signup',
          builder: (BuildContext context, GoRouterState state) => const SignupScreen(),
        ),
        GoRoute(
          path: '/consent',
          builder: (BuildContext context, GoRouterState state) => const ConsentScreen(),
        ),
        GoRoute(
          path: '/dass21',
          builder: (BuildContext context, GoRouterState state) => const Dass21Screen(),
        ),
        GoRoute(
          path: '/cssrs',
          builder: (BuildContext context, GoRouterState state) => const CssrsScreen(),
        ),
        GoRoute(
          path: '/esm',
          builder: (BuildContext context, GoRouterState state) => const EsmCheckinScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (BuildContext context, GoRouterState state) => const DashboardScreen(),
        ),
      ],
    );

    _authProvider.initialize();
  }

  @override
  void dispose() {
    _router.dispose();
    _authProvider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider<AuthProvider>.value(
      value: _authProvider,
      child: MaterialApp.router(
        title: AppStrings.appName,
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: AppColors.primaryRed,
            primary: AppColors.primaryRed,
          ),
          scaffoldBackgroundColor: AppColors.background,
          useMaterial3: true,
        ),
        routerConfig: _router,
      ),
    );
  }
}
