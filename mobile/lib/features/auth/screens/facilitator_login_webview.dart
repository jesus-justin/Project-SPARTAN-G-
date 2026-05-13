import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:webview_flutter/webview_flutter.dart';

import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../core/services/storage_service.dart';

class FacilitatorLoginWebView extends StatefulWidget {
  const FacilitatorLoginWebView({super.key});

  @override
  State<FacilitatorLoginWebView> createState() => _FacilitatorLoginWebViewState();
}

class _FacilitatorLoginWebViewState extends State<FacilitatorLoginWebView> {
  late final WebViewController _webViewController;
  late final List<String> _portalCandidates;
  int _candidateIndex = 0;
  bool _isLoading = true;
  String _pageTitle = 'Facilitator Login';

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    _portalCandidates = AppStrings.ogcPortalCandidateUrls
        .map((String baseUrl) => '$baseUrl/#/login')
        .toList(growable: false);

    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageStarted: (String url) {
            setState(() {
              _isLoading = true;
            });
            _checkLoginSuccess(url);
          },
          onPageFinished: (String url) {
            setState(() {
              _isLoading = false;
            });
            _checkLoginSuccess(url);
          },
          onWebResourceError: (WebResourceError error) {
            if (_candidateIndex < _portalCandidates.length - 1) {
              _candidateIndex += 1;
              _webViewController.loadRequest(Uri.parse(_portalCandidates[_candidateIndex]));
              return;
            }

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Error loading facilitator portal: ${error.description}'),
              ),
            );
          },
          onNavigationRequest: (NavigationRequest request) {
            // Allow navigation
            return NavigationDecision.navigate;
          },
        ),
      )
        ..loadRequest(Uri.parse(_portalCandidates.first));
  }

  /// Check if login was successful by inspecting the URL
  /// If redirected to dashboard or token is present in URL, consider it a success
  Future<void> _checkLoginSuccess(String url) async {
    try {
      // Check if redirected to dashboard (successful login)
      if (url.contains('/#/dashboard') || url.contains('%23/dashboard')) {
        // Update page title
        setState(() {
          _pageTitle = 'Login Successful';
        });

        // Small delay to ensure page is rendered
        await Future.delayed(const Duration(milliseconds: 500));

        // Try to extract token from local storage using JavaScript
        final dynamic tokenResult = await _webViewController.runJavaScriptReturningResult(
          '''
          (function() {
            try {
              const token = localStorage.getItem('ogc_token');
              return token || 'no_token';
            } catch(e) {
              return 'error: ' + e.message;
            }
          })();
          '''
        );

        String? token;
        if (tokenResult is String) {
          if (!tokenResult.contains('error') && tokenResult != 'no_token') {
            token = tokenResult;
          }
        }

        // Extract facilitator info if available
        final dynamic facilitatorResult = await _webViewController.runJavaScriptReturningResult(
          '''
          (function() {
            try {
              const facilitatorData = localStorage.getItem('facilitator_info');
              return facilitatorData || 'no_info';
            } catch(e) {
              return 'error: ' + e.message;
            }
          })();
          '''
        );

        String? facilitatorInfo;
        if (facilitatorResult is String && !facilitatorResult.contains('error') && facilitatorResult != 'no_info') {
          facilitatorInfo = facilitatorResult;
        }

        if (!mounted) return;
        final ScaffoldMessengerState messenger = ScaffoldMessenger.of(context);
        final GoRouter router = GoRouter.of(context);

        // Store token and facilitator info
        if (token != null) {
          await StorageService.setString('ogc_token', token);
          if (facilitatorInfo != null) {
            await StorageService.setString('facilitator_info', facilitatorInfo);
          }

          // Show success snackbar
          messenger.showSnackBar(
            const SnackBar(
              content: Text('Facilitator login successful! Returning to app...'),
              duration: Duration(seconds: 1),
            ),
          );

          // Delay and pop WebView to return to previous screen
          await Future.delayed(const Duration(seconds: 1));
          if (mounted) {
            router.pop();
          }
        } else {
          // No token found but we're at dashboard, show message and stay in WebView
          messenger.showSnackBar(
            const SnackBar(
              content: Text('Login successful. You can now use the facilitator portal.'),
            ),
          );
        }
      }
      // Check for explicit token in URL query parameters
      else if (url.contains('token=')) {
        final Uri uri = Uri.parse(url);
        final String? token = uri.queryParameters['token'];

        if (token != null && token.isNotEmpty) {
          await StorageService.setString('ogc_token', token);

          if (!mounted) return;

          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Facilitator login successful! Returning to app...'),
              duration: Duration(seconds: 1),
            ),
          );

          await Future.delayed(const Duration(seconds: 1));
          if (mounted) {
            context.pop();
          }
        }
      }
    } catch (e) {
      debugPrint('Error checking login success: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_pageTitle),
        backgroundColor: AppColors.primaryRed,
        foregroundColor: Colors.white,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            context.pop();
          },
        ),
        actions: [
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    color: Colors.white,
                  ),
                ),
              ),
            )
          else
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {
                _webViewController.reload();
              },
            ),
        ],
      ),
      body: WebViewWidget(controller: _webViewController),
    );
  }
}
