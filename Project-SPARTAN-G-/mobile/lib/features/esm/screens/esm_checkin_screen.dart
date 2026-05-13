import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/api_service.dart';

class EsmCheckinScreen extends StatefulWidget {
  const EsmCheckinScreen({super.key});

  @override
  State<EsmCheckinScreen> createState() => _EsmCheckinScreenState();
}

class _EsmCheckinScreenState extends State<EsmCheckinScreen> {
  double _mood = 5;
  double _energy = 5;
  String _stressor = 'None';
  bool _physicalSymptoms = false;
  bool _helpIntent = false;
  bool _submitting = false;

  final List<String> _stressors = <String>['None', 'Academic', 'Family', 'Relationship', 'Health', 'Other'];

  Future<void> _showExitDialog() async {
    await showDialog<void>(
      context: context,
      builder: (BuildContext ctx) => AlertDialog(
        title: const Text('Exit Assessment?'),
        content: const Text(
          'Your progress will not be saved. Are you sure you want to exit?',
        ),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Continue Assessment'),
          ),
          TextButton(
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFFCC0000),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              context.go('/dashboard');
            },
            child: const Text('Exit'),
          ),
        ],
      ),
    );
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final ApiService api = ApiService();
      await api.post('/assessments/esm/submit', body: {
        'mood': _mood.toInt(),
        'energy': _energy.toInt(),
        'stressor': _stressor,
        'physicalSymptoms': _physicalSymptoms,
        'helpIntent': _helpIntent,
      });

      if (!mounted) return;
      await showDialog<void>(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext ctx) => AlertDialog(
          title: const Text('Assessment Complete'),
          content: const Column(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Icon(Icons.check_circle, color: Colors.green, size: 48),
              SizedBox(height: 16),
              Text('Your responses have been submitted.'),
              SizedBox(height: 8),
              Text('Risk Level: Not evaluated in ESM check-in'),
            ],
          ),
          actions: <Widget>[
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFCC0000),
              ),
              onPressed: () {
                Navigator.pop(ctx);
                context.go('/dashboard');
              },
              child: const Text(
                'Go to Dashboard',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Submission failed: $e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvoked: (bool didPop) {
        if (!didPop) {
          _showExitDialog();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('ESM Daily Check-in'),
          leading: IconButton(
            icon: const Icon(Icons.home),
            tooltip: 'Back to Dashboard',
            onPressed: () => context.go('/dashboard'),
          ),
          actions: <Widget>[
            TextButton(
              onPressed: _showExitDialog,
              child: const Text(
                'Exit',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        ),
        body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Text('Mood (1-10)'),
              Slider(value: _mood, min: 1, max: 10, divisions: 9, label: _mood.toInt().toString(), onChanged: (v) => setState(() => _mood = v)),
              const SizedBox(height: 8),
              const Text('Energy (1-10)'),
              Slider(value: _energy, min: 1, max: 10, divisions: 9, label: _energy.toInt().toString(), onChanged: (v) => setState(() => _energy = v)),
              const SizedBox(height: 8),
              const Text('Primary Stressor'),
              DropdownButton<String>(
                value: _stressor,
                items: _stressors.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                onChanged: (v) => setState(() => _stressor = v ?? 'None'),
              ),
              const SizedBox(height: 8),
              Row(
                children: <Widget>[
                  const Text('Physical symptoms'),
                  const SizedBox(width: 8),
                  Switch(value: _physicalSymptoms, onChanged: (v) => setState(() => _physicalSymptoms = v)),
                ],
              ),
              Row(
                children: <Widget>[
                  const Text('Help intent (want help)'),
                  const SizedBox(width: 8),
                  Switch(value: _helpIntent, onChanged: (v) => setState(() => _helpIntent = v)),
                ],
              ),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _submitting ? null : _submit,
                  child: _submitting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator()) : const Text('Submit Check-in'),
                ),
              ),
            ],
          ),
        ),
        ),
      ),
    );
  }
}
