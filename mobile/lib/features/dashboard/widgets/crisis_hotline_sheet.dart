import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';

class CrisisHotlineSheet extends StatelessWidget {
  const CrisisHotlineSheet({super.key});

  static Future<void> show(BuildContext context) async {
    await showModalBottomSheet<void>(
      context: context,
      isDismissible: false,
      enableDrag: false,
      showDragHandle: false,
      backgroundColor: Colors.white,
      builder: (BuildContext context) => const PopScope(
        canPop: false,
        child: CrisisHotlineSheet(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: <Widget>[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              decoration: const BoxDecoration(
                color: AppColors.primaryRed,
                borderRadius: BorderRadius.vertical(top: Radius.circular(12)),
              ),
              child: const Text(
                'You are not alone. Please reach out immediately.',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: const Color(0xFFD1D5DB)),
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(12)),
              ),
              child: Column(
                children: <Widget>[
                  ListTile(
                    leading: const Icon(Icons.call, color: AppColors.primaryRed),
                    title: const Text('NCMH Hotline'),
                    subtitle: const Text('1553'),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Call NCMH: 1553')),
                      );
                    },
                  ),
                  const Divider(height: 1),
                  ListTile(
                    leading: const Icon(Icons.call, color: AppColors.primaryRed),
                    title: const Text('Hopeline PH'),
                    subtitle: const Text('+63 917 558 4673'),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Call Hopeline PH: +63 917 558 4673')),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.primaryRed,
                foregroundColor: Colors.white,
                minimumSize: const Size.fromHeight(48),
              ),
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('I will contact them'),
            ),
          ],
        ),
      ),
    );
  }
}
