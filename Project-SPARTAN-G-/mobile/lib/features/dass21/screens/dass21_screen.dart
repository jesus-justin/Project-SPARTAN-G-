import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/services/api_service.dart';

class Dass21Screen extends StatefulWidget {
  const Dass21Screen({super.key});

  @override
  State<Dass21Screen> createState() => _Dass21ScreenState();
}

class _Dass21ScreenState extends State<Dass21Screen> {
  static const List<String> _options = <String>[
    'Did not apply to me at all',
    'Applied to me to some degree',
    'Applied to me to a considerable degree',
    'Applied to me very much or most of the time',
  ];

  List<String> _questions = <String>[];

  int _currentIndex = 0;
  List<int?> _answers = List<int?>.filled(21, null);

  int get _answeredCount => _answers.whereType<int>().length;

  @override
  void initState() {
    super.initState();
    _loadQuestions();
  }

  Future<void> _loadQuestions() async {
    try {
      final ApiService api = ApiService();
      final dynamic resp = await api.get('/assessments/dass21/questions');
      if (resp is Map<String, dynamic> && resp['data'] is List) {
        final List<dynamic> q = resp['data'];
        setState(() {
          _questions = q.map((e) => e.toString()).toList();
          _answers = List<int?>.filled(_questions.length, null);
        });
      }
    } catch (_) {
      // keep defaults
    }
  }

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

  @override
  Widget build(BuildContext context) {
    if (_questions.isEmpty) {
      return PopScope(
        canPop: false,
        onPopInvoked: (bool didPop) {
          if (!didPop) {
            _showExitDialog();
          }
        },
        child: Scaffold(
          appBar: AppBar(
            title: const Text('DASS-21'),
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
          body: const Center(child: CircularProgressIndicator()),
        ),
      );
    }

    final bool isLast = _currentIndex == _questions.length - 1;
    final int? selectedAnswer = _answers[_currentIndex];

    return PopScope(
      canPop: false,
      onPopInvoked: (bool didPop) {
        if (!didPop) {
          _showExitDialog();
        }
      },
      child: Scaffold(
        appBar: AppBar(
          title: const Text('DASS-21'),
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
              Text(
                'Question ${_currentIndex + 1} of 21',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              LinearProgressIndicator(
                value: (_currentIndex + 1) / 21,
                color: AppColors.primaryRed,
                backgroundColor: const Color(0xFFE5E7EB),
              ),
              const SizedBox(height: 20),
              Text(
                _questions[_currentIndex],
                style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
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
                      title: Text('$index = ${_options[index]}'),
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
                'Answered: $_answeredCount / 21',
                style: const TextStyle(color: AppColors.textSecondary),
              ),
            ],
          ),
        ),
        ),
      ),
    );
  }

  Future<void> _submitAssessment(BuildContext context) async {
    final List<int> answers = _answers.map((e) => e ?? 0).cast<int>().toList();
    try {
      final ApiService api = ApiService();
      final dynamic resp = await api.post('/assessments/dass21', body: {'answers': answers});
      if (!mounted) return;
      if (resp is Map<String, dynamic> && resp['data'] != null) {
        final String riskLevel = resp['data']['riskLevel']?.toString() ?? resp['data']['risk_level']?.toString() ?? 'Unknown';
        await showDialog<void>(
          context: context,
          barrierDismissible: false,
          builder: (BuildContext ctx) => AlertDialog(
            title: const Text('Assessment Complete'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: <Widget>[
                const Icon(Icons.check_circle, color: Colors.green, size: 48),
                const SizedBox(height: 16),
                const Text('Your responses have been submitted.'),
                const SizedBox(height: 8),
                Text('Risk Level: $riskLevel'),
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
        return;
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Submission failed: $e')));
    }
  }
}
