import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';

class RiskBadgeWidget extends StatelessWidget {
  const RiskBadgeWidget({super.key, required this.riskLevel});

  final String riskLevel;

  Color get _riskColor {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return AppColors.riskLow;
      case 'moderate':
        return AppColors.riskModerate;
      case 'high':
        return AppColors.riskHigh;
      case 'crisis':
        return AppColors.riskCrisis;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: _riskColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        riskLevel,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}
