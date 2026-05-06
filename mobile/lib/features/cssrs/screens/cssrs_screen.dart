import 'package:flutter/material.dart';

class CssrsScreen extends StatelessWidget {
  const CssrsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('C-SSRS Lite')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'C-SSRS Lite screen is initialized and ready for questionnaire integration.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
