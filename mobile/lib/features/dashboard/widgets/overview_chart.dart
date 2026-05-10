import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

class OverviewChart extends StatelessWidget {
  const OverviewChart({super.key, required this.data, required this.description});

  final Map<String, dynamic> data;
  final String description;

  double _normalize(double value, double max) => ((value / max) * 100).clamp(0, 100);

  Color _severityColor(String? sev) {
    switch (sev) {
      case 'Normal':
        return const Color(0xFF4CAF50);
      case 'Mild':
        return const Color(0xFFFFC107);
      case 'Moderate':
        return const Color(0xFFFF9800);
      case 'Severe':
        return const Color(0xFFF44336);
      case 'Extremely Severe':
        return const Color(0xFFB71C1C);
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool hasAnyScores =
        data['dass21']?['depression'] != null ||
        data['dass21']?['anxiety'] != null ||
        data['dass21']?['stress'] != null ||
        data['phq9']?['totalScore'] != null ||
        data['gad7']?['totalScore'] != null;
    final bool hasData = data.isNotEmpty && (data['hasData'] == true || data['latest'] != null || hasAnyScores);

    if (!hasData) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          const Icon(Icons.assignment_outlined, size: 48, color: Colors.grey),
          const SizedBox(height: 8),
          const Text('No assessments completed yet', style: TextStyle(fontSize: 16)),
          const SizedBox(height: 6),
          const Text('Take DASS-21, PHQ-9, and GAD-7 to see your wellness overview', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
          const SizedBox(height: 12),
          ElevatedButton(onPressed: () => Navigator.of(context).pushNamed('/dass21'), child: const Text('Start Assessment')),
        ],
      );
    }

    // Build values: depression, anxiety, stress, phq9, gad7
    final double dep = (data['dass21']?['depression']?['scaled'] ?? 0).toDouble();
    final double anx = (data['dass21']?['anxiety']?['scaled'] ?? 0).toDouble();
    final double str = (data['dass21']?['stress']?['scaled'] ?? 0).toDouble();
    final double phq = (data['phq9']?['totalScore'] ?? 0).toDouble();
    final double gad = (data['gad7']?['totalScore'] ?? 0).toDouble();

    // Normalize to percentage: DASS scaled max 42, PHQ max 27, GAD max 21
    final List<double> values = [
      _normalize(dep, 42),
      _normalize(anx, 42),
      _normalize(str, 42),
      _normalize(phq, 27),
      _normalize(gad, 21),
    ];

    final labels = ['Depression', 'Anxiety', 'Stress', 'PHQ-9', 'GAD-7'];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: <Widget>[
        SizedBox(
          height: 260,
          child: BarChart(
            BarChartData(
              alignment: BarChartAlignment.spaceAround,
              maxY: 100,
              titlesData: FlTitlesData(
                leftTitles: AxisTitles(sideTitles: SideTitles(showTitles: true)),
                bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, meta) {
                  final i = v.toInt();
                  if (i < 0 || i >= labels.length) return const SizedBox.shrink();
                  return Text(labels[i], style: const TextStyle(fontSize: 12));
                })),
              ),
              barGroups: List.generate(values.length, (i) {
                final pct = values[i];
                Color color = Colors.grey;
                // Choose color from severity where possible
                String? sev;
                if (i <= 2) {
                  sev = data['dass21']?['depression']?['severity'];
                } else if (i == 3) {
                  sev = data['phq9']?['severity'];
                } else {
                  sev = data['gad7']?['severity'];
                }
                color = _severityColor(sev);
                return BarChartGroupData(x: i, barRods: [BarChartRodData(toY: pct, color: color, width: 18)]);
              }),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
            const Icon(Icons.info_outline, color: Colors.black54),
            const SizedBox(width: 8),
            Expanded(child: Text(description, style: const TextStyle(fontStyle: FontStyle.italic, color: Colors.black87))),
          ]),
        ),
      ],
    );
  }
}
