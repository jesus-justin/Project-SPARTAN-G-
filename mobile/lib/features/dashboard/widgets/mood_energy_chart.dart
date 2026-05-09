import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';

class MoodEnergyChart extends StatelessWidget {
  const MoodEnergyChart({
    super.key,
    required this.moodValues,
    required this.energyValues,
    required this.dayLabels,
  });

  final List<double> moodValues;
  final List<double> energyValues;
  final List<String> dayLabels;

  @override
  Widget build(BuildContext context) {
    if (moodValues.isEmpty && energyValues.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            const Icon(Icons.edit_calendar_outlined, size: 48, color: Colors.grey),
            const SizedBox(height: 8),
            const Text('No check-in data for the past 7 days', style: TextStyle(fontSize: 16)),
            const SizedBox(height: 6),
            const Text('Complete your daily check-ins to track your mood and energy trends', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: () => Navigator.of(context).pushNamed('/esm'), child: const Text('Check In Now')),
          ],
        ),
      );
    }

    final double avgMood = moodValues.isNotEmpty ? moodValues.reduce((a,b) => a+b)/moodValues.length : 0.0;
    final double avgEnergy = energyValues.isNotEmpty ? energyValues.reduce((a,b) => a+b)/energyValues.length : 0.0;

    return SizedBox(
      height: 300,
      child: LineChart(
        LineChartData(
          minY: 0,
          maxY: 10,
          gridData: const FlGridData(show: true),
          borderData: FlBorderData(show: false),
          titlesData: FlTitlesData(
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 32,
                getTitlesWidget: (double value, TitleMeta meta) => Text(
                  value.toInt().toString(),
                  style: const TextStyle(fontSize: 12),
                ),
                interval: 2,
              ),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (double value, TitleMeta meta) {
                  final int i = value.toInt();
                  if (i < 0 || i >= dayLabels.length) {
                    return const SizedBox.shrink();
                  }
                  return Text(
                    dayLabels[i],
                    style: const TextStyle(fontSize: 11),
                  );
                },
              ),
            ),
          ),
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipItems: (List<LineBarSpot> touchedSpots) {
                return touchedSpots
                    .map(
                      (LineBarSpot spot) => LineTooltipItem(
                        spot.barIndex == 0 ? 'Mood: ' : 'Energy: ',
                        const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                        children: <TextSpan>[
                          TextSpan(
                            text: spot.y.toStringAsFixed(1),
                            style: const TextStyle(color: Colors.white),
                          ),
                        ],
                      ),
                    )
                    .toList();
              },
            ),
          ),
          extraLinesData: ExtraLinesData(horizontalLines: [
            HorizontalLine(y: avgMood, color: AppColors.primaryRed.withOpacity(0.6), strokeWidth: 1, dashArray: [6,4]),
            HorizontalLine(y: avgEnergy, color: const Color(0xFF0288D1).withOpacity(0.6), strokeWidth: 1, dashArray: [6,4]),
          ]),

          lineBarsData: <LineChartBarData>[
            LineChartBarData(
              isCurved: true,
              barWidth: 3,
              color: AppColors.primaryRed,
              spots: List<FlSpot>.generate(moodValues.length, (int i) => FlSpot(i.toDouble(), moodValues[i])),
              dotData: const FlDotData(show: true),
            ),
            LineChartBarData(
              isCurved: true,
              barWidth: 3,
              color: const Color(0xFF0288D1),
              spots: List<FlSpot>.generate(
                energyValues.length,
                (int i) => FlSpot(i.toDouble(), energyValues[i]),
              ),
              dotData: const FlDotData(show: true),
            ),
            // baseline placeholder (if moodValues present): removed duplicate and rely on extraLinesData
          ],
        ),
      ),
    );
  }
}
