import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/storage_service.dart';
import '../../../core/services/api_service.dart';

class ConsentScreen extends StatefulWidget {
  const ConsentScreen({super.key});

  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool _privacyAgreed = false;
  bool _crisisAgreed = false;

  bool get _canContinue => _privacyAgreed && _crisisAgreed;

  Future<void> _continue() async {
    if (!_canContinue) {
      return;
    }

    final ApiService api = ApiService();
    try {
      await api.post('/student/consent', body: {'accepted': true});
      await StorageService.setBool('consent_given', true);
      if (!mounted) return;
      context.go('/dashboard');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Consent failed: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    const Color sectionRed = Color(0xFFCC0000);

    return Scaffold(
      appBar: AppBar(title: const Text('Informed Consent')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Row(
                      children: <Widget>[
                        Container(
                          width: 48,
                          height: 48,
                          decoration: const BoxDecoration(
                            color: sectionRed,
                            shape: BoxShape.circle,
                          ),
                          child: const Center(
                            child: Text(
                              'BSU',
                              style: TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: <Widget>[
                              Text(
                                'Informed Consent & Data Privacy Notice',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w700,
                                  color: sectionRed,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text('SPARTAN-G Mental Health Support System'),
                              SizedBox(height: 2),
                              Text(
                                'Batangas State University - The National Engineering University, Lipa Campus',
                                style: TextStyle(fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            _sectionCard(
              title: 'Introduction',
              titleColor: sectionRed,
              child: const Text(
                'Batangas State University, The National Engineering University (BatStateU-TNEU) is committed to protecting your right to privacy. This consent form explains how SPARTAN-G collects, uses, and protects your personal and mental health data in compliance with the Data Privacy Act of 2012 (Republic Act No. 10173) and the Family Educational Rights and Privacy Act (FERPA).',
              ),
            ),
            _sectionCard(
              title: 'Data We Collect',
              titleColor: sectionRed,
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  _BulletText('Full name and student ID number'),
                  _BulletText('College, year level, and program'),
                  _BulletText('Mental health assessment responses (DASS-21, PHQ-9, GAD-7, C-SSRS, ESM check-ins)'),
                  _BulletText('Risk classification results and trajectory data'),
                  _BulletText('Safety plan information (if provided)'),
                  _BulletText('Session timestamps and app usage logs'),
                ],
              ),
            ),
            _sectionCard(
              title: 'How Your Data Is Used',
              titleColor: sectionRed,
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  _BulletText('To assess and monitor your mental health and wellbeing'),
                  _BulletText('To generate risk classifications and referral actions'),
                  _BulletText('To provide personalized wellness resources (GINHAWA)'),
                  _BulletText('To notify OGC (Office of Guidance and Counseling) facilitators when intervention is needed'),
                  _BulletText('To generate anonymized population-level wellness reports'),
                  _BulletText('For academic and institutional research purposes only with your separate consent'),
                ],
              ),
            ),
            _sectionCard(
              title: 'How We Protect Your Data',
              titleColor: sectionRed,
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  _BulletText('All data is encrypted in transit using TLS 1.2+'),
                  _BulletText('Mental health records are encrypted at rest (AES-256)'),
                  _BulletText('Your identity is anonymized in OGC notifications EXCEPT in Crisis situations requiring intervention'),
                  _BulletText('Only authorized OGC facilitators can access your data'),
                  _BulletText('Data is stored in a secure institutional database'),
                  _BulletText('Your data will not be sold or shared with third parties'),
                ],
              ),
            ),
            _sectionCard(
              title: 'Your Rights Under the Data Privacy Act of 2012',
              titleColor: sectionRed,
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  _BulletText('Right to be informed about data collection'),
                  _BulletText('Right to access your personal data at any time'),
                  _BulletText('Right to correct inaccurate or outdated data'),
                  _BulletText('Right to object to data processing'),
                  _BulletText('Right to erasure of your personal data'),
                  _BulletText('Right to file a complaint with the National Privacy Commission (NPC) at complaints@privacy.gov.ph'),
                ],
              ),
            ),
            Card(
              color: const Color(0xFFFFE0B2),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Color(0xFFFF9800)),
              ),
              child: const Padding(
                padding: EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    Text(
                      'Important: Crisis Disclosure Policy',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Color(0xFFCC0000),
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'In cases where your assessment indicates a CRISIS risk level, your identity and contact information WILL be disclosed to OGC facilitators and university emergency services to ensure your safety. This disclosure is permitted under RA 10173 as a legitimate purpose to protect vital interests of the data subject.',
                    ),
                  ],
                ),
              ),
            ),
            _sectionCard(
              title: 'Data Protection Officer',
              titleColor: sectionRed,
              child: const Text(
                'For questions about this privacy notice or to exercise your data privacy rights, contact:\n'
                'Office of Guidance and Counseling (OGC)\n'
                'Batangas State University - TNEU Lipa Campus\n'
                'A. Tanco Drive, Brgy. Marawoy, Lipa, Batangas 4217\n'
                'Tel: (+63 43) 980-0385 to 94 loc. 3130\n'
                'Email: cics.lipa@g.batstate-u.edu.ph',
              ),
            ),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    const Text(
                      'Consent Confirmation',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        color: sectionRed,
                      ),
                    ),
                    const SizedBox(height: 8),
                    CheckboxListTile(
                      value: _privacyAgreed,
                      onChanged: (bool? value) {
                        setState(() {
                          _privacyAgreed = value ?? false;
                        });
                      },
                      activeColor: sectionRed,
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      title: const Text(
                        'I have read and understood the Data Privacy Notice above. I give my informed consent for SPARTAN-G to collect and process my personal and mental health data for the purposes described above.',
                      ),
                    ),
                    CheckboxListTile(
                      value: _crisisAgreed,
                      onChanged: (bool? value) {
                        setState(() {
                          _crisisAgreed = value ?? false;
                        });
                      },
                      activeColor: sectionRed,
                      contentPadding: EdgeInsets.zero,
                      controlAffinity: ListTileControlAffinity.leading,
                      title: const Text(
                        'I understand that in a Crisis situation, my identity may be disclosed to OGC facilitators and emergency services for my safety.',
                      ),
                    ),
                    const SizedBox(height: 8),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        style: FilledButton.styleFrom(
                          backgroundColor: _canContinue ? const Color(0xFFCC0000) : Colors.grey,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: _canContinue ? _continue : null,
                        child: const Text('Continue'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const <Widget>[
                    Text(
                      'This consent can be withdrawn at any time by contacting the OGC. Withdrawal of consent will not affect data already processed.',
                    ),
                    SizedBox(height: 8),
                    Text(
                      'SPARTAN-G v2.0 | BatStateU-TNEU Lipa Campus | In compliance with RA 10173',
                      style: TextStyle(fontSize: 12, color: Colors.black54),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionCard({
    required String title,
    required Color titleColor,
    required Widget child,
  }) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              title,
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: titleColor,
              ),
            ),
            const SizedBox(height: 8),
            child,
          ],
        ),
      ),
    );
  }
}

class _BulletText extends StatelessWidget {
  const _BulletText(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const Text('- '),
          Expanded(child: Text(text)),
        ],
      ),
    );
  }
}
