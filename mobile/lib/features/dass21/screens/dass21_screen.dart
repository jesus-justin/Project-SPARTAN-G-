import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../core/constants/app_colors.dart';

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

  static const List<String> _questions = <String>[
    'I found it hard to wind down.',
    'I was aware of dryness of my mouth.',
    'I could not seem to experience any positive feeling at all.',
    'I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion).',
    'I found it difficult to work up the initiative to do things.',
    'I tended to over-react to situations.',
    'I experienced trembling (e.g. in the hands).',
    'I felt that I was using a lot of nervous energy.',
    'I was worried about situations in which I might panic and make a fool of myself.',
    'I felt that I had nothing to look forward to.',
    'I found myself getting agitated.',
    'I found it difficult to relax.',
    'I felt down-hearted and blue.',
    'I was intolerant of anything that kept me from getting on with what I was doing.',
    'I felt I was close to panic.',
    'I was unable to become enthusiastic about anything.',
    'I felt I was not worth much as a person.',
    'I felt that I was rather touchy.',
    'I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat).',
    'I felt scared without any good reason.',
    'I felt that life was meaningless.',
  ];

  int _currentIndex = 0;
  final List<int?> _answers = List<int?>.filled(21, null);

  int get _answeredCount => _answers.whereType<int>().length;

  @override
  Widget build(BuildContext context) {
    final bool isLast = _currentIndex == _questions.length - 1;
    final int? selectedAnswer = _answers[_currentIndex];

    return Scaffold(
      appBar: AppBar(
        title: const Text('DASS-21'),
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
    );
  }

  void _submitAssessment(BuildContext context) {
    final int score = _answers.whereType<int>().fold<int>(0, (int sum, int item) => sum + item);
    showDialog<void>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('DASS-21 Submitted'),
          content: Text('Your response has been recorded. Raw score: $score'),
          actions: <Widget>[
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
                context.go('/dashboard');
              },
              child: const Text('Return to Dashboard'),
            ),
          ],
        );
      },
    );
  }
}
