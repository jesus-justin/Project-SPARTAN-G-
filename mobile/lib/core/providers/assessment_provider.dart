import 'package:flutter/foundation.dart';

class AssessmentProvider extends ChangeNotifier {
  String _riskLevel = 'Low';

  String get riskLevel => _riskLevel;

  void setRiskLevel(String value) {
    _riskLevel = value;
    notifyListeners();
  }
}
