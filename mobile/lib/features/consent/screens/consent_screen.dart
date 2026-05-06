import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/services/storage_service.dart';

class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key});

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool _agreed = false;

  Future<void> _continue() async {
    if (!_agreed) {
      return;
    }
    await StorageService.setBool('consent_given', true);
    if (!mounted) {
      return;
    }
    context.go('/dashboard');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Informed Consent')),
      body: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            const Text(
              'Before you continue, please review and confirm your consent to participate in SPARTAN-G assessments and wellbeing check-ins.',
            ),
            const SizedBox(height: 18),
            CheckboxListTile(
              value: _agreed,
              onChanged: (bool? value) {
                setState(() {
                  _agreed = value ?? false;
                });
              },
              activeColor: AppColors.primaryRed,
              title: const Text('I have read and agree to the consent statement.'),
              contentPadding: EdgeInsets.zero,
            ),
            const Spacer(),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primaryRed,
                  foregroundColor: Colors.white,
                ),
                onPressed: _agreed ? _continue : null,
                child: const Text('Continue'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
