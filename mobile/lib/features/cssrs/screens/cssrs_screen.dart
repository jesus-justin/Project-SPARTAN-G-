import 'package:flutter/material.dart';

import '../../../core/services/api_service.dart';
import '../../dashboard/widgets/crisis_hotline_sheet.dart';

class CssrsScreen extends StatefulWidget {
  const CssrsScreen({super.key});

  @override
  State<CssrsScreen> createState() => _CssrsScreenState();
}

class _CssrsScreenState extends State<CssrsScreen> {
  bool? q1;
  bool? q2;
  bool? q3;
  bool _submitting = false;

  Future<void> _submit() async {
    setState(() => _submitting = true);
    try {
      final ApiService api = ApiService();
      final resp = await api.post('/assessments/cssrs/submit', body: {
        'q1': q1 == true,
        'q2': q2 == true,
        'q3': q3 == true,
      });

      if (!mounted) return;
      if (q3 == true) {
        CrisisHotlineSheet.show(context);
      }

      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('C-SSRS submitted')));
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Submission failed: $e')));
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Widget _boolToggle(String label, bool? value, ValueChanged<bool?> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
        Row(
          children: <Widget>[
            ChoiceChip(
              label: const Text('Yes'),
              selected: value == true,
              onSelected: (v) => onChanged(v ? true : false),
            ),
            const SizedBox(width: 8),
            ChoiceChip(
              label: const Text('No'),
              selected: value == false,
              onSelected: (v) => onChanged(v ? false : true),
            ),
          ],
        ),
        const SizedBox(height: 12),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('C-SSRS Lite')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const Text('1) In the past month, have you wished you were dead?', style: TextStyle(fontSize: 16)),
              const SizedBox(height: 8),
              _boolToggle('Answer', q1, (v) => setState(() => q1 = v)),
              const SizedBox(height: 8),
              const Text('2) In the past month, have you had thoughts of harming yourself?', style: TextStyle(fontSize: 16)),
              const SizedBox(height: 8),
              _boolToggle('Answer', q2, (v) => setState(() => q2 = v)),
              const SizedBox(height: 8),
              const Text('3) Have you ever attempted to harm yourself?', style: TextStyle(fontSize: 16)),
              const SizedBox(height: 8),
              _boolToggle('Answer', q3, (v) => setState(() => q3 = v)),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: (q1 != null && q2 != null && q3 != null && !_submitting) ? _submit : null,
                  child: _submitting ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator()) : const Text('Submit'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
