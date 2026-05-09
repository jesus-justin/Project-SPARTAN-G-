import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class Phq9Chart extends StatelessWidget {
  const Phq9Chart({super.key, required this.history, required this.description});

  final List<dynamic> history;
  final String description;

  Color _severityColor(int score) {
    if (score >= 20) return const Color(0xFFB71C1C);
    if (score >= 15) return const Color(0xFFF44336);
    if (score >= 10) return const Color(0xFFFF9800);
    if (score >= 5) return const Color(0xFFFFC107);
    return const Color(0xFF4CAF50);
  }

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty) {
      return Column(mainAxisSize: MainAxisSize.min, children: <Widget>[
        const Icon(Icons.mood_bad_outlined, size: 48, color: Colors.grey),
        const SizedBox(height: 8),
        const Text('No PHQ-9 data yet', style: TextStyle(fontSize: 16)),
        const SizedBox(height: 8),
        ElevatedButton(onPressed: () => Navigator.of(context).pushNamed('/phq9'), child: const Text('Take PHQ-9')),
      ]);
    }

    final labels = <String>[];
    final bars = <BarChartGroupData>[];
    for (var i = 0; i < history.length; i++) {
      final e = history[i];
      final int score = (e['totalScore'] ?? 0).toInt();
      labels.add(e['date']?.toString() ?? '');
      bars.add(BarChartGroupData(x: i, barRods: [BarChartRodData(toY: score.toDouble(), color: _severityColor(score), width: 18)]));
    }

    final latestScore = (history.last['totalScore'] ?? 0).toInt();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        SizedBox(
          height: 220,
          child: BarChart(
            BarChartData(
              maxY: 27,
              barGroups: bars,
              titlesData: FlTitlesData(
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    getTitlesWidget: (v, meta) {
                      final i = v.toInt();
                      if (i < 0 || i >= labels.length) return const SizedBox.shrink();
                      return Text(labels[i], style: const TextStyle(fontSize: 10));
                    },
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        LinearProgressIndicator(value: latestScore / 27.0, color: _severityColor(latestScore), backgroundColor: Colors.grey.shade200, minHeight: 10),
        const SizedBox(height: 8),
        Row(children: <Widget>[Text('$latestScore / 27', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)), const SizedBox(width: 12), Chip(label: Text(history.last['severity'] ?? 'N/A'))]),
        const SizedBox(height: 8),
        Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)), child: Text(description)),
      ],
    );
  }
}
