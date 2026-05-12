class AppStrings {
  AppStrings._();

  static const String appName = 'SPARTAN-G';
  static const String universityName = 'BatStateU-TNEU Lipa Campus';
  static const String portalSubtitle = 'Student Wellbeing Portal';
  static const String tokenKey = 'spartan_jwt_token';
  
  // OGC Portal URL (use 10.0.2.2 for Android emulator, localhost for iOS simulator, actual host IP for physical devices)
  // For physical device use local IP (detected 192.168.1.5). Update as needed.
  static const String ogcPortalLoginUrl = 'http://192.168.1.5:5174/#/login';
  static const String ogcPortalDashboardUrl = 'http://192.168.1.5:5174/#/dashboard';
}
