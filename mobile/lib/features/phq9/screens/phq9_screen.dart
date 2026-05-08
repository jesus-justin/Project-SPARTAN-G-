import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/services/api_service.dart';
import '../../dashboard/widgets/crisis_hotline_sheet.dart';

class Phq9Screen extends StatefulWidget {
  const Phq9Screen({super.key});

  @override
  State<Phq9Screen> createState() => _Phq9ScreenState();
}

class _Phq9ScreenState extends State<Phq9Screen> {
  static const List<String> _options = <String>[
    'Not at all',
    'Several days',
    'More than half the days',
    'Nearly every day',
  ];

  List<Map<String, dynamic>> _questions = <Map<String, dynamic>>[];

  int _currentIndex = 0;
  List<int?> _answers = List<int?>.filled(9, null);

  int get _answeredCount => _answers.whereType<int>().length;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    try {
      final ApiService api = ApiService();
      final dynamic resp = await api.get('/assessments/phq9/questions');
      if (resp is Map<String, dynamic> && resp['data'] is List) {
        final List<dynamic> q = resp['data'];
        setState(() {
          _questions = q.map((e) => Map<String, dynamic>.from(e as Map)).toList();
          _answers = List<int?>.filled(_questions.length, null);
        });
      }
    } catch (_) {
      // keep defaults
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_questions.isEmpty) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('PHQ-9'),
          leading: IconButton(
            onPressed: () => context.pop(),
            icon: const Icon(Icons.arrow_back),
          ),
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final bool isLast = _currentIndex == _questions.length - 1;
    final int? selectedAnswer = _answers[_currentIndex];
    final Map<String, dynamic> question = _questions[_currentIndex];
    final String questionText = question['text'] as String? ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('PHQ-9 Depression Screening'),
        leading: IconButton(
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                'Question ${_currentIndex + 1} of 9',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: (_currentIndex + 1) / 9,
                color: AppColors.primaryRed,
                backgroundColor: const Color(0xFFE5E7EB),
              ),
              const SizedBox(height: 20),
              Text(
                questionText,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
              ),
              const SizedBox(height: 14),
              Expanded(
                child: ListView.builder(
                  itemCount: _options.length,
                  itemBuilder: (BuildContext context, int index) {
                    return RadioListTile<int>(
                      value: index,
                      groupValue: selectedAnswer,
                      activeColor: AppColors.primaryRed,
                      title: Text(_options[index]),
                      onChanged: (int? value) {
                        setState(() {
                          _answers[_currentIndex] = value;
                        });
                      },
                    );
                  },
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: <Widget>[
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _currentIndex == 0
                          ? null
                          : () {
                              setState(() {
                                _currentIndex -= 1;
                              });
                            },
                      child: const Text('Previous'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primaryRed,
                        foregroundColor: Colors.white,
                      ),
                      onPressed: selectedAnswer == null
                          ? null
                          : () {
                              if (isLast) {
                                _submitAssessment(context);
                                return;
                              }
                              setState(() {
                                _currentIndex += 1;
                              });
                            },
                      child: Text(isLast ? 'Submit' : 'Next'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Answered: $_answeredCount / 9',
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitAssessment(BuildContext context) async {
    final List<int> answers = _answers.map((e) => e ?? 0).cast<int>().toList();
    try {
      final ApiService api = ApiService();
      final dynamic resp = await api.post('/assessments/phq9', body: {'answers': answers});
      if (!mounted) return;
      if (resp is Map<String, dynamic> && resp['data'] != null) {
        final String severity = resp['data']['scoring']?['severity']?.toString() ?? 'Unknown';
        final int totalScore = resp['data']['scoring']?['totalScore'] as int? ?? 0;
        final String risk = resp['data']['riskLevel']?.toString() ?? 'Unknown';

        showDialog<void>(
          context: context,
          builder: (BuildContext context) {
            return AlertDialog(
              title: const Text('PHQ-9 Result'),
              content: Text('Severity: $severity\nTotal Score: $totalScore\nRisk Level: $risk'),
              actions: <Widget>[
                TextButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                    if (risk == 'Crisis') {
                      CrisisHotlineSheet.show(context);
                    }
                    context.go('/gad7');
                  },
                  child: const Text('Next: GAD-7'),
                ),
              ],
            );
          },
        );
        return;
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Submission failed: $e')));
    }
  }
}
