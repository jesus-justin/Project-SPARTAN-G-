import 'api_constants.dart';

class AppStrings {
  AppStrings._();

  static const String appName = 'SPARTAN-G';
  static const String universityName = 'BatStateU-TNEU Lipa Campus';
  static const String portalSubtitle = 'Student Wellbeing Portal';
  static const String tokenKey = 'spartan_jwt_token';
  
  static List<String> get ogcPortalCandidateUrls => ApiConstants.candidateBaseUrls
      .map((String apiBaseUrl) {
        final Uri apiUri = Uri.parse(apiBaseUrl);
        return Uri(
          scheme: apiUri.scheme,
          host: apiUri.host,
          port: 5174,
        ).toString();
      })
      .toList(growable: false);

  static String get ogcPortalLoginUrl => '${ogcPortalCandidateUrls.first}/#/login';

  static String get ogcPortalDashboardUrl => '${ogcPortalCandidateUrls.first}/#/dashboard';
}
