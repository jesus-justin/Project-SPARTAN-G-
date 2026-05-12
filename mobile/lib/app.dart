import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'core/constants/app_colors.dart';
import 'core/constants/app_strings.dart';
import 'core/providers/auth_provider.dart';
import 'core/services/api_service.dart';
import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/signup_screen.dart';
import 'features/auth/screens/facilitator_login_webview.dart';
import 'features/consent/screens/consent_screen.dart';
import 'features/dashboard/screens/dashboard_screen.dart';
import 'features/dass21/screens/dass21_screen.dart';
import 'features/esm/screens/esm_checkin_screen.dart';
import 'features/phq9/screens/phq9_screen.dart';
import 'features/gad7/screens/gad7_screen.dart';
import 'features/ginhawa/screens/ginhawa_home_screen.dart';
import 'features/ginhawa/screens/content_detail_screen.dart';
import 'features/ginhawa/screens/safety_plan_screen.dart';

class SpartanGApp extends StatefulWidget {
  const SpartanGApp({super.key, this.authProvider});

  final AuthProvider? authProvider;

  @override
  State<SpartanGApp> createState() => _SpartanGAppState();
}

class _SpartanGAppState extends State<SpartanGApp> {
  late final AuthProvider _authProvider;
  late final GoRouter _router;
  late final bool _ownsAuthProvider;

  @override
  void initState() {
    super.initState();

    _ownsAuthProvider = widget.authProvider == null;
    _authProvider = widget.authProvider ?? AuthProvider(
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
        if (_authProvider.isLoading) {
          return null;
        }

        final bool authenticated = _authProvider.isAuthenticated;
        final String location = state.uri.path;
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
          path: '/facilitator-login',
          builder: (BuildContext context, GoRouterState state) => const FacilitatorLoginWebView(),
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
          path: '/esm',
          builder: (BuildContext context, GoRouterState state) => const EsmCheckinScreen(),
        ),
        GoRoute(
          path: '/dashboard',
          builder: (BuildContext context, GoRouterState state) => const DashboardScreen(),
        ),
        GoRoute(
          path: '/phq9',
          builder: (BuildContext context, GoRouterState state) => const Phq9Screen(),
        ),
        GoRoute(
          path: '/gad7',
          builder: (BuildContext context, GoRouterState state) => const Gad7Screen(),
        ),
        GoRoute(
          path: '/ginhawa',
          builder: (BuildContext context, GoRouterState state) => const GinhawaHomeScreen(),
        ),
        GoRoute(
          path: '/ginhawa/content/:id',
          builder: (BuildContext context, GoRouterState state) {
            final String id = state.pathParameters['id'] ?? '';
            return ContentDetailScreen(contentId: id);
          },
        ),
        GoRoute(
          path: '/ginhawa/safety-plan',
          builder: (BuildContext context, GoRouterState state) => const SafetyPlanScreen(),
        ),
      ],
    );

    if (_ownsAuthProvider) {
      _authProvider.initialize();
    }
  }

  @override
  void dispose() {
    _router.dispose();
    _authProvider.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
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
    );
  }
}
