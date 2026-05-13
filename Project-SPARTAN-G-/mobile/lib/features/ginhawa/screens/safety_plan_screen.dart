import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/api_service.dart';
import '../widgets/safety_plan_form.dart';

class SafetyPlanScreen extends StatefulWidget {
  const SafetyPlanScreen({super.key});

  @override
  State<SafetyPlanScreen> createState() => _SafetyPlanScreenState();
}

class _SafetyPlanScreenState extends State<SafetyPlanScreen> {
  Map<String, String> _plan = {};
  bool _isLoading = true;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _loadPlan();
  }

  Future<void> _loadPlan() async {
    try {
      final ApiService api = ApiService();
      final dynamic resp = await api.get('/ginhawa/safety-plan');
      if (resp is Map<String, dynamic> && resp['data'] != null) {
        final Map<String, dynamic> data = resp['data'] as Map<String, dynamic>;
        setState(() {
          _plan = {
            'warningSigns': data['warningSigns'] as String? ?? '',
            'copingStrategies': data['copingStrategies'] as String? ?? '',
            'socialSupports': data['socialSupports'] as String? ?? '',
            'professionalContacts': data['professionalContacts'] as String? ?? '',
            'safeEnvironment': data['safeEnvironment'] as String? ?? '',
            'reasonsToLive': data['reasonsToLive'] as String? ?? '',
            'emergencyContacts': data['emergencyContacts'] as String? ?? '',
          };
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load safety plan: $e')),
        );
      }
    }
  }

  Future<void> _savePlan(Map<String, String> planData) async {
    setState(() => _isSaving = true);
    try {
      final ApiService api = ApiService();
      final Map<String, dynamic> body = {
        'warningSigns': planData['warningSigns'],
        'copingStrategies': planData['copingStrategies'],
        'socialSupports': planData['socialSupports'],
        'professionalContacts': planData['professionalContacts'],
        'safeEnvironment': planData['safeEnvironment'],
        'reasonsToLive': planData['reasonsToLive'],
        'emergencyContacts': planData['emergencyContacts'],
      };
      await api.post('/ginhawa/safety-plan', body: body);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Safety plan saved successfully')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to save safety plan: $e')),
        );
      }
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Safety Plan'),
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Stack(
              children: <Widget>[
                SafetyPlanForm(
                  warningSigns: _plan['warningSigns'] ?? '',
                  copingStrategies: _plan['copingStrategies'] ?? '',
                  socialSupports: _plan['socialSupports'] ?? '',
                  professionalContacts: _plan['professionalContacts'] ?? '',
                  safeEnvironment: _plan['safeEnvironment'] ?? '',
                  reasonsToLive: _plan['reasonsToLive'] ?? '',
                  emergencyContacts: _plan['emergencyContacts'] ?? '',
                  onSave: _savePlan,
                ),
                if (_isSaving)
                  Positioned.fill(
                    child: Container(
                      color: Colors.black.withOpacity(0.3),
                      child: const Center(
                        child: CircularProgressIndicator(),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}
