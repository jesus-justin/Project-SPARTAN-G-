import 'package:flutter/material.dart';

class SafetyPlanForm extends StatefulWidget {
  final String warningSigns;
  final String copingStrategies;
  final String socialSupports;
  final String professionalContacts;
  final String safeEnvironment;
  final String reasonsToLive;
  final String emergencyContacts;
  final Function(Map<String, String>) onSave;

  const SafetyPlanForm({
    required this.warningSigns,
    required this.copingStrategies,
    required this.socialSupports,
    required this.professionalContacts,
    required this.safeEnvironment,
    required this.reasonsToLive,
    required this.emergencyContacts,
    required this.onSave,
    super.key,
  });

  @override
  State<SafetyPlanForm> createState() => _SafetyPlanFormState();
}

class _SafetyPlanFormState extends State<SafetyPlanForm> {
  late TextEditingController _warningCtrl;
  late TextEditingController _copingCtrl;
  late TextEditingController _socialCtrl;
  late TextEditingController _professionalCtrl;
  late TextEditingController _safeCtrl;
  late TextEditingController _reasonsCtrl;
  late TextEditingController _emergencyCtrl;

  @override
  void initState() {
    super.initState();
    _warningCtrl = TextEditingController(text: widget.warningSigns);
    _copingCtrl = TextEditingController(text: widget.copingStrategies);
    _socialCtrl = TextEditingController(text: widget.socialSupports);
    _professionalCtrl = TextEditingController(text: widget.professionalContacts);
    _safeCtrl = TextEditingController(text: widget.safeEnvironment);
    _reasonsCtrl = TextEditingController(text: widget.reasonsToLive);
    _emergencyCtrl = TextEditingController(text: widget.emergencyContacts);
  }

  @override
  void dispose() {
    _warningCtrl.dispose();
    _copingCtrl.dispose();
    _socialCtrl.dispose();
    _professionalCtrl.dispose();
    _safeCtrl.dispose();
    _reasonsCtrl.dispose();
    _emergencyCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            _buildSection(
              'Warning Signs',
              'What are your personal warning signs that a crisis might be developing?',
              _warningCtrl,
            ),
            const SizedBox(height: 16),
            _buildSection(
              'Coping Strategies',
              'What internal coping strategies can you use?',
              _copingCtrl,
            ),
            const SizedBox(height: 16),
            _buildSection(
              'Social Supports',
              'Who are people you can ask for help?',
              _socialCtrl,
            ),
            const SizedBox(height: 16),
            _buildSection(
              'Professional Contacts',
              'Mental health professionals or agencies you can contact',
              _professionalCtrl,
            ),
            const SizedBox(height: 16),
            _buildSection(
              'Safe Environment',
              'How can you make your environment safer?',
              _safeCtrl,
            ),
            const SizedBox(height: 16),
            _buildSection(
              'Reasons to Live',
              'What reasons do you have for living?',
              _reasonsCtrl,
            ),
            const SizedBox(height: 16),
            _buildSection(
              'Emergency Contacts',
              'Emergency services to call in crisis',
              _emergencyCtrl,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                ),
                onPressed: () {
                  widget.onSave({
                    'warningSigns': _warningCtrl.text,
                    'copingStrategies': _copingCtrl.text,
                    'socialSupports': _socialCtrl.text,
                    'professionalContacts': _professionalCtrl.text,
                    'safeEnvironment': _safeCtrl.text,
                    'reasonsToLive': _reasonsCtrl.text,
                    'emergencyContacts': _emergencyCtrl.text,
                  });
                },
                child: const Text('Save Safety Plan'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String hint, TextEditingController ctrl) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: ctrl,
          maxLines: 4,
          decoration: InputDecoration(
            hintText: hint,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ],
    );
  }
}
