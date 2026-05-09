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
    return SizedBox(
      height: 250,
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
          lineBarsData: <LineChartBarData>[
            LineChartBarData(
              isCurved: true,
              barWidth: 3,
              color: AppColors.primaryRed,
              spots: List<FlSpot>.generate(
                moodValues.length,
                (int i) => FlSpot(i.toDouble(), moodValues[i]),
              ),
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
            // baseline placeholder (if moodValues present)
            if (moodValues.isNotEmpty) LineChartBarData(
              isCurved: false,
              barWidth: 1,
              color: Colors.grey.withOpacity(0.9),
              dashArray: [5, 5],
              spots: [
                FlSpot(0, moodValues.reduce((a, b) => a + b) / moodValues.length),
                FlSpot((moodValues.length - 1).toDouble(), moodValues.reduce((a, b) => a + b) / moodValues.length),
              ],
              dotData: const FlDotData(show: false),
            ),
          ],
        ),
      ),
    );
  }
}
