import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../../core/constants/app_colors.dart';

class Dass21Chart extends StatelessWidget {
  const Dass21Chart({super.key, required this.history, required this.description});

  final List<dynamic> history;
  final String description;

  @override
  Widget build(BuildContext context) {
    if (history.isEmpty) {
      return Column(mainAxisSize: MainAxisSize.min, children: <Widget>[
        const Icon(Icons.psychology_outlined, size: 48, color: Colors.grey),
        const SizedBox(height: 8),
        const Text('No DASS-21 data yet', style: TextStyle(fontSize: 16)),
        const SizedBox(height: 8),
        ElevatedButton(onPressed: () => Navigator.of(context).pushNamed('/dass21'), child: const Text('Take DASS-21')),
      ]);
    }

    final spotsDep = <FlSpot>[];
    final spotsAnx = <FlSpot>[];
    final spotsStr = <FlSpot>[];
    final labels = <String>[];

    for (var i = 0; i < history.length; i++) {
      final e = history[i];
      final d = (e['depression']?['scaled'] ?? 0).toDouble();
      final a = (e['anxiety']?['scaled'] ?? 0).toDouble();
      final s = (e['stress']?['scaled'] ?? 0).toDouble();
      spotsDep.add(FlSpot(i.toDouble(), d));
      spotsAnx.add(FlSpot(i.toDouble(), a));
      spotsStr.add(FlSpot(i.toDouble(), s));
      labels.add(e['date']?.toString() ?? '');
    }

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: <Widget>[
      SizedBox(
        height: 260,
        child: LineChart(LineChartData(
          minY: 0,
          maxY: 42,
          titlesData: FlTitlesData(bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: true, getTitlesWidget: (v, meta) {
            final i = v.toInt();
            if (i < 0 || i >= labels.length) return const SizedBox.shrink();
            return Text(labels[i], style: const TextStyle(fontSize: 10));
          }))),
          lineBarsData: <LineChartBarData>[
            LineChartBarData(isCurved: true, color: AppColors.primaryRed, spots: spotsDep, barWidth: 3),
            LineChartBarData(isCurved: true, color: const Color(0xFFFF9800), spots: spotsAnx, barWidth: 3),
            LineChartBarData(isCurved: true, color: const Color(0xFF0288D1), spots: spotsStr, barWidth: 3),
          ],
        )),
      ),
      const SizedBox(height: 8),
      Wrap(spacing: 8, children: <Widget>[
        _SeverityBadge(label: 'Depression', severity: history.last['depression']?['severity'] ?? 'N/A', color: AppColors.primaryRed),
        _SeverityBadge(label: 'Anxiety', severity: history.last['anxiety']?['severity'] ?? 'N/A', color: const Color(0xFFFF9800)),
        _SeverityBadge(label: 'Stress', severity: history.last['stress']?['severity'] ?? 'N/A', color: const Color(0xFF0288D1)),
      ]),
      const SizedBox(height: 8),
      Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)), child: Text(description)),
    ]);
  }
}

class _SeverityBadge extends StatelessWidget {
  const _SeverityBadge({required this.label, required this.severity, required this.color});
  final String label;
  final String severity;
  final Color color;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 10),
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(6)),
      child: Row(children: <Widget>[
        Text('$label: ', style: TextStyle(color: color, fontWeight: FontWeight.w700)),
        Text(severity, style: TextStyle(color: color))
      ]),
    );
  }
}
