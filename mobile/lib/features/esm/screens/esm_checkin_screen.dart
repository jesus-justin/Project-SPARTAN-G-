import 'package:flutter/material.dart';

class EsmCheckinScreen extends StatelessWidget {
  const EsmCheckinScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ESM Daily Check-in')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            'ESM check-in screen is initialized and ready for daily mood/energy submission.',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
