import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/providers/auth_provider.dart';
import '../../../core/services/api_service.dart';
import '../../../core/services/storage_service.dart';
import '../widgets/crisis_hotline_sheet.dart';
import '../widgets/mood_energy_chart.dart';
import '../widgets/risk_badge_widget.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  List<double> _last7Mood = <double>[3.5, 2.8, 3.1, 2.5, 2.2, 2.7, 3.0];
  List<double> _last7Energy = <double>[3.8, 3.2, 2.9, 2.4, 2.0, 2.6, 2.9];
  List<String> _dayLabels = <String>['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  String _riskLevel = 'Unknown';
  Map<String, dynamic>? _latestScores;
  List<dynamic> _riskHistory = <dynamic>[];
  bool _hasShownCrisisSheet = false;

  @override
  void initState() {
    super.initState();
    _loadDashboard();
  }

  Future<void> _loadDashboard() async {
    try {
      final ApiService api = ApiService();
      final dynamic resp = await api.get('/student/dashboard');
      if (resp is Map<String, dynamic> && resp['data'] != null) {
        final data = resp['data'];
        final student = data['student'] ?? {};
        final String name = (student['name'] ?? '').toString();
        final String risk = data['currentRisk']?.toString() ?? 'Unknown';
        final List<dynamic> esm = (data['esmData'] != null && data['esmData']['last7Days'] is List) ? List<dynamic>.from(data['esmData']['last7Days']) : [];
        final latestScores = data['latestScores'];
        final List<dynamic> riskHistory = data['riskHistory'] is List ? List<dynamic>.from(data['riskHistory']) : [];

        setState(() {
          _riskLevel = risk;
          _latestScores = latestScores;
          _riskHistory = riskHistory;
          if (esm.isNotEmpty) {
            _last7Mood = esm.map<double>((e) => (e['mood'] as num).toDouble()).toList();
            _last7Energy = esm.map<double>((e) => (e['energy'] as num).toDouble()).toList();
            _dayLabels = esm.map<String>((e) {
              try {
                final d = DateTime.parse(e['date'].toString());
                return _formatDayLabel(d);
              } catch (_) {
                return e['date']?.toString() ?? '';
              }
            }).toList();
            // ensure max 7 points
            if (_last7Mood.length > 7) {
              _last7Mood = _last7Mood.sublist(_last7Mood.length - 7);
            }
            if (_last7Energy.length > 7) {
              _last7Energy = _last7Energy.sublist(_last7Energy.length - 7);
            }
            if (_dayLabels.length > 7) {
              _dayLabels = _dayLabels.sublist(_dayLabels.length - 7);
            }
          }
        });

        // update provider student name
        if (name.isNotEmpty) {
          await StorageService.setString('student_name', name);
          if (!mounted) return;
          try {
            await context.read<AuthProvider>().initialize();
          } catch (_) {}
        }

        if (_riskLevel == 'Crisis' && !_hasShownCrisisSheet) {
          _hasShownCrisisSheet = true;
          WidgetsBinding.instance.addPostFrameCallback((_) {
            CrisisHotlineSheet.show(context);
          });
        }
      }
    } catch (_) {
      // ignore
    }
  }

  String _formatDayLabel(DateTime d) {
    const List<String> names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return names[d.weekday % 7];
  }

  double _computeAvg(List<double> values) {
    if (values.isEmpty) return 0.0;
    final double sum = values.reduce((a, b) => a + b);
    return sum / values.length;
  }

  String _computeRiskDirection() {
    if (_riskHistory.isEmpty) return 'Stable';
    if (_riskHistory.length < 2) return 'Stable';
    final String current = _riskHistory.isNotEmpty ? _riskHistory[0]['riskLevel'] : _riskLevel;
    final String previous = _riskHistory.length > 1 ? _riskHistory[1]['riskLevel'] : current;
    const order = ['Unknown', 'Low', 'Moderate', 'High', 'Crisis'];
    final int ci = order.indexOf(current);
    final int pi = order.indexOf(previous);
    if (ci > pi) return 'Worsening';
    if (ci < pi) return 'Improving';
    return 'Stable';
  }

  @override
  Widget build(BuildContext context) {
    final AuthProvider auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dashboard'),
        actions: <Widget>[
          IconButton(
            tooltip: 'Logout',
            onPressed: () async {
              await context.read<AuthProvider>().logout();
              if (!context.mounted) {
                return;
              }
              context.go('/login');
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Welcome, ${auth.studentName}',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            const Text(
              'Current Risk Level',
              style: TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 8),
            RiskBadgeWidget(riskLevel: _riskLevel),
            if (_riskLevel == 'Unknown' || _riskLevel.isEmpty) ...<Widget>[
              const SizedBox(height: 8),
              const Text(
                'Complete your assessments to see your risk level',
                style: TextStyle(
                  color: Colors.grey,
                  fontStyle: FontStyle.italic,
                ),
              ),
            ],
            const SizedBox(height: 20),
            Card(
              color: Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    const Text(
                      'Last 7 Days Mood and Energy',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: const <Widget>[
                        _LegendDot(color: AppColors.primaryRed, label: 'Mood'),
                        SizedBox(width: 12),
                        _LegendDot(color: Color(0xFF0288D1), label: 'Energy'),
                      ],
                    ),
                    const SizedBox(height: 12),
                    MoodEnergyChart(
                      moodValues: _last7Mood,
                      energyValues: _last7Energy,
                      dayLabels: _dayLabels,
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 12),
            // Summary cards row
            if (_last7Mood.isNotEmpty) Padding(
              padding: const EdgeInsets.symmetric(vertical: 8.0),
              child: Row(
                children: <Widget>[
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            const Text('7-Day Average', style: TextStyle(fontWeight: FontWeight.w700)),
                            const SizedBox(height: 6),
                            Text('Mood: ${_computeAvg(_last7Mood).toStringAsFixed(1)}'),
                            Text('Energy: ${_computeAvg(_last7Energy).toStringAsFixed(1)}'),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            const Text('Latest Scores', style: TextStyle(fontWeight: FontWeight.w700)),
                            const SizedBox(height: 6),
                            Text('DASS-21: ${_latestScores?['dass21'] != null ? _latestScores!['dass21']['depression']['severity'] : 'N/A'}'),
                            Text('PHQ-9: ${_latestScores?['phq9'] != null ? '${_latestScores!['phq9']['totalScore']}/27 (${_latestScores!['phq9']['severity']})' : 'N/A'}'),
                            Text('GAD-7: ${_latestScores?['gad7'] != null ? '${_latestScores!['gad7']['totalScore']}/21 (${_latestScores!['gad7']['severity']})' : 'N/A'}'),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: <Widget>[
                            const Text('Risk Trend', style: TextStyle(fontWeight: FontWeight.w700)),
                            const SizedBox(height: 6),
                            Text('Current: $_riskLevel'),
                            Text('Previous: ${_riskHistory.isNotEmpty && _riskHistory.length>1 ? _riskHistory[1]['riskLevel'] : 'N/A'}'),
                            Text('Direction: ${_computeRiskDirection()}'),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ) else Padding(
              padding: const EdgeInsets.symmetric(vertical: 12.0),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Center(
                    child: Text(
                      'No check-in data yet. Complete your daily check-ins.',
                      style: TextStyle(color: Colors.grey[700]),
                    ),
                  ),
                ),
              ),
            ),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: AppColors.primaryRed,
                  foregroundColor: Colors.white,
                ),
                onPressed: () => context.go('/dass21'),
                child: const Text('Take DASS-21'),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1565C0),
                  minimumSize: const Size(double.infinity, 50),
                ),
                onPressed: () => context.go('/phq9'),
                child: const Text(
                  'Take PHQ-9',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6A1B9A),
                  minimumSize: const Size(double.infinity, 50),
                ),
                onPressed: () => context.go('/gad7'),
                child: const Text(
                  'Take GAD-7',
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => context.go('/esm'),
                child: const Text('Daily Check-in'),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
                onPressed: () => context.go('/ginhawa'),
                child: const Text('Wellness Resources'),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => context.go('/ginhawa/safety-plan'),
                child: const Text('My Safety Plan'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  const _LegendDot({required this.color, required this.label});

  final Color color;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: <Widget>[
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 4),
        Text(label),
      ],
    );
  }
}
